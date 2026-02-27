export type AgentLogLevel = 'info' | 'success' | 'warning' | 'error' | 'system';

export interface AgentLog {
    id: string;
    timestamp: string;
    agent: string;
    message: string;
    level: AgentLogLevel;
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
