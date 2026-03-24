import { apiClient } from '../config';
import { getFallbackMockMvp, mockMvpList, mockMvps } from '../mockData';
import type {
  AgentLog,
  AgentReasoning,
  DeploymentStatus,
  MoltbookPost,
  MVP,
  MVPBackendResponse,
  MVPCreateRequest,
  MVPListBackendResponse,
  MVPListItem,
  MVPRunsResponse,
} from '../types';

function mapBackendStatus(status: string): MVP['status'] {
  if (status === 'COMPLETED') return 'deployed';
  if (status.endsWith('FAILED') || status === 'FAILED') return 'failed';
  if (status === 'CREATED' || status === 'IDEATING' || status === 'ARCHITECTING') return 'idea';
  return 'building';
}

function mapBackendStage(status: string): MVP['currentStage'] {
  if (status === 'CREATED' || status === 'IDEATING') return 'Ideation';
  if (status === 'ARCHITECTING') return 'Architecture';
  if (status === 'BUILDING' || status === 'BUILD_FAILED') return 'Build';
  if (status === 'DEPLOYING' || status === 'DEPLOY_FAILED') return 'Deploy';
  if (status === 'TOKENIZING' || status === 'COMPLETED') return 'Token';
  return 'Build';
}

export const MvpAPI = {
  async start(data: MVPCreateRequest): Promise<MVPBackendResponse> {
    const response = await apiClient.post<MVPBackendResponse>('/api/mvp/start', data);
    return response.data;
  },

  async getListParams(page: number = 1, limit: number = 20): Promise<MVPListBackendResponse> {
    const skip = (page - 1) * limit;
    const response = await apiClient.get<MVPListBackendResponse>('/api/mvp/list', {
      params: { skip, limit },
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
        tagline: raw.idea_summary || raw.last_error_message || '',
        status: mapBackendStatus(raw.status),
        currentStage: mapBackendStage(raw.status),
        retryCount: raw.retry_count,
        mode: 'agent',
        ideaSummary: raw.idea_summary || '',
        techStack: [],
        stages: [],
        logs: [],
        reasoning: {
          summary: raw.last_error_message || '',
          reflectionNotes: '',
          contextCompressionSummary: '',
          lastStepOutput: {},
        },
        deployment: {
          url: raw.deployment_url || '',
          status: raw.deployment_url ? 'running' : 'building',
          timestamp: raw.updated_at,
          platform: 'here.now',
        },
        token: {
          name: '',
          symbol: raw.token_id || '',
          contractAddress: '',
          supply: 0,
          createdAt: '',
          txHash: '',
        },
        moltbook: {
          status: 'pending',
          message: '',
          timestamp: '',
        },
        createdAt: raw.created_at,
      };
    } catch {
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

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
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

  async getLogs(_: string): Promise<AgentLog[]> {
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

  async getReasoning(_: string): Promise<AgentReasoning> {
    return {
      summary: 'Reasoning data not yet available from backend',
      reflectionNotes: '',
      contextCompressionSummary: '',
      lastStepOutput: {},
    };
  },

  async getMoltbookPost(_: string): Promise<MoltbookPost> {
    return {
      status: 'pending',
      message: '',
      timestamp: new Date().toISOString(),
    };
  },

  async triggerRetryBuild(_: string): Promise<{ success: boolean }> {
    return { success: false };
  },

  async advanceStage(_: string): Promise<{ success: boolean; newStage: string }> {
    return { success: false, newStage: '' };
  },

  async getList(): Promise<MVPListItem[]> {
    try {
      const response = await MvpAPI.getListParams(1, 100);
      return response.items.map((item) => ({
        id: item.id.toString(),
        name: item.name,
        tagline: item.idea_summary || item.last_error_message || '',
        status: mapBackendStatus(item.status),
        currentStage: mapBackendStage(item.status),
        tokenSymbol: item.token_id || '',
        tokenStatus: item.token_id ? ('minted' as const) : ('none' as const),
        deploymentUrl: item.deployment_url || undefined,
        createdAt: item.created_at,
      }));
    } catch {
      return mockMvpList.items;
    }
  },
};
