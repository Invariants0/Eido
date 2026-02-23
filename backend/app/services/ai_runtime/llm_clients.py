"""LLM Client implementations for OpenAI and Anthropic."""

import asyncio
from typing import Optional, Dict, Any
from abc import ABC, abstractmethod

from ...config.settings import config
from ...logging import get_logger

logger = get_logger(__name__)


class LLMClient(ABC):
    """Abstract base class for LLM clients."""
    
    @abstractmethod
    async def complete(self, prompt: str, model: str, max_tokens: int = 2000) -> Dict[str, Any]:
        """Execute completion and return response with usage stats."""
        pass


class OpenAIClient(LLMClient):
    """OpenAI API client."""
    
    def __init__(self):
        self.api_key = config.OPENAI_API_KEY
        if not self.api_key:
            logger.warning("OPENAI_API_KEY not configured, using stub mode")
            self.stub_mode = True
        else:
            self.stub_mode = False
            try:
                import openai
                self.client = openai.AsyncOpenAI(api_key=self.api_key)
            except ImportError:
                logger.warning("openai package not installed, using stub mode")
                self.stub_mode = True
    
    async def complete(self, prompt: str, model: str, max_tokens: int = 2000) -> Dict[str, Any]:
        """Execute OpenAI completion."""
        if self.stub_mode:
            return await self._stub_complete(prompt, model)
        
        try:
            response = await self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a helpful AI assistant."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=0.7,
            )
            
            return {
                "content": response.choices[0].message.content,
                "input_tokens": response.usage.prompt_tokens,
                "output_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
                "model": response.model,
            }
        
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise
    
    async def _stub_complete(self, prompt: str, model: str) -> Dict[str, Any]:
        """Stub completion for testing without API key."""
        await asyncio.sleep(0.1)  # Simulate API latency
        
        stub_response = {
            "status": "success",
            "model": model,
            "result": f"Stub response from {model}",
            "analysis": "This is a stubbed OpenAI response for testing",
            "recommendations": ["Implement actual OpenAI integration", "Add API key to environment"],
        }
        
        import json
        content = json.dumps(stub_response, indent=2)
        
        # Estimate tokens
        input_tokens = len(prompt.split()) * 1.3
        output_tokens = len(content.split()) * 1.3
        
        return {
            "content": content,
            "input_tokens": int(input_tokens),
            "output_tokens": int(output_tokens),
            "total_tokens": int(input_tokens + output_tokens),
            "model": model,
        }


class AnthropicClient(LLMClient):
    """Anthropic API client."""
    
    def __init__(self):
        self.api_key = config.ANTHROPIC_API_KEY
        if not self.api_key:
            logger.warning("ANTHROPIC_API_KEY not configured, using stub mode")
            self.stub_mode = True
        else:
            self.stub_mode = False
            try:
                import anthropic
                self.client = anthropic.AsyncAnthropic(api_key=self.api_key)
            except ImportError:
                logger.warning("anthropic package not installed, using stub mode")
                self.stub_mode = True
    
    async def complete(self, prompt: str, model: str, max_tokens: int = 2000) -> Dict[str, Any]:
        """Execute Anthropic completion."""
        if self.stub_mode:
            return await self._stub_complete(prompt, model)
        
        try:
            response = await self.client.messages.create(
                model=model,
                max_tokens=max_tokens,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
            )
            
            content = response.content[0].text
            
            return {
                "content": content,
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
                "total_tokens": response.usage.input_tokens + response.usage.output_tokens,
                "model": response.model,
            }
        
        except Exception as e:
            logger.error(f"Anthropic API error: {e}")
            raise
    
    async def _stub_complete(self, prompt: str, model: str) -> Dict[str, Any]:
        """Stub completion for testing without API key."""
        await asyncio.sleep(0.1)  # Simulate API latency
        
        stub_response = {
            "status": "success",
            "model": model,
            "result": f"Stub response from {model}",
            "analysis": "This is a stubbed Anthropic response for testing",
            "recommendations": ["Implement actual Anthropic integration", "Add API key to environment"],
        }
        
        import json
        content = json.dumps(stub_response, indent=2)
        
        # Estimate tokens
        input_tokens = len(prompt.split()) * 1.3
        output_tokens = len(content.split()) * 1.3
        
        return {
            "content": content,
            "input_tokens": int(input_tokens),
            "output_tokens": int(output_tokens),
            "total_tokens": int(input_tokens + output_tokens),
            "model": model,
        }


def get_llm_client(model: str) -> LLMClient:
    """Get appropriate LLM client for model."""
    if "gpt" in model.lower():
        return OpenAIClient()
    elif "claude" in model.lower():
        return AnthropicClient()
    else:
        # Default to OpenAI
        return OpenAIClient()
