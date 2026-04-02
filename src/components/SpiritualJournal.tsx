import React, { useState, useEffect } from 'react';
import { PenTool, Plus, Search, Calendar, Tag, Trash2, Save, X, ChevronRight, CheckSquare, Square } from 'lucide-react';
import { JournalEntry } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../contexts/AuthContext';

export default function SpiritualJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [newContent, setNewContent] = useState('');
  const [type, setType] = useState('free');
  const [filterType, setFilterType] = useState('all');

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [collapsedTypes, setCollapsedTypes] = useState<Record<string, boolean>>({});
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isClearingAll, setIsClearingAll] = useState(false);

  const toggleTypeCollapse = (type: string) => {
    setCollapsedTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const toggleAllCollapse = (collapse: boolean) => {
    const newCollapsed: Record<string, boolean> = {};
    Object.keys(typeLabels).forEach(t => {
      newCollapsed[t] = collapse;
    });
    setCollapsedTypes(newCollapsed);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = () => {
    apiFetch('/api/journal')
      .then(res => res.json())
      .then(setEntries);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    if (editingEntry) {
      await apiFetch(`/api/journal/${editingEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent, type })
      });
    } else {
      await apiFetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent, type })
      });
    }

    setNewContent('');
    setIsAdding(false);
    setEditingEntry(null);
    fetchEntries();
  };

  const handleDelete = async (id: number) => {
    await apiFetch(`/api/journal/${id}`, { method: 'DELETE' });
    setDeleteId(null);
    fetchEntries();
  };

  const handleDeleteSelected = async () => {
    for (const id of selectedIds) await apiFetch(`/api/journal/${id}`, { method: 'DELETE' });
    setSelectedIds([]); setSelectMode(false); fetchEntries();
  };

  const handleClearAll = async () => {
    await apiFetch('/api/journal', { method: 'DELETE' });
    setIsClearingAll(false); fetchEntries();
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setNewContent(entry.content);
    setType(entry.type);
    setIsAdding(true);
  };

  const typeLabels: Record<string, string> = {
    free: 'Livre',
    gratitude: 'Gratidão',
    petition: 'Petição',
    repentance: 'Arrependimento',
    lectio: 'Lectio Divina'
  };

  const filteredEntries = filterType === 'all' 
    ? entries 
    : entries.filter(e => e.type === filterType);

  const groupedEntries = filteredEntries.reduce((acc: Record<string, JournalEntry[]>, entry) => {
    const t = entry.type || 'free';
    if (!acc[t]) acc[t] = [];
    acc[t].push(entry);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Diário Espiritual</h2>
          <p className="text-[#1A1A1A]/60 italic">"Examina-me, ó Deus, e conhece o meu coração."</p>
        </div>
        <button 
          onClick={() => {
            setIsAdding(true);
            setEditingEntry(null);
            setNewContent('');
            setType('free');
          }}
          className="flex items-center gap-2 px-6 py-3 bg-[#5A5A40] text-white rounded-full font-bold shadow-lg shadow-[#5A5A40]/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-5 h-5" /> Novo Registro
        </button>
      </header>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 rounded-[2.5rem] border border-[#1A1A1A]/5 shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">{editingEntry ? 'Editar Registro' : 'Novo Registro'}</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-[#F5F2ED] rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {Object.keys(typeLabels).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      type === t 
                        ? 'bg-[#5A5A40] text-white shadow-md' 
                        : 'bg-[#F5F2ED] text-[#1A1A1A]/60 hover:bg-[#5A5A40]/10'
                    }`}
                  >
                    {typeLabels[t]}
                  </button>
                ))}
              </div>
              <textarea
                autoFocus
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Escreva aqui sua oração, reflexão ou gratidão..."
                className="w-full h-48 p-6 bg-[#F5F2ED] rounded-3xl border-none focus:ring-2 focus:ring-[#5A5A40]/20 resize-none font-serif text-lg leading-relaxed"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-8 py-3 rounded-2xl font-bold text-[#1A1A1A]/60 hover:bg-[#F5F2ED] transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-[#5A5A40] text-white rounded-2xl font-bold shadow-lg shadow-[#5A5A40]/20 hover:scale-105 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingEntry ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-bold">Registros</h3>
          <div className="flex items-center gap-4">
            <div className="flex bg-[#F5F2ED] p-1 rounded-xl">
              <button 
                onClick={() => toggleAllCollapse(false)}
                className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#5A5A40] hover:bg-white rounded-lg transition-all"
              >
                Expandir Tudo
              </button>
              <button 
                onClick={() => toggleAllCollapse(true)}
                className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#5A5A40] hover:bg-white rounded-lg transition-all"
              >
                Recolher Tudo
              </button>
            </div>
            <button
              onClick={() => { setSelectMode(!selectMode); setSelectedIds([]); }}
              className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${selectMode ? 'bg-[#5A5A40] text-white' : 'bg-[#F5F2ED] text-[#5A5A40] hover:bg-[#5A5A40]/10'}`}>
              {selectMode ? 'Cancelar' : 'Selecionar'}
            </button>
            {selectMode && selectedIds.length > 0 && (
              <button onClick={handleDeleteSelected}
                className="px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 transition-all">
                Apagar ({selectedIds.length})
              </button>
            )}
            <button onClick={() => setIsClearingAll(true)}
              className="px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-50 transition-all">
              Apagar Tudo
            </button>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-white border border-[#1A1A1A]/5 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#5A5A40]/20"
            >
              <option value="all">Todos os tipos</option>
              {Object.entries(typeLabels).map(([t, label]) => (
                <option key={t} value={t}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-12">
          {Object.keys(groupedEntries).map((t) => (
            <div key={t} className="space-y-6">
              <button 
                onClick={() => toggleTypeCollapse(t)}
                className="w-full flex items-center gap-4 group"
              >
                <div className="h-px flex-1 bg-[#1A1A1A]/5" />
                <div className="flex items-center gap-2 px-4 py-1 bg-[#F5F2ED] rounded-full group-hover:bg-[#5A5A40]/10 transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5A5A40]">
                    {typeLabels[t]} ({groupedEntries[t].length})
                  </span>
                  {collapsedTypes[t] ? <ChevronRight className="w-3 h-3 text-[#5A5A40]" /> : <X className="w-3 h-3 text-[#5A5A40] rotate-45" />}
                </div>
                <div className="h-px flex-1 bg-[#1A1A1A]/5" />
              </button>

              <AnimatePresence>
                {!collapsedTypes[t] && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid gap-6 py-2">
                      {groupedEntries[t].map((entry) => (
                        <motion.div
                          key={entry.id}
                          layout
                          className="bg-white p-8 rounded-[2rem] border border-[#1A1A1A]/5 shadow-sm hover:shadow-md transition-all group"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              {selectMode && (
                                <button onClick={() => toggleSelect(entry.id)}>
                                  {selectedIds.includes(entry.id)
                                    ? <CheckSquare className="w-5 h-5 text-[#5A5A40]" />
                                    : <Square className="w-5 h-5 text-[#1A1A1A]/30" />}
                                </button>
                              )}
                              <div className="flex items-center gap-3 text-[#1A1A1A]/40 text-xs font-sans">
                                <Calendar className="w-3 h-3" />
                                {new Date(entry.created_at).toLocaleDateString('pt-BR', {
                                  day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                              </div>
                            </div>
                            {!selectMode && (
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(entry)} className="p-2 hover:bg-[#F5F2ED] rounded-full text-[#5A5A40] transition-colors">
                                  <PenTool className="w-4 h-4" />
                                </button>
                                <button onClick={() => setDeleteId(entry.id)} className="p-2 hover:bg-red-50 rounded-full text-red-500 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="text-[#1A1A1A]/80 leading-relaxed font-serif whitespace-pre-wrap">
                            {entry.content}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {entries.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-[#1A1A1A]/10">
              <div className="w-16 h-16 bg-[#F5F2ED] rounded-full flex items-center justify-center mx-auto mb-4">
                <PenTool className="w-8 h-8 text-[#1A1A1A]/20" />
              </div>
              <p className="text-[#1A1A1A]/40 font-serif italic">Nenhum registro encontrado.</p>
            </div>
          )}
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isClearingAll && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsClearingAll(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-8 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-8 h-8 text-red-500" /></div>
              <h3 className="text-xl font-bold mb-2">Apagar Todos os Registros?</h3>
              <p className="text-[#1A1A1A]/60 text-sm mb-8">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button onClick={() => setIsClearingAll(false)} className="flex-1 py-3 rounded-xl font-bold text-[#1A1A1A]/40 hover:bg-[#F5F2ED] transition-all">Cancelar</button>
                <button onClick={handleClearAll} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:scale-105 transition-all">Apagar Tudo</button>
              </div>
            </motion.div>
          </div>
        )}

        {deleteId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteId(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Excluir Registro?</h3>
              <p className="text-[#1A1A1A]/60 text-sm mb-8">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-3 rounded-xl font-bold text-[#1A1A1A]/40 hover:bg-[#F5F2ED] transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => handleDelete(deleteId)}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 hover:scale-105 transition-all"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
