import yaml
from pathlib import Path
from typing import Dict, Any, Optional
from dataclasses import dataclass
from ...logger import get_logger
from ...exceptions import EidoException

logger = get_logger(__name__)

@dataclass
class SkillProfile:
    role_id: str
    name: str
    description: str
    goal: str
    allowed_tools: list
    version: str
    content_body: str

class SkillLoader:
    """Utility to load and parse agent skill definitions from SKILL.md files."""
    
    def __init__(self, skills_base_path: Optional[Path] = None):
        if skills_base_path:
            self.skills_dir = skills_base_path
        else:
            # Default to backend/app/skills/
            current_dir = Path(__file__).resolve().parent
            self.skills_dir = current_dir.parent.parent / "skills"
            
    def load_skill(self, role_id: str) -> SkillProfile:
        """Loads and parses a SKILL.md file for a given role_id."""
        folder_name = role_id.replace("_", "-")
        skill_file = self.skills_dir / folder_name / "SKILL.md"
        
        if not skill_file.exists():
            raise EidoException(
                f"Skill definition not found for role '{role_id}' at {skill_file}",
                code="SKILL_NOT_FOUND",
                status_code=404
            )
            
        try:
            content = skill_file.read_text(encoding="utf-8")
        except Exception as e:
            raise EidoException(f"Failed to read skill file {skill_file}: {e}")
            
        # Parse YAML frontmatter
        meta = {}
        body = content
        if content.startswith("---"):
            try:
                parts = content.split("---", 2)
                if len(parts) >= 3:
                    meta = yaml.safe_load(parts[1]) or {}
                    body = parts[2].strip()
            except Exception as e:
                logger.error(f"YAML parsing failed for {role_id}: {e}")
                
        # Extract fields
        name = meta.get("name", role_id).replace("-", " ").title()
        description = meta.get("description", "Expert specialist.")
        allowed_tools = meta.get("allowed-tools", "").split() if isinstance(meta.get("allowed-tools"), str) else meta.get("allowed-tools", [])
        version = str(meta.get("version", "1.0"))
        
        # Extract goal (first section before any markdown headers)
        goal_text = body.split("##")[0].strip()
        if goal_text.startswith("# "):
            lines = goal_text.split("\n", 1)
            if len(lines) > 1:
                goal_text = lines[1].strip()
                
        if not goal_text:
            goal_text = f"Execute tasks effectively as a {name}."
            
        return SkillProfile(
            role_id=role_id,
            name=name,
            description=description,
            goal=goal_text,
            allowed_tools=allowed_tools,
            version=version,
            content_body=body
        )
        
    def list_available_skills(self) -> list:
        """Lists all available skill IDs based on folder names."""
        if not self.skills_dir.exists():
            return []
        return [d.name.replace("-", "_") for d in self.skills_dir.iterdir() if d.is_dir() and (d / "SKILL.md").exists()]
