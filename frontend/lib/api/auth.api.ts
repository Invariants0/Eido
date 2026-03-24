import { apiClient } from '@/lib/config';

export const AuthAPI = {
  async me() {
    const response = await apiClient.get('/api/users/me');
    return response.data;
  },

  async surgeStatus() {
    const response = await apiClient.get('/api/auth/surge-status');
    return response.data as { configured: boolean; mode: string; base_url: string };
  },
};
