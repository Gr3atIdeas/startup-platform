"""
WebSocket consumer для чата (Django Channels).
Заменяет polling (5-секундный setInterval) на push-уведомления через WebSocket.
"""
import json
import logging
from datetime import datetime

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

logger = logging.getLogger(__name__)


class ChatConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer для чат-комнат.

    Протокол:
      Клиент → Сервер:
        {"type": "chat.message", "chat_id": 123, "message_text": "..."}
        {"type": "chat.join", "chat_id": 123}
        {"type": "chat.mark_read", "chat_id": 123}

      Сервер → Клиент:
        {"type": "new_message", "message": {...}}
        {"type": "chat_list_update", "chats": [...]}
        {"type": "messages_read", "chat_id": 123, "reader_id": 456}
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None
        self.user_group = None
        self.chat_groups = set()

    async def connect(self):
        self.user = self.scope.get("user")
        if not self.user or self.user.is_anonymous:
            await self.close()
            return

        await self.accept()

        # Подключаем пользователя к его персональной группе
        self.user_group = f"user_{self.user.user_id}"
        await self.channel_layer.group_add(self.user_group, self.channel_name)

        # Подключаем ко всем чатам пользователя
        chat_ids = await self._get_user_chat_ids()
        for chat_id in chat_ids:
            group_name = f"chat_{chat_id}"
            self.chat_groups.add(group_name)
            await self.channel_layer.group_add(group_name, self.channel_name)

        logger.info(f"WebSocket connected: user={self.user.user_id}, chats={len(chat_ids)}")

    async def disconnect(self, close_code):
        # Отключаемся от всех групп
        if self.user_group:
            await self.channel_layer.group_discard(self.user_group, self.channel_name)

        for group_name in self.chat_groups:
            await self.channel_layer.group_discard(group_name, self.channel_name)

        self.chat_groups.clear()
        logger.info(f"WebSocket disconnected: user={getattr(self.user, 'user_id', '?')}, code={close_code}")

    async def receive_json(self, content, **kwargs):
        msg_type = content.get("type")

        if msg_type == "chat.message":
            await self._handle_send_message(content)
        elif msg_type == "chat.join":
            await self._handle_join_chat(content)
        elif msg_type == "chat.mark_read":
            await self._handle_mark_read(content)
        elif msg_type == "ping":
            await self.send_json({"type": "pong"})

    # ── Обработчики входящих сообщений ──────────────────────────────

    async def _handle_send_message(self, content):
        chat_id = content.get("chat_id")
        message_text = content.get("message_text", "").strip()

        if not chat_id or not message_text:
            await self.send_json({"type": "error", "message": "chat_id и message_text обязательны"})
            return

        result = await self._save_message(chat_id, message_text)
        if not result:
            await self.send_json({"type": "error", "message": "Нет доступа к чату"})
            return

        # Отправляем сообщение всем участникам чата
        await self.channel_layer.group_send(
            f"chat_{chat_id}",
            {
                "type": "chat_new_message",
                "message": result,
                "sender_id": self.user.user_id,
            },
        )

    async def _handle_join_chat(self, content):
        chat_id = content.get("chat_id")
        if not chat_id:
            return

        has_access = await self._user_has_chat_access(chat_id)
        if not has_access:
            return

        group_name = f"chat_{chat_id}"
        if group_name not in self.chat_groups:
            self.chat_groups.add(group_name)
            await self.channel_layer.group_add(group_name, self.channel_name)

    async def _handle_mark_read(self, content):
        chat_id = content.get("chat_id")
        if not chat_id:
            return

        success = await self._mark_messages_read(chat_id)
        if success:
            await self.channel_layer.group_send(
                f"chat_{chat_id}",
                {
                    "type": "chat_messages_read",
                    "chat_id": chat_id,
                    "reader_id": self.user.user_id,
                },
            )

    # ── Обработчики group_send (исходящие в WebSocket) ──────────────

    async def chat_new_message(self, event):
        """Пересылает новое сообщение клиенту."""
        message = event["message"]
        is_own = event["sender_id"] == self.user.user_id
        message["is_own"] = is_own
        await self.send_json({"type": "new_message", "message": message})

    async def chat_messages_read(self, event):
        """Уведомляет клиента о прочтении сообщений."""
        await self.send_json({
            "type": "messages_read",
            "chat_id": event["chat_id"],
            "reader_id": event["reader_id"],
        })

    async def chat_list_update(self, event):
        """Уведомляет клиента об обновлении списка чатов."""
        await self.send_json({
            "type": "chat_list_update",
            "chat_id": event.get("chat_id"),
            "action": event.get("action", "update"),
        })

    # ── Async database helpers ──────────────────────────────────────

    @database_sync_to_async
    def _get_user_chat_ids(self):
        from accounts.models import ChatParticipants

        return list(
            ChatParticipants.objects.filter(user=self.user)
            .values_list("conversation_id", flat=True)
        )

    @database_sync_to_async
    def _user_has_chat_access(self, chat_id):
        from accounts.models import ChatParticipants

        return ChatParticipants.objects.filter(
            user=self.user, conversation_id=chat_id
        ).exists()

    @database_sync_to_async
    def _save_message(self, chat_id, message_text):
        from django.utils import timezone
        from accounts.models import ChatConversations, Messages, MessageStatuses

        try:
            chat = ChatConversations.objects.get(conversation_id=chat_id)
        except ChatConversations.DoesNotExist:
            return None

        if not chat.chatparticipants_set.filter(user=self.user).exists():
            return None

        sent_status = MessageStatuses.objects.get(status_name="sent")
        now = timezone.now()

        message = Messages.objects.create(
            conversation=chat,
            sender=self.user,
            message_text=message_text,
            status=sent_status,
            created_at=now,
            updated_at=now,
        )

        chat.updated_at = now
        chat.save(update_fields=["updated_at"])

        return {
            "message_id": message.message_id,
            "sender_id": self.user.user_id,
            "sender_name": f"{self.user.first_name} {self.user.last_name}",
            "message_text": message.message_text,
            "created_at": message.created_at.strftime("%d.%m.%Y %H:%M"),
            "created_at_iso": message.created_at.isoformat(),
            "is_read": False,
        }

    @database_sync_to_async
    def _mark_messages_read(self, chat_id):
        from django.utils import timezone
        from accounts.models import ChatConversations, MessageStatuses

        try:
            chat = ChatConversations.objects.get(conversation_id=chat_id)
        except ChatConversations.DoesNotExist:
            return False

        if not chat.chatparticipants_set.filter(user=self.user).exists():
            return False

        read_status = MessageStatuses.objects.get(status_name="read")
        chat.messages_set.filter(status__status_name="sent").exclude(
            sender=self.user
        ).update(status=read_status, updated_at=timezone.now())
        return True
