'use client';

/**
 * useDemoSimulation — Deterministic frontend simulation engine.
 *
 * Activates only when:
 *   NEXT_PUBLIC_DEMO_MODE=true
 *   AND mvpId === NEXT_PUBLIC_DEMO_MVP_ID (default: "eido-demo-001")
 *
 * Completes in ≤60 seconds. No network calls. No Math.random(). Never hangs.
 */

import { useState, useEffect, useRef } from 'react';
import type { MVP, LifecycleStage, AgentLog } from '@/lib/types';

// ─── Constants ───────────────────────────────────────────────────────────────

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
const DEMO_MVP_ID = process.env.NEXT_PUBLIC_DEMO_MVP_ID ?? 'eido-demo-001';
const TICK_MS = 1200; // 1.2s per tick

const DEMO_DEPLOYMENT_URL = 'https://ai-invoice-tracker.here.now';
const DEMO_CONTRACT_ADDRESS = '0xA3f9D21C8bE4a290F3cD7e1Bb3e92A14d21C8bE4';
const DEMO_TX_HASH = '0x7f3ab14c92e8f3d2a1b47c6e9d0f52e3a8b1c91d';

// ─── Stage transition map: tick count → state ────────────────────────────────

export type SimStage =
  | 'IDLE'
  | 'SUBMITTED'
  | 'STAGE_IDEATION'
  | 'STAGE_ARCHITECTURE'
  | 'STAGE_BUILDING'
  | 'STAGE_DEPLOYMENT'
  | 'MINTING_TOKEN'
  | 'POSTING_MOLTBOOK'
  | 'COMPLETE';

// Keys are elapsed SECONDS (not ticks) for readability
const TRANSITION_SECONDS: [number, SimStage][] = [
  [0, 'SUBMITTED'],
  [2, 'STAGE_IDEATION'],
  [10, 'STAGE_ARCHITECTURE'],
  [20, 'STAGE_BUILDING'],
  [38, 'STAGE_DEPLOYMENT'],
  [46, 'MINTING_TOKEN'],
  [51, 'POSTING_MOLTBOOK'],
  [55, 'COMPLETE'],
];

// ─── Static log entries ───────────────────────────────────────────────────────

interface SimLog {
  stage: SimStage;
  level: AgentLog['level'];
  agent: string;
  message: string;
}

const LOG_SCRIPT: SimLog[] = [
  // SUBMITTED
  { stage: 'SUBMITTED', level: 'system', agent: 'pipeline', message: 'Pipeline scheduled. Correlation ID: a3f9d21c. MVP: AI Invoice Tracker' },
  { stage: 'SUBMITTED', level: 'info', agent: 'pipeline', message: 'Initializing autonomous crew. 4 stages queued.' },

  // IDEATION
  { stage: 'STAGE_IDEATION', level: 'info', agent: 'researcher', message: '[AGENT] researcher active — loading idea context: "AI Invoice Tracker for freelancers"' },
  { stage: 'STAGE_IDEATION', level: 'info', agent: 'researcher', message: '[TOOL] search_web("invoice automation SaaS market 2025") → 14 results' },
  { stage: 'STAGE_IDEATION', level: 'info', agent: 'researcher', message: '[TOOL] analyze_market("freelancer tools pain points") → TAM: $4.2B, competitors: 6' },
  { stage: 'STAGE_IDEATION', level: 'info', agent: 'analyst', message: '[AGENT] analyst scoring idea viability: 87/100' },
  { stage: 'STAGE_IDEATION', level: 'success', agent: 'researcher', message: 'Ideation stage complete. Summary generated (612 tokens). Confidence: HIGH' },

  // ARCHITECTURE
  { stage: 'STAGE_ARCHITECTURE', level: 'info', agent: 'architect', message: '[AGENT] architect active — designing system architecture' },
  { stage: 'STAGE_ARCHITECTURE', level: 'info', agent: 'architect', message: '[TOOL] generate_schema("PostgreSQL + Next.js + Prisma") → schema.prisma generated' },
  { stage: 'STAGE_ARCHITECTURE', level: 'info', agent: 'architect', message: '[TOOL] select_stack({frontend: "Next.js 15", db: "PostgreSQL", api: "FastAPI"}) → ✓' },
  { stage: 'STAGE_ARCHITECTURE', level: 'info', agent: 'tech-lead', message: '[AGENT] tech-lead reviewing architecture decisions...' },
  { stage: 'STAGE_ARCHITECTURE', level: 'info', agent: 'architect', message: 'Context compression triggered. 45k tokens → 4.1k tokens via TOON optimizer.' },
  { stage: 'STAGE_ARCHITECTURE', level: 'success', agent: 'architect', message: 'Architecture spec finalized. 3 services, 1 DB, 2 API routes. Handoff to developer.' },

  // BUILDING
  { stage: 'STAGE_BUILDING', level: 'info', agent: 'developer', message: '[AGENT] developer active — scaffolding project structure' },
  { stage: 'STAGE_BUILDING', level: 'info', agent: 'developer', message: '[TOOL] write_file("package.json") → 1.2KB written to sandbox' },
  { stage: 'STAGE_BUILDING', level: 'info', agent: 'developer', message: '[TOOL] write_file("app/page.tsx") → 3.4KB written to sandbox' },
  { stage: 'STAGE_BUILDING', level: 'info', agent: 'developer', message: '[TOOL] write_file("app/api/invoices/route.ts") → 2.1KB written to sandbox' },
  { stage: 'STAGE_BUILDING', level: 'info', agent: 'developer', message: '[TOOL] write_file("prisma/schema.prisma") → 890B written to sandbox' },
  { stage: 'STAGE_BUILDING', level: 'warning', agent: 'developer', message: '[TOOL] run_tests("npm test") → FAIL: TypeError in invoice parser. Retry 1/2...' },
  { stage: 'STAGE_BUILDING', level: 'info', agent: 'developer', message: '[TOOL] write_file("lib/parseInvoice.ts") → patch applied (null-check added)' },
  { stage: 'STAGE_BUILDING', level: 'info', agent: 'qa', message: '[AGENT] qa validating fix: re-running test suite...' },
  { stage: 'STAGE_BUILDING', level: 'info', agent: 'developer', message: '[TOOL] run_tests("npm test") → PASS: 4/4 tests green' },
  { stage: 'STAGE_BUILDING', level: 'success', agent: 'developer', message: 'Build complete. 5 files written. Tests passing. Sandbox snapshot created.' },

  // DEPLOYMENT
  { stage: 'STAGE_DEPLOYMENT', level: 'info', agent: 'devops', message: '[AGENT] devops active — containerizing application' },
  { stage: 'STAGE_DEPLOYMENT', level: 'info', agent: 'devops', message: '[TOOL] docker_build("Dockerfile") → image mvp-ai-invoice:latest (124MB)' },
  { stage: 'STAGE_DEPLOYMENT', level: 'info', agent: 'devops', message: '[TOOL] push_image("here.now registry") → pushed in 3.2s' },
  { stage: 'STAGE_DEPLOYMENT', level: 'success', agent: 'devops', message: `Deployment live: ${DEMO_DEPLOYMENT_URL} — status: RUNNING` },

  // MINTING
  { stage: 'MINTING_TOKEN', level: 'info', agent: 'pipeline', message: 'Initiating SURGE tokenization protocol for AI Invoice Tracker...' },
  { stage: 'MINTING_TOKEN', level: 'info', agent: 'pipeline', message: `Contract address generated: ${DEMO_CONTRACT_ADDRESS}` },
  { stage: 'MINTING_TOKEN', level: 'success', agent: 'pipeline', message: '$INVC token minted. Supply: 1,000,000. Network: testnet. Status: CONFIRMED' },

  // MOLTBOOK
  { stage: 'POSTING_MOLTBOOK', level: 'info', agent: 'pipeline', message: 'Posting proof-of-build to Moltbook /lablab...' },
  { stage: 'POSTING_MOLTBOOK', level: 'info', agent: 'pipeline', message: 'Verification challenge received. Solving with TOON reasoning...' },
  { stage: 'POSTING_MOLTBOOK', level: 'success', agent: 'pipeline', message: 'Moltbook post live. Proof-of-build published.' },

  // COMPLETE
  { stage: 'COMPLETE', level: 'success', agent: 'pipeline', message: '✓ Pipeline complete. MVP deployed, tokenized, and published. Total: 55s.' },
];

// ─── Stage → LifecycleStage shape ────────────────────────────────────────────

function buildStages(current: SimStage): LifecycleStage[] {
  const order: SimStage[] = [
    'STAGE_IDEATION',
    'STAGE_ARCHITECTURE',
    'STAGE_BUILDING',
    'STAGE_DEPLOYMENT',
  ];
  const names = ['Ideation', 'Architecture', 'Build', 'Deploy'] as const;
  const agents = ['researcher', 'architect', 'developer', 'devops'];
  const durations = [4500, 7200, 14800, 6100];

  const currentIdx = order.indexOf(current as SimStage);

  // Stages after COMPLETE
  if (current === 'MINTING_TOKEN' || current === 'POSTING_MOLTBOOK' || current === 'COMPLETE') {
    return names.map((name, i) => ({
      name,
      status: 'completed' as const,
      agentName: agents[i],
      durationMs: durations[i],
    }));
  }

  return names.map((name, i) => {
    let status: LifecycleStage['status'];
    if (currentIdx === -1 || i > currentIdx) {
      status = 'pending';
    } else if (i === currentIdx) {
      status = 'active';
    } else {
      status = 'completed';
    }
    return {
      name,
      status,
      agentName: agents[i],
      durationMs: status === 'completed' ? durations[i] : undefined,
    };
  });
}

// ─── Demo MVP base object ─────────────────────────────────────────────────────

function buildMVP(stage: SimStage, now: string): MVP {
  const isComplete = stage === 'COMPLETE';
  const hasDeployment = ['STAGE_DEPLOYMENT', 'MINTING_TOKEN', 'POSTING_MOLTBOOK', 'COMPLETE'].includes(stage);
  const hasToken = ['MINTING_TOKEN', 'POSTING_MOLTBOOK', 'COMPLETE'].includes(stage);
  const hasMoltbook = ['POSTING_MOLTBOOK', 'COMPLETE'].includes(stage);

  return {
    id: DEMO_MVP_ID,
    name: 'AI Invoice Tracker',
    tagline: 'Autonomous invoice management for freelancers',
    status: isComplete ? 'deployed' : 'building',
    currentStage: 'Deploy',
    retryCount: 1,
    mode: 'agent',
    ideaSummary: 'A simple AI tool that takes PDF invoices and parses them into a structured database. Supports freelancers and small businesses tracking payments automatically.',
    techStack: ['Next.js 15', 'PostgreSQL', 'Prisma', 'FastAPI', 'Tailwind'],
    stages: buildStages(stage),
    logs: [], // logs are streamed separately
    reasoning: {
      summary: 'Chose Next.js for better deployment support on here.now. PostgreSQL preferred over SQLite for multi-tenant readiness. Context compressed 3× via TOON.',
      reflectionNotes: 'Retry was needed on invoice parser — null-check missing on optional PDF metadata field. Fixed deterministically.',
      contextCompressionSummary: 'Compressed 45k tokens to 4.1k with TOON optimizer. Ratio: 10.9×',
      lastStepOutput: {
        filesWritten: 5,
        testsPassed: 4,
        buildDurationMs: 14800,
      },
    },
    deployment: {
      url: hasDeployment ? DEMO_DEPLOYMENT_URL : '',
      status: hasDeployment ? 'running' : 'building',
      timestamp: now,
      platform: 'here.now',
    },
    token: {
      name: hasToken ? 'Invoice Token' : '',
      symbol: hasToken ? 'INVC' : '',
      contractAddress: hasToken ? DEMO_CONTRACT_ADDRESS : '',
      supply: hasToken ? 1_000_000 : 0,
      createdAt: hasToken ? now : '',
      txHash: hasToken ? DEMO_TX_HASH : '',
    },
    moltbook: {
      status: hasMoltbook ? 'posted' : 'pending',
      postUrl: hasMoltbook ? 'https://moltbook.com/eido/ai-invoice-tracker' : undefined,
      message: hasMoltbook
        ? 'Just autonomously built and deployed AI Invoice Tracker. Idea → live MVP in 55s. #EIDO #lablab #autonomous'
        : '',
      timestamp: hasMoltbook ? now : '',
    },
    createdAt: now,
  };
}

// ─── Hook return type ─────────────────────────────────────────────────────────

export interface DemoSimulationResult {
  /** Whether demo simulation is active for this mvpId */
  active: boolean;
  /** Current simulation stage */
  stage: SimStage;
  /** Full MVP object, updated as simulation advances */
  mvp: MVP;
  /** Accumulated log entries so far */
  logs: AgentLog[];
  /** Whether simulation has finished */
  isComplete: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDemoSimulation(mvpId: string): DemoSimulationResult | null {
  const active = DEMO_MODE && mvpId === DEMO_MVP_ID;

  const nowRef = useRef(new Date().toISOString());
  const [stage, setStage] = useState<SimStage>('IDLE');
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const logIndexRef = useRef(0);
  const tickRef = useRef(0);

  useEffect(() => {
    if (!active) return;

    // Reset
    nowRef.current = new Date().toISOString();
    setStage('IDLE');
    setLogs([]);
    logIndexRef.current = 0;
    tickRef.current = 0;

    const interval = setInterval(() => {
      tickRef.current += 1;
      const elapsed = tickRef.current * (TICK_MS / 1000);

      // Determine current stage from transition map
      let nextStage: SimStage = 'SUBMITTED';
      for (const [sec, s] of TRANSITION_SECONDS) {
        if (elapsed >= sec) nextStage = s;
      }

      setStage((prev) => {
        if (prev !== nextStage) return nextStage;
        return prev;
      });

      // Emit next log entry if available
      const logEntry = LOG_SCRIPT[logIndexRef.current];
      if (logEntry) {
        const newLog: AgentLog = {
          id: `sim-log-${logIndexRef.current}`,
          timestamp: new Date().toISOString(),
          agent: logEntry.agent,
          message: logEntry.message,
          level: logEntry.level,
        };
        setLogs((prev) => [...prev, newLog]);
        logIndexRef.current += 1;
      }

      // Stop interval when complete
      if (nextStage === 'COMPLETE' && logIndexRef.current >= LOG_SCRIPT.length) {
        clearInterval(interval);
      }
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [active, mvpId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!active) return null;

  return {
    active,
    stage,
    mvp: buildMVP(stage, nowRef.current),
    logs,
    isComplete: stage === 'COMPLETE',
  };
}
