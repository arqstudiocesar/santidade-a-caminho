import React, { useState } from 'react';
import { Clock, CheckCircle2, Plus, Trash2, Sun, Sunset, Moon, X, BookOpen, Scroll, Loader2, ChevronRight, Star, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { geminiService } from '../services/groqService';
import { getTodayLiturgicalSummary } from '../services/liturgicalEngine';

// ── Helpers de formatação das leituras litúrgicas ────────────────────────────

function formatReadingText(text: string, type: string): React.ReactNode[] {
  if (!text) return [];
  const isPsalm = type.toLowerCase().includes('salmo') || type.toLowerCase().includes('responsorial');
  const isGospel = type.toLowerCase().includes('evangelho');

  // Clean up
  let cleaned = text.trim()
    .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n');

  const lines = cleaned.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(React.createElement('div', { key: `gap-${i}`, className: 'h-3' }));
      return;
    }
    // Psalm antiphon detection: lines with "R." or "Antífona" or "Refrão"
    const isAntiphon = isPsalm && (
      /^R[\.\/\)]/.test(trimmed) ||
      /^Antíf/i.test(trimmed) ||
      /^Refrão/i.test(trimmed) ||
      /^\*/.test(trimmed)
    );
    if (isAntiphon) {
      elements.push(React.createElement('p', {
        key: `ant-${i}`,
        className: 'font-bold text-[#5A5A40] text-base leading-relaxed my-2',
      }, trimmed));
    } else {
      elements.push(React.createElement('p', {
        key: `line-${i}`,
        className: 'text-base leading-relaxed text-[#1A1A1A]/80 font-serif',
      }, trimmed));
    }
  });

  // Add liturgical endings
  const endingDiv: React.ReactNode[] = [
    React.createElement('div', { key: 'ending-divider', className: 'border-t border-[#5A5A40]/20 my-4' }),
  ];

  if (isGospel) {
    endingDiv.push(
      React.createElement('p', { key: 'end1', className: 'text-xs font-bold uppercase tracking-widest text-[#5A5A40] text-center' }, '— Palavra da Salvação —'),
      React.createElement('p', { key: 'end2', className: 'text-xs text-center text-[#1A1A1A]/50 italic mt-1' }, 'Glória a Vós, Senhor')
    );
  } else if (!isPsalm) {
    endingDiv.push(
      React.createElement('p', { key: 'end1', className: 'text-xs font-bold uppercase tracking-widest text-[#5A5A40] text-center' }, '— Palavra do Senhor —'),
      React.createElement('p', { key: 'end2', className: 'text-xs text-center text-[#1A1A1A]/50 italic mt-1' }, 'Graças a Deus')
    );
  }

  return [...elements, ...endingDiv];
}

// Extrai o título litúrgico da primeira linha do texto (se existir)
// Ex: "Leitura dos Atos dos Apóstolos.\n\nNaqueles dias..."
// => título: "Leitura dos Atos dos Apóstolos."  |  corpo: "Naqueles dias..."
// Ex linha única: "Leitura dos Atos dos Apóstolos. Naqueles dias, 11 como o paralítico..."
// => título: "Leitura dos Atos dos Apóstolos."  |  corpo: "Naqueles dias, 11 como o paralítico..."
function extractLiturgicalTitle(text: string, type: string): { title: string; body: string } {
  if (!text) return { title: '', body: text };

  const lines = text.trim().split('\n');
  const first = lines[0].trim();

  const titlePrefixes = [
    /^Leitura d/i,
    /^Proclama/i,
    /^Responsório/i,
    /^Do (livro|Evangelho|primeiro|segundo|terceiro)/i,
  ];
  const hasTitlePrefix = titlePrefixes.some(re => re.test(first));

  if (hasTitlePrefix && !first.startsWith('R.')) {
    // Caso 1: título separado por quebra de linha
    if (lines.length > 1) {
      const rest = lines.slice(1).join('\n').replace(/^\s*\n+/, '').trim();
      if (rest.length > 0) {
        return { title: first, body: rest };
      }
    }

    // Caso 2: título e texto na MESMA linha — separar no primeiro ponto seguido de espaço + letra maiúscula
    // Cobre: "Leitura dos Atos dos Apóstolos. Naqueles dias..."
    // Cobre: "Leitura do Evangelho segundo João (Jo 3,16). Naquele tempo..."
    const dotSplit = first.match(/^(.+?[.!?])\s+([A-ZÁÉÍÓÚÂÊÎÔÛÀÃÕÇ\d].+)$/s);
    if (dotSplit && dotSplit[1] && dotSplit[2]) {
      const potentialTitle = dotSplit[1].trim();
      const potentialBody = dotSplit[2].trim();
      // Confirma que a parte do título começa com prefixo litúrgico
      if (titlePrefixes.some(re => re.test(potentialTitle)) && potentialBody.length > 10) {
        return { title: potentialTitle, body: potentialBody };
      }
    }
  }

  return { title: '', body: text };
}

function ReadingBlock({ reading, bgClass, borderClass, titleClass }: {
  reading: { type: string; reference: string; text: string };
  bgClass?: string;
  borderClass?: string;
  titleClass?: string;
}) {
  const isPsalm = reading.type.toLowerCase().includes('salmo') || reading.type.toLowerCase().includes('responsorial');
  const { title: litTitle, body: litBody } = extractLiturgicalTitle(reading.text, reading.type);

  return React.createElement('div', { className: 'space-y-3' },
    // Linha de referência (ex: "At 3,11-26")
    React.createElement('p', {
      className: `text-xs font-bold uppercase tracking-widest ${titleClass || 'text-[#1A1A1A]/40'}`,
    }, reading.reference),
    // Título litúrgico separado (ex: "Leitura dos Atos dos Apóstolos.")
    litTitle ? React.createElement('p', {
      className: `text-sm font-bold italic ${titleClass ? titleClass.replace('/40', '/80') : 'text-[#5A5A40]'} mb-1`,
    }, litTitle) : null,
    // Corpo do texto
    React.createElement('div', {
      className: `p-6 lg:p-8 ${bgClass || 'bg-[#F5F2ED]'} rounded-[2rem] border ${borderClass || 'border-[#5A5A40]/5'} space-y-1 ${isPsalm ? 'bg-opacity-70' : ''}`,
    }, formatReadingText(litTitle ? litBody : reading.text, reading.type))
  );
}


// ── Tipos e helpers de persistência ──────────────────────────────────────────
type PrayerItem = { id: string; name: string; period: string; completed: boolean; isCustom?: boolean };

const DEFAULT_PRAYER_LIST: PrayerItem[] = [
  { id: '1', name: 'Oferecimento do Dia',                       period: 'morning',   completed: false },
  { id: '2', name: 'Liturgia das Horas (Ofício das Leituras)',  period: 'morning',   completed: false },
  { id: '3', name: 'Liturgia das Horas (Laudes)',               period: 'morning',   completed: false },
  { id: '4', name: 'Angelus',                                   period: 'afternoon', completed: false },
  { id: '5', name: 'Liturgia das Horas (Hora Intermédia)',      period: 'afternoon', completed: false },
  { id: '6', name: 'Santo Rosário',                             period: 'afternoon', completed: false },
  { id: '7', name: 'Liturgia das Horas (Vésperas)',             period: 'afternoon', completed: false },
  { id: '8', name: 'Exame de Consciência',                      period: 'night',     completed: false },
  { id: '9', name: 'Oração da Noite (Completas)',               period: 'night',     completed: false },
];

function getUserPrayerBase(): string {
  try {
    const s = localStorage.getItem('caminho_session');
    const id = s ? JSON.parse(s).user?.id : 'anon';
    return `prayer_routine_${id}`;
  } catch { return 'prayer_routine_anon'; }
}
// Orações personalizadas — persistem para sempre
function loadCustomPrayers(): PrayerItem[] {
  try { const r = localStorage.getItem(`${getUserPrayerBase()}_custom`); return r ? JSON.parse(r) : []; } catch { return []; }
}
function saveCustomPrayers(list: PrayerItem[]): void {
  try { localStorage.setItem(`${getUserPrayerBase()}_custom`, JSON.stringify(list)); } catch {}
}
// Marcações do dia — reset diário
function getBrazilDateKey(): string {
  // Usa America/Sao_Paulo para calcular a data local correta,
  // independente do fuso do servidor ou do ambiente.
  const now = new Date();
  return now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); // retorna YYYY-MM-DD
}

function loadTodayDone(): string[] {
  try {
    const today = getBrazilDateKey();
    const r = localStorage.getItem(`${getUserPrayerBase()}_done`);
    if (!r) return [];
    const p = JSON.parse(r);
    return p.date === today ? (p.ids || []) : [];
  } catch { return []; }
}
function saveTodayDone(ids: string[]): void {
  try { localStorage.setItem(`${getUserPrayerBase()}_done`, JSON.stringify({ date: getBrazilDateKey(), ids })); } catch {}
}
// Lista completa com estado de conclusão do dia
function buildPrayerList(): PrayerItem[] {
  const custom = loadCustomPrayers();
  const done   = loadTodayDone();
  return [...DEFAULT_PRAYER_LIST, ...custom].map(p => ({ ...p, completed: done.includes(p.id) }));
}

export default function PrayerRoutine() {
  const [prayers, setPrayers] = useState<PrayerItem[]>(() => buildPrayerList());
  const [showAddModal, setShowAddModal]       = useState(false);
  const [newPrayerName, setNewPrayerName]     = useState('');
  const [newPrayerPeriod, setNewPrayerPeriod] = useState('morning');
  const [selectedPrayer, setSelectedPrayer] = useState<any>(null);
  const [liturgyData, setLiturgyData] = useState<any>(null);
  // Inicializa massLiturgy diretamente do cache do dia (se existir).
  // Isso garante que ao abrir o app / fazer refresh / login, a liturgia já
  // apareça sem precisar clicar no botão novamente — e sem fazer nova requisição.
  const [massLiturgy, setMassLiturgy] = useState<any>(() => {
    try {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
      const raw = JSON.parse(localStorage.getItem('groq_daily_cache') || '{}');
      const entry = raw['mass_liturgy'];
      if (entry && entry.date === today && entry.data?.readings?.length >= 2) {
        return entry.data;
      }
    } catch {}
    return null;
  });
  const [isLoadingLiturgy, setIsLoadingLiturgy] = useState(false);
  // Se massLiturgy já foi carregada do cache, exibir o painel imediatamente.
  const [isReadingMass, setIsReadingMass] = useState<boolean>(() => {
    try {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
      const raw = JSON.parse(localStorage.getItem('groq_daily_cache') || '{}');
      const entry = raw['mass_liturgy'];
      return !!(entry && entry.date === today && entry.data?.readings?.length >= 2);
    } catch { return false; }
  });
  const [viewingFeastLiturgy, setViewingFeastLiturgy] = useState(false);
  const [feastLiturgy, setFeastLiturgy] = useState<any>(null);
  const [isLoadingFeast, setIsLoadingFeast] = useState(false);

  // Motor litúrgico — carregado sincronicamente (sem rede).
  // Passa o offset real do navegador para garantir que a data litúrgica seja
  // a mesma usada no cache e no servidor (evita bug de fuso horário).
  const todayLit = getTodayLiturgicalSummary(-new Date().getTimezoneOffset());

  const COLOR_MAP: Record<string, string> = {
    verde: 'bg-green-100 text-green-800 border-green-200',
    roxo: 'bg-purple-100 text-purple-800 border-purple-200',
    branco: 'bg-gray-50 text-gray-700 border-gray-200',
    vermelho: 'bg-red-100 text-red-800 border-red-200',
    rosa: 'bg-pink-100 text-pink-800 border-pink-200',
  };
  const COLOR_DOT: Record<string, string> = {
    verde: 'bg-green-500', roxo: 'bg-purple-500', branco: 'bg-gray-400',
    vermelho: 'bg-red-500', rosa: 'bg-pink-400',
  };

  // Retorna a data local do usuário como string e o offset UTC em minutos.
  // Usa o offset REAL do navegador (não hardcoded para São Paulo) para funcionar
  // corretamente em qualquer fuso horário.
  // O tzOffset é passado ao servidor (?tz=) e ao motor litúrgico para garantir
  // que todos calculem exatamente a mesma data local — evitando o bug em que
  // usuários no Brasil entre 21h-23h59 recebem a liturgia do dia seguinte.
  const getUserLocalDate = () => {
    const now = new Date();
    const tzOffset = -now.getTimezoneOffset(); // UTC-3 → -180
    // cacheKey usa America/Sao_Paulo para garantir consistência com getBrazilDateKey()
    // e com o servidor — evita divergência entre os três pontos.
    const cacheKey = now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); // YYYY-MM-DD
    const parts = cacheKey.split('-');
    const displayDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    return { cacheKey, displayDate, tzOffset };
  };

  const fetchMassLiturgy = async () => {
    const { cacheKey, displayDate, tzOffset } = getUserLocalDate();

    // REGRA PRINCIPAL: se já existe liturgia válida no cache para hoje, usa sem nova requisição.
    // Isso garante que a liturgia NÃO mude ao fazer refresh, logout/login, ou trocar de aba.
    try {
      const raw = JSON.parse(localStorage.getItem('groq_daily_cache') || '{}');
      const cached = raw['mass_liturgy'];
      if (cached && cached.date === cacheKey && cached.data?.readings?.length >= 2) {
        setMassLiturgy(cached.data);
        setIsReadingMass(true);
        setViewingFeastLiturgy(false);
        return;
      }
    } catch { /* ok */ }

    setIsLoadingLiturgy(true);
    setIsReadingMass(true);
    setViewingFeastLiturgy(false);
    setFeastLiturgy(null);

    const today = displayDate;
    // Passa o mesmo tzOffset do cacheKey para garantir que o motor litúrgico
    // calcule exatamente o mesmo dia local — evita divergência entre cache e leituras.
    const litInfo = getTodayLiturgicalSummary(tzOffset);
    const hasCelebration = !!(litInfo.celebrationName);
    const celebrationRank = litInfo.celebrationName || '';

    // Referências do motor litúrgico — usamos para ancorar o prompt da IA
    const engineRefs = litInfo.readings;
    // Verifica se o motor já tem referências reais (não placeholders gerados para a IA)
    const hasRealEngineRefs = engineRefs &&
      !engineRefs.firstReading.startsWith('Lecionário Ferial') &&
      !engineRefs.gospel.startsWith('Evangelho —');
    // Referências das leituras da FESTA (se houver) — para dizer à IA o que NÃO colocar em readings[]
    const feastRefs = litInfo.feastReadings
      ? `${litInfo.feastReadings.firstReading} / ${litInfo.feastReadings.psalm} / ${litInfo.feastReadings.gospel}`
      : '';

    try {
      // Tenta primeiro o endpoint de scraping (sem IA, mais confiável)
      let liturgyFromScraping: any = null;
      try {
        const scraped = await fetch(`/api/liturgy-today?tz=${tzOffset}`);
        const scrapedData = await scraped.json();
        if (scrapedData?.success && scrapedData?.structured?.readings?.length >= 2) {
          // Aplica as referências do motor litúrgico sobre os textos do scraping.
          // O site pode ter referências diferentes ou desatualizadas — o motor é a
          // fonte de verdade para QUAL leitura é a correta para cada tipo.
          const applyEngineRefsToScraped = (readings: any[]): any[] => {
            return readings.map((r: any) => {
              const type: string = r.type || '';
              if (type.includes('1ª') || type.toLowerCase().includes('primeira')) {
                return { ...r, reference: hasRealEngineRefs ? engineRefs.firstReading : r.reference };
              }
              if (type.includes('Salmo') || type.toLowerCase().includes('salmo')) {
                return { ...r, reference: hasRealEngineRefs ? engineRefs.psalm : r.reference };
              }
              if (type.includes('2ª') || type.toLowerCase().includes('segunda')) {
                return { ...r, reference: (hasRealEngineRefs && engineRefs.secondReading) ? engineRefs.secondReading : r.reference };
              }
              if (type.toLowerCase().includes('vangelho') || type.includes('Evangelho')) {
                return { ...r, reference: hasRealEngineRefs ? engineRefs.gospel : r.reference };
              }
              return r;
            });
          };

          // Valida o Salmo: o texto deve seguir o formato responsorial (conter "R.")
          // Se não seguir, o scraping provavelmente misturou o texto com outro salmo.
          const validatePsalmText = (readings: any[]): boolean => {
            const psalm = readings.find((r: any) =>
              (r.type || '').toLowerCase().includes('salmo')
            );
            if (!psalm) return true; // Sem salmo — aceita e deixa a IA complementar
            const text: string = psalm.text || '';
            // Salmo responsorial válido deve conter "R." de responsório
            return text.includes('R.') || text.includes('R ') || text.length < 50;
          };

          const correctedReadings = applyEngineRefsToScraped(scrapedData.structured.readings);
          const psalmOk = validatePsalmText(correctedReadings);

          if (psalmOk) {
            liturgyFromScraping = {
              title: `Liturgia do Dia — ${today}`,
              feast_checked: true,
              readings: correctedReadings,
              feast: hasCelebration ? {
                name: celebrationRank.split(' — ')[0],
                type: celebrationRank.includes('Memória') ? 'Memória' :
                      celebrationRank.includes('Festa') ? 'Festa' : 'Solenidade',
              } : null,
            };
          }
          // Se psalmOk === false, liturgyFromScraping permanece null → fallback para IA
        }
      } catch { /* prosseguir para IA */ }

      if (liturgyFromScraping) {
        setMassLiturgy(liturgyFromScraping);
        try {
          const raw = JSON.parse(localStorage.getItem('groq_daily_cache') || '{}');
          raw['mass_liturgy'] = { date: cacheKey, data: liturgyFromScraping };
          localStorage.setItem('groq_daily_cache', JSON.stringify(raw));
        } catch {}
        setIsLoadingLiturgy(false);
        return;
      }

      // Fallback: IA — prompt ancorado nas refs do motor litúrgico e que separa
      // explicitamente leituras da festa vs. leituras feriais/dominicais do dia.
      const feastWarning = (hasCelebration && feastRefs)
        ? `\n\u26a0\ufe0f ATEN\u00c7\u00c3O \u2014 celebra\u00e7\u00e3o: ${celebrationRank}. Leituras PR\u00d3PRIAS: ${feastRefs}. ESSAS REF. N\u00c3O DEVEM aparecer em "readings".`
        : '';
      const readingAnchor = hasRealEngineRefs
        ? `Leituras do Lection\u00e1rio para hoje:\n- 1\u00aa Leitura: ${engineRefs.firstReading}\n- Salmo: ${engineRefs.psalm}\n- Evangelho: ${engineRefs.gospel}${engineRefs.secondReading ? `\n- 2\u00aa Leitura: ${engineRefs.secondReading}` : ''}`
        : `Per\u00edodo: ${litInfo.seasonLabel} \u2014 Ano ${litInfo.liturgicalYear} \u2014 Ciclo ${litInfo.ferialCycle}.`;

      const systemPrompt = `Voc\u00ea \u00e9 especialista em Liturgia Cat\u00f3lica e Lection\u00e1rio Romano. Responda APENAS com JSON v\u00e1lido.${feastWarning}`;
      const feastType = celebrationRank.includes('Mem\u00f3ria') ? 'Mem\u00f3ria' : celebrationRank.includes('Festa') ? 'Festa' : 'Solenidade';

      const userPrompt = [
        `Leituras COMPLETAS da Santa Missa de hoje, ${today}.`,
        readingAnchor,
        hasCelebration ? `Celebra\u00e7\u00e3o: ${celebrationRank} \u2192 vai SOMENTE em "feast", SEM leituras em "readings".` : '',
        `JSON:`,
        `{`,
        `  "title": "Liturgia do Di\u00e1 \u2014 ${today}",`,
        `  "readings": [`,
        `    {"type": "1\u00aa Leitura", "reference": "${hasRealEngineRefs ? engineRefs.firstReading : 'referência exata'}", "text": "TEXTO COMPLETO"},`,
        `    {"type": "Salmo Responsorial", "reference": "${hasRealEngineRefs ? engineRefs.psalm : 'referência exata'}", "text": "R. [antífona]\n\n1. [estrofe]\n\nR."},`,
        `    {"type": "Evangelho", "reference": "${hasRealEngineRefs ? engineRefs.gospel : 'referência exata'}", "text": "TEXTO COMPLETO"}`,
        `  ]${hasCelebration ? `,\n  "feast": {"name": "${celebrationRank.split(' \u2014 ')[0]}", "type": "${feastType}"}` : ''}`,
        `}`,
        `REGRAS: 1. Textos COMPLETOS e ÍNTEGROS, SEM "..." ou cortes. 2. Salmo Responsorial: formato OBRIGATÓRIO: "R. [antífona completa]\n\n[estrofe 1]\n\nR. [antífona]\n\n[estrofe 2]\n\nR. [antífona]" — o texto do salmo deve ser do Sl ${hasRealEngineRefs ? engineRefs.psalm.split(",")[0] : "indicado"}, NÃO de outro salmo. 3. ${hasRealEngineRefs ? `Use SOMENTE estas referências: 1ª Leitura=${engineRefs.firstReading} / Salmo=${engineRefs.psalm} / Evangelho=${engineRefs.gospel}.` : "Forneça leituras feriais corretas."} 4. ${hasCelebration && feastRefs ? `PROIBIDO usar ${feastRefs} em "readings".` : "Nenhuma celebração."}  5. NUNCA confunda o salmo com outro — a referência determina o salmo EXATO a usar.`,
      ].filter(Boolean).join('\n');
      const resp = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          responseFormat: 'json',
          maxTokens: 3500,
        }),
      });
      const respData = await resp.json();
      const clean = (respData.text || '').replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed = JSON.parse(clean);

      if (parsed?.readings?.length >= 2) {
        parsed.feast_checked = true;
        setMassLiturgy(parsed);
        try {
          const raw = JSON.parse(localStorage.getItem('groq_daily_cache') || '{}');
          raw['mass_liturgy'] = { date: cacheKey, data: parsed };
          localStorage.setItem('groq_daily_cache', JSON.stringify(raw));
        } catch {}
      } else {
        alert("Não foi possível carregar a Liturgia Diária. Por favor, tente novamente.");
        setIsReadingMass(false);
      }
    } catch (e) {
      console.error('Erro ao carregar liturgia:', e);
      alert("Não foi possível carregar a Liturgia Diária. Por favor, tente novamente.");
      setIsReadingMass(false);
    }
    setIsLoadingLiturgy(false);
  };

  // Auto-carrega a liturgia do dia quando o componente monta,
  // SE ainda não há cache válido para hoje.
  // Assim o usuário não precisa clicar — e a liturgia persiste o dia todo.
  React.useEffect(() => {
    if (!massLiturgy) {
      fetchMassLiturgy();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFeastLiturgy = async (feastName: string, feastType: string) => {
    setIsLoadingFeast(true);
    setViewingFeastLiturgy(true);
    try {
      const today = new Date().toLocaleDateString('pt-BR');

      // Chamada 1: referencias exatas do Proprio dos Santos
      let r1Ref = '';
      let r1Psalm = '';
      let r1Refrain = '';
      let r1Reading2 = '';
      let r1Gospel = '';

      try {
        const resp1 = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: 'Conhece o Missal Romano e Proprio dos Santos. Responda APENAS com JSON valido.',
              },
              {
                role: 'user',
                content: `Indique APENAS as referencias (nao o texto) das leituras do Proprio dos Santos para: ${feastType}: ${feastName} (${today}).

JSON:
{
  "first_reading": "ex: Rm 4,13.16-18.22",
  "psalm": "ex: Sl 88(89),2-3.4-5.27.29",
  "psalm_refrain": "ex: R. 37",
  "second_reading": "referencia ou vazio",
  "gospel": "ex: Mt 1,16.18-21.24a"
}`,
              },
            ],
            responseFormat: 'json',
            maxTokens: 250,
          }),
        });
        const d1 = await resp1.json();
        const c1 = (d1.text || '').replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        const p1 = JSON.parse(c1);
        r1Ref      = p1.first_reading  || '';
        r1Psalm    = p1.psalm          || '';
        r1Refrain  = p1.psalm_refrain  || '';
        r1Reading2 = p1.second_reading || '';
        r1Gospel   = p1.gospel         || '';
      } catch { /* prosseguir */ }

      const psalmFull = r1Psalm + (r1Refrain ? ` \u2013 ${r1Refrain}` : '');

      // Chamada 2: textos completos
      const resp2 = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'Especialista em Liturgia Catolica e Lecionario Romano. Responda APENAS com JSON valido.',
            },
            {
              role: 'user',
              content: `Forneca os textos COMPLETOS das leituras do Proprio dos Santos para: ${feastType}: ${feastName} (${today}).

Leituras:
- 1a Leitura: ${r1Ref || 'conforme Proprio dos Santos'}
- Salmo Responsorial: ${psalmFull || 'conforme Proprio dos Santos'}
${r1Reading2 ? `- 2a Leitura: ${r1Reading2}` : ''}
- Evangelho: ${r1Gospel || 'conforme Proprio dos Santos'}

REGRAS:
1. Textos completos, minimo 8 versiculos cada.
2. Salmo: referencia exata "${psalmFull}", texto com "R. [antifona]", estrofes numeradas, "R." repetida apos cada estrofe.
3. Nunca use "..." nem resuma.

JSON:
{
  "title": "${feastName}",
  "feast_type": "${feastType}",
  "readings": [
    {"type": "1\u00aa Leitura", "reference": "${r1Ref}", "text": "TEXTO COMPLETO"},
    {"type": "Salmo Responsorial", "reference": "${psalmFull}", "text": "R. [antifona]\\n\\n1. [estrofe]\\n\\nR. [antifona]"},
    ${r1Reading2 ? `{"type": "2\u00aa Leitura", "reference": "${r1Reading2}", "text": "TEXTO COMPLETO"},` : ''}
    {"type": "Evangelho", "reference": "${r1Gospel}", "text": "TEXTO COMPLETO"}
  ]
}`,
            },
          ],
          responseFormat: 'json',
          maxTokens: 3500,
        }),
      });
      const d2 = await resp2.json();
      const c2 = (d2.text || '').replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const p2 = JSON.parse(c2);
      if (p2.readings) {
        // Garantir referencia correta no salmo
        const ps = p2.readings.find((r: any) => r.type.toLowerCase().includes('salmo'));
        if (ps && psalmFull) ps.reference = psalmFull;
        setFeastLiturgy(p2);
      }
    } catch { /* silencioso */ }
    setIsLoadingFeast(false);
  };

  const fetchLiturgy = async (period: string) => {
    setIsLoadingLiturgy(true);
    const data = await geminiService.getLiturgyOfTheHours(period);
    if (!data) {
      alert("Não foi possível carregar a Liturgia das Horas. O limite de requisições pode ter sido atingido. Por favor, tente novamente em alguns instantes.");
    } else {
      setLiturgyData(data);
    }
    setIsLoadingLiturgy(false);
  };

  const togglePrayer = (id: string) => {
    const updated = prayers.map(p => p.id === id ? { ...p, completed: !p.completed } : p);
    setPrayers(updated);
    saveTodayDone(updated.filter(p => p.completed).map(p => p.id));
  };

  const addCustomPrayer = () => {
    if (!newPrayerName.trim()) return;
    const newP: PrayerItem = {
      id: `custom_${Date.now()}`,
      name: newPrayerName.trim(),
      period: newPrayerPeriod,
      completed: false,
      isCustom: true,
    };
    const existing = loadCustomPrayers();
    saveCustomPrayers([...existing, newP]);
    setPrayers(prev => [...prev, newP]);
    setNewPrayerName('');
    setShowAddModal(false);
  };

  const removeCustomPrayer = (id: string) => {
    const existing = loadCustomPrayers();
    saveCustomPrayers(existing.filter(p => p.id !== id));
    setPrayers(prev => {
      const updated = prev.filter(p => p.id !== id);
      saveTodayDone(updated.filter(p => p.completed).map(p => p.id));
      return updated;
    });
  };

  const sections = [
    { id: 'morning', label: 'Manhã', icon: Sun, color: 'text-amber-500' },
    { id: 'afternoon', label: 'Tarde', icon: Sunset, color: 'text-orange-500' },
    { id: 'night', label: 'Noite', icon: Moon, color: 'text-indigo-500' },
  ];

  const prayerDetails: Record<string, any> = {
    'Oferecimento do Dia': {
      text: "Senhor meu Deus, eu Vos ofereço todas as minhas orações, trabalhos, alegrias e sofrimentos deste dia, em união com o Coração de Vosso Filho Jesus Cristo, que continua a oferecer-Se a Vós na Eucaristia, pela salvação do mundo, em reparação dos pecados e pela conversão dos pecadores.",
      instructions: "Rezar logo ao acordar, colocando o dia nas mãos de Deus."
    },
    'Liturgia das Horas (Ofício das Leituras)': {
      isLiturgy: true,
      period: 'Ofício das Leituras',
      title: "Ofício das Leituras",
      description: "O Ofício das Leituras oferece ao povo de Deus, e principalmente aos que são consagrados ao Senhor de modo especial, uma mais abundante meditação da Sagrada Escritura e as mais belas páginas dos autores espirituais.",
      instructions: "Pode ser rezado em qualquer hora do dia, mas tradicionalmente abre o dia de oração."
    },
    'Liturgia das Horas (Laudes)': {
      isLiturgy: true,
      period: 'Laudes',
      title: "Laudes (Oração da Manhã)",
      description: "As Laudes são destinadas a santificar o tempo da manhã, como se vê por muitos de seus elementos. São a oração de louvor ao amanhecer, celebrando a Ressurreição de Cristo, o 'Sol que nasce do alto'.",
      instructions: "Rezar preferencialmente entre 6h e 9h da manhã."
    },
    'Liturgia das Horas (Hora Intermédia)': {
      isLiturgy: true,
      period: 'Hora Intermédia',
      title: "Hora Intermédia (Terça, Sexta ou Noa)",
      description: "A oração da Hora Intermédia (Terça às 9h, Sexta às 12h, Noa às 15h) visa santificar o trabalho e o decurso do dia, lembrando momentos da Paixão do Senhor e a descida do Espírito Santo.",
      instructions: "Rezar durante o dia, escolhendo uma das horas (9h, 12h ou 15h)."
    },
    'Liturgia das Horas (Vésperas)': {
      isLiturgy: true,
      period: 'Vésperas',
      title: "Vésperas (Oração da Tarde)",
      description: "As Vésperas celebram-se à tarde, quando já declina o dia, 'em ação de graças pelo que nos foi dado no dia ou pelo que fizemos com retidão'. Lembramos também a Redenção por meio da Cruz.",
      instructions: "Rezar ao entardecer, preferencialmente entre 17h e 19h."
    },
    'Angelus': {
      text: "V. O Anjo do Senhor anunciou a Maria. R. E Ela concebeu do Espírito Santo. Ave Maria... V. Eis a escrava do Senhor. R. Faça-se em mim segundo a vossa palavra. Ave Maria... V. E o Verbo se fez carne. R. E habitou entre nós. Ave Maria...",
      instructions: "Tradicionalmente rezado às 6h, 12h e 18h."
    },
    'Santo Rosário': {
      isRosary: true,
      instructions: "O Rosário é composto por quatro terços (Mistérios Gozosos, Luminosos, Dolorosos e Gloriosos).",
      mysteries: [
        { name: "Mistérios Gozosos (Segunda e Sábado)", events: ["A Anunciação", "A Visitação", "O Nascimento de Jesus", "A Apresentação no Templo", "A Perda e o Encontro no Templo"] },
        { name: "Mistérios Luminosos (Quinta-feira)", events: ["O Batismo no Jordão", "As Bodas de Caná", "O Anúncio do Reino", "A Transfiguração", "A Instituição da Eucaristia"] },
        { name: "Mistérios Dolorosos (Terça e Sexta)", events: ["A Agonia no Horto", "A Flagelação", "A Coroação de Espinhos", "Jesus carrega a Cruz", "A Crucificação"] },
        { name: "Mistérios Gloriosos (Quarta e Domingo)", events: ["A Ressurreição", "A Ascensão", "A Vinda do Espírito Santo", "A Assunção de Maria", "A Coroação de Maria"] }
      ],
      structure: [
        "Sinal da Cruz e Credo",
        "Pai Nosso e 3 Ave Marias (Fé, Esperança e Caridade)",
        "Glória ao Pai",
        "Anúncio do Mistério e Pai Nosso",
        "10 Ave Marias e Glória",
        "Jaculatória: 'Ó meu Jesus, perdoai-nos...'",
        "Salve Rainha (ao final)"
      ]
    },
    'Exame de Consciência': {
      isComplex: true,
      title: "Exame de Consciência (Noturno)",
      description: "O exame de consciência é um ato de revisão do dia diante de Deus, reconhecendo as graças recebidas e os pecados cometidos. É essencial para o crescimento espiritual e a preparação para a Confissão.",
      structure: [
        "Agradecimento: Agradecer a Deus pelos benefícios recebidos hoje.",
        "Petição: Pedir a luz do Espírito Santo para conhecer os próprios pecados.",
        "Revisão: Percorrer o dia (pensamentos, palavras, atos e omissões).",
        "Arrependimento: Pedir perdão a Deus (Ato de Contrição).",
        "Propósito: Decidir-se a melhorar com a ajuda da graça amanhã."
      ],
      instructions: "Fazer em silêncio antes de dormir."
    },
    'Oração da Noite (Completas)': {
      isLiturgy: true,
      period: 'Completas',
      title: "Oração da Noite (Completas)",
      description: "As Completas são a última oração do dia, feita antes do repouso noturno, para entregar o sono e a vida nas mãos do Criador.",
      instructions: "Rezar imediatamente antes de deitar-se."
    }
  };

  const handleSelectPrayer = (prayer: any) => {
    const details = prayerDetails[prayer.name] || {};
    setSelectedPrayer({ ...prayer, ...details });
    if (details.isLiturgy) {
      fetchLiturgy(details.period);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold">Ritmo de Oração</h2>
        <p className="text-[#1A1A1A]/60 italic">"Rezai sem cessar."</p>
      </header>

      <div className="bg-white p-6 rounded-[2rem] border border-[#1A1A1A]/5 shadow-sm">
        <button
          onClick={fetchMassLiturgy}
          className="w-full flex items-center justify-between p-4 bg-[#F5F2ED] rounded-2xl hover:bg-[#E6E6A0] transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl text-[#5A5A40] group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-lg">Liturgia Diária Missa</h3>
                {todayLit.celebrationName && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-wide">
                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                    {todayLit.celebrationName.split(' — ')[0]}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#1A1A1A]/40 mt-0.5">{todayLit.seasonLabel} · Ano {todayLit.liturgicalYear}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`hidden sm:inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold border ${COLOR_MAP[todayLit.color] || COLOR_MAP.branco}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${COLOR_DOT[todayLit.color] || COLOR_DOT.branco}`} />
              {todayLit.color.charAt(0).toUpperCase() + todayLit.color.slice(1)}
            </span>
            <ChevronRight className="w-5 h-5 text-[#5A5A40]/40" />
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {sections.map((section) => {
          const Icon = section.icon;
          const sectionPrayers = prayers.filter(p => p.period === section.id);
          const completedCount = sectionPrayers.filter(p => p.completed).length;

          return (
            <div key={section.id} className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${section.color}`} />
                  <h3 className="font-bold text-lg">{section.label}</h3>
                </div>
                <span className="text-xs font-bold text-[#5A5A40] bg-[#5A5A40]/10 px-2 py-1 rounded-lg">
                  {completedCount}/{sectionPrayers.length}
                </span>
              </div>

              <div className="space-y-3">
                {sectionPrayers.map((prayer) => (
                  <div key={prayer.id} className="group relative">
                    <button
                      onClick={() => handleSelectPrayer(prayer)}
                      className={`
                        w-full flex items-center justify-between p-5 rounded-2xl border transition-all text-left pr-14
                        ${prayer.completed 
                          ? 'bg-[#F5F2ED]/50 border-[#5A5A40]/10 opacity-60' 
                          : 'bg-white border-[#1A1A1A]/5 hover:border-[#5A5A40]/30 shadow-sm'}
                      `}
                    >
                      <span className={`font-medium ${prayer.completed ? 'line-through' : ''}`}>
                        {prayer.name}
                      </span>
                    </button>
                    {/* Botão de concluir */}
                    <button 
                      onClick={() => togglePrayer(prayer.id)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-[#1A1A1A]/10 hover:text-[#5A5A40] transition-colors"
                    >
                      <CheckCircle2 className={`w-6 h-6 ${prayer.completed ? 'text-[#5A5A40]' : ''}`} />
                    </button>
                    {/* Botão de remover (apenas orações personalizadas) */}
                    {prayer.isCustom && (
                      <button
                        onClick={() => removeCustomPrayer(prayer.id)}
                        title="Remover oração"
                        className="absolute right-12 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                
                <button
                  onClick={() => setShowAddModal(true)}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-dashed border-[#1A1A1A]/10 text-[#1A1A1A]/40 hover:text-[#5A5A40] hover:border-[#5A5A40]/30 transition-all text-sm font-bold"
                >
                  <Plus className="w-4 h-4" /> Adicionar Oração
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Prayer Detail Modal */}
      <AnimatePresence>
        {selectedPrayer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPrayer(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-[#1A1A1A]/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#F5F2ED] rounded-2xl text-[#5A5A40]">
                    <Scroll className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{selectedPrayer.name}</h3>
                    <p className="text-xs text-[#5A5A40] font-sans uppercase tracking-widest">Guia de Oração</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedPrayer(null)}
                  className="p-2 hover:bg-[#F5F2ED] rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                {selectedPrayer.isLiturgy ? (
                  <div className="space-y-8">
                    <div className="p-8 bg-[#F5F2ED] rounded-[2rem] border border-[#5A5A40]/10">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-3">O que é</h4>
                      <p className="text-lg leading-relaxed text-[#1A1A1A]/80 font-serif italic">
                        {selectedPrayer.description}
                      </p>
                    </div>

                    {isLoadingLiturgy ? (
                      <div className="py-20 flex flex-col items-center justify-center text-[#5A5A40]/40 space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin" />
                        <p className="font-serif italic">Buscando a Liturgia do dia...</p>
                      </div>
                    ) : liturgyData ? (
                      <div className="space-y-10">
                        <div className="text-center space-y-2">
                          <h4 className="text-2xl font-serif italic text-[#5A5A40]">{liturgyData.title}</h4>
                          <div className="h-px w-24 bg-[#5A5A40]/20 mx-auto" />
                        </div>

                        {liturgyData.sections.map((section: any, i: number) => (
                          <div key={i} className="space-y-4">
                            <div className="flex items-center gap-4">
                              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5A5A40] whitespace-nowrap">
                                {section.name}
                              </span>
                              <div className="h-px flex-1 bg-[#5A5A40]/10" />
                            </div>
                            <div className="bg-[#F5F2ED]/50 p-6 rounded-3xl border border-[#5A5A40]/5">
                              <p className="text-lg leading-relaxed text-[#1A1A1A]/80 font-serif whitespace-pre-wrap">
                                {section.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-[#1A1A1A]/40 italic py-8">Não foi possível carregar a liturgia. Tente novamente.</p>
                    )}

                    {selectedPrayer.instructions && (
                      <div className="p-6 border border-[#5A5A40]/20 rounded-2xl">
                        <h4 className="font-bold text-[#5A5A40] mb-2 text-sm uppercase tracking-widest">Instruções</h4>
                        <p className="text-sm text-[#1A1A1A]/60">{selectedPrayer.instructions}</p>
                      </div>
                    )}
                  </div>
                ) : selectedPrayer.isRosary ? (
                  <div className="space-y-8">
                    <div className="bg-[#F5F2ED] p-6 rounded-2xl">
                      <h4 className="font-bold text-[#5A5A40] mb-4 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" /> Como Rezar
                      </h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        {selectedPrayer.structure.map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ol>
                    </div>
                    <div className="space-y-6">
                      <h4 className="font-bold text-[#5A5A40] uppercase tracking-widest text-xs">Mistérios do Rosário</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedPrayer.mysteries.map((m: any, i: number) => (
                          <div key={i} className="p-5 bg-white border border-[#1A1A1A]/5 rounded-2xl shadow-sm">
                            <h5 className="font-bold text-sm mb-3 text-[#5A5A40]">{m.name}</h5>
                            <ul className="space-y-1">
                              {m.events.map((e: string, j: number) => (
                                <li key={j} className="text-xs text-[#1A1A1A]/60 flex items-start gap-2">
                                  <span className="text-[#5A5A40]">•</span> {e}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-6 bg-[#5A5A40] text-white rounded-2xl">
                      <h4 className="font-bold mb-2">Jaculatória Sugerida</h4>
                      <p className="italic text-sm">"Ó meu Jesus, perdoai-nos, livrai-nos do fogo do inferno, levai as almas todas para o céu e socorrei principalmente as que mais precisarem."</p>
                    </div>
                  </div>
                ) : selectedPrayer.isComplex ? (
                  <div className="space-y-8">
                    <div className="p-8 bg-[#F5F2ED] rounded-[2rem] border border-[#5A5A40]/10">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-3">O que é</h4>
                      <p className="text-lg leading-relaxed text-[#1A1A1A]/80 font-serif italic">
                        {selectedPrayer.description}
                      </p>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] px-2">Estrutura da Oração</h4>
                      <div className="space-y-3">
                        {selectedPrayer.structure.map((s: string, i: number) => (
                          <div key={i} className="flex items-start gap-4 p-4 bg-white border border-[#1A1A1A]/5 rounded-2xl shadow-sm">
                            <div className="w-6 h-6 rounded-full bg-[#5A5A40]/10 text-[#5A5A40] flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                              {i + 1}
                            </div>
                            <p className="text-sm font-medium text-[#1A1A1A]/80">{s}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedPrayer.instructions && (
                      <div className="p-6 border border-[#5A5A40]/20 rounded-2xl">
                        <h4 className="font-bold text-[#5A5A40] mb-2 text-sm uppercase tracking-widest">Instruções</h4>
                        <p className="text-sm text-[#1A1A1A]/60">{selectedPrayer.instructions}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="bg-[#F5F2ED] p-8 rounded-2xl italic text-xl leading-relaxed text-[#1A1A1A]/80 text-center">
                      "{selectedPrayer.text || "Conteúdo da oração em breve..."}"
                    </div>
                    {selectedPrayer.instructions && (
                      <div className="p-6 border border-[#5A5A40]/20 rounded-2xl">
                        <h4 className="font-bold text-[#5A5A40] mb-2 text-sm uppercase tracking-widest">Instruções</h4>
                        <p className="text-sm text-[#1A1A1A]/60">{selectedPrayer.instructions}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mass Liturgy Modal */}
      <AnimatePresence>
        {isReadingMass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsReadingMass(false); setMassLiturgy(null); }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            >
              <div className="p-6 border-b border-[#1A1A1A]/5 bg-[#F5F2ED]/30">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl font-bold">{massLiturgy?.title || 'Liturgia Diária'}</h3>
                    {massLiturgy?.feast?.name
                      ? <p className="text-xs text-amber-600 font-bold uppercase tracking-widest mt-0.5">⭐ {massLiturgy.feast.type}: {massLiturgy.feast.name}</p>
                      : <p className="text-xs text-[#1A1A1A]/40 uppercase tracking-widest font-bold mt-0.5">Missa do Dia</p>
                    }
                  </div>
                  <button onClick={() => { setIsReadingMass(false); setMassLiturgy(null); setViewingFeastLiturgy(false); setFeastLiturgy(null); }} className="p-2 hover:bg-white rounded-full transition-colors flex-shrink-0"><X className="w-6 h-6" /></button>
                </div>
                {/* Informações litúrgicas — motor litúrgico, sem rede */}
                <div className="mt-4 pt-4 border-t border-[#1A1A1A]/8 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${COLOR_MAP[todayLit.color] || COLOR_MAP.branco}`}>
                    <span className={`w-2 h-2 rounded-full ${COLOR_DOT[todayLit.color] || COLOR_DOT.branco}`} />
                    {todayLit.color.charAt(0).toUpperCase() + todayLit.color.slice(1)}
                  </span>
                  <span className="text-xs text-[#1A1A1A]/50 font-sans font-bold uppercase tracking-widest">{todayLit.season}</span>
                  <span className="text-xs text-[#1A1A1A]/40 font-sans">{todayLit.seasonLabel}</span>
                  <span className="text-xs text-[#5A5A40] font-bold font-sans">Ano {todayLit.liturgicalYear} · Ciclo {todayLit.ferialCycle}</span>
                </div>

              </div>
              <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                {isLoadingLiturgy ? (
                  <div className="h-64 flex flex-col items-center justify-center text-[#5A5A40]/40 space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin" />
                    <p className="font-serif italic">Buscando a Liturgia da Missa...</p>
                  </div>
                ) : massLiturgy?.readings ? (
                  <div className="space-y-8">
                    {/* Feast option banner */}
                    {massLiturgy?.feast?.name && !viewingFeastLiturgy && (
                      <div className="flex items-center justify-between p-5 bg-amber-50 border border-amber-200 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <Star className="w-5 h-5 text-amber-500 fill-amber-400 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-amber-600">{massLiturgy.feast.type}</p>
                            <p className="font-bold text-amber-800">{massLiturgy.feast.name}</p>
                            <p className="text-xs text-amber-600 mt-0.5">Esta celebração pode ter leituras próprias.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => fetchFeastLiturgy(massLiturgy.feast.name, massLiturgy.feast.type)}
                          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors">
                          Ver Liturgia <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {/* Feast specific readings */}
                    {viewingFeastLiturgy && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                            <span className="font-bold text-amber-800 text-sm">{massLiturgy?.feast?.name} — Leituras Próprias</span>
                          </div>
                          <button onClick={() => { setViewingFeastLiturgy(false); setFeastLiturgy(null); }}
                            className="text-xs text-amber-600 font-bold hover:underline flex items-center gap-1">
                            <X className="w-3 h-3" /> Ver Liturgia do Dia
                          </button>
                        </div>
                        {isLoadingFeast ? (
                          <div className="py-12 flex flex-col items-center space-y-3 text-[#5A5A40]/40">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <p className="italic font-serif">Buscando leituras da festa...</p>
                          </div>
                        ) : feastLiturgy?.readings ? (
                          <div className="space-y-8">
                            {feastLiturgy.readings.map((reading: any, idx: number) => (
                              <div key={idx} className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{idx + 1}</div>
                                  <h4 className="text-lg font-bold text-amber-700">{reading.type}</h4>
                                </div>
                                <ReadingBlock reading={reading} bgClass="bg-amber-50" borderClass="border-amber-200" titleClass="text-amber-700/60" />
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )}
                    {/* Regular daily readings */}
                    {!viewingFeastLiturgy && massLiturgy.readings.map((reading: any, idx: number) => (
                      <div key={idx} className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#5A5A40] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{idx + 1}</div>
                          <h4 className="text-lg font-bold text-[#5A5A40]">{reading.type}</h4>
                        </div>
                        <ReadingBlock reading={reading} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <p className="text-[#1A1A1A]/40 italic">Não foi possível carregar a liturgia de hoje.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Modal: Adicionar Oração */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Nova Oração</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-[#F5F2ED] rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] block mb-1">Nome da Oração</label>
                  <input
                    type="text"
                    value={newPrayerName}
                    onChange={e => setNewPrayerName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCustomPrayer()}
                    placeholder="Ex: Coroa das Sete Dores..."
                    autoFocus
                    className="w-full px-4 py-3 bg-[#F5F2ED] rounded-2xl border-none focus:ring-2 focus:ring-[#5A5A40]/20 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] block mb-1">Período</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'morning',   label: 'Manhã' },
                      { value: 'afternoon', label: 'Tarde' },
                      { value: 'night',     label: 'Noite' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setNewPrayerPeriod(opt.value)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${newPrayerPeriod === opt.value ? 'bg-[#5A5A40] text-white' : 'bg-[#F5F2ED] text-[#1A1A1A]/60 hover:bg-[#5A5A40]/10'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-2xl font-bold text-[#1A1A1A]/40 hover:bg-[#F5F2ED] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={addCustomPrayer}
                  disabled={!newPrayerName.trim()}
                  className="flex-1 py-3 bg-[#5A5A40] text-white rounded-2xl font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Adicionar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
