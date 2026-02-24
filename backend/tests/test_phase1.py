import asyncio
import sys
from pathlib import Path

# Add the project root to sys.path
sys.path.append(str(Path(__file__).parent.parent.parent))

from app.services.ai_runtime.llm_router import LLMRouter, TaskType
from pydantic import BaseModel

class TestSchema(BaseModel):
    name: str
    status: str

async def test_llm():
    router = LLMRouter()
    print("--- Testing LLM Router Phase 1 ---")
    print(f"Testing IDEATION model logic...")
    
    prompt = "Create a JSON object with name 'EIDO-Test' and status 'active'."
    
    try:
        response = await router.execute_llm_call(
            task_type=TaskType.IDEATION,
            prompt=prompt,
            response_schema=TestSchema
        )
        
        print(f"\nModel Used: {response.model_used}")
        print(f"Token Usage: {response.token_usage}")
        print(f"Cost Estimate: ${response.cost_estimate}")
        print(f"Parsed Name: {response.parsed_output.get('name') if response.parsed_output else 'N/A'}")
        
        stats = router.get_usage_stats()
        print(f"\nSession Stats: {stats}")
        
    except Exception as e:
        print(f"\nExecution failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_llm())
