import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get('auth_token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Log the error for debugging
      if (process.env.NODE_ENV !== 'production') {
        console.error('401 Unauthorized - Request details:', {
          url: originalRequest.url,
          method: originalRequest.method,
          hasToken: !!Cookies.get('auth_token'),
          error: error.response?.data
        });
      }
      
      // Clear auth data
      Cookies.remove('auth_token');
      Cookies.remove('user_id');
      
      // Only redirect if we're not already on login/register page
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
          window.location.href = '/login';
        }
      }
      
      return Promise.reject(error);
    }

    // Log errors in development
    if (process.env.NODE_ENV !== 'production') {
      const status = error.response?.status;
      
      if (status === 429) {
        console.warn('Rate limit exceeded:', error.response?.data);
      } else if (status && status >= 500) {
        const errorData = error.response?.data;
        const errorMessage = 
          (typeof errorData === 'object' && errorData !== null && !Array.isArray(errorData))
            ? ((errorData as any).error || (errorData as any).message || JSON.stringify(errorData))
            : (errorData || error.message || 'Unknown server error');
        console.error('Server error:', {
          status: status,
          statusText: error.response?.statusText,
          url: originalRequest?.url,
          method: originalRequest?.method,
          message: errorMessage,
          data: errorData
        });
      } else if (status && status >= 400) {
        // Log client errors (4xx) too, but as warnings
        const errorData = error.response?.data;
        const errorMessage = 
          (typeof errorData === 'object' && errorData !== null && !Array.isArray(errorData))
            ? ((errorData as any).error || (errorData as any).message || JSON.stringify(errorData))
            : (errorData || error.message || 'Request failed');
        console.warn('Client error:', {
          status: status,
          statusText: error.response?.statusText,
          url: originalRequest?.url,
          method: originalRequest?.method,
          message: errorMessage
        });
      }
    }

    return Promise.reject(error);
  }
);

// Error response type
export interface ApiError {
  error: string;
  message?: string;
  details?: any;
}

// Generic API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Helper function to handle API errors
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiError;
    return apiError?.error || apiError?.message || error.message || 'An unexpected error occurred';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

// Helper function for making GET requests
export const get = async <T = any>(url: string, params?: any): Promise<T> => {
  const response = await apiClient.get<T>(url, { params });
  return response.data;
};

// Helper function for making POST requests
export const post = async <T = any>(url: string, data?: any): Promise<T> => {
  const response = await apiClient.post<T>(url, data);
  return response.data;
};

// Helper function for making PUT requests
export const put = async <T = any>(url: string, data?: any): Promise<T> => {
  const response = await apiClient.put<T>(url, data);
  return response.data;
};

// Helper function for making DELETE requests
export const del = async <T = any>(url: string): Promise<T> => {
  const response = await apiClient.delete<T>(url);
  return response.data;
};

export default apiClient;

