# Detailed Backend Audit: Agents, Routes, Skills, and Gaps

This document provides a deep dive into the EIDO backend's current architecture, tracking the defined agents, API routes, operational skills, and pinpointing what needs to be implemented next based on the project requirements.

## 1. Registered Agent Roster
The agents are orchestrated using **CrewAI**. Currently, the configurations (Role, Goal, Backstory) are hardcoded inside `backend/app/services/ai_runtime/crewai_service.py's` `_get_agent()` method.

| Agent ID | CrewAI Role | Responsibility (Goal) | Current Tools |
| :--- | :--- | :--- | :--- |
| `analyst` | Business Analyst | Translate vague ideas into structured business requirements. | None |
| `researcher` | Market Researcher | Analyze market trends and competitor gaps. | `moltbook_tools` |
| `architect` | System Architect | Design scalable, modular system blueprints. | None |
| `tech_lead` | Tech Lead | Define the technical stack and coding standards. | None |
| `developer` | Full Stack Developer | Generate clean, production-ready code from blueprints. | **Needs OpenClaw File Tools** |
| `qa` | QA Engineer | Identify edge cases and validate build success. | **Needs OpenClaw Exec Tools** |
| `devops` | DevOps Engineer | Containerize and deploy applications with zero downtime. | **Needs Deploy Tools** |
| `blockchain` | Blockchain Specialist| Ensure seamless integration with SURGE tokenization. | **Needs Token Tools** |
| `social_manager` | Social Media Manager | Engage with the Moltbook community. | `moltbook_tools` |

---

## 2. API Routes Structure
The core router uses FastAPI. Currently, the MVP routes are operational, while other domains have placeholder controllers.

### 2.1 Implemented & Functional Routes
**Prefix:** `/api/mvp` (Controller: `mvp_controller.py`)
- **`POST /start`**: Starts the autonomous MVP pipeline in the background and returns a `202 Accepted` response.
- **`GET /list`**: Retrieves paginated list of all tracked MVPs.
- **`GET /{mvp_id}`**: Retrieves metadata and current status for a specific MVP.
- **`GET /{mvp_id}/runs`**: Fetches all execution traces/logs for the specific MVP pipeline.

**Prefix:** `/` (Controller: `health.py` & `main.py`)
- **`GET /`**: Root API message, confirming backend is running.
- **`GET /health`**: General application health check.

### 2.2 Stubbed/Empty Routes (Needs Implementation)
These files exist in `api/routes` and `api/controllers`, but they lack actual path operations.
- **`/api/agent`** (`agent_controller.py`): Meant for retrieving specific agent real-time logs, controlling agents, or pausing pipelines.
- **`/api/token`** (`token_controller.py`): Meant for manual interactions with the SURGE API (checking balances, manual minting).
- **`/api/deploy`** (`deploy_controller.py`): Meant for manually checking `here.now` deployment statuses.

---

## 3. Skills Registry & Usage
The project contains isolated "Skill definition" files located in `backend/app/skills/`. They use a `.md` format (e.g., `ideation/SKILL.md`) that outlines `Role`, `Allowed Tools`, `Workflow`, and `Output Format`. 

**Available Skills Folders:**
1. `architecture`
2. `builder`
3. `business`
4. `devops`
5. `feedback`
6. `ideation`
7. `manager`

**The Disconnect (Action Required):** 
While these markdown files exist, the backend **does not dynamically load them yet**. The agents in `crewai_service.py` have hardcoded descriptions instead of reading matching `SKILL.md` boundaries.

---

## 4. What We Need Next (Project Requirements)
To bridge the gap between "Generative Text Application" and "Working Autonomous System," the following technical blocks must be addressed.

### 4.1. Wire OpenClaw to the Developer/QA Agents
Currently, the "Developer Agent" is just producing text code blocks in context memory. 
- **Required Fix:** Inject `SafeToolExecutor` functions (`read_file`, `write_file`, `execute_command`) as wrapped decorators in `crewai_service.py`. This grants the Developer and QA agents actual filesystem execution capabilities inside the `/workspace` folder.

### 4.2. Dynamic Skill Ingestion
- **Required Fix:** Build a parser inside the `OpenClawService` or `CrewAIService` that reads the `app/skills/*/SKILL.md` files dynamically. The `Role`, `Constraints`, and `Output Format (STRICT)` from the markdown should completely populate the CrewAI Agent initialization. 

### 4.3. Implement Missing Routes
- **Required Fix:** Build out `/api/agent/stream` using Server-Sent Events (SSE). The frontend needs real-time agent console logs rather than polling `/api/mvp/{id}/runs`.

### 4.4. The Deterministic Error/Fix Loop
- **Required Fix:** When the QA agent runs a command (like `npm run build`), if the output stream yields `stderr`, the system must trap that text, pipe it into `Toon` to summarize the compiler error, and send it directly back to the Developer agent for a retry cycle (max 3 retries). This loop is what solidifies the "agentic" experience.

### 4.5. Unwrap Integrations (SURGE & here.now)
- **Required Fix:** The phase 4 integrations in `crewai_service.py` are currently commented out under `"""`. When testnet keys are available, we must remove these blockers so that real token minting occurs natively at the end of the `tokenization` stage.

---

---

## 5. Recent Commit History Summary (Since 2b974481)
Since the `2b974481` commit, significant progress has been made on the backend architecture:

1. **LLM & Configuration Enhancements**: Added support for Groq, Gemini, and local Ollama clients. Implemented global token usage tracking and improved model pricing configurations within the environment variables.
2. **Logging Middleware**: Refactored the core application logging to use a standard `logger.py` module, suppressing verbose litellm logs and adding a `RequestLoggingMiddleware` for tracking request timing and statuses.
3. **Moltbook & Social Integrations**: Implemented, expanded, and eventually refactored out custom `MoltbookPublisher` tools in favor of more focused community engagement roles within the CrewAI service.
4. **Third-Party APIs (SURGE & here.now)**: Enhanced the standalone Python clients. `HereNowClient` now supports image push error handling and logging, while `SurgeTokenManager` includes API integration for token creation and metadata updates.
5. **Testing Architecture**: Added comprehensive suite tests, validating the full orchestration of the 5-stage AI pipeline, the LLMRouter, and CrewAIService logic.

---

## 6. Architectural Critique: Hardcoding Agents
Currently, all agents inside `crewai_service.py` are hardcoded via a dictionary map (e.g., specifying the exact `.role`, `.goal`, and `.backstory` for the "Business Analyst" or "Tech Lead"). 

**This is considered an Anti-Pattern for Production Orchestration.**

### Why it is incorrect:
1. **Separation of Concerns:** The engine (`crewai_service.py`) should only concern itself with *how* to execute tasks (the pipeline logic), not *who* the agents are.
2. **Extensibility & Maintenance:** Adding a new agent requires a developer to write Python code, restart the server, and modify the core orchestrator. 
3. **No-Code Prompt Engineering:** Prompt Engineers cannot easily tune an agent's backstory or goal without diving into backend deployment code.

### The Correct Practice (Data-Driven Agents):
The correct industry-standard approach is to build a **Dynamic Loader**. 

1. **Leverage the Skills Folder:** The project already contains a `backend/app/skills/` directory with markdown/YAML definition files (e.g., `ideation/SKILL.md`).
2. **Dynamic Ingestion:** Upon boot, the `CrewAIService` should parse these files (extracting the `Role`, `Allowed Tools`, and `Output Format`) and dynamically instantiate the `Agent()` objects.
3. This approach ensures you can drop a new `security_auditor.md` into the folder and instantly grant the orchestrator a new specialist agent without writing a single line of procedural Python.
