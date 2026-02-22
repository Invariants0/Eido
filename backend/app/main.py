from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config.settings import config
from .db import init_db
from .logging import configure_logging, get_logger
from .api.middleware.error_handler import register_exception_handlers
from .api.routes import health

# Configure logging
configure_logging(log_level=config.LOG_LEVEL)
logger = get_logger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title=config.APP_NAME,
    version=config.APP_VERSION,
    debug=config.DEBUG,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
init_db()

# Register exception handlers
register_exception_handlers(app)

# Include routers
app.include_router(health.router, tags=["health"])

# Include other routers as they are defined
# from .api.routes import mvp, agent_routes, token_routes, deploy_routes
# app.include_router(mvp.router, prefix="/api/mvp", tags=["mvp"])
# app.include_router(agent_routes.router, prefix="/api/agent", tags=["agent"])
# app.include_router(token_routes.router, prefix="/api/token", tags=["token"])
# app.include_router(deploy_routes.router, prefix="/api/deploy", tags=["deploy"])

@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "EIDO backend is running",
        "version": config.APP_VERSION,
    }
