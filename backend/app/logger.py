"""Unified logging configuration using loguru for EIDO backend."""

import logging
import sys
from loguru import logger
from .config.settings import config

# Suppress litellm's internal verbose logging before anything loads
try:
    import litellm
    litellm.suppress_debug_info = True
    litellm.set_verbose = False
    litellm.json_logs = False
except ImportError:
    pass

class InterceptHandler(logging.Handler):
    """
    Intercepts standard logging messages and redirects them to Loguru.
    """
    def emit(self, record):
        # Get corresponding Loguru level if it exists
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        # Rename uvicorn loggers for better clarity
        # Uvicorn sends system status to "uvicorn.error" by default
        logger_name = record.name
        if logger_name == "uvicorn.error" and record.levelno <= logging.INFO:
            logger_name = "uvicorn.server"

        # Find caller from where originated the logged message
        frame, depth = logging.currentframe(), 2
        while frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        # Logic to skip certain noise if needed
        if "watchfiles" in logger_name and record.levelno < logging.WARNING:
            return

        logger.bind(name=logger_name).opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())

def configure_logging(log_level: str = "INFO") -> None:
    """Configure Loguru with environment-appropriate formatting."""
    
    # Remove all existing handlers (including uvicorn's defaults)
    logger.remove()
    
    # Global logger configuration (patching for 'name' support)
    logger.configure(patcher=lambda record: record.update(name=record["extra"].get("name", record["name"])))
    
    # 1. Console Handler (Development)
    if config.ENVIRONMENT != "production":
        # Format: "YYYY-MM-DD HH:mm:ss | LEVEL | [logger] - Message"
        # We use high-contrast markup for a "Premium" look
        dev_format = (
            "<green>{time: HH:mm:ss}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name: <20}</cyan> - <level>{message}</level>"
        )
        
        logger.add(
            sys.stdout,
            level=log_level.upper(),
            format=dev_format,
            colorize=True,
            enqueue=True, # Thread-safe
            backtrace=True,
            diagnose=True,
        )
    # 2. JSON Handler (Production)
    else:
        logger.add(
            sys.stdout,
            level=log_level.upper(),
            serialize=True, # Structured JSON
            enqueue=True,
        )

    # Intercept standard logging messages (capture uvicorn, sqlalchemy, etc.)
    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)
    
    # Silence third-party loggers but allow propagation to Loguru
    for name in logging.root.manager.loggerDict.keys():
        logging_logger = logging.getLogger(name)
        logging_logger.handlers = []
        logging_logger.propagate = True

    # Ensure uvicorn and other noisy libraries are at the right level
    # We silence uvicorn.access because we use our own LoggingMiddleware for better control
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("watchfiles").setLevel(logging.WARNING)
    
    # Silence litellm internal proxy warnings (we don't use litellm proxy)
    logging.getLogger("LiteLLM").setLevel(logging.CRITICAL)
    logging.getLogger("litellm").setLevel(logging.CRITICAL)
    logging.getLogger("litellm.litellm_core_utils").setLevel(logging.CRITICAL)
    logging.getLogger("litellm.proxy").setLevel(logging.CRITICAL)
    
    # Silence httpx noise from LLM client calls
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)

def get_logger(name: str):
    """Return a Loguru logger bound with a name."""
    return logger.bind(name=name)

# Pre-defined loggers for system-wide consistency
access_logger = get_logger("app.access")
