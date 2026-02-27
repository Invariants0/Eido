import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

/**
 * PRODUCTION-GRADE API CLIENT
 * - Centralized Axios instance for the entire application
 * - Environment variable for Base URL
 * - Request/Response Interceptors for Auth & Global Error Handling
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const apiClient: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

/**
 * REQUEST INTERCEPTOR
 * Attaches auth tokens or any global headers before the request leaves.
 */
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Example: Add token if available
        // const token = localStorage.getItem('access_token');
        // if (token) {
        //     config.headers['Authorization'] = `Bearer ${token}`;
        // }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

/**
 * RESPONSE INTERCEPTOR
 * Global error handling, unified data extraction, and token refreshing.
 */
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        // We only want to return the actual data to our API service methods
        return response;
    },
    (error: AxiosError) => {
        // Extract and format backend errors
        if (error.response) {
            console.error('[API Error]', error.response.status, error.response.data);

            // Example: Global 401 Unauthorized handling
            if (error.response.status === 401) {
                // handle logout or token refresh
            }
        } else if (error.request) {
            console.error('[API Network Error]', error.request);
        } else {
            console.error('[API Request Config Error]', error.message);
        }

        return Promise.reject(error);
    }
);
