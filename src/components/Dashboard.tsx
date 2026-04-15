import React, { useEffect, useState } from 'react';
import { Flame, Star, BookOpen, Quote, Calendar, Bell, Shield, CheckCircle2 } from 'lucide-react';
import { TabType } from '../types';

// ── Versículos do dia (rotação por dia do ano) ──────────────────────────────
const DAILY_VERSES = [
  { text: "O Senhor é meu pastor, nada me faltará.", ref: "Salmo 23, 1" },
  { text: "Busquei o Senhor e ele me respondeu, livrou-me de todos os meus temores.", ref: "Salmo 34, 5" },
  { text: "Confia no Senhor de todo o teu coração e não te apoies no teu próprio entendimento.", ref: "Provérbios 3, 5" },
  { text: "Sede santos, porque Eu, o Senhor vosso Deus, sou santo.", ref: "Levítico 19, 2" },
  { text: "Eu sou o caminho, a verdade e a vida.", ref: "João 14, 6" },
  { text: "Bem-aventurados os puros de coração, porque verão a Deus.", ref: "Mateus 5, 8" },
  { text: "A caridade é paciente, é benigna; a caridade não é invejosa.", ref: "1 Coríntios 13, 4" },
  { text: "Tudo posso naquele que me conforta.", ref: "Filipenses 4, 13" },
  { text: "O fruto do Espírito é: caridade, alegria, paz, longanimidade, benignidade.", ref: "Gálatas 5, 22" },
  { text: "Vigiai e orai, para que não entreis em tentação.", ref: "Mateus 26, 41" },
  { text: "Deus é amor, e quem permanece no amor permanece em Deus.", ref: "1 João 4, 16" },
  { text: "Não tenhais medo, pois estou convosco; não vos perturbeis, pois sou vosso Deus.", ref: "Isaías 41, 10" },
  { text: "Pedi e dar-se-vos-á; buscai e achareis; batei e abrir-se-vos-á.", ref: "Mateus 7, 7" },
  { text: "O Senhor é minha luz e minha salvação; a quem temerei?", ref: "Salmo 27, 1" },
  { text: "Sede misericordiosos, como vosso Pai é misericordioso.", ref: "Lucas 6, 36" },
  { text: "Bem-aventurados os pacificadores, porque serão chamados filhos de Deus.", ref: "Mateus 5, 9" },
  { text: "Eis que estou à porta e bato; se alguém ouvir a minha voz e abrir a porta, entrarei.", ref: "Apocalipse 3, 20" },
  { text: "Amarás o Senhor teu Deus de todo o teu coração, de toda a tua alma e de todo o teu entendimento.", ref: "Mateus 22, 37" },
  { text: "Não me envergonho do Evangelho, pois é poder de Deus para salvação de todo crente.", ref: "Romanos 1, 16" },
  { text: "A paz de Deus, que excede todo o entendimento, guardará os vossos corações.", ref: "Filipenses 4, 7" },
  { text: "Eu vim para que tenham vida e a tenham em abundância.", ref: "João 10, 10" },
  { text: "Nada separa o homem do amor de Deus em Cristo Jesus, nosso Senhor.", ref: "Romanos 8, 39" },
  { text: "Eu sou a ressurreição e a vida; quem crê em mim, mesmo que morra, viverá.", ref: "João 11, 25" },
  { text: "Mas vós sois geração eleita, sacerdócio real, nação santa, povo adquirido por Deus.", ref: "1 Pedro 2, 9" },
  { text: "Sede fortes e animosos; não temais, nem vos atemorizeis diante deles.", ref: "Deuteronômio 31, 6" },
  { text: "Se alguém quer vir após mim, negue-se a si mesmo, tome a sua cruz e siga-me.", ref: "Mateus 16, 24" },
  { text: "Não vos conformeis com este século, mas transformai-vos pela renovação da vossa mente.", ref: "Romanos 12, 2" },
  { text: "Ainda que eu andasse pelo vale da sombra da morte, não temeria nenhum mal.", ref: "Salmo 23, 4" },
  { text: "Mais vale um dia nos teus átrios do que mil fora deles.", ref: "Salmo 84, 11" },
  { text: "Em tudo dai graças, porque esta é a vontade de Deus em Cristo Jesus.", ref: "1 Tessalonicenses 5, 18" },
  { text: "Sabemos que tudo coopera para o bem daqueles que amam a Deus.", ref: "Romanos 8, 28" },
];

// ── Pensamentos dos santos (rotação por dia do ano) ─────────────────────────
const DAILY_THOUGHTS = [
  { text: "Nada te turbe, nada te espante, tudo passa, Deus não muda.", author: "Santa Teresa de Ávila" },
  { text: "A medida do amor é amar sem medida.", author: "Santo Agostinho" },
  { text: "No entardecer da vida, seremos julgados pelo amor.", author: "São João da Cruz" },
  { text: "A santidade consiste em fazer a vontade de Deus com alegria.", author: "Santa Teresa de Calcutá" },
  { text: "Fazei tudo por amor, nada por força.", author: "São Francisco de Sales" },
  { text: "Onde não há amor, coloca amor e colherás amor.", author: "São João da Cruz" },
  { text: "Nosso coração está inquieto enquanto não repousa em Ti.", author: "Santo Agostinho" },
  { text: "A humildade é a raiz, a mãe, a nutriz e a base de todas as virtudes.", author: "São João Crisóstomo" },
  { text: "A oração é a respiração da alma.", author: "São Pio de Pietrelcina" },
  { text: "Não existe amor sem sacrifício.", author: "São João Paulo II" },
  { text: "Não tenhais medo! Abri, escancarai as portas a Cristo!", author: "São João Paulo II" },
  { text: "A misericórdia de Deus é maior do que todos os nossos pecados.", author: "Santa Faustina Kowalska" },
  { text: "O silêncio é a linguagem de Deus.", author: "São João da Cruz" },
  { text: "Senhor, tornai-me instrumento da Vossa paz.", author: "São Francisco de Assis" },
  { text: "Confiai em Deus, e nada vos faltará.", author: "São João Bosco" },
  { text: "Amai a Deus com todo o vosso coração e ao próximo como a vós mesmos.", author: "São Tomás de Aquino" },
  { text: "Quem não ora é como um soldado que vai à batalha sem armas.", author: "São Pio de Pietrelcina" },
  { text: "Cuida-te das pequenas coisas: é por elas que os grandes progridem.", author: "São Francisco de Sales" },
  { text: "A maior de todas as virtudes é a caridade; mas a base de todas é a humildade.", author: "São Tomás de Aquino" },
  { text: "Começar é fácil; o que importa é perseverar.", author: "Santa Catarina de Siena" },
  { text: "Deus não pede que tenhamos sucesso, mas que tentemos.", author: "Santa Teresa de Calcutá" },
  { text: "A contemplação é simplesmente o olhar de fé, fixado sobre Jesus.", author: "São João Maria Vianney" },
  { text: "O homem que reza é como aquele que tem uma vela acesa: ilumina e aquece.", author: "São João Maria Vianney" },
  { text: "Amarei a Deus porque Ele me amou primeiro.", author: "São Bernardo de Claraval" },
  { text: "Trabalha como se tudo dependesse de ti, reza como se tudo dependesse de Deus.", author: "Santo Inácio de Loyola" },
  { text: "A alma que tem Deus não lhe falta nada; só Deus basta.", author: "Santa Teresa de Ávila" },
  { text: "Se queres a paz, defende a vida.", author: "São João Paulo II" },
  { text: "Cristo é a resposta, qualquer que seja a pergunta.", author: "São João Paulo II" },
  { text: "A fé move montanhas porque fé é amor, e o amor é onipotente.", author: "São Pio de Pietrelcina" },
  { text: "Não há mal que não tenha remédio na bondade de Deus.", author: "Santa Faustina Kowalska" },
  { text: "Quando a alma não encontra nada mais belo que Deus, já chegou à perfeição.", author: "Santo Agostinho" },
];

// ── Virtudes do dia (rotação semanal) ───────────────────────────────────────
const WEEKLY_VIRTUES = [
  { name: "Humildade",      quote: "A humildade é a base de todas as outras virtudes no coração humano." },
  { name: "Paciência",      quote: "A paciência é o escudo contra todas as tempestades da vida." },
  { name: "Caridade",       quote: "O amor é a medida de tudo; amar sem medida é a perfeição." },
  { name: "Castidade",      quote: "A pureza de coração é a porta pela qual se vê a Deus." },
  { name: "Prudência",      quote: "A prudência é a virtude que guia todas as outras virtudes." },
  { name: "Fortaleza",      quote: "A fortaleza cristã vence o mundo, a carne e o demônio." },
  { name: "Justiça",        quote: "A justiça é o fundamento de toda ordem social e espiritual." },
];

// ── Helper: índice rotativo baseado na data ──────────────────────────────────
function getDayIndex(arr: unknown[]): number {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  return dayOfYear % arr.length;
}

function getWeekIndex(arr: unknown[]): number {
  const now = new Date();
  const week = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));
  return week % arr.length;
}

// ── Helper: lê chave do localStorage por usuário ─────────────────────────────
function getUserKey(base: string): string {
  try {
    const s = localStorage.getItem('caminho_session');
    const id = s ? JSON.parse(s).user?.id : 'anon';
    return `${base}_${id}`;
  } catch { return `${base}_anon`; }
}

function lsGet<T>(base: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(getUserKey(base));
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

// ── Componente ───────────────────────────────────────────────────────────────
export default function Dashboard({ setActiveTab }: { setActiveTab: (tab: TabType) => void }) {
  const [pendingSins, setPendingSins]       = useState(0);
  const [nextConfession, setNextConfession] = useState<string | null>(null);
  const [verse, setVerse]   = useState(DAILY_VERSES[0]);
  const [thought, setThought] = useState(DAILY_THOUGHTS[0]);
  const [virtue, setVirtue] = useState(WEEKLY_VIRTUES[0]);

  useEffect(() => {
    // Dados dinâmicos por data
    setVerse(DAILY_VERSES[getDayIndex(DAILY_VERSES)]);
    setThought(DAILY_THOUGHTS[getDayIndex(DAILY_THOUGHTS)]);
    setVirtue(WEEKLY_VIRTUES[getWeekIndex(WEEKLY_VIRTUES)]);

    // Pecados da lista privada
    const sins: { id: number }[] = lsGet('sins', []);
    setPendingSins(sins.length);

    // Próxima confissão do calendário
    const today = new Date().toISOString().split('T')[0];
    const dates: string[] = lsGet('confession_dates', []);
    const future = dates.filter(d => d >= today).sort();
    setNextConfession(future[0] || null);

    // Atualiza quando o usuário volta para a aba (visibilidade)
    const onFocus = () => {
      const updatedSins: { id: number }[] = lsGet('sins', []);
      setPendingSins(updatedSins.length);
      const updatedDates: string[] = lsGet('confession_dates', []);
      const f = updatedDates.filter(d => d >= today).sort();
      setNextConfession(f[0] || null);
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // Formata próxima confissão
  const nextConfessionLabel = nextConfession
    ? new Date(nextConfession + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    : 'Não agendada';

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#5A5A40] text-white p-8 lg:p-12 rounded-[2rem] shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-[#E6E6A0]" />
            <span className="text-xs font-sans uppercase tracking-[0.2em] text-[#E6E6A0]">Foco do Dia</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            {virtue.name}
          </h2>
          <p className="text-lg text-white/80 italic mb-8">
            "{virtue.quote}"
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setActiveTab('virtues')}
              className="px-6 py-3 bg-white text-[#5A5A40] rounded-full font-bold hover:bg-[#E6E6A0] transition-colors"
            >
              Praticar Agora
            </button>
            <button
              onClick={() => setActiveTab('challenges')}
              className="px-6 py-3 bg-white/10 border border-white/20 rounded-full font-bold hover:bg-white/20 transition-colors"
            >
              Ver Desafio
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <Shield className="w-full h-full transform translate-x-1/4 -translate-y-1/4" />
        </div>
      </section>

      {/* Grid Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Versículo do Dia */}
        <div className="bg-white p-8 rounded-[2rem] border border-[#1A1A1A]/5 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#F5F2ED] rounded-xl">
              <BookOpen className="w-5 h-5 text-[#5A5A40]" />
            </div>
            <h3 className="font-bold">Versículo do Dia</h3>
          </div>
          <p className="text-lg italic leading-relaxed mb-4">
            "{verse.text}"
          </p>
          <p className="text-xs text-[#5A5A40] font-sans uppercase tracking-widest">{verse.ref}</p>
        </div>

        {/* Pensamento dos Santos */}
        <div className="bg-white p-8 rounded-[2rem] border border-[#1A1A1A]/5 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#F5F2ED] rounded-xl">
              <Quote className="w-5 h-5 text-[#5A5A40]" />
            </div>
            <h3 className="font-bold">Pensamento</h3>
          </div>
          <p className="text-lg italic leading-relaxed mb-4">
            "{thought.text}"
          </p>
          <p className="text-xs text-[#5A5A40] font-sans uppercase tracking-widest">{thought.author}</p>
        </div>

        {/* Sacramentos */}
        <div className="bg-white p-8 rounded-[2rem] border border-[#1A1A1A]/5 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#F5F2ED] rounded-xl">
              <Calendar className="w-5 h-5 text-[#5A5A40]" />
            </div>
            <h3 className="font-bold">Sacramentos</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#1A1A1A]/60">Pecados pendentes</span>
              <span className={`px-2 py-1 rounded-lg text-xs font-bold ${pendingSins > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                {pendingSins}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#1A1A1A]/60">Próxima Confissão</span>
              <span className="text-sm font-bold">{nextConfessionLabel}</span>
            </div>
            <button
              onClick={() => setActiveTab('confession')}
              className="w-full mt-2 py-3 bg-[#F5F2ED] text-[#5A5A40] rounded-xl font-bold text-sm hover:bg-[#E6E6A0] transition-colors"
            >
              Preparar Exame
            </button>
          </div>
        </div>
      </div>

      {/* Prayer Reminders */}
      <section className="bg-white p-8 rounded-[2rem] border border-[#1A1A1A]/5 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#F5F2ED] rounded-xl">
              <Bell className="w-5 h-5 text-[#5A5A40]" />
            </div>
            <h3 className="text-xl font-bold">Ritmo de Oração</h3>
          </div>
          <button
            onClick={() => setActiveTab('prayers')}
            className="text-sm text-[#5A5A40] font-bold hover:underline"
          >
            Ver Tudo
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Oferecimento do Dia', time: 'Manhã', done: false },
            { name: 'Angelus', time: '12:00', done: false },
            { name: 'Santo Rosário', time: 'Tarde', done: false },
          ].map((prayer, i) => (
            <div key={i} className={`p-4 rounded-2xl border flex items-center justify-between ${prayer.done ? 'bg-[#F5F2ED]/50 border-[#5A5A40]/10' : 'bg-white border-[#1A1A1A]/5'}`}>
              <div>
                <p className={`font-bold ${prayer.done ? 'text-[#1A1A1A]/40 line-through' : ''}`}>{prayer.name}</p>
                <p className="text-xs text-[#1A1A1A]/40 uppercase tracking-widest">{prayer.time}</p>
              </div>
              <button className={`p-2 rounded-full ${prayer.done ? 'text-[#5A5A40]' : 'text-[#1A1A1A]/20 hover:text-[#5A5A40]'}`}>
                <CheckCircle2 className="w-6 h-6" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
