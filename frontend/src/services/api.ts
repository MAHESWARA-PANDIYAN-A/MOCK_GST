import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? (window.location.port === '5173' || window.location.port === '8176' ? 'http://localhost:8003/api' : '/api')
    : '/api'
);

export const DOCS_URL = API_BASE_URL.startsWith('http')
  ? API_BASE_URL.replace(/\/api\/?$/, '/docs')
  : '/docs';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mock_gst_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register') && window.location.pathname !== '/') {
      localStorage.removeItem('mock_gst_token');
      localStorage.removeItem('mock_gst_user');
      window.location.href = '/applicant/login';
    }
    return Promise.reject(error);
  }
);

export default api;
