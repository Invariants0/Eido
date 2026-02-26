// -----------------------------------------
// EIDO – Production API Client
// Real backend integration with FastAPI
// -----------------------------------------

import type {
    MVP,
    AgentLog,
    DeploymentStatus,
    TokenInfo,
    AgentReasoning,
    MoltbookPost,
    TokenDetail,
    TokenTransfer,
    OwnershipInfo,
    TokenUtility,
    PortfolioEntry,
    SystemStatus,
    MVPListItem,
    TokenListItem,
    AgentTimelineItem,
    AgentMemory,
    ReflectionNote,
    DashboardSummary,
    ActivityLog,
} from './types';

// ----------------------------------------
// CONFIGURATION
// ----------------------------------------

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// ----------------------------------------
// ERROR HANDLING
// ----------------------------------------

interface ApiError {
    message: string;
    status: number;
}

class ApiRequestError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = 'ApiRequestError';
        this.status = status;
    }
}

// ----------------------------------------
// CORE REQUEST HELPER
// ----------------------------------------

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${BASE_URL}${path}`;

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        // Handle non-OK responses
        if (!response.ok) {
            let errorMessage = `Request failed with status ${response.status}`;

            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || errorData.message || errorMessage;
            } catch {
                // If JSON parsing fails, use status text
                errorMessage = response.statusText || errorMessage;
            }

            throw new ApiRequestError(errorMessage, response.status);
        }

        // Parse JSON response safely
        try {
            return await response.json();
        } catch (error) {
            throw new ApiRequestError('Failed to parse response JSON', response.status);
        }
    } catch (error) {
        // Network errors or fetch failures
        if (error instanceof ApiRequestError) {
            throw error;
        }

        // Log the actual error for debugging
        console.error('[API] Network error:', error);
        throw new Error(`Network error. Backend unavailable. ${error instanceof Error ? error.message : ''}`);
    }
}

// ----------------------------------------
// MVP API FUNCTIONS
// ----------------------------------------

interface MVPCreateRequest {
    name: string;
    idea_summary?: string;
}

interface MVPBackendResponse {
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

interface MVPListBackendResponse {
    items: MVPBackendResponse[];
    total: number;
}

interface MVPRunsResponse {
    mvp_id: number;
    runs: unknown[];
}

/**
 * Start a new MVP pipeline.
 * Returns 202 Accepted - pipeline runs in background.
 */
export async function startMVP(data: MVPCreateRequest): Promise<MVPBackendResponse> {
    return apiRequest<MVPBackendResponse>('/api/mvp/start', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * List all MVPs with pagination.
 */
export async function listMVPs(page: number = 1, limit: number = 20): Promise<MVPListBackendResponse> {
    const skip = (page - 1) * limit;
    return apiRequest<MVPListBackendResponse>(`/api/mvp/list?skip=${skip}&limit=${limit}`);
}

/**
 * Get MVP by ID.
 */
export async function getMVP(id: string): Promise<MVPBackendResponse> {
    return apiRequest<MVPBackendResponse>(`/api/mvp/${id}`);
}

/**
 * Get all agent runs for an MVP.
 */
export async function getMVPRuns(id: string): Promise<MVPRunsResponse> {
    return apiRequest<MVPRunsResponse>(`/api/mvp/${id}/runs`);
}

// ----------------------------------------
// POLLING HELPER
// ----------------------------------------

interface PollOptions {
    intervalMs?: number;
    timeoutMs?: number;
}

/**
 * Poll MVP until it reaches a terminal state.
 * Does NOT auto-run - must be called explicitly.
 */
export async function pollMVPUntilComplete(
    id: string,
    options: PollOptions = {}
): Promise<MVPBackendResponse> {
    const { intervalMs = 3000, timeoutMs = 600000 } = options; // 10 min default timeout
    const startTime = Date.now();

    while (true) {
        const mvp = await getMVP(id);

        // Check for terminal states
        if (mvp.status === 'deployed' || mvp.status === 'failed') {
            return mvp;
        }

        // Check timeout
        if (Date.now() - startTime > timeoutMs) {
            throw new Error(`Polling timeout after ${timeoutMs}ms`);
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
}

// ----------------------------------------
// HEALTH & METRICS API
// ----------------------------------------

interface HealthResponse {
    status: string;
    timestamp: string;
    version: string;
    environment: string;
}

interface DeepHealthResponse extends HealthResponse {
    checks: Record<string, unknown>;
}

export async function getHealth(): Promise<HealthResponse> {
    return apiRequest<HealthResponse>('/health');
}

export async function getDeepHealth(): Promise<DeepHealthResponse> {
    return apiRequest<DeepHealthResponse>('/health/deep');
}

export async function getMetrics(): Promise<string> {
    return apiRequest<string>('/metrics');
}

// ----------------------------------------
// LEGACY MOCK FUNCTIONS (Temporary Stubs)
// These maintain compatibility with existing UI
// until backend implements full feature set
// ----------------------------------------

export async function getAgentStatus(id: string): Promise<{ stage: string; status: string; retryCount: number }> {
    const mvp = await getMVP(id);
    return {
        stage: 'Build', // TODO: Map from backend state
        status: mvp.status,
        retryCount: mvp.retry_count,
    };
}

export async function getAgentLogs(id: string): Promise<AgentLog[]> {
    // TODO: Backend needs to implement logs endpoint
    console.warn('[api] getAgentLogs not yet implemented in backend');
    return [];
}

export async function getToken(id: string): Promise<TokenInfo> {
    // TODO: Backend needs to implement token detail endpoint
    console.warn('[api] getToken not yet implemented in backend');
    return {
        name: 'Token',
        symbol: 'TKN',
        contractAddress: '0x0000000000000000000000000000000000000000',
        supply: 0,
        createdAt: new Date().toISOString(),
        txHash: '0x0000000000000000000000000000000000000000',
    };
}

export async function getDeploymentStatus(id: string): Promise<DeploymentStatus> {
    const mvp = await getMVP(id);
    return {
        url: mvp.deployment_url || '',
        status: mvp.status === 'deployed' ? 'running' : 'building',
        timestamp: mvp.updated_at,
        platform: 'here.now',
    };
}

export async function getAgentReasoning(id: string): Promise<AgentReasoning> {
    // TODO: Backend needs to implement reasoning endpoint
    console.warn('[api] getAgentReasoning not yet implemented in backend');
    return {
        summary: 'Reasoning data not yet available from backend',
        reflectionNotes: '',
        contextCompressionSummary: '',
        lastStepOutput: {},
    };
}

export async function getMoltbookPost(id: string): Promise<MoltbookPost> {
    // TODO: Backend needs to implement moltbook endpoint
    console.warn('[api] getMoltbookPost not yet implemented in backend');
    return {
        status: 'pending',
        message: '',
        timestamp: new Date().toISOString(),
    };
}

export async function triggerRetryBuild(id: string): Promise<{ success: boolean }> {
    // TODO: Backend needs to implement retry endpoint
    console.warn('[api] triggerRetryBuild not yet implemented in backend');
    return { success: false };
}

export async function advanceStage(id: string): Promise<{ success: boolean; newStage: string }> {
    // TODO: Backend needs to implement stage advancement endpoint
    console.warn('[api] advanceStage not yet implemented in backend');
    return { success: false, newStage: '' };
}

// ----------------------------------------
// TOKEN DETAIL PAGE API (Stubs)
// ----------------------------------------

export async function getTokenDetail(id: string): Promise<TokenDetail> {
    console.warn('[api] getTokenDetail not yet implemented in backend');
    return {
        id,
        name: 'Token',
        symbol: 'TKN',
        status: 'active',
        tokenType: 'utility',
        contractAddress: '0x0000000000000000000000000000000000000000',
        totalSupply: 0,
        circulatingSupply: 0,
        creatorWallet: '0x0000000000000000000000000000000000000000',
        network: 'testnet',
        createdAt: new Date().toISOString(),
        mintTxHash: '0x0000000000000000000000000000000000000000',
        mvpId: '',
        mvpName: '',
        price: 0,
        priceChange24h: 0,
        marketCap: 0,
        holders: 0,
    };
}

export async function getTokenActivity(id: string): Promise<TokenTransfer[]> {
    console.warn('[api] getTokenActivity not yet implemented in backend');
    return [];
}

export async function getTokenOwnership(id: string): Promise<OwnershipInfo> {
    console.warn('[api] getTokenOwnership not yet implemented in backend');
    return {
        ownerWallet: '0x0000000000000000000000000000000000000000',
        percentageOwned: 0,
        treasuryBalance: 0,
        revenuePool: 0,
        allocations: [],
    };
}

export async function getTokenUtilities(id: string): Promise<TokenUtility[]> {
    console.warn('[api] getTokenUtilities not yet implemented in backend');
    return [];
}

export async function getPortfolio(): Promise<PortfolioEntry[]> {
    console.warn('[api] getPortfolio not yet implemented in backend');
    return [];
}

// ----------------------------------------
// SYSTEM STATUS PAGE API (Stub)
// ----------------------------------------

export async function getSystemStatus(): Promise<SystemStatus> {
    console.warn('[api] getSystemStatus not yet implemented in backend');
    return {
        overallHealth: 'operational',
        lastUpdated: new Date().toISOString(),
        services: [],
    };
}

// ----------------------------------------
// LIST PAGE API (Stubs)
// ----------------------------------------

export async function getMVPList(): Promise<MVPListItem[]> {
    console.warn('[api] getMVPList not yet implemented - use listMVPs instead');
    const response = await listMVPs(1, 100);

    // Map backend response to frontend format
    return response.items.map(item => ({
        id: item.id.toString(),
        name: item.name,
        tagline: item.idea_summary || '',
        status: item.status as 'idea' | 'building' | 'failed' | 'deployed',
        currentStage: 'Build' as const, // TODO: Map from backend
        tokenSymbol: item.token_id || '',
        tokenStatus: item.token_id ? 'minted' as const : 'none' as const,
        deploymentUrl: item.deployment_url || undefined,
        createdAt: item.created_at,
    }));
}

export async function getTokenList(): Promise<TokenListItem[]> {
    console.warn('[api] getTokenList not yet implemented in backend');
    return [];
}

// ----------------------------------------
// AGENT BRAIN PAGE API (Stubs)
// ----------------------------------------

export async function getAgentTimeline(): Promise<AgentTimelineItem[]> {
    console.warn('[api] getAgentTimeline not yet implemented in backend');
    return [];
}

export async function getAgentMemory(): Promise<AgentMemory> {
    console.warn('[api] getAgentMemory not yet implemented in backend');
    return {
        currentObjective: '',
        stage: '',
        retryCount: 0,
        contextCompression: {
            originalTokens: 0,
            compressedTokens: 0,
            reason: '',
        },
        lastAgentOutput: {},
    };
}

export async function getReflectionNotes(): Promise<ReflectionNote[]> {
    console.warn('[api] getReflectionNotes not yet implemented in backend');
    return [];
}

// ----------------------------------------
// DASHBOARD PAGE API (Stubs)
// ----------------------------------------

export async function getDashboardSummary(): Promise<DashboardSummary> {
    return apiRequest<DashboardSummary>('/api/dashboard/summary');
}

export async function getRecentActivity(): Promise<ActivityLog[]> {
    return apiRequest<ActivityLog[]>('/api/dashboard/activity');
}
