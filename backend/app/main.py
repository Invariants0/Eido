from fastapi import FastAPI
from .api.routes import health

app = FastAPI(title="EIDO Backend", version="0.1.0")

# initialize database
from .db import init_db
init_db()

app.include_router(health.router)

# include other routers as they are defined
# from .api.routes import mvp
# app.include_router(mvp.router, prefix="/api/mvp")

@app.get("/")
def root():
    return {"status": "ok", "message": "EIDO backend is running"}
