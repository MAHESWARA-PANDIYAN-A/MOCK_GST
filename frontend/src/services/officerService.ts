import api from './api';
import { ApplicationSummary, ApplicationDetail, DocumentItem, QueryItem } from '../types';

export interface OfficerDashboardData {
  metrics: {
    total_applications: number;
    new_submitted: number;
    pending_validation: number;
    under_review: number;
    document_queries: number;
    approved: number;
    rejected: number;
  };
  constitution_breakdown: Record<string, number>;
  district_breakdown: Record<string, number>;
}

export const officerService = {
  getDashboard: async (): Promise<OfficerDashboardData> => {
    const res = await api.get('/officer/dashboard');
    return res.data;
  },

  getApplications: async (params?: {
    search?: string;
    status_filter?: string;
    district_filter?: string;
    constitution_filter?: string;
    activity_filter?: string;
  }): Promise<ApplicationSummary[]> => {
    const res = await api.get('/officer/applications', { params });
    return res.data;
  },

  getApplication: async (id: number | string): Promise<ApplicationDetail> => {
    const res = await api.get(`/applicant/applications/${id}`); // shared detail endpoint with RBAC
    return res.data;
  },

  updateStatus: async (appId: number | string, status: string, reason?: string) => {
    const res = await api.put(`/officer/applications/${appId}/status`, { status, reason });
    return res.data;
  },

  reviewDocument: async (docId: number, reviewStatus: string, officerComment?: string): Promise<DocumentItem> => {
    const res = await api.put(`/officer/documents/${docId}/review`, {
      review_status: reviewStatus,
      officer_comment: officerComment,
    });
    return res.data;
  },

  createQuery: async (appId: number | string, subject: string, message: string, responseDeadline?: string): Promise<QueryItem> => {
    const res = await api.post(`/officer/applications/${appId}/queries`, {
      subject,
      message,
      response_deadline: responseDeadline,
    });
    return res.data;
  },

  resolveQuery: async (queryId: number): Promise<QueryItem> => {
    const res = await api.put(`/officer/queries/${queryId}/resolve`);
    return res.data;
  },

  approveApplication: async (appId: number | string, remarks?: string) => {
    const res = await api.post(`/officer/applications/${appId}/approve`, { remarks });
    return res.data;
  },

  rejectApplication: async (appId: number | string, reason: string) => {
    const res = await api.post(`/officer/applications/${appId}/reject`, { reason });
    return res.data;
  },
};
