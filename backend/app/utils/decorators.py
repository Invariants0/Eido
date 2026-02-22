"""Common decorators for endpoints and functions."""

import functools
import logging
from typing import Callable

logger = logging.getLogger(__name__)


def log_execution(func: Callable) -> Callable:
    """Decorator to log function execution time and result."""
    
    @functools.wraps(func)
    async def async_wrapper(*args, **kwargs):
        logger.info(f"Executing {func.__name__} with args={args}, kwargs={kwargs}")
        try:
            result = await func(*args, **kwargs)
            logger.info(f"{func.__name__} completed successfully")
            return result
        except Exception as e:
            logger.error(f"{func.__name__} failed: {str(e)}", exc_info=e)
            raise
    
    @functools.wraps(func)
    def sync_wrapper(*args, **kwargs):
        logger.info(f"Executing {func.__name__} with args={args}, kwargs={kwargs}")
        try:
            result = func(*args, **kwargs)
            logger.info(f"{func.__name__} completed successfully")
            return result
        except Exception as e:
            logger.error(f"{func.__name__} failed: {str(e)}", exc_info=e)
            raise
    
    # Return async or sync wrapper based on function type
    if asyncio.iscoroutinefunction(func):
        return async_wrapper
    return sync_wrapper


import asyncio
