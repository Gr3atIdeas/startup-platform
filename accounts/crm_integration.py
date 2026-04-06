"""
CRM Integration adapters for Bitrix24, AmoCRM, and generic webhooks.

Sends leads to external CRM systems when a new lead is created on the platform.
"""
import json
import logging

import requests
from django.utils import timezone

logger = logging.getLogger(__name__)


class CRMAdapter:
    """Base adapter for CRM integrations."""

    def __init__(self, integration):
        self.integration = integration
        self.timeout = 15

    def send_lead(self, lead):
        raise NotImplementedError

    def test_connection(self):
        raise NotImplementedError

    def _build_lead_payload(self, lead):
        """Build a universal lead data dict from a Lead model instance."""
        data = {
            "source": "Great Ideas",
            "source_url": f"https://www.greatideas.ru",
            "lead_id": lead.lead_id,
            "name": lead.name,
            "email": lead.email,
            "phone": lead.phone or "",
            "budget_range": lead.budget_range or "",
            "message": lead.message or "",
            "entity_type": lead.get_entity_type_display(),
            "entity_title": lead.get_entity_title(),
            "lead_type": lead.get_lead_type_display(),
            "created_at": lead.created_at.isoformat() if lead.created_at else "",
        }
        if lead.target_city:
            data["city"] = lead.target_city.name
        if lead.business_experience:
            data["business_experience"] = dict(lead.EXPERIENCE_CHOICES).get(
                lead.business_experience, lead.business_experience
            )
        if lead.timeline:
            data["timeline"] = dict(lead.TIMELINE_CHOICES).get(
                lead.timeline, lead.timeline
            )
        return data

    def _record_error(self, error_msg):
        self.integration.last_error = str(error_msg)[:1000]
        self.integration.save(update_fields=["last_error"])

    def _record_success(self):
        self.integration.last_error = ""
        self.integration.last_sync_at = timezone.now()
        self.integration.save(update_fields=["last_error", "last_sync_at"])


class WebhookAdapter(CRMAdapter):
    """Generic webhook — sends lead data as JSON POST."""

    def send_lead(self, lead):
        payload = self._build_lead_payload(lead)
        try:
            resp = requests.post(
                self.integration.webhook_url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=self.timeout,
            )
            resp.raise_for_status()
            self._record_success()
            return True
        except requests.RequestException as e:
            logger.error("Webhook send_lead failed: %s", e)
            self._record_error(e)
            return False

    def test_connection(self):
        try:
            resp = requests.post(
                self.integration.webhook_url,
                json={"test": True, "source": "Great Ideas"},
                headers={"Content-Type": "application/json"},
                timeout=self.timeout,
            )
            return resp.status_code < 500
        except requests.RequestException:
            return False


class Bitrix24Adapter(CRMAdapter):
    """Bitrix24 CRM — sends leads via incoming webhook REST API (crm.lead.add)."""

    def send_lead(self, lead):
        payload = self._build_lead_payload(lead)

        # Bitrix24 crm.lead.add field mapping
        bitrix_fields = {
            "fields": {
                "TITLE": f"[Great Ideas] {payload['entity_type']}: {payload['entity_title']}",
                "NAME": lead.name.split()[0] if lead.name else "",
                "LAST_NAME": " ".join(lead.name.split()[1:]) if lead.name else "",
                "EMAIL": [{"VALUE": lead.email, "VALUE_TYPE": "WORK"}] if lead.email else [],
                "PHONE": [{"VALUE": lead.phone, "VALUE_TYPE": "WORK"}] if lead.phone else [],
                "COMMENTS": self._build_comment(payload),
                "SOURCE_ID": "WEB",
                "SOURCE_DESCRIPTION": "Great Ideas Platform",
            }
        }

        # Bitrix24 webhook URL format: https://DOMAIN.bitrix24.ru/rest/USER_ID/WEBHOOK_KEY/
        webhook_url = self.integration.webhook_url.rstrip("/")
        url = f"{webhook_url}/crm.lead.add.json"

        try:
            resp = requests.post(url, json=bitrix_fields, timeout=self.timeout)
            resp.raise_for_status()
            result = resp.json()
            if result.get("result"):
                self._record_success()
                return True
            else:
                error_msg = result.get("error_description", "Unknown Bitrix24 error")
                self._record_error(error_msg)
                return False
        except requests.RequestException as e:
            logger.error("Bitrix24 send_lead failed: %s", e)
            self._record_error(e)
            return False

    def _build_comment(self, payload):
        parts = [
            f"Тип заявки: {payload['lead_type']}",
            f"Объект: {payload['entity_title']} ({payload['entity_type']})",
        ]
        if payload.get("budget_range"):
            parts.append(f"Бюджет: {payload['budget_range']}")
        if payload.get("city"):
            parts.append(f"Город: {payload['city']}")
        if payload.get("business_experience"):
            parts.append(f"Опыт: {payload['business_experience']}")
        if payload.get("timeline"):
            parts.append(f"Сроки: {payload['timeline']}")
        if payload.get("message"):
            parts.append(f"Сообщение: {payload['message']}")
        return "\n".join(parts)

    def test_connection(self):
        webhook_url = self.integration.webhook_url.rstrip("/")
        url = f"{webhook_url}/crm.lead.fields.json"
        try:
            resp = requests.get(url, timeout=self.timeout)
            data = resp.json()
            return "result" in data
        except (requests.RequestException, ValueError):
            return False


class AmoCRMAdapter(CRMAdapter):
    """AmoCRM — sends leads via API v4 with long-lived token."""

    def send_lead(self, lead):
        payload = self._build_lead_payload(lead)

        # AmoCRM API v4 lead creation
        amo_data = [
            {
                "name": f"[Great Ideas] {payload['entity_title']}",
                "custom_fields_values": self._build_custom_fields(payload),
                "_embedded": {
                    "contacts": [
                        {
                            "first_name": lead.name.split()[0] if lead.name else "",
                            "last_name": " ".join(lead.name.split()[1:]) if lead.name else "",
                            "custom_fields_values": [
                                {
                                    "field_code": "EMAIL",
                                    "values": [{"value": lead.email, "enum_code": "WORK"}],
                                },
                            ] + ([
                                {
                                    "field_code": "PHONE",
                                    "values": [{"value": lead.phone, "enum_code": "WORK"}],
                                }
                            ] if lead.phone else []),
                        }
                    ]
                },
            }
        ]

        subdomain = self.integration.subdomain.strip().replace(".amocrm.ru", "")
        url = f"https://{subdomain}.amocrm.ru/api/v4/leads/complex"
        headers = {
            "Authorization": f"Bearer {self.integration.api_key}",
            "Content-Type": "application/json",
        }

        try:
            resp = requests.post(url, json=amo_data, headers=headers, timeout=self.timeout)
            if resp.status_code == 401:
                self._record_error("Токен истёк или невалиден. Обновите токен в настройках.")
                return False
            resp.raise_for_status()
            self._record_success()
            return True
        except requests.RequestException as e:
            logger.error("AmoCRM send_lead failed: %s", e)
            self._record_error(e)
            return False

    def _build_custom_fields(self, payload):
        fields = []
        note_parts = [
            f"Тип: {payload['lead_type']}",
            f"Объект: {payload['entity_title']}",
        ]
        if payload.get("budget_range"):
            note_parts.append(f"Бюджет: {payload['budget_range']}")
        if payload.get("city"):
            note_parts.append(f"Город: {payload['city']}")
        if payload.get("business_experience"):
            note_parts.append(f"Опыт: {payload['business_experience']}")
        if payload.get("timeline"):
            note_parts.append(f"Сроки: {payload['timeline']}")
        if payload.get("message"):
            note_parts.append(f"Сообщение: {payload['message']}")
        # Store in a note-style text field if available
        return fields

    def test_connection(self):
        subdomain = self.integration.subdomain.strip().replace(".amocrm.ru", "")
        url = f"https://{subdomain}.amocrm.ru/api/v4/account"
        headers = {"Authorization": f"Bearer {self.integration.api_key}"}
        try:
            resp = requests.get(url, headers=headers, timeout=self.timeout)
            return resp.status_code == 200
        except requests.RequestException:
            return False


def get_adapter(integration):
    """Return the appropriate adapter for a CRM integration."""
    adapters = {
        "bitrix24": Bitrix24Adapter,
        "amocrm": AmoCRMAdapter,
        "webhook": WebhookAdapter,
    }
    adapter_class = adapters.get(integration.crm_type, WebhookAdapter)
    return adapter_class(integration)


def send_lead_to_crm(lead):
    """Send a lead to all active CRM integrations of the entity owner.

    Called asynchronously via Celery task after lead creation.
    """
    from .models import CRMIntegration

    if not lead.entity_owner:
        return

    integrations = CRMIntegration.objects.filter(
        user=lead.entity_owner, is_active=True
    )
    for integration in integrations:
        try:
            adapter = get_adapter(integration)
            adapter.send_lead(lead)
        except Exception as e:
            logger.error("CRM send failed for integration %s: %s", integration.id, e)
