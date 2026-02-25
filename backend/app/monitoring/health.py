"""Health check endpoints with deep inspection capabilities."""

from typing import Dict, Any
from datetime import datetime
from sqlmodel import select

from ..config.settings import config
from ..db import get_session_context
from ..models.mvp import MVP
from ..logger import get_logger

logger = get_logger(__name__)


async def health_check() -> Dict[str, Any]:
    """
    Basic health check - fast response.
    
    Returns:
        Health status dictionary
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": config.APP_VERSION,
        "environment": config.ENVIRONMENT,
    }


async def deep_health_check() -> Dict[str, Any]:
    """
    Deep health check - includes database, external services, etc.
    
    Returns:
        Detailed health status dictionary
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": config.APP_VERSION,
        "environment": config.ENVIRONMENT,
        "checks": {}
    }
    
    # Database check
    try:
        with get_session_context() as session:
            # Try to query database
            statement = select(MVP).limit(1)
            session.exec(statement).first()
            
            health_status["checks"]["database"] = {
                "status": "healthy",
                "message": "Database connection successful"
            }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        health_status["status"] = "unhealthy"
        health_status["checks"]["database"] = {
            "status": "unhealthy",
            "message": f"Database connection failed: {str(e)}"
        }
    
    # Redis check (if enabled)
    if config.RATE_LIMIT_STORAGE == "redis":
        try:
            import redis.asyncio as redis
            redis_client = redis.from_url(config.REDIS_URL, socket_connect_timeout=2)
            await redis_client.ping()
            await redis_client.close()
            
            health_status["checks"]["redis"] = {
                "status": "healthy",
                "message": "Redis connection successful"
            }
        except ImportError:
            health_status["checks"]["redis"] = {
                "status": "warning",
                "message": "Redis package not installed"
            }
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            health_status["checks"]["redis"] = {
                "status": "unhealthy",
                "message": f"Redis connection failed: {str(e)}"
            }
    
    # LLM API checks (optional - can be slow)
    if config.OPENAI_API_KEY:
        health_status["checks"]["openai"] = {
            "status": "configured",
            "message": "OpenAI API key configured"
        }
    else:
        health_status["checks"]["openai"] = {
            "status": "not_configured",
            "message": "OpenAI API key not set"
        }
    
    if config.ANTHROPIC_API_KEY:
        health_status["checks"]["anthropic"] = {
            "status": "configured",
            "message": "Anthropic API key configured"
        }
    else:
        health_status["checks"]["anthropic"] = {
            "status": "not_configured",
            "message": "Anthropic API key not set"
        }
    
    # Configuration checks
    health_status["checks"]["configuration"] = {
        "status": "healthy",
        "rate_limiting_enabled": config.RATE_LIMIT_ENABLED,
        "metrics_enabled": config.METRICS_ENABLED,
        "max_concurrent_pipelines": config.MAX_CONCURRENT_PIPELINES_GLOBAL,
    }
    
    return health_status


async def readiness_check() -> Dict[str, Any]:
    """
    Readiness check - indicates if service is ready to accept traffic.
    
    Returns:
        Readiness status dictionary
    """
    try:
        # Check database connection
        with get_session_context() as session:
            statement = select(MVP).limit(1)
            session.exec(statement).first()
        
        return {
            "status": "ready",
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        return {
            "status": "not_ready",
            "timestamp": datetime.utcnow().isoformat(),
            "reason": str(e)
        }


async def liveness_check() -> Dict[str, Any]:
    """
    Liveness check - indicates if service is alive (for Kubernetes).
    
    Returns:
        Liveness status dictionary
    """
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat(),
    }
