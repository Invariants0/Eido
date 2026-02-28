# EIDO Backend

FastAPI service powering the EIDO autonomous startup pipeline.

## Setup

```bash
uv sync                  # creates .venv and installs all deps
cp .env.example .env     # then add your API keys
uv run python start.py
# → http://localhost:8000
# → http://localhost:8000/docs
```

## Key env vars

| Variable | Required | Purpose |
|----------|----------|---------|
| `GROQ_API_KEY` | ✅ | LLM inference |
| `SURGE_API_KEY` | optional | Token launch on Base |
| `MOLTBOOK_API_KEY` | optional | Social publishing |
| `E2B_API_KEY` | optional | Code sandbox |

See `app/config/settings.py` for the full list.

## Stack

- FastAPI · SQLModel · Pydantic v2
- CrewAI · LiteLLM (Groq)
- slowapi · Prometheus · Loguru

The service currently exposes:
- `GET /` health/status
- `GET /health` simple health check

This is a production-grade backend with industry-standard folder structure.

New production features:

```
app/
├── main.py                    # FastAPI with CORS & exception handlers
├── config/
│   └── settings.py           # .env configuration support
├── exceptions.py             # Custom exception classes
├── api/
│   ├── routes/               # Route definitions
│   ├── controllers/          # Request handlers
│   ├── services/             # Business logic
│   └── schemas/              # Pydantic API models
├── middleware/               # Error handlers, logging
├── models/                   # SQLModel DB tables (not API)
├── repositories/             # Data access layer (DAOs)
├── agent/                    # Autonomous agent layer
├── db/                       # Database config
├── integrations/             # External APIs (surge, moltbook, deployment)
├── utils/                    # Validators, decorators
└── memory/                   # Agent state & logs
```

## Key Changes

- **Schemas folder**: API contracts decoupled from DB models
- **Exceptions.py**: Centralized error handling
- **Middleware**: CORS and global error handlers
- **Integrations folder**: Single-file wrappers for external APIs (not separate folders)
- **Config/settings.py**: 12-factor configuration with .env support
- **Utils folder**: Helper functions and decorators
- **.env.example**: Template for environment variables
- **.gitignore**: Python and environment files excluded
