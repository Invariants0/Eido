import sys
import json
from pathlib import Path

# Add project root to sys.path
sys.path.append(str(Path(__file__).parent.parent.parent))

from app.agent.context_optimizer import ContextOptimizer
from app.services.ai_runtime.toon_adapter import get_toon_adapter

def test_toon_system():
    print("="*60)
    print("      EIDO TOON COMPRESSION & OPTIMIZATION TEST")
    print("="*60)
    
    # 1. Test Adapter Connectivity
    adapter = get_toon_adapter()
    print(f"\n[1] ADAPTER STATUS")
    print(f"    Available: {adapter.is_available()}")
    
    # 2. Test Structured Data Compression
    optimizer = ContextOptimizer()
    
    # Create a complex nested object to simulate real context
    massive_context = {
        "mvp_metadata": {
            "id": 1,
            "name": "Eido Factory",
            "version": "0.1.0-alpha",
            "config": {
                "max_retries": 5,
                "timeout": 300,
                "enabled_features": ["SSE", "TOON", "E2B", "CREW"]
            }
        },
        "stage_results": [
            {
                "stage": "ideation",
                "status": "success",
                "output": "A comprehensive business plan for an AI startup."
            },
            {
                "stage": "architecture",
                "status": "success",
                "output": "Microservices architecture using FastAPI and PostgreSQL."
            }
        ],
        "system_status": "operational"
    }
    
    print(f"\n[2] STRUCTURED DATA COMPRESSION")
    original_str = json.dumps(massive_context, indent=2)
    print(f"    Original Size:   {len(original_str)} chars")
    
    compressed, savings = optimizer.compress_structured_data(massive_context)
    print(f"    Compressed Size: {len(compressed)} chars")
    
    print("\n--- VISUAL COMPARISON ---")
    print("ORIGINAL (Prettified JSON):")
    print(original_str[:200])
    print("\nCOMPRESSED (Minified TOON-Fallback):")
    print(compressed[:200])
    
    actual_math = ((len(original_str) - len(compressed)) / len(original_str)) * 100
    print(f"\nReduction: {actual_math:.1f}%")

    # 3. Test Log Compression (Simulating a MASSIVE noisy build)
    print(f"\n[3] LOG COMPRESSION (Massive Noisy Build)")
    massive_noise = [
        "2026-02-27 19:40:01 INFO: Initializing build environment...",
        "2026-02-27 19:40:02 INFO: Loading dependencies...",
        "2026-02-27 19:40:03 INFO: Checking cache for layer 1",
        "2026-02-27 19:40:04 INFO: Checking cache for layer 2",
    ]
    # Add 20 lines of "INFO" fluff
    massive_noise.extend([f"2026-02-27 19:40:05 INFO: Compiling module_{i}.py..." for i in range(20)])
    
    # Inject the actual CRITICAL ERRORS in the middle of the noise
    massive_noise.append("2026-02-27 19:40:06 ERROR: SyntaxError at /app/services/ai_runtime/crew_service.py:145")
    massive_noise.append("    -> line 145: result = await kickoff()")
    massive_noise.append("    -> Unexpected token '('")
    
    # Add 10 more lines of fluff
    massive_noise.extend([f"2026-02-27 19:40:07 DEBUG: Cleaning up temp files {i}..." for i in range(10)])
    massive_noise.append("2026-02-27 19:40:08 FATAL: Build process terminated prematurely!")
    
    raw_logs = "\n".join(massive_noise)
    print(f"    Original Log Size:   {len(raw_logs)} chars ({len(massive_noise)} lines)")
    
    compressed_logs = optimizer.compress_logs(raw_logs)
    print(f"    Compressed Log Size: {len(compressed_logs)} chars")
    print("\n--- TOON COMPRESSED LOG OUTPUT ---")
    print(compressed_logs)
    print("-" * 40)

    # 4. Global Stats
    print(f"\n[4] OVERALL COMPRESSION STATS")
    stats = optimizer.get_stats()
    print(f"    Total Compressions:  {stats['total_compressions']}")
    print(f"    Total Tokens Saved:  {stats['total_savings_pct']:.1f}% aggregate")
    print(f"    TOON Active:         {stats['toon_available']}")

    print("\n" + "="*60)
    print("             TEST COMPLETE")
    print("="*60)

if __name__ == "__main__":
    test_toon_system()
