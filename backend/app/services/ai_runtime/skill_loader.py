import os
import yaml
from pathlib import Path
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
from ...logger import get_logger
from ...exceptions import EidoException

logger = get_logger(__name__)

class SkillNotFoundError(EidoException):
    """Raised when a specific agent skill definition cannot be found."""
    def __init__(self, role_id: str):
        super().__init__(
            f"Skill definition not found for role: {role_id}", 
            code="SKILL_NOT_FOUND", 
            status_code=404
        )

@dataclass
class SkillProfile:
    """Structured data for an agent skill."""
    role_id: str
    name: str
    description: str
    goal: str
    allowed_tools: List[str] = field(default_factory=list)
    raw_content: str = ""

class SkillLoader:
    """Loads and parses agent skill definitions from SKILL.md files."""

    def __init__(self, skills_dir: Optional[str] = None):
        if skills_dir is None:
            # Default to the app/skills directory relative to this file
            self.skills_dir = Path(__file__).parent.parent.parent / "skills"
        else:
            self.skills_dir = Path(skills_dir)
        
        logger.info(f"SkillLoader initialized with directory: {self.skills_dir}")

    def load_skill(self, role_id: str) -> SkillProfile:
        """
        Load and parse a specific skill into a SkillProfile dataclass.
        
        Args:
            role_id: The ID of the role (matches folder name in skills/)
            
        Returns:
            SkillProfile object
        """
        # Handle social-manager vs social_manager naming inconsistencies
        possible_dirs = [role_id, role_id.replace("_", "-"), role_id.replace("-", "_")]
        
        skill_file = None
        for d in possible_dirs:
            path = self.skills_dir / d / "SKILL.md"
            if path.exists():
                skill_file = path
                break
        
        if not skill_file:
            logger.warning(f"Skill file not found for role_id: {role_id}")
            raise SkillNotFoundError(role_id)

        try:
            with open(skill_file, "r", encoding="utf-8") as f:
                content = f.read()

            # Parse YAML frontmatter
            frontmatter = {}
            body = content
            if content.startswith("---"):
                parts = content.split("---", 2)
                if len(parts) >= 3:
                    frontmatter = yaml.safe_load(parts[1])
                    body = parts[2].strip()

            # Create the profile object
            profile = SkillProfile(
                role_id=role_id,
                name=frontmatter.get("name", role_id.replace("_", " ").title()),
                description=body, # We use the body as the primary backstory/description
                goal=frontmatter.get("description", "Contribute to the startup factory."),
                allowed_tools=frontmatter.get("tools", []),
                raw_content=content
            )
            
            # If goal (from description frontmatter) is too short or missing, we could extract it
            if not profile.goal or profile.goal == "Contribute to the startup factory.":
                # Fallback: take first sentence of body
                profile.goal = body.split(".")[0] + "."

            logger.info(f"Successfully loaded skill profile for {role_id}")
            return profile

        except Exception as e:
            logger.error(f"Error parsing skill for {role_id}: {e}")
            raise EidoException(f"Failed to parse skill {role_id}: {str(e)}")

    def get_skill(self, role_id: str) -> Optional[Dict[str, Any]]:
        """Backwards compatibility for dict-based access."""
        try:
            profile = self.load_skill(role_id)
            return {
                "role": profile.name,
                "goal": profile.goal,
                "backstory": profile.description,
                "role_id": profile.role_id,
                "tools": profile.allowed_tools
            }
        except:
            return None

    def list_available_skills(self) -> List[str]:
        """List all available skill IDs."""
        if not self.skills_dir.exists():
            return []
        
        return [
            d.name for d in self.skills_dir.iterdir() 
            if d.is_dir() and (d / "SKILL.md").exists()
        ]
