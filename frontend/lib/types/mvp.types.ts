import type { AgentLog, AgentReasoning } from './agent.types';
import type { TokenInfo } from './token.types';

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

export interface DeploymentStatus {
    url: string;
    status: 'building' | 'running' | 'failed';
    timestamp: string;
    containerId?: string;
    platform: string;
}

export interface MoltbookPost {
    status: 'posted' | 'pending' | 'failed';
    postUrl?: string;
    message: string;
    timestamp: string;
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

export interface MVPCreateRequest {
    name: string;
    idea_summary?: string;
}

export interface MVPBackendResponse {
    id: number;
    name: string;
    status: string;
    idea_summary: string | null;
    deployment_url: string | null;
    token_id: string | null;
    retry_count: number;
    created_at: string;
    updated_at: string;
}

export interface MVPListBackendResponse {
    items: MVPBackendResponse[];
    total: number;
}

export interface MVPRunsResponse {
    mvp_id: number;
    runs: unknown[];
}
