#!/usr/bin/env python3
"""
Architecture validation script for EIDO backend upgrade.
Validates state machine, imports, and architectural patterns.
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))


def validate_imports():
    """Validate all critical imports work."""
    print("✓ Validating imports...")
    
    try:
        from app.models.mvp import MVP, MVPState, VALID_TRANSITIONS, is_valid_transition
        from app.models.agent_run import AgentRun
        from app.db import init_db, get_session
        from app.services.pipeline import AutonomousPipeline, resume_incomplete_pipelines
        from app.api.services.mvp_service import MVPService
        from app.api.controllers.mvp_controller import router
        from app.exceptions import StateTransitionError, PipelineConflictError
        from app.utils.state_validator import validate_state_machine_integrity
        print("  ✓ All imports successful")
        return True
    except ImportError as e:
        print(f"  ✗ Import failed: {e}")
        return False


def validate_state_machine():
    """Validate state machine configuration."""
    print("✓ Validating state machine...")
    
    try:
        from app.models.mvp import MVPState, VALID_TRANSITIONS, TERMINAL_STATES, NON_TERMINAL_STATES
        from app.utils.state_validator import validate_state_machine_integrity
        
        # Check integrity
        validate_state_machine_integrity()
        print(f"  ✓ State machine integrity validated")
        
        # Check all states defined
        all_states = list(MVPState)
        print(f"  ✓ Total states: {len(all_states)}")
        
        # Check terminal states
        print(f"  ✓ Terminal states: {len(TERMINAL_STATES)}")
        
        # Check non-terminal states
        print(f"  ✓ Non-terminal states: {len(NON_TERMINAL_STATES)}")
        
        # Validate transitions
        total_transitions = sum(len(v) for v in VALID_TRANSITIONS.values())
        print(f"  ✓ Total valid transitions: {total_transitions}")
        
        return True
    except Exception as e:
        print(f"  ✗ State machine validation failed: {e}")
        return False


def validate_models():
    """Validate model definitions."""
    print("✓ Validating models...")
    
    try:
        from app.models.mvp import MVP
        from app.models.agent_run import AgentRun
        
        # Check MVP fields
        mvp_fields = MVP.model_fields.keys()
        required_mvp_fields = {'id', 'name', 'status', 'retry_count', 'created_at', 'updated_at'}
        if not required_mvp_fields.issubset(mvp_fields):
            missing = required_mvp_fields - set(mvp_fields)
            raise ValueError(f"MVP missing fields: {missing}")
        print(f"  ✓ MVP model has all required fields")
        
        # Check AgentRun fields
        run_fields = AgentRun.model_fields.keys()
        required_run_fields = {'id', 'mvp_id', 'stage', 'status', 'attempt_number', 
                              'started_at', 'completed_at', 'duration_ms'}
        if not required_run_fields.issubset(run_fields):
            missing = required_run_fields - set(run_fields)
            raise ValueError(f"AgentRun missing fields: {missing}")
        print(f"  ✓ AgentRun model has all required fields")
        
        return True
    except Exception as e:
        print(f"  ✗ Model validation failed: {e}")
        return False


def validate_architecture():
    """Validate clean architecture separation."""
    print("✓ Validating architecture...")
    
    try:
        # Check controller has no business logic (should be minimal)
        from app.api.controllers import mvp_controller
        controller_source = Path(__file__).parent / "app" / "api" / "controllers" / "mvp_controller.py"
        controller_lines = controller_source.read_text().split('\n')
        
        # Controllers should delegate to services
        if 'MVPService' not in controller_source.read_text():
            raise ValueError("Controller doesn't use service layer")
        print(f"  ✓ Controller delegates to service layer")
        
        # Check service layer exists
        from app.api.services.mvp_service import MVPService
        print(f"  ✓ Service layer implemented")
        
        # Check repository layer exists
        from app.repositories import MVPRepository, AgentRunRepository
        print(f"  ✓ Repository layer implemented")
        
        # Check pipeline orchestration exists
        from app.services.pipeline import AutonomousPipeline
        print(f"  ✓ Pipeline orchestration implemented")
        
        return True
    except Exception as e:
        print(f"  ✗ Architecture validation failed: {e}")
        return False


def main():
    """Run all validations."""
    print("=" * 60)
    print("EIDO Backend Architecture Validation")
    print("=" * 60)
    print()
    
    results = []
    
    results.append(("Imports", validate_imports()))
    results.append(("State Machine", validate_state_machine()))
    results.append(("Models", validate_models()))
    results.append(("Architecture", validate_architecture()))
    
    print()
    print("=" * 60)
    print("Validation Summary")
    print("=" * 60)
    
    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{name:20s} {status}")
    
    all_passed = all(r[1] for r in results)
    
    print()
    if all_passed:
        print("✓ All validations passed!")
        return 0
    else:
        print("✗ Some validations failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
