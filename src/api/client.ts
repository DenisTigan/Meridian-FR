import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Prevent infinite loops by checking _retry flag on the config
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Folosim o instanta noua de axios pentru a nu declansa eventual alte interceptoare
        const refreshResponse = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/Auth/refresh`,
          {},
          { withCredentials: true }
        );
        
        const { accessToken, requiresPasswordChange } = refreshResponse.data;
        
        // Actualizam authStore cu noul token
        useAuthStore.getState().setAuth(accessToken, requiresPasswordChange, useAuthStore.getState().user);
        
        // Reluam request-ul initial cu noul token
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Daca refresh-ul esueaza, curatam state-ul si fortam redirect
        useAuthStore.getState().clearAuth();
        window.location.href = '/login?sessionExpired=true';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
