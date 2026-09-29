import api from './api';
import { ApplicationSummary, ApplicationDetail, DocumentRequirement, DocumentItem, QueryItem, NotificationItem } from '../types';

export const applicantService = {
  getStats: async () => {
    const res = await api.get('/applicant/dashboard-stats');
    return res.data;
  },

  getApplications: async (): Promise<ApplicationSummary[]> => {
    const res = await api.get('/applicant/applications');
    return res.data;
  },

  createApplication: async () => {
    const res = await api.post('/applicant/applications');
    return res.data;
  },

  getApplication: async (id: number | string): Promise<ApplicationDetail> => {
    const res = await api.get(`/applicant/applications/${id}`);
    return res.data;
  },

  saveDraft: async (id: number | string, data: any) => {
    const res = await api.put(`/applicant/applications/${id}/draft`, data);
    return res.data;
  },

  getDocumentRequirements: async (): Promise<DocumentRequirement[]> => {
    const res = await api.get('/applicant/document-requirements');
    return res.data;
  },

  uploadDocument: async (appId: number | string, documentType: string, file: File): Promise<DocumentItem> => {
    const formData = new FormData();
    formData.append('document_type', documentType);
    formData.append('file', file);
    const res = await api.post(`/applicant/applications/${appId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  submitApplication: async (appId: number | string, mockOtp: string = '123456') => {
    const res = await api.post(`/applicant/applications/${appId}/submit`, { mock_otp: mockOtp });
    return res.data;
  },

  respondToQuery: async (appId: number | string, queryId: number, applicantResponse: string): Promise<QueryItem> => {
    const res = await api.post(`/applicant/applications/${appId}/queries/${queryId}/respond`, {
      applicant_response: applicantResponse,
    });
    return res.data;
  },

  getNotifications: async (): Promise<NotificationItem[]> => {
    const res = await api.get('/applicant/notifications');
    return res.data;
  },

  markNotificationRead: async (notifId: number) => {
    const res = await api.put(`/applicant/notifications/${notifId}/read`);
    return res.data;
  },
};
