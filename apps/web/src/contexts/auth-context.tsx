'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('safeEats_token');
    const savedUser = localStorage.getItem('safeEats_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const saveAuth = (t: string, u: User) => {
    setToken(t);
    setUser(u);
    localStorage.setItem('safeEats_token', t);
    localStorage.setItem('safeEats_user', JSON.stringify(u));
  };

  const login = async (email: string, password: string) => {
    const res = await api.post<{ accessToken: string; user: User }>('/auth/login', {
      email,
      password,
    });
    saveAuth(res.accessToken, res.user);
  };

  const signup = async (email: string, password: string) => {
    const res = await api.post<{ accessToken: string; user: User }>('/auth/signup', {
      email,
      password,
    });
    saveAuth(res.accessToken, res.user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('safeEats_token');
    localStorage.removeItem('safeEats_user');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
