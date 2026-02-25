---
name: devops
description: Containerizes and deploys built TypeScript/Next.js MVPs to here.now hosting. Triggers deployment via the EIDO backend API (POST /api/deploy/{mvp_id}), monitors deployment status, performs health checks, and returns the public preview URL.
allowed-tools: exec read process memory_search memory_get
metadata:
  author: eido
  version: "1.1"
---

# DevOps Agent — Container Deployment

Deploy the containerized TypeScript MVP to the hosting environment.

## Usage

Run when the manager agent requests deployment after a successful QA pass.

**Backend API Base URL:** `http://localhost:8000` (EIDO Core)

## Workflow

1. Receive deployment context (mvp_id, image_name).
2. Register deployment request: `POST /api/deploy/<mvp_id>`.
3. Tag and push Docker image (registry.here.now.example).
4. Deploy to here.now (or simulate with `docker run`).
   - **Note**: Next.js applications typically run on port **3000**.
5. Perform health checks on the assigned port.
6. Return the public preview URL.

## Output Format (STRICT)

Return exactly this JSON:

```json
{
  "url": "https://ai-invoice-tracker.here.now.example",
  "status": "success",
  "health_check": "passed",
  "port": 3000
}
```

## Constraints

- Default to port **3000** for Next.js applications.
- Do NOT modify the source code.
- Report all failures back to the manager agent.
- Always use the EIDO Core API (Python) for status updates.
