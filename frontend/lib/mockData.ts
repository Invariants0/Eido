import type {
    MVP,
    DashboardSummary,
    ActivityLog,
    MVPListItem,
    MVPRunsResponse,
    HealthResponse,
    DeepHealthResponse
} from './types';

// Mock Dashboard Summary
export const mockDashboardSummary: DashboardSummary = {
    totalMvps: 12,
    activeBuilds: 3,
    deployedMvps: 8,
    tokensCreated: 6,
    avgTimeToMarket: '4.2 hrs',
    totalAgentHours: 142
};

// Mock Activity Logs
export const mockActivityLogs: ActivityLog[] = [
    { id: '1', type: 'error', message: 'E2B Sandbox build failed - Trapped stderr, sending to Toon Optimizer', timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), mvpId: '3' },
    { id: '2', type: 'build', message: 'Agent "developer" is compiling Next.js app', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), mvpId: '3' },
    { id: '3', type: 'deploy', message: 'AI Invoice Tracker successfully deployed to here.now', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), mvpId: '1' },
    { id: '4', type: 'token', message: '$INVC token smart contract deployed via SURGE protocol', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3.5).toISOString(), mvpId: '1' }
];

// Mock MVP List Items (for dashboard)
export const mockMvpList: { items: MVPListItem[]; total: number } = {
    items: [
        { id: '1', name: 'AI Invoice Tracker', tagline: 'Automates freelancer invoices', status: 'deployed', currentStage: 'Deploy', tokenSymbol: 'INVC', tokenStatus: 'minted', deploymentUrl: 'https://ai-invoice.here.now', createdAt: new Date().toISOString() },
        { id: '2', name: 'EcoRewards App', tagline: 'Gamified recycling tracking application', status: 'failed', currentStage: 'Deploy', tokenSymbol: '', tokenStatus: 'none', createdAt: new Date(Date.now() - 86400000).toISOString() },
        { id: '3', name: 'Solana Meme Generator', tagline: 'Generates and mints memes as NFTs automatically', status: 'building', currentStage: 'Build', tokenSymbol: '', tokenStatus: 'none', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
        { id: '4', name: 'Voice-to-CRM tool', tagline: 'Transcribes voice notes directly into Salesforce records', status: 'idea', currentStage: 'Ideation', tokenSymbol: '', tokenStatus: 'none', createdAt: new Date(Date.now() - 86400000 * 3).toISOString() }
    ],
    total: 4
};

// Mock Complete MVP Objects (for detail page)
export const mockMvps: Record<string, MVP> = {
    '1': {
        id: '1',
        name: 'AI Invoice Tracker',
        tagline: 'Automates freelancer invoices',
        status: 'deployed',
        currentStage: 'Deploy',
        retryCount: 0,
        mode: 'agent',
        ideaSummary: 'A simple AI tool that takes PDF invoices and puts them into a database.',
        techStack: ['Next.js', 'PostgreSQL', 'Tailwind', 'Python'],
        stages: [
            { name: 'Ideation', status: 'completed', agentName: 'researcher', durationMs: 4500 },
            { name: 'Architecture', status: 'completed', agentName: 'architect', durationMs: 3200 },
            { name: 'Build', status: 'completed', agentName: 'developer', durationMs: 12500 },
            { name: 'Deploy', status: 'completed', agentName: 'devops' }
        ],
        logs: [],
        reasoning: {
            summary: 'Decided to use Next.js for better Vercel deployment support.',
            reflectionNotes: 'Need to add better error handling for PDF parsing.',
            contextCompressionSummary: 'Compressed 45k tokens to 4k with TOON.',
            lastStepOutput: {}
        },
        deployment: {
            url: 'https://ai-invoice.here.now',
            status: 'running',
            timestamp: new Date().toISOString(),
            platform: 'here.now'
        },
        token: {
            name: 'Invoice Token',
            symbol: 'INVC',
            contractAddress: '0x123...abc',
            supply: 1000000,
            createdAt: new Date().toISOString(),
            txHash: '0xxabc'
        },
        moltbook: {
            status: 'posted',
            message: 'Just deployed the AI Invoice Tracker MVP!',
            timestamp: new Date().toISOString()
        },
        createdAt: new Date().toISOString()
    },
    '3': {
        id: '3',
        name: 'Solana Meme Generator',
        tagline: 'Generates and mints memes as NFTs automatically',
        status: 'building',
        currentStage: 'Build',
        retryCount: 1,
        mode: 'agent',
        ideaSummary: 'Takes text commands, asks groq for an image, then mints on solana testnet.',
        techStack: ['Next.js', 'Solana Web3', 'Node.js'],
        stages: [
            { name: 'Ideation', status: 'completed', agentName: 'researcher', durationMs: 3200 },
            { name: 'Architecture', status: 'completed', agentName: 'architect', durationMs: 4100 },
            { name: 'Build', status: 'active', agentName: 'developer' },
            { name: 'Deploy', status: 'pending', agentName: 'devops' }
        ],
        logs: [],
        reasoning: {
            summary: 'Currently troubleshooting solana web3 build error.',
            reflectionNotes: '',
            contextCompressionSummary: '',
            lastStepOutput: {}
        },
        deployment: {
            url: '',
            status: 'building',
            timestamp: new Date().toISOString(),
            platform: 'here.now'
        },
        token: {
            name: '',
            symbol: '',
            contractAddress: '',
            supply: 0,
            createdAt: '',
            txHash: ''
        },
        moltbook: {
            status: 'pending',
            message: '',
            timestamp: ''
        },
        createdAt: new Date().toISOString()
    }
};

// Default fallback mock
export const getFallbackMockMvp = (id: string): MVP => ({
    id,
    name: `Mocked MVP ${id}`,
    tagline: 'Mocked Data Fallback',
    status: 'building',
    currentStage: 'Build',
    retryCount: 0,
    mode: 'agent',
    ideaSummary: 'This is a mocked fallback for an unknown ID.',
    techStack: ['TypeScript'],
    stages: [],
    logs: [],
    reasoning: { summary: '', reflectionNotes: '', contextCompressionSummary: '', lastStepOutput: {} },
    deployment: { url: '', status: 'building', timestamp: new Date().toISOString(), platform: 'here.now' },
    token: { name: '', symbol: '', contractAddress: '', supply: 0, createdAt: '', txHash: '' },
    moltbook: { status: 'pending', message: '', timestamp: '' },
    createdAt: new Date().toISOString()
});

export const mockHealth: HealthResponse = {
    status: 'mock_healthy',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    environment: 'development'
};

export const mockDeepHealth: DeepHealthResponse = {
    ...mockHealth,
    checks: {}
};
