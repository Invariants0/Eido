"""Alerting system for critical events and threshold violations."""

import asyncio
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import json

from ..config.settings import config
from ..logger import get_logger

logger = get_logger(__name__)


class AlertManager:
    """Manages alerts and notifications."""
    
    def __init__(self):
        self.alert_history: Dict[str, datetime] = {}
        self.cooldown_period = timedelta(minutes=15)  # Prevent alert spam
    
    def _should_send_alert(self, alert_key: str) -> bool:
        """Check if alert should be sent (respects cooldown)."""
        last_sent = self.alert_history.get(alert_key)
        
        if last_sent is None:
            return True
        
        if datetime.utcnow() - last_sent > self.cooldown_period:
            return True
        
        return False
    
    async def send_alert(
        self,
        alert_type: str,
        severity: str,
        message: str,
        details: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Send alert notification.
        
        Args:
            alert_type: Type of alert (cost_threshold, error_rate, etc.)
            severity: Severity level (info, warning, critical)
            message: Alert message
            details: Additional details
        """
        alert_key = f"{alert_type}:{severity}"
        
        if not self._should_send_alert(alert_key):
            logger.debug(f"Alert {alert_key} in cooldown period, skipping")
            return
        
        # Log alert
        logger.warning(
            f"ALERT [{severity.upper()}] {alert_type}: {message}",
            extra={"alert_type": alert_type, "severity": severity, "details": details}
        )
        
        # Send to webhook if configured
        if config.ALERT_WEBHOOK_URL:
            await self._send_webhook_alert(alert_type, severity, message, details)
        
        # Update history
        self.alert_history[alert_key] = datetime.utcnow()
    
    async def _send_webhook_alert(
        self,
        alert_type: str,
        severity: str,
        message: str,
        details: Optional[Dict[str, Any]]
    ) -> None:
        """Send alert to webhook (Slack, Discord, etc.)."""
        try:
            import httpx
            
            # Format alert payload
            payload = {
                "alert_type": alert_type,
                "severity": severity,
                "message": message,
                "timestamp": datetime.utcnow().isoformat(),
                "environment": config.ENVIRONMENT,
                "details": details or {}
            }
            
            # Detect webhook type and format accordingly
            if "slack.com" in config.ALERT_WEBHOOK_URL:
                payload = self._format_slack_message(alert_type, severity, message, details)
            elif "discord.com" in config.ALERT_WEBHOOK_URL:
                payload = self._format_discord_message(alert_type, severity, message, details)
            
            # Send webhook
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    config.ALERT_WEBHOOK_URL,
                    json=payload,
                    timeout=5.0
                )
                
                if response.status_code != 200:
                    logger.error(f"Failed to send webhook alert: {response.status_code}")
        
        except ImportError:
            logger.warning("httpx not installed, cannot send webhook alerts")
        except Exception as e:
            logger.error(f"Failed to send webhook alert: {e}")
    
    def _format_slack_message(
        self,
        alert_type: str,
        severity: str,
        message: str,
        details: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Format alert for Slack."""
        color_map = {
            "info": "#36a64f",
            "warning": "#ff9900",
            "critical": "#ff0000"
        }
        
        return {
            "attachments": [{
                "color": color_map.get(severity, "#808080"),
                "title": f"🚨 EIDO Alert: {alert_type}",
                "text": message,
                "fields": [
                    {"title": "Severity", "value": severity.upper(), "short": True},
                    {"title": "Environment", "value": config.ENVIRONMENT, "short": True},
                    {"title": "Timestamp", "value": datetime.utcnow().isoformat(), "short": False},
                ] + ([
                    {"title": key, "value": str(value), "short": True}
                    for key, value in (details or {}).items()
                ]),
                "footer": "EIDO Monitoring",
            }]
        }
    
    def _format_discord_message(
        self,
        alert_type: str,
        severity: str,
        message: str,
        details: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Format alert for Discord."""
        color_map = {
            "info": 3066993,    # Green
            "warning": 16776960,  # Yellow
            "critical": 16711680  # Red
        }
        
        fields = [
            {"name": "Severity", "value": severity.upper(), "inline": True},
            {"name": "Environment", "value": config.ENVIRONMENT, "inline": True},
        ]
        
        if details:
            for key, value in details.items():
                fields.append({"name": key, "value": str(value), "inline": True})
        
        return {
            "embeds": [{
                "title": f"🚨 EIDO Alert: {alert_type}",
                "description": message,
                "color": color_map.get(severity, 8421504),
                "fields": fields,
                "timestamp": datetime.utcnow().isoformat(),
                "footer": {"text": "EIDO Monitoring"}
            }]
        }


# Global alert manager instance
_alert_manager: Optional[AlertManager] = None


def get_alert_manager() -> AlertManager:
    """Get or create alert manager instance."""
    global _alert_manager
    
    if _alert_manager is None:
        _alert_manager = AlertManager()
    
    return _alert_manager


async def alert_cost_threshold_exceeded(current_cost: float, threshold: float) -> None:
    """Alert when daily cost threshold is exceeded."""
    manager = get_alert_manager()
    await manager.send_alert(
        alert_type="cost_threshold_exceeded",
        severity="warning",
        message=f"Daily cost threshold exceeded: ${current_cost:.2f} > ${threshold:.2f}",
        details={
            "current_cost": f"${current_cost:.2f}",
            "threshold": f"${threshold:.2f}",
            "percentage": f"{(current_cost / threshold * 100):.1f}%"
        }
    )


async def alert_error_rate_high(error_rate: float, threshold: float, component: str) -> None:
    """Alert when error rate is high."""
    manager = get_alert_manager()
    await manager.send_alert(
        alert_type="high_error_rate",
        severity="critical",
        message=f"High error rate in {component}: {error_rate:.1%} > {threshold:.1%}",
        details={
            "component": component,
            "error_rate": f"{error_rate:.1%}",
            "threshold": f"{threshold:.1%}"
        }
    )


async def alert_pipeline_failure_spike(failure_count: int, time_window: str) -> None:
    """Alert when pipeline failures spike."""
    manager = get_alert_manager()
    await manager.send_alert(
        alert_type="pipeline_failure_spike",
        severity="warning",
        message=f"Pipeline failure spike: {failure_count} failures in {time_window}",
        details={
            "failure_count": failure_count,
            "time_window": time_window
        }
    )


async def alert_service_unhealthy(service: str, reason: str) -> None:
    """Alert when a service becomes unhealthy."""
    manager = get_alert_manager()
    await manager.send_alert(
        alert_type="service_unhealthy",
        severity="critical",
        message=f"Service {service} is unhealthy: {reason}",
        details={
            "service": service,
            "reason": reason
        }
    )


async def alert_rate_limit_abuse(client_id: str, endpoint: str, violation_count: int) -> None:
    """Alert when rate limit abuse is detected."""
    manager = get_alert_manager()
    await manager.send_alert(
        alert_type="rate_limit_abuse",
        severity="warning",
        message=f"Rate limit abuse detected from {client_id} on {endpoint}",
        details={
            "client_id": client_id,
            "endpoint": endpoint,
            "violation_count": violation_count
        }
    )
