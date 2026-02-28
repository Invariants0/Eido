import { apiClient } from '../config';
import { mockMvps, getFallbackMockMvp, mockMvpList } from '../mockData';
import type {
    MVP,
    MVPCreateRequest,
    MVPBackendResponse,
    MVPListBackendResponse,
    MVPRunsResponse,
    MVPListItem,
    AgentLog,
    DeploymentStatus,
    AgentReasoning,
    MoltbookPost
} from '../types';

export const MvpAPI = {
    async start(data: MVPCreateRequest): Promise<MVPBackendResponse> {
        const response = await apiClient.post<MVPBackendResponse>('/api/mvp/start', data);
        return response.data;
    },

    async getListParams(page: number = 1, limit: number = 20): Promise<MVPListBackendResponse> {
        const skip = (page - 1) * limit;
        const response = await apiClient.get<MVPListBackendResponse>('/api/mvp/list', {
            params: { skip, limit }
        });
        return response.data;
    },

    async getById(id: string): Promise<MVP> {
        try {
        const response = await apiClient.get<MVPBackendResponse>(`/api/mvp/${id}`);
        const raw = response.data;

        return {
            id: raw.id.toString(),
            name: raw.name,
            tagline: raw.idea_summary || '',
            status: raw.status as MVP['status'],
            currentStage: 'Ideation',
            retryCount: raw.retry_count,
            mode: 'agent',
            ideaSummary: raw.idea_summary || '',
            techStack: [],
            stages: [],
            logs: [],
            reasoning: {
                summary: '',
                reflectionNotes: '',
                contextCompressionSummary: '',
                lastStepOutput: {}
            },
            deployment: {
                url: raw.deployment_url || '',
                status: raw.deployment_url ? 'running' : 'building',
                timestamp: raw.updated_at,
                platform: 'here.now'
            },
            token: {
                name: '',
                symbol: raw.token_id || '',
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
            createdAt: raw.created_at
        };
        } catch {
            // Backend unreachable — serve from frontend mock data
            return mockMvps[id] ?? getFallbackMockMvp(id);
        }
    },

    async getRuns(id: string): Promise<MVPRunsResponse> {
        const response = await apiClient.get<MVPRunsResponse>(`/api/mvp/${id}/runs`);
        return response.data;
    },

    async pollUntilComplete(
        id: string,
        options: { intervalMs?: number; timeoutMs?: number } = {}
    ): Promise<MVP> {
        const { intervalMs = 3000, timeoutMs = 600000 } = options;
        const startTime = Date.now();

        while (true) {
            const mvp = await this.getById(id);

            if (mvp.status === 'deployed' || mvp.status === 'failed') {
                return mvp;
            }

            if (Date.now() - startTime > timeoutMs) {
                throw new Error(`Polling timeout after ${timeoutMs}ms`);
            }

            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
    },

    async getStatus(id: string): Promise<{ stage: string; status: string; retryCount: number }> {
        const mvp = await this.getById(id);
        return {
            stage: mvp.currentStage || 'Build',
            status: mvp.status,
            retryCount: mvp.retryCount,
        };
    },

    async getLogs(id: string): Promise<AgentLog[]> {
        console.warn('[api] getAgentLogs not yet implemented in backend');
        return [];
    },

    async getDeploymentStatus(id: string): Promise<DeploymentStatus> {
        const mvp = await this.getById(id);
        if (mvp.deployment) return mvp.deployment;
        return {
            url: '',
            status: mvp.status === 'deployed' ? 'running' : 'building',
            timestamp: mvp.createdAt || new Date().toISOString(),
            platform: 'here.now',
        };
    },

    async getReasoning(id: string): Promise<AgentReasoning> {
        console.warn('[api] getAgentReasoning not yet implemented in backend');
        return {
            summary: 'Reasoning data not yet available from backend',
            reflectionNotes: '',
            contextCompressionSummary: '',
            lastStepOutput: {},
        };
    },

    async getMoltbookPost(id: string): Promise<MoltbookPost> {
        console.warn('[api] getMoltbookPost not yet implemented in backend');
        return {
            status: 'pending',
            message: '',
            timestamp: new Date().toISOString(),
        };
    },

    async triggerRetryBuild(id: string): Promise<{ success: boolean }> {
        console.warn('[api] triggerRetryBuild not yet implemented in backend');
        return { success: false };
    },

    async advanceStage(id: string): Promise<{ success: boolean; newStage: string }> {
        console.warn('[api] advanceStage not yet implemented in backend');
        return { success: false, newStage: '' };
    },

    async getList(): Promise<MVPListItem[]> {
        const demoEntry = mockMvpList.items[0]; // 'eido-demo-001' — always first
        try {
            const response = await MvpAPI.getListParams(1, 100);
            const backendItems: MVPListItem[] = response.items.map(item => ({
                id: item.id.toString(),
                name: item.name,
                tagline: item.idea_summary || '',
                status: item.status as 'idea' | 'building' | 'failed' | 'deployed',
                currentStage: 'Build' as const,
                tokenSymbol: item.token_id || '',
                tokenStatus: item.token_id ? 'minted' as const : 'none' as const,
                deploymentUrl: item.deployment_url || undefined,
                createdAt: item.created_at,
            }));
            // Prepend demo MVP; exclude backend rows with the same id
            return [demoEntry, ...backendItems.filter(i => i.id !== demoEntry.id)];
        } catch {
            return mockMvpList.items;
        }
    }
};
