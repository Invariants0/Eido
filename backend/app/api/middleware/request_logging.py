import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from ...logger import access_logger

# We use the centralized access_logger for request tracing
logger = access_logger

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log request duration and status.
    Uses high-resolution timers for maximum precision.
    """
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.perf_counter()
        
        # Process the request
        try:
            response = await call_next(request)
        except Exception as e:
            duration = (time.perf_counter() - start_time) * 1000
            logger.error(f"{request.method} {request.url.path} - FAILED ({duration:.2f}ms) | Error: {str(e)}")
            raise e
        
        duration = (time.perf_counter() - start_time) * 1000
        method = request.method
        path = request.url.path
        status = response.status_code

        # Define high-contrast colors for methods (distinct from system levels)
        method_colors = {
            "GET": "blue",
            "POST": "cyan",
            "PUT": "yellow",
            "DELETE": "red",
            "PATCH": "magenta"
        }
        m_color = method_colors.get(method, "white")

        # Define colors for status codes
        if status >= 500: s_color = "red"
        elif status >= 400: s_color = "yellow"
        elif status >= 300: s_color = "cyan"
        else: s_color = "blue"

        # Construct a rich markup message
        # Aligned Format: "METHOD PATH STATUS (TIME)"
        log_msg = (
            f"<{m_color}><bold>{method: <7}</bold></{m_color}> "
            f"<white>{path: <25}</white> "
            f"<{s_color}>{status}</{s_color}> "
            f"(<bold>{duration:.2f}ms</bold>)"
        )
        
        # Log with the custom colorized message (enabled via .opt(colors=True))
        if duration > 500:
            logger.opt(colors=True).warning(f"{log_msg} | <yellow><bold>SLOW REQUEST</bold></yellow>")
        else:
            logger.opt(colors=True).info(log_msg)
            
        return response
