from typing import Type, Optional
from pydantic import BaseModel, Field
from crewai.tools import BaseTool
from ...integrations.eido_webhook import EidoWebhookClient
from ...logger import get_logger

logger = get_logger(__name__)

class MoltbookPostInput(BaseModel):
    """Input for MoltbookPostTool."""
    title: str = Field(..., description="The title of the Moltbook post.")
    content: str = Field(..., description="The full markdown content of the post.")
    submolt: str = Field("lablab", description="The submolt to post in (default: lablab).")

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
    query: str = Field(..., description="The search query to execute.")
    platform: Optional[str] = Field(None, description="Optional platform to restrict search (e.g., 'reddit', 'hackernews', 'producthunt').")

class WebSearchTool(BaseTool):
    name: str = "web_search"
    description: str = "Performs a web search to find market data, competitor info, or user pain points. Can target specific platforms like Reddit or Hacker News."
    args_schema: Type[BaseModel] = WebSearchInput
    client: EidoWebhookClient = Field(default_factory=EidoWebhookClient)

    def _run(self, query: str, platform: Optional[str] = None) -> str:
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
