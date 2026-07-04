import { apiClient } from './client';
import type { LoginRequest, LoginResponse, ChangePasswordRequest } from '@/types/auth.types';

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/Auth/login', data);
    return response.data;
  },
  
  changePassword: async (data: ChangePasswordRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/Auth/change-password', data);
    return response.data;
  },
  
  refresh: async (): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/Auth/refresh');
    return response.data;
  },
  
  logout: async (): Promise<void> => {
    await apiClient.post('/Auth/logout');
  }
};
