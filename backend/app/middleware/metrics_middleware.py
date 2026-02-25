"""HTTP metrics middleware for tracking request metrics."""

import time
from typing import Callable
from fastapi import Request, Response

from ..config.settings import config
from ..monitoring.metrics import (
    http_requests_total,
    http_request_duration,
    http_requests_in_progress,
)


def get_endpoint_path(request: Request) -> str:
    """
    Get normalized endpoint path for metrics.
    
    Replaces path parameters with placeholders to avoid high cardinality.
    Example: /api/mvp/123 -> /api/mvp/{id}
    """
    path = request.url.path
    
    # Normalize common patterns
    if path.startswith("/api/mvp/") and path.count("/") == 3:
        # /api/mvp/{id} or /api/mvp/{id}/runs
        parts = path.split("/")
        if len(parts) == 4 and parts[3].isdigit():
            return "/api/mvp/{id}"
        elif len(parts) == 5 and parts[3].isdigit():
            return f"/api/mvp/{{id}}/{parts[4]}"
    
    return path


async def metrics_middleware(request: Request, call_next: Callable) -> Response:
    """Middleware to track HTTP request metrics."""
    if not config.METRICS_ENABLED:
        return await call_next(request)
    
    # Skip metrics for metrics endpoint itself
    if request.url.path == config.METRICS_PATH:
        return await call_next(request)
    
    method = request.method
    endpoint = get_endpoint_path(request)
    
    # Track in-progress requests
    http_requests_in_progress.labels(method=method, endpoint=endpoint).inc()
    
    # Track request duration
    start_time = time.time()
    
    try:
        response = await call_next(request)
        status_code = response.status_code
    except Exception as e:
        # Track failed requests
        status_code = 500
        raise
    finally:
        # Calculate duration
        duration = time.time() - start_time
        
        # Record metrics
        http_requests_total.labels(
            method=method,
            endpoint=endpoint,
            status_code=status_code
        ).inc()
        
        http_request_duration.labels(
            method=method,
            endpoint=endpoint
        ).observe(duration)
        
        # Decrement in-progress counter
        http_requests_in_progress.labels(method=method, endpoint=endpoint).dec()
    
    return response
