import { apiClient } from '@/lib/config';

export interface WaitlistJoinRequest {
  name: string;
  email: string;
  note?: string;
}

export const WaitlistAPI = {
  async join(payload: WaitlistJoinRequest) {
    const response = await apiClient.post('/api/waitlist/join', payload);
    return response.data;
  },
};
