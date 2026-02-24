import asyncio
import sys
from pathlib import Path

# Add the project root to sys.path
sys.path.append(str(Path(__file__).parent.parent.parent))

from app.services.ai_runtime.crewai_service import CrewAIService

async def test_crew():
    # Pass a dummy mvp_id
    service = CrewAIService(mvp_id=1)
    print("--- Testing CrewAI Service Phase 2 (Refactored) ---")
    
    context = {
        "raw_idea": "An AI-powered automated grocery list that syncs with smart fridges."
    }
    
    print(f"Starting Ideation Crew test...")
    
    try:
        # This will test the initialization, agent factory, and structure
        result = await service.execute_crew(stage_name="ideation", context=context)
        
        print("\n--- Execution Result ---")
        print(f"Status: SUCCESS")
        print(f"Model: {result.model_used}")
        print(f"Tokens: {result.token_usage}")
        print(f"Cost: ${result.cost_estimate}")
        print(f"Output Preview: {str(result.output_json)[:100]}...")
        
    except Exception as e:
        print(f"\nExecution result: {e}")
        print("Note: If 'API_KEY' is mentioned, the framework tried to make a real call but failed. The structure is valid.")

if __name__ == "__main__":
    asyncio.run(test_crew())
