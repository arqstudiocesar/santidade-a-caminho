import React, { useState } from 'react';
import { Search, BookOpen, ExternalLink, Loader2, X, Hash, ChevronRight } from 'lucide-react';

interface CatechismResult {
  paragraph: string;
  number: string;
  section: string;
  text: string;
}

const QUICK_TOPICS = [
  'Santíssima Trindade', 'Sacramento da Confissão', 'Eucaristia', 'Batismo',
  'Mandamentos', 'Oração', 'Graça', 'Pecado Original', 'Ressurreição',
  'Maria Mãe de Deus', 'Igreja Católica', 'Vida Eterna', 'Consciência Moral',
];

export default function Catechism() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CatechismResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async (q?: string) => {
    const term = q || query;
    if (!term.trim()) return;
    setIsLoading(true); setSearched(true);
    try {
      const r = await fetch('/api/ai/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'Você é especialista no Catecismo da Igreja Católica (CIC). Responda APENAS com JSON válido, sem texto antes ou depois.' },
            { role: 'user', content: `Busque no Catecismo da Igreja Católica (CIC) sobre: "${term}".
Retorne os parágrafos mais relevantes com o texto literal do CIC, número do parágrafo e seção.
Retorne entre 3 e 6 resultados.
JSON: { "results": [ { "paragraph": "Título/tema do parágrafo", "number": "CIC §1234", "section": "Parte > Seção > Capítulo", "text": "Texto literal do parágrafo do Catecismo, fiel ao original." } ] }` }
          ],
          responseFormat: 'json', maxTokens: 2500,
        })
      }).then(r => r.json());

      const clean = (r.text || '').replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed = JSON.parse(clean);
      if (parsed.results) setResults(parsed.results);
      else setResults([]);
    } catch { setResults([]); }
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') search(); };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold">Catecismo da Igreja Católica</h2>
        <p className="text-[#1A1A1A]/60 italic">"A catequese é o eco vivo da Palavra de Deus." — CIC 4</p>
      </header>

      {/* Online links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a href="https://www.vatican.va/archive/cathechism_po/index_new/prima-pagina-cic_po.html"
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-4 p-6 bg-[#5A5A40] text-white rounded-[2rem] shadow-lg hover:scale-[1.02] transition-transform group">
          <div className="p-3 bg-white/20 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg">CIC Online — Vatican.va</p>
            <p className="text-sm text-white/60">Catecismo completo em português no site oficial do Vaticano</p>
          </div>
          <ExternalLink className="w-5 h-5 opacity-60 group-hover:opacity-100" />
        </a>

        <a href="https://www.vatican.va/archive/cathechism_po/index_new/indice_po.html"
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-4 p-6 bg-white border border-[#1A1A1A]/5 rounded-[2rem] shadow-sm hover:shadow-md transition-all group hover:border-[#5A5A40]/30">
          <div className="p-3 bg-[#F5F2ED] rounded-xl text-[#5A5A40]">
            <Hash className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg">Índice do Catecismo</p>
            <p className="text-sm text-[#1A1A1A]/40">Navegue por partes, seções e capítulos</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#1A1A1A]/20 group-hover:text-[#5A5A40]" />
        </a>
      </div>

      {/* Search */}
      <div className="bg-white p-8 rounded-[2rem] border border-[#1A1A1A]/5 shadow-sm space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Search className="w-5 h-5 text-[#5A5A40]" /> Busca no Catecismo
        </h3>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A1A1A]/30" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar por tema, parágrafo, palavra-chave..."
              className="w-full pl-12 pr-10 py-4 bg-[#F5F2ED] rounded-2xl border-none focus:ring-2 focus:ring-[#5A5A40]/20 text-sm"
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults([]); setSearched(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
                <X className="w-4 h-4 text-[#1A1A1A]/30" />
              </button>
            )}
          </div>
          <button onClick={() => search()} disabled={isLoading || !query.trim()}
            className="px-6 py-4 bg-[#5A5A40] text-white rounded-2xl font-bold hover:scale-[1.02] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buscar'}
          </button>
        </div>

        {/* Quick topics */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-3">Temas Frequentes</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_TOPICS.map(topic => (
              <button key={topic} onClick={() => { setQuery(topic); search(topic); }}
                className="px-3 py-1.5 bg-[#F5F2ED] rounded-xl text-xs font-bold text-[#1A1A1A]/60 hover:bg-[#5A5A40]/10 hover:text-[#5A5A40] transition-all">
                {topic}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading && (
        <div className="flex flex-col items-center py-16 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#5A5A40]" />
          <p className="text-[#1A1A1A]/40 italic font-serif">Buscando no Catecismo...</p>
        </div>
      )}

      {!isLoading && searched && results.length === 0 && (
        <div className="text-center py-16 bg-white rounded-[2rem] border border-dashed border-[#1A1A1A]/10">
          <p className="text-[#1A1A1A]/40 italic">Nenhum resultado encontrado. Tente outro termo.</p>
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-[#1A1A1A]/40">{results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''} para <strong>"{query}"</strong></p>
          {results.map((r, i) => (
            <div key={i} className="bg-white p-8 rounded-[2rem] border border-[#1A1A1A]/5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="font-bold text-lg">{r.paragraph}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="px-3 py-1 bg-[#5A5A40] text-white text-xs font-bold rounded-full">{r.number}</span>
                    <span className="text-xs text-[#1A1A1A]/40 italic">{r.section}</span>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-[#F5F2ED] rounded-2xl border-l-4 border-[#5A5A40]">
                <p className="text-base leading-relaxed text-[#1A1A1A]/80 font-serif">{r.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
