"""LLM Clients - provider-specific implementations (OpenAI, Anthropic)."""

import asyncio
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

from ...config.settings import config
from ...logger import get_logger

logger = get_logger(__name__)


class LLMClient(ABC):
    """Abstract base class for LLM clients."""
    
    @abstractmethod
    async def complete(self, prompt: str, model: str, **kwargs) -> Dict[str, Any]:
        """Execute text completion/chat."""
        pass


class OpenAIClient(LLMClient):
    """Client for OpenAI models."""
    
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

    async def complete(self, prompt: str, model: str, **kwargs) -> Dict[str, Any]:
        if self.stub_mode:
            return await self._stub_response(prompt, model)
        
        try:
            response = await self.client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=kwargs.get("temperature", 0.7),
                max_tokens=kwargs.get("max_tokens", 2000),
            )
            
            return {
                "content": response.choices[0].message.content,
                "input_tokens": response.usage.prompt_tokens,
                "output_tokens": response.usage.completion_tokens,
                "model": model
            }
        except Exception as e:
            logger.error(f"OpenAI API Error: {e}")
            raise

    async def _stub_response(self, prompt: str, model: str) -> Dict[str, Any]:
        """Return a mock JSON response for development."""
        await asyncio.sleep(0.5)
        # Check for keywords to return appropriate mock JSON
        content = '{"status": "success", "message": "Stubbed response"}'
        if "ideation" in prompt.lower():
            content = '{"idea": "AI SaaS for Hackathons", "score": 9.2, "feasibility": "High"}'
        elif "architecture" in prompt.lower():
            content = '{"stack": "Next.js, FastAPI, SQLite", "components": ["Auth", "API", "DB"]}'
            
        return {
            "content": content,
            "input_tokens": len(prompt.split()) * 1.3,
            "output_tokens": 50,
            "model": f"{model}-stub"
        }


class AnthropicClient(LLMClient):
    """Client for Anthropic models."""
    
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

    async def complete(self, prompt: str, model: str, **kwargs) -> Dict[str, Any]:
        if self.stub_mode:
            return await self._stub_response(prompt, model)
        
        try:
            response = await self.client.messages.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=kwargs.get("max_tokens", 2000),
                temperature=kwargs.get("temperature", 0.7),
            )
            
            return {
                "content": response.content[0].text,
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
                "model": model
            }
        except Exception as e:
            logger.error(f"Anthropic API Error: {e}")
            raise

    async def _stub_response(self, prompt: str, model: str) -> Dict[str, Any]:
        """Return a mock JSON response for development."""
        await asyncio.sleep(0.5)
        return {
            "content": '{"status": "success", "message": "Stubbed Anthropic response"}',
            "input_tokens": len(prompt.split()) * 1.3,
            "output_tokens": 50,
            "model": f"{model}-stub"
        }


def get_llm_client(model: str) -> LLMClient:
    """Factory function to get appropriate LLM client."""
    if "gpt" in model.lower():
        return OpenAIClient()
    elif "claude" in model.lower():
        return AnthropicClient()
    else:
        # Default to OpenAI
        return OpenAIClient()
