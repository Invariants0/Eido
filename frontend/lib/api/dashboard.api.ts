import { apiClient } from '../config';
import type { DashboardSummary, ActivityLog } from '../types';

export const DashboardAPI = {
    async getSummary(): Promise<DashboardSummary> {
        const response = await apiClient.get<DashboardSummary>('/api/dashboard/summary');
        return response.data;
    },

    async getRecentActivity(): Promise<ActivityLog[]> {
        const response = await apiClient.get<ActivityLog[]>('/api/dashboard/activity');
        return response.data;
    }
};
