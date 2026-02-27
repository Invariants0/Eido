"""Context Optimizer - Intelligent context compression using TOON."""

import re
from typing import Any, Dict, List, Optional, Tuple, TYPE_CHECKING
from ..logger import get_logger

if TYPE_CHECKING:
    from ..services.ai_runtime.toon_adapter import ToonAdapter

logger = get_logger(__name__)


class ContextOptimizer:
    """
    Optimizes context for LLM consumption using TOON encoding.
    Tracks token savings and provides intelligent compression.
    """
    
    def __init__(self):
        # Lazy import to avoid circular dependency
        from ..services.ai_runtime.toon_adapter import get_toon_adapter
        self.adapter = get_toon_adapter()
        self.total_savings: float = 0.0
        self.compression_count: int = 0
    
    def compress_structured_data(
        self, 
        data: Dict[str, Any],
        track_savings: bool = True
    ) -> Tuple[str, Optional[float]]:
        """
        Compress structured data using TOON.
        
        Args:
            data: Dictionary or structured object to compress
            track_savings: Whether to track and log token savings
        
        Returns:
            Tuple of (compressed_string, savings_percentage)
        """
        if not isinstance(data, (dict, list)):
            logger.warning(f"Non-structured data passed to compress_structured_data: {type(data)}")
            return str(data), None
        
        if track_savings:
            compressed, savings = self.adapter.encode_with_savings(data)
            if savings is not None:
                self.total_savings += savings
                self.compression_count += 1
                logger.info(
                    f"TOON compression applied: {savings:.1f}% token savings",
                    extra={"savings_pct": savings, "compression_count": self.compression_count}
                )
            return compressed, savings
        else:
            compressed = self.adapter.encode(data)
            return compressed, None
    
    def compress_logs(
        self, 
        raw_logs: str,
        preserve_errors: bool = True
    ) -> str:
        """
        Compress large terminal or build logs.
        Preserves error messages, warnings, and file paths.
        
        Args:
            raw_logs: Raw log string
            preserve_errors: Whether to prioritize error/warning lines
        
        Returns:
            Compressed log string
        """
        if not raw_logs:
            return ""
        
        # Remove repeated whitespace and noisy timestamps
        processed = re.sub(r'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+', '[TS]', raw_logs)
        processed = re.sub(r' +', ' ', processed)
        
        if not preserve_errors:
            # Simple truncation for non-critical logs
            return processed[:2000] if len(processed) > 2000 else processed
        
        # Identify common compiler error patterns
        lines = processed.split('\n')
        filtered_lines: List[str] = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Keep error/fatal lines and lines with file paths
            if any(key in line.lower() for key in ['error', 'fatal', 'exception', 'stack trace', 'failed']):
                filtered_lines.append(f"! {line}")
            elif re.search(r'[a-zA-Z0-9_/.-]+\.[a-z]{2,5}:\d+', line):
                filtered_lines.append(f"@ {line}")
            elif line.startswith('WARNING'):
                filtered_lines.append(f"? {line}")
            elif len(filtered_lines) < 20:  # Keep some context if log is small
                filtered_lines.append(f". {line}")
        
        compressed = "\n".join(filtered_lines)
        
        # If we have structured error data, encode it with TOON
        if len(filtered_lines) > 5:
            error_data = {
                "error_count": sum(1 for l in filtered_lines if l.startswith("!")),
                "warning_count": sum(1 for l in filtered_lines if l.startswith("?")),
                "file_references": [l[2:] for l in filtered_lines if l.startswith("@")][:5],
                "critical_errors": [l[2:] for l in filtered_lines if l.startswith("!")][:10],
            }
            
            # Add TOON-encoded summary header
            summary, _ = self.compress_structured_data(error_data, track_savings=False)
            return f"--- ERROR SUMMARY ---\n{summary}\n\n--- DETAILED LOGS ---\n{compressed}"
        
        return compressed
    
    def summarize_for_fix(
        self, 
        stderr: str,
        exit_code: int = 1,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Create a targeted error summary for the Developer agent's fix loop.
        
        Args:
            stderr: Standard error output
            exit_code: Process exit code
            context: Additional context (attempt number, previous fixes, etc.)
        
        Returns:
            Formatted error summary with action items
        """
        compressed_logs = self.compress_logs(stderr, preserve_errors=True)
        
        summary_parts = ["--- TOON ERROR SUMMARY ---"]
        
        if context:
            context_str, _ = self.compress_structured_data(context, track_savings=False)
            summary_parts.append(f"Context:\n{context_str}")
        
        summary_parts.append(f"Exit Code: {exit_code}")
        summary_parts.append(f"\nError Details:\n{compressed_logs}")
        summary_parts.append("\n--- ACTION: FIX ABOVE ERRORS ---")
        
        return "\n".join(summary_parts)
    
    def compress_context(
        self,
        context: Dict[str, Any],
        max_size: Optional[int] = None
    ) -> str:
        """
        Compress context dictionary for LLM consumption.
        
        Args:
            context: Context dictionary
            max_size: Maximum size in characters (optional)
        
        Returns:
            Compressed context string
        """
        compressed, savings = self.compress_structured_data(context, track_savings=True)
        
        if max_size and len(compressed) > max_size:
            logger.warning(
                f"Compressed context ({len(compressed)} chars) exceeds max_size ({max_size}), "
                f"applying truncation"
            )
            # Truncate but preserve structure
            compressed = compressed[:max_size] + "\n... [truncated]"
        
        return compressed
    
    def get_stats(self) -> Dict[str, Any]:
        """Get compression statistics."""
        avg_savings = self.total_savings / self.compression_count if self.compression_count > 0 else 0.0
        
        return {
            "total_compressions": self.compression_count,
            "total_savings_pct": self.total_savings,
            "average_savings_pct": avg_savings,
            "toon_available": self.adapter.is_available(),
        }
    
    def reset_stats(self) -> None:
        """Reset compression statistics."""
        self.total_savings = 0.0
        self.compression_count = 0
        logger.info("Context optimizer stats reset")
