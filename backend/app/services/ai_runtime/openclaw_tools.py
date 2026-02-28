from typing import Type, Optional, Any
from pydantic import BaseModel, Field
from crewai.tools import BaseTool
from ...integrations.eido_webhook import EidoWebhookClient
from ...logger import get_logger

logger = get_logger(__name__)

class MoltbookPostInput(BaseModel):
    """Input for MoltbookPostTool."""
    title: str = Field(..., description="Title of the post")
    content: str = Field(..., description="Markdown content")
    submolt: str = Field(..., description="Target submolt like lablab")

class MoltbookPostTool(BaseTool):
    name: str = "post_to_moltbook"
    description: str = "Posts an update or finding to Moltbook. Use this to share progress or research results with the community."
    args_schema: Type[BaseModel] = MoltbookPostInput
    client: EidoWebhookClient = Field(default_factory=EidoWebhookClient)

    def _run(self, title: str, content: str, submolt: str = "lablab") -> str:
        # Wrap the async call
        import asyncio
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        try:
            result = loop.run_until_complete(self.client.post_to_moltbook(title, content, submolt))
            return f"Successfully posted to Moltbook. Post ID: {result.get('post_id', 'unknown')}"
        except Exception as e:
            logger.error(f"MoltbookPostTool failed: {e}")
            return f"Error posting to Moltbook: {str(e)}"

class TelegramNotifyInput(BaseModel):
    """Input for TelegramNotifyTool."""
    message: str = Field(..., description="The message to send to the user on Telegram.")

class TelegramNotifyTool(BaseTool):
    name: str = "notify_user"
    description: str = "Sends a notification message to the user via Telegram. Use this to report major milestones or ask for feedback."
    args_schema: Type[BaseModel] = TelegramNotifyInput
    client: EidoWebhookClient = Field(default_factory=EidoWebhookClient)

    def _run(self, message: str) -> str:
        import asyncio
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
        try:
            loop.run_until_complete(self.client.send_notification(message))
            return "Notification sent successfully."
        except Exception as e:
            return f"Error sending notification: {str(e)}"

class WebSearchInput(BaseModel):
    """Input for WebSearchTool."""
    query: str = Field(..., description="Search query")
    platform: str = Field(..., description="Platform like reddit or hackernews")

class WebSearchTool(BaseTool):
    name: str = "search_web"
    description: str = "Researches market data and pain points on various platforms. Use EXACT format: search_web({'query': 'your search', 'platform': 'reddit'})"
    args_schema: Type[BaseModel] = WebSearchInput
    client: EidoWebhookClient = Field(default_factory=EidoWebhookClient)

    def _run(self, query: str, platform: str = "general") -> str:
        # In a real implementation, this would either call an OpenClaw skill 
        # or use a direct search API like Serper/Tavily.
        # For now, we'll route it through Eido's search capability.
        import asyncio
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
        try:
            # We assume Eido has a search endpoint that proxies to a search engine
            payload = {"type": "search", "query": query, "platform": platform}
            result = loop.run_until_complete(self.client._post("/search", payload))
            return str(result.get("results", "No results found."))
        except Exception as e:
            return f"Error performing web search: {str(e)}"


class WebFetchInput(BaseModel):
    """Input for WebFetchTool."""
    url: str = Field(..., description="The URL to fetch content from")
    max_chars: int = Field(10000, description="Maximum characters to return (default: 10,000)")

class WebFetchTool(BaseTool):
    name: str = "web_fetch"
    description: str = "Fetches the content of a specific web page. Use EXACT format: web_fetch({'url': 'https://example.com', 'max_chars': 10000})"
    args_schema: Type[BaseModel] = WebFetchInput
    client: EidoWebhookClient = Field(default_factory=EidoWebhookClient)

    def _run(self, url: str, max_chars: int = 10000) -> str:
        import asyncio
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
        try:
            # Route through Eido's fetch capability
            payload = {"type": "fetch", "url": url, "max_chars": max_chars}
            result = loop.run_until_complete(self.client._post("/fetch", payload))
            
            content = result.get("content", "")
            if len(content) > max_chars:
                content = content[:max_chars] + f"... (truncated from {len(content)} chars)"
            
            return content if content else "No content found or URL not accessible."
        except Exception as e:
            return f"Error fetching URL {url}: {str(e)}"

# --- E2B Sandbox Tools ---

class SandboxWriteFileInput(BaseModel):
    """Input for SandboxWriteFileTool."""
    path: str = Field(..., description="The path of the file relative to the workspace root.")
    content: str = Field(..., description="The content to write to the file.")

class SandboxWriteFileTool(BaseTool):
    name: str = "write_file"
    description: str = "Writes content to a file in the secure cloud workspace. Use this to create or update source code."
    args_schema: Type[BaseModel] = SandboxWriteFileInput
    sandbox_manager: Any = Field(default=None) # Set at runtime in CrewAIService

    def _run(self, path: str, content: str) -> str:
        if not self.sandbox_manager:
            return "Error: Sandbox not available."
        
        success = self.sandbox_manager.write_file(path, content)
        if success:
            return f"Successfully wrote to {path}."
        else:
            return f"Failed to write to {path}."

class SandboxReadFileInput(BaseModel):
    """Input for SandboxReadFileTool."""
    path: str = Field(..., description="The path of the file to read.")

class SandboxReadFileTool(BaseTool):
    name: str = "read_file"
    description: str = "Reads the content of a file from the workspace. Use this to inspect existing code."
    args_schema: Type[BaseModel] = SandboxReadFileInput
    sandbox_manager: Any = Field(default=None)

    def _run(self, path: str) -> str:
        if not self.sandbox_manager:
            return "Error: Sandbox not available."
        
        content = self.sandbox_manager.read_file(path)
        if content is not None:
            return content
        else:
            return f"Error: Could not read {path}."

class SandboxRunCommandInput(BaseModel):
    """Input for SandboxRunCommandTool."""
    command: str = Field(..., description="The shell command to execute.")
    cwd: Optional[str] = Field(None, description="Optional directory to run the command in.")

class SandboxRunCommandTool(BaseTool):
    name: str = "run_command"
    description: str = "Executes a shell command in the cloud workspace (e.g., 'npm install', 'npm run build'). Returns stdout and stderr."
    args_schema: Type[BaseModel] = SandboxRunCommandInput
    sandbox_manager: Any = Field(default=None)

    def _run(self, command: str, cwd: Optional[str] = None) -> str:
        if not self.sandbox_manager:
            return "Error: Sandbox not available."
        
        result = self.sandbox_manager.run_command(command, cwd)
        output = f"Exit Code: {result['exit_code']}\n"
        if result['stdout']:
            output += f"STDOUT:\n{result['stdout']}\n"
        if result['stderr']:
            output += f"STDERR:\n{result['stderr']}\n"
        
        return output
