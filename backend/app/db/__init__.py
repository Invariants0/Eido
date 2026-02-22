from sqlmodel import SQLModel, create_engine

DATABASE_URL = "sqlite:///./eido.db"
engine = create_engine(DATABASE_URL, echo=True)


def init_db():
    from ..models import mvp, token, agent_run
    SQLModel.metadata.create_all(engine)
