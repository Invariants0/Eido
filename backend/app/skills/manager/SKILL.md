---
name: manager
description: Orchestrates the entire EIDO autonomous startup pipeline. Triggers MVP creation via API, spawns sub-agent skills in sequence (ideation → architecture → builder → devops → business → feedback), monitors pipeline state, enforces retry limits, and ensures deterministic stage transitions. Activate when a new MVP cycle is requested or when resuming an interrupted pipeline.
allowed-tools: exec read write memory_search memory_get sessions_spawn session_status process
metadata:
  author: eido
  version: "1.0"
---

# Manager Agent — Pipeline Orchestrator

## When to use this skill

Use this skill when:
- A new autonomous MVP cycle is requested
- A pipeline needs to be resumed after interruption
- You need to check the status of all running MVPs

## Configuration

**Backend API Base URL:** `http://localhost:8000`

All API calls use `exec` with `curl`. The backend must be running before activating this skill.

## Workflow

### Step 1 — Register the MVP

Create a new MVP record in the backend to get an `mvp_id`. This triggers the backend pipeline in the background.

```bash
exec curl -s -X POST http://localhost:8000/api/mvp/start \
  -H "Content-Type: application/json" \
  -d '{"name": "<mvp_name>", "idea_summary": "<idea_summary>"}'
```

Expected response:
```json
{
  "id": 1,
  "name": "AI Invoice Tracker",
  "status": "CREATED",
  "idea_summary": "...",
  "retry_count": 0,
  "created_at": "...",
  "updated_at": "..."
}
```

Extract `id` from the response. This is your `mvp_id` for all subsequent steps.

### Step 2 — Spawn Ideation Agent

Delegate idea discovery to the ideation skill:

```
sessions_spawn: task="Discover and score a viable startup idea. Search Reddit, Hacker News, and X for real-world problems. Return a structured JSON with idea, score, source, target_user, and urgency.", agentId="ideation"
```

Wait for the result. The ideation agent will return a structured idea JSON.

### Step 3 — Spawn Architecture Agent

Pass the idea to the architecture agent:

```
sessions_spawn: task="Generate a technical blueprint for this idea: <idea_json>. Select from the approved stack (Vite+React+Tailwind frontend, FastAPI backend). Return folder structure, API spec, and feature list.", agentId="architecture"
```

Wait for the blueprint result.

### Step 4 — Spawn Builder Agent

Pass the blueprint to the builder agent:

```
sessions_spawn: task="Build the MVP using this blueprint: <blueprint_json>. Generate scaffold files, run Docker build, self-heal on failures (max 3 retries). Return build status.", agentId="builder"
```

Wait for the build result. If `build_status` is `"failed"` after 3 retries, mark the pipeline as failed and stop.

### Step 5 — Monitor Pipeline Progress

Poll the backend to verify the pipeline state matches expectations:

```bash
exec curl -s http://localhost:8000/api/mvp/<mvp_id>
```

Check the `status` field. Valid progression:
`CREATED → IDEATING → ARCHITECTING → BUILDING → DEPLOYING → TOKENIZING → COMPLETED`

If status is `BUILD_FAILED` or `DEPLOY_FAILED`, check `retry_count`. If `retry_count >= 3`, stop the pipeline.

### Step 6 — Spawn DevOps Agent

Delegate deployment:

```
sessions_spawn: task="Deploy MVP <mvp_id> to here.now. Containerize, push, verify health, return the public URL.", agentId="devops"
```

Wait for deployment URL.

### Step 7 — Spawn Business Agent

Delegate tokenization:

```
sessions_spawn: task="Create a SURGE token for MVP <mvp_id>. Use testnet. Return token_id and contract_address.", agentId="business"
```

Wait for token result.

### Step 8 — Spawn Feedback Agent

Delegate Moltbook posting:

```
sessions_spawn: task="Post a milestone update to Moltbook for MVP <mvp_id>. Include: idea summary, build status, deployment URL, token info. Parse any engagement responses.", agentId="feedback"
```

### Step 9 — Verify Completion

Final status check:

```bash
exec curl -s http://localhost:8000/api/mvp/<mvp_id>
```

Confirm `status` is `"COMPLETED"`. Log the full pipeline run.

### Step 10 — Fetch All Runs

Retrieve the execution history:

```bash
exec curl -s http://localhost:8000/api/mvp/<mvp_id>/runs
```

Store the results in memory for audit and future feedback loops.

## Output Format (STRICT)

Return ONLY valid JSON:

```json
{
  "mvp_id": 1,
  "mvp_name": "AI Invoice Tracker",
  "final_status": "COMPLETED",
  "deployment_url": "https://ai-invoice-tracker.here.now.example",
  "token_id": "EIDO-001",
  "stages_completed": ["ideation", "architecture", "building", "deployment", "tokenization"],
  "total_retries": 0
}
```

## Error Handling

- If any `curl` call returns a non-200 status, retry once after 5 seconds.
- If a spawned agent fails, log the error and check `retry_count` on the backend.
- If `retry_count >= 3`, transition to FAILED and stop the pipeline.
- Never run more than 3 retries for any single stage.

## Constraints

- Maximum retries per stage: 3
- Maximum total pipeline runtime: 3600 seconds
- Maximum total cost: $10.00 USD
- Sequential execution only — never run stages in parallel
- Do NOT perform business logic — only orchestrate and delegate
- Do NOT browse the internet — that is the ideation agent's job
- Do NOT write code files — that is the builder agent's job
