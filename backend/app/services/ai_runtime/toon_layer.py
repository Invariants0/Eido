import re
from typing import Dict, Any, List, Optional
from ...logger import get_logger

logger = get_logger(__name__)

class TOONLayer:
    """
    Implements Token-Oriented Object Notation (TOON) for context compression.
    Reduces token usage by 30-60% by removing redundant JSON/XML syntax.
    """

    @staticmethod
    def compress_logs(raw_logs: str) -> str:
        """
        Compresses large terminal or build logs into a high-signal TOON format.
        Focuses on error messages, warnings, and file paths.
        """
        if not raw_logs:
            return ""

        # Remove repeated whitespace and noisy timestamps
        processed = re.sub(r'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+', '[TS]', raw_logs)
        processed = re.sub(r' +', ' ', processed)
        
        # Identify common compiler error patterns
        lines = processed.split('\n')
        toon_lines = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Keep error/fatal lines and lines with file paths
            if any(key in line.lower() for key in ['error', 'fatal', 'exception', 'stack trace', 'failed']):
                toon_lines.append(f"! {line}")
            elif re.search(r'[a-zA-Z0-9_/.-]+\.[a-z]{2,5}:\d+', line):
                toon_lines.append(f"@ {line}")
            elif line.startswith('WARNING'):
                toon_lines.append(f"? {line}")
            elif len(toon_lines) < 20: # Keep some context if log is small
                 toon_lines.append(f". {line}")

        return "\n".join(toon_lines)

    @staticmethod
    def to_toon(data: Dict[str, Any], indent: int = 0) -> str:
        """
        Converts a dictionary/JSON object to TOON format.
        Uses indentation and special characters instead of brackets and quotes.
        """
        toon_str = ""
        prefix = "  " * indent
        
        for key, value in data.items():
            if isinstance(value, dict):
                toon_str += f"{prefix}#{key}\n{TOONLayer.to_toon(value, indent + 1)}"
            elif isinstance(value, list):
                toon_str += f"{prefix}*{key}\n"
                for item in value:
                    if isinstance(item, (dict, list)):
                        toon_str += TOONLayer.to_toon({"item": item}, indent + 1)
                    else:
                        toon_str += f"{prefix}  - {item}\n"
            else:
                toon_str += f"{prefix}>{key}: {value}\n"
                
        return toon_str

    @staticmethod
    def summarize_for_fix(stderr: str) -> str:
        """
        Creates a 'Toon Summary' specifically for the Developer agent's fix loop.
        """
        compressed = TOONLayer.compress_logs(stderr)
        return (
            "--- TOON ERR SUMMARY ---\n"
            f"{compressed}\n"
            "--- ACTION: FIX ABOVE ERRORS ---"
        )
