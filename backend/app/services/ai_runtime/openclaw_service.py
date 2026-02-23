"""OpenClaw Service - manages OpenClaw tool execution via SafeToolExecutor."""

from typing import Dict, Any, List, Optional

from ...logging import get_logger
from .tool_sandbox import SafeToolExecutor, ToolSandboxError

logger = get_logger(__name__)


class OpenClawService:
    """Manages OpenClaw tool execution with safety constraints."""
    
    def __init__(self, mvp_id: int):
        self.mvp_id = mvp_id
        self.tool_executor = SafeToolExecutor(mvp_id)
        self.execution_log: List[Dict[str, Any]] = []
    
    async def execute_tool(
        self,
        tool_name: str,
        tool_args: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Execute OpenClaw tool with safety constraints.
        
        Args:
            tool_name: Name of the tool
            tool_args: Tool arguments
        
        Returns:
            Tool execution result
        """
        logger.info(
            f"OpenClaw executing tool: {tool_name}",
            extra={"mvp_id": self.mvp_id, "tool_name": tool_name}
        )
        
        try:
            result = await self.tool_executor.execute_tool(tool_name, tool_args)
            
            # Log execution
            self.execution_log.append({
                "tool_name": tool_name,
                "tool_args": tool_args,
                "result": result,
                "success": True,
            })
            
            logger.info(f"Tool '{tool_name}' executed successfully")
            return result
        
        except ToolSandboxError as e:
            logger.error(f"Tool execution failed: {e}")
            
            # Log failure
            self.execution_log.append({
                "tool_name": tool_name,
                "tool_args": tool_args,
                "error": str(e),
                "success": False,
            })
            
            raise
    
    async def execute_tool_sequence(
        self,
        tools: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """
        Execute a sequence of tools.
        
        Args:
            tools: List of tool specifications with 'name' and 'args'
        
        Returns:
            List of execution results
        """
        results = []
        
        for tool_spec in tools:
            tool_name = tool_spec.get("name")
            tool_args = tool_spec.get("args", {})
            
            if not tool_name:
                logger.warning("Skipping tool with no name")
                continue
            
            try:
                result = await self.execute_tool(tool_name, tool_args)
                results.append(result)
            except ToolSandboxError as e:
                logger.error(f"Tool sequence failed at '{tool_name}': {e}")
                # Continue with remaining tools or abort?
                # For now, abort on first failure
                raise
        
        return results
    
    def get_execution_log(self) -> List[Dict[str, Any]]:
        """Get complete execution log."""
        return self.execution_log
    
    def get_stats(self) -> Dict[str, Any]:
        """Get execution statistics."""
        tool_stats = self.tool_executor.get_stats()
        
        return {
            **tool_stats,
            "total_executions": len(self.execution_log),
            "successful_executions": sum(1 for log in self.execution_log if log.get("success")),
            "failed_executions": sum(1 for log in self.execution_log if not log.get("success")),
        }
