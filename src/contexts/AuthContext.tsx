/**
 * AuthContext.tsx — versão 100% localStorage (sem banco de dados, sem API)
 *
 * Funciona perfeitamente no Vercel + GitHub sem nenhum servidor externo.
 * Os usuários ficam salvos no navegador de cada dispositivo.
 * O token é simulado localmente para compatibilidade com o resto do código.
 */

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

// Chaves no localStorage
const SESSION_KEY = 'caminho_session';       // usuário logado atualmente
const USERS_KEY   = 'caminho_users_db';      // banco de usuários

// ---------- helpers internos ----------

interface StoredUser {
  id: number;
  username: string;
  display_name: string;
  password: string;
}

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const list: StoredUser[] = raw ? JSON.parse(raw) : [];

    // Garante que o usuário admin sempre existe
    if (!list.find(u => u.username === 'admin')) {
      list.push({ id: 1, username: 'admin', display_name: 'Administrador', password: 'admin123' });
      localStorage.setItem(USERS_KEY, JSON.stringify(list));
    }
    return list;
  } catch {
    return [{ id: 1, username: 'admin', display_name: 'Administrador', password: 'admin123' }];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function generateId(users: StoredUser[]): number {
  return users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
}

// ---------- Provider ----------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [token, setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Na inicialização, recupera sessão salva
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const session: { user: User; token: string } = JSON.parse(raw);
        // Verifica se o usuário ainda existe no banco local
        const users = loadUsers();
        const found = users.find(u => u.id === session.user.id);
        if (found) {
          setUser({ id: found.id, username: found.username, display_name: found.display_name });
          setToken(session.token);
        } else {
          // Usuário removido — limpa sessão
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<{ error?: string }> => {
    const users = loadUsers();
    const found = users.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );
    if (!found) {
      return { error: 'Usuário ou senha incorretos.' };
    }
    const loggedUser: User = { id: found.id, username: found.username, display_name: found.display_name };
    const fakeToken = btoa(`${found.id}:${Date.now()}`);
    setUser(loggedUser);
    setToken(fakeToken);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user: loggedUser, token: fakeToken }));
    return {};
  };

  const register = async (username: string, password: string, display_name: string): Promise<{ error?: string }> => {
    if (username.trim().length < 3) return { error: 'O usuário deve ter ao menos 3 caracteres.' };
    if (password.length < 4)        return { error: 'A senha deve ter ao menos 4 caracteres.' };
    if (!display_name.trim())       return { error: 'Informe seu nome.' };

    const users = loadUsers();
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { error: 'Este nome de usuário já está em uso.' };
    }
    const newUser: StoredUser = {
      id: generateId(users),
      username: username.trim(),
      display_name: display_name.trim(),
      password,
    };
    users.push(newUser);
    saveUsers(users);

    const loggedUser: User = { id: newUser.id, username: newUser.username, display_name: newUser.display_name };
    const fakeToken = btoa(`${newUser.id}:${Date.now()}`);
    setUser(loggedUser);
    setToken(fakeToken);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user: loggedUser, token: fakeToken }));
    return {};
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const updateProfile = async (
    display_name: string,
    password?: string,
    newPassword?: string
  ): Promise<{ error?: string }> => {
    if (!user) return { error: 'Não autenticado.' };
    if (!display_name.trim()) return { error: 'O nome não pode estar vazio.' };

    const users = loadUsers();
    const idx   = users.findIndex(u => u.id === user.id);
    if (idx === -1) return { error: 'Usuário não encontrado.' };

    // Se quiser trocar senha, valida a atual
    if (newPassword) {
      if (!password) return { error: 'Informe a senha atual.' };
      if (users[idx].password !== password) return { error: 'Senha atual incorreta.' };
      if (newPassword.length < 4) return { error: 'Nova senha deve ter ao menos 4 caracteres.' };
      users[idx].password = newPassword;
    }

    users[idx].display_name = display_name.trim();
    saveUsers(users);

    const updatedUser: User = { id: users[idx].id, username: users[idx].username, display_name: users[idx].display_name };
    setUser(updatedUser);
    // Atualiza sessão salva
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user: updatedUser, token }));
    return {};
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

/**
 * apiFetch — mantida para compatibilidade com componentes que ainda a usam
 * (Dashboard, etc.). Continua enviando token no header caso haja APIs reais.
 * Componentes migrados para localStorage não precisam mais chamá-la.
 */
export function apiFetch(path: string, options: RequestInit = {}) {
  const session = localStorage.getItem('caminho_session');
  let tok = '';
  try { tok = session ? JSON.parse(session).token : ''; } catch {}
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (tok) headers['Authorization'] = `Bearer ${tok}`;
  return fetch(path, { ...options, headers });
}
