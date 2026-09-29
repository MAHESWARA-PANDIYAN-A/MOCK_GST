import api from './api';
import { User } from '../types';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authService = {
  sendOtp: async (mobile: string, purpose: string = 'REGISTRATION') => {
    const res = await api.post('/auth/send-otp', { mobile, purpose });
    return res.data;
  },

  verifyOtp: async (mobile: string, otp: string, purpose: string = 'REGISTRATION') => {
    const res = await api.post('/auth/verify-otp', { mobile, otp, purpose });
    return res.data;
  },

  register: async (data: any): Promise<LoginResponse> => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};
