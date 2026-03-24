from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.middleware.error_handler import register_exception_handlers
from .api.middleware.request_logging import RequestLoggingMiddleware
from .api.routes import dashboard, health, mvp
from .api.routes.agent_routes import router as agent_router
from .api.routes.auth_routes import router as auth_router
from .api.routes.billing_routes import router as billing_router
from .api.routes.deploy_routes import router as deploy_router
from .api.routes.token_routes import router as token_router
from .api.routes.users_routes import router as users_router
from .api.routes.waitlist_routes import router as waitlist_router
from .config.settings import config
from .db import init_db
from .logger import configure_logging, get_logger
from .middleware.metrics_middleware import metrics_middleware
from .middleware.rate_limiter import rate_limit_middleware
from .monitoring import deep_health_check, get_metrics_handler, health_check
from .services.pipeline import resume_incomplete_pipelines

configure_logging(log_level=config.LOG_LEVEL)
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting EIDO backend")

    import asyncio

    from .services.sse_service import sse_manager

    sse_manager.set_loop(asyncio.get_running_loop())

    logger.info(f"Environment: {config.ENVIRONMENT}")
    logger.info(f"Rate limiting: {'enabled' if config.RATE_LIMIT_ENABLED else 'disabled'}")
    logger.info(f"Metrics: {'enabled' if config.METRICS_ENABLED else 'disabled'}")

    init_db()
    await resume_incomplete_pipelines()

    logger.success("EIDO backend is fully initialized and ready")
    yield
    logger.warning("Shutting down EIDO backend")


app = FastAPI(
    title=config.APP_NAME,
    version=config.APP_VERSION,
    debug=config.DEBUG,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if config.METRICS_ENABLED:
    app.middleware("http")(metrics_middleware)
    logger.info("Metrics middleware enabled")

if config.RATE_LIMIT_ENABLED:
    app.middleware("http")(rate_limit_middleware)
    logger.info(f"Rate limiting enabled (storage: {config.RATE_LIMIT_STORAGE})")

app.add_middleware(RequestLoggingMiddleware)
register_exception_handlers(app)

app.include_router(health.router, tags=["health"])
app.include_router(mvp.router, prefix="/api/mvp", tags=["mvp"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(users_router, prefix="/api/users", tags=["users"])
app.include_router(waitlist_router, prefix="/api/waitlist", tags=["waitlist"])
app.include_router(billing_router, prefix="/api/billing", tags=["billing"])
app.include_router(agent_router, prefix="/api/agent", tags=["agent"])
app.include_router(token_router, prefix="/api/token", tags=["token"])
app.include_router(deploy_router, prefix="/api/deploy", tags=["deploy"])

if config.METRICS_ENABLED:

    @app.get(config.METRICS_PATH, include_in_schema=False)
    async def metrics():
        return get_metrics_handler()


@app.get("/health")
async def health_endpoint():
    return await health_check()


@app.get("/health/deep")
async def health_deep():
    return await deep_health_check()


@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "EIDO backend is running",
        "version": config.APP_VERSION,
        "features": {
            "rate_limiting": config.RATE_LIMIT_ENABLED,
            "metrics": config.METRICS_ENABLED,
        },
    }
