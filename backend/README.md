# EIDO Backend

This directory contains the FastAPI service powering the EIDO autonomous startup factory.

## Getting Started

1. Install Python 3.11+
2. Install Poetry: `pip install poetry`
3. Install dependencies:
   ```bash
   cd backend
   poetry install
   ```
4. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```
5. Run the development server:
   ```bash
   poetry run uvicorn app.main:app --reload --port 8000
   ```

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
