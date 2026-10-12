import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
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
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
