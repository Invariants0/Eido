import httpx
import asyncio
from typing import Dict, Any, Optional
from ..config.settings import config
from ..logger import get_logger
from tenacity import retry, stop_after_attempt, wait_exponential

logger = get_logger(__name__)

class EidoWebhookClient:
    """Client for communicating with the Dockerized Eido Master Agent."""

    def __init__(self):
        self.webhook_url = config.EIDO_WEBHOOK_URL
        self.api_key = config.EIDO_API_KEY
        self.timeout = 10.0

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True
    )
    async def _post(self, endpoint: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Base POST method with retry logic."""
        if not self.webhook_url:
            logger.warning("EIDO_WEBHOOK_URL not configured. Skipping webhook call.")
            return {"status": "skipped", "reason": "not_configured"}

        url = f"{self.webhook_url.rstrip('/')}/{endpoint.lstrip('/')}"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                logger.debug(f"Sending webhook to {url}: {payload.get('type')}")
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.error(f"Eido Webhook error {e.response.status_code}: {e.response.text}")
                raise
            except Exception as e:
                logger.error(f"Eido Webhook connection failed: {e}")
                raise

    async def send_notification(self, message: str, chat_id: Optional[str] = None):
        """Send a general notification message to Eido (Telegram)."""
        payload = {
            "type": "notification",
            "message": message,
            "chat_id": chat_id
        }
        return await self._post("/notify", payload)

    async def post_to_moltbook(self, title: str, content: str, submolt: str = "lablab"):
        """Request Eido to post on Moltbook using his credentials."""
        payload = {
            "type": "moltbook_post",
            "title": title,
            "content": content,
            "submolt": submolt
        }
        return await self._post("/moltbook", payload)

    async def report_stage_progress(self, mvp_id: int, stage: str, status: str, details: Optional[str] = None):
        """Report pipeline stage progress to Eido."""
        payload = {
            "type": "pipeline_progress",
            "mvp_id": mvp_id,
            "stage": stage,
            "status": status,
            "details": details
        }
        return await self._post("/progress", payload)

    async def request_social_engagement(self, platform: str, target_url: str, context: str):
        """Request Eido to engage on X, Reddit, or Hacker News."""
        payload = {
            "type": "social_engagement",
            "platform": platform,
            "target_url": target_url,
            "context": context
        }
        return await self._post("/engage", payload)
