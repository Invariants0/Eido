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
- **Dynamic Skill Loading**: Agents are still hardcoded in Python; they don't yet read the `SKILL.md` files.
- **E2B Integration**: Agents don't have a secure sandbox to write/run code yet.
- **OpenClaw Power Hook**: The sub-agents are not yet using the "Eido Identity" or OpenClaw-native tools.
- **Real-time Logs**: No SSE/Webhook bridge between the Dockerized Eido and this Foundry.

---

## 3. The Objective (The Goal)
Turn EIDO from a "Bot" into a "Manager" that uses this Foundry to build real companies.
1.  **Identity**: Sub-agents use Eido's Moltbook/Telegram credentials.
2.  **Infrastructure**: All coding happens in isolated **E2B sandboxes**.
3.  **Self-Correction**: QA agents catch errors via terminal logs and force Developer agents to fix them.
4.  **Autonomy**: Eido triggers the pipeline from a Telegram message and reports back throughout the build.

---

## 4. Implementation Steps

### **Phase 1: The OpenClaw & Skills Bridge (CRITICAL)**
*   **Step 1.1: Dynamic Skill Loader**: ✅ COMPLETE. Implemented `SkillLoader` utility and integrated it into `CrewAIService`. Agents now populate their and goals from `SKILL.md` files.
*   **Step 1.2: Eido Identity Hook**: Create a webhook/API client in the Foundry that authenticates with your Dockerized Eido instance.
*   **Step 1.3: Tool Mapping**: Bridge OpenClaw-native tools (`web_search`, `moltbook_post`) into the Specialist Agents.

### **Phase 2: The E2B Coding Engine**
*   **Step 2.1: E2B Sandbox Setup**: Integrate E2B SDK into the `Building` stage.
*   **Step 2.2: Sandbox Skills**: Update the `developer` and `qa` skills to use E2B-native commands (`sandbox.run_command`).
*   **Step 2.3: Deterministic Loop**: Implement the logic where `stderr` from a build failure triggers an agent retry cycle.

### **Phase 3: Real-Time Communication**
*   **Step 3.1: SSE Log Stream**: Build the `/api/agent/stream` endpoint for the frontend.
*   **Step 3.2: Telegram Feedback Loop**: Connect the SSE stream to the Dockerized Eido so he can "talk" to you on Telegram about his progress.

### **Phase 4: Integration Activation (SURGE & here.now)**
*   **Step 4.1: Tokenization**: Activate the `SurgeTokenManager` to mint real tokens at the end of successful builds.
*   **Step 4.2: Final Deployment**: Activate the `HereNowClient` to push the verified E2B build to production.

---

## 5. Development Roadmap Summary
1.  **Immediate**: Wire `SKILL.md` files to `CrewAIService` (Dynamic Agents).
2.  **Short-term**: Replace local tool executor with **E2B**.
3.  **Mid-term**: Connect the Dockerized Eido "Head" to the Foundry "Body" via Webhooks.
4.  **Final**: Launch first autonomous MVP from Telegram.
