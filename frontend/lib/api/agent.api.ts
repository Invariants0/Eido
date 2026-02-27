import { apiClient } from '../config';
import type { AgentTimelineItem, AgentMemory, ReflectionNote } from '../types';

export const AgentAPI = {
    async getTimeline(): Promise<AgentTimelineItem[]> {
        console.warn('[api] getTimeline not yet implemented in backend');
        return [];
    },

    async getMemory(): Promise<AgentMemory> {
        console.warn('[api] getMemory not yet implemented in backend');
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
    },

    async getReflectionNotes(): Promise<ReflectionNote[]> {
        console.warn('[api] getReflectionNotes not yet implemented in backend');
        return [];
    }
};
