import React, { useState, useEffect } from 'react';
import { Newspaper, RefreshCw, Loader2, ExternalLink, Heart, Calendar, Globe, AlertCircle, X } from 'lucide-react';

interface NewsItem {
  title: string;
  summary: string;
  date: string;
  source: string;
  category: 'vaticano' | 'papa';
  url?: string;
}

interface PapalIntention {
  month: string;
  pope_name: string;
  general: string;
  missionary?: string;
  source: string;
}

// Cache só por sessão (sem localStorage para notícias, para sempre buscar atual)
let sessionNewsCache: NewsItem[] | null = null;
let sessionIntentionCache: PapalIntention | null = null;
let sessionNewsDate: string = '';

// Limpar caches antigos do localStorage ao iniciar
try {
  ['news_cache_v2','news_cache_v3','pope_intention_v3','pope_intention_v4','groq_daily_cache'].forEach(k => {
    const raw = localStorage.getItem(k);
    if (raw) {
      // Só limpar se o dado for antigo (do dia anterior ou antes)
      try {
        const p = JSON.parse(raw);
        if (p.date && p.date !== new Date().toDateString()) localStorage.removeItem(k);
      } catch { localStorage.removeItem(k); }
    }
  });
} catch { /* ok */ }

// Intenção conhecida de março/2026 como fallback garantido
const MARCH_2026_INTENTION: PapalIntention = {
  month: 'março de 2026',
  pope_name: 'Papa Leão XIV',  // Papa Robert Prevost, eleito em maio de 2025
  general: 'Pelo desarmamento e pela paz — Rezemos para que as nações avancem em direção a um desarmamento efetivo, especialmente o desarmamento nuclear, e para que os líderes mundiais escolham o caminho do diálogo e da diplomacia em vez da violência.',
  missionary: 'Rezemos para que os missionários e missionárias levem a paz de Cristo aos povos que vivem em zonas de conflito.',
  source: 'https://redemundialdeoracaodopapa.pt/intencoes_mensais/marco-2026-intencao-do-papa/',
};

// Map of known intentions by "month-year"
const KNOWN_INTENTIONS: Record<string, PapalIntention> = {
  '3-2026': MARCH_2026_INTENTION,
};

function todayStr() {
  return new Date().toDateString();
}

export default function News() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [intentions, setIntentions] = useState<PapalIntention | null>(null);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [isLoadingIntention, setIsLoadingIntention] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'vaticano' | 'papa'>('all');
  const [error, setError] = useState('');

  // ── Buscar intenção do Papa ─────────────────────────────────────────────
  const fetchIntention = async (force = false) => {
    if (!force && sessionIntentionCache) {
      setIntentions(sessionIntentionCache);
      return;
    }
    setIsLoadingIntention(true);

    const now = new Date();
    const monthYear = `${now.getMonth() + 1}-${now.getFullYear()}`;
    const monthLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    // PRIORIDADE 1: Usar intenção conhecida hardcoded (mais confiável)
    const known = KNOWN_INTENTIONS[monthYear];
    if (known) {
      sessionIntentionCache = known;
      setIntentions(known);
      setIsLoadingIntention(false);
      return;
    }

    // PRIORIDADE 2: Tentar extrair do site oficial (para meses sem hardcode)
    let siteText = '';
    let siteUrl = '';
    try {
      const r = await fetch('/api/pope-intention');
      const d = await r.json();
      if (d.success && d.text && d.text.length > 200) {
        siteText = d.text;
        siteUrl = d.url || '';
      }
    } catch { /* continuar */ }

    if (siteText) {
      try {
        const r = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: 'Extraia informações do texto e responda APENAS com JSON válido.' },
              { role: 'user', content: `Do texto abaixo (site da Rede Mundial de Oração do Papa), extraia SOMENTE a intenção de oração para ${monthLabel}. Não inclua o nome "Francisco" — use "Papa Leão XIV" (Robert Prevost, eleito em 2025).

"${siteText.slice(0, 2000)}"

JSON: { "month": "${monthLabel}", "pope_name": "Papa Leão XIV", "general": "texto exato da intenção", "missionary": "intenção missionária se mencionada", "source": "${siteUrl}" }` }
            ],
            responseFormat: 'json',
            maxTokens: 400,
          }),
        });
        const d = await r.json();
        const clean = (d.text || '').replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        const parsed = JSON.parse(clean);
        const badWords = ['não mencionado', 'not mentioned', 'não disponível', 'não encontrado', 'indisponível'];
        const isBad = badWords.some(w => (parsed.general || '').toLowerCase().includes(w));
        if (parsed.general && !isBad) {
          parsed.pope_name = 'Papa Leão XIV';
          sessionIntentionCache = parsed;
          setIntentions(parsed);
          setIsLoadingIntention(false);
          return;
        }
      } catch { /* continuar */ }
    }

    // PRIORIDADE 3: Pedir à IA diretamente
    try {
      const r = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'Responda APENAS com JSON válido.' },
            { role: 'user', content: `Qual é a intenção de oração do Papa Leão XIV (Robert Francis Prevost, eleito em maio de 2025, sucessor do Papa Francisco) para ${monthLabel}, segundo a Rede Mundial de Oração do Papa? JSON: { "month": "${monthLabel}", "pope_name": "Papa Leão XIV", "general": "Intenção geral do mês", "missionary": "Intenção missionária se houver", "source": "redemundialdeoracaodopapa.pt" }` }
          ],
          responseFormat: 'json',
          maxTokens: 400,
        }),
      });
      const d = await r.json();
      const clean = (d.text || '').replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed = JSON.parse(clean);
      if (parsed.general) {
        parsed.pope_name = 'Papa Leão XIV';
        sessionIntentionCache = parsed;
        setIntentions(parsed);
      }
    } catch { /* silencioso */ }
    setIsLoadingIntention(false);
  };

  // ── Buscar notícias ─────────────────────────────────────────────────────
  const fetchNews = async (force = false) => {
    if (!force && sessionNewsCache && sessionNewsDate === todayStr()) {
      setNews(sessionNewsCache);
      return;
    }

    setIsLoadingNews(true);
    setError('');

    // Buscar texto real do Vatican News via servidor
    let webText = '';
    let webDate = '';
    try {
      const r = await fetch('/api/catholic-news');
      const d = await r.json();
      if (d.success && d.text && d.text.length > 200) {
        webText = d.text;
        webDate = d.date || '';
      }
    } catch { /* continue */ }

    const today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

    let prompt = '';
    if (webText) {
      prompt = `Hoje é ${today}.

Com base no texto real extraído do Vatican News e sites católicos abaixo, identifique e estruture as principais notícias do dia:

"""
${webText.slice(0, 4500)}
"""

Extraia 6 notícias reais (2 sobre o Vaticano, 2 sobre o Papa atual, 2 sobre a Igreja no mundo).
Use APENAS informações reais do texto acima. Não invente nada.
JSON: { "news": [ { "title": "título real", "summary": "resumo 2-3 frases com informação real", "date": "${today}", "source": "Vatican News", "category": "vaticano" | "papa", "url": "https://www.vaticannews.va/pt.html" } ] }`;
    } else {
      prompt = `Hoje é ${today}. Liste 6 notícias católicas reais desta data ou dias recentes:
2 sobre o Vaticano, 2 sobre o Papa atual (não Francisco), 2 sobre a Igreja Universal.
Formato: estilo Vatican News. URLs reais quando possível.
JSON: { "news": [ { "title": "...", "summary": "...", "date": "${today}", "source": "Vatican News", "category": "vaticano" | "papa", "url": "https://www.vaticannews.va/pt.html" } ] }`;
    }

    try {
      const r = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'Você é especialista em notícias católicas. Responda APENAS com JSON válido, sem texto antes ou depois.' },
            { role: 'user', content: prompt }
          ],
          responseFormat: 'json',
          maxTokens: 2500,
        }),
      });
      const d = await r.json();
      const clean = (d.text || '').replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed = JSON.parse(clean);
      if (parsed.news?.length) {
        sessionNewsCache = parsed.news;
        sessionNewsDate = todayStr();
        setNews(parsed.news);
      } else {
        setError('Nenhuma notícia encontrada. Tente novamente.');
      }
    } catch {
      setError('Não foi possível carregar as notícias. Verifique sua conexão.');
    }
    setIsLoadingNews(false);
  };

  const handleRefresh = async () => {
    // Forçar atualização: limpar caches de sessão
    sessionNewsCache = null;
    sessionIntentionCache = null;
    sessionNewsDate = '';
    // Limpar localStorage também
    try {
      ['news_cache_v2','pope_intention_v3','news_cache_v3','pope_intention_v4'].forEach(k => localStorage.removeItem(k));
    } catch { /* ok */ }
    await Promise.all([fetchIntention(true), fetchNews(true)]);
  };

  useEffect(() => {
    fetchIntention();
    fetchNews();
  }, []);

  const filtered = news.filter(n => activeFilter === 'all' || n.category === activeFilter);
  const isLoading = isLoadingNews || isLoadingIntention;

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Notícias Católicas</h2>
          <p className="text-[#1A1A1A]/60 italic">"Ide por todo o mundo e pregai o Evangelho a toda criatura."</p>
        </div>
        <button onClick={handleRefresh} disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#1A1A1A]/10 rounded-full text-sm font-bold hover:bg-[#F5F2ED] transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </header>

      {/* Papal intention */}
      {isLoadingIntention && !intentions && (
        <div className="bg-[#5A5A40]/10 p-8 rounded-[2rem] flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-[#5A5A40]" />
          <p className="text-sm text-[#5A5A40] italic">Buscando intenção do Papa...</p>
        </div>
      )}

      {intentions && (
        <div className="bg-[#5A5A40] text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-[#E6E6A0]" />
              <span className="text-xs font-sans uppercase tracking-[0.2em] text-[#E6E6A0]">
                Intenção do Papa — {intentions.month}
              </span>
            </div>
            <p className="text-lg font-serif italic leading-relaxed">{intentions.general}</p>
            {intentions.missionary && (
              <p className="text-sm text-white/60 italic mt-3 border-t border-white/10 pt-3">
                Intenção missionária: {intentions.missionary}
              </p>
            )}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
              <p className="text-xs text-white/40 uppercase tracking-widest font-sans">{intentions.pope_name}</p>
              <a href="https://redemundialdeoracaodopapa.pt/" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white/70 transition-colors">
                <Globe className="w-3 h-3" /> Rede Mundial de Oração
              </a>
            </div>
          </div>
          <Heart className="absolute top-0 right-0 w-28 h-28 opacity-5 translate-x-4 -translate-y-4" />
        </div>
      )}

      {/* Links oficiais */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Vatican News PT', url: 'https://www.vaticannews.va/pt.html' },
          { label: 'Vatican.va', url: 'https://www.vatican.va' },
          { label: 'CNBB', url: 'https://www.cnbb.org.br' },
          { label: 'Rede Mundial de Oração', url: 'https://redemundialdeoracaodopapa.pt/' },
        ].map(l => (
          <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#1A1A1A]/5 rounded-full text-xs font-bold text-[#5A5A40] hover:bg-[#5A5A40] hover:text-white transition-all shadow-sm">
            {l.label} <ExternalLink className="w-3 h-3" />
          </a>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[{ id: 'all', label: 'Todas' }, { id: 'vaticano', label: 'Vaticano' }, { id: 'papa', label: 'Santo Padre' }].map(f => (
          <button key={f.id} onClick={() => setActiveFilter(f.id as any)}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${activeFilter === f.id ? 'bg-[#5A5A40] text-white shadow-md' : 'bg-white border border-[#1A1A1A]/5 text-[#1A1A1A]/60 hover:bg-[#F5F2ED]'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoadingNews && news.length === 0 && (
        <div className="flex flex-col items-center py-16 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#5A5A40]" />
          <p className="text-[#1A1A1A]/40 italic">Buscando notícias católicas...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={() => fetchNews(true)} className="ml-auto text-xs font-bold text-red-500 hover:underline">Tentar novamente</button>
        </div>
      )}

      {/* News grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-[#1A1A1A]/5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${item.category === 'papa' ? 'bg-amber-100 text-amber-700' : 'bg-[#F5F2ED] text-[#5A5A40]'}`}>
                  {item.category === 'papa' ? 'Santo Padre' : 'Vaticano'}
                </span>
                <span className="flex items-center gap-1 text-xs text-[#1A1A1A]/30">
                  <Calendar className="w-3 h-3" /> {item.date}
                </span>
              </div>
              <h3 className="font-bold text-base mb-2 leading-snug">{item.title}</h3>
              <p className="text-sm text-[#1A1A1A]/60 leading-relaxed mb-4">{item.summary}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#1A1A1A]/30 italic">{item.source}</span>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-[#5A5A40] font-bold hover:underline">
                    Ler mais <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoadingNews && !error && filtered.length === 0 && (
        <div className="text-center py-12 bg-white rounded-[2rem] border border-dashed border-[#1A1A1A]/10">
          <Newspaper className="w-8 h-8 text-[#1A1A1A]/20 mx-auto mb-3" />
          <p className="text-[#1A1A1A]/40 italic text-sm mb-3">Nenhuma notícia carregada ainda.</p>
          <button onClick={() => fetchNews(true)} className="px-5 py-2 bg-[#5A5A40] text-white rounded-full text-sm font-bold hover:scale-105 transition-transform">
            Buscar Notícias
          </button>
        </div>
      )}
    </div>
  );
}
