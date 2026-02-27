"""TOON Adapter - Abstraction layer for official toon-format library."""

import json
from typing import Any, Dict, Optional, Tuple
from ...logger import get_logger

logger = get_logger(__name__)


class ToonAdapter:
    """
    Adapter for the official toon-format library.
    Isolates TOON API calls and provides graceful fallback.
    """
    
    def __init__(self):
        self._toon_available = False
        self._encode_func = None
        self._estimate_savings_func = None
        
        try:
            from toon_format import encode, estimate_savings
            self._encode_func = encode
            self._estimate_savings_func = estimate_savings
            self._toon_available = True
            logger.info("TOON library loaded successfully")
        except ImportError:
            logger.warning(
                "toon-format library not available. Install with: pip install toon-format. "
                "Falling back to JSON serialization."
            )
    
    def is_available(self) -> bool:
        """Check if TOON library is available."""
        return self._toon_available
    
    def encode(self, data: Any) -> str:
        """
        Encode data using TOON format.
        
        Args:
            data: Python object to encode (dict, list, primitives)
        
        Returns:
            TOON-encoded string, or JSON fallback if TOON unavailable
        """
        if not self._toon_available or self._encode_func is None:
            # Fallback to JSON
            try:
                return json.dumps(data, indent=2, default=str)
            except Exception as e:
                logger.error(f"JSON fallback encoding failed: {e}")
                return str(data)
        
        try:
            return self._encode_func(data)
        except Exception as e:
            logger.error(f"TOON encoding failed: {e}, falling back to JSON")
            try:
                return json.dumps(data, indent=2, default=str)
            except Exception:
                return str(data)
    
    def encode_with_savings(self, data: Any) -> Tuple[str, Optional[float]]:
        """
        Encode data and estimate token savings.
        
        Args:
            data: Python object to encode
        
        Returns:
            Tuple of (encoded_string, savings_percentage)
            savings_percentage is None if estimation unavailable
        """
        encoded = self.encode(data)
        
        if not self._toon_available or self._estimate_savings_func is None:
            return encoded, None
        
        try:
            savings = self._estimate_savings_func(data)
            return encoded, savings
        except Exception as e:
            logger.warning(f"Token savings estimation failed: {e}")
            return encoded, None
    
    def safe_encode(self, data: Any, fallback: str = "") -> str:
        """
        Safely encode data with guaranteed non-empty result.
        
        Args:
            data: Python object to encode
            fallback: Fallback string if encoding fails completely
        
        Returns:
            Encoded string or fallback
        """
        try:
            result = self.encode(data)
            return result if result else fallback
        except Exception as e:
            logger.error(f"Safe encode failed: {e}")
            return fallback or str(data)


# Global singleton instance
_adapter_instance: Optional[ToonAdapter] = None


def get_toon_adapter() -> ToonAdapter:
    """Get or create the global ToonAdapter instance."""
    global _adapter_instance
    if _adapter_instance is None:
        _adapter_instance = ToonAdapter()
    return _adapter_instance
