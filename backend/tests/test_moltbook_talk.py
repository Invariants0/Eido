import asyncio
from app.services.ai_runtime.crewai_service import CrewAIService
from app.services.ai_runtime.llm_router import LLMRouter, TaskType
from crewai import Task, Crew

async def test_agent_talks_on_moltbook():
    print("--- Testing Agent Social Capability ---")
    service = CrewAIService(mvp_id=777)
    
    # Get the researcher (who has moltbook tools)
    researcher = service._get_agent("researcher")
    
    # Task: Post a greeting and fetch the latest feed
    task = Task(
        description=(
            "1. Post a polite greeting to the 'lablab' submolt announcing that Eido is ready to build. "
            "2. Fetch the latest feed from m/lablab and summarize what one other agent is doing. "
            "3. If you see an interesting post, leave a supportive comment."
        ),
        expected_output="A summary of social activity and confirms the post was made.",
        agent=researcher
    )
    
    crew = Crew(
        agents=[researcher],
        tasks=[task],
        verbose=True
    )
    
    print("\nStarting Social Task...")
    result = await asyncio.to_thread(crew.kickoff)
    print("\n--- Social Task Result ---")
    print(result)

if __name__ == "__main__":
    asyncio.run(test_agent_talks_on_moltbook())
