# EIDO – Frontend Product & Design Specification

This document defines the complete frontend architecture, design system, visual direction, API integration mapping, and UX behavior for EIDO.

**EIDO is an autonomous startup foundry built on OpenClaw + SURGE.**

---

## 1. Frontend Philosophy

EIDO is not a traditional SaaS dashboard.  
It is an **Agent Control Surface**.

The UI must communicate:
- **Autonomy**
- **Intelligence**
- **Technical depth**
- **Economic capability**
- **OpenClaw-native execution**

**Design Direction:** Hybrid Agent Console + Modern SaaS

We will use:
- React Bits for landing page effects
- Dark, minimal UI
- Subtle motion
- Terminal-inspired command blocks
- Clear lifecycle visualization

---

## 2. Technology Stack

### Core Framework

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components

### Effects & Motion

- React Bits (for particle, glow, motion effects)
- Framer Motion (controlled transitions)

### State Management

- React Context (global agent state)
- Optional Zustand (if execution state grows complex)

### API Communication

- Native Fetch API (typed wrappers)
- Centralized API client in `/lib/api.ts`

---

## 3. High-Level Frontend Structure

```text
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                # Landing Page
│   ├── dashboard/
│   │   └── page.tsx
│   ├── mvp/
│   │   └── [id]/page.tsx
│   ├── agent/
│   │   └── page.tsx
│   └── tokens/
│       └── [id]/page.tsx
│

├── components/
│   ├── landing/
│   ├── dashboard/
│   ├── agent/
│   ├── tokens/
│   ├── logs/
│   ├── command/
│   └── ui/
│

├── lib/
│   ├── api.ts
│   ├── endpoints.ts
│   └── types.ts
│

├── styles/
│   └── theme.css
```

---

## 4. Landing Page Design (React Bits Powered)

### 4.1 Hero Section

**Headline:**
"Your Autonomous Startup Engine"

**Subtext:**
"Discover. Build. Deploy. Tokenize. Iterate."

**Visual Effects:**
- React Bits particle background
- Subtle glow behind headline
- Floating agent core animation

**Primary CTA:**
- "Launch Agent"

**Secondary CTA:**
- "View Live Demo"

### 4.2 Human vs Agent Toggle

**Component:** Segmented Control

**Modes:**

**Human Mode:**
- Manual execution
- Step-by-step lifecycle display
- Debug logs visible

**Agent Mode:**
- Autonomous loop
- Background execution
- Scheduled tasks
- Moltbook posting enabled

This toggle visually reinforces autonomy.

### 4.3 Command Installation Block

Terminal-styled component.

**Display:**

```
install
setup
launch
status
```

**Features:**
- Copy-to-clipboard functionality

**Instruction block:**

"Send to your OpenClaw"

Read: /skills/manager/SKILL.md
Then run:
/eido
/eido setup

This reinforces ecosystem integration.

---

## 5. Dashboard Design

### 5.1 MVP Lifecycle Cards

Each card shows:
- MVP name
- Current stage
- Token status
- Deployment status
- Last activity

**Stage Badges:**
- Discovering
- Planning
- Building
- Fixing
- Deploying
- Tokenized
- Published

### 5.2 Live Execution Panel

Right-side console panel:
- Real-time logs
- Retry attempts
- Reflection summaries
- Status indicators

Auto-scroll enabled.

---

## 6. Agent Brain Page

**Purpose:** Show reasoning transparency.

**Components:**
- Timeline view of decisions
- Retry counter
- Error summaries
- Memory snapshots
- Context compression summaries (Toon)

This strengthens "Application of Technology" score.

---

## 7. Token Page (SURGE Integration)

**Display:**
- Token name
- Symbol
- Contract address
- Total supply
- Ownership metadata
- Creation timestamp

**Optional:**
- Portfolio tracking view

This aligns with Capital Markets prize.

---

## 8. Design System

### 8.1 Color Palette

**Primary Background:**
`#0B0F19`

**Secondary Surface:**
`#111827`

**Accent Blue:**
`#3B82F6`

**Accent Cyan Glow:**
`#22D3EE`

**Success Green:**
`#10B981`

**Warning Amber:**
`#F59E0B`

**Error Red:**
`#EF4444`

**Text Primary:**
`#F9FAFB`

**Text Secondary:**
`#9CA3AF`

### 8.2 Typography

**Headlines:**
- Inter / Geist / Satoshi
- Bold

**Body:**
- Medium weight

**Terminal blocks:**
- Monospace (JetBrains Mono)

### 8.3 UI Components

- Card (rounded-2xl)
- Soft shadows
- Glow accent for active stage
- Subtle hover transitions
- No heavy animations

---

## 9. API Integration Mapping

### MVP

```
GET    /api/mvp/list
GET    /api/mvp/{id}
POST   /api/mvp/start
DELETE /api/mvp/{id}
```

### Agent

```
POST   /api/agent/run
GET    /api/agent/status
GET    /api/agent/logs
```

### Token

```
POST   /api/token/create
GET    /api/token/{mvp_id}
```

### Deployment

```
POST   /api/deploy/{mvp_id}
GET    /api/deploy/status/{mvp_id}
```

---

## 10. UX Execution Flow

```
User clicks "Launch Agent"
         ↓
    POST /api/mvp/start
         ↓
Lifecycle updates via polling
         ↓
      Logs streamed
         ↓
   Deployment success
         ↓
    Token created
         ↓
  Moltbook published
```

All visible in UI.

---

## 11. Performance Considerations

- Avoid heavy particle rendering
- Limit animation loops
- Lazy load dashboard pages
- Cache API responses

---

## 12. Strategic Presentation Layer

Frontend must clearly show:

- Autonomy
- Retry behavior
- Tool usage
- Tokenization
- Deployment

Judges should understand system within 30 seconds.

---

## 13. Component-Level Architecture

### 13.1 Landing Components

`components/landing/`

- `HeroSection.tsx`
- `ParticleBackground.tsx` (React Bits wrapper)
- `ModeToggle.tsx` (Human / Agent)
- `CommandBlock.tsx`
- `CTASection.tsx`

**HeroSection Behavior:**
- Full viewport height
- Gradient radial glow behind headline
- Particle canvas positioned absolutely
- Responsive typography scaling

**CommandBlock Behavior:**
- Monospace font
- Copy button (top-right)
- Visual "terminal dots" header
- Accepts dynamic command props

### 13.2 Dashboard Components

`components/dashboard/`

- `MVPCard.tsx`
- `StageBadge.tsx`
- `StatusIndicator.tsx`
- `LogsPanel.tsx`
- `ExecutionTimeline.tsx`

**MVPCard States:**
- Idle
- Running
- Error
- Success

Each state changes:
- Border glow color
- Status badge
- Subtext

---

## 14. State Management Architecture

### Global Context

`AgentContext:`
- `currentMVP`
- `lifecycleStage`
- `logs`
- `retryCount`
- `deploymentStatus`
- `tokenStatus`
- `mode` (Human | Agent)

Provider located in:
`app/layout.tsx`

### Data Fetching Strategy

**Polling Model (Hackathon Stable Option):**

- Poll every 3 seconds during execution
- Stop polling when stage = complete

**Optional Advanced Mode:**
- WebSocket streaming for logs

---

## 15. UX States & Edge Case Handling

### Loading States

- Skeleton loaders for MVP cards
- Pulsing stage badge
- Animated ellipsis during build

### Error States

If agent fails after max retries:
- Red border glow
- "Retry Build" button (Human mode only)
- Log expansion panel

### Empty States

- No MVPs yet → Show onboarding panel
- No tokens → Show explanation block

---

## 16. Responsive Design Rules

**Breakpoints:**
- Mobile (≤ 768px)
- Tablet (≤ 1024px)
- Desktop

**Mobile Adjustments:**
- Collapse logs panel below cards
- Stack lifecycle timeline vertically
- Reduce particle density

---

## 17. Animation & Motion System

### Allowed Animations

- Fade-in transitions
- Stage glow transitions
- Subtle scale on hover
- Particle drift motion

### Disallowed

- Heavy continuous motion
- GPU-intensive effects
- Complex 3D rendering

**Motion duration standard:**
200ms–300ms ease-in-out

---

## 18. Accessibility & Usability

- All buttons keyboard accessible
- High contrast ratios
- `aria-labels` for toggles
- Screen-reader friendly stage labels

---

## 19. Environment Configuration

`.env.local` (Frontend)

```
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_MODE=development
```

All API calls reference:
`process.env.NEXT_PUBLIC_API_URL`

---

## 20. Analytics & Demo Metrics

**Optional (Lightweight):**
- Track agent start
- Track build success
- Track token creation

Used only for demo narrative.

---

## 21. Moltbook Visibility Panel

**Optional Dashboard Widget:**

- "Latest Moltbook Post"
- Post timestamp
- Status (Posted | Pending)

This visually proves autonomy.

---

## 22. Strategic UI Narrative

- **Landing** = Vision
- **Dashboard** = Execution
- **Agent Brain** = Intelligence
- **Token Page** = Economics

Each page reinforces a judging category.

---

**End of EIDO Frontend Product & Design Specification**