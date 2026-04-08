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

// ── Limpa o token do localStorage ─────────────────────────────────────────────
function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* noop */ }
}

// ── Recupera o token do localStorage ─────────────────────────────────────────
function getSavedToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

// ── Salva o token no localStorage ─────────────────────────────────────────────
function saveToken(token: string) {
  try { localStorage.setItem(TOKEN_KEY, token); } catch { /* noop */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Ao iniciar: verifica se há token salvo e se ainda é válido ─────────────
  useEffect(() => {
    const saved = getSavedToken();
    if (!saved) {
      setIsLoading(false);
      return;
    }
    // Tenta validar o token com o servidor
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${saved}` },
    })
      .then(r => {
        if (!r.ok) {
          // Token inválido (ex: servidor reiniciou no Vercel e apagou o banco)
          // Limpa tudo e força novo login
          clearToken();
          return null;
        }
        return r.json();
      })
      .then(data => {
        if (data?.id) {
          setUser(data);
          setToken(saved);
        } else {
          clearToken();
        }
      })
      .catch(() => {
        // Erro de rede — mantém o token por ora, tentará na próxima requisição
        clearToken();
      })
      .finally(() => setIsLoading(false));
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async (username: string, password: string) => {
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await r.json();
      if (!r.ok) return { error: data.error || 'Usuário ou senha incorretos' };
      saveToken(data.token);
      setToken(data.token);
      setUser(data.user);
      return {};
    } catch {
      return { error: 'Erro de conexão. Verifique sua internet.' };
    }
  };

  // ── Registro ───────────────────────────────────────────────────────────────
  const register = async (username: string, password: string, display_name: string) => {
    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, display_name }),
      });
      const data = await r.json();
      if (!r.ok) return { error: data.error || 'Erro ao criar conta' };
      saveToken(data.token);
      setToken(data.token);
      setUser(data.user);
      return {};
    } catch {
      return { error: 'Erro de conexão. Verifique sua internet.' };
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = () => {
    const t = token;
    setUser(null);
    setToken(null);
    clearToken();
    if (t) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}` },
      }).catch(() => { /* silencioso */ });
    }
  };

  // ── Atualizar perfil ───────────────────────────────────────────────────────
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

// ── apiFetch: helper para chamadas autenticadas ────────────────────────────────
// Inclui o token automaticamente em todas as requisições ao backend.
// Se receber 401, limpa o token e recarrega a página para forçar novo login.
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const savedToken = getSavedToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (savedToken) headers['Authorization'] = `Bearer ${savedToken}`;

  const response = await fetch(path, { ...options, headers });

  // Se o servidor retornou 401, o token expirou ou o banco foi reiniciado no Vercel
  // Limpa o token e recarrega a página para ir para a tela de login
  if (response.status === 401) {
    clearToken();
    // Pequeno delay para não causar loop imediato
    setTimeout(() => window.location.reload(), 100);
  }

  return response;
}
