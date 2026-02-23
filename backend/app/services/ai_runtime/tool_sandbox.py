"""Tool Sandbox - safe execution environment for OpenClaw tools."""

import os
import asyncio
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime

from ...config.settings import config
from ...logging import get_logger
from ...exceptions import EidoException

logger = get_logger(__name__)


class ToolSandboxError(EidoException):
    """Raised when tool execution violates safety constraints."""
    def __init__(self, message: str):
        super().__init__(message, code="TOOL_SANDBOX_ERROR", status_code=400)


class SafeToolExecutor:
    """Enforces safety constraints on tool execution."""
    
    def __init__(self, mvp_id: int):
        self.mvp_id = mvp_id
        self.invocation_count = 0
        self.allowed_paths = [Path(p).resolve() for p in config.ALLOWED_TOOL_PATHS]
        self.max_invocations = config.MAX_TOOL_INVOCATIONS
        self.max_file_size_bytes = config.MAX_FILE_SIZE_MB * 1024 * 1024
        self.timeout = config.TOOL_EXECUTION_TIMEOUT
        self.allowed_commands = set(config.ALLOWED_COMMANDS)
    
    def _validate_path(self, path: str) -> Path:
        """Validate path is within allowed directories."""
        resolved_path = Path(path).resolve()
        
        # Check if path is within any allowed directory
        for allowed_path in self.allowed_paths:
            try:
                resolved_path.relative_to(allowed_path)
                return resolved_path
            except ValueError:
                continue
        
        raise ToolSandboxError(
            f"Path '{path}' is outside allowed directories: {self.allowed_paths}"
        )
    
    def _validate_file_size(self, path: Path) -> None:
        """Validate file size is within limits."""
        if path.exists() and path.is_file():
            size = path.stat().st_size
            if size > self.max_file_size_bytes:
                raise ToolSandboxError(
                    f"File size {size} bytes exceeds limit of {self.max_file_size_bytes} bytes"
                )
    
    def _validate_command(self, command: str) -> None:
        """Validate command is in whitelist."""
        cmd_parts = command.split()
        if not cmd_parts:
            raise ToolSandboxError("Empty command")
        
        base_command = cmd_parts[0]
        if base_command not in self.allowed_commands:
            raise ToolSandboxError(
                f"Command '{base_command}' not in whitelist: {self.allowed_commands}"
            )
    
    def _check_invocation_limit(self) -> None:
        """Check if invocation limit has been reached."""
        if self.invocation_count >= self.max_invocations:
            raise ToolSandboxError(
                f"Tool invocation limit reached: {self.max_invocations}"
            )
    
    async def execute_tool(
        self,
        tool_name: str,
        tool_args: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Execute tool with safety constraints.
        
        Args:
            tool_name: Name of the tool to execute
            tool_args: Tool arguments
        
        Returns:
            Tool execution result
        
        Raises:
            ToolSandboxError: If safety constraints are violated
        """
        self._check_invocation_limit()
        self.invocation_count += 1
        
        logger.info(
            f"Executing tool '{tool_name}' (invocation {self.invocation_count}/{self.max_invocations})",
            extra={"mvp_id": self.mvp_id, "tool_name": tool_name}
        )
        
        try:
            # Validate tool-specific constraints
            if tool_name == "read_file":
                return await self._execute_read_file(tool_args)
            elif tool_name == "write_file":
                return await self._execute_write_file(tool_args)
            elif tool_name == "execute_command":
                return await self._execute_command(tool_args)
            elif tool_name == "list_directory":
                return await self._execute_list_directory(tool_args)
            else:
                raise ToolSandboxError(f"Unknown tool: {tool_name}")
        
        except ToolSandboxError:
            raise
        except Exception as e:
            logger.error(f"Tool execution failed: {e}", exc_info=True)
            raise ToolSandboxError(f"Tool execution failed: {e}")
    
    async def _execute_read_file(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Execute read_file tool."""
        path_str = args.get("path")
        if not path_str:
            raise ToolSandboxError("Missing 'path' argument")
        
        path = self._validate_path(path_str)
        self._validate_file_size(path)
        
        if not path.exists():
            raise ToolSandboxError(f"File does not exist: {path}")
        
        if not path.is_file():
            raise ToolSandboxError(f"Path is not a file: {path}")
        
        # Read file with timeout
        try:
            content = await asyncio.wait_for(
                asyncio.to_thread(path.read_text),
                timeout=self.timeout
            )
            
            return {
                "success": True,
                "content": content,
                "path": str(path),
            }
        except asyncio.TimeoutError:
            raise ToolSandboxError(f"Read operation timed out after {self.timeout}s")
    
    async def _execute_write_file(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Execute write_file tool."""
        path_str = args.get("path")
        content = args.get("content")
        
        if not path_str:
            raise ToolSandboxError("Missing 'path' argument")
        if content is None:
            raise ToolSandboxError("Missing 'content' argument")
        
        path = self._validate_path(path_str)
        
        # Check content size
        content_size = len(content.encode('utf-8'))
        if content_size > self.max_file_size_bytes:
            raise ToolSandboxError(
                f"Content size {content_size} bytes exceeds limit of {self.max_file_size_bytes} bytes"
            )
        
        # Write file with timeout
        try:
            await asyncio.wait_for(
                asyncio.to_thread(path.write_text, content),
                timeout=self.timeout
            )
            
            return {
                "success": True,
                "path": str(path),
                "bytes_written": content_size,
            }
        except asyncio.TimeoutError:
            raise ToolSandboxError(f"Write operation timed out after {self.timeout}s")
    
    async def _execute_command(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Execute command tool."""
        command = args.get("command")
        if not command:
            raise ToolSandboxError("Missing 'command' argument")
        
        self._validate_command(command)
        
        # Execute command with timeout
        try:
            process = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=self.timeout
            )
            
            return {
                "success": process.returncode == 0,
                "returncode": process.returncode,
                "stdout": stdout.decode('utf-8'),
                "stderr": stderr.decode('utf-8'),
            }
        except asyncio.TimeoutError:
            raise ToolSandboxError(f"Command execution timed out after {self.timeout}s")
    
    async def _execute_list_directory(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Execute list_directory tool."""
        path_str = args.get("path")
        if not path_str:
            raise ToolSandboxError("Missing 'path' argument")
        
        path = self._validate_path(path_str)
        
        if not path.exists():
            raise ToolSandboxError(f"Directory does not exist: {path}")
        
        if not path.is_dir():
            raise ToolSandboxError(f"Path is not a directory: {path}")
        
        # List directory with timeout
        try:
            entries = await asyncio.wait_for(
                asyncio.to_thread(lambda: [str(p) for p in path.iterdir()]),
                timeout=self.timeout
            )
            
            return {
                "success": True,
                "path": str(path),
                "entries": entries,
                "count": len(entries),
            }
        except asyncio.TimeoutError:
            raise ToolSandboxError(f"List operation timed out after {self.timeout}s")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get execution statistics."""
        return {
            "invocation_count": self.invocation_count,
            "max_invocations": self.max_invocations,
            "remaining_invocations": self.max_invocations - self.invocation_count,
        }
