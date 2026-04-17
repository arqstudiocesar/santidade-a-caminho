import React, { useEffect, useState } from 'react';
import { Flame, Star, BookOpen, Quote, Calendar, Bell, Shield, CheckCircle2, Cross } from 'lucide-react';
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

// ── Intenção de Oração por Dia da Semana ────────────────────────────────────
const DAILY_INTENTIONS = [
  // 0 = domingo
  { icon: '✝️', title: 'Ressurreição do Senhor',    desc: 'Reze pela alegria da Ressurreição e a vida da Igreja.' },
  { icon: '🕊️', title: 'Almas do Purgatório e Espírito Santo', desc: 'Reze pelas almas do purgatório e pela ação do Espírito Santo.' },
  { icon: '👼', title: 'Santos Anjos',              desc: 'Reze pelos Santos Anjos, especialmente ao seu Anjo da Guarda.' },
  { icon: '⚒️', title: 'São José',                  desc: 'Reze pela intercessão de São José, padroeiro da Igreja universal.' },
  { icon: '🍞', title: 'Eucaristia e Sacerdócio',   desc: 'Reze pela Eucaristia e pelos sacerdotes da Igreja.' },
  { icon: '✠',  title: 'Paixão de Cristo',          desc: 'Medite a Paixão de Cristo e reze pelas almas que sofrem.' },
  { icon: '🌹', title: 'Nossa Senhora',              desc: 'Reze o Rosário e consagre-se ao Imaculado Coração de Maria.' },
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

// ── Tipos para sincronização com PrayerRoutine ────────────────────────────────
interface PrayerItem {
  id: string;
  name: string;
  period: string;
  completed: boolean;
}

const DEFAULT_PRAYERS: PrayerItem[] = [
  { id: '1', name: 'Oferecimento do Dia', period: 'morning', completed: false },
  { id: '2', name: 'Liturgia das Horas (Ofício das Leituras)', period: 'morning', completed: false },
  { id: '3', name: 'Liturgia das Horas (Laudes)', period: 'morning', completed: false },
  { id: '4', name: 'Angelus', period: 'afternoon', completed: false },
  { id: '5', name: 'Liturgia das Horas (Hora Intermédia)', period: 'afternoon', completed: false },
  { id: '6', name: 'Santo Rosário', period: 'afternoon', completed: false },
  { id: '7', name: 'Liturgia das Horas (Vésperas)', period: 'afternoon', completed: false },
  { id: '8', name: 'Exame de Consciência', period: 'night', completed: false },
  { id: '9', name: 'Oração da Noite (Completas)', period: 'night', completed: false },
];

function loadPrayers(): PrayerItem[] {
  try {
    const today = new Date().toDateString();
    const key = getUserKey('prayer_routine');
    const raw = localStorage.getItem(key);
    if (!raw) return DEFAULT_PRAYERS;
    const parsed = JSON.parse(raw);
    // Verifica se é do dia atual
    if (parsed.date !== today) return DEFAULT_PRAYERS;
    return parsed.prayers || DEFAULT_PRAYERS;
  } catch {
    return DEFAULT_PRAYERS;
  }
}

// ── Componente ───────────────────────────────────────────────────────────────
export default function Dashboard({ setActiveTab }: { setActiveTab: (tab: TabType) => void }) {
  const [pendingSins, setPendingSins]       = useState(0);
  const [nextConfession, setNextConfession] = useState<string | null>(null);
  const [verse, setVerse]   = useState(DAILY_VERSES[0]);
  const [thought, setThought] = useState(DAILY_THOUGHTS[0]);
  const [virtue, setVirtue] = useState(WEEKLY_VIRTUES[0]);
  const [prayers, setPrayers] = useState<PrayerItem[]>(DEFAULT_PRAYERS);

  // Intenção do dia da semana (domingo=0 ... sábado=6)
  const todayIntention = DAILY_INTENTIONS[new Date().getDay()];

  const loadData = () => {
    setVerse(DAILY_VERSES[getDayIndex(DAILY_VERSES)]);
    setThought(DAILY_THOUGHTS[getDayIndex(DAILY_THOUGHTS)]);
    setVirtue(WEEKLY_VIRTUES[getWeekIndex(WEEKLY_VIRTUES)]);

    const sins: { id: number }[] = lsGet('sins', []);
    setPendingSins(sins.length);

    const today = new Date().toISOString().split('T')[0];
    const dates: string[] = lsGet('confession_dates', []);
    const future = dates.filter(d => d >= today).sort();
    setNextConfession(future[0] || null);

    // Sincroniza orações do Ritmo de Oração
    setPrayers(loadPrayers());
  };

  useEffect(() => {
    loadData();
    const onFocus = () => loadData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // Formata próxima confissão
  const nextConfessionLabel = nextConfession
    ? new Date(nextConfession + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    : 'Não agendada';

  // Orações concluídas e próximas pendentes
  const completedPrayers = prayers.filter(p => p.completed);
  const pendingPrayers   = prayers.filter(p => !p.completed);
  const nextTwoPending   = pendingPrayers.slice(0, 2);
  // Mostra: as concluídas + as 2 próximas pendentes, max 3 cards
  const displayPrayers = [...completedPrayers, ...nextTwoPending].slice(0, 3);

  return (
    <div className="space-y-8">

      {/* ── Intenção de Oração do Dia ── */}
      <section className="bg-white p-6 rounded-[2rem] border border-[#1A1A1A]/5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-[#F5F2ED] rounded-xl">
            <Cross className="w-5 h-5 text-[#5A5A40]" />
          </div>
          <div>
            <p className="text-[10px] font-sans uppercase tracking-[0.15em] text-[#5A5A40] font-bold">
              O que a Igreja nos convida a rezar hoje
            </p>
            <h3 className="font-bold text-lg leading-tight">{todayIntention.icon} {todayIntention.title}</h3>
          </div>
        </div>
        <p className="text-sm text-[#1A1A1A]/60 italic ml-1">{todayIntention.desc}</p>
      </section>

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

      {/* Prayer Reminders — sincronizado com Ritmo de Oração */}
      <section className="bg-white p-8 rounded-[2rem] border border-[#1A1A1A]/5 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#F5F2ED] rounded-xl">
              <Bell className="w-5 h-5 text-[#5A5A40]" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Ritmo de Oração</h3>
              <p className="text-xs text-[#1A1A1A]/40 mt-0.5">
                {completedPrayers.length}/{prayers.length} concluídas hoje
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('prayers')}
            className="text-sm text-[#5A5A40] font-bold hover:underline"
          >
            Ver Tudo
          </button>
        </div>

        {displayPrayers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayPrayers.map((prayer) => (
              <div
                key={prayer.id}
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  prayer.completed
                    ? 'bg-[#F5F2ED]/50 border-[#5A5A40]/10'
                    : 'bg-white border-[#1A1A1A]/5'
                }`}
              >
                <div>
                  <p className={`font-bold text-sm ${prayer.completed ? 'text-[#1A1A1A]/40 line-through' : ''}`}>
                    {prayer.name}
                  </p>
                  <p className="text-xs text-[#1A1A1A]/40 uppercase tracking-widest mt-0.5">
                    {prayer.period === 'morning' ? 'Manhã' : prayer.period === 'afternoon' ? 'Tarde' : 'Noite'}
                  </p>
                </div>
                <CheckCircle2
                  className={`w-6 h-6 flex-shrink-0 ml-3 ${prayer.completed ? 'text-[#5A5A40]' : 'text-[#1A1A1A]/15'}`}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#1A1A1A]/40 italic text-center py-4">
            Todas as orações do dia foram concluídas! 🙏
          </p>
        )}

        {pendingPrayers.length === 0 && prayers.some(p => p.completed) && (
          <p className="text-center text-xs text-[#5A5A40] font-bold mt-4 uppercase tracking-widest">
            ✓ Todas as orações concluídas hoje
          </p>
        )}
      </section>
    </div>
  );
}
