import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import { clearBackendToken, getBackendToken } from '@/lib/auth/backendSession';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getBackendToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response) {
      console.error('[API Error]', error.response.status, error.response.data);

      if (error.response.status === 401) {
        clearBackendToken();
      }
    } else if (error.request) {
      console.error('[API Network Error]', error.request);
    } else {
      console.error('[API Request Config Error]', error.message);
    }

    return Promise.reject(error);
  }
);
