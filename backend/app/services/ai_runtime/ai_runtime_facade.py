"""AI Runtime Facade - single entry point for AI execution."""

from typing import Dict, Any
from datetime import datetime

from ...logger import get_logger
from ...models.mvp import MVP
from ...db import get_session_context
from .llm_router import LLMRouter
from .crewai_service import CrewAIService, StageExecutionError
from .openclaw_service import OpenClawService
from .context_manager import ContextManager

logger = get_logger(__name__)


class StageResult:
    """Result from stage execution."""
    
    def __init__(
        self,
        stage_name: str,
        success: bool,
        stage_input_json: Dict[str, Any],
        stage_output_json: Dict[str, Any],
        llm_model: str,
        token_usage: int,
        cost_estimate: float,
        agent_logs: list[str],
        tool_stats: Dict[str, Any],
        error: str = None,
    ):
        self.stage_name = stage_name
        self.success = success
        self.stage_input_json = stage_input_json
        self.stage_output_json = stage_output_json
        self.llm_model = llm_model
        self.token_usage = token_usage
        self.cost_estimate = cost_estimate
        self.agent_logs = agent_logs
        self.tool_stats = tool_stats
        self.error = error


class AIRuntimeFacade:
    """Single entry point for AI runtime execution."""
    
    def __init__(self, mvp_id: int):
        self.mvp_id = mvp_id
        self.llm_router = LLMRouter()
        self.crewai_service = CrewAIService(mvp_id, self.llm_router)
        self.openclaw_service = OpenClawService(mvp_id)
        self.context_manager = None  # Initialized in execute_stage

    
    async def execute_stage(self, stage_name: str, mvp_id: int) -> StageResult:
        """
        Execute a pipeline stage with full AI orchestration.
        
        Args:
            stage_name: Name of the pipeline stage
            mvp_id: MVP identifier
        
        Returns:
            StageResult with execution details
        """
        logger.info(
            f"AI Runtime executing stage: {stage_name}",
            extra={"mvp_id": mvp_id, "stage": stage_name}
        )
        
        # Stages that require an E2B sandbox
        requires_sandbox = stage_name in ["architecture", "building", "deployment"]
        sandbox_manager = None
        
        try:
            # Load MVP
            with get_session_context() as session:
                mvp = session.get(MVP, mvp_id)
                if not mvp:
                    raise StageExecutionError(stage_name, f"MVP {mvp_id} not found")
            
            # Initialize context manager
            self.context_manager = ContextManager(mvp)
            
            # Build stage context
            context = self.context_manager.build_stage_context(stage_name)
            
            # Initialize sandbox if needed
            if requires_sandbox:
                from .e2b_sandbox import E2BSandboxManager
                sandbox_manager = E2BSandboxManager()
                # We use it as a context manager manually since we are in an async method
                sandbox_manager.__enter__()
                self.crewai_service.set_sandbox_manager(sandbox_manager)
            
            # Store input
            stage_input_json = {
                "stage": stage_name,
                "context": context,
                "timestamp": datetime.utcnow().isoformat(),
            }
            
            # Execute crew
            crew_result = await self.crewai_service.execute_crew(stage_name, context)
            
            # Get statistics
            tool_stats = self.openclaw_service.get_stats()
            llm_stats = self.llm_router.get_usage_stats()
            
            # Build output
            stage_output_json = {
                "stage": stage_name,
                "crew_output": crew_result.output_json,
                "agent_logs": crew_result.agent_logs,
                "tool_stats": tool_stats,
                "llm_stats": llm_stats,
                "timestamp": datetime.utcnow().isoformat(),
            }
            
            logger.info(
                f"Stage {stage_name} completed successfully",
                extra={
                    "mvp_id": mvp_id,
                    "tokens": crew_result.token_usage,
                    "cost": crew_result.cost_estimate,
                }
            )
            
            return StageResult(
                stage_name=stage_name,
                success=True,
                stage_input_json=stage_input_json,
                stage_output_json=stage_output_json,
                llm_model=crew_result.model_used,
                token_usage=crew_result.token_usage,
                cost_estimate=crew_result.cost_estimate,
                agent_logs=crew_result.agent_logs,
                tool_stats=tool_stats,
            )
        
        except Exception as e:
            logger.error(
                f"Stage {stage_name} failed: {e}",
                extra={"mvp_id": mvp_id},
                exc_info=True
            )
            
            return StageResult(
                stage_name=stage_name,
                success=False,
                stage_input_json=stage_input_json if 'stage_input_json' in locals() else {},
                stage_output_json={},
                llm_model="unknown",
                token_usage=0,
                cost_estimate=0.0,
                agent_logs=[],
                tool_stats={},
                error=str(e),
            )
        finally:
            if sandbox_manager:
                sandbox_manager.__exit__(None, None, None)
    
    def get_runtime_stats(self) -> Dict[str, Any]:
        """Get overall runtime statistics."""
        return {
            "llm_stats": self.llm_router.get_usage_stats(),
            "tool_stats": self.openclaw_service.get_stats(),
            "context_stats": self.context_manager.get_context_stats() if self.context_manager else {},
        }
