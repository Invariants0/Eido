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

# Global counters to track usage across the entire application lifetime
# This captures both direct router calls and CrewAI agent calls via litellm
_GLOBAL_TOTAL_TOKENS = 0
_GLOBAL_TOTAL_COST = 0.0

def _litellm_success_callback(kwargs, completion_response, start_time, end_time):
    """Global callback for litellm to track usage from any source."""
    global _GLOBAL_TOTAL_TOKENS, _GLOBAL_TOTAL_COST
    try:
        usage = completion_response.get('usage', {})
        tokens = usage.get('total_tokens', 0)
        
        # If tokens are 0 (common with Groq), use our tokenizer fallback logic
        if tokens == 0:
            model = kwargs.get('model', 'unknown')
            # litellm expects a provider-prefixed model name
            token_model = model if '/' in model else f"groq/{model}"
            
            from litellm import get_num_tokens
            prompt = kwargs.get('messages', [{}])[-1].get('content', '')
            response_text = completion_response.get('choices', [{}])[0].get('message', {}).get('content', '')
            
            try:
                tokens = get_num_tokens(prompt, model=token_model) + get_num_tokens(response_text, model=token_model)
            except:
                tokens = int((len(prompt.split()) + len(response_text.split())) * 1.3)
        
        _GLOBAL_TOTAL_TOKENS += tokens
        
        # Estimate cost globally using the router's logic
        # We can use a temporary router instance or access the map directly
        # Since this is a standalone function, we look up the costs manually
        model = kwargs.get('model', 'unknown')
        costs = {"input": 0.0, "output": 0.0} # Default to zero
        
        # Direct lookup in the costs map (we'll make the map a class attribute)
        for model_key, cost_values in LLMRouter.MODEL_COSTS.items():
            if model_key in model.lower():
                costs = cost_values
                break
        
        # Simple split estimation: input ~prompt, output ~completion
        # Since we only have total_tokens, we approximate 50/50 split for cost if not specified
        # or we could parse messages but that's overkill. For free models, it's 0 anyway.
        input_tokens = len(kwargs.get('messages', [{}])[-1].get('content', '').split()) * 1.3
        output_tokens = tokens - input_tokens
        
        cost = ((input_tokens / 1000) * costs["input"]) + ((max(0, output_tokens) / 1000) * costs["output"])
        _GLOBAL_TOTAL_COST += cost
        
        logger.info(f"Captured {tokens} tokens from litellm call ({model}). Total global: {_GLOBAL_TOTAL_TOKENS}")
    except Exception as e:
        logger.warning(f"Usage tracking callback failed: {e}")

# Register the callback with litellm
try:
    import litellm
    if _litellm_success_callback not in litellm.success_callback:
        litellm.success_callback.append(_litellm_success_callback)
except ImportError:
    logger.warning("litellm not installed, global usage tracking disabled")
except Exception as e:
    logger.warning(f"Failed to register litellm callback: {e}")


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
        # Groq (Free Tier) - Distributed across multiple models
        "llama-3.3-70b-versatile": {"input": 0.0, "output": 0.0},
        "llama-3.1-70b-versatile": {"input": 0.0, "output": 0.0},
        "llama-3.1-8b-instant": {"input": 0.0, "output": 0.0},
        "gemma2-9b-it": {"input": 0.0, "output": 0.0},
        "mixtral-8x7b-32768": {"input": 0.0, "output": 0.0},
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
        # We still keep local counts for instance-specific tracking if needed,
        # but usage stats will report global totals by default.
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
                # Try to get token usage from provider response
                input_tokens = response_data.get('input_tokens')
                output_tokens = response_data.get('output_tokens')
                # Groq does not return token counts – fall back to litellm tokenizer
                # litellm expects a provider-prefixed model name (e.g. "groq/llama-3.3-70b-versatile")
                token_model = model if model.startswith('groq/') else f"groq/{model}"
                if input_tokens is None:
                    try:
                        from litellm import get_num_tokens
                        input_tokens = get_num_tokens(prompt, model=token_model)
                    except Exception:
                        # Simple approximation as last resort
                        input_tokens = int(len(prompt.split()) * 1.3)
                if output_tokens is None:
                    try:
                        from litellm import get_num_tokens
                        output_tokens = get_num_tokens(raw_output, model=token_model)
                    except Exception:
                        output_tokens = int(len(raw_output.split()) * 1.3)
                total_tokens = int(input_tokens + output_tokens)
                logger.debug(f"Token counts - input: {input_tokens}, output: {output_tokens}, total: {total_tokens}")
                
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
        """Get usage statistics. Returns global totals to include CrewAI agents."""
        # Aggregate local and global to be safe, but global should cover both
        return {
            "total_tokens_used": max(_GLOBAL_TOTAL_TOKENS, self.total_tokens_used),
            "total_cost": round(max(_GLOBAL_TOTAL_COST, self.total_cost), 4),
        }
