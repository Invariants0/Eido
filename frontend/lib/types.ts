// -----------------------------------------
// EIDO – Core Type Definitions
// -----------------------------------------

export type LifecycleStageName =
    | 'Ideation'
    | 'Architecture'
    | 'Build'
    | 'Fix'
    | 'Deploy'
    | 'Token'
    | 'Publish';

export type StageStatus = 'completed' | 'active' | 'pending' | 'failed';

export interface LifecycleStage {
    name: LifecycleStageName;
    status: StageStatus;
    agentName: string;
    durationMs?: number;
    completedAt?: string;
}

export type AgentLogLevel = 'info' | 'success' | 'warning' | 'error' | 'system';

export interface AgentLog {
    id: string;
    timestamp: string;
    agent: string;
    message: string;
    level: AgentLogLevel;
}

export interface DeploymentStatus {
    url: string;
    status: 'building' | 'running' | 'failed';
    timestamp: string;
    containerId?: string;
    platform: string;
}

export interface TokenInfo {
    name: string;
    symbol: string;
    contractAddress: string;
    supply: number;
    createdAt: string;
    txHash: string;
}

export interface MoltbookPost {
    status: 'posted' | 'pending' | 'failed';
    postUrl?: string;
    message: string;
    timestamp: string;
}

export interface AgentReasoning {
    summary: string;
    retryExplanation?: string;
    reflectionNotes: string;
    contextCompressionSummary: string;
    lastStepOutput: Record<string, unknown>;
    ideationDiscovery?: {
        marketAnalysis: {
            tam: string;
            competitors: string[];
            swot: { strength: string; weakness: string; opportunity: string; threat: string };
        };
        userInterrogations: {
            persona: string;
            critique: string;
            confidenceScore: number;
        }[];
        brandingConcepts: {
            colors: string[];
            fontVibe: string;
            logoDescription: string;
        };
    };
}

export type OperationMode = 'human' | 'agent';

export interface MVP {
    id: string;
    name: string;
    tagline: string;
    status: 'idea' | 'building' | 'failed' | 'deployed';
    currentStage: LifecycleStageName;
    retryCount: number;
    mode: OperationMode;
    ideaSummary: string;
    techStack: string[];
    stages: LifecycleStage[];
    logs: AgentLog[];
    reasoning: AgentReasoning;
    deployment: DeploymentStatus;
    token: TokenInfo;
    moltbook: MoltbookPost;
    createdAt: string;
}

// -----------------------------------------
// Token Detail Page Types
// -----------------------------------------

export type TokenStatus = 'active' | 'minted' | 'failed';
export type TokenType = 'utility' | 'governance' | 'access';
export type NetworkType = 'testnet' | 'mainnet';

export interface TokenDetail {
    id: string;
    name: string;
    symbol: string;
    status: TokenStatus;
    tokenType: TokenType;
    contractAddress: string;
    totalSupply: number;
    circulatingSupply: number;
    creatorWallet: string;
    network: NetworkType;
    createdAt: string;
    mintTxHash: string;
    mvpId: string;
    mvpName: string;
    price: number;
    priceChange24h: number;
    marketCap: number;
    holders: number;
}

export interface TokenTransfer {
    id: string;
    txHash: string;
    from: string;
    to: string;
    amount: number;
    timestamp: string;
    type: 'mint' | 'transfer' | 'buy' | 'sell' | 'burn';
    status: 'confirmed' | 'pending';
}

export interface OwnershipInfo {
    ownerWallet: string;
    percentageOwned: number;
    treasuryBalance: number;
    revenuePool: number;
    allocations: {
        label: string;
        percentage: number;
        color: string;
    }[];
}

export interface TokenUtility {
    title: string;
    description: string;
    active: boolean;
}

export interface PortfolioEntry {
    tokenId: string;
    tokenName: string;
    symbol: string;
    holdings: number;
    value: number;
    change24h: number;
}

// -----------------------------------------
// System Status Page Types
// -----------------------------------------

export type ServiceHealth = 'operational' | 'degraded' | 'down';

export interface ServiceStatus {
    name: string;
    key: string;
    health: ServiceHealth;
    details: Record<string, string | number | boolean>;
    lastChecked: string;
}

export interface SystemStatus {
    overallHealth: ServiceHealth;
    services: ServiceStatus[];
    lastUpdated: string;
}

// -----------------------------------------
// List Page Types
// -----------------------------------------

export interface MVPListItem {
    id: string;
    name: string;
    tagline: string;
    status: 'idea' | 'building' | 'failed' | 'deployed';
    currentStage: LifecycleStageName;
    tokenSymbol: string;
    tokenStatus: 'minted' | 'pending' | 'none';
    deploymentUrl?: string;
    createdAt: string;
}

export interface TokenListItem {
    id: string;
    name: string;
    symbol: string;
    mvpId: string;
    mvpName: string;
    contractAddress: string;
    totalSupply: number;
    status: 'active' | 'minted' | 'failed';
    price: number;
    priceChange24h: number;
    holders: number;
    createdAt: string;
}

// -----------------------------------------
// Agent Brain Types
// -----------------------------------------

export interface AgentTimelineItem {
    id: string;
    stageName: string;
    agentName: string;
    reasoningSummary: string;
    timestamp: string;
    status: 'success' | 'retry' | 'failed';
    details: string;
}

export interface AgentMemory {
    currentObjective: string;
    stage: string;
    retryCount: number;
    contextCompression: {
        originalTokens: number;
        compressedTokens: number;
        reason: string;
    };
    lastAgentOutput: Record<string, unknown>;
}

export interface ReflectionNote {
    id: string;
    errorExplanation: string;
    correctionApplied: string;
    deterministicFix: string;
}

// -----------------------------------------
// Dashboard Types
// -----------------------------------------

export interface DashboardSummary {
    totalMvps: number;
    activeBuilds: number;
    deployedMvps: number;
    tokensCreated: number;
}

export interface ActivityLog {
    id: string;
    message: string;
    timestamp: string;
    type: 'build' | 'deploy' | 'token' | 'system' | 'error';
}
