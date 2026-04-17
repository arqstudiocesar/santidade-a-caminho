import React, { useState, useEffect } from 'react';
import { Book, ChevronLeft, ChevronRight, Search, BookOpen, Layers, X, Loader2, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { groqService } from '../services/groqService';
import { getVerseCount } from '../data/verseCounts';

const books = [
  { id: 'gn', name: 'Gênesis', chapters: 50, group: 'Pentateuco' },
  { id: 'ex', name: 'Êxodo', chapters: 40, group: 'Pentateuco' },
  { id: 'lv', name: 'Levítico', chapters: 27, group: 'Pentateuco' },
  { id: 'nm', name: 'Números', chapters: 36, group: 'Pentateuco' },
  { id: 'dt', name: 'Deuteronômio', chapters: 34, group: 'Pentateuco' },
  { id: 'js', name: 'Josué', chapters: 24, group: 'Históricos' },
  { id: 'jz', name: 'Juízes', chapters: 21, group: 'Históricos' },
  { id: 'rt', name: 'Rute', chapters: 4, group: 'Históricos' },
  { id: '1sm', name: '1 Samuel', chapters: 31, group: 'Históricos' },
  { id: '2sm', name: '2 Samuel', chapters: 24, group: 'Históricos' },
  { id: '1rs', name: '1 Reis', chapters: 22, group: 'Históricos' },
  { id: '2rs', name: '2 Reis', chapters: 25, group: 'Históricos' },
  { id: '1cr', name: '1 Crônicas', chapters: 29, group: 'Históricos' },
  { id: '2cr', name: '2 Crônicas', chapters: 36, group: 'Históricos' },
  { id: 'ed', name: 'Esdras', chapters: 10, group: 'Históricos' },
  { id: 'ne', name: 'Neemias', chapters: 13, group: 'Históricos' },
  { id: 'tb', name: 'Tobias', chapters: 14, group: 'Históricos' },
  { id: 'jdt', name: 'Judite', chapters: 16, group: 'Históricos' },
  { id: 'est', name: 'Ester', chapters: 10, group: 'Históricos' },
  { id: '1mc', name: '1 Macabeus', chapters: 16, group: 'Históricos' },
  { id: '2mc', name: '2 Macabeus', chapters: 15, group: 'Históricos' },
  { id: 'jo', name: 'Jó', chapters: 42, group: 'Sapienciais' },
  { id: 'sl', name: 'Salmos', chapters: 150, group: 'Sapienciais' },
  { id: 'pv', name: 'Provérbios', chapters: 31, group: 'Sapienciais' },
  { id: 'ec', name: 'Eclesiastes', chapters: 12, group: 'Sapienciais' },
  { id: 'ct', name: 'Cântico dos Cânticos', chapters: 8, group: 'Sapienciais' },
  { id: 'sb', name: 'Sabedoria', chapters: 19, group: 'Sapienciais' },
  { id: 'sir', name: 'Eclesiástico', chapters: 51, group: 'Sapienciais' },
  { id: 'is', name: 'Isaías', chapters: 66, group: 'Proféticos' },
  { id: 'jr', name: 'Jeremias', chapters: 52, group: 'Proféticos' },
  { id: 'lm', name: 'Lamentações', chapters: 5, group: 'Proféticos' },
  { id: 'ba', name: 'Baruc', chapters: 6, group: 'Proféticos' },
  { id: 'ez', name: 'Ezequiel', chapters: 48, group: 'Proféticos' },
  { id: 'dn', name: 'Daniel', chapters: 14, group: 'Proféticos' },
  { id: 'os', name: 'Oseias', chapters: 14, group: 'Proféticos' },
  { id: 'jl', name: 'Joel', chapters: 4, group: 'Proféticos' },
  { id: 'am', name: 'Amós', chapters: 9, group: 'Proféticos' },
  { id: 'ab', name: 'Abdias', chapters: 1, group: 'Proféticos' },
  { id: 'jon', name: 'Jonas', chapters: 4, group: 'Proféticos' },
  { id: 'mi', name: 'Miqueias', chapters: 7, group: 'Proféticos' },
  { id: 'na', name: 'Naum', chapters: 3, group: 'Proféticos' },
  { id: 'hab', name: 'Habacuc', chapters: 3, group: 'Proféticos' },
  { id: 'sf', name: 'Sofonias', chapters: 3, group: 'Proféticos' },
  { id: 'ag', name: 'Ageu', chapters: 2, group: 'Proféticos' },
  { id: 'zc', name: 'Zacarias', chapters: 14, group: 'Proféticos' },
  { id: 'ml', name: 'Malaquias', chapters: 3, group: 'Proféticos' },
  { id: 'mt', name: 'Mateus', chapters: 28, group: 'Evangelhos' },
  { id: 'mc', name: 'Marcos', chapters: 16, group: 'Evangelhos' },
  { id: 'lc', name: 'Lucas', chapters: 24, group: 'Evangelhos' },
  { id: 'joao', name: 'João', chapters: 21, group: 'Evangelhos' },
  { id: 'at', name: 'Atos', chapters: 28, group: 'N. Testamento' },
  { id: 'rm', name: 'Romanos', chapters: 16, group: 'Cartas' },
  { id: '1co', name: '1 Coríntios', chapters: 16, group: 'Cartas' },
  { id: '2co', name: '2 Coríntios', chapters: 13, group: 'Cartas' },
  { id: 'gl', name: 'Gálatas', chapters: 6, group: 'Cartas' },
  { id: 'ef', name: 'Efésios', chapters: 6, group: 'Cartas' },
  { id: 'fp', name: 'Filipenses', chapters: 4, group: 'Cartas' },
  { id: 'cl', name: 'Colossenses', chapters: 4, group: 'Cartas' },
  { id: '1ts', name: '1 Tessalonicenses', chapters: 5, group: 'Cartas' },
  { id: '2ts', name: '2 Tessalonicenses', chapters: 3, group: 'Cartas' },
  { id: '1tm', name: '1 Timóteo', chapters: 6, group: 'Cartas' },
  { id: '2tm', name: '2 Timóteo', chapters: 6, group: 'Cartas' },
  { id: 'tt', name: 'Tito', chapters: 3, group: 'Cartas' },
  { id: 'fm', name: 'Filémon', chapters: 1, group: 'Cartas' },
  { id: 'heb', name: 'Hebreus', chapters: 13, group: 'Cartas' },
  { id: 'tg', name: 'Tiago', chapters: 5, group: 'Cartas' },
  { id: '1pe', name: '1 Pedro', chapters: 5, group: 'Cartas' },
  { id: '2pe', name: '2 Pedro', chapters: 3, group: 'Cartas' },
  { id: '1jo', name: '1 João', chapters: 5, group: 'Cartas' },
  { id: '2jo', name: '2 João', chapters: 1, group: 'Cartas' },
  { id: '3jo', name: '3 João', chapters: 1, group: 'Cartas' },
  { id: 'jd', name: 'Judas', chapters: 1, group: 'Cartas' },
  { id: 'ap', name: 'Apocalipse', chapters: 22, group: 'N. Testamento' },
];

const translations = [
  { id: 'jerusalem', name: 'Bíblia de Jerusalém' },
  { id: 'ave-maria', name: 'Bíblia Ave Maria' },
  { id: 'cnbb', name: 'Bíblia CNBB' },
  { id: 'bltt', name: 'Bíblia Literal do Texto Tradicional' },
  { id: 'arc', name: 'Bíblia Almeida Revisada Corrigida - (Protestante)' },
  { id: 'nvi', name: 'Nova Versão Internacional - (Protestante)' },
];

const GROUPS = ['Pentateuco','Históricos','Sapienciais','Proféticos','Evangelhos','Cartas','N. Testamento'];

export default function BibleReader() {
  const [selectedBook, setSelectedBook] = useState(books[46]);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [startVerse, setStartVerse] = useState(1);
  const [endVerse, setEndVerse] = useState(10);
  const [startVerseInput, setStartVerseInput] = useState('1');
  const [endVerseInput, setEndVerseInput] = useState('10');
  const [maxVerses, setMaxVerses] = useState(25);
  const [selectedTranslation, setSelectedTranslation] = useState(translations[0]);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonTranslation, setComparisonTranslation] = useState(translations[4]);
  const [isBookListOpen, setIsBookListOpen] = useState(false);
  const [bookFilter, setBookFilter] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string|null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [verses, setVerses] = useState<{num:number;text:string}[]>([]);
  const [compVerses, setCompVerses] = useState<{num:number;text:string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Atualiza limite de versículos via tabela estática (zero chamadas de API!)
  useEffect(() => {
    const count = getVerseCount(selectedBook.name, selectedChapter);
    setMaxVerses(count);
    setEndVerse(v => {
      const clamped = Math.min(v, count);
      setEndVerseInput(String(clamped));
      return clamped;
    });
    setStartVerse(v => {
      const clamped = Math.min(v, count);
      setStartVerseInput(String(clamped));
      return clamped;
    });
  }, [selectedBook, selectedChapter]);

  // Carrega versículos principais
  useEffect(() => {
    const t = setTimeout(fetchVerses, 700);
    return () => clearTimeout(t);
  }, [selectedBook, selectedChapter, selectedTranslation, startVerse, endVerse]);

  // Carrega comparação
  useEffect(() => {
    if (!isComparing) return;
    const t = setTimeout(fetchCompVerses, 900);
    return () => clearTimeout(t);
  }, [selectedBook, selectedChapter, comparisonTranslation, isComparing, startVerse, endVerse]);

  async function fetchVerses() {
    setIsLoading(true);
    try {
      const d = await groqService.getBibleVerses(selectedBook.name, selectedChapter, selectedTranslation.name, startVerse, endVerse);
      setVerses(d.verses || []);
    } catch(e){ console.error(e); }
    finally { setIsLoading(false); }
  }

  async function fetchCompVerses() {
    const d = await groqService.getBibleVerses(selectedBook.name, selectedChapter, comparisonTranslation.name, startVerse, endVerse);
    setCompVerses(d.verses || []);
  }

  function nextChapter() {
    if (selectedChapter < selectedBook.chapters) setSelectedChapter(c => c+1);
    else {
      const idx = books.findIndex(b => b.id === selectedBook.id);
      if (idx < books.length-1) { setSelectedBook(books[idx+1]); setSelectedChapter(1); }
    }
  }

  function prevChapter() {
    if (selectedChapter > 1) setSelectedChapter(c => c-1);
    else {
      const idx = books.findIndex(b => b.id === selectedBook.id);
      if (idx > 0) { const p = books[idx-1]; setSelectedBook(p); setSelectedChapter(p.chapters); }
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const d = await groqService.searchBible(searchQuery);
      setSearchResults(d.results || []);
    } catch(e){ console.error(e); }
    finally { setIsSearching(false); }
  }

  function openResult(r: any) {
    const book = books.find(b => b.name === r.book || b.name.includes(r.book));
    if (book) {
      setSelectedBook(book);
      setSelectedChapter(r.chapter);
      const vc = getVerseCount(book.name, r.chapter);
      const sv = Math.max(1, r.verse-2);
      const ev = Math.min(vc, r.verse+5);
      setStartVerse(sv); setStartVerseInput(String(sv));
      setEndVerse(ev);   setEndVerseInput(String(ev));
    }
    setShowSearch(false);
  }

  function handleCopy() {
    const text = verses.map(v=>`${v.num}. ${v.text}`).join('\n');
    navigator.clipboard.writeText(`${selectedBook.name} ${selectedChapter}:${startVerse}-${endVerse} (${selectedTranslation.name})\n\n${text}`);
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  }

  const filteredBooks = books.filter(b => {
    const fm = b.name.toLowerCase().includes(bookFilter.toLowerCase());
    const gm = !selectedGroup || b.group === selectedGroup;
    return fm && gm;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Bíblia Sagrada</h2>
          <p className="text-[#1A1A1A]/50 italic text-sm mt-1">
            {selectedBook.name} {selectedChapter}:{startVerse}–{endVerse} · {selectedTranslation.name}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={()=>setShowSearch(!showSearch)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all ${showSearch?'bg-[#5A5A40] text-white':'bg-white border border-[#1A1A1A]/10 hover:bg-[#F5F2ED]'}`}>
            <Search className="w-4 h-4"/> Buscar
          </button>
          <button onClick={()=>setIsComparing(!isComparing)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all ${isComparing?'bg-[#5A5A40] text-white':'bg-white border border-[#1A1A1A]/10 hover:bg-[#F5F2ED]'}`}>
            <Layers className="w-4 h-4"/> Comparar
          </button>
        </div>
      </header>

      {/* Busca */}
      <AnimatePresence>
        {showSearch && (
          <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}
            className="bg-white p-6 rounded-[2rem] border border-[#1A1A1A]/5 shadow-sm space-y-4">
            <form onSubmit={handleSearch} className="flex gap-3">
              <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
                placeholder="Buscar palavra, tema, referência… (ex: João 3:16, amor, paz)"
                className="flex-1 px-5 py-3 bg-[#F5F2ED] rounded-2xl text-sm focus:ring-2 focus:ring-[#5A5A40] border-none outline-none"/>
              <button type="submit" disabled={isSearching}
                className="px-6 py-3 bg-[#5A5A40] text-white rounded-2xl font-bold disabled:opacity-50 flex items-center gap-2 hover:scale-105 transition-all">
                {isSearching?<Loader2 className="w-4 h-4 animate-spin"/>:<Search className="w-4 h-4"/>}
                {isSearching?'…':'Buscar'}
              </button>
            </form>
            {searchResults.length>0 && (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                <p className="text-xs text-[#1A1A1A]/40 uppercase tracking-widest font-bold">{searchResults.length} resultado(s) — clique para abrir</p>
                {searchResults.map((r,i)=>(
                  <button key={i} onClick={()=>openResult(r)}
                    className="w-full text-left p-4 bg-[#F5F2ED] hover:bg-[#E6E6A0]/50 rounded-2xl transition-colors">
                    <p className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider mb-1">{r.reference}</p>
                    <p className="text-sm italic text-[#1A1A1A]/80 line-clamp-2">"{r.text}"</p>
                  </button>
                ))}
              </div>
            )}
            {searchResults.length===0&&searchQuery&&!isSearching&&(
              <p className="text-center text-sm text-[#1A1A1A]/40 italic py-4">Nenhum resultado encontrado.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controles */}
      <div className="bg-white p-5 sm:p-6 rounded-[2rem] border border-[#1A1A1A]/5 shadow-sm space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Livro */}
          <div className="col-span-2 sm:col-span-1">
            <label className="text-[10px] uppercase tracking-widest font-bold text-[#1A1A1A]/40 ml-1 block mb-1">Livro</label>
            <button onClick={()=>setIsBookListOpen(!isBookListOpen)}
              className="w-full px-4 py-3 bg-[#F5F2ED] rounded-2xl text-sm font-medium text-left flex items-center justify-between hover:bg-[#E8E5E0] transition-colors">
              <span className="truncate">{selectedBook.name}</span>
              <BookOpen className="w-4 h-4 text-[#5A5A40] flex-shrink-0 ml-1"/>
            </button>
          </div>
          {/* Capítulo */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-[#1A1A1A]/40 ml-1 block mb-1">Capítulo</label>
            <select value={selectedChapter} onChange={e=>setSelectedChapter(parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-[#F5F2ED] rounded-2xl text-sm border-none focus:ring-2 focus:ring-[#5A5A40]">
              {Array.from({length:selectedBook.chapters},(_,i)=>(
                <option key={i+1} value={i+1}>{i+1}</option>
              ))}
            </select>
          </div>
          {/* Versículo Inicial */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-[#1A1A1A]/40 ml-1 block mb-1">Vers. Inicial</label>
            <input
              type="number" min={1} max={maxVerses}
              value={startVerseInput}
              onChange={e => setStartVerseInput(e.target.value)}
              onBlur={() => {
                const v = Math.min(Math.max(1, parseInt(startVerseInput) || 1), maxVerses);
                setStartVerse(v);
                setStartVerseInput(String(v));
                if (endVerse < v) { setEndVerse(v); setEndVerseInput(String(v)); }
              }}
              className="w-full px-4 py-3 bg-[#F5F2ED] rounded-2xl text-sm border-none focus:ring-2 focus:ring-[#5A5A40]"/>
          </div>
          {/* Versículo Final */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-[#1A1A1A]/40 ml-1 block mb-1">
              Vers. Final <span className="text-[#5A5A40]">(máx. {maxVerses})</span>
            </label>
            <input
              type="number" min={startVerse} max={maxVerses}
              value={endVerseInput}
              onChange={e => setEndVerseInput(e.target.value)}
              onBlur={() => {
                const v = Math.min(Math.max(startVerse, parseInt(endVerseInput) || startVerse), maxVerses);
                setEndVerse(v);
                setEndVerseInput(String(v));
              }}
              className="w-full px-4 py-3 bg-[#F5F2ED] rounded-2xl text-sm border-none focus:ring-2 focus:ring-[#5A5A40]"/>
          </div>
        </div>

        {/* Traduções */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-[10px] uppercase tracking-widest font-bold text-[#1A1A1A]/40 ml-1 block mb-1">Tradução Principal</label>
            <select value={selectedTranslation.id} onChange={e=>setSelectedTranslation(translations.find(t=>t.id===e.target.value)!)}
              className="w-full px-4 py-3 bg-[#F5F2ED] rounded-2xl text-sm border-none focus:ring-2 focus:ring-[#5A5A40]">
              {translations.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          {isComparing && (
            <div className="flex-1">
              <label className="text-[10px] uppercase tracking-widest font-bold text-[#5A5A40]/60 ml-1 block mb-1">Comparar Com</label>
              <select value={comparisonTranslation.id} onChange={e=>setComparisonTranslation(translations.find(t=>t.id===e.target.value)!)}
                className="w-full px-4 py-3 bg-[#F5F2ED] rounded-2xl text-sm border-none focus:ring-2 focus:ring-[#5A5A40]">
                {translations.filter(t=>t.id!==selectedTranslation.id).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Lista de Livros */}
      <AnimatePresence>
        {isBookListOpen && (
          <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}
            className="bg-white p-6 rounded-[2rem] border border-[#1A1A1A]/5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Selecionar Livro</h3>
              <button onClick={()=>setIsBookListOpen(false)} className="p-2 hover:bg-[#F5F2ED] rounded-xl"><X className="w-4 h-4"/></button>
            </div>
            <input placeholder="Filtrar livro..." value={bookFilter} onChange={e=>setBookFilter(e.target.value)}
              className="w-full px-4 py-2 bg-[#F5F2ED] rounded-2xl text-sm mb-4 border-none focus:ring-2 focus:ring-[#5A5A40] outline-none"/>
            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={()=>setSelectedGroup(null)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${!selectedGroup?'bg-[#5A5A40] text-white':'bg-[#F5F2ED] text-[#5A5A40] hover:bg-[#E6E6A0]/50'}`}>
                Todos
              </button>
              {GROUPS.map(g=>(
                <button key={g} onClick={()=>setSelectedGroup(g===selectedGroup?null:g)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${selectedGroup===g?'bg-[#5A5A40] text-white':'bg-[#F5F2ED] text-[#5A5A40] hover:bg-[#E6E6A0]/50'}`}>
                  {g}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-72 overflow-y-auto pr-1">
              {filteredBooks.map(b=>(
                <button key={b.id}
                  onClick={()=>{setSelectedBook(b);setSelectedChapter(1);setIsBookListOpen(false);setBookFilter('');}}
                  className={`p-3 rounded-2xl text-xs font-medium text-left transition-all hover:scale-[1.02] ${selectedBook.id===b.id?'bg-[#5A5A40] text-white shadow-md':'bg-[#F5F2ED] hover:bg-[#E6E6A0]/50'}`}>
                  {b.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navegação */}
      <div className="flex items-center justify-between">
        <button onClick={prevChapter}
          className="flex items-center gap-2 px-5 py-3 bg-white border border-[#1A1A1A]/10 rounded-2xl font-bold text-sm hover:bg-[#F5F2ED] transition-colors">
          <ChevronLeft className="w-4 h-4"/> Anterior
        </button>
        <div className="text-center">
          <p className="font-bold">{selectedBook.name} {selectedChapter}</p>
          <p className="text-xs text-[#1A1A1A]/40">Cap. {selectedChapter} / {selectedBook.chapters}</p>
        </div>
        <button onClick={nextChapter}
          className="flex items-center gap-2 px-5 py-3 bg-white border border-[#1A1A1A]/10 rounded-2xl font-bold text-sm hover:bg-[#F5F2ED] transition-colors">
          Próximo <ChevronRight className="w-4 h-4"/>
        </button>
      </div>

      {/* Versículos */}
      <div className={`grid gap-6 ${isComparing?'lg:grid-cols-2':''}`}>
        {/* Tradução principal */}
        <div className="bg-white rounded-[2rem] border border-[#1A1A1A]/5 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A]/5">
            <div>
              <p className="font-bold text-sm">{selectedTranslation.name}</p>
              <p className="text-xs text-[#1A1A1A]/40">{selectedBook.name} {selectedChapter}:{startVerse}–{endVerse}</p>
            </div>
            <button onClick={handleCopy} className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-[#5A5A40] hover:bg-[#F5F2ED] rounded-xl transition-colors">
              {copied?<><Check className="w-3 h-3"/> Copiado!</>:<><Copy className="w-3 h-3"/> Copiar</>}
            </button>
          </div>
          <div className="p-6 sm:p-10 min-h-[280px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#5A5A40]"/>
                <p className="text-sm text-[#1A1A1A]/40 italic">Carregando versículos…</p>
              </div>
            ) : verses.length>0 ? (
              <div className="space-y-5">
                {verses.map(v=>(
                  <p key={v.num} className="text-xl leading-relaxed font-serif">
                    <sup className="text-xs font-bold text-[#5A5A40] mr-2 font-sans not-italic">{v.num}</sup>
                    {v.text}
                  </p>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <BookOpen className="w-10 h-10 text-[#5A5A40]/30"/>
                <p className="text-sm text-[#1A1A1A]/40 italic">Selecione um livro e capítulo para carregar os versículos.</p>
              </div>
            )}
          </div>
        </div>

        {/* Comparação */}
        {isComparing && (
          <div className="bg-white rounded-[2rem] border-2 border-[#5A5A40]/20 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1A1A1A]/5 bg-[#5A5A40]/5">
              <p className="font-bold text-sm text-[#5A5A40]">{comparisonTranslation.name}</p>
              <p className="text-xs text-[#1A1A1A]/40">{selectedBook.name} {selectedChapter}:{startVerse}–{endVerse}</p>
            </div>
            <div className="p-6 sm:p-10 min-h-[280px]">
              {compVerses.length>0 ? (
                <div className="space-y-5">
                  {compVerses.map(v=>(
                    <p key={v.num} className="text-xl leading-relaxed font-serif">
                      <sup className="text-xs font-bold text-[#5A5A40] mr-2 font-sans not-italic">{v.num}</sup>
                      {v.text}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#5A5A40]"/>
                  <p className="text-sm text-[#1A1A1A]/40 italic">Carregando tradução comparada…</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
