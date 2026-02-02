"""
WebSocket URL routing для Django Channels.
"""
from django.urls import path

from accounts.consumers import ChatConsumer

websocket_urlpatterns = [
    path("ws/chat/", ChatConsumer.as_asgi()),
]
