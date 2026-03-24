import { apiClient } from '@/lib/config';

export interface BillingStatus {
  free_run_available: boolean;
  free_run_consumed_at: string | null;
  paid_runs_count: number;
  donation_count: number;
}

export const BillingAPI = {
  async getStatus(): Promise<BillingStatus> {
    const response = await apiClient.get<BillingStatus>('/api/billing/status');
    return response.data;
  },

  async createMockPayment(kind: 'donation' | 'run_payment', amount: number, force_fail = false) {
    const response = await apiClient.post('/api/billing/mock-payment', {
      kind,
      amount,
      force_fail,
    });
    return response.data as { status: string; payment_token?: string; message: string };
  },
};
