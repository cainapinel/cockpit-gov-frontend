import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';

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
  login: (access: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('cockpit_token'));
  const [user, setUser] = useState<UserData | null>(null);

  const fetchAuthUser = async () => {
    try {
      const res = await api.get('/users/me/');
      setUser(res.data);
    } catch(e) {
      console.error("Failed to fetch user data:", e);
    }
  };

  const login = (access: string) => {
    localStorage.setItem('cockpit_token', access);
    setToken(access);
    api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
  };

  const logout = () => {
    localStorage.removeItem('cockpit_token');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
  };

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchAuthUser();
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
