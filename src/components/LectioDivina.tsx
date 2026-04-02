import React, { useState, useEffect } from 'react';
import {
  BookOpen, Sparkles, ChevronRight, CheckCircle2, Save, Printer,
  X, ChevronDown, ChevronUp, Edit3, Trash2, CheckSquare, Square, Loader2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { groqService } from '../services/groqService';
import { apiFetch } from '../contexts/AuthContext';
import { getVerseCount } from '../data/verseCounts';
import { jsPDF } from 'jspdf';

const books = [
  { id: 'gn', name: 'Gênesis', chapters: 50 },
  { id: 'ex', name: 'Êxodo', chapters: 40 },
  { id: 'lv', name: 'Levítico', chapters: 27 },
  { id: 'nm', name: 'Números', chapters: 36 },
  { id: 'dt', name: 'Deuteronômio', chapters: 34 },
  { id: 'js', name: 'Josué', chapters: 24 },
  { id: 'jz', name: 'Juízes', chapters: 21 },
  { id: 'rt', name: 'Rute', chapters: 4 },
  { id: '1sm', name: '1 Samuel', chapters: 31 },
  { id: '2sm', name: '2 Samuel', chapters: 24 },
  { id: '1rs', name: '1 Reis', chapters: 22 },
  { id: '2rs', name: '2 Reis', chapters: 25 },
  { id: '1cr', name: '1 Crônicas', chapters: 29 },
  { id: '2cr', name: '2 Crônicas', chapters: 36 },
  { id: 'ed', name: 'Esdras', chapters: 10 },
  { id: 'ne', name: 'Neemias', chapters: 13 },
  { id: 'tb', name: 'Tobias', chapters: 14 },
  { id: 'jdt', name: 'Judite', chapters: 16 },
  { id: 'est', name: 'Ester', chapters: 10 },
  { id: '1mc', name: '1 Macabeus', chapters: 16 },
  { id: '2mc', name: '2 Macabeus', chapters: 15 },
  { id: 'jo', name: 'Jó', chapters: 42 },
  { id: 'sl', name: 'Salmos', chapters: 150 },
  { id: 'pv', name: 'Provérbios', chapters: 31 },
  { id: 'ec', name: 'Eclesiastes', chapters: 12 },
  { id: 'ct', name: 'Cântico dos Cânticos', chapters: 8 },
  { id: 'sb', name: 'Sabedoria', chapters: 19 },
  { id: 'sir', name: 'Eclesiástico', chapters: 51 },
  { id: 'is', name: 'Isaías', chapters: 66 },
  { id: 'jr', name: 'Jeremias', chapters: 52 },
  { id: 'lm', name: 'Lamentações', chapters: 5 },
  { id: 'ba', name: 'Baruc', chapters: 6 },
  { id: 'ez', name: 'Ezequiel', chapters: 48 },
  { id: 'dn', name: 'Daniel', chapters: 14 },
  { id: 'os', name: 'Oseias', chapters: 14 },
  { id: 'jl', name: 'Joel', chapters: 4 },
  { id: 'am', name: 'Amós', chapters: 9 },
  { id: 'ab', name: 'Abdias', chapters: 1 },
  { id: 'jon', name: 'Jonas', chapters: 4 },
  { id: 'mi', name: 'Miqueias', chapters: 7 },
  { id: 'na', name: 'Naum', chapters: 3 },
  { id: 'hab', name: 'Habacuc', chapters: 3 },
  { id: 'sf', name: 'Sofonias', chapters: 3 },
  { id: 'ag', name: 'Ageu', chapters: 2 },
  { id: 'zc', name: 'Zacarias', chapters: 14 },
  { id: 'ml', name: 'Malaquias', chapters: 3 },
  { id: 'mt', name: 'Mateus', chapters: 28 },
  { id: 'mc', name: 'Marcos', chapters: 16 },
  { id: 'lc', name: 'Lucas', chapters: 24 },
  { id: 'joao', name: 'João', chapters: 21 },
  { id: 'at', name: 'Atos', chapters: 28 },
  { id: 'rm', name: 'Romanos', chapters: 16 },
  { id: '1co', name: '1 Coríntios', chapters: 16 },
  { id: '2co', name: '2 Coríntios', chapters: 13 },
  { id: 'gl', name: 'Gálatas', chapters: 6 },
  { id: 'ef', name: 'Efésios', chapters: 6 },
  { id: 'fp', name: 'Filipenses', chapters: 4 },
  { id: 'cl', name: 'Colossenses', chapters: 4 },
  { id: '1ts', name: '1 Tessalonicenses', chapters: 5 },
  { id: '2ts', name: '2 Tessalonicenses', chapters: 3 },
  { id: '1tm', name: '1 Timóteo', chapters: 6 },
  { id: '2tm', name: '2 Timóteo', chapters: 6 },
  { id: 'tt', name: 'Tito', chapters: 3 },
  { id: 'fm', name: 'Filémon', chapters: 1 },
  { id: 'heb', name: 'Hebreus', chapters: 13 },
  { id: 'tg', name: 'Tiago', chapters: 5 },
  { id: '1pe', name: '1 Pedro', chapters: 5 },
  { id: '2pe', name: '2 Pedro', chapters: 3 },
  { id: '1jo', name: '1 João', chapters: 5 },
  { id: '2jo', name: '2 João', chapters: 1 },
  { id: '3jo', name: '3 João', chapters: 1 },
  { id: 'jd', name: 'Judas', chapters: 1 },
  { id: 'ap', name: 'Apocalipse', chapters: 22 },
];

const STEPS = [
  { id: 'leitura',      title: 'Lectio (Leitura)',         description: 'O que o texto diz em si?' },
  { id: 'meditacao',    title: 'Meditatio (Meditação)',    description: 'O que o texto diz para mim?' },
  { id: 'oracao',       title: 'Oratio (Oração)',          description: 'O que o texto me faz dizer a Deus?' },
  { id: 'contemplacao', title: 'Contemplatio (Contemplação)', description: 'O que Deus quer realizar em mim?' },
  { id: 'acao',         title: 'Actio (Ação)',             description: 'O que farei concretamente a partir de hoje?' },
];

type StepKey = 'leitura'|'meditacao'|'oracao'|'contemplacao'|'acao';

export default function LectioDivina() {
  const [activeTab, setActiveTab] = useState<'exegesis'|'guided'|'diy'|'history'>('guided');
  const [exegesis, setExegesis] = useState<string|null>(null);
  const [isLoadingExegesis, setIsLoadingExegesis] = useState(false);
  const [isGuided, setIsGuided] = useState(true);
  const [passage, setPassage] = useState('');
  const [selectedBook, setSelectedBook] = useState(books[46]);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [startVerse, setStartVerse] = useState(1);
  const [endVerse, setEndVerse] = useState(10);
  const [maxVerses, setMaxVerses] = useState(25);
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lectioData, setLectioData] = useState<Record<StepKey,string>|null>(null);
  const [userNotes, setUserNotes] = useState<Record<StepKey,string>>({ leitura:'', meditacao:'', oracao:'', contemplacao:'', acao:'' });
  const [isReadingCollapsed, setIsReadingCollapsed] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');

  // Atualiza max versículos via tabela estática — sem chamar API!
  useEffect(() => {
    const count = getVerseCount(selectedBook.name, selectedChapter);
    setMaxVerses(count);
    setEndVerse(v => Math.min(v, count));
    setStartVerse(v => Math.min(v, count));
  }, [selectedBook, selectedChapter]);

  useEffect(() => { fetchHistory(); }, []);

  async function fetchHistory() {
    try {
      const res = await apiFetch('/api/lectio-history');
      if (res.ok) setHistory(await res.json());
    } catch(e){ console.error(e); }
  }

  async function fetchExegesis() {
    setIsLoadingExegesis(true);
    setExegesis(null);
    try {
      const ref = `${selectedBook.name} ${selectedChapter},${startVerse}-${endVerse}`;
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'Você é exegeta bíblico católico, especialista em hermenêutica e teologia bíblica. Responda em português.' },
            { role: 'user', content: `Faça a exegese bíblica de ${ref} com orientação católica. Seja objetivo e claro. Inclua:
1. Localização no cânon bíblico (testamento, livro, seção)
2. Autor e datação provável
3. Contexto histórico-literário
4. Gênero literário
5. Estudo das palavras-chave em grego ou hebraico (pelo menos 3 termos com etimologia)
6. Contexto do que o texto trata
7. Mensagem principal
8. Provável intenção do autor
9. A quem foi dirigido
10. Perspectiva da Bíblia de Jerusalém e comentários católicos

Seja sintético e direto. Use parágrafos curtos.` }
          ],
          maxTokens: 2000,
        }),
      });
      const data = await res.json();
      if (data.text) setExegesis(data.text);
    } catch(e) { console.error(e); }
    finally { setIsLoadingExegesis(false); }
  }

    async function fetchBibleText(): Promise<string> {
    const data = await groqService.getBibleVerses(selectedBook.name, selectedChapter, 'Bíblia de Jerusalém', startVerse, endVerse);
    return data.verses.map((v:any)=>`${v.num}. ${v.text}`).join(' ');
  }

  async function startLectio() {
    setIsLoading(true);
    try {
      const text = passage.trim() || await fetchBibleText();
      if (!text) { alert('Não foi possível carregar o texto bíblico. Tente novamente.'); return; }
      setPassage(text);
      const data = await groqService.getLectioDivinaGuide(text);
      if (!data?.leitura) { alert('Não foi possível gerar o guia. Limite de IA atingido? Tente novamente em alguns instantes.'); return; }
      setLectioData(data);
      setUserNotes({ leitura:'', meditacao:'', oracao:'', contemplacao:'', acao:'' });
      setStep(0);
    } catch(e){ console.error(e); alert('Erro ao iniciar Lectio Divina.'); }
    finally { setIsLoading(false); }
  }

  async function startDIY() {
    setIsLoading(true);
    try {
      const text = passage.trim() || await fetchBibleText();
      setPassage(text);
      setLectioData({ leitura: text, meditacao:'', oracao:'', contemplacao:'', acao:'' });
      setUserNotes({ leitura:'', meditacao:'', oracao:'', contemplacao:'', acao:'' });
      setStep(0);
    } catch(e){ console.error(e); }
    finally { setIsLoading(false); }
  }

  async function handleSave() {
    if (!lectioData) return;
    setSaveStatus('saving');
    try {
      const body = {
        book: selectedBook.name,
        chapter: selectedChapter,
        start_verse: startVerse,
        end_verse: endVerse,
        content: lectioData.leitura || passage,
        meditation: userNotes.meditacao || lectioData.meditacao || '',
        prayer: userNotes.oracao || lectioData.oracao || '',
        contemplation: userNotes.contemplacao || lectioData.contemplacao || '',
        action: userNotes.acao || lectioData.acao || '',
        type: isGuided ? 'guided' : 'manual',
      };

      const res = await apiFetch('/api/lectio-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Falha ao salvar');

      // Salvar também no Diário
      const journalContent = `Lectio Divina: ${selectedBook.name} ${selectedChapter}:${startVerse}-${endVerse}\n\n` +
        STEPS.map(s => `${s.title}:\n${userNotes[s.id as StepKey] || lectioData[s.id as StepKey] || ''}`).join('\n\n');
      await apiFetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: journalContent, type: 'lectio' }),
      });

      await fetchHistory();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch(e){
      console.error(e);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }

  function handleExportPDF() {
    if (!lectioData) return;
    const doc = new jsPDF();
    const margin = 20; let y = margin;
    doc.setFontSize(22); doc.text('Lectio Divina', margin, y); y += 15;
    doc.setFontSize(14); doc.text(`${selectedBook.name} ${selectedChapter}:${startVerse}-${endVerse}`, margin, y); y += 10;
    doc.setFontSize(10); doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, margin, y); y += 15;
    STEPS.forEach(s => {
      const content = userNotes[s.id as StepKey] || lectioData?.[s.id as StepKey] || '';
      if (!content) return;
      doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.text(s.title, margin, y); y += 7;
      doc.setFont('helvetica','normal'); doc.setFontSize(10);
      const lines = doc.splitTextToSize(content, 170);
      doc.text(lines, margin, y); y += lines.length*5+10;
      if (y > 270) { doc.addPage(); y = margin; }
    });
    doc.save(`Lectio_${selectedBook.name}_${selectedChapter}.pdf`);
  }

  // Histórico: funções de exclusão
  async function deleteItem(id: number) {
    if (!confirm('Excluir este registro?')) return;
    await apiFetch(`/api/lectio-history/${id}`, { method: 'DELETE' });
    fetchHistory();
    setSelectedIds(ids => ids.filter(i => i !== id));
  }

  async function deleteSelected() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Excluir ${selectedIds.length} registros selecionados?`)) return;
    await apiFetch('/api/lectio-history/delete-multiple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds }),
    });
    fetchHistory(); setSelectedIds([]);
  }

  async function clearAll() {
    if (!confirm('Excluir TODO o histórico? Esta ação não pode ser desfeita.')) return;
    await apiFetch('/api/lectio-history', { method: 'DELETE' });
    fetchHistory(); setSelectedIds([]);
  }

  function toggleSelect(id: number) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i=>i!==id) : [...prev, id]);
  }

  function revisitar(item: any) {
    setLectioData({ leitura: item.content, meditacao: item.meditation, oracao: item.prayer, contemplacao: item.contemplation, acao: item.action });
    setUserNotes({ leitura: item.content, meditacao: item.meditation, oracao: item.prayer, contemplacao: item.contemplation, acao: item.action });
    setIsGuided(item.type==='guided');
    setActiveTab(item.type==='guided'?'guided':'diy');
    setStep(0);
  }

  function resetLectio() {
    setLectioData(null);
    setPassage('');
    setUserNotes({ leitura:'', meditacao:'', oracao:'', contemplacao:'', acao:'' });
    setStep(0);
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Lectio Divina</h2>
          <p className="text-[#1A1A1A]/60 italic text-sm">"A vossa palavra é lâmpada para os meus pés."</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-[#1A1A1A]/5 overflow-x-auto">
          {(['exegesis','guided','diy','history'] as const).map(tab => (
            <button key={tab}
              onClick={() => { setActiveTab(tab); setIsGuided(tab==='guided'); if(tab==='exegesis'){setLectioData(null);} }}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${activeTab===tab?'bg-[#5A5A40] text-white shadow-md':'text-[#1A1A1A]/40 hover:text-[#5A5A40]'}`}>
              {tab==='exegesis'?'Entendendo o Texto':tab==='guided'?'Guiada (IA)':tab==='diy'?'Faça Você Mesmo':'Histórico'}
            </button>
          ))}
        </div>
      </header>

      {/* ── HISTÓRICO ── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {history.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => setSelectedIds(selectedIds.length===history.length?[]:history.map(h=>h.id))}
                  className="text-xs font-bold text-[#5A5A40] hover:underline flex items-center gap-1">
                  {selectedIds.length===history.length?<Square className="w-3 h-3"/>:<CheckSquare className="w-3 h-3"/>}
                  {selectedIds.length===history.length?'Desmarcar Tudo':'Selecionar Tudo'}
                </button>
                {selectedIds.length > 0 && (
                  <button onClick={deleteSelected} className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1">
                    <Trash2 className="w-3 h-3"/> Excluir Selecionados ({selectedIds.length})
                  </button>
                )}
              </div>
              <button onClick={clearAll} className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1">
                <X className="w-3 h-3"/> Apagar Tudo
              </button>
            </div>
          )}

          {history.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-[#1A1A1A]/10">
              <p className="text-[#1A1A1A]/40 italic">Nenhuma Lectio Divina salva ainda.</p>
              <p className="text-xs text-[#1A1A1A]/30 mt-2">Conclua uma meditação e clique em "Salvar".</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div key={item.id}
                  className={`bg-white p-6 sm:p-8 rounded-[2.5rem] border transition-all group ${selectedIds.includes(item.id)?'border-[#5A5A40] shadow-md':'border-[#1A1A1A]/5 shadow-sm hover:shadow-md'}`}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-3 items-start min-w-0">
                      <button onClick={() => toggleSelect(item.id)} className="mt-1 text-[#5A5A40] flex-shrink-0">
                        {selectedIds.includes(item.id)?<CheckSquare className="w-5 h-5"/>:<Square className="w-5 h-5 opacity-20 group-hover:opacity-100 transition-opacity"/>}
                      </button>
                      <div className="min-w-0">
                        <h4 className="text-lg font-bold truncate">{item.book} {item.chapter}:{item.start_verse}-{item.end_verse}</h4>
                        <p className="text-xs text-[#1A1A1A]/40">{new Date(item.created_at).toLocaleDateString('pt-BR')} · {item.type==='guided'?'Guiada por IA':'Faça você mesmo'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => revisitar(item)}
                        className="px-3 py-2 bg-[#F5F2ED] text-[#5A5A40] rounded-xl text-xs font-bold hover:bg-[#5A5A40] hover:text-white transition-all">
                        Revisitar
                      </button>
                      <button onClick={() => deleteItem(item.id)}
                        className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all" title="Excluir">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                  </div>
                  {item.content && (
                    <p className="text-sm text-[#1A1A1A]/60 line-clamp-2 italic mt-3 ml-8">"{item.content}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ENTENDENDO O TEXTO ── */}
      {activeTab === 'exegesis' && (
        <div className="bg-white p-8 sm:p-12 rounded-[3rem] border border-[#1A1A1A]/5 shadow-sm">
          <div className="max-w-2xl mx-auto space-y-8">
            <div>
              <h3 className="text-2xl font-bold mb-1">Entendendo o Texto</h3>
              <p className="text-[#1A1A1A]/60 text-sm">Exegese bíblica com orientação católica — contexto, autor, palavras originais e mensagem principal.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[10px] uppercase tracking-widest font-bold text-[#1A1A1A]/40 ml-2 block mb-1">Livro</label>
                <select value={selectedBook.id} onChange={e=>setSelectedBook(books.find(b=>b.id===e.target.value)!)}
                  className="w-full p-3 bg-[#F5F2ED] border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#5A5A40]">
                  {books.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-[#1A1A1A]/40 ml-2 block mb-1">Capítulo</label>
                <select value={selectedChapter} onChange={e=>setSelectedChapter(parseInt(e.target.value))}
                  className="w-full p-3 bg-[#F5F2ED] border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#5A5A40]">
                  {Array.from({length:selectedBook.chapters},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-[#1A1A1A]/40 ml-2 block mb-1">Vers. Inicial</label>
                <input type="number" min={1} max={maxVerses} value={startVerse}
                  onChange={e=>{const v=Math.min(Math.max(1,parseInt(e.target.value)||1),maxVerses);setStartVerse(v);if(endVerse<v)setEndVerse(v);}}
                  className="w-full p-3 bg-[#F5F2ED] border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#5A5A40]"/>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-[#1A1A1A]/40 ml-2 block mb-1">Vers. Final <span className="text-[#5A5A40]">(máx. {maxVerses})</span></label>
                <input type="number" min={startVerse} max={maxVerses} value={endVerse}
                  onChange={e=>{const v=Math.min(Math.max(startVerse,parseInt(e.target.value)||startVerse),maxVerses);setEndVerse(v);}}
                  className="w-full p-3 bg-[#F5F2ED] border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#5A5A40]"/>
              </div>
            </div>
            <button onClick={fetchExegesis} disabled={isLoadingExegesis}
              className="w-full py-4 bg-[#5A5A40] text-white rounded-2xl font-bold shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {isLoadingExegesis ? <><span className="animate-spin">⟳</span> Analisando...</> : '🔍 Analisar Texto'}
            </button>
            {isLoadingExegesis && (
              <div className="py-12 flex flex-col items-center text-[#5A5A40]/40 space-y-3">
                <div className="w-10 h-10 border-2 border-[#5A5A40]/20 border-t-[#5A5A40] rounded-full animate-spin"/>
                <p className="italic font-serif text-sm">Consultando fontes exegéticas...</p>
              </div>
            )}
            {exegesis && !isLoadingExegesis && (
              <div className="bg-[#F5F2ED] p-8 rounded-[2rem] border border-[#5A5A40]/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-[#5A5A40]">
                    {selectedBook.name} {selectedChapter}:{startVerse}-{endVerse}
                  </div>
                </div>
                <div className="text-base leading-relaxed text-[#1A1A1A]/80 font-serif whitespace-pre-wrap">{exegesis}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SELEÇÃO INICIAL (sem lectioData) ── */}
      {activeTab !== 'history' && activeTab !== 'exegesis' && !lectioData && (
        <div className="bg-white p-8 sm:p-12 rounded-[3rem] border border-[#1A1A1A]/5 shadow-sm text-center">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="p-6 bg-[#F5F2ED] rounded-full w-24 h-24 mx-auto flex items-center justify-center text-[#5A5A40]">
              <BookOpen className="w-12 h-12"/>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Inicie sua Meditação</h3>
              <p className="text-[#1A1A1A]/60">Selecione uma passagem ou insira o texto manualmente.</p>
            </div>

            {/* Seleção de passagem */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[10px] uppercase tracking-widest font-bold text-[#1A1A1A]/40 ml-2 block mb-1">Livro</label>
                <select value={selectedBook.id} onChange={e=>setSelectedBook(books.find(b=>b.id===e.target.value)!)}
                  className="w-full p-3 bg-[#F5F2ED] border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#5A5A40]">
                  {books.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-[#1A1A1A]/40 ml-2 block mb-1">Capítulo</label>
                <select value={selectedChapter} onChange={e=>setSelectedChapter(parseInt(e.target.value))}
                  className="w-full p-3 bg-[#F5F2ED] border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#5A5A40]">
                  {Array.from({length:selectedBook.chapters},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-[#1A1A1A]/40 ml-2 block mb-1">Vers. Inicial</label>
                <input type="number" min={1} max={maxVerses} value={startVerse}
                  onChange={e=>{const v=Math.min(Math.max(1,parseInt(e.target.value)||1),maxVerses);setStartVerse(v);if(endVerse<v)setEndVerse(v);}}
                  className="w-full p-3 bg-[#F5F2ED] border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#5A5A40]"/>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-[#1A1A1A]/40 ml-2 block mb-1">
                  Vers. Final <span className="text-[#5A5A40]">(máx. {maxVerses})</span>
                </label>
                <input type="number" min={startVerse} max={maxVerses} value={endVerse}
                  onChange={e=>{const v=Math.min(Math.max(startVerse,parseInt(e.target.value)||startVerse),maxVerses);setEndVerse(v);}}
                  className="w-full p-3 bg-[#F5F2ED] border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#5A5A40]"/>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-[#1A1A1A]/5"/>
                <span className="text-[10px] uppercase tracking-widest font-bold text-[#1A1A1A]/20">Ou insira manualmente</span>
                <div className="h-px flex-1 bg-[#1A1A1A]/5"/>
              </div>
              <textarea value={passage} onChange={e=>setPassage(e.target.value)}
                placeholder="Cole aqui o texto bíblico se preferir…"
                className="w-full p-5 bg-[#F5F2ED] border-none rounded-3xl min-h-[100px] text-base placeholder:text-[#1A1A1A]/20 focus:ring-2 focus:ring-[#5A5A40] resize-none"/>
              <button onClick={activeTab==='guided'?startLectio:startDIY} disabled={isLoading}
                className="mt-4 w-full py-4 bg-[#5A5A40] text-white rounded-2xl font-bold shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {isLoading?<Loader2 className="w-5 h-5 animate-spin"/>:activeTab==='guided'?<Sparkles className="w-5 h-5"/>:<Edit3 className="w-5 h-5"/>}
                {isLoading?'Preparando…':`Começar ${activeTab==='guided'?'Guia da IA':'DIY'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MEDITAÇÃO ATIVA ── */}
      {activeTab !== 'history' && activeTab !== 'exegesis' && lectioData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar de passos */}
          <div className="lg:col-span-4 space-y-3">
            {STEPS.map((s, i) => (
              <button key={s.id} onClick={() => setStep(i)}
                className={`w-full p-5 rounded-[2rem] border text-left transition-all ${step===i?'bg-[#5A5A40] text-white border-[#5A5A40] shadow-xl scale-[1.02]':step>i?'bg-white border-[#5A5A40]/20 text-[#5A5A40]':'bg-white border-[#1A1A1A]/5 text-[#1A1A1A]/40'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-widest font-bold opacity-60">Passo {i+1}</span>
                  {step>i&&<CheckCircle2 className="w-4 h-4"/>}
                </div>
                <h4 className="font-bold">{s.title}</h4>
              </button>
            ))}

            {/* Botões Salvar/Imprimir */}
            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} disabled={saveStatus==='saving'}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold transition-all
                  ${saveStatus==='saved'?'bg-green-100 text-green-700 border border-green-200'
                    :saveStatus==='error'?'bg-red-100 text-red-700 border border-red-200'
                    :'bg-white border border-[#1A1A1A]/10 hover:bg-[#F5F2ED]'}`}>
                {saveStatus==='saving'?<Loader2 className="w-4 h-4 animate-spin"/>
                  :saveStatus==='saved'?<CheckCircle2 className="w-4 h-4"/>
                  :saveStatus==='error'?<AlertCircle className="w-4 h-4"/>
                  :<Save className="w-4 h-4"/>}
                {saveStatus==='saving'?'Salvando…':saveStatus==='saved'?'Salvo!':saveStatus==='error'?'Erro!':'Salvar'}
              </button>
              <button onClick={handleExportPDF}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-[#1A1A1A]/10 rounded-2xl text-xs font-bold hover:bg-[#F5F2ED] transition-all">
                <Printer className="w-4 h-4"/> PDF
              </button>
              <button onClick={resetLectio}
                className="p-3 bg-white border border-[#1A1A1A]/10 rounded-2xl text-xs font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all" title="Nova meditação">
                <X className="w-4 h-4"/>
              </button>
            </div>
          </div>

          {/* Conteúdo principal */}
          <div className="lg:col-span-8 space-y-5">
            {/* Texto da leitura colapsável */}
            <div className="bg-white rounded-[2rem] border border-[#1A1A1A]/5 shadow-sm overflow-hidden">
              <button onClick={()=>setIsReadingCollapsed(!isReadingCollapsed)}
                className="w-full p-5 flex items-center justify-between hover:bg-[#F5F2ED]/30 transition-colors">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-[#5A5A40]"/>
                  <h3 className="font-bold text-sm">Texto da Leitura</h3>
                </div>
                {isReadingCollapsed?<ChevronDown className="w-5 h-5"/>:<ChevronUp className="w-5 h-5"/>}
              </button>
              <AnimatePresence>
                {!isReadingCollapsed&&(
                  <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}>
                    <div className="px-6 pb-6 pt-2">
                      <p className="text-lg leading-relaxed italic text-[#1A1A1A]/80 font-serif">{lectioData.leitura}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Passo ativo */}
            <div className="bg-white p-6 sm:p-10 rounded-[3rem] border border-[#1A1A1A]/5 shadow-sm min-h-[380px] flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-[#F5F2ED] rounded-2xl text-[#5A5A40]"><Edit3 className="w-6 h-6"/></div>
                <div>
                  <h3 className="text-xl font-bold">{STEPS[step].title}</h3>
                  <p className="text-[#1A1A1A]/40 text-sm">{STEPS[step].description}</p>
                </div>
              </div>

              <div className="flex-1 space-y-5">
                {isGuided && lectioData[STEPS[step].id as StepKey] && (
                  <div className="p-6 bg-[#F5F2ED] rounded-3xl border border-[#5A5A40]/10">
                    <p className="text-base leading-relaxed text-[#5A5A40]">{lectioData[STEPS[step].id as StepKey]}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]/40 px-2 block mb-2">
                    {isGuided?'Suas Notas':'Escreva sua reflexão'}
                  </label>
                  <textarea
                    value={userNotes[STEPS[step].id as StepKey]}
                    onChange={e => setUserNotes({...userNotes, [STEPS[step].id]: e.target.value})}
                    placeholder="Escreva aqui suas reflexões…"
                    className="w-full p-6 bg-white border border-[#1A1A1A]/5 rounded-3xl min-h-[160px] text-base focus:ring-2 focus:ring-[#5A5A40] shadow-inner resize-none"/>
                </div>
              </div>

              <div className="mt-6 flex justify-between items-center">
                <button onClick={()=>setStep(Math.max(0,step-1))} disabled={step===0}
                  className="px-6 py-3 text-[#5A5A40] font-bold disabled:opacity-20 hover:underline">
                  Anterior
                </button>
                {step < STEPS.length-1 ? (
                  <button onClick={()=>setStep(step+1)}
                    className="px-8 py-3 bg-[#5A5A40] text-white rounded-2xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                    Próximo Passo <ChevronRight className="w-4 h-4"/>
                  </button>
                ) : (
                  <button onClick={handleSave} disabled={saveStatus==='saving'}
                    className="px-8 py-3 bg-[#5A5A40] text-white rounded-2xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50">
                    {saveStatus==='saving'?<Loader2 className="w-4 h-4 animate-spin"/>:<CheckCircle2 className="w-4 h-4"/>}
                    {saveStatus==='saving'?'Salvando…':'Finalizar & Salvar'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
