"""Autonomous pipeline orchestration engine with AI Runtime integration."""

import asyncio
import hashlib
from datetime import datetime
from typing import Optional
from sqlmodel import Session, select

from ..models.mvp import MVP, MVPState, is_valid_transition, is_terminal_state
from ..models.agent_run import AgentRun
from ..db import get_session_context
from ..config.settings import config
from ..logger import get_logger
from ..exceptions import StateTransitionError, NotFoundError, EidoException
from .ai_runtime import AIRuntimeFacade
from ..monitoring.metrics import (
    mvp_created_total,
    mvp_pipeline_active,
    mvp_pipeline_success_total,
    mvp_pipeline_failure_total,
    track_mvp_pipeline_duration,
    track_mvp_pipeline_cost,
    track_mvp_stage_duration,
    track_mvp_stage_cost,
    cost_limit_exceeded_total,
    runtime_limit_exceeded_total,
)
from ..monitoring.alerting import alert_cost_threshold_exceeded

logger = get_logger(__name__)


class CostLimitExceededError(EidoException):
    """Raised when cost limit is exceeded."""
    def __init__(self, current_cost: float, max_cost: float):
        super().__init__(
            f"Cost limit exceeded: ${current_cost:.2f} > ${max_cost:.2f}",
            code="COST_LIMIT_EXCEEDED",
            status_code=402
        )


class RuntimeLimitExceededError(EidoException):
    """Raised when runtime limit is exceeded."""
    def __init__(self, current_runtime: int, max_runtime: int):
        super().__init__(
            f"Runtime limit exceeded: {current_runtime}s > {max_runtime}s",
            code="RUNTIME_LIMIT_EXCEEDED",
            status_code=408
        )


class AutonomousPipeline:
    """Orchestrates autonomous MVP pipeline execution with AI Runtime."""
    
    def __init__(self, mvp_id: int, correlation_id: Optional[str] = None):
        self.mvp_id = mvp_id
        self.correlation_id = correlation_id or self._generate_correlation_id()
        self.ai_runtime = AIRuntimeFacade(mvp_id)
        self.pipeline_start_time = None
    
    def _generate_correlation_id(self) -> str:
        """Generate unique correlation ID for request tracing."""
        return hashlib.sha256(f"{self.mvp_id}-{datetime.utcnow().isoformat()}".encode()).hexdigest()[:16]
    
    def _log(self, message: str, level: str = "info", **kwargs):
        """Log with correlation ID."""
        log_method = getattr(logger, level)
        log_method(message, extra={"request_id": self.correlation_id, "mvp_id": self.mvp_id, **kwargs})
    
    async def run(self) -> None:
        """Execute the autonomous pipeline with AI Runtime."""
        self._log("Starting autonomous pipeline execution with AI Runtime")
        self.pipeline_start_time = datetime.utcnow()
        
        # Track active pipeline
        mvp_pipeline_active.inc()
        
        try:
            with get_session_context() as session:
                mvp = session.get(MVP, self.mvp_id)
                if not mvp:
                    raise NotFoundError("MVP", self.mvp_id)
                
                # Set execution trace ID
                if not mvp.execution_trace_id:
                    mvp.execution_trace_id = self.correlation_id
                    session.add(mvp)
                    session.commit()
                
                # Execute pipeline stages sequentially
                await self._execute_ideation_stage(session, mvp)
                await self._execute_architecture_stage(session, mvp)
                await self._execute_building_stage(session, mvp)
                await self._execute_deployment_stage(session, mvp)
                await self._execute_tokenization_stage(session, mvp)
                
                # Mark as completed
                self._transition_state(session, mvp, MVPState.COMPLETED)
                
                # Track success metrics
                pipeline_duration = (datetime.utcnow() - self.pipeline_start_time).total_seconds()
                track_mvp_pipeline_duration(pipeline_duration, "completed")
                track_mvp_pipeline_cost(
                    mvp.total_cost_estimate,
                    "completed",
                    mvp.total_token_usage
                )
                mvp_pipeline_success_total.inc()
                
                self._log("Pipeline execution completed successfully")
        
        except (CostLimitExceededError, RuntimeLimitExceededError) as e:
            self._log(f"Pipeline aborted: {str(e)}", level="error")
            
            # Track limit exceeded metrics
            if isinstance(e, CostLimitExceededError):
                cost_limit_exceeded_total.inc()
            else:
                runtime_limit_exceeded_total.inc()
            
            with get_session_context() as session:
                mvp = session.get(MVP, self.mvp_id)
                if mvp:
                    mvp.last_error_stage = "cost_or_runtime_limit"
                    self._transition_state(session, mvp, MVPState.FAILED)
                    
                    # Track failure metrics
                    pipeline_duration = (datetime.utcnow() - self.pipeline_start_time).total_seconds()
                    track_mvp_pipeline_duration(pipeline_duration, "failed")
                    mvp_pipeline_failure_total.labels(
                        reason="limit_exceeded"
                    ).inc()
            raise
        
        except Exception as e:
            self._log(f"Pipeline execution failed: {str(e)}", level="error")
            
            with get_session_context() as session:
                mvp = session.get(MVP, self.mvp_id)
                if mvp and not is_terminal_state(mvp.status):
                    mvp.retry_count += 1
                    
                    if mvp.retry_count >= config.MAX_AGENT_RETRIES:
                        self._log(f"Max retries ({config.MAX_AGENT_RETRIES}) exceeded, marking as FAILED")
                        self._transition_state(session, mvp, MVPState.FAILED)
                        
                        # Track failure metrics
                        pipeline_duration = (datetime.utcnow() - self.pipeline_start_time).total_seconds()
                        track_mvp_pipeline_duration(pipeline_duration, "failed")
                        mvp_pipeline_failure_total.labels(
                            reason="max_retries_exceeded"
                        ).inc()
                    else:
                        self._log(f"Retry count: {mvp.retry_count}/{config.MAX_AGENT_RETRIES}")
                        session.add(mvp)
                        session.commit()
            raise
        finally:
            # Decrement active pipeline counter
            mvp_pipeline_active.dec()
    
    def _transition_state(self, session: Session, mvp: MVP, new_state: MVPState) -> None:
        """Transition MVP to new state with validation."""
        if not is_valid_transition(mvp.status, new_state):
            raise StateTransitionError(mvp.status.value, new_state.value)
        
        old_state = mvp.status
        mvp.status = new_state
        mvp.updated_at = datetime.utcnow()
        session.add(mvp)
        session.commit()
        session.refresh(mvp)
        
        self._log(f"State transition: {old_state.value} -> {new_state.value}")
    
    async def _execute_stage(
        self,
        session: Session,
        mvp: MVP,
        stage_name: str,
        target_state: MVPState,
        failure_state: Optional[MVPState] = None
    ) -> None:
        """Execute a pipeline stage with AI Runtime tracking."""
        self._log(f"Starting stage: {stage_name}")
        
        # Check runtime limit
        self._check_runtime_limit()
        
        # Check cost limit before stage execution
        self._check_cost_limit(session, mvp)
        
        # Transition to target state
        self._transition_state(session, mvp, target_state)
        
        # Create agent run record
        started_at = datetime.utcnow()
        agent_run = AgentRun(
            mvp_id=self.mvp_id,
            stage=stage_name,
            status="running",
            attempt_number=mvp.retry_count + 1,
            started_at=started_at,
        )
        session.add(agent_run)
        session.commit()
        session.refresh(agent_run)
        
        try:
            # Execute stage via AI Runtime
            stage_result = await self.ai_runtime.execute_stage(stage_name, self.mvp_id)
            
            # Mark agent run as completed
            completed_at = datetime.utcnow()
            duration_ms = int((completed_at - started_at).total_seconds() * 1000)
            
            if stage_result.success:
                agent_run.status = "completed"
                agent_run.stage_input_json = stage_result.stage_input_json
                agent_run.stage_output_json = stage_result.stage_output_json
                agent_run.llm_model = stage_result.llm_model
                agent_run.token_usage = stage_result.token_usage
                agent_run.cost_estimate = stage_result.cost_estimate
                agent_run.log = "\n".join(stage_result.agent_logs)
                
                # Update MVP totals
                mvp.total_token_usage += stage_result.token_usage
                mvp.total_cost_estimate += stage_result.cost_estimate
                session.add(mvp)
                
                # Track stage metrics
                track_mvp_stage_duration(stage_name, duration_ms / 1000, "completed")
                track_mvp_stage_cost(
                    stage_name,
                    stage_result.cost_estimate,
                    stage_result.token_usage
                )
            else:
                agent_run.status = "failed"
                agent_run.log = stage_result.error
                mvp.last_error_stage = stage_name
                session.add(mvp)
            
            agent_run.completed_at = completed_at
            agent_run.duration_ms = duration_ms
            session.add(agent_run)
            session.commit()
            
            if stage_result.success:
                self._log(
                    f"Stage completed: {stage_name}",
                    duration_ms=duration_ms,
                    tokens=stage_result.token_usage,
                    cost=stage_result.cost_estimate
                )
            else:
                raise Exception(stage_result.error)
        
        except Exception as e:
            # Mark agent run as failed if not already updated
            if agent_run.status == "running":
                completed_at = datetime.utcnow()
                duration_ms = int((completed_at - started_at).total_seconds() * 1000)
                
                agent_run.status = "failed"
                agent_run.completed_at = completed_at
                agent_run.duration_ms = duration_ms
                agent_run.log = f"Stage {stage_name} failed: {str(e)}"
                mvp.last_error_stage = stage_name
                session.add(agent_run)
                session.add(mvp)
                session.commit()
            
            self._log(f"Stage failed: {stage_name}", level="error", error=str(e))
            
            # Transition to failure state if provided
            if failure_state:
                self._transition_state(session, mvp, failure_state)
            
            raise
    
    def _check_cost_limit(self, session: Session, mvp: MVP) -> None:
        """Check if cost limit has been exceeded."""
        if mvp.total_cost_estimate >= mvp.max_allowed_cost:
            self._log(
                f"Cost limit exceeded: ${mvp.total_cost_estimate:.2f} >= ${mvp.max_allowed_cost:.2f}",
                level="error"
            )
            
            # Send alert if threshold exceeded
            if mvp.total_cost_estimate >= config.ALERT_COST_THRESHOLD:
                import asyncio
                asyncio.create_task(
                    alert_cost_threshold_exceeded(
                        mvp.total_cost_estimate,
                        config.ALERT_COST_THRESHOLD
                    )
                )
            
            raise CostLimitExceededError(mvp.total_cost_estimate, mvp.max_allowed_cost)
    
    def _check_runtime_limit(self) -> None:
        """Check if runtime limit has been exceeded."""
        if self.pipeline_start_time:
            elapsed = (datetime.utcnow() - self.pipeline_start_time).total_seconds()
            if elapsed >= config.MAX_TOTAL_RUNTIME:
                self._log(
                    f"Runtime limit exceeded: {elapsed}s >= {config.MAX_TOTAL_RUNTIME}s",
                    level="error"
                )
                raise RuntimeLimitExceededError(int(elapsed), config.MAX_TOTAL_RUNTIME)
    
    async def _execute_ideation_stage(self, session: Session, mvp: MVP) -> None:
        """Execute ideation stage."""
        await self._execute_stage(session, mvp, "ideation", MVPState.IDEATING)
    
    async def _execute_architecture_stage(self, session: Session, mvp: MVP) -> None:
        """Execute architecture stage."""
        await self._execute_stage(session, mvp, "architecture", MVPState.ARCHITECTING)
    
    async def _execute_building_stage(self, session: Session, mvp: MVP) -> None:
        """Execute building stage."""
        await self._execute_stage(
            session, mvp, "building", MVPState.BUILDING, failure_state=MVPState.BUILD_FAILED
        )
    
    async def _execute_deployment_stage(self, session: Session, mvp: MVP) -> None:
        """Execute deployment stage."""
        await self._execute_stage(
            session, mvp, "deployment", MVPState.DEPLOYING, failure_state=MVPState.DEPLOY_FAILED
        )
    
    async def _execute_tokenization_stage(self, session: Session, mvp: MVP) -> None:
        """Execute tokenization stage."""
        await self._execute_stage(session, mvp, "tokenization", MVPState.TOKENIZING)


async def resume_incomplete_pipelines() -> None:
    """Resume pipelines that were interrupted (crash recovery)."""
    logger.info("Checking for incomplete pipelines to resume")
    
    with get_session_context() as session:
        # Find all MVPs in non-terminal states
        from ..models.mvp import NON_TERMINAL_STATES
        
        statement = select(MVP).where(MVP.status.in_([state.value for state in NON_TERMINAL_STATES]))
        incomplete_mvps = session.exec(statement).all()
        
        if not incomplete_mvps:
            logger.success("No incomplete pipelines found")
            return
        
        logger.info(f"Found {len(incomplete_mvps)} incomplete pipelines, resuming...")
        
        # Resume each pipeline
        for mvp in incomplete_mvps:
            logger.info(f"Resuming pipeline for MVP {mvp.id} (state: {mvp.status.value})")
            try:
                pipeline = AutonomousPipeline(mvp.id)
                # Run in background without blocking startup
                asyncio.create_task(pipeline.run())
            except Exception as e:
                logger.error(f"Failed to resume pipeline for MVP {mvp.id}: {str(e)}")
