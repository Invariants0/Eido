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
   # Edit .env with your API keys for SURGE, Moltbook, here.now
   ```
5. Run the development server:
   ```bash
   poetry run uvicorn app.main:app --reload --port 8000
   ```

The service exposes:
- `GET /` — health/status
- `GET /health` — simple health check
- `GET /api/mvp/list` — list all MVPs (placeholder)

## Project Structure

Production-grade backend following industry standards:

```
app/
├── main.py                    # FastAPI entrypoint with CORS & exception handlers
├── config/
│   └── settings.py           # Configuration with .env support
├── exceptions.py             # Custom exception classes
├── api/
│   ├── routes/               # Route definitions (HTTP layer)
│   │   ├── health.py
│   │   ├── mvp.py
│   │   ├── agent_routes.py
│   │   ├── token_routes.py
│   │   └── deploy_routes.py
│   ├── controllers/          # Request handlers (to be implemented)
│   ├── services/             # Business logic layer (to be implemented)
│   └── schemas/              # Pydantic API request/response models
│       ├── mvp.py
│       ├── token.py
│       └── agent.py
├── middleware/               # CORS, error handlers, logging
│   └── error_handler.py
├── models/                   # SQLModel database tables
│   ├── mvp.py
│   ├── token.py
│   └── agent_run.py
├── repositories/             # Data access layer (DAO pattern)
├── agent/                    # Autonomous agent layer
├── db/                       # Database connection & initialization
├── integrations/             # External service clients (surge, moltbook, deployment)
│   ├── surge.py
│   ├── moltbook.py
│   └── deployment.py
├── utils/                    # Helper functions and decorators
│   ├── validators.py
│   └── decorators.py
└── memory/                   # Agent state and execution logs
```

## Architecture Highlights

- **Schemas/Models Separation**: API contracts (Pydantic) separate from DB models (SQLModel)
- **Exception Handling**: Centralized custom exceptions with unified error responses
- **Configuration**: 12-factor app with `.env` file support
- **Integrations**: External APIs isolated in `integrations/` folder
- **Middleware**: CORS and error handlers registered globally
- **Logging**: Structured logging with decorators for debugging

## Development Workflow

### Adding a New Endpoint

1. Create a schema in `api/schemas/`
2. Create a route in `api/routes/`
3. Create a controller in `api/controllers/` (if complex)
4. Create a service in `api/services/` (for business logic)
5. Maybe create a repository in `repositories/` (for DB access)
6. Import and register the router in `main.py`

### Running Tests

```bash
poetry run pytest
```

## Environment Variables

See `.env.example` for all available configuration options.

**Critical for development:**
- `DATABASE_URL` — SQLite path (default: `./eido.db`)
- `SURGE_TESTNET` — Use SURGE testnet (default: true)
- `DEBUG` — Enable debug mode (default: false)

**Critical for production:**
- `SURGE_API_KEY` — Required
- `MOLTBOOK_API_KEY` — Required
- `HERENOW_API_KEY` — Required
