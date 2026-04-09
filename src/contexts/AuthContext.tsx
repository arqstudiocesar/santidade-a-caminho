import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  display_name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<{ error?: string }>;
  register: (username: string, password: string, display_name: string) => Promise<{ error?: string }>;
  logout: () => void;
  updateProfile: (display_name: string, password?: string, newPassword?: string) => Promise<{ error?: string }>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);
const TOKEN_KEY = 'caminho_auth_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (!saved) {
      setIsLoading(false);
      return;
    }

    // Verificar se o token ainda é válido no servidor
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${saved}` } })
      .then(async r => {
        if (r.ok) {
          // Token válido — carregar usuário
          const data = await r.json();
          if (data?.id) {
            setUser(data);
            setToken(saved);
          } else {
            localStorage.removeItem(TOKEN_KEY);
          }
        } else if (r.status === 401) {
          // Token inválido (banco reiniciado no Vercel) — remover token salvo
          // O usuário precisará logar novamente
          localStorage.removeItem(TOKEN_KEY);
        }
      })
      .catch(() => {
        // Erro de rede: manter token salvo e tentar depois
        // Neste caso, deixamos o usuário na tela de login
        localStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await r.json();
      if (!r.ok) return { error: data.error || 'Erro ao entrar' };
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      return {};
    } catch {
      return { error: 'Erro de conexão. Verifique sua internet.' };
    }
  };

  const register = async (username: string, password: string, display_name: string) => {
    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, display_name }),
      });
      const data = await r.json();
      if (!r.ok) return { error: data.error || 'Erro ao criar conta' };
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      return {};
    } catch {
      return { error: 'Erro de conexão. Verifique sua internet.' };
    }
  };

  const logout = () => {
    const t = token;
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    if (t) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}` },
      }).catch(() => { /* silencioso */ });
    }
  };

  const updateProfile = async (display_name: string, password?: string, newPassword?: string) => {
    try {
      const r = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ display_name, password, new_password: newPassword }),
      });
      const data = await r.json();
      if (!r.ok) return { error: data.error || 'Erro ao atualizar' };
      setUser(data.user);
      return {};
    } catch {
      return { error: 'Erro de conexão.' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateProfile, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

// Helper para fazer fetch autenticado em qualquer componente
export function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(path, { ...options, headers });
}
