// -----------------------------------------
// EIDO – Mock API Client
// All functions simulate real backend calls
// via delayed async responses (setTimeout).
// -----------------------------------------

import type {
    MVP,
    AgentLog,
    DeploymentStatus,
    TokenInfo,
    AgentReasoning,
    MoltbookPost,
} from './types';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// ----------------------------------------
// MOCK DATA
// ----------------------------------------

const MOCK_MVP: MVP = {
    id: 'eido-001',
    name: 'ResumeAI',
    tagline: 'ATS-aware resume builder for job seekers',
    status: 'deployed',
    currentStage: 'Publish',
    retryCount: 1,
    mode: 'agent',
    ideaSummary:
        'Job seekers struggle to tailor resumes for ATS systems. Existing tools are expensive or fully manual. Eido identified this pain from r/cscareerquestions with a feasibility score of 8.4.',
    techStack: ['Vite + React', 'Tailwind CSS', 'FastAPI', 'Docker', 'SURGE', 'here.now'],
    stages: [
        { name: 'Ideation', status: 'completed', agentName: 'IdeationAgent', durationMs: 3200, completedAt: '2026-02-24T00:01:00Z' },
        { name: 'Architecture', status: 'completed', agentName: 'ArchitectureAgent', durationMs: 5800, completedAt: '2026-02-24T00:02:00Z' },
        { name: 'Build', status: 'completed', agentName: 'BuilderAgent', durationMs: 12400, completedAt: '2026-02-24T00:04:00Z' },
        { name: 'Fix', status: 'completed', agentName: 'ReflectionLoop', durationMs: 7600, completedAt: '2026-02-24T00:05:30Z' },
        { name: 'Deploy', status: 'completed', agentName: 'DevOpsAgent', durationMs: 9200, completedAt: '2026-02-24T00:07:00Z' },
        { name: 'Token', status: 'completed', agentName: 'BusinessAgent', durationMs: 2100, completedAt: '2026-02-24T00:07:30Z' },
        { name: 'Publish', status: 'active', agentName: 'FeedbackAgent' },
    ],
    logs: [
        { id: '1', timestamp: '00:00:01', agent: 'ManagerAgent', message: 'Initializing EIDO pipeline for eido-001...', level: 'system' },
        { id: '2', timestamp: '00:00:03', agent: 'IdeationAgent', message: 'Searching Hacker News for pain points...', level: 'info' },
        { id: '3', timestamp: '00:00:08', agent: 'IdeationAgent', message: 'Found 3 viable candidates. Top: "ATS resume fixer" score=8.4', level: 'success' },
        { id: '4', timestamp: '00:00:12', agent: 'ArchitectureAgent', message: 'Generating system blueprint from approved template stack...', level: 'info' },
        { id: '5', timestamp: '00:00:18', agent: 'ArchitectureAgent', message: 'Blueprint generated. Stack: Vite+React / FastAPI / Docker', level: 'success' },
        { id: '6', timestamp: '00:00:22', agent: 'BuilderAgent', message: 'Scaffolding project files via OpenClaw file system tool...', level: 'info' },
        { id: '7', timestamp: '00:00:31', agent: 'BuilderAgent', message: 'Running: docker build -t resumeai:latest .', level: 'info' },
        { id: '8', timestamp: '00:00:44', agent: 'BuilderAgent', message: 'ERROR: Missing dependency "python-multipart"', level: 'error' },
        { id: '9', timestamp: '00:00:46', agent: 'ReflectionLoop', message: 'Build failed. Compressing logs via Toon...', level: 'warning' },
        { id: '10', timestamp: '00:00:49', agent: 'ReflectionLoop', message: 'Root cause identified: Missing pip dependency in requirements.txt', level: 'warning' },
        { id: '11', timestamp: '00:00:51', agent: 'ReflectionLoop', message: 'Applying deterministic fix: Adding "python-multipart>=0.0.6"', level: 'info' },
        { id: '12', timestamp: '00:00:53', agent: 'BuilderAgent', message: 'Retry (1/3): docker build -t resumeai:latest .', level: 'info' },
        { id: '13', timestamp: '00:01:08', agent: 'BuilderAgent', message: 'BUILD SUCCESS. Image size: 287MB', level: 'success' },
        { id: '14', timestamp: '00:01:10', agent: 'DevOpsAgent', message: 'Deploying to here.now runtime...', level: 'info' },
        { id: '15', timestamp: '00:01:19', agent: 'DevOpsAgent', message: 'Health check passed. App responding on port 3000.', level: 'success' },
        { id: '16', timestamp: '00:01:21', agent: 'DevOpsAgent', message: 'DEPLOYMENT ACTIVE: https://resumeai.eido.here.now', level: 'success' },
        { id: '17', timestamp: '00:01:24', agent: 'BusinessAgent', message: 'Creating SURGE token: $RSMAI on testnet...', level: 'info' },
        { id: '18', timestamp: '00:01:26', agent: 'BusinessAgent', message: 'Token minted. Contract: 0xabc...def. Supply: 1,000,000', level: 'success' },
        { id: '19', timestamp: '00:01:29', agent: 'FeedbackAgent', message: 'Composing Moltbook post: "Built MVP #1: ResumeAI — Deployed & Tokenized"', level: 'info' },
        { id: '20', timestamp: '00:01:31', agent: 'FeedbackAgent', message: 'Post published to Moltbook. Proof-of-life confirmed.', level: 'success' },
        { id: '21', timestamp: '00:01:33', agent: 'ManagerAgent', message: 'Pipeline complete. Autonomous cycle eido-001 finished.', level: 'system' },
    ],
    reasoning: {
        summary:
            'Pipeline executed successfully after one build failure. The IdeationAgent selected the top-scoring idea from an r/cscareerquestions thread. The BuilderAgent generated a deterministic scaffold but encountered a missing Python dependency during the Docker build phase. The ReflectionLoop compressed the error logs via Toon and applied a targeted patch to requirements.txt, allowing the build to succeed on retry 1/3.',
        retryExplanation:
            'BuilderAgent retry triggered at 00:00:46 due to ModuleNotFoundError for "python-multipart". ReflectionLoop identified this as a missing pip dependency, not a logic error. Applied deterministic rule: append missing package to requirements.txt.',
        reflectionNotes:
            'This class of error (missing pip dependency) has now been flagged in the learnings store. Future builds using FastAPI will auto-include "python-multipart" in the base requirements template.',
        contextCompressionSummary:
            'Toon compressed 42 lines of Docker build logs → 3-line structured error summary. Total tokens saved: ~1,840. Compression ratio: 14x.',
        lastStepOutput: {
            stage: 'Publish',
            agent: 'FeedbackAgent',
            action: 'post_to_moltbook',
            status: 'success',
            post_id: 'mlt-00192',
            engagement: {
                views: 0,
                reactions: 0,
            },
        },
    },
    deployment: {
        url: 'https://resumeai.eido.here.now',
        status: 'running',
        timestamp: '2026-02-24T00:01:21Z',
        containerId: 'cnt_resumeai_8f2d',
        platform: 'here.now',
    },
    token: {
        name: 'ResumeAI Token',
        symbol: 'RSMAI',
        contractAddress: '0xabc123def456abc789def012abc345def678',
        supply: 1_000_000,
        createdAt: '2026-02-24T00:01:26Z',
        txHash: '0xtx9f2e81a0d7c6b4e3f5a2c1b0d9e8f7a6b5c4',
    },
    moltbook: {
        status: 'posted',
        postUrl: 'https://moltbook.com/eido/post/mlt-00192',
        message: 'Built MVP #1: ResumeAI — Deployed & Tokenized. Autonomous cycle complete. #EIDO #SURGE #OpenClaw',
        timestamp: '2026-02-24T00:01:31Z',
    },
    createdAt: '2026-02-24T00:00:00Z',
};

// ----------------------------------------
// API FUNCTIONS
// ----------------------------------------

export async function getMVP(id: string): Promise<MVP> {
    await delay(600);
    console.log(`[api] getMVP(${id})`);
    return { ...MOCK_MVP, id };
}

export async function getAgentStatus(id: string): Promise<{ stage: string; status: string; retryCount: number }> {
    await delay(300);
    console.log(`[api] getAgentStatus(${id})`);
    return {
        stage: MOCK_MVP.currentStage,
        status: MOCK_MVP.status,
        retryCount: MOCK_MVP.retryCount,
    };
}

export async function getAgentLogs(id: string): Promise<AgentLog[]> {
    await delay(400);
    console.log(`[api] getAgentLogs(${id})`);
    return MOCK_MVP.logs;
}

export async function getToken(id: string): Promise<TokenInfo> {
    await delay(300);
    console.log(`[api] getToken(${id})`);
    return MOCK_MVP.token;
}

export async function getDeploymentStatus(id: string): Promise<DeploymentStatus> {
    await delay(350);
    console.log(`[api] getDeploymentStatus(${id})`);
    return MOCK_MVP.deployment;
}

export async function getAgentReasoning(id: string): Promise<AgentReasoning> {
    await delay(450);
    console.log(`[api] getAgentReasoning(${id})`);
    return MOCK_MVP.reasoning;
}

export async function getMoltbookPost(id: string): Promise<MoltbookPost> {
    await delay(300);
    console.log(`[api] getMoltbookPost(${id})`);
    return MOCK_MVP.moltbook;
}

export async function triggerRetryBuild(id: string): Promise<{ success: boolean }> {
    await delay(800);
    console.log(`[api] triggerRetryBuild(${id})`);
    return { success: true };
}

export async function advanceStage(id: string): Promise<{ success: boolean; newStage: string }> {
    await delay(600);
    console.log(`[api] advanceStage(${id})`);
    return { success: true, newStage: 'Deploy' };
}

// ----------------------------------------
// TOKEN DETAIL PAGE – MOCK DATA & API
// ----------------------------------------

import type {
    TokenDetail,
    TokenTransfer,
    OwnershipInfo,
    TokenUtility,
    PortfolioEntry,
} from './types';

const MOCK_TOKEN_DETAIL: TokenDetail = {
    id: 'surge-rsmai-001',
    name: 'ResumeAI Token',
    symbol: 'RSMAI',
    status: 'active',
    tokenType: 'utility',
    contractAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    totalSupply: 1_000_000,
    circulatingSupply: 620_000,
    creatorWallet: '0xEido7a2f...9c4dAgent',
    network: 'testnet',
    createdAt: '2026-02-24T00:01:26Z',
    mintTxHash: '0xtx9f2e81a0d7c6b4e3f5a2c1b0d9e8f7a6b5c4d3e2f1a0',
    mvpId: 'eido-001',
    mvpName: 'ResumeAI',
    price: 0.42,
    priceChange24h: 12.5,
    marketCap: 420_000,
    holders: 156,
};

const MOCK_TRANSFERS: TokenTransfer[] = [
    { id: 'tx-1', txHash: '0xa1b2c3...d4e5', from: '0x0000...0000', to: '0xEido...Agent', amount: 1_000_000, timestamp: '2026-02-24T00:01:26Z', type: 'mint', status: 'confirmed' },
    { id: 'tx-2', txHash: '0xf6e7d8...c9b0', from: '0xEido...Agent', to: '0xTreasury...Vault', amount: 200_000, timestamp: '2026-02-24T00:02:10Z', type: 'transfer', status: 'confirmed' },
    { id: 'tx-3', txHash: '0x1a2b3c...4d5e', from: '0xUser1...Addr', to: '0xDEX...Pool', amount: 500, timestamp: '2026-02-24T01:15:00Z', type: 'buy', status: 'confirmed' },
    { id: 'tx-4', txHash: '0x5f6e7d...8c9b', from: '0xUser2...Addr', to: '0xDEX...Pool', amount: 120, timestamp: '2026-02-24T01:20:00Z', type: 'sell', status: 'confirmed' },
    { id: 'tx-5', txHash: '0x0a1b2c...3d4e', from: '0xUser3...Addr', to: '0xDEX...Pool', amount: 2_500, timestamp: '2026-02-24T01:30:00Z', type: 'buy', status: 'pending' },
];

const MOCK_OWNERSHIP: OwnershipInfo = {
    ownerWallet: '0xEido7a2f...9c4dAgent',
    percentageOwned: 38,
    treasuryBalance: 84_000,
    revenuePool: 12_600,
    allocations: [
        { label: 'Public Circulation', percentage: 62, color: '#3B82F6' },
        { label: 'EIDO Treasury', percentage: 20, color: '#22D3EE' },
        { label: 'Creator Agent', percentage: 10, color: '#10B981' },
        { label: 'Liquidity Pool', percentage: 5, color: '#F59E0B' },
        { label: 'Reserve', percentage: 3, color: '#9CA3AF' },
    ],
};

const MOCK_UTILITIES: TokenUtility[] = [
    { title: 'Early MVP Access', description: 'Token holders get priority access to new features and beta releases of ResumeAI before public launch.', active: true },
    { title: 'Governance Voting', description: 'Participate in product direction decisions — feature prioritization, pricing model, and integration roadmap.', active: true },
    { title: 'Revenue Participation', description: 'Pro-rata share of 15% of net MVP revenue distributed quarterly to token holders.', active: false },
    { title: 'Usage Credits', description: '1 RSMAI = 10 premium resume analyses. Holders receive unlimited basic-tier access.', active: true },
];

const MOCK_PORTFOLIO: PortfolioEntry[] = [
    { tokenId: 'surge-rsmai-001', tokenName: 'ResumeAI Token', symbol: 'RSMAI', holdings: 25_000, value: 10_500, change24h: 12.5 },
    { tokenId: 'surge-fitai-002', tokenName: 'FitTrackAI Token', symbol: 'FTAI', holdings: 10_000, value: 3_200, change24h: -4.2 },
    { tokenId: 'surge-codex-003', tokenName: 'CodexBot Token', symbol: 'CDXB', holdings: 50_000, value: 7_500, change24h: 8.1 },
];

export async function getTokenDetail(id: string): Promise<TokenDetail> {
    await delay(500);
    console.log(`[api] getTokenDetail(${id})`);
    return { ...MOCK_TOKEN_DETAIL, id };
}

export async function getTokenActivity(id: string): Promise<TokenTransfer[]> {
    await delay(400);
    console.log(`[api] getTokenActivity(${id})`);
    return MOCK_TRANSFERS;
}

export async function getTokenOwnership(id: string): Promise<OwnershipInfo> {
    await delay(350);
    console.log(`[api] getTokenOwnership(${id})`);
    return MOCK_OWNERSHIP;
}

export async function getTokenUtilities(id: string): Promise<TokenUtility[]> {
    await delay(300);
    console.log(`[api] getTokenUtilities(${id})`);
    return MOCK_UTILITIES;
}

export async function getPortfolio(): Promise<PortfolioEntry[]> {
    await delay(450);
    console.log(`[api] getPortfolio()`);
    return MOCK_PORTFOLIO;
}
