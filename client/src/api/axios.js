import axios from 'axios';
import { API_CONFIG } from '../config/api';

const api = axios.create({
  baseURL: API_CONFIG.apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Prevent infinite reload loop on /auth/me, /auth/login, or if already on public pages
    const isAuthCheck = error.config?.url?.includes('/auth/me') || error.config?.url?.includes('/auth/login');
    const isPublicPage = window.location.pathname === '/login' || window.location.pathname === '/';

    if (error.response && error.response.status === 401 && !isAuthCheck && !isPublicPage) {
      window.location.replace('/login');
    }
    return Promise.reject(error);
  }
);

export default api;
