import sys
import os
from pathlib import Path

# Add backend to sys.path
backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))

from app.services.ai_runtime.skill_loader import SkillLoader

def test_skill_loader():
    loader = SkillLoader()
    
    # Test loading researcher skill
    researcher_skill = loader.get_skill("researcher")
    if researcher_skill:
        print("Researcher Skill loaded successfully:")
        print(f"Role: {researcher_skill['role']}")
        print(f"Goal: {researcher_skill['goal']}")
        print(f"Backstory Length: {len(researcher_skill['backstory'])}")
    else:
        print("Failed to load researcher skill")

    # Test loading developer skill
    developer_skill = loader.get_skill("developer")
    if developer_skill:
        print("\nDeveloper Skill loaded successfully:")
        print(f"Role: {developer_skill['role']}")
        print(f"Goal: {developer_skill['goal']}")
    else:
        print("Failed to load developer skill")

    # Test list skills
    all_skills = loader.list_available_skills()
    print(f"\nAvailable Skills: {all_skills}")

if __name__ == "__main__":
    test_skill_loader()
