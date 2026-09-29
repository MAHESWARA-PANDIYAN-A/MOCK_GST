import api from './api';
import { User, AuditLogItem } from '../types';

export const adminService = {
  getOfficers: async (): Promise<User[]> => {
    const res = await api.get('/admin/officers');
    return res.data;
  },

  createOfficer: async (data: { name: string; email: string; mobile: string; password: string }): Promise<User> => {
    const res = await api.post('/admin/officers', data);
    return res.data;
  },

  assignApplication: async (appId: number, officerId: number) => {
    const res = await api.put(`/admin/applications/${appId}/assign`, { officer_id: officerId });
    return res.data;
  },

  getAuditLogs: async (limit: number = 100): Promise<AuditLogItem[]> => {
    const res = await api.get('/admin/audit-logs', { params: { limit } });
    return res.data;
  },

  getIntegrationLogs: async (limit: number = 100) => {
    const res = await api.get('/admin/integration-logs', { params: { limit } });
    return res.data;
  },

  getStats: async () => {
    const res = await api.get('/admin/stats');
    return res.data;
  },
};
