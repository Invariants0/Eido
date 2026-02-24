"""Global error handler middleware with correlation ID support."""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from ...exceptions import EidoException
from ...logger import get_logger
import uuid

logger = get_logger(__name__)


async def add_correlation_id_middleware(request: Request, call_next):
    """Add correlation ID to request for tracing."""
    correlation_id = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
    request.state.correlation_id = correlation_id
    
    response = await call_next(request)
    response.headers["X-Correlation-ID"] = correlation_id
    return response


async def exception_handler(request: Request, exc: EidoException) -> JSONResponse:
    """Handle custom EIDO exceptions."""
    correlation_id = getattr(request.state, "correlation_id", "unknown")
    logger.error(
        f"[{exc.code}] {exc.message}",
        extra={"request_id": correlation_id},
        exc_info=exc
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "path": str(request.url.path),
                "correlation_id": correlation_id,
            }
        },
        headers={"X-Correlation-ID": correlation_id},
    )


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions."""
    correlation_id = getattr(request.state, "correlation_id", "unknown")
    logger.error(
        f"Unexpected error: {str(exc)}",
        extra={"request_id": correlation_id},
        exc_info=exc
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred",
                "path": str(request.url.path),
                "correlation_id": correlation_id,
            }
        },
        headers={"X-Correlation-ID": correlation_id},
    )


def register_exception_handlers(app: FastAPI):
    """Register all exception handlers with the FastAPI app."""
    app.middleware("http")(add_correlation_id_middleware)
    app.add_exception_handler(EidoException, exception_handler)
    app.add_exception_handler(Exception, global_exception_handler)
