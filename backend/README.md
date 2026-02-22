# EIDO Backend

This directory contains the FastAPI service powering the EIDO autonomous startup factory.

## Getting Started

1. Install Python 3.11+
2. Install dependencies with Poetry or pip:
   ```bash
   cd backend
   poetry install
   ```
3. Run the development server:
   ```bash
   poetry run uvicorn app.main:app --reload --port 8000
   ```

The service currently exposes:
- `GET /` health/status
- `GET /health` simple health check

This is a minimal scaffold; additional models, routes, and services will be added based on the technical spec.

Current structure:

```
app/
├── main.py                # FastAPI app entrypoint
├── api/
│   ├── routes/            # route definitions (health, mvp, etc.)
│   └── controllers/       # request handlers (to be implemented)
├── config/                # configuration utilities
├── db/                    # database connection and initialization
├── models/                # SQLModel data models (mvp, token, agent_run)
├── repositories/          # data access layer (to be implemented)
├── agent/                 # autonomous agent scaffolding (empty)
├── deployment/            # here.now deployment client (stub)
├── surge/                 # SURGE token integration (stub)
├── moltbook/              # Moltbook client (stub)
├── memory/                # execution memory storage (stub)
└── skills/                # OpenClaw skill definitions (markdown templates)
```

Run the server after creating the database file by starting Uvicorn as above. The `db.init_db()` call will create tables automatically.
