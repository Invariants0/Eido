from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .config.settings import config
from .db import init_db
from .logger import configure_logging, get_logger
from .api.middleware.error_handler import register_exception_handlers
from .api.middleware.request_logging import RequestLoggingMiddleware
from .middleware.rate_limiter import rate_limit_middleware
from .middleware.metrics_middleware import metrics_middleware
from .monitoring import get_metrics_handler, health_check, deep_health_check
from .api.routes import health, mvp
from .services.pipeline import resume_incomplete_pipelines

# Configure logging
configure_logging(log_level=config.LOG_LEVEL)
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown."""
    # Startup
    logger.info("Starting EIDO backend")
    logger.info(f"Environment: {config.ENVIRONMENT}")
    logger.info(f"Rate limiting: {'enabled' if config.RATE_LIMIT_ENABLED else 'disabled'}")
    logger.info(f"Metrics: {'enabled' if config.METRICS_ENABLED else 'disabled'}")
    
    init_db()
    
    # Crash recovery: resume incomplete pipelines
    await resume_incomplete_pipelines()
    
    logger.success("EIDO backend is fully initialized and ready")
    
    yield
    
    # Shutdown
    logger.warning("Shutting down EIDO backend")


# Initialize FastAPI app
app = FastAPI(
    title=config.APP_NAME,
    version=config.APP_VERSION,
    debug=config.DEBUG,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Metrics middleware (must be before rate limiter to track rate limit violations)
if config.METRICS_ENABLED:
    app.middleware("http")(metrics_middleware)
    logger.info("Metrics middleware enabled")

# Rate limiting middleware
if config.RATE_LIMIT_ENABLED:
    app.middleware("http")(rate_limit_middleware)
    logger.info(f"Rate limiting enabled (storage: {config.RATE_LIMIT_STORAGE})")

# Custom logging middleware (tracks request timing)
app.add_middleware(RequestLoggingMiddleware)

# Register exception handlers
register_exception_handlers(app)

# Include routers
app.include_router(health.router, tags=["health"])
app.include_router(mvp.router, prefix="/api/mvp", tags=["mvp"])

# Metrics endpoint
if config.METRICS_ENABLED:
    @app.get(config.METRICS_PATH, include_in_schema=False)
    async def metrics():
        """Prometheus metrics endpoint."""
        return get_metrics_handler()

# Health check endpoints
@app.get("/health")
async def health():
    """Basic health check."""
    return await health_check()

@app.get("/health/deep")
async def health_deep():
    """Deep health check with external dependencies."""
    return await deep_health_check()

# Include other routers as they are defined
# from .api.routes import agent_routes, token_routes, deploy_routes
# app.include_router(agent_routes.router, prefix="/api/agent", tags=["agent"])
# app.include_router(token_routes.router, prefix="/api/token", tags=["token"])
# app.include_router(deploy_routes.router, prefix="/api/deploy", tags=["deploy"])

@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "EIDO backend is running",
        "version": config.APP_VERSION,
        "features": {
            "rate_limiting": config.RATE_LIMIT_ENABLED,
            "metrics": config.METRICS_ENABLED,
        }
    }
