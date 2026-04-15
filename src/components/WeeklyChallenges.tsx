import React, { useState, useEffect } from 'react';
import { Calendar, Shield, Flame, Loader2, RefreshCw, CheckCircle2, Star, Clock } from 'lucide-react';

interface Challenge {
  title: string;
  saint: string;
  theme: string;
  description: string;
  tasks: string[];
  quote: string;
  liturgical_connection: string;
}

interface DailyChallenge {
  title: string;
  description: string;
  saint_connection: string;
  action: string;
  scripture: string;
}

const WEEKLY_KEY = 'weekly_challenge_cache';
const DAILY_KEY  = 'daily_challenge_cache';

// Cache diário: só é válido se foi gerado no mesmo dia (baseado em toDateString)
function getCache(key: string) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const p = JSON.parse(raw);
    const today = new Date().toDateString();
    if (key === WEEKLY_KEY) {
      // Semanal: válido apenas na mesma semana ISO (segunda a domingo)
      const savedDate = new Date(p.savedIso);
      const nowDate   = new Date();
      // Calcula a semana ISO das duas datas
      const isoWeek = (d: Date) => {
        const jan4 = new Date(d.getFullYear(), 0, 4);
        const week1Monday = new Date(jan4.getTime() - ((jan4.getDay() || 7) - 1) * 86400000);
        return Math.ceil((d.getTime() - week1Monday.getTime()) / (7 * 86400000)) + 1;
      };
      if (
        savedDate.getFullYear() === nowDate.getFullYear() &&
        isoWeek(savedDate) === isoWeek(nowDate)
      ) return p.data;
    } else {
      if (p.date === today) return p.data;
    }
  } catch { /* noop */ }
  return null;
}

function setCache(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify({
      date: new Date().toDateString(),
      savedIso: new Date().toISOString(),
      data,
    }));
  } catch { /* noop */ }
}

// Retorna data/hora atual formatada de forma explícita para o prompt
function nowLabel() {
  const d = new Date();
  const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long' });
  const day     = d.getDate();
  const month   = d.toLocaleDateString('pt-BR', { month: 'long' });
  const year    = d.getFullYear();
  return `${weekday}, ${day} de ${month} de ${year}`;
}

function nowWeekLabel() {
  const d = new Date();
  // Início da semana (segunda)
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  // Fim da semana (domingo)
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (dt: Date) => dt.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
  return `${fmt(monday)} a ${fmt(sunday)} de ${d.getFullYear()}`;
}

export default function WeeklyChallenges() {
  const [weeklyChallenge, setWeeklyChallenge] = useState<Challenge | null>(null);
  const [dailyChallenge, setDailyChallenge]   = useState<DailyChallenge | null>(null);
  const [completedTasks, setCompletedTasks]   = useState<number[]>([]);
  const [dailyDone, setDailyDone]             = useState(false);
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(false);
  const [isLoadingDaily, setIsLoadingDaily]   = useState(false);

  const fetchWeekly = async (force = false) => {
    const cached = !force && getCache(WEEKLY_KEY);
    if (cached) { setWeeklyChallenge(cached); return; }
    setIsLoadingWeekly(true);
    try {
      const semana = nowWeekLabel();
      const hoje   = nowLabel();
      const r = await fetch('/api/ai/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'Você é um director espiritual católico. Responda APENAS com JSON válido.' },
            { role: 'user', content: `HOJE É: ${hoje}
A SEMANA ATUAL É: ${semana}

Crie um desafio espiritual semanal para ESTA semana (${semana}), baseado na liturgia católica ATUAL deste período e num santo relevante para estes dias.
IMPORTANTE: use a data real acima. Não use datas passadas nem futuras.

JSON: {
  "title": "Título do Desafio Semanal",
  "saint": "Nome do Santo desta semana",
  "theme": "Tema espiritual central",
  "description": "Descrição do desafio e contexto espiritual (2-3 frases)",
  "tasks": ["Tarefa concreta 1", "Tarefa concreta 2", "Tarefa concreta 3", "Tarefa concreta 4"],
  "quote": "Uma frase do santo escolhido",
  "liturgical_connection": "Como este desafio se conecta com a liturgia desta semana atual"
}` }
          ],
          responseFormat: 'json', maxTokens: 800,
        })
      }).then(r => r.json());
      const clean = (r.text || '').replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const data = JSON.parse(clean);
      if (data.title) { setWeeklyChallenge(data); setCache(WEEKLY_KEY, data); }
    } catch { /* silencioso */ }
    setIsLoadingWeekly(false);
  };

  const fetchDaily = async (force = false) => {
    const cached = !force && getCache(DAILY_KEY);
    if (cached) { setDailyChallenge(cached); return; }
    setIsLoadingDaily(true);
    try {
      const hoje = nowLabel();
      const r = await fetch('/api/ai/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'Você é um director espiritual católico. Responda APENAS com JSON válido.' },
            { role: 'user', content: `HOJE É: ${hoje}

Crie um desafio espiritual diário para HOJE (${hoje}), alinhado com a liturgia católica DESTE dia específico e ensinamentos de um santo.
IMPORTANTE: use a data real acima. Consulte o calendário litúrgico atual para este dia.

JSON: {
  "title": "Título curto do desafio",
  "description": "Descrição do desafio (1-2 frases)",
  "saint_connection": "Nome do santo celebrado hoje ou do período litúrgico atual e conexão",
  "action": "Uma ação concreta e prática para hoje",
  "scripture": "Versículo bíblico relacionado com a liturgia de hoje (referência: texto)"
}` }
          ],
          responseFormat: 'json', maxTokens: 500,
        })
      }).then(r => r.json());
      const clean = (r.text || '').replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const data = JSON.parse(clean);
      if (data.title) { setDailyChallenge(data); setCache(DAILY_KEY, data); }
    } catch { /* silencioso */ }
    setIsLoadingDaily(false);
  };

  useEffect(() => {
    fetchWeekly();
    fetchDaily();
    try {
      // Tarefas semanais: reset automático se semana mudou
      const savedWeeklyKey = localStorage.getItem('weekly_tasks_week');
      const currentWeek = nowWeekLabel();
      if (savedWeeklyKey !== currentWeek) {
        localStorage.setItem('weekly_tasks_week', currentWeek);
        localStorage.removeItem('weekly_tasks_done');
      } else {
        const saved = localStorage.getItem('weekly_tasks_done');
        if (saved) setCompletedTasks(JSON.parse(saved));
      }
      // Desafio diário
      const savedDaily = localStorage.getItem('daily_challenge_done');
      if (savedDaily === new Date().toDateString()) setDailyDone(true);
    } catch { /* noop */ }
  }, []);

  const toggleTask = (i: number) => {
    const next = completedTasks.includes(i)
      ? completedTasks.filter(t => t !== i)
      : [...completedTasks, i];
    setCompletedTasks(next);
    try {
      localStorage.setItem('weekly_tasks_done', JSON.stringify(next));
      localStorage.setItem('weekly_tasks_week', nowWeekLabel());
    } catch { /* noop */ }
  };

  const completeDaily = () => {
    setDailyDone(true);
    try { localStorage.setItem('daily_challenge_done', new Date().toDateString()); } catch { /* noop */ }
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold">Desafios Espirituais</h2>
        <p className="text-[#1A1A1A]/60 italic">"Combati o bom combate, terminei a corrida, guardei a fé."</p>
      </header>

      {/* Desafio do Dia */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#5A5A40]" />
            Desafio do Dia
          </h3>
          <button onClick={() => fetchDaily(true)} disabled={isLoadingDaily}
            className="flex items-center gap-1 text-xs text-[#5A5A40] font-bold hover:underline disabled:opacity-40">
            <RefreshCw className={`w-3 h-3 ${isLoadingDaily ? 'animate-spin' : ''}`} /> Novo
          </button>
        </div>

        {isLoadingDaily ? (
          <div className="bg-white p-8 rounded-[2rem] border border-[#1A1A1A]/5 flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#5A5A40]/40" />
          </div>
        ) : dailyChallenge ? (
          <div className={`p-8 rounded-[2rem] border transition-all ${dailyDone ? 'bg-green-50 border-green-200' : 'bg-white border-[#1A1A1A]/5 shadow-sm'}`}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-500">Hoje</span>
                </div>
                <h4 className="text-xl font-bold">{dailyChallenge.title}</h4>
                <p className="text-xs text-[#5A5A40] font-bold mt-1">{dailyChallenge.saint_connection}</p>
              </div>
              {dailyDone && (
                <div className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                  <CheckCircle2 className="w-3 h-3" /> Concluído
                </div>
              )}
            </div>
            <p className="text-[#1A1A1A]/70 mb-4">{dailyChallenge.description}</p>
            <div className="p-4 bg-[#F5F2ED] rounded-2xl mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-1">Ação Concreta</p>
              <p className="text-sm font-medium">{dailyChallenge.action}</p>
            </div>
            {dailyChallenge.scripture && (
              <p className="text-sm italic text-[#1A1A1A]/50">"{dailyChallenge.scripture}"</p>
            )}
            {!dailyDone && (
              <button onClick={completeDaily}
                className="mt-6 w-full py-3 bg-[#5A5A40] text-white rounded-2xl font-bold hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Marcar como Concluído
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-[2rem] border border-dashed border-[#1A1A1A]/10 text-center">
            <p className="text-[#1A1A1A]/40 italic text-sm">Não foi possível carregar o desafio de hoje.</p>
            <button onClick={() => fetchDaily(true)} className="mt-3 text-sm text-[#5A5A40] font-bold hover:underline">Tentar novamente</button>
          </div>
        )}
      </section>

      {/* Desafio Semanal */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#5A5A40]" />
            Desafio Semanal
          </h3>
          <button onClick={() => fetchWeekly(true)} disabled={isLoadingWeekly}
            className="flex items-center gap-1 text-xs text-[#5A5A40] font-bold hover:underline disabled:opacity-40">
            <RefreshCw className={`w-3 h-3 ${isLoadingWeekly ? 'animate-spin' : ''}`} /> Novo
          </button>
        </div>

        {isLoadingWeekly ? (
          <div className="bg-white p-8 rounded-[2rem] border border-[#1A1A1A]/5 flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#5A5A40]/40" />
          </div>
        ) : weeklyChallenge ? (
          <div className="relative overflow-hidden p-8 lg:p-12 rounded-[3rem] border bg-white border-[#5A5A40] shadow-xl">
            <div className="absolute top-6 right-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-[#E6E6A0] text-[#5A5A40] rounded-full text-[10px] font-bold uppercase tracking-widest">
                <Flame className="w-3 h-3" /> Em Destaque
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-2xl bg-[#5A5A40] text-white">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{weeklyChallenge.title}</h3>
                    <p className="text-sm text-[#5A5A40] font-bold">{weeklyChallenge.saint}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-xs font-sans uppercase tracking-[0.2em] text-[#5A5A40] mb-2">Tema Espiritual</p>
                  <p className="text-xl font-serif italic">"{weeklyChallenge.theme}"</p>
                </div>

                <p className="text-[#1A1A1A]/70 mb-4">{weeklyChallenge.description}</p>

                {weeklyChallenge.liturgical_connection && (
                  <div className="p-4 bg-[#F5F2ED] rounded-2xl mb-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-1">Conexão Litúrgica</p>
                    <p className="text-sm text-[#1A1A1A]/70 italic">{weeklyChallenge.liturgical_connection}</p>
                  </div>
                )}

                {weeklyChallenge.quote && (
                  <div className="p-4 bg-[#5A5A40] text-white rounded-2xl">
                    <p className="italic text-sm">"{weeklyChallenge.quote}"</p>
                    <p className="text-xs text-white/50 mt-2 uppercase tracking-widest">— {weeklyChallenge.saint}</p>
                  </div>
                )}
              </div>

              <div className="bg-[#F5F2ED] p-8 rounded-[2rem]">
                <h4 className="font-bold mb-6 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#5A5A40]" />
                  Práticas Concretas
                  <span className="ml-auto text-xs font-normal text-[#5A5A40]">
                    {completedTasks.length}/{weeklyChallenge.tasks.length}
                  </span>
                </h4>
                <div className="space-y-3">
                  {weeklyChallenge.tasks.map((task, j) => (
                    <button key={j} onClick={() => toggleTask(j)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${completedTasks.includes(j) ? 'bg-[#5A5A40] text-white border-[#5A5A40]' : 'bg-white border-[#1A1A1A]/5 hover:border-[#5A5A40]/30'}`}>
                      <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${completedTasks.includes(j) ? 'border-white bg-white' : 'border-[#5A5A40]/30'}`}>
                        {completedTasks.includes(j) && <CheckCircle2 className="w-4 h-4 text-[#5A5A40]" />}
                      </div>
                      <span className={`text-sm font-medium ${completedTasks.includes(j) ? 'line-through opacity-70' : ''}`}>{task}</span>
                    </button>
                  ))}
                </div>

                {completedTasks.length === weeklyChallenge.tasks.length && weeklyChallenge.tasks.length > 0 && (
                  <div className="mt-4 p-4 bg-green-100 rounded-2xl text-center">
                    <Star className="w-6 h-6 text-green-600 mx-auto mb-1" />
                    <p className="text-sm font-bold text-green-700">Desafio semanal concluído!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-[2rem] border border-dashed border-[#1A1A1A]/10 text-center">
            <p className="text-[#1A1A1A]/40 italic text-sm">Não foi possível carregar o desafio semanal.</p>
            <button onClick={() => fetchWeekly(true)} className="mt-3 text-sm text-[#5A5A40] font-bold hover:underline">Tentar novamente</button>
          </div>
        )}
      </section>
    </div>
  );
}
