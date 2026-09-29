import axios from 'axios';
import { API_BASE_URL } from './api';

export const integrationService = {
  prefillApplication: async (payload: any, apiKey: string) => {
    const res = await axios.post(`${API_BASE_URL}/integrations/v1/applications/prefill`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
    });
    return res.data;
  },

  getStatus: async (applicationNumber: string, apiKey: string) => {
    const res = await axios.get(`${API_BASE_URL}/integrations/v1/applications/${applicationNumber}/status`, {
      headers: {
        'X-API-Key': apiKey,
      },
    });
    return res.data;
  },

  getCompleteApplication: async (applicationNumber: string, apiKey: string) => {
    const res = await axios.get(`${API_BASE_URL}/integrations/v1/applications/${applicationNumber}`, {
      headers: {
        'X-API-Key': apiKey,
      },
    });
    return res.data;
  },

  submitApplication: async (applicationNumber: string, apiKey: string) => {
    const res = await axios.post(`${API_BASE_URL}/integrations/v1/applications/${applicationNumber}/submit`, {}, {
      headers: {
        'X-API-Key': apiKey,
      },
    });
    return res.data;
  },
};
