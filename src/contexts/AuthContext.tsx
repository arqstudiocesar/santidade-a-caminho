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
// Guarda credenciais cifradas para re-login automático em cold-starts do Vercel
const CREDS_KEY = 'caminho_creds';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (!saved) { setIsLoading(false); return; }

    // Tenta validar o token atual
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${saved}` } })
      .then(async r => {
        if (r.ok) {
          // Token válido — retorna dados do usuário diretamente
          return r.json();
        }

        if (r.status === 401) {
          // Token inválido (cold-start Vercel apagou o banco)
          // Tenta re-login automático com credenciais salvas
          const raw = localStorage.getItem(CREDS_KEY);
          if (raw) {
            try {
              const { u, p } = JSON.parse(atob(raw));
              const lr = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: u, password: p }),
              });
              if (lr.ok) {
                const ld = await lr.json();
                localStorage.setItem(TOKEN_KEY, ld.token);
                setToken(ld.token);
                return ld.user;
              }
            } catch { /* credenciais inválidas ou corrompidas */ }
          }
          // Re-login falhou — limpa sessão
          localStorage.removeItem(TOKEN_KEY);
        }
        return null;
      })
      .then(data => {
        if (data?.id) {
          setUser(data);
          const t = localStorage.getItem(TOKEN_KEY);
          if (t) setToken(t);
        }
      })
      .catch(() => {
        // Erro de rede — limpa token para forçar novo login
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
      // Salva credenciais cifradas para re-login automático em cold-starts
      try { localStorage.setItem(CREDS_KEY, btoa(JSON.stringify({ u: username, p: password }))); } catch {}
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
      try { localStorage.setItem(CREDS_KEY, btoa(JSON.stringify({ u: username, p: password }))); } catch {}
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
    localStorage.removeItem(CREDS_KEY);
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ display_name, password, new_password: newPassword }),
      });
      const data = await r.json();
      if (!r.ok) return { error: data.error || 'Erro ao atualizar' };
      // Atualiza credenciais salvas com novo nome de exibição (senha não muda aqui)
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
