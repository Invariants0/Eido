"""CrewAI Service - manages CrewAI crew initialization and execution."""

from typing import Dict, Any, Optional
from pydantic import BaseModel

from ...logging import get_logger
from ...exceptions import EidoException
from .llm_router import LLMRouter, TaskType

logger = get_logger(__name__)


class StageExecutionError(EidoException):
    """Raised when stage execution fails."""
    def __init__(self, stage: str, message: str):
        super().__init__(f"Stage '{stage}' execution failed: {message}", code="STAGE_EXECUTION_ERROR", status_code=500)


class CrewResult(BaseModel):
    """Structured result from crew execution."""
    output_json: Dict[str, Any]
    agent_logs: list[str]
    model_used: str
    token_usage: int
    cost_estimate: float


class CrewAIService:
    """Manages CrewAI crew initialization and execution."""

    
    # Stage to crew configuration mapping
    STAGE_CONFIGS = {
        "ideation": {
            "task_type": TaskType.IDEATION,
            "agents": ["business_analyst", "market_researcher"],
            "description": "Analyze idea and create business plan",
        },
        "architecture": {
            "task_type": TaskType.ARCHITECTURE,
            "agents": ["system_architect", "tech_lead"],
            "description": "Design technical architecture",
        },
        "building": {
            "task_type": TaskType.BUILDING,
            "agents": ["frontend_dev", "backend_dev", "qa_engineer"],
            "description": "Implement application code",
        },
        "deployment": {
            "task_type": TaskType.DEPLOYMENT,
            "agents": ["devops_engineer"],
            "description": "Deploy to production",
        },
        "tokenization": {
            "task_type": TaskType.TOKENIZATION,
            "agents": ["blockchain_specialist"],
            "description": "Create and deploy token",
        },
    }
    
    def __init__(self, mvp_id: int, llm_router: LLMRouter):
        self.mvp_id = mvp_id
        self.llm_router = llm_router
        self.crews: Dict[str, Any] = {}
    
    def _get_stage_config(self, stage_name: str) -> Dict[str, Any]:
        """Get configuration for a stage."""
        config = self.STAGE_CONFIGS.get(stage_name)
        if not config:
            raise StageExecutionError(stage_name, f"Unknown stage: {stage_name}")
        return config
    
    async def initialize_crew(self, stage_name: str) -> None:
        """Initialize crew for a specific stage."""
        logger.info(f"Initializing crew for stage: {stage_name}")
        
        config = self._get_stage_config(stage_name)
        
        # Stub: Initialize actual CrewAI crew here
        # For now, store configuration
        self.crews[stage_name] = {
            "config": config,
            "initialized": True,
        }
        
        logger.info(f"Crew initialized for {stage_name} with agents: {config['agents']}")
    
    async def execute_crew(
        self,
        stage_name: str,
        context: Dict[str, Any],
    ) -> CrewResult:
        """
        Execute crew for a stage.
        
        Args:
            stage_name: Pipeline stage name
            context: Stage context from ContextManager
        
        Returns:
            CrewResult with structured output
        """
        logger.info(f"Executing crew for stage: {stage_name}")
        
        # Ensure crew is initialized
        if stage_name not in self.crews:
            await self.initialize_crew(stage_name)
        
        config = self._get_stage_config(stage_name)
        task_type = config["task_type"]
        
        # Build prompt for crew
        prompt = self._build_crew_prompt(stage_name, context)
        
        # Execute via LLM router
        llm_response = await self.llm_router.execute_llm_call(
            task_type=task_type,
            prompt=prompt,
        )
        
        # Stub: Parse crew output
        # In real implementation, CrewAI would return structured output
        output_json = {
            "stage": stage_name,
            "status": "completed",
            "result": llm_response.raw_output,
        }
        
        agent_logs = [
            f"Agent {agent}: Executed successfully" 
            for agent in config["agents"]
        ]
        
        return CrewResult(
            output_json=output_json,
            agent_logs=agent_logs,
            model_used=llm_response.model_used,
            token_usage=llm_response.token_usage,
            cost_estimate=llm_response.cost_estimate,
        )
    
    def _build_crew_prompt(self, stage_name: str, context: Dict[str, Any]) -> str:
        """Build prompt for crew execution."""
        config = self._get_stage_config(stage_name)
        
        prompt = f"""
Stage: {stage_name}
Description: {config['description']}
Agents: {', '.join(config['agents'])}

Context:
{context}

Execute the stage and return structured JSON output.
"""
        return prompt
