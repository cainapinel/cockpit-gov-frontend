import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 180000, // 3 minutes timeout for heavy LLM operations
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor to attach JWT token and enforce trailing slashes
api.interceptors.request.use(
  (config) => {
    // Enforce Trailing Slash para evitar Redirecionamento 301 no Django (Quebra de CORS)
    if (config.url && !config.url.endsWith('/')) {
        if (!config.url.includes('?')) {
            config.url = `${config.url}/`;
        } else {
            const parts = config.url.split('?');
            if (!parts[0].endsWith('/')) {
                config.url = `${parts[0]}/?${parts.slice(1).join('?')}`;
            }
        }
    }

    // We would normally get this from a Zustand store or AuthContext
    const token = localStorage.getItem('cockpit_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to force logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cockpit_token');
      // Prevent recursive redirects if already on login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
