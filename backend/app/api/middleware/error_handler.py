"""Global error handler middleware."""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from ...exceptions import EidoException
import logging

logger = logging.getLogger(__name__)


async def exception_handler(request: Request, exc: EidoException) -> JSONResponse:
    """Handle custom EIDO exceptions."""
    logger.error(f"[{exc.code}] {exc.message}", exc_info=exc)
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "path": str(request.url.path),
            }
        },
    )


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions."""
    logger.error(f"Unexpected error: {str(exc)}", exc_info=exc)
    
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred",
                "path": str(request.url.path),
            }
        },
    )


def register_exception_handlers(app: FastAPI):
    """Register all exception handlers with the FastAPI app."""
    app.add_exception_handler(EidoException, exception_handler)
    app.add_exception_handler(Exception, global_exception_handler)
