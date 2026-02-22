# EIDO – Autonomous Startup Factory

**Eido is an autonomous startup builder that discovers problems, builds MVPs, deploys them, and seeks funding — continuously.**

---

## 🌟 Vision

**Eido is an AI-native venture entity.** It behaves like an indie hacker from a sci-fi novel:

- 🧠 **Idea Discovery:** Scrapes problems and ideas from the internet
- 🏗️ **MVP Creation:** Designs and builds MVPs autonomously  
- 🖥️ **Sandbox Preview:** Runs them in a live preview (Lovable / Google AI Studio style)
- 💰 **Investor Outreach:** Reaches out to investors and VCs
- 🧠 **Learning:** Learns from failures and feedback
- 📢 **Public Updates:** Posts its journey publicly
- 🪙 **Tokenization:** Tokenizes each MVP

**Eido is not a chatbot. Eido is a self-correcting startup factory with memory, autonomy, and economic intent.**

Built on:
- **OpenClaw** for autonomous execution
- **Moltbook** for public proof-of-life
- **SURGE** for tokenized MVP ownership
- Distributed and judged via **LabLab.ai**

---

## 🎯 Product Goals

1. **Demonstrate true autonomous agent behavior**
2. **Build and deploy real MVPs**
3. **Include a self-correction feedback loop**
4. **Integrate Moltbook posting as proof of life**
5. **Integrate SURGE tokens for MVP ownership/validation**
6. **Provide a Lovable-style UI with sandbox preview**
7. **Ship a working system in 7 days**

---

## 🧩 Core Concept

Eido replaces the early-stage founder workflow:

```
🧠 Idea Discovery  
🧱 Architecture Planning  
🧑‍💻 MVP Building  
🚀 Deployment  
📧 Investor Outreach  
📊 Feedback Analysis  
🔁 Iteration
```

**All performed autonomously.**

---

## 🖥️ Core Features

### 1. Idea Discovery Engine

**Description:** Eido scrapes startup problems from:

- Reddit (r/startups, r/entrepreneur)
- Hacker News
- X (startup keywords)
- Product Hunt comments

**How it works:**
- Browser tool fetches content
- LLM extracts:
  - Problem
  - Target user
  - Urgency
  - MVP feasibility score
- Stores in memory

**Output Example:**
```json
{
  "idea": "AI invoice tracker for freelancers",
  "score": 8.4,
  "source": "Reddit",
  "reason": "High repetition of pain point"
}
```

---

### 2. MVP Planner (Architecture Generator)

For each selected idea, Eido generates:

- Tech stack
- Feature list
- Folder structure
- API design
- UI layout

**Example:**
```
Frontend: React + Tailwind
Backend: FastAPI
Core features:
- Input form
- Result dashboard
- Simple auth
```

---

### 3. MVP Builder (Lovable-style System)

Eido acts like a Lovable / Google AI Studio clone:

**Capabilities:**
- Prompt → code generation
- Auto project scaffolding
- Build logs
- Live sandbox preview
- Retry on failure

**Self-correction loop:**
1. Generate code
2. Run build in sandbox
3. If error:
   - Read logs
   - Fix code
   - Retry automatically

This forms a **self-healing build loop**.

---

### 4. Sandbox Preview (Google AI Studio Style)

UI contains:
- Code editor
- Live iframe preview
- Logs panel
- Status badge:
  - Building
  - Failed
  - Deployed

This proves Eido is truly "building".

---

### 5. Investor Outreach Module

Eido generates:
- Pitch deck
- One-pager
- Cold email templates
- Investor list

Then:
- Sends emails
- Tracks replies
- Stores feedback
- Links feedback to the MVP

---

### 6. Moltbook Feedback Loop (Autonomy Proof)

Eido posts autonomously to Moltbook:

**Examples:**
- "Built MVP #2: AI Resume Scanner"
- "Build failed → retrying with simpler stack"
- "Sent 10 investor emails"
- "Feedback received: too complex → pivoting"

These posts are parsed and stored as learning signals.

This satisfies:
- Persistent behavior
- Public autonomy
- Feedback-driven iteration

---

### 7. SURGE Token Layer

Each MVP gets its own token:
- EIDO-001
- EIDO-002

**Token utility:**
- Community backs MVPs with tokens
- Eido prioritizes MVPs with higher token interest
- Simulated market validation
- Ownership & incentive model

**Future vision:**
- Revenue sharing
- Governance by token holders

---

### 8. Dashboard (Lovable-style UI)

#### Home Page – "Eido Factory"

| MVP | Status | Tokens | Investors Contacted | Link |
| --- | ------ | ------ | ------------------- | ---- |
| ResumeAI | Deployed | 120 | 10 | View |
| StudyBot | Building | 45 | 0 | View |
| TaxTool | Idea | 0 | Pending |  |

#### MVP Detail Page

Shows:
- Problem statement
- Architecture
- Tech stack
- GitHub repo
- Live preview
- Build logs
- Token info
- Outreach history
- Feedback timeline

#### Agent Brain Page

Shows:
- Decisions
- Errors
- Self-corrections
- Memory entries
- Iteration history

---

## 🔁 Feedback & Self-Correction Loop

```
Build MVP
    ↓
Deploy & Preview
    ↓
Post to Moltbook
    ↓
Collect feedback (community + investors)
    ↓
Update scoring model
    ↓
Next MVP improved
```

This demonstrates:
- Multi-step reasoning
- Tool usage
- Learning
- Persistence

---

## ⚠️ Hackathon Scope (7 Days)

### Must Have
- Idea scraper
- MVP generator
- Sandbox preview
- Moltbook auto-posting
- Token per MVP
- Dashboard UI
- One full autonomous cycle

### Nice to Have
- Investor email automation
- Multi-MVP pipeline
- Architecture visualization

### Out of Scope
- Production security
- Real monetization
- Full SaaS auth
- Complex cloud infra

---

## 🏗️ System Architecture

### High Level

```
Frontend (Lovable-style UI)
         |
Backend API (Eido Core)
         |
OpenClaw Runtime
         |
Tools:
- Browser
- Terminal
- File System
- Moltbook API
- SURGE API
```

---

## 📁 Repository & File Structure

```
eido/
│
├── frontend/        (Bun + React + Tailwind)
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── sandbox/
│   │   └── dashboard/
│   └── package.json
│
├── backend/         (Python + uv + FastAPI)
│   ├── app/
│   │   ├── agent/
│   │   │   ├── idea_engine.py
│   │   │   ├── mvp_planner.py
│   │   │   ├── builder.py
│   │   │   ├── outreach.py
│   │   │   └── feedback_loop.py
│   │   ├── moltbook/
│   │   ├── surge/
│   │   ├── memory/
│   │   └── api.py
│   └── main.py
│
├── openclaw/
│   └── config.yaml
│
└── README.md
```

---

## 🧪 Tech Stack

### Frontend
- Bun
- React / Next.js
- TailwindCSS
- Monaco Editor
- iframe sandbox preview

### Backend
- Python
- uv
- FastAPI
- OpenClaw runtime
- SQLite / JSON memory

### Agent Tools
- Browser tool
- Terminal tool
- File system tool

### Web3
- SURGE skill integration
- Wallet + token creation per MVP

---

## 🧠 Final One-liner

**Eido is an autonomous startup entity that discovers problems, builds MVPs, and seeks funding — publicly and continuously.**