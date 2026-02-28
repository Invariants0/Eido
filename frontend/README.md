# EIDO Frontend

Next.js 16 dashboard for the EIDO autonomous startup pipeline.

## Setup

```bash
bun install
bun run dev
# → http://localhost:3000
```

## Environment

Create `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_DEMO_MODE=false
```

## Stack

- Next.js 16 (App Router) · React 19 · Tailwind CSS v4
- Axios · Native EventSource (SSE) · Three.js · Motion
