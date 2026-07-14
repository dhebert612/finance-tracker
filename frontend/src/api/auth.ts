import { apiClient } from './client.js';
import type { AuthResponse, LoginInput, RegisterInput } from '../types/auth.js';

export const authApi = {
  async login(input: LoginInput): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', input);
    return data;
  },

  async register(input: RegisterInput): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', input);
    return data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },
};