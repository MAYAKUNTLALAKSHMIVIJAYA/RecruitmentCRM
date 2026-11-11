import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject JWT token into every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rf_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally by redirecting to login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('rf_token');
      localStorage.removeItem('rf_user');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/portal')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
