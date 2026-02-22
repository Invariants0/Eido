"""Validation utilities and helpers."""

import re
from typing import Optional


def validate_mvp_name(name: str) -> bool:
    """Validate MVP name format."""
    if not name or len(name) < 1 or len(name) > 200:
        return False
    return True


def validate_github_url(url: str) -> bool:
    """Validate GitHub repository URL."""
    pattern = r"https://github\.com/[\w-]+/[\w-]+/?$"
    return re.match(pattern, url) is not None


def validate_deployment_url(url: str) -> bool:
    """Validate deployment URL format."""
    pattern = r"https?://[\w.-]+\..*"
    return re.match(pattern, url) is not None


def sanitize_stage_name(stage: str) -> str:
    """Sanitize agent stage name."""
    allowed = {"ideation", "architecture", "building", "deploying", "tokenizing", "feedback"}
    return stage.lower() if stage.lower() in allowed else "unknown"
