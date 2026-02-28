import { apiClient } from '../config';
import type { SystemStatus, HealthResponse, DeepHealthResponse } from '../types';

const MOCK_SYSTEM_STATUS: SystemStatus = {
    overallHealth: 'operational',
    lastUpdated: new Date().toISOString(),
    services: [
        {
            name: 'OpenClaw Runtime',
            key: 'openclaw',
            health: 'operational',
            details: { version: '0.4.1', sandboxMode: 'local-fallback', toolsAvailable: 12, invocationsToday: 47 },
            lastChecked: new Date().toISOString(),
        },
        {
            name: 'LLM Router',
            key: 'llm',
            health: 'operational',
            details: { provider: 'Groq', model: 'llama-3.3-70b-versatile', latencyMs: 820, tokensUsedToday: 84200 },
            lastChecked: new Date().toISOString(),
        },
        {
            name: 'CrewAI Orchestrator',
            key: 'crewai',
            health: 'operational',
            details: { version: '0.100.0', activeCrews: 0, completedRuns: 3, avgDurationMs: 54800 },
            lastChecked: new Date().toISOString(),
        },
        {
            name: 'E2B Sandbox',
            key: 'docker',
            health: 'operational',
            details: { mode: 'local-filesystem', workspaceDir: './workspace', filesWritten: 15 },
            lastChecked: new Date().toISOString(),
        },
        {
            name: 'SURGE Protocol',
            key: 'surge',
            health: 'operational',
            details: { mode: 'testnet-mock', tokensCreated: 2, lastTokenSymbol: 'INVC' },
            lastChecked: new Date().toISOString(),
        },
        {
            name: 'Moltbook Publisher',
            key: 'moltbook',
            health: 'operational',
            details: { postsPublished: 1, lastPost: 'AI Invoice Tracker launch', verificationPassed: true },
            lastChecked: new Date().toISOString(),
        },
        {
            name: 'TOON Optimizer',
            key: 'toon',
            health: 'operational',
            details: { compressionsRun: 3, avgCompressionRatio: '10.9x', tokensSaved: 123600 },
            lastChecked: new Date().toISOString(),
        },
    ],
};

export const SystemAPI = {
    async getStatus(): Promise<SystemStatus> {
        return { ...MOCK_SYSTEM_STATUS, lastUpdated: new Date().toISOString() };
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
