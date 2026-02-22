# Eido — Autonomous Startup Factory

EIDO is an autonomous startup factory built for the **SURGE × OpenClaw Hackathon**.

It discovers problems, builds MVPs, deploys them, tokenizes ownership via SURGE, and posts updates to Moltbook—all autonomously.

---

## 📊 Current Status

### ✅ Implemented
- **Frontend**: Next.js 15 UI prototype with mock data (dashboard, MVP detail, agent brain, tokens, settings)
- **Backend**: Production-grade FastAPI scaffold with full folder structure
  - Structured logging (JSON)
  - Exception handling (centralized)
  - Environment configuration (.env support)
  - Pydantic schemas (MVPCreate, MVPUpdate, TokenCreate, AgentRunCreate, etc.)
  - Database models (MVP, Token, AgentRun) using SQLModel
  - Skill templates for agents (manager, ideation, architecture, builder, devops, business, feedback)
  - Integration stubs (SURGE tokenization, Moltbook publishing, here.now deployment)

### 🟡 In Progress
- API route implementations (controllers + services layer)
- Repository layer (data access objects)
- Agent orchestration logic (CrewAI integration)
- Memory store (execution logs + state tracking)

### 🔴 Planned
- Frontend API integration (replace mock data)
- Agent pipeline execution (idea → build → deploy → tokenize → post)
- Self-healing build loop (error detection + retry)
- Real OpenClaw, SURGE, Moltbook integrations (with credentials)
- Database migrations (Alembic)
- Testing suite (pytest)

---

## 🏗️ Architecture Overview

### Backend Structure

```
backend/
├── app/
│   ├── main.py                      # FastAPI entrypoint
│   ├── logging.py                   # JSON structured logging
│   ├── exceptions.py                # Custom error classes
│   ├── config/
│   │   └── settings.py              # 12-factor config (.env)
│   ├── api/
│   │   ├── routes/                  # HTTP endpoints
│   │   │   ├── health.py
│   │   │   ├── mvp.py
│   │   │   ├── agent_routes.py
│   │   │   ├── token_routes.py
│   │   │   └── deploy_routes.py
│   │   ├── controllers/             # Request handlers (stubs)
│   │   ├── services/                # Business logic (stubs)
│   │   ├── schemas/                 # Pydantic API models
│   │   │   ├── mvp.py
│   │   │   ├── token.py
│   │   │   └── agent.py
│   │   └── middleware/              # CORS, error handlers
│   ├── models/                      # SQLModel DB tables
│   │   ├── mvp.py
│   │   ├── token.py
│   │   └── agent_run.py
│   ├── repositories/                # Data access layer (DAO)
│   ├── agent/                       # Orchestration & agent logic
│   ├── integrations/                # External APIs
│   │   ├── surge.py                 # SURGE tokenization
│   │   ├── moltbook.py              # Moltbook publishing
│   │   └── deployment.py            # here.now deployment
│   ├── utils/                       # Validators, decorators
│   ├── db/                          # Database connection
│   ├── memory/                      # Agent state + execution logs
│   └── skills/                      # OpenClaw skill definitions (SKILL.md templates)
```

### Frontend Structure

```
frontend/
├── app/
│   ├── layout.tsx                   # Global layout + navigation
│   ├── page.tsx                     # Dashboard home
│   ├── mvp/
│   │   ├── page.tsx                 # MVP list (mock data)
│   │   └── [id]/page.tsx            # MVP detail workspace
│   ├── brain/
│   │   └── page.tsx                 # Agent memory timeline (mock)
│   ├── tokens/
│   │   └── page.tsx                 # Token cards (mock data)
│   ├── settings/
│   │   └── page.tsx                 # Settings & controls
│   └── globals.css                  # Tailwind theme
├── components/
│   ├── sidebar.tsx                  # Navigation
│   └── dashboard-content.tsx        # Dashboard widgets
├── hooks/
│   └── use-mobile.ts                # Responsive breakpoint
└── lib/
    └── utils.ts                     # Tailwind cn() utility
```

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18+ (frontend)
- Python 3.11+ (backend)
- bun (frontend package manager)
- Poetry (Python dependency manager)

### Frontend

```bash
cd frontend
bun install
bun run dev
```

Runs on `http://localhost:3000`

### Backend

```bash
cd backend
poetry install
cp .env.example .env
# Edit .env with your API keys (optional for development)
poetry run uvicorn app.main:app --reload --port 8000
```

Runs on `http://localhost:8000`  
Docs available at `http://localhost:8000/docs`

---

## 📋 API Endpoints (Planned)

### MVP Management
- `GET /api/mvp/list` — List all MVPs
- `GET /api/mvp/{id}` — Get MVP details
- `POST /api/mvp/start` — Trigger full pipeline
- `DELETE /api/mvp/{id}` — Delete MVP

### Agent Control
- `POST /api/agent/run` — Manually trigger pipeline
- `GET /api/agent/status` — Get current stage & progress
- `GET /api/agent/logs` — Fetch execution logs

### Token Management
- `POST /api/token/create` — Create SURGE token
- `GET /api/token/{mvp_id}` — Get token details

### Deployment
- `POST /api/deploy/{mvp_id}` — Deploy MVP
- `GET /api/deploy/status/{mvp_id}` — Check deployment status

### Health
- `GET /health` — Service health check
- `GET /` — Status endpoint

---

## 🔧 Development Workflow

### Adding a Backend Endpoint

1. Create schema in `app/api/schemas/`
2. Create route in `app/api/routes/`
3. Create service in `app/api/services/` (business logic)
4. Create controller in `app/api/controllers/` (request handler)
5. Maybe create repository in `app/repositories/` (DB access)
6. Register router in `app/main.py`

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Critical
DATABASE_URL=sqlite:///./eido.db
ENVIRONMENT=development

# External services (optional for development)
SURGE_API_KEY=your_key_here
SURGE_TESTNET=true
MOLTBOOK_API_KEY=your_key_here
HERENOW_API_KEY=your_key_here

# Agent settings
MAX_AGENT_RETRIES=3
AGENT_TIMEOUT_SECONDS=300
```

---

## 📚 Documentation

All planning and specification documents are in `docs/`:

- **Eido-idea.md** — Product vision and features
- **eido-prd.md** — Final hackathon PRD and architecture
- **eido-tech-spec.md** — Complete technical specification
- **eido-integration.md** — Integration strategy (what's real vs. pattern)
- **hackathon-strategy.md** — Prize targeting and winning plan
- **codebase-index.md** — Project status and gaps

---

## 🎯 Immediate Next Steps

1. **Flesh out repositories** (MVP, Token, AgentRun DAOs)
2. **Implement service layer logic** (business logic for MVP lifecycle)
3. **Wire frontend to backend** (replace mock data with API calls)
4. **Build agent orchestrator** (CrewAI pipeline setup)
5. **Test integrations** (SURGE, Moltbook, here.now stubs → real calls)
6. **Self-healing build loop** (Docker build + error detection + retry)

---

## 📦 Technology Stack

### Frontend
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui components

### Backend
- FastAPI (Python 3.11+)
- SQLModel (ORM)
- Pydantic V2 (validation)
- CrewAI (agent orchestration)
- Python-dotenv (config)

### Infrastructure
- Docker (containerization)
- SQLite (development)
- here.now (deployment target)

### External Services
- OpenClaw (agent runtime)
- SURGE (tokenization)
- Moltbook (publishing)
- Toon (token optimization)

---

## 🤝 How to Contribute

1. Refer to `backend/README.md` and `frontend/README.md` for setup
2. Create a feature branch
3. Implement changes following the folder structure
4. Test locally
5. Open a PR

---

**Status**: Hackathon MVP in progress. Core infrastructure in place. Logic layer in development.

