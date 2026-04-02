import React, { useState, useEffect } from 'react';
import { Star, Calendar, Loader2, RefreshCw, BookOpen, Quote, Heart } from 'lucide-react';

interface SaintData {
  name: string;
  feast_date: string;
  birth: string;
  death: string;
  patron_of: string;
  recognized_for: string;
  biography: string;
  notable_facts: string[];
  famous_quotes: string[];
  other_saints_today: Array<{ name: string; description: string }>;
}

const CACHE_KEY = 'saint_of_day_cache';

function getDailyCache(): { date: string; data: SaintData } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.date === new Date().toDateString()) return parsed;
  } catch { /* noop */ }
  return null;
}

function setDailyCache(data: SaintData) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ date: new Date().toDateString(), data })); } catch { /* noop */ }
}

export default function SaintOfDay() {
  const [saint, setSaint] = useState<SaintData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<'bio' | 'quotes' | 'others'>('bio');

  const fetchSaint = async (force = false) => {
    if (!force) {
      const cached = getDailyCache();
      if (cached) { setSaint(cached.data); return; }
    }
    setIsLoading(true); setError(false);
    try {
      const today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
      const text = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'Você é especialista em hagiografia católica. Responda APENAS com JSON válido, sem texto antes ou depois.' },
            { role: 'user', content: `Hoje é ${today}. Qual é o principal santo celebrado hoje no calendário litúrgico católico?
Forneça uma biografia completa e sucinta, frases célebres, e outros santos do mesmo dia.
JSON:
{
  "name": "Nome completo do Santo",
  "feast_date": "${today}",
  "birth": "ano ou data de nascimento",
  "death": "ano ou data de morte",
  "patron_of": "padroeiro de...",
  "recognized_for": "doutor da Igreja / mártir / confessor / etc.",
  "biography": "Biografia completa em 4-6 parágrafos cobrindo: origem, vocação, obras, virtudes, morte e legado.",
  "notable_facts": ["fato 1", "fato 2", "fato 3", "fato 4"],
  "famous_quotes": ["Frase 1 do santo", "Frase 2 do santo", "Frase 3 do santo"],
  "other_saints_today": [
    { "name": "Nome do Santo 2", "description": "Breve descrição (1 linha)" },
    { "name": "Nome do Santo 3", "description": "Breve descrição (1 linha)" }
  ]
}` }
          ],
          responseFormat: 'json',
          maxTokens: 2000,
        })
      }).then(r => r.json());

      const raw = text.text || '';
      const clean = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const data: SaintData = JSON.parse(clean);
      if (data.name) { setSaint(data); setDailyCache(data); }
      else setError(true);
    } catch { setError(true); }
    setIsLoading(false);
  };

  useEffect(() => { fetchSaint(); }, []);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
      <Loader2 className="w-12 h-12 animate-spin text-[#5A5A40]" />
      <p className="font-serif italic text-[#1A1A1A]/40">Buscando o Santo do Dia...</p>
    </div>
  );

  if (error) return (
    <div className="text-center py-32 space-y-4">
      <p className="text-[#1A1A1A]/40 italic">Não foi possível carregar o Santo do Dia.</p>
      <button onClick={() => fetchSaint(true)} className="px-6 py-3 bg-[#5A5A40] text-white rounded-full font-bold hover:scale-105 transition-transform">
        Tentar novamente
      </button>
    </div>
  );

  if (!saint) return null;

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-[#5A5A40]" />
            <span className="text-xs font-sans uppercase tracking-widest text-[#5A5A40]">{saint.feast_date}</span>
          </div>
          <h2 className="text-3xl font-bold">{saint.name}</h2>
          <p className="text-[#1A1A1A]/60 italic">{saint.recognized_for}</p>
        </div>
        <button onClick={() => fetchSaint(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#1A1A1A]/10 rounded-full text-sm font-bold hover:bg-[#F5F2ED] transition-colors">
          <RefreshCw className="w-4 h-4" /> Atualizar
        </button>
      </header>

      {/* Info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Nascimento', value: saint.birth },
          { label: 'Falecimento', value: saint.death },
          { label: 'Padroeiro de', value: saint.patron_of },
          { label: 'Reconhecido por', value: saint.recognized_for },
        ].map((item, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-[#1A1A1A]/5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40] mb-1">{item.label}</p>
            <p className="text-sm font-medium text-[#1A1A1A]/80">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'bio', label: 'Biografia', icon: BookOpen },
          { id: 'quotes', label: 'Frases', icon: Quote },
          { id: 'others', label: 'Outros Santos de Hoje', icon: Star },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-[#5A5A40] text-white shadow-md' : 'bg-white border border-[#1A1A1A]/5 text-[#1A1A1A]/60 hover:bg-[#F5F2ED]'}`}>
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'bio' && (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-[#1A1A1A]/5 shadow-sm">
            <p className="text-lg leading-relaxed text-[#1A1A1A]/80 font-serif whitespace-pre-line">{saint.biography}</p>
          </div>
          {saint.notable_facts?.length > 0 && (
            <div className="bg-[#F5F2ED] p-8 rounded-[2rem]">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-4 flex items-center gap-2">
                <Star className="w-4 h-4" /> Fatos Notáveis
              </h3>
              <ul className="space-y-3">
                {saint.notable_facts.map((fact, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 flex-shrink-0 rounded-full bg-[#5A5A40] text-white flex items-center justify-center text-[10px] font-bold mt-0.5">{i + 1}</span>
                    <span className="text-sm text-[#1A1A1A]/70">{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {activeTab === 'quotes' && (
        <div className="space-y-4">
          {saint.famous_quotes?.map((q, i) => (
            <div key={i} className="bg-white p-8 rounded-[2rem] border border-[#1A1A1A]/5 shadow-sm">
              <Quote className="w-8 h-8 text-[#E6E6A0] mb-4" />
              <p className="text-xl font-serif italic leading-relaxed text-[#1A1A1A]/80">"{q}"</p>
              <p className="text-xs font-bold text-[#5A5A40] mt-4 uppercase tracking-widest">— {saint.name}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'others' && (
        <div className="space-y-4">
          <p className="text-sm text-[#1A1A1A]/50">Outros santos e beatos comemorados em {saint.feast_date}:</p>
          {saint.other_saints_today?.map((s, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-[#1A1A1A]/5 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 bg-[#F5F2ED] rounded-full flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-[#5A5A40]" />
              </div>
              <div>
                <p className="font-bold">{s.name}</p>
                <p className="text-sm text-[#1A1A1A]/50">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
