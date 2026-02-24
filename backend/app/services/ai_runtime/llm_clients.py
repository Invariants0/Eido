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
        if "ideation" in prompt.lower() or "test" in prompt.lower():
            content = '{"name": "EIDO-Test", "idea": "AI SaaS for Hackathons", "score": 9.2, "feasibility": "High", "status": "active"}'
        elif "architecture" in prompt.lower():
            content = '{"name": "EIDO-Arch", "stack": "Next.js, FastAPI, SQLite", "components": ["Auth", "API", "DB"], "status": "planning"}'
            
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


class GroqClient(LLMClient):
    """Client for Groq models (OpenAI-compatible)."""
    
    def __init__(self):
        self.api_key = config.GROQ_API_KEY
        if not self.api_key:
            logger.warning("GROQ_API_KEY not configured, using stub mode")
            self.stub_mode = True
        else:
            self.stub_mode = False
            try:
                import openai
                self.client = openai.AsyncOpenAI(
                    api_key=self.api_key,
                    base_url="https://api.groq.com/openai/v1"
                )
            except ImportError:
                logger.warning("openai package not installed (needed for Groq), using stub mode")
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
            logger.error(f"Groq API Error: {e}")
            raise

    async def _stub_response(self, prompt: str, model: str) -> Dict[str, Any]:
        """Return a mock JSON response for development."""
        await asyncio.sleep(0.5)
        return {
            "content": '{"status": "success", "message": "Stubbed Groq response"}',
            "input_tokens": len(prompt.split()) * 1.3,
            "output_tokens": 50,
            "model": f"{model}-stub"
        }


class GeminiClient(LLMClient):
    """Client for Google Gemini models (OpenAI-compatible)."""
    
    def __init__(self):
        self.api_key = config.GEMINI_API_KEY
        if not self.api_key:
            logger.warning("GEMINI_API_KEY not configured, using stub mode")
            self.stub_mode = True
        else:
            self.stub_mode = False
            try:
                import openai
                self.client = openai.AsyncOpenAI(
                    api_key=self.api_key,
                    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
                )
            except ImportError:
                logger.warning("openai package not installed (needed for Gemini), using stub mode")
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
            logger.error(f"Gemini API Error: {e}")
            raise

    async def _stub_response(self, prompt: str, model: str) -> Dict[str, Any]:
        """Return a mock JSON response for development."""
        await asyncio.sleep(0.5)
        return {
            "content": '{"status": "success", "message": "Stubbed Gemini response"}',
            "input_tokens": len(prompt.split()) * 1.3,
            "output_tokens": 50,
            "model": f"{model}-stub"
        }


class OllamaClient(LLMClient):
    """Client for Ollama local models (OpenAI-compatible API)."""
    
    def __init__(self):
        self.base_url = config.OLLAMA_BASE_URL
        self.stub_mode = False
        try:
            import openai
            self.client = openai.AsyncOpenAI(
                api_key="ollama",  # Ollama doesn't need a real key
                base_url=self.base_url
            )
        except ImportError:
            logger.warning("openai package not installed (needed for Ollama), using stub mode")
            self.stub_mode = True

    async def complete(self, prompt: str, model: str, **kwargs) -> Dict[str, Any]:
        if self.stub_mode:
            return await self._stub_response(prompt, model)
        
        # Strip 'ollama/' prefix if present (e.g., 'ollama/llama3' -> 'llama3')
        clean_model = model.replace("ollama/", "") if model.startswith("ollama/") else model
        
        try:
            response = await self.client.chat.completions.create(
                model=clean_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=kwargs.get("temperature", 0.7),
                max_tokens=kwargs.get("max_tokens", 2000),
            )
            
            return {
                "content": response.choices[0].message.content,
                "input_tokens": response.usage.prompt_tokens if response.usage else 0,
                "output_tokens": response.usage.completion_tokens if response.usage else 0,
                "model": model
            }
        except Exception as e:
            logger.error(f"Ollama API Error: {e}")
            raise

    async def _stub_response(self, prompt: str, model: str) -> Dict[str, Any]:
        await asyncio.sleep(0.5)
        return {
            "content": '{"status": "success", "message": "Stubbed Ollama response"}',
            "input_tokens": len(prompt.split()) * 1.3,
            "output_tokens": 50,
            "model": f"{model}-stub"
        }


def get_llm_client(model: str) -> LLMClient:
    """Factory function to get appropriate LLM client."""
    model_lower = model.lower()
    
    # Check for Ollama (local) models — prefix 'ollama/' in model name
    if model_lower.startswith("ollama/") or model_lower.startswith("ollama_"):
        return OllamaClient()
    
    # Check for Gemini specific model names
    if "gemini" in model_lower:
        return GeminiClient()
    
    # Check for Groq/Llama model names - route to Groq if key is available
    if any(m in model_lower for m in ["llama", "mixtral", "gemma", "qwen", "deepseek"]) and config.GROQ_API_KEY:
        return GroqClient()
    
    if "gpt" in model_lower:
        return OpenAIClient()
    elif "claude" in model_lower:
        return AnthropicClient()
    else:
        # Default to OpenAI
        return OpenAIClient()
