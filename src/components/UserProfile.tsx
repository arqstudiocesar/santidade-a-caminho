import React, { useState } from 'react';
import { User, Save, Lock, Eye, EyeOff, CheckCircle2, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

interface Props { onClose: () => void; }

export default function UserProfile({ onClose }: Props) {
  const { user, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) { setError('O nome não pode estar vazio'); return; }
    if (newPwd && !currentPwd) { setError('Informe a senha atual para alterá-la'); return; }
    if (newPwd && newPwd.length < 4) { setError('Nova senha deve ter ao menos 4 caracteres'); return; }
    setIsLoading(true); setError('');
    const result = await updateProfile(displayName.trim(), currentPwd || undefined, newPwd || undefined);
    if (result.error) { setError(result.error); }
    else { setSaved(true); setCurrentPwd(''); setNewPwd(''); setTimeout(() => setSaved(false), 3000); }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#5A5A40] rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Meu Perfil</h3>
              <p className="text-xs text-[#5A5A40] font-sans uppercase tracking-widest">@{user?.username}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#F5F2ED] rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] ml-1 mb-1 block">Seu Nome</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/30" />
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                placeholder="Como deseja ser chamado(a)"
                className="w-full pl-11 pr-4 py-3.5 bg-[#F5F2ED] rounded-2xl border-none focus:ring-2 focus:ring-[#5A5A40]/30 text-sm" />
            </div>
          </div>

          <div className="pt-4 border-t border-[#1A1A1A]/5">
            <p className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-4">Alterar Senha (opcional)</p>
            <div className="space-y-3">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/30" />
                <input type={showCurrentPwd ? 'text' : 'password'} value={currentPwd} onChange={e => setCurrentPwd(e.target.value)}
                  placeholder="Senha atual"
                  className="w-full pl-11 pr-10 py-3.5 bg-[#F5F2ED] rounded-2xl border-none focus:ring-2 focus:ring-[#5A5A40]/30 text-sm" />
                <button type="button" onClick={() => setShowCurrentPwd(!showCurrentPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/30">
                  {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/30" />
                <input type={showNewPwd ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)}
                  placeholder="Nova senha"
                  className="w-full pl-11 pr-10 py-3.5 bg-[#F5F2ED] rounded-2xl border-none focus:ring-2 focus:ring-[#5A5A40]/30 text-sm" />
                <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/30">
                  {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 text-center bg-red-50 p-3 rounded-xl">{error}</p>}
          {saved && (
            <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 p-3 rounded-xl">
              <CheckCircle2 className="w-4 h-4" /> Perfil atualizado!
            </div>
          )}

          <button type="submit" disabled={isLoading}
            className="w-full py-4 bg-[#5A5A40] text-white rounded-2xl font-bold hover:scale-[1.02] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
