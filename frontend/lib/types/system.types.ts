export type ServiceHealth = 'operational' | 'degraded' | 'down';

export interface ServiceStatus {
    name: string;
    key: string;
    health: ServiceHealth;
    details: Record<string, string | number | boolean>;
    lastChecked: string;
}

export interface SystemStatus {
    overallHealth: ServiceHealth;
    services: ServiceStatus[];
    lastUpdated: string;
}

export interface HealthResponse {
    status: string;
    timestamp: string;
    version: string;
    environment: string;
}

export interface DeepHealthResponse extends HealthResponse {
    checks: Record<string, unknown>;
}
