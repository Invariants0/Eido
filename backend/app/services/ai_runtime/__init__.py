"""AI Runtime layer - orchestrates CrewAI, LLMs, and OpenClaw tools."""

# Lazy imports to avoid circular dependencies
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .ai_runtime_facade import AIRuntimeFacade
    from .llm_router import LLMRouter, TaskType
    from .crewai_service import CrewAIService
    from .openclaw_service import OpenClawService
    from .tool_sandbox import SafeToolExecutor
    from .context_manager import ContextManager


def __getattr__(name: str):
    """Lazy import to avoid circular dependencies."""
    if name == "AIRuntimeFacade":
        from .ai_runtime_facade import AIRuntimeFacade
        return AIRuntimeFacade
    elif name == "LLMRouter":
        from .llm_router import LLMRouter
        return LLMRouter
    elif name == "TaskType":
        from .llm_router import TaskType
        return TaskType
    elif name == "CrewAIService":
        from .crewai_service import CrewAIService
        return CrewAIService
    elif name == "OpenClawService":
        from .openclaw_service import OpenClawService
        return OpenClawService
    elif name == "SafeToolExecutor":
        from .tool_sandbox import SafeToolExecutor
        return SafeToolExecutor
    elif name == "ContextManager":
        from .context_manager import ContextManager
        return ContextManager
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


__all__ = [
    "AIRuntimeFacade",
    "LLMRouter",
    "TaskType",
    "CrewAIService",
    "OpenClawService",
    "SafeToolExecutor",
    "ContextManager",
]

