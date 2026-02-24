"""LLM Router - routes tasks to appropriate LLM models with cost tracking."""

import json
import asyncio
from enum import Enum
from typing import Dict, Any, Optional, Type
from pydantic import BaseModel
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

from ...config.settings import config
from ...logger import get_logger
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
    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message, code="LLM_ROUTER_ERROR", status_code=status_code)


class LLMRouter:
    """Routes tasks to appropriate LLM models with cost tracking."""
    
    # Token cost per 1K tokens (USD) - updated pricing
    MODEL_COSTS = {
        # OpenAI (Paid)
        "gpt-4": {"input": 0.03, "output": 0.06},
        "gpt-4-turbo": {"input": 0.01, "output": 0.03},
        "gpt-4o": {"input": 0.005, "output": 0.015},
        "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
        "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
        # Anthropic (Paid)
        "claude-3-opus": {"input": 0.015, "output": 0.075},
        "claude-3-sonnet-20240229": {"input": 0.003, "output": 0.015},
        "claude-3-haiku-20240307": {"input": 0.00025, "output": 0.00125},
        # Groq (Free Tier)
        "llama-3.3-70b-versatile": {"input": 0.0, "output": 0.0},
        "llama3-70b": {"input": 0.0007, "output": 0.0009},
        "llama3-8b": {"input": 0.0001, "output": 0.0001},
        "llama-3.1-70b": {"input": 0.0006, "output": 0.0006},
        # Gemini (Free Tier)
        "gemini-1.5-flash": {"input": 0.0, "output": 0.0},
        "gemini-1.5-pro": {"input": 0.0, "output": 0.0},
        "gemini-2.0-flash": {"input": 0.0, "output": 0.0},
        # Ollama (Local - Free)
        "ollama": {"input": 0.0, "output": 0.0},
    }
    
    def __init__(self):
        self.total_tokens_used = 0
        self.total_cost = 0.0
        # Task type to model mapping from config
        self.TASK_MODEL_MAP = {
            TaskType.IDEATION: config.IDEATION_LLM_MODEL,
            TaskType.ARCHITECTURE: config.ARCHITECTURE_LLM_MODEL,
            TaskType.BUILDING: config.BUILDING_LLM_MODEL,
            TaskType.DEPLOYMENT: config.DEPLOYMENT_LLM_MODEL,
            TaskType.TOKENIZATION: config.TOKENIZATION_LLM_MODEL,
            TaskType.SUMMARY: config.SUMMARY_LLM_MODEL,
        }
    
    def get_model_for_task(self, task_type: TaskType) -> str:
        """Get the appropriate model for a task type."""
        model = self.TASK_MODEL_MAP.get(task_type, config.DEFAULT_LLM_MODEL)
        logger.info(f"Routing {task_type.value} to model: {model}")
        return model
    
    def estimate_cost(self, model: str, input_tokens: int, output_tokens: int) -> float:
        """Estimate cost for token usage."""
        costs = self.MODEL_COSTS.get(model, {"input": 0.01, "output": 0.03})
        for key in self.MODEL_COSTS:
            if key in model.lower():
                costs = self.MODEL_COSTS[key]
                break
                
        input_cost = (input_tokens / 1000) * costs["input"]
        output_cost = (output_tokens / 1000) * costs["output"]
        return input_cost + output_cost

    async def execute_llm_call(
        self,
        task_type: TaskType,
        prompt: str,
        response_schema: Optional[Type[BaseModel]] = None,
        max_retries: Optional[int] = None,
    ) -> LLMResponse:
        """
        Execute LLM call with routing and tracking.
        """
        model = self.get_model_for_task(task_type)
        max_attempts = max_retries or config.MAX_LLM_RETRIES
        
        # We use a custom retry wrapper to handle validation errors vs API errors
        last_exception = None
        
        for attempt in range(1, max_attempts + 1):
            try:
                logger.info(f"LLM call attempt {attempt}/{max_attempts} for {task_type.value}")
                
                # Execute the actual call
                response_data = await self._raw_llm_call(model, prompt)
                
                raw_output = response_data['content']
                input_tokens = response_data.get('input_tokens', len(prompt.split()) * 1.3)
                output_tokens = response_data.get('output_tokens', len(raw_output.split()) * 1.3)
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
                        logger.info("JSON response validated successfully")
                    except Exception as e:
                        logger.warning(f"JSON validation failed on attempt {attempt}: {e}")
                        if attempt < max_attempts:
                            # Modify prompt slightly for retry if it failed validation
                            prompt += f"\n\nIMPORTANT: Your previous response failed validation with error: {str(e)}. Please ensure your response is ONLY valid JSON matching the required schema."
                            continue
                        else:
                            raise LLMRouterError(f"Failed to get valid JSON after {max_attempts} attempts: {e}")
                
                return LLMResponse(
                    model_used=model,
                    token_usage=total_tokens,
                    cost_estimate=cost,
                    raw_output=raw_output,
                    parsed_output=parsed_output.dict() if parsed_output else None,
                )
                
            except Exception as e:
                logger.error(f"LLM call failed on attempt {attempt}: {e}")
                last_exception = e
                if attempt == max_attempts:
                    break
                # Exponential backoff for retries
                await asyncio.sleep(2 ** attempt)
        
        raise LLMRouterError(f"LLM call failed after {max_attempts} attempts: {last_exception}")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((Exception)), # We filter specifically in the clients
        reraise=True
    )
    async def _raw_llm_call(self, model: str, prompt: str) -> Dict[str, Any]:
        """Execute raw API call via clients with exponential backoff."""
        from .llm_clients import get_llm_client
        
        client = get_llm_client(model)
        try:
            return await client.complete(prompt, model)
        except Exception as e:
            logger.error(f"API Client Error: {e}")
            raise

    def _validate_json_response(self, raw_output: str, schema: Type[BaseModel]) -> BaseModel:
        """Helper to find and parse JSON in LLM response."""
        # Sometimes LLMs wrap JSON in backticks
        json_str = raw_output.strip()
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0].strip()
        elif "```" in json_str:
            json_str = json_str.split("```")[1].split("```")[0].strip()
            
        try:
            data = json.loads(json_str)
            return schema(**data)
        except json.JSONDecodeError as e:
            # Fallback: try to find anything that looks like a JSON block
            import re
            match = re.search(r'\{.*\}', json_str, re.DOTALL)
            if match:
                try:
                    data = json.loads(match.group())
                    return schema(**data)
                except:
                    pass
            raise ValueError(f"Invalid JSON format: {e}")
        except Exception as e:
            raise ValueError(f"Schema validation failed: {e}")

    def get_usage_stats(self) -> Dict[str, Any]:
        """Get current usage statistics."""
        return {
            "total_tokens_used": self.total_tokens_used,
            "total_cost": round(self.total_cost, 4),
        }
