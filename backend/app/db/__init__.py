"""Database initialization and session management."""

from contextlib import contextmanager
from typing import Generator

from sqlmodel import SQLModel, Session, create_engine

from ..config.settings import config
from ..logger import get_logger

logger = get_logger(__name__)

engine = create_engine(
    config.DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False} if "sqlite" in config.DATABASE_URL else {},
)


def init_db() -> None:
    """Initialize database tables."""
    from ..models import agent_run, billing, mvp, token, user, waitlist

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
