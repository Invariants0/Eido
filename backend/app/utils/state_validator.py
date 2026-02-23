"""State machine validation utilities."""

from typing import List
from ..models.mvp import MVPState, VALID_TRANSITIONS, is_valid_transition, is_terminal_state


def get_valid_next_states(current_state: MVPState) -> List[MVPState]:
    """Get list of valid next states from current state."""
    return VALID_TRANSITIONS.get(current_state, [])


def validate_state_machine_integrity() -> bool:
    """Validate state machine configuration integrity."""
    # Ensure all states are defined in transitions
    all_states = set(MVPState)
    defined_states = set(VALID_TRANSITIONS.keys())
    
    if all_states != defined_states:
        missing = all_states - defined_states
        raise ValueError(f"State machine incomplete. Missing states: {missing}")
    
    # Ensure terminal states have no transitions
    for state in [MVPState.COMPLETED, MVPState.FAILED]:
        if VALID_TRANSITIONS[state]:
            raise ValueError(f"Terminal state {state} should have no transitions")
    
    # Ensure all transition targets are valid states
    for state, transitions in VALID_TRANSITIONS.items():
        for target in transitions:
            if target not in all_states:
                raise ValueError(f"Invalid transition target {target} from {state}")
    
    return True


def get_state_path_to_completion(current_state: MVPState) -> List[MVPState]:
    """Get the expected path from current state to completion."""
    paths = {
        MVPState.CREATED: [MVPState.IDEATING, MVPState.ARCHITECTING, MVPState.BUILDING, 
                          MVPState.DEPLOYING, MVPState.TOKENIZING, MVPState.COMPLETED],
        MVPState.IDEATING: [MVPState.ARCHITECTING, MVPState.BUILDING, 
                           MVPState.DEPLOYING, MVPState.TOKENIZING, MVPState.COMPLETED],
        MVPState.ARCHITECTING: [MVPState.BUILDING, MVPState.DEPLOYING, 
                               MVPState.TOKENIZING, MVPState.COMPLETED],
        MVPState.BUILDING: [MVPState.DEPLOYING, MVPState.TOKENIZING, MVPState.COMPLETED],
        MVPState.BUILD_FAILED: [MVPState.BUILDING, MVPState.DEPLOYING, 
                               MVPState.TOKENIZING, MVPState.COMPLETED],
        MVPState.DEPLOYING: [MVPState.TOKENIZING, MVPState.COMPLETED],
        MVPState.DEPLOY_FAILED: [MVPState.DEPLOYING, MVPState.TOKENIZING, MVPState.COMPLETED],
        MVPState.TOKENIZING: [MVPState.COMPLETED],
        MVPState.COMPLETED: [],
        MVPState.FAILED: [],
    }
    return paths.get(current_state, [])
