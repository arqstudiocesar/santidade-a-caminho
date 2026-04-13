/**
 * AuthContext.tsx — versão híbrida (API + recuperação automática de cold-start)
 * Usa 'caminho_session' como chave — compatível com ConfessionGuide.tsx
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User { id: number; username: string; display_name: string; }
interface AuthContextType {
  user: User | null; token: string | null;
  login: (username: string, password: string) => Promise<{ error?: string }>;
  register: (username: string, password: string, display_name: string) => Promise<{ error?: string }>;
  logout: () => void;
  updateProfile: (display_name: string, password?: string, newPassword?: string) => Promise<{ error?: string }>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);
const SESSION_KEY = 'caminho_session';
const CREDS_KEY   = 'caminho_creds';

function saveSession(user: User, token: string) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ user, token }));
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(CREDS_KEY);
}
function saveCreds(u: string, p: string, d: string) {
  try { localStorage.setItem(CREDS_KEY, btoa(JSON.stringify({ u, p, d }))); } catch {}
}
function loadCreds(): { u: string; p: string; d: string } | null {
  try { const raw = localStorage.getItem(CREDS_KEY); return raw ? JSON.parse(atob(raw)) : null; } catch { return null; }
}

async function tryAutoRecover(): Promise<{ user: User; token: string } | null> {
  const creds = loadCreds();
  if (!creds) return null;
  try {
    const r1 = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: creds.u, password: creds.p }) });
    if (r1.ok) { const d = await r1.json(); return { user: d.user, token: d.token }; }
    const r2 = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: creds.u, password: creds.p, display_name: creds.d || creds.u }) });
    if (r2.ok) { const d = await r2.json(); return { user: d.user, token: d.token }; }
  } catch {}
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]   = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return;
        const session = JSON.parse(raw);
        const tok: string = session?.token;
        if (!tok) { clearSession(); return; }
        const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${tok}` } });
        if (res.ok) {
          const u: User = await res.json();
          setUser(u); setToken(tok); saveSession(u, tok);
        } else if (res.status === 401) {
          const recovered = await tryAutoRecover();
          if (recovered) { setUser(recovered.user); setToken(recovered.token); saveSession(recovered.user, recovered.token); }
          else clearSession();
        }
      } catch { /* erro de rede — mantém sessão */ }
      finally { setIsLoading(false); }
    })();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username.trim(), password }) });
      const data = await r.json();
      if (!r.ok) return { error: data.error || 'Usuário ou senha incorretos.' };
      saveSession(data.user, data.token);
      saveCreds(username.trim(), password, data.user?.display_name || username.trim());
      setToken(data.token); setUser(data.user);
      return {};
    } catch { return { error: 'Erro de conexão. Verifique sua internet.' }; }
  };

  const register = async (username: string, password: string, display_name: string) => {
    try {
      const r = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username.trim(), password, display_name: display_name.trim() }) });
      const data = await r.json();
      if (!r.ok) return { error: data.error || 'Erro ao criar conta.' };
      saveSession(data.user, data.token);
      saveCreds(username.trim(), password, display_name.trim());
      setToken(data.token); setUser(data.user);
      return {};
    } catch { return { error: 'Erro de conexão. Verifique sua internet.' }; }
  };

  const logout = () => {
    const t = token;
    setUser(null); setToken(null); clearSession();
    if (t) fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${t}` } }).catch(() => {});
  };

  const updateProfile = async (display_name: string, password?: string, newPassword?: string) => {
    try {
      const r = await fetch('/api/auth/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ display_name, password, new_password: newPassword }) });
      const data = await r.json();
      if (!r.ok) return { error: data.error || 'Erro ao atualizar.' };
      setUser(data.user);
      if (token) saveSession(data.user, token);
      try { const c = loadCreds(); if (c) { c.d = display_name; if (newPassword) c.p = newPassword; localStorage.setItem(CREDS_KEY, btoa(JSON.stringify(c))); } } catch {}
      return {};
    } catch { return { error: 'Erro de conexão.' }; }
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

export function apiFetch(path: string, options: RequestInit = {}) {
  let tok = '';
  try { const raw = localStorage.getItem(SESSION_KEY); if (raw) tok = JSON.parse(raw)?.token || ''; } catch {}
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string> || {}) };
  if (tok) headers['Authorization'] = `Bearer ${tok}`;
  return fetch(path, { ...options, headers });
}
