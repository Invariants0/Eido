# EIDO – Autonomous Startup Factory

## 1. Final Hackathon PRD (SURGE × OpenClaw)

---

## 2. Executive Summary

**EIDO is an autonomous startup entity that discovers real-world problems, builds MVPs, deploys them in a sandbox, tokenizes each MVP using SURGE, and iterates publicly via Moltbook.**

EIDO is designed specifically to:
- Demonstrate strong agent autonomy
- Execute multi-step workflows
- Self-correct build failures
- Integrate OpenClaw deeply
- Showcase economic intent via tokenization
- Qualify strongly under hackathon judging criteria and bonus points

**Primary Track:** Agent Execution & Real World Actions  
**Target Prize Category:** Internet Capital Markets for Creators/Products

---

## 3. Problem Statement

### Current Challenges
- Building MVPs is manual and time-consuming
- Idea validation requires technical skill
- AI code generation is unstable and unpredictable
- LLM context grows large and expensive
- Autonomous coding systems often fail due to orchestration complexity

### Solution Approach
There is no structured, self-healing, token-aware autonomous startup engine integrated with OpenClaw and SURGE.

EIDO solves this by combining:
- Structured multi-agent orchestration
- Deterministic scaffolding
- Controlled build sandbox
- Token optimization layer
- Economic prioritization
- Public feedback loop

---

## 4. Core Goals (Aligned With Hackathon Criteria)

### 4.1 Application of Technology
- Deep OpenClaw integration
- SURGE token per MVP
- Moltbook autonomous posting
- Multi-agent orchestration framework

### 4.2 Strong Autonomy
- Idea discovery → planning → building → fixing → deploying → tokenizing → posting
- Self-healing build loop
- Long-running agent execution

### 4.3 Creative Integrations
- Browser scraping
- Terminal execution
- File system writes
- Sandbox container builds
- Token optimization (Toon)
- Deployment (here.now)

### 4.4 Community Impact
- Open-source reusable skills
- Template-driven startup scaffolding
- Public proof-of-life posting

---

## 5. Core Concept – Founder Workflow Replacement

EIDO replaces the early-stage founder workflow with autonomous agent roles.

### Traditional Founder Flow:
```
🧠 Idea Discovery  
🧱 Architecture Planning  
🧑‍💻 MVP Building  
🚀 Deployment  
📧 Investor Outreach  
📊 Feedback Analysis  
🔁 Iteration
```

EIDO mirrors this using specialized agents coordinated via CrewAI.

---

## 6. Agent Architecture (Role-Based System)

EIDO operates using structured multi-agent orchestration instead of a single monolithic agent.

### 6.1 Manager Agent (Supervisor)
- Coordinates entire workflow
- Delegates tasks to other agents
- Tracks state transitions
- Ensures deterministic pipeline

### 6.2 Ideation Agent
- Scrapes problem sources
- Extracts structured ideas
- Scores feasibility
- Stores top candidate in memory

### 6.3 Architecture Agent
- Converts idea into structured system design
- Selects from pre-approved stack template
- Defines folder structure + API contracts
- Generates build blueprint

### 6.4 Builder Agent
- Generates scaffold from deterministic template
- Writes files via OpenClaw file system tool
- Executes build via terminal tool
- Reports build logs

### 6.5 DevOps / Deployment Agent
- Containerizes MVP
- Deploys via here.now
- Validates deployment health
- Returns public preview URL

### 6.6 Business Agent
- Creates SURGE token metadata per MVP
- Links token to project dashboard
- Simulates prioritization logic
- Generates pitch summary (not real outreach for MVP scope)

### 6.7 Feedback Agent
- Parses Moltbook responses
- Summarizes engagement
- Updates idea scoring model
- Feeds signal back to Manager Agent

This modular architecture reduces unpredictability and improves reliability.

---

## 7. System Architecture

### 7.1 High-Level Flow

```
Idea Discovery Agent
         ↓
Planner Agent
         ↓
Toon Context Optimizer
         ↓
Builder Agent
         ↓
Sandbox Build (Docker)
         ↓
Self-Heal Reflection Agent
         ↓
Deployment (here.now)
         ↓
SURGE Token Creation
         ↓
Moltbook Posting
         ↓
Memory Update
```

---

## 8. Technology Stack

### 8.1 Core Runtime
- OpenClaw (Agent execution & tools)

### 8.2 Multi-Agent Orchestration (Primary)
- CrewAI (role-based orchestration)

### Supporting References & Patterns:
- AutoGPT (autonomous loops inspiration)
- SuperAGI (agent lifecycle management)
- Claude-Flow (multi-agent workflow concepts)
- AutoAgent (workflow self-generation concepts)
- OpenAI Agents SDK (handoffs & guardrails)
- Designing Multi-Agent Systems (architecture patterns)

CrewAI will act as the structured orchestration layer.

---

## 9. Token Optimization Strategy

**Tool:** Toon

### Purpose:
- Context compression
- Selective file inclusion
- Dependency graph extraction
- Memory summarization
- Reduced token usage in build loop

### Implementation:
- File tree indexing
- Only relevant files passed to LLM
- Build logs summarized before reflection
- Periodic memory compression

This ensures predictable LLM behavior and lower cost.

---

## 10. Deployment Strategy

**Platform:** here.now

### Purpose:
- Persistent agent runtime
- Public deployment endpoint
- Sandbox hosting
- Stable demo environment

All MVP builds are containerized and deployed via here.now.

---

## 11. Core Modules

### 11.1 Idea Discovery Engine
- Scrapes Reddit / Hacker News / X
- Extracts structured problem data
- Scores urgency and feasibility

### 11.2 MVP Planner
- Generates tech stack (restricted to 1 template stack)
- Defines folder structure
- Defines features

**Restricted Stack (to reduce failure risk):**
- Frontend: Vite + React + Tailwind
- Backend: Minimal FastAPI template

### 11.3 MVP Builder
- Template-based scaffold generation
- File writing via OpenClaw file system tool
- Terminal execution for build

### 11.4 Self-Healing Build Loop
- Detect build failure
- Capture logs
- Compress logs via Toon
- Reflection agent suggests deterministic fix
- Retry build

**Max retry count:** 3

### 11.5 SURGE Token Layer
- Create token metadata per MVP
- Link token to MVP dashboard
- Simulated market validation

### 11.6 Moltbook Autonomous Posting
- Post milestone updates
- Post build failures
- Post deployment success
- Demonstrate persistent behavior

---

## 12. UI Dashboard

### 12.1 Eido Factory Overview
- List of MVPs
- Status (Idea / Building / Failed / Deployed)
- Token count
- Deployment link

### 12.2 MVP Detail Page
- Problem statement
- Architecture plan
- Build logs
- Token information
- Live sandbox preview

### 12.3 Agent Brain View
- Decision log
- Reflection summaries
- Retry history
- Memory snapshots

---

## 13. Scope Control (Critical for Winning)

We will:
- Build ONE fully working autonomous cycle
- Restrict tech stack to 1 deterministic template
- Avoid real investor outreach automation
- Avoid multi-MVP concurrency
- Focus on clean demo reliability

---

## 14. Hackathon Deliverables

### Required:
- Public GitHub repository
- Demo deployment URL
- X submission post (tag @lablabai + @Surgexyz_)
- Moltbook activity proof
- LabLab submission

### Bonus:
- Open-source reusable skills
- Publish self-heal agent as standalone skill

---

## 15. Demonstration Script (Winning Moment)

1. Agent scrapes idea
2. Generates MVP plan
3. Builds project
4. Build fails
5. Reflection agent fixes error
6. Build succeeds
7. Deployment via here.now
8. SURGE token created
9. Moltbook post published

Live autonomy demonstration.

---

## 16. Risk Assessment

### High Risk
- LLM build unpredictability

**Mitigation:**
- Template restriction
- Toon token control
- Controlled retry rules

### Medium Risk
- Orchestration complexity

**Mitigation:**
- CrewAI structured roles
- Single-cycle MVP

---

## 17. Unique Value Proposition

EIDO is not just an AI builder.

It is:

> "A tokenized autonomous startup entity that discovers, builds, deploys, and validates products continuously — with self-healing intelligence and economic feedback."

---

## 18. Why This Can Win

- High originality
- Strong autonomy
- Deep OpenClaw integration
- Visible demo impact
- Clear economic narrative
- Multi-agent orchestration
- Token optimization layer
- Public proof-of-life

This is a high-impact, high-differentiation hackathon strategy.

---

**End of PRD**