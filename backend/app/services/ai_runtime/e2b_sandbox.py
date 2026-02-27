from typing import List, Dict, Any, Optional
from e2b_code_interpreter import Sandbox
from ...config.settings import config
from ...logger import get_logger

logger = get_logger(__name__)

class E2BSandboxManager:
    """Manages E2B Sandbox lifecycle for coding and QA tasks."""

    def __init__(self):
        self.api_key = config.E2B_API_KEY
        self.sandbox: Optional[Sandbox] = None
        self.workspace_path = "/home/user/workspace"

    def __enter__(self):
        self.sandbox = Sandbox(api_key=self.api_key)
        # Initialize workspace
        self.sandbox.commands.run(f"mkdir -p {self.workspace_path}")
        logger.info(f"E2B Sandbox created: {self.sandbox.id}")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.sandbox:
            logger.info(f"Closing E2B Sandbox: {self.sandbox.id}")
            self.sandbox.close()
            self.sandbox = None

    def write_file(self, relative_path: str, content: str) -> bool:
        """Write a file to the sandbox workspace."""
        if not self.sandbox:
            raise RuntimeError("Sandbox not initialized")
        
        full_path = f"{self.workspace_path}/{relative_path.lstrip('/')}"
        # Ensure parent directories exist
        dir_path = "/".join(full_path.split("/")[:-1])
        self.sandbox.commands.run(f"mkdir -p {dir_path}")
        
        try:
            self.sandbox.files.write(full_path, content)
            return True
        except Exception as e:
            logger.error(f"E2B write_file failed: {e}")
            return False

    def read_file(self, relative_path: str) -> Optional[str]:
        """Read a file from the sandbox workspace."""
        if not self.sandbox:
            raise RuntimeError("Sandbox not initialized")
        
        full_path = f"{self.workspace_path}/{relative_path.lstrip('/')}"
        try:
            return self.sandbox.files.read(full_path)
        except Exception as e:
            logger.error(f"E2B read_file failed: {e}")
            return None

    def run_command(self, command: str, cwd: Optional[str] = None) -> Dict[str, Any]:
        """Run a shell command in the sandbox workspace."""
        if not self.sandbox:
            raise RuntimeError("Sandbox not initialized")
        
        exec_cwd = f"{self.workspace_path}/{cwd.lstrip('/')}" if cwd else self.workspace_path
        
        logger.debug(f"E2B running command: {command} in {exec_cwd}")
        execution = self.sandbox.commands.run(command, cwd=exec_cwd)
        
        return {
            "stdout": execution.stdout,
            "stderr": execution.stderr,
            "exit_code": execution.exit_code,
            "success": execution.exit_code == 0
        }

    def get_hostname(self, port: int = 3000) -> str:
        """Get the public hostname for a specific port in the sandbox."""
        if not self.sandbox:
            raise RuntimeError("Sandbox not initialized")
        return f"{port}-{self.sandbox.id}.e2b.dev"
