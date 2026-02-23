#!/usr/bin/env python3
"""
AI Runtime validation script for EIDO backend.
Validates AI Runtime layer, guardrails, and integration.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))


def validate_ai_runtime_imports():
    """Validate AI Runtime imports."""
    print("✓ Validating AI Runtime imports...")
    
    try:
        from app.services.ai_runtime import (
            AIRuntimeFacade,
            LLMRouter,
            TaskType,
            CrewAIService,
            OpenClawService,
            SafeToolExecutor,
            ContextManager,
        )
        print("  ✓ All AI Runtime imports successful")
        return True
    except ImportError as e:
        print(f"  ✗ Import failed: {e}")
        return False


def validate_guardrails():
    """Validate autonomy guardrails configuration."""
    print("✓ Validating autonomy guardrails...")
    
    try:
        from app.config.settings import config
        
        guardrails = {
            "MAX_TOTAL_RUNTIME": config.MAX_TOTAL_RUNTIME,
            "MAX_STAGE_RETRIES": config.MAX_STAGE_RETRIES,
            "MAX_TOOL_INVOCATIONS": config.MAX_TOOL_INVOCATIONS,
            "MAX_LLM_RETRIES": config.MAX_LLM_RETRIES,
            "MAX_TOTAL_COST": config.MAX_TOTAL_COST,
        }
        
        for name, value in guardrails.items():
            print(f"  ✓ {name}: {value}")
        
        return True
    except Exception as e:
        print(f"  ✗ Guardrails validation failed: {e}")
        return False


def validate_llm_configuration():
    """Validate LLM configuration."""
    print("✓ Validating LLM configuration...")
    
    try:
        from app.config.settings import config
        from app.services.ai_runtime.llm_router import TaskType, LLMRouter
        
        router = LLMRouter()
        
        for task_type in TaskType:
            model = router.get_model_for_task(task_type)
            print(f"  ✓ {task_type.value}: {model}")
        
        return True
    except Exception as e:
        print(f"  ✗ LLM configuration validation failed: {e}")
        return False


def validate_tool_sandbox():
    """Validate tool sandbox configuration."""
    print("✓ Validating tool sandbox...")
    
    try:
        from app.config.settings import config
        
        print(f"  ✓ Allowed paths: {config.ALLOWED_TOOL_PATHS}")
        print(f"  ✓ Max file size: {config.MAX_FILE_SIZE_MB}MB")
        print(f"  ✓ Tool timeout: {config.TOOL_EXECUTION_TIMEOUT}s")
        print(f"  ✓ Allowed commands: {config.ALLOWED_COMMANDS}")
        
        return True
    except Exception as e:
        print(f"  ✗ Tool sandbox validation failed: {e}")
        return False


def validate_database_schema():
    """Validate database schema enhancements."""
    print("✓ Validating database schema...")
    
    try:
        from app.models.mvp import MVP
        from app.models.agent_run import AgentRun
        
        # Check MVP AI Runtime fields
        mvp_ai_fields = {
            'total_token_usage', 'total_cost_estimate', 
            'max_allowed_cost', 'execution_trace_id', 'last_error_stage'
        }
        mvp_fields = set(MVP.model_fields.keys())
        
        if not mvp_ai_fields.issubset(mvp_fields):
            missing = mvp_ai_fields - mvp_fields
            raise ValueError(f"MVP missing AI fields: {missing}")
        print(f"  ✓ MVP has all AI Runtime fields")
        
        # Check AgentRun AI Runtime fields
        run_ai_fields = {
            'stage_input_json', 'stage_output_json',
            'llm_model', 'token_usage', 'cost_estimate'
        }
        run_fields = set(AgentRun.model_fields.keys())
        
        if not run_ai_fields.issubset(run_fields):
            missing = run_ai_fields - run_fields
            raise ValueError(f"AgentRun missing AI fields: {missing}")
        print(f"  ✓ AgentRun has all AI Runtime fields")
        
        return True
    except Exception as e:
        print(f"  ✗ Database schema validation failed: {e}")
        return False


def validate_pipeline_integration():
    """Validate pipeline integration with AI Runtime."""
    print("✓ Validating pipeline integration...")
    
    try:
        from app.services.pipeline import (
            AutonomousPipeline,
            CostLimitExceededError,
            RuntimeLimitExceededError,
        )
        
        print(f"  ✓ Pipeline has AI Runtime integration")
        print(f"  ✓ Cost limit enforcement available")
        print(f"  ✓ Runtime limit enforcement available")
        
        return True
    except Exception as e:
        print(f"  ✗ Pipeline integration validation failed: {e}")
        return False


def main():
    """Run all validations."""
    print("=" * 60)
    print("EIDO AI Runtime Validation")
    print("=" * 60)
    print()
    
    results = []
    
    results.append(("AI Runtime Imports", validate_ai_runtime_imports()))
    results.append(("Autonomy Guardrails", validate_guardrails()))
    results.append(("LLM Configuration", validate_llm_configuration()))
    results.append(("Tool Sandbox", validate_tool_sandbox()))
    results.append(("Database Schema", validate_database_schema()))
    results.append(("Pipeline Integration", validate_pipeline_integration()))
    
    print()
    print("=" * 60)
    print("Validation Summary")
    print("=" * 60)
    
    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{name:30s} {status}")
    
    all_passed = all(r[1] for r in results)
    
    print()
    if all_passed:
        print("✓ All AI Runtime validations passed!")
        return 0
    else:
        print("✗ Some validations failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
