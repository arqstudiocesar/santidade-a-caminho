import { getTodayLiturgicalSummary } from './liturgicalEngine';

/**
 * groqService.ts
 * Substitui o geminiService.ts — usa a API da Groq via proxy no servidor (/api/ai/generate)
 * para não expor a chave de API no frontend.
 *
 * Estratégia de rate limiting / quota:
 *  - Cache diário   → dados que mudam por dia (liturgia, insight da virtude)
 *  - Cache estático → dados imutáveis (versículos bíblicos)
 *  - Fila de requisições → 1 req por vez, com intervalo mínimo de 800 ms
 *  - Retry com back-off exponencial em caso de erro 429
 */

// ── Helpers de cache ──────────────────────────────────────────────────────────

const dailyCache: Record<string, { date: string; data: any }> = (() => {
  try {
    const raw = JSON.parse(localStorage.getItem('groq_daily_cache') || '{}');
    // Invalida cache salvo com referências placeholder (geradas antes do lecionário pascal ser completo).
    // Placeholder começa com "Lecionário Ferial" — são referências genéricas, não escriturísticas.
    if (raw['mass_liturgy']?.data?.readings) {
      const firstRef: string = raw['mass_liturgy'].data.readings[0]?.reference || '';
      if (firstRef.startsWith('Lecionário Ferial')) {
        delete raw['mass_liturgy'];
        localStorage.setItem('groq_daily_cache', JSON.stringify(raw));
      }
    }
    return raw;
  }
  catch { return {}; }
})();

const staticCache: Record<string, any> = (() => {
  try { return JSON.parse(localStorage.getItem('groq_static_cache') || '{}'); }
  catch { return {}; }
})();

const persistDaily = () => {
  try { localStorage.setItem('groq_daily_cache', JSON.stringify(dailyCache)); }
  catch { /* storage cheio — ignora */ }
};

const persistStatic = () => {
  try { localStorage.setItem('groq_static_cache', JSON.stringify(staticCache)); }
  catch { /* storage cheio — ignora */ }
};

/**
 * Retorna a data local no formato YYYY-MM-DD considerando o fuso do usuário.
 * Usa o mesmo cálculo do PrayerRoutine.tsx para garantir que a chave seja
 * idêntica em ambos os lugares — evita o bug onde o cache nunca bate.
 */
function getTodayKey(): string {
  // Usa America/Sao_Paulo como referência fixa para todos os usuários no Brasil.
  // Isso é consistente com getBrazilDateKey() no PrayerRoutine.tsx e garante
  // que o cache do groqService e do PrayerRoutine sempre usem a mesma chave.
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); // YYYY-MM-DD
}

const getCachedDaily = (key: string): any | null => {
  const today = getTodayKey();
  const entry = dailyCache[key];
  return entry && entry.date === today ? entry.data : null;
};

const setCachedDaily = (key: string, data: any) => {
  dailyCache[key] = { date: getTodayKey(), data };
  persistDaily();
};

const getCachedStatic = (key: string) => staticCache[key] ?? null;
const setCachedStatic = (key: string, data: any) => {
  staticCache[key] = data;
  persistStatic();
};

// ── Fila de requisições ───────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const queue: Array<() => Promise<void>> = [];
let processing = false;
let lastReq = 0;
const MIN_INTERVAL = 800; // ms entre requisições

async function processQueue() {
  if (processing || queue.length === 0) return;
  processing = true;
  while (queue.length > 0) {
    const elapsed = Date.now() - lastReq;
    if (elapsed < MIN_INTERVAL) await sleep(MIN_INTERVAL - elapsed);
    lastReq = Date.now();
    await queue.shift()!();
  }
  processing = false;
}

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    queue.push(async () => {
      try { resolve(await fn()); }
      catch (e) { reject(e); }
    });
    processQueue();
  });
}

// ── Chamada ao proxy do servidor ──────────────────────────────────────────────

interface AIRequest {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  responseFormat?: 'json' | 'text';
  maxTokens?: number;
}

async function callAI(req: AIRequest, retries = 4): Promise<string> {
  return enqueue(async () => {
    let lastError: any;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const res = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          if (res.status === 429 && attempt < retries - 1) {
            const delay = Math.pow(2, attempt) * 2000 + Math.random() * 1000;
            console.warn(`[Groq] Rate limit — tentando novamente em ${Math.round(delay)}ms`);
            await sleep(delay);
            continue;
          }
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        return data.text ?? '';
      } catch (err: any) {
        lastError = err;
        if (attempt < retries - 1) {
          await sleep(Math.pow(2, attempt) * 1500);
        }
      }
    }
    throw lastError;
  });
}

function parseJSON<T>(text: string, fallback: T): T {
  try {
    // Remove possíveis marcadores markdown ```json ... ```
    const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(clean) as T;
  } catch {
    return fallback;
  }
}

// ── API pública ───────────────────────────────────────────────────────────────



export const groqService = {

  /**
   * Reflexão espiritual diária com base na virtude em foco e no desafio.
   */
  async getDailyInsight(virtue: string, challenge: string) {
    const key = `insight_${virtue}_${challenge}`;
    const cached = getCachedDaily(key);
    if (cached) return cached;

    try {
      const text = await callAI({
        messages: [
          {
            role: 'system',
            content: 'Você é um sábio diretor espiritual católico. Responda APENAS com JSON válido, sem nenhum texto antes ou depois.',
          },
          {
            role: 'user',
            content: `O usuário está focado na virtude: "${virtue}". O desafio de hoje: "${challenge}".
Forneça uma reflexão espiritual breve (máx. 3 frases) e uma frase de um santo que se aplique.
JSON: { "reflection": "...", "saintQuote": "...", "saintName": "..." }`,
          },
        ],
        responseFormat: 'json',
        maxTokens: 400,
      });
      const result = parseJSON(text, {} as any);
      if (result.reflection) setCachedDaily(key, result);
      return result;
    } catch (e) {
      console.error('[groqService] getDailyInsight:', e);
      return null;
    }
  },

  /**
   * Guia completo de Lectio Divina para uma passagem bíblica.
   */
  async getLectioDivinaGuide(passage: string) {
    try {
      const text = await callAI({
        messages: [
          {
            role: 'system',
            content: 'Você é um guia espiritual católico especialista em Lectio Divina. Responda APENAS com JSON válido.',
          },
          {
            role: 'user',
            content: `Guie uma Lectio Divina para: "${passage.slice(0, 800)}".
Divida em 5 etapas seguindo a tradição católica.
JSON: { "leitura": "...", "meditacao": "...", "oracao": "...", "contemplacao": "...", "acao": "..." }`,
          },
        ],
        responseFormat: 'json',
        maxTokens: 1000,
      });
      return parseJSON(text, {} as any);
    } catch (e) {
      console.error('[groqService] getLectioDivinaGuide:', e);
      return null;
    }
  },

  /**
   * Busca versículos bíblicos. Para a tradução "Almeida Revisada Corrigida"
   * tenta primeiro a API pública bible-api.com (gratuita, sem chave).
   * Para as demais traduções, usa IA com cache agressivo.
   */
  async getBibleVerses(
    book: string,
    chapter: number,
    translation: string,
    startVerse?: number,
    endVerse?: number,
  ): Promise<{ verses: Array<{ num: number; text: string }> }> {
    const cacheKey = `v_${book}_${chapter}_${translation}_${startVerse}_${endVerse}`;
    const cached = getCachedStatic(cacheKey);
    if (cached) return cached;

    // ── Tenta a API pública para Almeida ──────────────────────────────────────
    if (translation === 'Bíblia Almeida Revisada Corrigida' || translation === 'arc') {
      try {
        const englishBook = PT_TO_EN_BOOK[book] || book;
        let ref = `${englishBook}+${chapter}`;
        if (startVerse && endVerse) ref += `:${startVerse}-${endVerse}`;
        else if (startVerse) ref += `:${startVerse}-999`;

        const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=almeida`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.verses?.length) {
            const result = {
              verses: data.verses.map((v: any) => ({
                num: v.verse,
                text: v.text.trim(),
              })),
            };
            setCachedStatic(cacheKey, result);
            return result;
          }
        }
      } catch {
        /* falha silenciosa — cai para IA */
      }
    }

    // ── IA para demais traduções ───────────────────────────────────────────────
    try {
      let range = `todos os versículos do capítulo ${chapter}`;
      if (startVerse && endVerse) range = `versículos ${startVerse} a ${endVerse} do capítulo ${chapter}`;
      else if (startVerse) range = `versículos a partir do ${startVerse} do capítulo ${chapter}`;

      const text = await callAI({
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista bíblico. Forneça o texto bíblico exato e preciso conforme a tradução solicitada. Responda APENAS com JSON válido.',
          },
          {
            role: 'user',
            content: `Forneça os ${range} do livro de ${book} na tradução "${translation}".
JSON: { "verses": [ { "num": 1, "text": "..." }, ... ] }`,
          },
        ],
        responseFormat: 'json',
        maxTokens: 2000,
      });
      const result = parseJSON(text, { verses: [] });
      if (result.verses?.length) setCachedStatic(cacheKey, result);
      return result;
    } catch (e) {
      console.error('[groqService] getBibleVerses:', e);
      return { verses: [] };
    }
  },

  /**
   * Busca passagens bíblicas por palavra-chave, referência ou tema.
   */
  async searchBible(query: string): Promise<{ results: Array<{ reference: string; text: string; book: string; chapter: number; verse: number }> }> {
    try {
      const text = await callAI({
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista bíblico. Responda APENAS com JSON válido.',
          },
          {
            role: 'user',
            content: `Busque na Bíblia Católica por: "${query}".
Retorne até 10 resultados mais relevantes (referência, texto do versículo, livro, capítulo, versículo).
JSON: { "results": [ { "reference": "João 3:16", "text": "...", "book": "João", "chapter": 3, "verse": 16 }, ... ] }`,
          },
        ],
        responseFormat: 'json',
        maxTokens: 1500,
      });
      return parseJSON(text, { results: [] });
    } catch (e) {
      console.error('[groqService] searchBible:', e);
      return { results: [] };
    }
  },

  /**
   * Liturgia das Horas para o período solicitado (cacheada por dia).
   */
  async getLiturgyOfTheHours(period: string) {
    const key = `liturgy_${period}`;
    const cached = getCachedDaily(key);
    if (cached) return cached;

    try {
      const today = new Date().toLocaleDateString('pt-BR');
      const text = await callAI({
        messages: [
          {
            role: 'system',
            content: 'Você é especialista em Liturgia das Horas da Igreja Católica. Responda APENAS com JSON válido.',
          },
          {
            role: 'user',
            content: `Forneça a Liturgia das Horas para hoje (${today}), período: ${period}.
Inclua: Invitatório, Hino, Salmodia, Leitura Breve, Responsório, Cântico, Preces, Pai Nosso, Oração Final.
JSON: { "title": "...", "sections": [ { "name": "...", "content": "..." }, ... ] }`,
          },
        ],
        responseFormat: 'json',
        maxTokens: 2000,
      });
      const result = parseJSON(text, null);
      if (result?.title) setCachedDaily(key, result);
      return result;
    } catch (e) {
      console.error('[groqService] getLiturgyOfTheHours:', e);
      return null;
    }
  },

  /**
   * Leituras da Missa Diária.
   * Prioridade:
   *  1. Cache válido (com validação por referência do motor litúrgico)
   *  2. Claude API com web search via /api/claude-liturgy  (textos reais da web)
   *  3. Scraping Canção Nova via /api/liturgy-today
   *  4. Groq/Llama com referências exatas do motor + contexto web como fallback final
   */
  async getDailyMassLiturgy(tzOffsetMinutes?: number) {
    // Usa o offset do navegador para calcular a data local correta.
    // Se não informado, calcula automaticamente a partir do fuso do ambiente.
    const _tz = tzOffsetMinutes !== undefined ? tzOffsetMinutes : -new Date().getTimezoneOffset();
    // ── 1. Cache bloqueado por dia: se já existe liturgia válida hoje, usa sem questionar ──
    const cached = getCachedDaily('mass_liturgy');
    if (cached?.readings?.length >= 2) {
      // Garante que feast_checked seja marcado para evitar futura invalidação
      if (!cached.feast_checked) {
        cached.feast_checked = true;
        setCachedDaily('mass_liturgy', cached);
      }
      return cached;
    }

    try {
      // ── 2. Motor litúrgico: referências determinísticas ──────────────────
      const lit = getTodayLiturgicalSummary(_tz);
      const { datePT, dateISO, liturgicalYear, ferialCycle, season, seasonLabel,
        celebrationName, celebrationRank, hasProperReadings, readings, feastReadings, color } = lit;
      const useR = (hasProperReadings && feastReadings) ? feastReadings : readings;
      const isFeast = !!celebrationName && celebrationRank !== 'ferial';
      const psalmFull = useR.psalmAntiphon ? `${useR.psalm} — ${useR.psalmAntiphon}` : useR.psalm;

      // Constrói título completo da leitura a partir do tipo + referência + primeiro parágrafo do texto
      const buildReadingTitle = (type: string, reference: string, text: string): string => {
        // Extrair a primeira linha do texto que contenha "Leitura" ou "Proclamação"
        const lines = (text || '').split('\n');
        const headerLine = lines.find(l => 
          l.trim().startsWith('Leitura') || 
          l.trim().startsWith('Proclamação') ||
          l.trim().startsWith('Responsório')
        );
        if (headerLine && headerLine.trim().length > 5) {
          const h = headerLine.trim();
          // Se a referência já está no cabeçalho, retornar como está
          if (reference && h.includes(reference.split(',')[0])) return h;
          // Senão, acrescentar referência
          return reference ? `${h} (${reference})` : h;
        }
        // Fallback: construir a partir do tipo e referência
        if (type.includes('Evangelho')) return reference ? `Evangelho de Jesus Cristo (${reference})` : 'Evangelho';
        if (type.includes('Salmo')) return reference ? `Responsório — ${reference}` : 'Salmo Responsorial';
        if (type.includes('2ª')) return reference ? `Segunda Leitura (${reference})` : '2ª Leitura';
        return reference ? `Primeira Leitura (${reference})` : '1ª Leitura';
      };

      const buildResult = (readingsList: any[]) => ({
        title: `Liturgia Diária — ${datePT}`,
        feast_checked: true,
        season,
        liturgical_year: liturgicalYear,
        color,
        feast: isFeast ? { name: celebrationName, type: celebrationRank } : undefined,
        readings: readingsList,
      });

      const applyEngineRefs = (rawReadings: any[]) => rawReadings.map((sr: any) => {
        const ref =
          sr.type.includes('1ª') ? (useR.firstReading || sr.reference) :
          sr.type.includes('Salmo') ? (psalmFull || sr.reference) :
          sr.type.includes('2ª') ? (useR.secondReading || sr.reference) :
          (sr.type.toLowerCase().includes('vangelho') || sr.type.includes('Evangelho'))
            ? (useR.gospel || sr.reference) : sr.reference;
        return {
          type: sr.type,
          reference: ref,
          title: buildReadingTitle(sr.type, ref, sr.text || ''),
          text: sr.text,
        };
      });

      // Valida se o Salmo Responsorial do scraping está no formato correto.
      // O Salmo deve conter "R." (antífona de resposta). Se não tiver, o scraping
      // misturou texto de outro salmo — nesse caso descartamos e usamos a IA.
      const isPsalmValid = (readings: any[]): boolean => {
        const psalm = readings.find((r: any) => (r.type || '').includes('Salmo'));
        if (!psalm) return true;
        const text: string = psalm.text || '';
        return text.includes('R.') || text.includes('R ') || text.length < 50;
      };

      // ── 3. Claude API com web search ─────────────────────────────────────
      try {
        const rC = await fetch(`/api/claude-liturgy?tz=${_tz}`);
        const dC = await rC.json();
        if (dC.success && dC.data?.readings?.length >= 2) {
          const corrected = applyEngineRefs(dC.data.readings);
          // Só usa se o Salmo estiver no formato responsorial correto
          if (isPsalmValid(corrected)) {
            const result = buildResult(corrected);
            setCachedDaily('mass_liturgy', result);
            return result;
          }
        }
      } catch { /* continuar */ }

      // ── 4. Scraping Canção Nova ──────────────────────────────────────────
      let webText = '';
      try {
        const rS = await fetch(`/api/liturgy-today?tz=${_tz}`);
        const dS = await rS.json();
        if (dS.success) {
          if (dS.structured?.readings?.length >= 2) {
            const corrected = applyEngineRefs(dS.structured.readings);
            // Só usa se o Salmo estiver no formato responsorial correto
            if (isPsalmValid(corrected)) {
              const result = buildResult(corrected);
              setCachedDaily('mass_liturgy', result);
              return result;
            }
          }
          if (dS.text?.length > 300) webText = dS.text.slice(0, 6000);
        }
      } catch { /* continuar */ }

      // ── 5. Groq/Llama com referências exatas + contexto web ──────────────
      const refs = [
        useR.firstReading && `1ª Leitura: ${useR.firstReading}`,
        psalmFull && `Salmo Responsorial: ${psalmFull}`,
        useR.secondReading && `2ª Leitura: ${useR.secondReading}`,
        useR.gospel && `Evangelho: ${useR.gospel}`,
      ].filter(Boolean).join('\n');

      const webCtx = webText
        ? `\n\nTEXTO DO SITE OFICIAL (cancaonova.com) — use para extrair os textos das leituras:\n${webText}\n\nIMPORTANTE: Copie os textos DO SITE acima. NÃO invente versículos.`
        : '';

      const userMsg = `Data: ${datePT} (${dateISO})
${isFeast ? `CELEBRAÇÃO: ${celebrationRank.toUpperCase()} — ${celebrationName}` : `${seasonLabel} — Ciclo ${ferialCycle}, Ano ${liturgicalYear}`}

REFERÊNCIAS EXATAS (Lecionário Romano oficial):
${refs}${webCtx}

INSTRUÇÕES OBRIGATÓRIAS:
1. Forneça o texto COMPLETO e EXATO de cada leitura conforme a Bíblia de Jerusalém.
2. Para a 1ª Leitura: inclua o cabeçalho "Leitura do Livro de [livro]." e todos os versículos.
3. Para o Salmo: a referência exata é "${psalmFull||useR.psalm}". Use SOMENTE os versículos desse salmo específico. Formato OBRIGATÓRIO: primeira linha "R. [antífona responsorial]", depois as estrofes dos versículos indicados, com "R." repetido após cada estrofe. NUNCA use versículos de outro salmo.
4. Para o Evangelho: inclua "Proclamação do Evangelho de Jesus Cristo segundo [evangelista]." e o texto integral.
5. NÃO abrevie com "..." nem omita versículos. Mínimo 6 versículos por leitura.

JSON:
{
  "title": "Liturgia Diária — ${datePT}",
  "feast_checked": true,
  "season": "${season}",
  "liturgical_year": "${liturgicalYear}",
  "color": "${color}",
  ${isFeast ? `"feast": {"name": "${(celebrationName||'').replace(/"/g,"'")}","type": "${celebrationRank}"},` : ''}
  "readings": [
    {"type": "1ª Leitura", "reference": "${useR.firstReading}", "text": "Leitura do Livro de ...\n\n[texto completo]"},
    {"type": "Salmo Responsorial", "reference": "${psalmFull||useR.psalm}", "text": "R. [antífona]\n\n1. [estrofe]\n\nR. [antífona]"},
    ${useR.secondReading ? `{"type": "2ª Leitura", "reference": "${useR.secondReading}", "text": "[texto completo]"},` : ''}
    {"type": "Evangelho", "reference": "${useR.gospel}", "text": "Proclamação do Evangelho...\n\n[texto completo]"}
  ]
}`;

      const text = await callAI({
        messages: [
          { role: 'system', content: 'Você é especialista em Liturgia Católica e Bíblia de Jerusalém. Forneça textos bíblicos COMPLETOS, PRECISOS e FIÉIS ao original. Responda APENAS com JSON válido.' },
          { role: 'user', content: userMsg },
        ],
        responseFormat: 'json',
        maxTokens: 4500,
      });

      const result2 = parseJSON(text, null);
      if (result2?.readings) {
        result2.feast_checked = true;
        const ps = result2.readings.find((r: any) => r.type?.toLowerCase().includes('salmo'));
        if (ps && psalmFull) ps.reference = psalmFull;
        setCachedDaily('mass_liturgy', result2);
        return result2;
      }

      // Fallback final: referências sem texto
      return buildResult([
        useR.firstReading && { type: '1ª Leitura', reference: useR.firstReading, title: `Primeira Leitura (${useR.firstReading})`, text: 'Texto não disponível. Verifique sua conexão.' },
        psalmFull && { type: 'Salmo Responsorial', reference: psalmFull, title: `Responsório — ${psalmFull}`, text: 'Texto não disponível.' },
        useR.secondReading && { type: '2ª Leitura', reference: useR.secondReading, title: `Segunda Leitura (${useR.secondReading})`, text: 'Texto não disponível.' },
        useR.gospel && { type: 'Evangelho', reference: useR.gospel, title: `Evangelho (${useR.gospel})`, text: 'Texto não disponível.' },
      ].filter(Boolean) as any[]);

    } catch (e) {
      console.error('[groqService] getDailyMassLiturgy:', e);
      return null;
    }
  },
};

// ── Mapeamento de nomes de livros PT → EN (para bible-api.com) ────────────────
const PT_TO_EN_BOOK: Record<string, string> = {
  'Gênesis': 'genesis', 'Êxodo': 'exodus', 'Levítico': 'leviticus',
  'Números': 'numbers', 'Deuteronômio': 'deuteronomy', 'Josué': 'joshua',
  'Juízes': 'judges', 'Rute': 'ruth', '1 Samuel': '1samuel', '2 Samuel': '2samuel',
  '1 Reis': '1kings', '2 Reis': '2kings', '1 Crônicas': '1chronicles',
  '2 Crônicas': '2chronicles', 'Esdras': 'ezra', 'Neemias': 'nehemiah',
  'Ester': 'esther', 'Jó': 'job', 'Salmos': 'psalms', 'Provérbios': 'proverbs',
  'Eclesiastes': 'ecclesiastes', 'Cântico dos Cânticos': 'song of solomon',
  'Isaías': 'isaiah', 'Jeremias': 'jeremiah', 'Lamentações': 'lamentations',
  'Ezequiel': 'ezekiel', 'Daniel': 'daniel', 'Oseias': 'hosea', 'Joel': 'joel',
  'Amós': 'amos', 'Abdias': 'obadiah', 'Jonas': 'jonah', 'Miqueias': 'micah',
  'Naum': 'nahum', 'Habacuc': 'habakkuk', 'Sofonias': 'zephaniah',
  'Ageu': 'haggai', 'Zacarias': 'zechariah', 'Malaquias': 'malachi',
  'Mateus': 'matthew', 'Marcos': 'mark', 'Lucas': 'luke', 'João': 'john',
  'Atos': 'acts', 'Romanos': 'romans', '1 Coríntios': '1corinthians',
  '2 Coríntios': '2corinthians', 'Gálatas': 'galatians', 'Efésios': 'ephesians',
  'Filipenses': 'philippians', 'Colossenses': 'colossians',
  '1 Tessalonicenses': '1thessalonians', '2 Tessalonicenses': '2thessalonians',
  '1 Timóteo': '1timothy', '2 Timóteo': '2timothy', 'Tito': 'titus',
  'Filémon': 'philemon', 'Hebreus': 'hebrews', 'Tiago': 'james',
  '1 Pedro': '1peter', '2 Pedro': '2peter', '1 João': '1john',
  '2 João': '2john', '3 João': '3john', 'Judas': 'jude', 'Apocalipse': 'revelation',
  // Deuterocanônicos (não disponíveis na bible-api.com — usará IA)
  'Tobias': 'tobit', 'Judite': 'judith', '1 Macabeus': '1maccabees',
  '2 Macabeus': '2maccabees', 'Sabedoria': 'wisdom', 'Eclesiástico': 'sirach',
  'Baruc': 'baruch',
};

// Retrocompatibilidade: exporta geminiService como alias
export const geminiService = groqService;
