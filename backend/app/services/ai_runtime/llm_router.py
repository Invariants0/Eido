"""LLM Router - routes tasks to appropriate LLM models with cost tracking."""

from enum import Enum
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
import json

from ...config.settings import config
from ...logging import get_logger
from ...exceptions import EidoException

logger = get_logger(__name__)


class TaskType(str, Enum):
    """Task types for LLM routing."""
    IDEATION = "IDEATION"
    ARCHITECTURE = "ARCHITECTURE"
    BUILDING = "BUILDING"
    DEPLOYMENT = "DEPLOYMENT"
    TOKENIZATION = "TOKENIZATION"
    SUMMARY = "SUMMARY"


class LLMResponse(BaseModel):
    """Structured LLM response."""
    model_used: str
    token_usage: int
    cost_estimate: float
    raw_output: str
    parsed_output: Optional[Dict[str, Any]] = None


class LLMRouterError(EidoException):
    """Raised when LLM routing or execution fails."""
    def __init__(self, message: str):
        super().__init__(message, code="LLM_ROUTER_ERROR", status_code=500)


class LLMRouter:
    """Routes tasks to appropriate LLM models with cost tracking."""
    
    # Token cost per 1K tokens (USD) - approximate pricing
    MODEL_COSTS = {
        "gpt-4": {"input": 0.03, "output": 0.06},
        "gpt-4-turbo": {"input": 0.01, "output": 0.03},
        "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
        "claude-3-opus": {"input": 0.015, "output": 0.075},
        "claude-3-sonnet": {"input": 0.003, "output": 0.015},
        "claude-3-haiku": {"input": 0.00025, "output": 0.00125},
    }
    
    # Task type to model mapping
    TASK_MODEL_MAP = {
        TaskType.IDEATION: config.IDEATION_LLM_MODEL,
        TaskType.ARCHITECTURE: config.ARCHITECTURE_LLM_MODEL,
        TaskType.BUILDING: config.BUILDING_LLM_MODEL,
        TaskType.DEPLOYMENT: config.DEPLOYMENT_LLM_MODEL,
        TaskType.TOKENIZATION: config.TOKENIZATION_LLM_MODEL,
        TaskType.SUMMARY: config.SUMMARY_LLM_MODEL,
    }
    
    def __init__(self):
        self.total_tokens_used = 0
        self.total_cost = 0.0
    
    def get_model_for_task(self, task_type: TaskType) -> str:
        """Get the appropriate model for a task type."""
        model = self.TASK_MODEL_MAP.get(task_type, config.DEFAULT_LLM_MODEL)
        logger.info(f"Routing {task_type.value} to model: {model}")
        return model
    
    def estimate_cost(self, model: str, input_tokens: int, output_tokens: int) -> float:
        """Estimate cost for token usage."""
        costs = self.MODEL_COSTS.get(model, {"input": 0.01, "output": 0.03})
        input_cost = (input_tokens / 1000) * costs["input"]
        output_cost = (output_tokens / 1000) * costs["output"]
        total_cost = input_cost + output_cost
        
        logger.debug(
            f"Cost estimate for {model}: "
            f"input={input_tokens} tokens (${input_cost:.4f}), "
            f"output={output_tokens} tokens (${output_cost:.4f}), "
            f"total=${total_cost:.4f}"
        )
        
        return total_cost
    
    async def execute_llm_call(
        self,
        task_type: TaskType,
        prompt: str,
        response_schema: Optional[type[BaseModel]] = None,
        max_retries: Optional[int] = None,
    ) -> LLMResponse:
        """
        Execute LLM call with automatic retry on invalid JSON.
        
        Args:
            task_type: Type of task for model routing
            prompt: Input prompt
            response_schema: Pydantic schema for validation
            max_retries: Max retry attempts (defaults to config.MAX_LLM_RETRIES)
        
        Returns:
            LLMResponse with structured output
        
        Raises:
            LLMRouterError: If all retries fail
        """
        model = self.get_model_for_task(task_type)
        max_retries = max_retries or config.MAX_LLM_RETRIES
        
        for attempt in range(1, max_retries + 1):
            try:
                logger.info(f"LLM call attempt {attempt}/{max_retries} for {task_type.value}")
                
                # Stub: Call actual LLM API here
                # For now, return mock response
                raw_output = await self._stub_llm_call(model, prompt)
                
                # Estimate token usage (rough approximation)
                input_tokens = len(prompt.split()) * 1.3  # ~1.3 tokens per word
                output_tokens = len(raw_output.split()) * 1.3
                total_tokens = int(input_tokens + output_tokens)
                
                cost = self.estimate_cost(model, int(input_tokens), int(output_tokens))
                
                # Track totals
                self.total_tokens_used += total_tokens
                self.total_cost += cost
                
                # Validate against schema if provided
                parsed_output = None
                if response_schema:
                    try:
                        parsed_output = self._validate_json_response(raw_output, response_schema)
                        logger.info(f"Response validated successfully against schema")
                    except Exception as e:
                        if attempt < max_retries:
                            logger.warning(f"Validation failed (attempt {attempt}): {e}, retrying...")
                            continue
                        else:
                            raise LLMRouterError(
                                f"Failed to get valid JSON after {max_retries} attempts: {e}"
                            )
                
                return LLMResponse(
                    model_used=model,
                    token_usage=total_tokens,
                    cost_estimate=cost,
                    raw_output=raw_output,
                    parsed_output=parsed_output.dict() if parsed_output else None,
                )
            
            except LLMRouterError:
                raise
            except Exception as e:
                if attempt < max_retries:
                    logger.warning(f"LLM call failed (attempt {attempt}): {e}, retrying...")
                    continue
                else:
                    raise LLMRouterError(f"LLM call failed after {max_retries} attempts: {e}")
        
        raise LLMRouterError(f"Unexpected error in LLM execution")
    
    async def _stub_llm_call(self, model: str, prompt: str) -> str:
        """Execute actual LLM call with fallback to stub."""
        from .llm_clients import get_llm_client
        
        try:
            client = get_llm_client(model)
            response = await client.complete(prompt, model)
            
            logger.info(
                f"LLM call completed: {response['total_tokens']} tokens",
                extra={
                    "model": model,
                    "input_tokens": response['input_tokens'],
                    "output_tokens": response['output_tokens'],
                }
            )
            
            return response['content']
        
        except Exception as e:
            logger.error(f"LLM call failed: {e}, using stub fallback")
            # Fallback to stub
            return await self._stub_fallback(model, prompt)
    
    async def _stub_fallback(self, model: str, prompt: str) -> str:
        """Stub fallback when API fails."""
        logger.debug(f"Stub LLM call to {model} with prompt length: {len(prompt)}")
        
        # Return mock JSON response
        import json
        return json.dumps({
            "status": "success",
            "result": f"Mock response from {model}",
            "data": {
                "analysis": "This is a stubbed response",
                "recommendations": ["Implement actual LLM integration"],
            }
        })
    
    def _validate_json_response(self, raw_output: str, schema: type[BaseModel]) -> BaseModel:
        """Validate and parse JSON response against Pydantic schema."""
        try:
            # Try to parse as JSON
            data = json.loads(raw_output)
            
            # Validate against schema
            validated = schema(**data)
            return validated
        
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON: {e}")
        except Exception as e:
            raise ValueError(f"Schema validation failed: {e}")
    
    def get_usage_stats(self) -> Dict[str, Any]:
        """Get current usage statistics."""
        return {
            "total_tokens_used": self.total_tokens_used,
            "total_cost": round(self.total_cost, 4),
        }
