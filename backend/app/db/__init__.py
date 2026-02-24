"""Database initialization and session management."""

from sqlmodel import SQLModel, create_engine, Session
from contextlib import contextmanager
from typing import Generator
from ..config.settings import config
from ..logger import get_logger

logger = get_logger(__name__)

# Create engine with connection pooling
engine = create_engine(
    config.DATABASE_URL,
    echo=False,  # We manage logging via app.logging, not engine echo
    connect_args={"check_same_thread": False} if "sqlite" in config.DATABASE_URL else {},
)


def init_db() -> None:
    """Initialize database tables."""
    from ..models import mvp, agent_run, token
    
    logger.info("Initializing database tables")
    SQLModel.metadata.create_all(engine)
    logger.success("Database tables initialized successfully")


def get_session() -> Generator[Session, None, None]:
    """Dependency injection for database sessions."""
    with Session(engine) as session:
        yield session


@contextmanager
def get_session_context():
    """Context manager for database sessions."""
    with Session(engine) as session:
        yield session
