import { apiClient } from '../config';
import type { SystemStatus, HealthResponse, DeepHealthResponse } from '../types';

export const SystemAPI = {
    async getStatus(): Promise<SystemStatus> {
        console.warn('[api] getSystemStatus not yet implemented in backend');
        return {
            overallHealth: 'operational',
            lastUpdated: new Date().toISOString(),
            services: [],
        };
    },

    async getHealth(): Promise<HealthResponse> {
        const response = await apiClient.get<HealthResponse>('/health');
        return response.data;
    },

    async getDeepHealth(): Promise<DeepHealthResponse> {
        const response = await apiClient.get<DeepHealthResponse>('/health/deep');
        return response.data;
    },

    async getMetrics(): Promise<string> {
        const response = await apiClient.get<string>('/metrics');
        return response.data;
    }
};
