"""Full Phase 2 Orchestration Test — All 5 Stages Sequential."""
import asyncio
import sys
import time
import json
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent))

from app.services.ai_runtime.crewai_service import CrewAIService


STAGES = [
    {
        "name": "ideation",
        "context": {
            "raw_idea": "An AI-powered platform that automatically generates SaaS MVPs from a single idea."
        },
        "agents": ["Market Researcher", "Business Analyst"],
        "pass_key": "features",  # Key to extract and pass to next stage
    },
    {
        "name": "architecture",
        "context": {
            "features": None,  # Filled from ideation output
        },
        "agents": ["System Architect", "Tech Lead"],
        "pass_key": "spec",
    },
    {
        "name": "building",
        "context": {
            "spec": None,  # Filled from architecture output
        },
        "agents": ["Full Stack Developer", "QA Engineer"],
        "pass_key": "build_path",
    },
    {
        "name": "deployment",
        "context": {
            "build_path": None,  # Filled from building output
        },
        "agents": ["DevOps Engineer"],
        "pass_key": "mvp_name",
    },
    {
        "name": "tokenization",
        "context": {
            "mvp_name": None,  # Filled from deployment output
        },
        "agents": ["Blockchain Specialist"],
        "pass_key": None,
    },
]


async def run_full_orchestration():
    """Run all 5 stages sequentially, passing context between stages."""
    service = CrewAIService(mvp_id=1, verbose=True)
    
    print("=" * 70)
    print("  EIDO Phase 2 — Full Agent Orchestration Test")
    print("  Testing all 5 stages with REAL LLM calls via Groq")
    print("=" * 70)
    
    results = {}
    total_tokens = 0
    total_cost = 0.0
    total_start = time.time()
    
    for i, stage in enumerate(STAGES):
        stage_name = stage["name"]
        context = stage["context"]
        
        print(f"\n{'─' * 70}")
        print(f"  Stage {i+1}/5: {stage_name.upper()}")
        print(f"  Agents: {', '.join(stage['agents'])}")
        print(f"{'─' * 70}")
        
        start = time.time()
        
        try:
            result = await service.execute_crew(stage_name=stage_name, context=context)
            elapsed = time.time() - start
            
            print(f"\n  ✅ {stage_name.upper()} — Completed in {elapsed:.1f}s")
            print(f"  Model: {result.model_used}")
            print(f"  Tokens: {result.token_usage}")
            print(f"  Cost: ${result.cost_estimate:.4f}")
            
            # Show output preview
            output_str = json.dumps(result.output_json, indent=2) if isinstance(result.output_json, dict) else str(result.output_json)
            preview = output_str[:200] + "..." if len(output_str) > 200 else output_str
            print(f"  Output: {preview}")
            
            # Store result and pass context to next stage
            results[stage_name] = result
            total_tokens += result.token_usage
            total_cost += result.cost_estimate
            
            # Pass output as context to the next stage
            if stage["pass_key"] and i + 1 < len(STAGES):
                next_stage = STAGES[i + 1]
                # Try to pass structured data, fall back to raw output string
                pass_value = output_str[:500]  # Limit context size
                next_stage["context"][stage["pass_key"]] = pass_value
                
        except Exception as e:
            elapsed = time.time() - start
            print(f"\n  ❌ {stage_name.upper()} — FAILED after {elapsed:.1f}s")
            print(f"  Error: {e}")
            
            # Still try to continue with next stage using dummy context
            if stage["pass_key"] and i + 1 < len(STAGES):
                next_stage = STAGES[i + 1]
                next_stage["context"][stage["pass_key"]] = f"Previous stage ({stage_name}) failed"
            
            results[stage_name] = {"error": str(e)}
    
    # Final summary
    total_elapsed = time.time() - total_start
    
    print(f"\n{'=' * 70}")
    print(f"  ORCHESTRATION COMPLETE")
    print(f"{'=' * 70}")
    print(f"  Total Time:   {total_elapsed:.1f}s")
    print(f"  Total Tokens: {total_tokens}")
    print(f"  Total Cost:   ${total_cost:.4f}")
    print(f"  Stages Run:   {len(results)}/5")
    print(f"  Successes:    {sum(1 for r in results.values() if not isinstance(r, dict) or 'error' not in r)}")
    print(f"  Failures:     {sum(1 for r in results.values() if isinstance(r, dict) and 'error' in r)}")
    print(f"{'=' * 70}")
    
    for name, r in results.items():
        status = "❌ FAILED" if isinstance(r, dict) and "error" in r else "✅ OK"
        print(f"  {name.upper():15} {status}")
    
    print(f"{'=' * 70}")


if __name__ == "__main__":
    asyncio.run(run_full_orchestration())
