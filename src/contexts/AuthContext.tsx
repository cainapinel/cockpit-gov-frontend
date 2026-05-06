import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface UserData {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  region_access_level: string;
}

interface AuthContextType {
  token: string | null;
  user: UserData | null;
  login: (access: string, refresh: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  /** Segundos restantes no access token atual (0 = expirado) */
  sessionSecondsLeft: number;
  /** true se o usuário estiver inativo há mais de IDLE_TIMEOUT_MS */
  isIdle: boolean;
}

// ─── Constantes ────────────────────────────────────────────────────────────────

/** Inatividade máxima antes de parar de renovar (ms) */
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;   // 30 minutos

/** Janela antes da expiração em que o token é renovado pró-ativamente (s) */
const RENEW_THRESHOLD_SEC = 10 * 60;       // renovar se restar < 10 min

/** Intervalo de checagem do timer de sessão (ms) */
const TICK_INTERVAL_MS = 10_000;           // 10 segundos

/** Eventos que indicam que o usuário está ativo */
const ACTIVITY_EVENTS: (keyof DocumentEventMap)[] = [
  'mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel', 'click',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Decodifica a payload de um JWT sem verificar assinatura. */
function decodeJWTPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(b64.padEnd(b64.length + (4 - (b64.length % 4)) % 4, '='));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Retorna quantos segundos restam até a expiração do token (pode ser negativo). */
function getSecondsLeft(token: string): number {
  const payload = decodeJWTPayload(token);
  if (!payload || typeof payload.exp !== 'number') return 0;
  return Math.floor(payload.exp - Date.now() / 1000);
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
  sessionSecondsLeft: 0,
  isIdle: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken]   = useState<string | null>(localStorage.getItem('cockpit_token'));
  const [user, setUser]     = useState<UserData | null>(null);
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState<number>(0);
  const [isIdle, setIsIdle] = useState(false);

  const lastActivityRef = useRef<number>(Date.now());
  const refreshingRef   = useRef(false);

  // ── Dados do usuário ────────────────────────────────────────────────────────
  const fetchAuthUser = async () => {
    try {
      const res = await api.get('/users/me/');
      setUser(res.data);
    } catch {
      // silencioso — o interceptor de 401 no api.ts cuida do logout
    }
  };

  // ── Auth actions ────────────────────────────────────────────────────────────
  const login = useCallback((access: string, refresh: string) => {
    localStorage.setItem('cockpit_token', access);
    localStorage.setItem('cockpit_refresh', refresh);
    setToken(access);
    api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('cockpit_token');
    localStorage.removeItem('cockpit_refresh');
    setToken(null);
    setUser(null);
    setSessionSecondsLeft(0);
    setIsIdle(false);
    delete api.defaults.headers.common['Authorization'];
  }, []);

  // ── Refresh do token ────────────────────────────────────────────────────────
  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (refreshingRef.current) return false;
    const refreshTk = localStorage.getItem('cockpit_refresh');
    if (!refreshTk) return false;
    refreshingRef.current = true;
    try {
      const res = await api.post('/token/refresh/', { refresh: refreshTk });
      const newAccess  = res.data.access;
      const newRefresh = res.data.refresh ?? refreshTk; // SimpleJWT rotaciona se configurado
      login(newAccess, newRefresh);
      return true;
    } catch {
      return false;
    } finally {
      refreshingRef.current = false;
    }
  }, [login]);

  // ── Tick de sessão (a cada 10s) ─────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    const tick = async () => {
      const secsLeft = getSecondsLeft(token);
      setSessionSecondsLeft(Math.max(secsLeft, 0));

      const idleMs = Date.now() - lastActivityRef.current;
      const idle   = idleMs > IDLE_TIMEOUT_MS;
      setIsIdle(idle);

      // Renovar pro-ativamente se: token prestes a expirar + usuário ativo
      if (!idle && secsLeft > 0 && secsLeft < RENEW_THRESHOLD_SEC) {
        await refreshToken();
      }

      // Token expirado e usuário ainda está ativo → tenta renovar uma última vez
      if (secsLeft <= 0 && !idle) {
        const ok = await refreshToken();
        if (!ok) logout();
      }

      // Token expirado e usuário inativo → logout
      if (secsLeft <= 0 && idle) {
        logout();
      }
    };

    tick(); // imediato
    const timer = setInterval(tick, TICK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [token, refreshToken, logout]);

  // ── Detector de atividade ───────────────────────────────────────────────────
  useEffect(() => {
    const onActivity = () => {
      lastActivityRef.current = Date.now();
      setIsIdle(false);
    };
    ACTIVITY_EVENTS.forEach((ev) => document.addEventListener(ev, onActivity, { passive: true }));
    return () => ACTIVITY_EVENTS.forEach((ev) => document.removeEventListener(ev, onActivity));
  }, []);

  // ── Inicializar headers e dados do user ao montar ──────────────────────────
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchAuthUser();
      setSessionSecondsLeft(Math.max(getSecondsLeft(token), 0));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <AuthContext.Provider
      value={{ token, user, login, logout, isAuthenticated: !!token, sessionSecondsLeft, isIdle }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
