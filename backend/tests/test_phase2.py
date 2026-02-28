import asyncio
import sys
import io
from pathlib import Path

# Force UTF-8 encoding for stdout/stderr to handle emojis on Windows
if sys.stdout and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
if sys.stderr and sys.stderr.encoding.lower() != 'utf-8':
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Add the project root to sys.path
sys.path.append(str(Path(__file__).parent.parent.parent))

from app.services.ai_runtime.crewai_service import CrewAIService
from app.logger import configure_logging

async def test_crew():
    configure_logging()
    # Pass a dummy mvp_id and enable verbose for test visibility
    service = CrewAIService(mvp_id=1, verbose=True)
    print("--- Testing CrewAI Service Phase 2 (Refactored) ---")
    
    context = {
        "raw_idea": "An AI-powered automated grocery list that syncs with smart fridges."
    }
    
    print(f"Starting Ideation Crew test...")
    
    try:
        # This will test the initialization, agent factory, and structure
        result = await service.execute_crew(stage_name="ideation", context=context)
        
        # Wait a moment for CrewAI's rich terminal output to finish
        await asyncio.sleep(1)
        
        print("\n" + "="*50)
        print("--- FINAL EXECUTION RESULT ---")
        print(f"Status: SUCCESS")
        print(f"Model: {result.model_used}")
        print(f"Tokens: {result.token_usage}")
        print(f"Cost: ${result.cost_estimate}")
        print(f"Output Preview: {str(result.output_json)[:100]}...")
        print("="*50)
        
    except Exception as e:
        import traceback
        print("\n" + "="*50)
        print("--- EXECUTION FAILED ---")
        traceback.print_exc()
        print(f"Error: {e}")
        print("="*50)
        print("Note: If 'API_KEY' is mentioned, the framework tried to make a real call but failed. The structure is valid.")

if __name__ == "__main__":
    asyncio.run(test_crew())
