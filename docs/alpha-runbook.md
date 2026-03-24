# Eido Alpha Happy Path Runbook

## Goal
Validate a full authenticated MVP run from request to pipeline completion with visible stage logs.

## Prerequisites
- Backend running on `http://localhost:8000`
- Frontend running on `http://localhost:3000`
- `GROQ_API_KEY` configured in `backend/.env`
- Optional integrations:
  - `SURGE_API_KEY`
  - `MOLTBOOK_API_KEY`
  - `HERENOW_API_KEY`
- Google OAuth configured for frontend sign-in (see `docs/auth-secrets.md`)

## Happy Path Steps
1. Sign in using Google on the landing page.
2. Open Dashboard and confirm billing status shows `free run: available`.
3. Start a new MVP run with idea summary.
4. Open MVP detail page and watch SSE events:
   - `stage_started`
   - `stage_completed`
   - `pipeline_completed`
5. Confirm `/api/mvp/{id}` returns:
   - `status: COMPLETED` (or stage-progress states before completion)
   - `last_error_stage: null` on success.

## Failure Injection Checks
- Trigger invalid payment token after free run is consumed:
  - Expect `402 PAYMENT_REQUIRED` from `/api/mvp/start`.
- Misconfigure LLM key:
  - Expect failure event via SSE (`stage_failed` / `pipeline_failed`).
  - Expect `last_error_stage` and `last_error_message` populated in MVP record.

## Observability Checks
- Confirm each stage creates `agent_run` records.
- Confirm SSE includes stage-level lifecycle events.
- Confirm crash recovery resumes non-terminal pipelines on restart.

## Known Alpha Limitations
- Billing validation is mock-based (deterministic token flow) for reliability.
- Some non-core API routes remain simplified stubs.
- Tokenization and deployment can operate in mock mode when service keys are absent.
