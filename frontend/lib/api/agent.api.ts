import type { AgentTimelineItem, AgentMemory, ReflectionNote } from '../types';

const MOCK_TIMELINE: AgentTimelineItem[] = [
    {
        id: 'tl-1',
        stageName: 'Ideation',
        agentName: 'researcher',
        reasoningSummary: 'Analyzed invoice automation market. TAM: $4.2B. Identified 6 competitors. Confidence score: 87/100. Recommended Next.js + PostgreSQL stack for fast deployment.',
        timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
        status: 'success',
        details: 'search_web × 1, analyze_market × 1. Total tokens: 612. Duration: 4.5s.',
    },
    {
        id: 'tl-2',
        stageName: 'Architecture',
        agentName: 'architect',
        reasoningSummary: 'Designed 3-service architecture: Next.js frontend, FastAPI backend, PostgreSQL DB. Generated Prisma schema and selected stack based on here.now deployment requirements.',
        timestamp: new Date(Date.now() - 1000 * 60 * 47).toISOString(),
        status: 'success',
        details: 'generate_schema × 1, select_stack × 1. Context compressed 45k→4.1k tokens via TOON. Duration: 7.2s.',
    },
    {
        id: 'tl-3',
        stageName: 'Build',
        agentName: 'developer',
        reasoningSummary: 'Scaffolded 5 files. Tests failed on first run due to null-check missing in PDF parser. Applied deterministic fix and re-ran. All 4 tests passed on retry.',
        timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        status: 'retry',
        details: 'write_file × 5, run_tests × 2 (1 retry). Duration: 14.8s.',
    },
    {
        id: 'tl-4',
        stageName: 'Deploy',
        agentName: 'devops',
        reasoningSummary: 'Containerized application via Docker. Pushed 124MB image to here.now registry. Deployment URL confirmed live. Post-deploy health check passed.',
        timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        status: 'success',
        details: 'docker_build × 1, push_image × 1. Deployment URL: https://ai-invoice-tracker.here.now. Duration: 6.1s.',
    },
];

const MOCK_MEMORY: AgentMemory = {
    currentObjective: 'Monitor deployed MVP and respond to post-deployment events.',
    stage: 'Deploy',
    retryCount: 1,
    contextCompression: {
        originalTokens: 45200,
        compressedTokens: 4100,
        reason: 'TOON optimizer triggered at architecture stage — context exceeded 40k token threshold.',
    },
    lastAgentOutput: {
        deploymentUrl: 'https://ai-invoice-tracker.here.now',
        tokenSymbol: 'INVC',
        moltbookPostId: 'eido-ai-invoice-tracker',
        pipelineDurationMs: 54800,
    },
};

const MOCK_REFLECTIONS: ReflectionNote[] = [
    {
        id: 'ref-1',
        errorExplanation: 'invoice parser threw TypeError: Cannot read property "metadata" of undefined on first test run.',
        correctionApplied: 'Added optional chaining to PDF metadata access in lib/parseInvoice.ts line 47.',
        deterministicFix: 'Always add null-check before accessing nested optional fields from external PDF libraries.',
    },
    {
        id: 'ref-2',
        errorExplanation: 'Architecture stage context exceeded 40k tokens, risking LLM truncation during build stage.',
        correctionApplied: 'TOON context optimizer triggered automatically. Compressed 45.2k → 4.1k tokens (90.9% reduction).',
        deterministicFix: 'Trigger TOON compression whenever context exceeds 35k tokens as a pre-emptive safety measure.',
    },
];

export const AgentAPI = {
    async getTimeline(): Promise<AgentTimelineItem[]> {
        return MOCK_TIMELINE;
    },

    async getMemory(): Promise<AgentMemory> {
        return MOCK_MEMORY;
    },

    async getReflectionNotes(): Promise<ReflectionNote[]> {
        return MOCK_REFLECTIONS;
    }
};
