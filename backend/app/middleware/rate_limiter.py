"""Production-grade rate limiting middleware with Redis support."""

import time
from typing import Dict, Optional, Callable
from collections import defaultdict
from datetime import datetime, timedelta
from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
import asyncio

from ..config.settings import config
from ..logger import get_logger

logger = get_logger(__name__)


class RateLimitExceeded(HTTPException):
    """Exception raised when rate limit is exceeded."""
    def __init__(self, limit: str, retry_after: int):
        super().__init__(
            status_code=429,
            detail=f"Rate limit exceeded: {limit}. Retry after {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)}
        )


class InMemoryRateLimiter:
    """In-memory rate limiter using sliding window algorithm."""
    
    def __init__(self):
        self.requests: Dict[str, list] = defaultdict(list)
        self.lock = asyncio.Lock()
    
    async def is_allowed(self, key: str, limit: int, window: int) -> tuple[bool, int]:
        """
        Check if request is allowed under rate limit.
        
        Args:
            key: Unique identifier (user_id, IP, etc.)
            limit: Maximum requests allowed
            window: Time window in seconds
        
        Returns:
            (is_allowed, retry_after_seconds)
        """
        async with self.lock:
            now = time.time()
            cutoff = now - window
            
            # Remove old requests outside the window
            self.requests[key] = [req_time for req_time in self.requests[key] if req_time > cutoff]
            
            # Check if under limit
            if len(self.requests[key]) < limit:
                self.requests[key].append(now)
                return True, 0
            
            # Calculate retry after
            oldest_request = min(self.requests[key])
            retry_after = int(oldest_request + window - now) + 1
            
            return False, retry_after
    
    async def get_usage(self, key: str, window: int) -> int:
        """Get current usage count for a key."""
        async with self.lock:
            now = time.time()
            cutoff = now - window
            self.requests[key] = [req_time for req_time in self.requests[key] if req_time > cutoff]
            return len(self.requests[key])
    
    async def reset(self, key: str) -> None:
        """Reset rate limit for a key."""
        async with self.lock:
            if key in self.requests:
                del self.requests[key]


class RedisRateLimiter:
    """Redis-based rate limiter for distributed systems."""
    
    def __init__(self):
        self.redis_client = None
        self._initialize_redis()
    
    def _initialize_redis(self):
        """Initialize Redis connection."""
        try:
            import redis.asyncio as redis
            self.redis_client = redis.from_url(
                config.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
            logger.info("Redis rate limiter initialized")
        except ImportError:
            logger.warning("redis package not installed, falling back to in-memory limiter")
            self.redis_client = None
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.redis_client = None
    
    async def is_allowed(self, key: str, limit: int, window: int) -> tuple[bool, int]:
        """Check if request is allowed using Redis sliding window."""
        if not self.redis_client:
            # Fallback to in-memory
            return await InMemoryRateLimiter().is_allowed(key, limit, window)
        
        try:
            now = time.time()
            redis_key = f"rate_limit:{key}"
            
            # Use Redis sorted set for sliding window
            pipe = self.redis_client.pipeline()
            
            # Remove old entries
            pipe.zremrangebyscore(redis_key, 0, now - window)
            
            # Count current entries
            pipe.zcard(redis_key)
            
            # Add current request
            pipe.zadd(redis_key, {str(now): now})
            
            # Set expiry
            pipe.expire(redis_key, window)
            
            results = await pipe.execute()
            current_count = results[1]
            
            if current_count < limit:
                return True, 0
            
            # Get oldest request to calculate retry_after
            oldest = await self.redis_client.zrange(redis_key, 0, 0, withscores=True)
            if oldest:
                oldest_time = oldest[0][1]
                retry_after = int(oldest_time + window - now) + 1
                return False, retry_after
            
            return False, window
        
        except Exception as e:
            logger.error(f"Redis rate limit check failed: {e}")
            # Fail open - allow request if Redis is down
            return True, 0
    
    async def get_usage(self, key: str, window: int) -> int:
        """Get current usage count."""
        if not self.redis_client:
            return 0
        
        try:
            now = time.time()
            redis_key = f"rate_limit:{key}"
            await self.redis_client.zremrangebyscore(redis_key, 0, now - window)
            return await self.redis_client.zcard(redis_key)
        except Exception as e:
            logger.error(f"Failed to get usage: {e}")
            return 0
    
    async def reset(self, key: str) -> None:
        """Reset rate limit for a key."""
        if not self.redis_client:
            return
        
        try:
            redis_key = f"rate_limit:{key}"
            await self.redis_client.delete(redis_key)
        except Exception as e:
            logger.error(f"Failed to reset rate limit: {e}")


# Global rate limiter instance
_rate_limiter: Optional[InMemoryRateLimiter | RedisRateLimiter] = None


def get_rate_limiter() -> InMemoryRateLimiter | RedisRateLimiter:
    """Get or create rate limiter instance."""
    global _rate_limiter
    
    if _rate_limiter is None:
        if config.RATE_LIMIT_STORAGE == "redis":
            _rate_limiter = RedisRateLimiter()
        else:
            _rate_limiter = InMemoryRateLimiter()
    
    return _rate_limiter


def parse_rate_limit(limit_str: str) -> tuple[int, int]:
    """
    Parse rate limit string like '10/hour' or '100/minute'.
    
    Returns:
        (limit, window_seconds)
    """
    parts = limit_str.split("/")
    if len(parts) != 2:
        raise ValueError(f"Invalid rate limit format: {limit_str}")
    
    limit = int(parts[0])
    period = parts[1].lower()
    
    period_map = {
        "second": 1,
        "minute": 60,
        "hour": 3600,
        "day": 86400,
    }
    
    window = period_map.get(period)
    if window is None:
        raise ValueError(f"Invalid period: {period}")
    
    return limit, window


def get_client_identifier(request: Request) -> str:
    """
    Get unique identifier for rate limiting.
    
    Priority:
    1. User ID from auth (if authenticated)
    2. API key (if provided)
    3. IP address (fallback)
    """
    # Check for user ID in request state (set by auth middleware)
    if hasattr(request.state, "user_id"):
        return f"user:{request.state.user_id}"
    
    # Check for API key in headers
    api_key = request.headers.get("X-API-Key")
    if api_key:
        return f"apikey:{api_key[:16]}"  # Use first 16 chars
    
    # Fallback to IP address
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "unknown"
    
    return f"ip:{ip}"


async def rate_limit_middleware(request: Request, call_next: Callable) -> Response:
    """Rate limiting middleware."""
    if not config.RATE_LIMIT_ENABLED:
        return await call_next(request)
    
    # Skip rate limiting for health checks and metrics
    if request.url.path in ["/health", "/metrics", "/api/health"]:
        return await call_next(request)
    
    # Get rate limiter
    limiter = get_rate_limiter()
    
    # Get client identifier
    client_id = get_client_identifier(request)
    
    # Determine rate limit based on endpoint
    limit_str = None
    if request.url.path == "/api/mvp/start" and request.method == "POST":
        limit_str = config.MVP_CREATION_LIMIT
    elif request.url.path.startswith("/api/mvp/list"):
        limit_str = config.MVP_LIST_LIMIT
    elif request.url.path.startswith("/api/mvp/"):
        limit_str = config.MVP_GET_LIMIT
    else:
        limit_str = config.GLOBAL_API_LIMIT
    
    # Parse limit
    try:
        limit, window = parse_rate_limit(limit_str)
    except ValueError as e:
        logger.error(f"Invalid rate limit configuration: {e}")
        return await call_next(request)
    
    # Check rate limit
    is_allowed, retry_after = await limiter.is_allowed(client_id, limit, window)
    
    if not is_allowed:
        logger.warning(
            f"Rate limit exceeded for {client_id}",
            extra={
                "client_id": client_id,
                "endpoint": request.url.path,
                "limit": limit_str,
                "retry_after": retry_after,
            }
        )
        
        return JSONResponse(
            status_code=429,
            content={
                "error": {
                    "code": "RATE_LIMIT_EXCEEDED",
                    "message": f"Rate limit exceeded: {limit_str}",
                    "retry_after": retry_after,
                }
            },
            headers={
                "Retry-After": str(retry_after),
                "X-RateLimit-Limit": str(limit),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(int(time.time()) + retry_after),
            }
        )
    
    # Get current usage
    usage = await limiter.get_usage(client_id, window)
    remaining = max(0, limit - usage)
    
    # Process request
    response = await call_next(request)
    
    # Add rate limit headers
    response.headers["X-RateLimit-Limit"] = str(limit)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    response.headers["X-RateLimit-Reset"] = str(int(time.time()) + window)
    
    return response
