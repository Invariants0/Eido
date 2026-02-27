export interface DashboardSummary {
    totalMvps: number;
    activeBuilds: number;
    deployedMvps: number;
    tokensCreated: number;
    avgTimeToMarket?: string;
    totalAgentHours?: number;
}

export interface ActivityLog {
    id: string;
    message: string;
    timestamp: string;
    type: 'build' | 'deploy' | 'token' | 'system' | 'error';
    mvpId?: string;
}
