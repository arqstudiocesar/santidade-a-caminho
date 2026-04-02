import React, { useState } from 'react';
import { Quote, Heart, Share2, Bookmark, Search, Filter, X, Loader2, Sparkles } from 'lucide-react';

interface QuoteItem {
  text: string;
  author: string;
  tags: string[];
}

const STATIC_QUOTES: QuoteItem[] = [
  { text: "Nada te turbe, nada te espante, tudo passa, Deus não muda.", author: "Santa Teresa de Ávila", tags: ["Paciência", "Confiança", "Paz"] },
  { text: "A medida do amor é amar sem medida.", author: "Santo Agostinho", tags: ["Caridade", "Amor"] },
  { text: "No entardecer da vida, seremos julgados pelo amor.", author: "São João da Cruz", tags: ["Caridade", "Juízo", "Amor"] },
  { text: "A santidade consiste em fazer a vontade de Deus com alegria.", author: "Santa Teresa de Calcutá", tags: ["Santidade", "Alegria"] },
  { text: "Fazei tudo por amor, nada por força.", author: "São Francisco de Sales", tags: ["Amor", "Liberdade"] },
  { text: "Onde não há amor, coloca amor e colherás amor.", author: "São João da Cruz", tags: ["Caridade", "Amor"] },
  { text: "Nosso coração está inquieto enquanto não repousa em Ti.", author: "Santo Agostinho", tags: ["Oração", "Deus", "Paz"] },
  { text: "Começar é fácil; o que importa é perseverar.", author: "Santa Catarina de Siena", tags: ["Perseverança", "Virtude"] },
  { text: "A humildade é a raiz, a mãe, a nutriz e a base de todas as virtudes.", author: "São João Crisóstomo", tags: ["Humildade", "Virtude"] },
  { text: "Senhor, tornai-me instrumento da Vossa paz.", author: "São Francisco de Assis", tags: ["Paz", "Serviço"] },
  { text: "Confiai em Deus, e nada vos faltará.", author: "São João Bosco", tags: ["Confiança", "Fé"] },
  { text: "A oração é a respiração da alma.", author: "São Pio de Pietrelcina", tags: ["Oração"] },
  { text: "Quem não ora é como um soldado que vai à batalha sem armas.", author: "São Pio de Pietrelcina", tags: ["Oração", "Batalha Espiritual"] },
  { text: "Amai a Deus com todo o vosso coração e ao próximo como a vós mesmos.", author: "São Tomás de Aquino", tags: ["Amor", "Caridade"] },
  { text: "Não existe amor sem sacrifício.", author: "São João Paulo II", tags: ["Amor", "Sacrifício"] },
  { text: "Não tenhais medo! Abri, escancarai as portas a Cristo!", author: "São João Paulo II", tags: ["Fé", "Coragem"] },
  { text: "A misericórdia de Deus é maior do que todos os nossos pecados.", author: "Santa Faustina Kowalska", tags: ["Misericórdia", "Perdão"] },
  { text: "O silêncio é a linguagem de Deus.", author: "São João da Cruz", tags: ["Oração", "Silêncio"] },
  { text: "Cuida-te das pequenas coisas: é por elas que os grandes progridem.", author: "São Francisco de Sales", tags: ["Virtude", "Perseverança"] },
  { text: "A maior de todas as virtudes é a caridade; mas a base de todas é a humildade.", author: "Santo Tomás de Aquino", tags: ["Humildade", "Caridade", "Virtude"] },
];

const ALL_TAGS = [...new Set(STATIC_QUOTES.flatMap(q => q.tags))].sort();

export default function SaintQuotes() {
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [bookmarked, setBookmarked] = useState<number[]>([]);

  // AI search state
  const [aiResults, setAiResults] = useState<QuoteItem[] | null>(null);
  const [aiSaintName, setAiSaintName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);

  // When showing AI results, ignore static filters
  const showingAi = aiResults !== null;

  const handleAiSearch = async () => {
    const term = search.trim();
    if (!term) return;
    setIsSearching(true);
    setSearchError(false);
    setAiResults(null);
    try {
      const r = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'Você é especialista em hagiografia e espiritualidade católica, com amplo conhecimento das obras e escritos dos santos. Responda APENAS com JSON válido, sem texto antes ou depois.',
            },
            {
              role: 'user',
              content: `Busque frases, pensamentos, ensinamentos e máximas do(a) santo(a): "${term}".
Retorne entre 8 e 12 citações autênticas e conhecidas, categorizando cada uma por tipologia/tema.
As categorias devem ser temas espirituais como: Oração, Amor, Humildade, Fé, Esperança, Caridade, Sofrimento, Alegria, Santidade, Misericórdia, Conversão, Pecado, Virtude, Silêncio, Sacrifício, Paz, Deus, Maria, Eucaristia, Evangelização, Confiança, Obediência, Paciência — use apenas as mais adequadas para cada frase.

JSON:
{
  "saint_name": "Nome completo e oficial do(a) santo(a) (corrigido se necessário)",
  "bio_summary": "Breve descrição de quem é o santo (1 linha)",
  "quotes": [
    { "text": "Texto exato da citação", "tags": ["Tema1", "Tema2"] },
    ...
  ]
}`,
            },
          ],
          responseFormat: 'json',
          maxTokens: 2000,
        }),
      });
      const data = await r.json();
      const raw = data.text || '';
      const clean = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed = JSON.parse(clean);
      if (parsed.quotes?.length) {
        setAiSaintName(parsed.saint_name || term);
        setAiResults(parsed.quotes.map((q: any) => ({
          text: q.text,
          author: parsed.saint_name || term,
          tags: q.tags || [],
        })));
      } else {
        setSearchError(true);
      }
    } catch {
      setSearchError(true);
    }
    setIsSearching(false);
  };

  const clearAiResults = () => {
    setAiResults(null);
    setAiSaintName('');
    setSearch('');
    setSearchError(false);
  };

  // Static filtering (only when not showing AI results)
  const staticFiltered = STATIC_QUOTES.filter(q => {
    const matchSearch = !search ||
      q.text.toLowerCase().includes(search.toLowerCase()) ||
      q.author.toLowerCase().includes(search.toLowerCase());
    const matchTag = !activeTag || q.tags.includes(activeTag);
    return matchSearch && matchTag;
  });

  const displayQuotes: QuoteItem[] = showingAi ? aiResults! : staticFiltered;

  const toggleBookmark = (i: number) => {
    setBookmarked(prev => prev.includes(i) ? prev.filter(b => b !== i) : [...prev, i]);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold">Pensamentos dos Santos</h2>
          <p className="text-[#1A1A1A]/60 italic">"Aquele que caminha com os sábios tornar-se-á sábio."</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/30" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAiSearch()}
              placeholder="Buscar santo ou tema..."
              className="pl-10 pr-8 py-2 bg-white border border-[#1A1A1A]/10 rounded-full text-sm focus:ring-2 focus:ring-[#5A5A40] w-64"
            />
            {search && !isSearching && (
              <button onClick={showingAi ? clearAiResults : () => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-[#1A1A1A]/30" />
              </button>
            )}
          </div>

          {/* Search button with AI */}
          <button
            onClick={handleAiSearch}
            disabled={isSearching || !search.trim()}
            title="Buscar pensamentos deste santo com IA"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#5A5A40] text-white rounded-full text-sm font-bold hover:bg-[#5A5A40]/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSearching
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <><Sparkles className="w-4 h-4" /> Buscar</>
            }
          </button>

          {!showingAi && (
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`p-2 border rounded-full transition-all ${showFilter || activeTag ? 'bg-[#5A5A40] text-white border-[#5A5A40]' : 'bg-white border-[#1A1A1A]/10 hover:bg-[#F5F2ED]'}`}>
              <Filter className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* AI result banner */}
      {showingAi && (
        <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-bold text-amber-800">Pensamentos de {aiSaintName}</p>
              <p className="text-xs text-amber-600">{aiResults?.length} citações encontradas pela IA</p>
            </div>
          </div>
          <button onClick={clearAiResults}
            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-amber-200 rounded-full text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors">
            <X className="w-3 h-3" /> Limpar
          </button>
        </div>
      )}

      {/* Search error */}
      {searchError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-center">
          <p className="text-red-600 text-sm font-bold">Não foi possível encontrar pensamentos deste santo.</p>
          <p className="text-red-400 text-xs mt-1">Verifique o nome e tente novamente.</p>
        </div>
      )}

      {/* Tag filters (static mode only) */}
      {showFilter && !showingAi && (
        <div className="flex flex-wrap gap-2 p-4 bg-white rounded-2xl border border-[#1A1A1A]/5 shadow-sm">
          <button onClick={() => setActiveTag(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${!activeTag ? 'bg-[#5A5A40] text-white' : 'bg-[#F5F2ED] text-[#1A1A1A]/60 hover:bg-[#5A5A40]/10'}`}>
            Todos
          </button>
          {ALL_TAGS.map(tag => (
            <button key={tag} onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTag === tag ? 'bg-[#5A5A40] text-white' : 'bg-[#F5F2ED] text-[#1A1A1A]/60 hover:bg-[#5A5A40]/10'}`}>
              {tag}
            </button>
          ))}
        </div>
      )}

      {activeTag && !showingAi && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[#1A1A1A]/40">Filtrando por:</span>
          <span className="px-3 py-1 bg-[#5A5A40] text-white rounded-full text-xs font-bold flex items-center gap-1">
            {activeTag}
            <button onClick={() => setActiveTag(null)}><X className="w-3 h-3" /></button>
          </span>
          <span className="text-[#1A1A1A]/40">{displayQuotes.length} resultado{displayQuotes.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {isSearching && (
        <div className="flex flex-col items-center py-12 space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#5A5A40]" />
          <p className="font-serif italic text-[#1A1A1A]/40">Buscando pensamentos do santo...</p>
        </div>
      )}

      {!isSearching && displayQuotes.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-[#1A1A1A]/10">
          <p className="text-[#1A1A1A]/40 italic">Nenhum pensamento encontrado.</p>
        </div>
      )}

      {!isSearching && displayQuotes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayQuotes.map((quote, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-[#1A1A1A]/5 shadow-sm hover:shadow-md transition-all group">
              <Quote className="w-10 h-10 text-[#F5F2ED] mb-4 group-hover:text-[#E6E6A0] transition-colors" />
              <p className="text-xl leading-relaxed mb-6 italic text-[#1A1A1A]/80">"{quote.text}"</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#5A5A40]">{quote.author}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {quote.tags.map(tag => (
                      <button key={tag}
                        onClick={() => { if (!showingAi) { setActiveTag(tag); setShowFilter(true); } }}
                        className="text-[10px] uppercase tracking-widest bg-[#F5F2ED] px-2 py-0.5 rounded hover:bg-[#5A5A40]/10 text-[#1A1A1A]/40 transition-colors">
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleBookmark(i)}
                    className={`p-2 rounded-full transition-colors ${bookmarked.includes(i) ? 'text-[#5A5A40] bg-[#F5F2ED]' : 'text-[#1A1A1A]/20 hover:text-[#5A5A40]'}`}>
                    <Bookmark className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      const txt = `"${quote.text}" — ${quote.author}`;
                      if (navigator.share) navigator.share({ text: txt });
                      else navigator.clipboard.writeText(txt);
                    }}
                    className="p-2 text-[#1A1A1A]/20 hover:text-[#5A5A40] transition-colors rounded-full">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
