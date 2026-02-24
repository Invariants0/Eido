"""Context Manager - manages context collection and compression for LLM prompts."""

from typing import Dict, Any, List, Optional
from pathlib import Path

from ...config.settings import config
from ...logger import get_logger
from ...models.mvp import MVP

logger = get_logger(__name__)


class ContextManager:
    """Manages context collection and size limits for LLM prompts."""
    
    def __init__(self, mvp: MVP):
        self.mvp = mvp
        self.max_context_tokens = config.MAX_CONTEXT_TOKENS
        self.max_prompt_size = config.MAX_PROMPT_SIZE
    
    def _estimate_tokens(self, text: str) -> int:
        """Estimate token count (rough approximation: ~1.3 tokens per word)."""
        return int(len(text.split()) * 1.3)
    
    def build_stage_context(self, stage_name: str) -> Dict[str, Any]:
        """
        Build context for a specific stage.
        
        Args:
            stage_name: Name of the pipeline stage
        
        Returns:
            Context dictionary with limited size
        """
        logger.info(f"Building context for stage: {stage_name}")
        
        context = {
            "mvp_id": self.mvp.id,
            "mvp_name": self.mvp.name,
            "current_stage": stage_name,
            "current_status": self.mvp.status.value,
            "idea_summary": self.mvp.idea_summary or "No idea summary provided",
        }
        
        # Add stage-specific context
        if stage_name == "ideation":
            context.update(self._get_ideation_context())
        elif stage_name == "architecture":
            context.update(self._get_architecture_context())
        elif stage_name == "building":
            context.update(self._get_building_context())
        elif stage_name == "deployment":
            context.update(self._get_deployment_context())
        elif stage_name == "tokenization":
            context.update(self._get_tokenization_context())
        
        # Validate context size
        context_str = str(context)
        token_count = self._estimate_tokens(context_str)
        
        if token_count > self.max_context_tokens:
            logger.warning(
                f"Context size ({token_count} tokens) exceeds limit ({self.max_context_tokens}), "
                f"applying compression"
            )
            context = self._compress_context(context)
        
        logger.info(f"Context built with ~{token_count} tokens")
        return context
    
    def _get_ideation_context(self) -> Dict[str, Any]:
        """Get context specific to ideation stage."""
        return {
            "task": "Generate comprehensive idea analysis and business plan",
            "requirements": [
                "Market analysis",
                "Target audience identification",
                "Value proposition",
                "Revenue model",
                "Competitive landscape",
            ],
        }
    
    def _get_architecture_context(self) -> Dict[str, Any]:
        """Get context specific to architecture stage."""
        return {
            "task": "Design technical architecture and system components",
            "requirements": [
                "Technology stack selection",
                "System architecture diagram",
                "Database schema",
                "API design",
                "Security considerations",
            ],
            "previous_output": "Ideation results would be loaded here",
        }
    
    def _get_building_context(self) -> Dict[str, Any]:
        """Get context specific to building stage."""
        return {
            "task": "Generate implementation code and assets",
            "requirements": [
                "Frontend implementation",
                "Backend implementation",
                "Database setup",
                "API endpoints",
                "Basic testing",
            ],
            "previous_output": "Architecture results would be loaded here",
        }
    
    def _get_deployment_context(self) -> Dict[str, Any]:
        """Get context specific to deployment stage."""
        return {
            "task": "Deploy application to production environment",
            "requirements": [
                "Build artifacts",
                "Deploy to hosting",
                "Configure domain",
                "Setup monitoring",
            ],
            "previous_output": "Building results would be loaded here",
        }
    
    def _get_tokenization_context(self) -> Dict[str, Any]:
        """Get context specific to tokenization stage."""
        return {
            "task": "Create and deploy project token on Surge",
            "requirements": [
                "Token metadata",
                "Initial supply",
                "Deploy to Surge testnet/mainnet",
                "Configure token parameters",
            ],
            "deployment_url": self.mvp.deployment_url or "Not yet deployed",
        }
    
    def _compress_context(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compress context to fit within token limits.
        
        Future: Integrate with Toon for intelligent compression.
        """
        logger.info("Applying context compression")
        
        # Simple compression: truncate long strings
        compressed = {}
        for key, value in context.items():
            if isinstance(value, str) and len(value) > 500:
                compressed[key] = value[:500] + "... [truncated]"
            elif isinstance(value, list) and len(value) > 10:
                compressed[key] = value[:10] + ["... [truncated]"]
            else:
                compressed[key] = value
        
        return compressed
    
    def build_prompt(
        self,
        stage_name: str,
        system_prompt: str,
        user_prompt_template: str,
    ) -> str:
        """
        Build complete prompt with context.
        
        Args:
            stage_name: Pipeline stage name
            system_prompt: System-level instructions
            user_prompt_template: User prompt template with {context} placeholder
        
        Returns:
            Complete prompt string
        """
        context = self.build_stage_context(stage_name)
        
        # Format user prompt with context
        user_prompt = user_prompt_template.format(context=context)
        
        # Combine system and user prompts
        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        
        # Validate total prompt size
        prompt_size = len(full_prompt)
        if prompt_size > self.max_prompt_size:
            logger.warning(
                f"Prompt size ({prompt_size} chars) exceeds limit ({self.max_prompt_size})"
            )
            # Truncate if necessary
            full_prompt = full_prompt[:self.max_prompt_size]
        
        logger.info(f"Built prompt with {prompt_size} characters")
        return full_prompt
    
    def get_context_stats(self) -> Dict[str, Any]:
        """Get context statistics."""
        return {
            "max_context_tokens": self.max_context_tokens,
            "max_prompt_size": self.max_prompt_size,
        }
