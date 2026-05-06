import axios from 'axios';

// Resolve o backend dinamicamente: usa o mesmo hostname que o browser acessou
// Ex: se acessou via 192.168.0.22:5173, API vai para 192.168.0.22:8000
const API_HOST = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api`;

export const api = axios.create({
  baseURL: API_HOST,
  timeout: 180000, // 3 minutes timeout for heavy LLM operations
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor: attach JWT + enforce trailing slashes + proactive refresh
api.interceptors.request.use(
  async (config) => {
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

    // Attach access token
    const token = localStorage.getItem('cockpit_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Controle de refresh concorrente ──────────────────────────────────────────
let _refreshPromise: Promise<string | null> | null = null;

async function attemptRefresh(): Promise<string | null> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    const refreshTk = localStorage.getItem('cockpit_refresh');
    if (!refreshTk) return null;
    try {
      // Chamada direta (sem interceptor para evitar loop)
      const res = await axios.post(
        `${API_HOST}/token/refresh/`,
        { refresh: refreshTk },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const newAccess  = res.data.access  as string;
      const newRefresh = (res.data.refresh ?? refreshTk) as string;
      localStorage.setItem('cockpit_token',   newAccess);
      localStorage.setItem('cockpit_refresh', newRefresh);
      api.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;
      return newAccess;
    } catch {
      return null;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

// Response interceptor: on 401 → try refresh once → retry → logout
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/token/')
    ) {
      originalRequest._retry = true;
      const newToken = await attemptRefresh();
      if (newToken) {
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
      }
      // Refresh falhou → força logout
      localStorage.removeItem('cockpit_token');
      localStorage.removeItem('cockpit_refresh');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
