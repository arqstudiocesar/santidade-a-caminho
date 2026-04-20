import React, { useState, useEffect, useRef } from 'react';
import {
  PenTool, Plus, Search, Calendar, Trash2, Save, X,
  ChevronRight, ChevronDown, CheckSquare, Square,
  FileDown, FileText, Loader2
} from 'lucide-react';
import { JournalEntry } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../contexts/AuthContext';
import { jsPDF } from 'jspdf';
import { cacheGet, cacheSet } from '../utils/cache';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface JournalEntryWithTitle extends JournalEntry {
  title?: string;
}

// ── Constantes ────────────────────────────────────────────────────────────────
const typeLabels: Record<string, string> = {
  free: 'Livre',
  gratitude: 'Gratidão',
  petition: 'Petição',
  repentance: 'Arrependimento',
  lectio: 'Lectio Divina',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── PDF: exportar registro único ──────────────────────────────────────────────
function exportSinglePDF(entry: JournalEntryWithTitle) {
  const doc = new jsPDF();
  const margin = 20;
  let y = margin;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('Diário Espiritual', margin, y);
  y += 10;

  doc.setDrawColor(90, 90, 64);
  doc.setLineWidth(0.5);
  doc.line(margin, y, 190, y);
  y += 10;

  const title = entry.title?.trim() || '(sem título)';
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(title, 170);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 8 + 4;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(110, 110, 80);
  doc.text(`Tipo: ${typeLabels[entry.type] || entry.type}`, margin, y);
  y += 6;
  doc.text(`Data: ${formatDate(entry.created_at)}`, margin, y);
  y += 10;

  doc.setDrawColor(200, 200, 190);
  doc.setLineWidth(0.3);
  doc.line(margin, y, 190, y);
  y += 8;

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const contentLines = doc.splitTextToSize(entry.content, 170);
  contentLines.forEach((line: string) => {
    if (y > 270) { doc.addPage(); y = margin; }
    doc.text(line, margin, y);
    y += 6;
  });

  const safeName = title.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 40);
  doc.save(`Diario_${safeName}.pdf`);
}

// ── PDF: exportar múltiplos registros ─────────────────────────────────────────
function exportMultiplePDF(entriesToExport: JournalEntryWithTitle[]) {
  const doc = new jsPDF();
  const margin = 20;
  let y = margin;

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('Diário Espiritual', margin, y);
  y += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 80);
  doc.text(`${entriesToExport.length} registro(s) — ${new Date().toLocaleDateString('pt-BR')}`, margin, y);
  y += 8;
  doc.setDrawColor(90, 90, 64);
  doc.setLineWidth(0.5);
  doc.line(margin, y, 190, y);
  y += 14;

  entriesToExport.forEach((entry, idx) => {
    if (idx > 0) { doc.addPage(); y = margin; }

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    const title = entry.title?.trim() || '(sem título)';
    const titleLines = doc.splitTextToSize(`${idx + 1}. ${title}`, 170);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 7 + 3;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(110, 110, 80);
    doc.text(`${typeLabels[entry.type] || entry.type}  •  ${formatDate(entry.created_at)}`, margin, y);
    y += 7;

    doc.setDrawColor(210, 210, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, y, 190, y);
    y += 6;

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(entry.content, 170);
    lines.forEach((line: string) => {
      if (y > 272) { doc.addPage(); y = margin; }
      doc.text(line, margin, y);
      y += 5.5;
    });
  });

  doc.save(`Diario_Espiritual_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ── Componente Principal ──────────────────────────────────────────────────────
export default function SpiritualJournal() {
  const [entries, setEntries] = useState<JournalEntryWithTitle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntryWithTitle | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [type, setType] = useState('free');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [collapsedTypes, setCollapsedTypes] = useState<Record<string, boolean>>({});
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isClearingAll, setIsClearingAll] = useState(false);

  // Controla se já fizemos o carregamento inicial (para distinguir
  // "servidor vazio por cold start" de "servidor vazio porque usuário apagou tudo")
  const initialLoadDone = useRef(false);

  // ── Carregar registros ──────────────────────────────────────────────────────
  // Estratégia de persistência:
  //   1. Busca do servidor (fonte de verdade quando disponível)
  //   2. Se o servidor retornar vazio NO PRIMEIRO carregamento → usa cache local
  //      (isso protege contra cold starts do Vercel que apagam o /tmp)
  //   3. Se o servidor retornar vazio após uma mutação → o usuário realmente
  //      apagou tudo → limpa o cache também
  useEffect(() => { fetchEntries(); }, []);

  const fetchEntries = () => {
    setIsLoading(true);
    apiFetch('/api/journal')
      .then(res => res.json())
      .then((data: JournalEntryWithTitle[]) => {
        const serverData = Array.isArray(data) ? data : [];

        if (serverData.length > 0) {
          // Servidor tem dados → usa e atualiza cache
          setEntries(serverData);
          cacheSet<JournalEntryWithTitle[]>('journal', serverData);
        } else if (!initialLoadDone.current) {
          // Servidor vazio no primeiro carregamento → possível cold start
          // Tenta restaurar do cache local
          const cached = cacheGet<JournalEntryWithTitle[]>('journal', []);
          setEntries(cached);
          // Não reenviar ao servidor aqui: o usuário pode criar novos
          // e o cache será atualizado normalmente
        } else {
          // Servidor vazio após mutação = usuário realmente apagou tudo
          setEntries([]);
          cacheSet<JournalEntryWithTitle[]>('journal', []);
        }
      })
      .catch(() => {
        // Erro de rede → usa cache
        if (!initialLoadDone.current) {
          const cached = cacheGet<JournalEntryWithTitle[]>('journal', []);
          setEntries(cached);
        }
      })
      .finally(() => {
        initialLoadDone.current = true;
        setIsLoading(false);
      });
  };

  // ── Salvar / Editar ────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    const payload = { title: newTitle.trim(), content: newContent.trim(), type };
    if (editingEntry) {
      await apiFetch(`/api/journal/${editingEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await apiFetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    setNewTitle(''); setNewContent(''); setType('free');
    setIsAdding(false); setEditingEntry(null);
    fetchEntries(); // fetchEntries atualiza o cache automaticamente
  };

  // ── Excluir ────────────────────────────────────────────────────────────────
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
    // Limpa cache explicitamente para que o "servidor vazio" não seja
    // confundido com cold start no próximo carregamento
    cacheSet<JournalEntryWithTitle[]>('journal', []);
    setIsClearingAll(false);
    fetchEntries();
  };

  // ── Editar ────────────────────────────────────────────────────────────────
  const handleEdit = (entry: JournalEntryWithTitle) => {
    setEditingEntry(entry);
    setNewTitle(entry.title || '');
    setNewContent(entry.content);
    setType(entry.type);
    setIsAdding(true);
  };

  // ── Colapsar grupos ────────────────────────────────────────────────────────
  const toggleTypeCollapse = (t: string) => {
    setCollapsedTypes(prev => ({ ...prev, [t]: !prev[t] }));
  };
  const toggleAllCollapse = (collapse: boolean) => {
    const next: Record<string, boolean> = {};
    Object.keys(typeLabels).forEach(t => { next[t] = collapse; });
    setCollapsedTypes(next);
  };
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // ── Filtrar + Buscar ──────────────────────────────────────────────────────
  const q = searchTerm.toLowerCase().trim();
  const filteredEntries = entries
    .filter(e => filterType === 'all' || e.type === filterType)
    .filter(e => {
      if (!q) return true;
      return (e.title || '').toLowerCase().includes(q) || e.content.toLowerCase().includes(q);
    });

  const groupedEntries = filteredEntries.reduce((acc: Record<string, JournalEntryWithTitle[]>, entry) => {
    const t = entry.type || 'free';
    if (!acc[t]) acc[t] = [];
    acc[t].push(entry);
    return acc;
  }, {});

  Object.keys(groupedEntries).forEach(t => {
    groupedEntries[t].sort((a, b) => {
      const dateDiff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (dateDiff !== 0) return dateDiff;
      return (a.title || '').localeCompare(b.title || '', 'pt');
    });
  });

  // ── Exportar PDF dos selecionados ─────────────────────────────────────────
  const handleExportSelected = () => {
    const toExport = entries.filter(e => selectedIds.includes(e.id));
    if (toExport.length === 1) exportSinglePDF(toExport[0]);
    else if (toExport.length > 1) exportMultiplePDF(toExport);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Diário Espiritual</h2>
          <p className="text-[#1A1A1A]/60 italic">"Examina-me, ó Deus, e conhece o meu coração."</p>
        </div>
        <button
          onClick={() => {
            setIsAdding(true); setEditingEntry(null);
            setNewTitle(''); setNewContent(''); setType('free');
          }}
          className="flex items-center gap-2 px-6 py-3 bg-[#5A5A40] text-white rounded-full font-bold shadow-lg shadow-[#5A5A40]/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-5 h-5" /> Novo Registro
        </button>
      </header>

      {/* Formulário novo/editar */}
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
              <button onClick={() => { setIsAdding(false); setEditingEntry(null); }}
                className="p-2 hover:bg-[#F5F2ED] rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Tipo */}
              <div className="flex flex-wrap gap-2">
                {Object.keys(typeLabels).map((t) => (
                  <button key={t} type="button" onClick={() => setType(t)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${type === t ? 'bg-[#5A5A40] text-white shadow-md' : 'bg-[#F5F2ED] text-[#1A1A1A]/60 hover:bg-[#5A5A40]/10'}`}>
                    {typeLabels[t]}
                  </button>
                ))}
              </div>

              {/* Título */}
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-1 block">Título</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ex: Reflexão sobre a misericórdia..."
                  className="w-full px-4 py-3 bg-[#F5F2ED] rounded-2xl border-none focus:ring-2 focus:ring-[#5A5A40]/20 text-sm"
                />
              </div>

              {/* Conteúdo */}
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-1 block">Registro</label>
                <textarea
                  autoFocus
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="Escreva aqui sua oração, reflexão ou gratidão..."
                  className="w-full h-44 p-5 bg-[#F5F2ED] rounded-3xl border-none focus:ring-2 focus:ring-[#5A5A40]/20 resize-none font-serif text-base leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button type="button"
                  onClick={() => { setIsAdding(false); setEditingEntry(null); }}
                  className="px-8 py-3 rounded-2xl font-bold text-[#1A1A1A]/60 hover:bg-[#F5F2ED] transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={!newContent.trim()}
                  className="px-8 py-3 bg-[#5A5A40] text-white rounded-2xl font-bold shadow-lg shadow-[#5A5A40]/20 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-40">
                  <Save className="w-4 h-4" />
                  {editingEntry ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Seção de registros */}
      <section className="space-y-6">

        {/* Linha 1: título "Registros" + campo de busca */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h3 className="text-xl font-bold shrink-0">Registros</h3>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/30" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por título ou conteúdo..."
              className="w-full pl-9 pr-8 py-2.5 bg-white border border-[#1A1A1A]/8 rounded-2xl text-sm focus:ring-2 focus:ring-[#5A5A40]/20 focus:outline-none"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#1A1A1A]/30 hover:text-[#1A1A1A]/60">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Linha 2: controles */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-[#F5F2ED] p-1 rounded-xl">
            <button onClick={() => toggleAllCollapse(false)}
              className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#5A5A40] hover:bg-white rounded-lg transition-all">
              Expandir Tudo
            </button>
            <button onClick={() => toggleAllCollapse(true)}
              className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#5A5A40] hover:bg-white rounded-lg transition-all">
              Recolher Tudo
            </button>
          </div>

          <button
            onClick={() => { setSelectMode(!selectMode); setSelectedIds([]); }}
            className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${selectMode ? 'bg-[#5A5A40] text-white' : 'bg-[#F5F2ED] text-[#5A5A40] hover:bg-[#5A5A40]/10'}`}>
            {selectMode ? 'Cancelar' : 'Selecionar'}
          </button>

          {selectMode && selectedIds.length > 0 && (
            <>
              <button onClick={handleDeleteSelected}
                className="px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 transition-all">
                Apagar ({selectedIds.length})
              </button>
              <button onClick={handleExportSelected}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-[#5A5A40]/10 text-[#5A5A40] hover:bg-[#5A5A40]/20 transition-all">
                <FileDown className="w-3.5 h-3.5" /> PDF ({selectedIds.length})
              </button>
            </>
          )}

          <button onClick={() => setIsClearingAll(true)}
            className="px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-50 transition-all">
            Apagar Tudo
          </button>

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="ml-auto bg-white border border-[#1A1A1A]/8 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#5A5A40]/20 font-medium text-[#1A1A1A]/70"
          >
            <option value="all">Todos os tipos</option>
            {Object.entries(typeLabels).map(([t, label]) => (
              <option key={t} value={t}>{label}</option>
            ))}
          </select>
        </div>

        {/* Feedback de busca */}
        {q && !isLoading && (
          <p className="text-xs text-[#1A1A1A]/40 italic">
            {filteredEntries.length === 0
              ? `Nenhum resultado para "${searchTerm}".`
              : `${filteredEntries.length} resultado(s) para "${searchTerm}".`}
          </p>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#5A5A40]/40" />
          </div>
        )}

        {/* Grupos de registros */}
        {!isLoading && (
          <div className="space-y-10">
            {Object.keys(groupedEntries).map((t) => (
              <div key={t} className="space-y-4">
                {/* Cabeçalho do grupo */}
                <button
                  onClick={() => toggleTypeCollapse(t)}
                  className="w-full flex items-center gap-4 group"
                >
                  <div className="h-px flex-1 bg-[#1A1A1A]/5" />
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-[#F5F2ED] rounded-full group-hover:bg-[#5A5A40]/10 transition-colors">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5A5A40]">
                      {typeLabels[t] || t} ({groupedEntries[t].length})
                    </span>
                    {collapsedTypes[t]
                      ? <ChevronRight className="w-3 h-3 text-[#5A5A40]" />
                      : <ChevronDown className="w-3 h-3 text-[#5A5A40]" />}
                  </div>
                  <div className="h-px flex-1 bg-[#1A1A1A]/5" />
                </button>

                <AnimatePresence>
                  {!collapsedTypes[t] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="grid gap-4 py-1">
                        {groupedEntries[t].map((entry) => (
                          <motion.div
                            key={entry.id}
                            layout
                            className="bg-white p-7 rounded-[2rem] border border-[#1A1A1A]/5 shadow-sm hover:shadow-md transition-all group"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                {selectMode && (
                                  <button onClick={() => toggleSelect(entry.id)} className="mt-0.5 shrink-0">
                                    {selectedIds.includes(entry.id)
                                      ? <CheckSquare className="w-5 h-5 text-[#5A5A40]" />
                                      : <Square className="w-5 h-5 text-[#1A1A1A]/30" />}
                                  </button>
                                )}
                                <div className="min-w-0">
                                  {entry.title?.trim() && (
                                    <p className="font-bold text-base text-[#1A1A1A] mb-1 leading-snug">{entry.title}</p>
                                  )}
                                  <div className="flex items-center gap-2 text-[#1A1A1A]/40 text-xs font-sans">
                                    <Calendar className="w-3 h-3 shrink-0" />
                                    {formatDate(entry.created_at)}
                                  </div>
                                </div>
                              </div>

                              {!selectMode && (
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                                  <button
                                    onClick={() => exportSinglePDF(entry)}
                                    title="Exportar PDF"
                                    className="p-2 hover:bg-[#F5F2ED] rounded-full text-[#5A5A40]/60 transition-colors"
                                  >
                                    <FileText className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleEdit(entry)}
                                    className="p-2 hover:bg-[#F5F2ED] rounded-full text-[#5A5A40] transition-colors"
                                  >
                                    <PenTool className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteId(entry.id)}
                                    className="p-2 hover:bg-red-50 rounded-full text-red-500 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>

                            <p className="text-[#1A1A1A]/80 leading-relaxed font-serif whitespace-pre-wrap text-sm">
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

            {/* Estado vazio */}
            {Object.keys(groupedEntries).length === 0 && (
              <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-[#1A1A1A]/10">
                <div className="w-16 h-16 bg-[#F5F2ED] rounded-full flex items-center justify-center mx-auto mb-4">
                  <PenTool className="w-8 h-8 text-[#1A1A1A]/20" />
                </div>
                <p className="text-[#1A1A1A]/40 font-serif italic">
                  {q ? `Nenhum registro encontrado para "${searchTerm}".` : 'Nenhum registro encontrado.'}
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Modal: Apagar Tudo */}
      <AnimatePresence>
        {isClearingAll && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsClearingAll(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-8 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Apagar Todos os Registros?</h3>
              <p className="text-[#1A1A1A]/60 text-sm mb-8">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button onClick={() => setIsClearingAll(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-[#1A1A1A]/40 hover:bg-[#F5F2ED] transition-all">
                  Cancelar
                </button>
                <button onClick={handleClearAll}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:scale-105 transition-all">
                  Apagar Tudo
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal: Excluir registro individual */}
        {deleteId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteId(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-8 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Excluir Registro?</h3>
              <p className="text-[#1A1A1A]/60 text-sm mb-8">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)}
                  className="flex-1 py-3 rounded-xl font-bold text-[#1A1A1A]/40 hover:bg-[#F5F2ED] transition-all">
                  Cancelar
                </button>
                <button onClick={() => handleDelete(deleteId)}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 hover:scale-105 transition-all">
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
