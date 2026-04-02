import React, { useState } from 'react';
import { Cross, User, Lock, Eye, EyeOff, Loader2, UserPlus, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) { setError('Preencha todos os campos'); return; }
    setIsLoading(true); setError('');
    let result;
    if (mode === 'login') {
      result = await login(username.trim(), password);
    } else {
      if (!displayName.trim()) { setError('Informe seu nome'); setIsLoading(false); return; }
      result = await register(username.trim(), password, displayName.trim());
    }
    if (result.error) setError(result.error);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-[#5A5A40] rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[#5A5A40]/20">
            <Cross className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#1A1A1A]">Caminho da Santidade</h1>
          <p className="text-[#1A1A1A]/50 italic mt-2">"Sede santos como Eu sou santo."</p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-[#1A1A1A]/5">
          {/* Tabs */}
          <div className="flex bg-[#F5F2ED] p-1 rounded-2xl mb-8">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${mode === 'login' ? 'bg-white text-[#5A5A40] shadow-md' : 'text-[#1A1A1A]/40 hover:text-[#1A1A1A]/60'}`}>
              <LogIn className="w-4 h-4" /> Entrar
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${mode === 'register' ? 'bg-white text-[#5A5A40] shadow-md' : 'text-[#1A1A1A]/40 hover:text-[#1A1A1A]/60'}`}>
              <UserPlus className="w-4 h-4" /> Criar Conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display name (register only) */}
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <label className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] ml-2 mb-1 block">Seu Nome</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/30" />
                    <input
                      type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                      placeholder="Como deseja ser chamado(a)"
                      className="w-full pl-11 pr-4 py-4 bg-[#F5F2ED] rounded-2xl border-none focus:ring-2 focus:ring-[#5A5A40]/30 text-sm"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] ml-2 mb-1 block">Usuário</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/30" />
                <input
                  type="text" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="Nome de usuário"
                  className="w-full pl-11 pr-4 py-4 bg-[#F5F2ED] rounded-2xl border-none focus:ring-2 focus:ring-[#5A5A40]/30 text-sm"
                  autoCapitalize="none" autoCorrect="off"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] ml-2 mb-1 block">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/30" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Mínimo 4 caracteres' : 'Sua senha'}
                  className="w-full pl-11 pr-12 py-4 bg-[#F5F2ED] rounded-2xl border-none focus:ring-2 focus:ring-[#5A5A40]/30 text-sm"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]/30 hover:text-[#1A1A1A]/60">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-center font-medium">
                {error}
              </motion.div>
            )}

            <button type="submit" disabled={isLoading}
              className="w-full py-4 bg-[#5A5A40] text-white rounded-2xl font-bold text-base shadow-lg shadow-[#5A5A40]/20 hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2">
              {isLoading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Aguarde...</>
                : mode === 'login' ? <><LogIn className="w-5 h-5" /> Entrar</> : <><UserPlus className="w-5 h-5" /> Criar Conta</>
              }
            </button>
          </form>

          {mode === 'login' && (
            <p className="text-center text-xs text-[#1A1A1A]/30 mt-6">
              Conta padrão: <strong>admin</strong> / <strong>admin123</strong>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
