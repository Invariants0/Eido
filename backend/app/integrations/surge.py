"""SURGE tokenization service integration."""

import os
import httpx
from typing import Optional, Dict, Any
from app.logger import get_logger

logger = get_logger(__name__)


class SurgeTokenManager:
    """Manages SURGE token creation and metadata on-chain."""

    def __init__(self, testnet: bool = True, api_key: Optional[str] = None):
        self.testnet = testnet or os.getenv("SURGE_TESTNET", "true").lower() == "true"
        self.api_key = api_key or os.getenv("SURGE_API_KEY")
        # Base URLs for Surge Tokenization service
        if self.testnet:
            self.base_url = "https://testnet-api.surge.wtf/v1"
        else:
            self.base_url = "https://api.surge.wtf/v1"
        self.timeout = 30.0

    async def create_token(self, mvp_id: int, name: str, symbol: str = "MVP") -> Dict[str, Any]:
        """Create a SURGE token for an MVP."""
        if not self.api_key:
            logger.warning("SURGE_API_KEY not configured, using testnet mock")
            return {
                "token_id": f"SURGE-{mvp_id:04d}",
                "contract_address": f"0x{'f' * 40}",
                "name": name,
                "symbol": symbol,
                "status": "mocked"
            }
        
        logger.info(f"Creating SURGE token: {name} ({symbol})")
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/tokens",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={
                        "name": name,
                        "symbol": symbol,
                        "metadata": {
                            "origin": "EIDO",
                            "mvp_id": mvp_id
                        }
                    }
                )
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"SURGE token creation failed: {e}")
                return {"error": str(e), "status": "failed"}

    async def set_metadata(self, token_id: str, metadata: Dict[str, Any]) -> bool:
        """Update token metadata (e.g. after deployment)."""
        if not self.api_key:
            return True
            
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.patch(
                    f"{self.base_url}/tokens/{token_id}/metadata",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json=metadata
                )
                response.raise_for_status()
                return True
            except Exception as e:
                logger.error(f"SURGE metadata update failed: {e}")
                return False

    async def publish(self, token_id: str) -> bool:
        """Publish token to public ledger/marketplace."""
        if not self.api_key:
            return True
            
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/tokens/{token_id}/publish",
                    headers={"Authorization": f"Bearer {self.api_key}"}
                )
                response.raise_for_status()
                return True
            except Exception as e:
                logger.error(f"SURGE token publish failed: {e}")
                return False
