from typing import List, Dict, Any, Optional
import os
import shutil
import subprocess
from e2b_code_interpreter import Sandbox
from e2b.connection_config import ConnectionConfig
from ...config.settings import config
from ...logger import get_logger

logger = get_logger(__name__)

class E2BSandboxManager:
    """
    Manages Sandbox lifecycle for coding and QA tasks.
    Supports E2B cloud and Local Filesystem fallback.
    """

    def __init__(self):
        self.api_key = config.E2B_API_KEY
        self.sandbox: Optional[Sandbox] = None
        self.is_local = not bool(self.api_key)
        self.workspace_path = "/home/user/workspace" if not self.is_local else os.path.abspath("./workspace")

    def __enter__(self):
        if self.is_local:
            logger.info(f"Using Local Sandbox fallback at: {self.workspace_path}")
            os.makedirs(self.workspace_path, exist_ok=True)
        else:
            try:
                self.sandbox = Sandbox(connection_config=ConnectionConfig(api_key=self.api_key))
                # Initialize workspace
                self.sandbox.commands.run(f"mkdir -p {self.workspace_path}")
                logger.info(f"E2B Sandbox created: {self.sandbox.id}")
            except Exception as e:
                logger.warning(f"Failed to create E2B Sandbox: {e}. Falling back to local mode.")
                self.is_local = True
                self.workspace_path = os.path.abspath("./workspace")
                os.makedirs(self.workspace_path, exist_ok=True)
        
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.sandbox:
            logger.info(f"Closing E2B Sandbox: {self.sandbox.id}")
            self.sandbox.close()
            self.sandbox = None

    def write_file(self, relative_path: str, content: str) -> bool:
        """Write a file to the sandbox workspace."""
        if self.is_local:
            full_path = os.path.join(self.workspace_path, relative_path.lstrip("/"))
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            try:
                with open(full_path, "w", encoding="utf-8") as f:
                    f.write(content)
                return True
            except Exception as e:
                logger.error(f"Local write_file failed: {e}")
                return False
        else:
            if not self.sandbox:
                raise RuntimeError("Sandbox not initialized")
            
            full_path = f"{self.workspace_path}/{relative_path.lstrip('/')}"
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
        if self.is_local:
            full_path = os.path.join(self.workspace_path, relative_path.lstrip("/"))
            if not os.path.exists(full_path):
                return None
            try:
                with open(full_path, "r", encoding="utf-8") as f:
                    return f.read()
            except Exception as e:
                logger.error(f"Local read_file failed: {e}")
                return None
        else:
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
        if self.is_local:
            exec_cwd = os.path.join(self.workspace_path, cwd.lstrip("/")) if cwd else self.workspace_path
            logger.debug(f"Local running command: {command} in {exec_cwd}")
            
            try:
                # Use subprocess for local command execution
                # WARNING: This is dangerous in production but fine for local dev fallback
                process = subprocess.run(
                    command,
                    cwd=exec_cwd,
                    shell=True,
                    capture_output=True,
                    text=True
                )
                return {
                    "stdout": process.stdout,
                    "stderr": process.stderr,
                    "exit_code": process.returncode,
                    "success": process.returncode == 0
                }
            except Exception as e:
                return {
                    "stdout": "",
                    "stderr": str(e),
                    "exit_code": 1,
                    "success": False
                }
        else:
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
        if self.is_local:
            return f"localhost:{port}"
        
        if not self.sandbox:
            raise RuntimeError("Sandbox not initialized")
        return f"{port}-{self.sandbox.id}.e2b.dev"
