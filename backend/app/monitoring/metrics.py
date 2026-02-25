"""Production-grade Prometheus metrics for EIDO backend."""

from prometheus_client import (
    Counter,
    Histogram,
    Gauge,
    Info,
    CollectorRegistry,
    generate_latest,
    CONTENT_TYPE_LATEST,
)
from fastapi import Response
from typing import Optional
import time

from ..config.settings import config
from ..logger import get_logger

logger = get_logger(__name__)

# Create custom registry
metrics_registry = CollectorRegistry()

# ============================================================================
# APPLICATION INFO
# ============================================================================

app_info = Info(
    "eido_app",
    "EIDO application information",
    registry=metrics_registry
)
app_info.info({
    "version": config.APP_VERSION,
    "environment": config.ENVIRONMENT,
})

# ============================================================================
# MVP PIPELINE METRICS
# ============================================================================

mvp_pipeline_duration = Histogram(
    "eido_mvp_pipeline_duration_seconds",
    "Duration of MVP pipeline execution",
    ["status"],  # completed, failed
    buckets=[30, 60, 120, 300, 600, 1200, 1800, 3600],
    registry=metrics_registry
)

mvp_pipeline_cost = Histogram(
    "eido_mvp_pipeline_cost_dollars",
    "Cost of MVP pipeline execution in USD",
    ["status"],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 50.0],
    registry=metrics_registry
)

mvp_pipeline_tokens = Histogram(
    "eido_mvp_pipeline_tokens_total",
    "Total tokens used in MVP pipeline",
    ["status"],
    buckets=[1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000],
    registry=metrics_registry
)

mvp_created_total = Counter(
    "eido_mvp_created_total",
    "Total number of MVPs created",
    registry=metrics_registry
)

mvp_pipeline_success_total = Counter(
    "eido_mvp_pipeline_success_total",
    "Total number of successful pipeline executions",
    registry=metrics_registry
)

mvp_pipeline_failure_total = Counter(
    "eido_mvp_pipeline_failure_total",
    "Total number of failed pipeline executions",
    ["reason"],  # cost_limit, runtime_limit, stage_failure, etc.
    registry=metrics_registry
)

mvp_pipeline_active = Gauge(
    "eido_mvp_pipeline_active",
    "Number of currently active pipelines",
    registry=metrics_registry
)

# ============================================================================
# STAGE METRICS
# ============================================================================

mvp_stage_duration = Histogram(
    "eido_mvp_stage_duration_seconds",
    "Duration of individual pipeline stages",
    ["stage", "status"],  # stage: ideation, architecture, etc.
    buckets=[5, 10, 30, 60, 120, 300, 600, 1200],
    registry=metrics_registry
)

mvp_stage_cost = Histogram(
    "eido_mvp_stage_cost_dollars",
    "Cost of individual pipeline stages in USD",
    ["stage"],
    buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0, 10.0],
    registry=metrics_registry
)

mvp_stage_tokens = Histogram(
    "eido_mvp_stage_tokens_total",
    "Tokens used in individual pipeline stages",
    ["stage"],
    buckets=[100, 500, 1000, 5000, 10000, 25000, 50000],
    registry=metrics_registry
)

mvp_stage_failure_total = Counter(
    "eido_mvp_stage_failure_total",
    "Total number of stage failures",
    ["stage", "error_type"],
    registry=metrics_registry
)

# ============================================================================
# LLM METRICS
# ============================================================================

llm_requests_total = Counter(
    "eido_llm_requests_total",
    "Total number of LLM API requests",
    ["model", "task_type", "status"],  # status: success, failure
    registry=metrics_registry
)

llm_request_duration = Histogram(
    "eido_llm_request_duration_seconds",
    "Duration of LLM API requests",
    ["model", "task_type"],
    buckets=[0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 30.0, 60.0],
    registry=metrics_registry
)

llm_tokens_used = Histogram(
    "eido_llm_tokens_used_total",
    "Tokens used per LLM request",
    ["model", "task_type"],
    buckets=[100, 500, 1000, 2000, 5000, 10000, 25000],
    registry=metrics_registry
)

llm_cost = Histogram(
    "eido_llm_cost_dollars",
    "Cost per LLM request in USD",
    ["model", "task_type"],
    buckets=[0.001, 0.01, 0.05, 0.1, 0.5, 1.0, 2.0],
    registry=metrics_registry
)

llm_errors_total = Counter(
    "eido_llm_errors_total",
    "Total number of LLM errors",
    ["model", "error_type"],  # timeout, rate_limit, invalid_response, etc.
    registry=metrics_registry
)

llm_retry_total = Counter(
    "eido_llm_retry_total",
    "Total number of LLM retries",
    ["model", "task_type"],
    registry=metrics_registry
)

# ============================================================================
# TOOL EXECUTION METRICS
# ============================================================================

tool_invocations_total = Counter(
    "eido_tool_invocations_total",
    "Total number of tool invocations",
    ["tool_name", "status"],  # success, failure
    registry=metrics_registry
)

tool_execution_duration = Histogram(
    "eido_tool_execution_duration_seconds",
    "Duration of tool executions",
    ["tool_name"],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0],
    registry=metrics_registry
)

tool_sandbox_violations_total = Counter(
    "eido_tool_sandbox_violations_total",
    "Total number of tool sandbox violations",
    ["violation_type"],  # path_violation, size_violation, command_violation, etc.
    registry=metrics_registry
)

# ============================================================================
# HTTP METRICS
# ============================================================================

http_requests_total = Counter(
    "eido_http_requests_total",
    "Total number of HTTP requests",
    ["method", "endpoint", "status_code"],
    registry=metrics_registry
)

http_request_duration = Histogram(
    "eido_http_request_duration_seconds",
    "Duration of HTTP requests",
    ["method", "endpoint"],
    buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0, 10.0],
    registry=metrics_registry
)

http_requests_in_progress = Gauge(
    "eido_http_requests_in_progress",
    "Number of HTTP requests currently being processed",
    ["method", "endpoint"],
    registry=metrics_registry
)

# ============================================================================
# RATE LIMITING METRICS
# ============================================================================

rate_limit_exceeded_total = Counter(
    "eido_rate_limit_exceeded_total",
    "Total number of rate limit violations",
    ["endpoint", "client_type"],  # client_type: user, ip, apikey
    registry=metrics_registry
)

# ============================================================================
# ERROR METRICS
# ============================================================================

errors_total = Counter(
    "eido_errors_total",
    "Total number of errors",
    ["error_type", "component"],  # component: pipeline, llm, tool, api, etc.
    registry=metrics_registry
)

cost_limit_exceeded_total = Counter(
    "eido_cost_limit_exceeded_total",
    "Total number of cost limit violations",
    registry=metrics_registry
)

runtime_limit_exceeded_total = Counter(
    "eido_runtime_limit_exceeded_total",
    "Total number of runtime limit violations",
    registry=metrics_registry
)

# ============================================================================
# SYSTEM METRICS
# ============================================================================

database_connections = Gauge(
    "eido_database_connections",
    "Number of active database connections",
    registry=metrics_registry
)

# ============================================================================
# BUSINESS METRICS
# ============================================================================

daily_cost_total = Gauge(
    "eido_daily_cost_dollars",
    "Total cost for current day in USD",
    registry=metrics_registry
)

daily_mvp_count = Gauge(
    "eido_daily_mvp_count",
    "Number of MVPs created today",
    registry=metrics_registry
)

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def track_mvp_pipeline_duration(duration_seconds: float, status: str):
    """Track MVP pipeline duration."""
    mvp_pipeline_duration.labels(status=status).observe(duration_seconds)


def track_mvp_pipeline_cost(cost_dollars: float, status: str, tokens: int):
    """Track MVP pipeline cost and tokens."""
    mvp_pipeline_cost.labels(status=status).observe(cost_dollars)
    mvp_pipeline_tokens.labels(status=status).observe(tokens)


def track_mvp_stage_duration(stage: str, duration_seconds: float, status: str):
    """Track stage duration."""
    mvp_stage_duration.labels(stage=stage, status=status).observe(duration_seconds)


def track_mvp_stage_cost(stage: str, cost_dollars: float, tokens: int):
    """Track stage cost and tokens."""
    mvp_stage_cost.labels(stage=stage).observe(cost_dollars)
    mvp_stage_tokens.labels(stage=stage).observe(tokens)


def track_llm_request(
    model: str,
    task_type: str,
    duration_seconds: float,
    tokens: int,
    cost_dollars: float,
    status: str
):
    """Track LLM request metrics."""
    llm_requests_total.labels(model=model, task_type=task_type, status=status).inc()
    llm_request_duration.labels(model=model, task_type=task_type).observe(duration_seconds)
    llm_tokens_used.labels(model=model, task_type=task_type).observe(tokens)
    llm_cost.labels(model=model, task_type=task_type).observe(cost_dollars)


def track_tool_invocation(tool_name: str, duration_seconds: float, status: str):
    """Track tool invocation metrics."""
    tool_invocations_total.labels(tool_name=tool_name, status=status).inc()
    tool_execution_duration.labels(tool_name=tool_name).observe(duration_seconds)


def increment_error_counter(error_type: str, component: str):
    """Increment error counter."""
    errors_total.labels(error_type=error_type, component=component).inc()


def get_metrics_handler() -> Response:
    """Get Prometheus metrics endpoint handler."""
    metrics_data = generate_latest(metrics_registry)
    return Response(content=metrics_data, media_type=CONTENT_TYPE_LATEST)
