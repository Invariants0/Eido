# EIDO: Implementation Plan – Autonomous Startup Foundry

## 1. Project Vision
**EIDO** is an autonomous "Startup Factory." It is orchestrated by a master agent named **EIDO**, which is powered by **OpenClaw** and lives in a Dockerized environment with interfaces on **Telegram** and **Moltbook**. Under the hood, Eido controls a fleet of specialist **Sub-Agents** (Researcher, Architect, Developer, etc.) to take a raw idea and turn it into a deployed, tokenized MVP.

---

## 2. Current Status (State of the Bridge)
We have successfully built the "Foundry Body," but it is currently disconnected from the "Eido Head."

### **✅ Completed (The Body)**
- **FastAPI Backend**: Fully structured with MVP, Dashboard, and Health routes.
- **Frontend Dashboard**: Next.js app connected to real backend APIs serving mock/DB data.
- **Skill Definitions**: Comprehensive `.md` files for all 10 roles (Researcher, Analyst, etc.) in `backend/app/skills/`.
- **Pipeline Logic**: Initial `AutonomousPipeline` exists in `services/pipeline.py`.
- **Environment**: Configuration for LLM routing (OpenAI, Anthropic, Groq, Ollama) is ready.

### **⚠️ Pending (The Bridge & Hands)**
- **Dynamic Skill Loading**: Agents are still hardcoded in Python; they don't yet read the `SKILL.md` files dynamically.
- **E2B Integration**: Agents don't have a secure sandbox to write/run code yet.
- **OpenClaw Power Hook**: The sub-agents are not yet using the "Eido Identity" or OpenClaw-native tools.
- **Real-time Logs**: No SSE/Webhook bridge between the Dockerized Eido and this Foundry.

---

## 3. Implementation Guide

This section breaks down the entire roadmap into highly detailed steps. Each step includes the files involved, explicit instructions on how to implement it, important considerations, and the expected output.

### **Phase 1: The OpenClaw & Skills Bridge (CRITICAL)**
Goal: Make agents dynamic by reading Markdown files, and connect them to the Dockerized OpenClaw Master Agent.

#### **Step 1.1: Dynamic Skill Loader**
*   **Files Involved:**
    *   `backend/app/services/ai_runtime/skill_loader.py` (New)
    *   `backend/app/services/ai_runtime/crewai_service.py` (Modify)
*   **How to do it:**
    *   Create `SkillLoader` class to parse YAML frontmatter and Markdown content from `backend/app/skills/*/SKILL.md`.
    *   Extract `Role`, `Goal` (from description), `Backstory` (from Workflow/Constraints), and expected Output.
    *   Modify `CrewAIService._get_agent()` to use `SkillLoader.get_skill(role_id)` instead of the hardcoded `role_map` dictionary.
*   **Take Care Of:**
    *   What happens if a `SKILL.md` file is missing or malformed? Fallback gracefully or raise a specific configuration error.
    *   Ensure the output format constraints from the markdown are injected into the agent's system prompt.
*   **Expected Output:**
    *   `crewai_service.py` has zero hardcoded roles. Changing a `SKILL.md` file instantly changes the agent's behavior on the next run without restarting the server.

#### **Step 1.2: Eido Identity Hook (Webhook Client)**
*   **Files Involved:**
    *   `backend/app/integrations/eido_webhook.py` (New/Modify)
    *   `backend/app/config/settings.py` (Modify)
*   **How to do it:**
    *   Add `EIDO_WEBHOOK_URL` and `EIDO_API_KEY` to `settings.py` and `.env`.
    *   Create a webhook client class (`EidoWebhookClient`) with methods like `send_telegram_message(chat_id, message)` and `post_to_moltbook(content)`.
    *   This client will make HTTP POST requests to the Dockerized OpenClaw instance.
*   **Take Care Of:**
    *   Network failures: What if the OpenClaw container is down? Implement retry logic (e.g., Tenacity) and fail gracefully.
    *   Authentication: Ensure the webhook requests are secured so external actors can't trigger Telegram messages.
*   **Expected Output:**
    *   A reliable Python client that can send payloads to the OpenClaw Docker container, allowing backend scripts to trigger Telegram/Moltbook posts.

#### **Step 1.3: Tool Mapping for Sub-Agents**
*   **Files Involved:**
    *   `backend/app/services/ai_runtime/openclaw_service.py` (Modify)
    *   `backend/app/services/ai_runtime/crewai_service.py` (Modify)
*   **How to do it:**
    *   Define custom CrewAI Tools (e.g., `MoltbookPostTool`, `WebSearchTool`) that wrap the `EidoWebhookClient`.
    *   When the Researcher agent needs to post to Moltbook, it uses `MoltbookPostTool`, which sends the webhook to the OpenClaw master agent.
*   **Take Care Of:**
    *   Ensure the tool descriptions fed to CrewAI are extremely explicit about *when* and *how* to use them.
*   **Expected Output:**
    *   Specialist agents can successfully execute web searches and post to Moltbook by proxying requests through the Eido Master Agent.

---

### **Phase 2: The E2B Coding Engine & Deterministic Loop**
Goal: Replace fake local execution with real, secure cloud microVMs (E2B) for building and QA.

#### **Step 2.1: E2B Sandbox Setup**
*   **Files Involved:**
    *   `backend/pyproject.toml` (Modify)
    *   `backend/app/services/ai_runtime/e2b_sandbox.py` (New)
    *   `backend/app/config/settings.py` (Modify)
*   **How to do it:**
    *   Add `e2b-code-interpreter` to `pyproject.toml`.
    *   Add `E2B_API_KEY` to `.env`.
    *   Create `E2BSandboxManager` to start a Sandbox, execute bash commands (`sandbox.commands.run()`), read/write files (`sandbox.files.write()`), and close the Sandbox.
*   **Take Care Of:**
    *   Sandboxes cost money and resources; ensure they are properly closed in a `finally` block or context manager after the MVP pipeline finishes or fails.
    *   Timeouts: Long-running `npm install` tasks need generous timeout settings.
*   **Expected Output:**
    *   A robust wrapper that can spin up an E2B environment on demand, run shell commands, and return stdout/stderr.

#### **Step 2.2: Sandbox Tools for Developer & QA**
*   **Files Involved:**
    *   `backend/app/services/ai_runtime/crewai_service.py` (Modify)
*   **How to do it:**
    *   Create CrewAI tools: `WriteFileTool`, `ReadFileTool`, `RunCommandTool`. Bind these to the `E2BSandboxManager`.
    *   Assign these tools to the `developer` and `qa` agents dynamically during the `building` stage.
*   **Take Care Of:**
    *   Agent hallucination: Agents might try to write to restricted paths. The `WriteFileTool` should enforce writing to a specific `/workspace` directory inside the E2B VM.
*   **Expected Output:**
    *   The `developer` agent actually creates files in E2B. The `qa` agent runs `npm run build` and reads the output.

#### **Step 2.3: TOON Layer & Deterministic Loop**
*   **Files Involved:**
    *   `backend/app/services/ai_runtime/toon_layer.py` (New)
    *   `backend/app/agent/context_optimizer.py` (New)
    *   `backend/app/services/pipeline.py` (Modify)
*   **How to do it:**
    *   **TOON Implementation:** Integrate Token-Oriented Object Notation to reduce token usage by 30-60%.
    *   **Deterministic Loop Pattern:**
        1. **EXECUTE**: Developer Agent writes code to E2B.
        2. **VALIDATE**: QA Agent runs build/test in E2B.
        3. **TRAP**: If exit code != 0, capture `stderr`.
        4. **RETRY**: Compress logs via **TOON** and feed back to Developer for targeted fix.
    *   Implement a strict retry counter (max 3 cycles) in `pipeline.py` to prevent infinite loops.
*   **Take Care Of:**
    *   Infinite loops: Must strictly enforce the retry limit.
    *   Context limit: TOON is mandatory for large tracebacks.
*   **Expected Output:**
    *   A reliable, self-healing pipeline that can fix its own compiler/runtime errors autonomously.

#### **Step 2.4: Frontend - E2B Live Preview Engine**
*   **Files Involved:**
    *   `frontend/components/mvp/LivePreview.tsx` (New/Modify)
    *   `frontend/lib/api.ts` (Modify)
*   **How to do it:**
    *   When the E2B sandbox starts the web server (e.g., `npm run dev` on port 3000), the backend will send the generated Sandbox Hostname (e.g., `https://[port]-[sandbox-id].e2b.dev`) to the frontend.
    *   Embed this URL inside a React `<iframe>` in the "Building" / "Deployed" stages of the MVP dashboard.
*   **Take Care Of:**
    *   Iframes often cache. Implement a reload button to force the iframe to refresh when the agent makes code changes.
    *   Ensure the Next.js `next.config.ts` allows framing from `e2b.dev` wildcard domains.
*   **Expected Output:**
    *   Users can watch the application visually change in real-time as the agent rewrites code in the cloud sandbox.

---

### **Phase 3: Real-Time Communication (SSE & Telegram)**
Goal: Stream live progress to the web frontend and to the user on Telegram.

#### **Step 3.1: Backend Server-Sent Events (SSE) Stream**
*   **Files Involved:**
    *   `backend/app/api/routes/agent_routes.py` (Modify)
    *   `backend/app/services/ai_runtime/log_broadcaster.py` (New)
*   **How to do it:**
    *   Create a `Broadcaster` using Python `asyncio.Queue` or Redis Pub/Sub.
    *   Modify `Agent` configurations to use a custom callback (or override the `print` inside tools) to push logs to the Broadcaster.
    *   Implement `GET /api/agent/{mvp_id}/stream` returning an `EventSourceResponse` (using `sse_starlette`).
*   **Take Care Of:**
    *   Client disconnects: Ensure queues are cleaned up when the user closes the dashboard.
*   **Expected Output:**
    *   A continuous stream of backend text logs representing agent steps, terminal output, and reasoning.

#### **Step 3.2: Frontend - Real-Time Terminal Integration**
*   **Files Involved:**
    *   `frontend/components/mvp/AgentTerminal.tsx` (New/Modify)
*   **How to do it:**
    *   Implement the native JS `EventSource` API to connect to the backend's `/api/agent/{mvp_id}/stream`.
    *   Dynamically push incoming log entries into a scrolling terminal window state in the UI.
*   **Take Care Of:**
    *   Auto-scrolling: The terminal should stick to the bottom as new lines arrive, unless the user scrolls up manually.
    *   Connection dropping: Implement automatic retry logic if the SSE connection drops.
*   **Expected Output:**
    *   The web dashboard shows a live-scrolling terminal of everything the agents are thinking and doing, identically mirroring a real developer pipeline.

#### **Step 3.3: Telegram Feedback Loop**
*   **Files Involved:**
    *   `backend/app/services/pipeline.py` (Modify)
*   **How to do it:**
    *   At the start and end of major stages (Ideation Complete, Deploy Complete), use the `EidoWebhookClient` to send a summary payload to the Dockerized OpenClaw instance.
    *   OpenClaw formats this payload and sends a Telegram message to the user.
*   **Take Care Of:**
    *   Don't spam the user. Only send messages on major stage changes, success, or catastrophic failures.
*   **Expected Output:**
    *   User receives a Telegram message: *"EIDO: Ideation complete. I have selected the idea 'AI Invoice Tracker'. Moving to Architecture phase."*

---

### **Phase 4: Integrations (Production Release)**
Goal: Connect to real-world deployment and tokenization services.

#### **Step 4.1: SURGE Tokenization**
*   **Files Involved:**
    *   `backend/app/integrations/surge.py` (Verify)
    *   `backend/app/services/ai_runtime/crewai_service.py` (Modify)
*   **How to do it:**
    *   Ensure `SURGE_API_KEY` is active.
    *   Uncomment the tokenization logic in `crewai_service.py` (Phase 4 block).
    *   Pass the generated `Token_Name` and `Token_Symbol` to `SurgeTokenManager`.
*   **Take Care Of:**
    *   Handle testnet vs mainnet configuration properly based on the `ENVIRONMENT` variable.
*   **Expected Output:**
    *   A real SURGE smart contract is generated and the Token ID is saved to the MVP database record.

#### **Step 4.2: here.now Deployment**
*   **Files Involved:**
    *   `backend/app/integrations/deployment.py` (Verify)
    *   `backend/app/services/ai_runtime/crewai_service.py` (Modify)
*   **How to do it:**
    *   Ensure `HERENOW_API_KEY` is active.
    *   Uncomment the deployment logic in `crewai_service.py`.
    *   Zip or containerize the E2B workspace output and push it to the `HereNowClient`.
*   **Take Care Of:**
    *   Ensure the E2B sandbox successfully exports the build artifacts (e.g., `.next` folder or `dist` folder) before shutting down.
*   **Expected Output:**
    *   A live, accessible URL for the completely autonomous generated MVP.
