# EIDO – Reference Integration & Engineering Strategy

## 1. Technical Implementation Document

This document defines how EIDO integrates external open-source frameworks and research patterns into our codebase.

We are NOT building a full agent framework from scratch.  
We are leveraging proven systems and extracting only what is necessary for hackathon execution.

---

## 2. Reference Integration Plan (Technical Implementation Strategy)

This section clarifies **which references are used as real SDK dependencies** and which are adopted only as architectural patterns.

We will NOT stack multiple orchestration engines.  
We will use a single backbone to avoid instability.

---

### 2.1 CrewAI – Primary Orchestration Backbone (REAL DEPENDENCY)

Status: ✅ Installed and used directly

- `pip install crewai`
- Used for role-based agent orchestration
- Sequential execution pipeline only
- Handles task delegation and memory passing

CrewAI is the ONLY multi-agent runtime layer used.

We do NOT modify CrewAI internals.

---

### 2.2 AutoGPT – Reflection Pattern (PATTERN ONLY)

Status: ❌ Not installed

We extract only the architectural idea:

Plan → Execute → Evaluate → Reflect → Retry

Implemented manually in:

`backend/app/agent/reflection_loop.py`

No AutoGPT runtime is used.

---

### 2.3 SuperAGI – Lifecycle Logging Pattern (PATTERN ONLY)

Status: ❌ Not installed

We borrow ideas for:

- Task state tracking
- Step logging
- Execution metadata

Implemented internally using SQLite.

---

### 2.4 Claude-Flow – Workflow Inspiration (PATTERN ONLY)

Status: ❌ Not installed

Used as architectural reference for:

- Clear agent boundaries
- Avoiding swarm chaos
- Structured communication

No direct code integration.

---

### 2.5 AutoAgent (HKUDS) – Structured Workflow Pattern (PATTERN ONLY)

Status: ❌ Not installed

Borrowed concepts:

- Converting high-level ideas into structured execution steps
- Enforcing strict structured JSON outputs

Implemented using Pydantic models.

---

### 2.6 OpenAI Agents SDK – Guardrail Concept (PATTERN ONLY)

Status: ❌ Not installed

We do NOT install OpenAI Agents SDK to avoid orchestration conflict.

We adopt only:

- Stage validation logic
- Strict handoff rules
- Structured output enforcement

ManagerAgent enforces stage transitions manually.

---

### 2.7 Designing Multi-Agent Systems – Supervisor Pattern (PATTERN ONLY)

Status: ❌ Not installed

We adopt the Supervisor pattern:

ManagerAgent controls:
- Execution order
- Retry limits
- Abort conditions
- Memory writes

Prevents recursive loops.

---

### 2.8 Toon – Token Optimization Layer (DEPENDENCY)

Status: ✅ Integrated if SDK available

Used for:

- Context compression
- Dependency graph filtering
- Build log summarization
- Memory pruning

Integration module:

`backend/app/agent/context_optimizer.py`

Toon sits between agents and LLM calls.

---

### 2.9 here.now – Deployment Layer (SERVICE INTEGRATION)

Status: ✅ Integrated via API wrapper

Used for:

- Container deployment
- Persistent hosting
- Public preview URL

Integration wrapper:

`backend/app/deployment/herenow_client.py`

---

### 2.10 SURGE – Tokenization Layer (SERVICE INTEGRATION)

Status: ✅ Integrated via OpenClaw skill

Used for:

- Token metadata creation
- Token association with MVP
- Dashboard display

Testnet only.

---

## 3. What We Are NOT Building From Scratch

We are NOT building:

- Custom multi-agent orchestration engine
- Custom scheduling system
- Custom memory engine
- Custom container runtime
- Custom blockchain protocol

We leverage:

- CrewAI → Orchestration
- Toon → Token optimization
- here.now → Deployment
- SURGE → Tokenization
- OpenClaw → Execution runtime

We build only:

- Deterministic scaffold generator
- Controlled build + self-heal loop
- Structured founder workflow pipeline

---

## 4. Engineering Principles

1. Deterministic > Creative chaos
2. Sequential pipeline > Parallel swarm
3. Template scaffolding > Free-form code generation
4. Strict validation > Loose LLM output
5. Controlled retries (max 3) > Infinite loops
6. Token-efficient prompts > Full repository dumps
7. Single MVP cycle > Multi-MVP concurrency

---

## 5. Reference Links

**CrewAI:**  
https://github.com/crewAIInc/crewAI

**AutoGPT:**  
https://github.com/Significant-Gravitas/AutoGPT

**SuperAGI:**  
https://github.com/TransformerOptimus/SuperAGI

**Claude-Flow:**  
https://github.com/ruvnet/claude-flow

**AutoAgent (HKUDS):**  
https://github.com/HKUDS/AutoAgent

**OpenAI Agents SDK:**  
https://github.com/openai/openai-agents-python

**Designing Multi-Agent Systems:**  
https://github.com/victordibia/designing-multiagent-systems

---

**End of Technical Integration Document**