from app.services.ai_runtime.skill_loader import SkillLoader

def test_parse(role_id):
    loader = SkillLoader()
    try:
        profile = loader.load_skill(role_id)
        print(f"ROLE: {role_id}")
        print(f"Name: {profile.name}")
        # print description but handle potential console encoding issues
        try:
            print(f"Goal: {profile.goal}")
            print(f"Tools: {profile.allowed_tools}")
        except UnicodeEncodeError:
            print("Goal/Tools: [Encoding Error in Console]")
        print("-" * 40)
    except Exception as e:
        print(f"Error loading {role_id}: {e}")

for role in ["analyst", "researcher", "architect", "tech_lead", "developer", "qa", "devops", "blockchain", "social_manager"]:
    test_parse(role)
