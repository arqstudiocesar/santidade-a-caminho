import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2, AlertCircle, Info, List, Book, Heart, Trash2, Plus, X,
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Wind, Save, CheckSquare, Square, RotateCcw } from 'lucide-react';
import { Sin, ConfessionPurpose } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../contexts/AuthContext';

export default function ConfessionGuide() {
  const [sins, setSins] = useState<Sin[]>([]);
  const [purposes, setPurposes] = useState<ConfessionPurpose[]>([]);
  const [newSin, setNewSin] = useState('');
  const [newPurpose, setNewPurpose] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [confessionDates, setConfessionDates] = useState<string[]>(['2026-03-15', '2026-04-12']);
  const [checklist, setChecklist] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [customModels, setCustomModels] = useState<any[]>([]);
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [newModelQuestions, setNewModelQuestions] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [isChecklistSaved, setIsChecklistSaved] = useState(false);
  const [selectedActOfContrition, setSelectedActOfContrition] = useState(0);
  // purposes state
  const [selectedPurposeIds, setSelectedPurposeIds] = useState<number[]>([]);
  const [purposeSelectMode, setPurposeSelectMode] = useState(false);
  const [isClearingPurposes, setIsClearingPurposes] = useState(false);
  // sins select mode
  const [selectedSinIds, setSelectedSinIds] = useState<number[]>([]);
  const [sinSelectMode, setSinSelectMode] = useState(false);

  const steps = [
    { title: 'Invocação', icon: Wind, description: 'Invoque o Espírito Santo para iluminar sua consciência.' },
    { title: 'Exame', icon: List, description: 'Reveja suas ações à luz dos mandamentos e virtudes.' },
    { title: 'Arrependimento', icon: Heart, description: 'Desperte a dor sincera por ter ofendido a Deus.' },
    { title: 'Propósito', icon: Shield, description: 'Faça o firme propósito de não mais pecar.' },
    { title: 'Confissão', icon: CheckCircle2, description: 'Apresente seus pecados ao sacerdote com humildade.' },
  ];

  const actsOfContrition = [
    {
      title: 'Modelo Simples (Resumido)',
      text: 'Senhor Jesus, Filho de Deus vivo, tende misericórdia de mim, pecador. Arrependo-me de todos os meus pecados e peço vosso perdão. Amém.',
    },
    {
      title: 'Modelo Breve (Tradicional)',
      text: 'Meu Deus, porque sois infinitamente bom e Vos amo de todo o meu coração, pesa-me de Vos ter ofendido, e com o auxílio da vossa graça proponho firmemente não mais pecar e fugir das ocasiões de pecado. Amém.',
    },
    {
      title: 'Modelo Completo (Solene)',
      text: 'Senhor meu Jesus Cristo, Deus e homem verdadeiro, Criador, Pai e Redentor meu; por ser Vós quem sois, bondade infinita, e porque Vos amo sobre todas as coisas, pesa-me de todo o meu coração de Vos ter ofendido; também me pesa porque podeis castigar-me com as penas do inferno. Ajudado pela vossa Divina Graça, proponho firmemente nunca mais pecar, confessar-me e cumprir a penitência que me for imposta. E confio que, por vossos infinitos méritos, me haveis de perdoar e dar a graça de vos amar cada vez mais, até consumar-me no Vosso amor na vida eterna. Amém.',
    },
  ];

  const invocationPrayers = [
    {
      title: 'Veni Sancte Spiritus',
      text: 'Vinde, Espírito Santo, enchei os corações dos vossos fiéis e acendei neles o fogo do Vosso amor.\nEnviai o Vosso Espírito e todas as coisas serão criadas, e renovareis a face da terra.\nÓ Deus, que instruístes os corações dos vossos fiéis com a luz do Espírito Santo, fazei que apreciemos retamente todas as coisas segundo o mesmo Espírito e gozemos sempre da sua consolação divina. Por Cristo Nosso Senhor. Amém.',
    },
    {
      title: 'Oração para iluminar a consciência',
      text: 'Senhor Jesus Cristo, luz do mundo, iluminai-me agora com a claridade do Vosso Espírito Santo. Que Ele penetre nos recantos mais obscuros da minha alma, para que eu possa ver com clareza os meus pecados, reconhecer minhas faltas e imperfeições com humildade, e me arrepender sinceramente de tudo aquilo que ofendeu a Vós, ao meu próximo e a mim mesmo. Que este exame de consciência me disponha para uma confissão boa, verdadeira e frutífera. Amém.',
    },
    {
      title: 'Oração a Nossa Senhora antes da Confissão',
      text: 'Ó Maria, Mãe de Misericórdia, intercedei por mim junto ao Vosso Filho Jesus. Obtende-me a graça de um coração contrito, de um exame de consciência sincero e de uma confissão completa e humilde. Amparai-me com Vossa intercessão maternal, para que eu saia da confissão purificado(a) e renovado(a) na graça de Deus. Amém.',
    },
    {
      title: 'Ato de Humildade antes do Exame',
      text: 'Senhor, não sou digno(a) de levantar os olhos ao Céu, pois pequei gravemente contra Vós. Mas olhai a minha miséria e a Vossa misericórdia. Iluminai meu entendimento para reconhecer os meus pecados; meu coração para sentir deles verdadeiro arrependimento; minha vontade para propor firmemente não tornar a cometê-los. Amém.',
    },
  ];

  const confessionTips = [
    { title: 'O que é necessário para uma confissão válida', items: [
      'Exame de consciência honesto e completo',
      'Dor e arrependimento sinceros pelos pecados (contrição)',
      'Firme propósito de não pecar mais e evitar as ocasiões de pecado',
      'Confissão oral e completa de todos os pecados mortais (espécie e número)',
      'Cumprimento da penitência imposta pelo sacerdote',
    ]},
    { title: 'Como confessar bem', items: [
      'Seja conciso, concreto e completo (espécie e número: "menti 3 vezes")',
      'Não conte histórias, justificativas ou culpe terceiros',
      'Mencione circunstâncias que agravem o pecado (se relevantes)',
      'Ouça com atenção os conselhos e a penitência do padre',
      'Reze o Ato de Contrição com sinceridade durante a absolvição',
      'Em caso de dúvida, mencione ao padre: ele orientará',
    ]},
  ];

  const examModels: Record<string, string[]> = {
    'Pe. Duarte Lara — Para Jovens': ["1º MANDAMENTO — Adorar a Deus e amá-Lo sobre todas as coisas\nProcuro aumentar a minha fé e o meu amor a Deus Nosso Senhor? Rezo todos os dias ao levantar e ao deitar? Deixei de confessar pecados graves na confissão por vergonha? Comunguei sabendo que estava em pecado mortal? Respeitei o tempo do jejum (não tomar alimentos durante uma hora) antes de comungar? Pratiquei a superstição, magia, ou o espiritismo?", "2º MANDAMENTO — Não invocar o Santo nome de Deus em vão\nFalei sem respeito do nome de Deus, de Nossa Senhora, dos Santos, da Igreja, dos sacerdotes e das coisas sagradas? Jurei sem necessidade, e tenho esse mau costume? Fiz juramentos falsos? Fiz alguma promessa a Deus Nosso Senhor ou aos Santos, que ainda não cumpri?", "3º MANDAMENTO — Santificar os Domingos e festas de Guarda\nFaltei à Missa ao Domingo ou festa de Guarda por culpa minha? Creio em tudo o que a Santa Igreja Católica ensina? Confessei-me e comunguei ao menos uma vez ao ano?", "4º MANDAMENTO — Honrar pai e mãe e os outros legítimos superiores\nObedeci de boa vontade aos meus pais e às pessoas mais velhas? Disse mal deles ou tratei-os sem respeito? Entristeci-os com alguma coisa má que fiz? Procuro deixar arrumadas as minhas coisas? Estudo a sério em casa e na escola, reparando no esforço que os meus pais fazem por mim? Deixo-me levar pelo mau génio ou aborreço-me muitas vezes sem grandes motivos? Zanguei-me com os meus irmãos? Fui teimoso? Sou egoísta com as minhas coisas e custa-me emprestá-las aos meus irmãos? Rezei pelos meus pais, irmãos, familiares e companheiros?", "5º MANDAMENTO — Não matar nem causar dano no corpo ou na alma a si mesmo ou ao próximo\nProcurei não fazer troça dos outros, não brigar e não fazer sofrer ninguém? Zanguei-me quando perdi algum jogo, ou soube aceitar com alegria a derrota? Perdoei as ofensas que me fizeram? Atendi com delicadeza os meus irmãos, os meus companheiros, os meus amigos, as pessoas que me servem? Tenho inveja dos outros? Dei sempre bom exemplo, sem fazer pecar os outros? Venci o mau génio e o orgulho? Embriaguei-me ou tomei drogas? Preocupei-me pelo bem do próximo, avisando-o de algum grave perigo? Dei do meu dinheiro alguma esmola para os pobres?", "6º e 9º MANDAMENTOS — Guardar castidade nas palavras, obras, pensamentos e desejos\nProcurei afastar imediatamente todos os pensamentos desonestos? Consenti neles? Fiz ações desonestas, sozinho ou acompanhado? Tive conversas desonestas? Assisti a diversões que me colocaram em ocasião de pecar: filmes indecentes, certas festas, leituras, revistas ou companhias? Sou cuidadoso ao escolher os programas da TV?", "7º e 10º MANDAMENTOS — Não furtar nem injustamente reter os bens do próximo. Não cobiçar.\nRespeitei as coisas dos outros, não tirando nem querendo tirar dinheiro ou qualquer coisa a ninguém? Devolvi as coisas que me emprestaram ou encontrei? Estraguei por querer as minhas coisas ou as dos outros? Gastei mal o dinheiro que me deram? Joguei lealmente, sem fazer batota?", "8º MANDAMENTO — Não levantar falsos testemunhos nem de qualquer modo faltar à verdade\nDisse sempre a verdade? Quando não digo a verdade é por vaidade, para parecer mais do que sou, ou por cobardia? Minto habitualmente, dizendo que são coisas de pouca importância? Falei mal dos outros sem ser verdade? Deitei, com mentiras, as culpas para os outros? Falei sem necessidade das faltas dos outros? Julguei as ações dos outros com superficialidade? Descobri segredos? Copiei nos exames?"],
    'Pe. Duarte Lara — Para Adultos': ["1º MANDAMENTO — Adorar a Deus e amá-Lo sobre todas as coisas\nDuvidei voluntariamente da existência de Deus Pai, Filho e Espírito Santo? Me rebelei contra Deus em meus sofrimentos? Deixei-me levar pelo desespero? Tive ódio de Deus? Esperei alcançar o Céu sem querer abandonar o pecado? Cometi pecados no intuito de confessá-los mais tarde, abusando da Misericórdia de Deus? Tenho orado diariamente com atenção e devoção? Frequentei os sacramentos de má vontade? Leio e medito na Palavra de Deus? Coloquei minha vontade, dinheiro, trabalho, prazer ou fama em primeiro lugar na minha vida? Adorei ou invoquei Satanás? Pratiquei a magia, o espiritismo, fui à bruxa, a médiuns, ou curandeiros? Pratiquei adivinhação: astrologia, tarô, pêndulo, leitura da palma da mão? Acreditei em horóscopos? Usei amuletos (ferradura, chifre, figas, cristais)? Acreditei nas energias, Nova Era, reencarnação, ou Reiki?", "2º MANDAMENTO — Não invocar o santo nome de Deus em vão\nBlasfemei ou falei sem respeito contra Deus, contra os Santos ou as coisas santas? Falei mal da Igreja, do Papa, dos Bispos ou dos Padres? Pronunciei levianamente o Nome de Deus, de Jesus, de Maria ou algum santo em anedotas? Jurei sabendo que era falso? Jurei fazer algo injusto ou ilícito? Roguei pragas a alguém? Deixei de cumprir algum voto ou promessa feita a Deus ou a um santo?", "3º MANDAMENTO — Santificar os domingos e festas de guarda\nFaltei à Missa no domingo ou em algum dia santo? Cheguei tarde à Missa por culpa própria? Trabalhei ou mandei trabalhar nesses dias sem grave necessidade? Dediquei, nesses dias, mais tempo a Deus, à família, aos pobres e ao descanso?", "4º MANDAMENTO — Honrar pai e mãe e os demais legítimos superiores\nExpresso a meus pais o devido amor, gratidão e respeito? Os ajudo espiritual e materialmente? Os abandone i na velhice ou na doença? Tenho transmitido a fé para meus filhos? Dei-lhes maus exemplos? Usei palavras duras com meu esposo(a)? Obedeço à Igreja, ou discuto seus preceitos? Mantive a abstinência de carne nas sextas-feiras? Guardei o jejum na Quarta-feira de Cinzas e Sexta-feira Santa? Confessei-me ao menos uma vez ao ano? Comunguei ao menos uma vez na época da Páscoa? Obedeci ao Papa, ao meu Bispo e ao meu Pastor?", "5º MANDAMENTO — Não matar ou causar dano no corpo ou na alma a si mesmo ou ao próximo\nCausei prejuízo ao próximo com palavras ou obras? Agredi alguém? Deixei-me levar pela ira? Alimentei pensamentos de vingança? Guardo ódio ou rancor no coração? Perdoei sinceramente as ofensas? Pratiquei, aconselhei ou facilitei o aborto? Fui gravemente imprudente ao volante? Alimento pensamentos de suicídio? Fiquei bêbado ou tomei drogas? Escandalizei o próximo incitando-o a pecar com minhas conversas ou modo de vestir?", "6º e 9º MANDAMENTOS — Guardar castidade nas palavras, obras, pensamentos e desejos\nConsenti em pensamentos ou desejos contra a castidade? Vi pornografia? Busquei o prazer sexual fora do ato conjugal? Tive liberdades no namoro? Vivo maritalmente com alguém com quem não sou casado pela Igreja? Usei o matrimônio indevidamente? Pratiquei a contracepção (pílula, camisinha, DIU, laqueadura)? Faltei à fidelidade conjugal por pensamentos ou ações?", "7º e 10º MANDAMENTOS — Não furtar ou reter injustamente os bens do próximo. Não cobiçar.\nRoubei algum objeto ou quantia em dinheiro? Tive inveja dos outros? Paguei salários justos aos meus funcionários? Paguei os impostos devidos? Desrespeitei direitos autorais copiando livros, softwares ou filmes? Aproveitei-me injustamente da desgraça alheia? Enganei o próximo cobrando mais do que o valor justo? Reparei as injustiças que cometi? Gastei mais do que minhas possibilidades permitem?", "8º MANDAMENTO — Não levantar falsos testemunhos nem de qualquer modo faltar à verdade\nDisse mentiras? Fiz julgamentos falsos ou temerários? Revelei, sem motivo justo, defeitos graves alheios que não eram conhecidos? Caluniei alguém? Falei mal dos outros baseando-se apenas em rumores? Semeei discórdias, inimizades ou falsas suspeitas? Exagerei os defeitos do próximo? Caio com facilidade na crítica?"],
    'Dez Mandamentos': [
      "1. Amarás a Deus sobre todas as coisas: Dei a Deus o primeiro lugar? Rezei diariamente? Participei de superstições ou espiritismo?",
      "2. Não tomarás seu santo nome em vão: Usei o nome de Deus sem respeito? Jurei falso? Blasfemei?",
      "3. Guardarás domingos e festas: Faltei à Missa por culpa própria? Trabalhei sem necessidade?",
      "4. Honrarás pai e mãe: Fui desobediente ou desrespeitoso com meus pais ou superiores?",
      "5. Não matarás: Tive ódio? Desejei mal a alguém? Fui violento? Escandalizei alguém?",
      "6. Não pecarás contra a castidade: Tive pensamentos, desejos ou atos impuros?",
      "7. Não roubarás: Peguei algo que não era meu? Causei prejuízo a alguém?",
      "8. Não levantarás falso testemunho: Menti? Falei mal dos outros? Julguei temerariamente?",
      "9. Não desejarás a mulher do próximo: Guardei a pureza nos meus afetos e olhares?",
      "10. Não cobiçarás as coisas alheias: Tive inveja? Fui ganancioso?"
    ],
    'Bem-aventuranças': [
      "Pobres de espírito: Sou apegado às coisas materiais? Confio mais em Deus ou no dinheiro?",
      "Manso: Sou impaciente ou agressivo? Sei perdoar?",
      "Os que choram: Aceito os sofrimentos com fé? Consolo os que sofrem?",
      "Fome e sede de justiça: Busco a santidade? Cumpro meus deveres cristãos?",
      "Misericordiosos: Sou vingativo? Ajudo os necessitados?",
      "Puros de coração: Meus pensamentos e intenções são retos?",
      "Pacificadores: Promovo a paz ou a discórdia?",
      "Perseguidos por causa da justiça: Tenho vergonha de ser cristão?"
    ],
    'Para Jovens': [
      "Rezei todos os dias ao levantar e ao deitar? Deixei de confessar pecados graves por vergonha?",
      "Falei sem respeito do nome de Deus, de Nossa Senhora ou dos Santos?",
      "Faltei à Missa ao Domingo ou festa de guarda por culpa minha?",
      "Obedeci de boa vontade aos meus pais e às pessoas mais velhas?",
      "Procurei não fazer troça dos outros, não brigar e não fazer sofrer ninguém?",
      "Consenti em pensamentos ou desejos contra a castidade?",
      "Respeitei as coisas dos outros? Devolvi o que emprestei?",
      "Disse sempre a verdade? Falei mal dos outros?"
    ],
    'Para Adultos': [
      "Orei diariamente com atenção e devoção? Frequentei os sacramentos de má vontade?",
      "Blasfemei ou falei sem respeito contra Deus, os Santos ou as coisas santas?",
      "Faltei à Missa no domingo ou em algum dia santo por culpa própria?",
      "Expresso aos meus pais o devido amor, gratidão e respeito? Eu os ajudo?",
      "Tive ódio, rancor ou desejo de vingança contra alguém? Perdoei as ofensas?",
      "Consenti em pensamentos ou desejos contra a castidade? Vi pornografia?",
      "Roubei, enganei ou causei prejuízo injusto ao próximo?",
      "Disse mentiras? Falei mal dos outros? Caluniei alguém?"
    ],
    'Mandamentos da Igreja': [
      "1. Participar da Missa inteira nos domingos e festas de guarda.",
      "2. Confessar-se ao menos uma vez cada ano.",
      "3. Comungar ao menos pela Páscoa da Ressurreição.",
      "4. Jejuar e abster-se de carne conforme as normas da Igreja.",
      "5. Ajudar a Igreja em suas necessidades (Dízimo)."
    ]
  };

  useEffect(() => {
    fetchSins();
    fetchCustomModels();
    fetchPurposes();
  }, []);

  const fetchCustomModels = async () => {
    const res = await apiFetch('/api/exam-models');
    setCustomModels(await res.json());
  };

  const fetchSins = () => apiFetch('/api/sins').then(r => r.json()).then(setSins);
  const fetchPurposes = () => apiFetch('/api/purposes').then(r => r.json()).then(setPurposes);

  const addCustomModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelName.trim() || !newModelQuestions.trim()) return;
    const questions = newModelQuestions.split('\n').filter(q => q.trim());
    await apiFetch('/api/exam-models', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newModelName, questions }) });
    setNewModelName(''); setNewModelQuestions(''); setIsAddingModel(false);
    fetchCustomModels();
  };

  const addSin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSin.trim()) return;
    await apiFetch('/api/sins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: newSin }) });
    setNewSin(''); fetchSins();
  };

  const deleteSin = async (id: number) => {
    await apiFetch(`/api/sins/${id}`, { method: 'DELETE' });
    setDeleteId(null); fetchSins();
  };

  const clearAllSins = async () => {
    await apiFetch('/api/sins/clear-all', { method: 'DELETE' });
    setIsClearingAll(false); fetchSins();
  };

  const deleteSelectedSins = async () => {
    if (selectedSinIds.length === 0) return;
    for (const id of selectedSinIds) await apiFetch(`/api/sins/${id}`, { method: 'DELETE' });
    setSelectedSinIds([]); setSinSelectMode(false); fetchSins();
  };

  const toggleSinSelect = (id: number) => {
    setSelectedSinIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const addPurpose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPurpose.trim()) return;
    await apiFetch('/api/purposes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: newPurpose }) });
    setNewPurpose(''); fetchPurposes();
  };

  const togglePurposeFulfilled = async (id: number) => {
    await apiFetch(`/api/purposes/${id}/toggle`, { method: 'PUT' });
    fetchPurposes();
  };

  const deletePurpose = async (id: number) => {
    await apiFetch(`/api/purposes/${id}`, { method: 'DELETE' });
    fetchPurposes();
  };

  const deleteSelectedPurposes = async () => {
    if (selectedPurposeIds.length === 0) return;
    await apiFetch('/api/purposes/delete-multiple', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selectedPurposeIds }) });
    setSelectedPurposeIds([]); setPurposeSelectMode(false); fetchPurposes();
  };

  const clearAllPurposes = async () => {
    await apiFetch('/api/purposes/clear-all', { method: 'DELETE' });
    setIsClearingPurposes(false); fetchPurposes();
  };

  const togglePurposeSelect = (id: number) => {
    setSelectedPurposeIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const saveChecklistToSins = async () => {
    if (checklist.length === 0) return;
    for (const item of checklist) await apiFetch('/api/sins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: item }) });
    setChecklist([]); fetchSins(); setIsChecklistSaved(true);
    setTimeout(() => setIsChecklistSaved(false), 3000);
  };

  const toggleChecklist = (q: string) => setChecklist(prev => prev.includes(q) ? prev.filter(i => i !== q) : [...prev, q]);

  const toggleConfessionDate = (date: string) => {
    setConfessionDates(prev => prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]);
  };

  // Calculate next confession countdown
  const today = new Date().toISOString().split('T')[0];
  const nextConfession = confessionDates.filter(d => d >= today).sort()[0];
  const daysUntilNext = nextConfession
    ? Math.round((new Date(nextConfession + 'T12:00:00').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold">Exame de Consciência</h2>
        <p className="text-[#1A1A1A]/60 italic">"Se confessarmos os nossos pecados, Ele é fiel e justo para nos perdoar."</p>
      </header>

      {/* Steps */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <button key={i} onClick={() => setActiveStep(i)}
              className={`p-4 rounded-2xl border transition-all ${activeStep === i ? 'bg-[#5A5A40] text-white border-[#5A5A40] shadow-lg' : 'bg-white border-[#1A1A1A]/5 text-[#1A1A1A]/40 hover:border-[#5A5A40]/30'}`}>
              <Icon className="w-5 h-5 mb-2 mx-auto" />
              <p className="text-[10px] uppercase tracking-widest font-bold text-center">{step.title}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-[#1A1A1A]/5 shadow-sm">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-[#5A5A40]" />{steps[activeStep].title}
            </h3>
            <p className="text-[#1A1A1A]/60 mb-6 text-sm italic">{steps[activeStep].description}</p>

            {/* INVOCAÇÃO */}
            {activeStep === 0 && (
              <div className="space-y-4">
                {invocationPrayers.map((prayer, i) => (
                  <div key={i} className="p-6 bg-[#F5F2ED] rounded-2xl border border-[#5A5A40]/10">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-3 flex items-center gap-2">
                      <Wind className="w-3 h-3" /> {prayer.title}
                    </p>
                    <p className="text-sm leading-relaxed text-[#1A1A1A]/80 italic whitespace-pre-line">
                      "{prayer.text}"
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* EXAME */}
            {activeStep === 1 && (
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-[#5A5A40]">Checklist de Pecados</p>
                <div className="grid grid-cols-1 gap-2">
                  {(() => {
                    const model = customModels.find(m => m.name === selectedModel);
                    const questions = model ? model.questions : examModels[selectedModel || ''];
                    if (questions) {
                      return questions.map((q: string, i: number) => (
                        <button key={i} onClick={() => toggleChecklist(q)}
                          className={`flex items-start gap-3 p-3 rounded-xl text-left text-xs transition-all ${checklist.includes(q) ? 'bg-[#5A5A40] text-white' : 'bg-[#F5F2ED] text-[#1A1A1A]/60 hover:bg-[#5A5A40]/10'}`}>
                          <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center mt-0.5 ${checklist.includes(q) ? 'bg-white border-white' : 'border-[#5A5A40]/30'}`}>
                            {checklist.includes(q) && <CheckCircle2 className="w-3 h-3 text-[#5A5A40]" />}
                          </div>
                          {q}
                        </button>
                      ));
                    }
                    return <p className="text-xs text-[#5A5A40]/60 italic py-4 text-center">Selecione um modelo de exame abaixo para começar.</p>;
                  })()}
                  {checklist.length > 0 && (
                    <button onClick={saveChecklistToSins}
                      className="mt-4 w-full py-3 bg-[#5A5A40] text-white rounded-xl font-bold text-xs shadow-md hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" /> Adicionar marcados à Lista Privada ({checklist.length})
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ARREPENDIMENTO */}
            {activeStep === 2 && (
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-4">Atos de Contrição</p>
                <div className="flex gap-2 flex-wrap mb-4">
                  {actsOfContrition.map((act, i) => (
                    <button key={i} onClick={() => setSelectedActOfContrition(i)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedActOfContrition === i ? 'bg-[#5A5A40] text-white' : 'bg-[#F5F2ED] text-[#1A1A1A]/60 hover:bg-[#5A5A40]/10'}`}>
                      {act.title}
                    </button>
                  ))}
                </div>
                <div className="p-6 bg-[#F5F2ED] rounded-2xl border border-[#5A5A40]/10">
                  <p className="font-bold text-sm text-[#5A5A40] mb-3">{actsOfContrition[selectedActOfContrition].title}</p>
                  <p className="text-base leading-relaxed italic text-[#1A1A1A]/80">"{actsOfContrition[selectedActOfContrition].text}"</p>
                </div>
                <p className="text-xs text-[#1A1A1A]/40 italic text-center">
                  Reze este ato com o coração. A dor dos pecados deve nascer do amor a Deus, não apenas do medo do castigo.
                </p>
              </div>
            )}

            {/* PROPÓSITO */}
            {activeStep === 3 && (
              <div className="space-y-6">
                <form onSubmit={addPurpose} className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#5A5A40]">Registrar novo propósito</p>
                  <div className="flex gap-2">
                    <input value={newPurpose} onChange={e => setNewPurpose(e.target.value)}
                      placeholder="Ex: Evitar fofoca, rezar o Rosário diariamente..."
                      className="flex-1 p-3 bg-[#F5F2ED] rounded-xl border-none text-sm focus:ring-2 focus:ring-[#5A5A40]/20" />
                    <button type="submit" className="p-3 bg-[#5A5A40] text-white rounded-xl hover:scale-105 transition-transform">
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                </form>

                {purposes.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-widest text-[#5A5A40]">Meus Propósitos ({purposes.length})</p>
                      <div className="flex gap-2">
                        <button onClick={() => { setPurposeSelectMode(!purposeSelectMode); setSelectedPurposeIds([]); }}
                          className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-lg transition-all ${purposeSelectMode ? 'bg-[#5A5A40] text-white' : 'bg-[#F5F2ED] text-[#5A5A40] hover:bg-[#5A5A40]/10'}`}>
                          {purposeSelectMode ? 'Cancelar' : 'Selecionar'}
                        </button>
                        {purposeSelectMode && selectedPurposeIds.length > 0 && (
                          <button onClick={deleteSelectedPurposes}
                            className="text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all">
                            Apagar ({selectedPurposeIds.length})
                          </button>
                        )}
                        <button onClick={() => setIsClearingPurposes(true)}
                          className="text-[10px] uppercase tracking-widest font-bold text-red-400 hover:underline">
                          Apagar Tudo
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {purposes.map(p => (
                        <div key={p.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${p.is_fulfilled ? 'bg-green-50 border-green-200' : 'bg-white border-[#1A1A1A]/5'}`}>
                          {purposeSelectMode && (
                            <button onClick={() => togglePurposeSelect(p.id)}>
                              {selectedPurposeIds.includes(p.id)
                                ? <CheckSquare className="w-4 h-4 text-[#5A5A40]" />
                                : <Square className="w-4 h-4 text-[#1A1A1A]/30" />}
                            </button>
                          )}
                          <button onClick={() => togglePurposeFulfilled(p.id)}
                            className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${p.is_fulfilled ? 'border-green-500 bg-green-500' : 'border-[#5A5A40]/30 hover:border-[#5A5A40]'}`}>
                            {p.is_fulfilled && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </button>
                          <span className={`flex-1 text-sm ${p.is_fulfilled ? 'line-through text-[#1A1A1A]/40' : ''}`}>{p.content}</span>
                          {p.is_fulfilled && <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Cumprido</span>}
                          {!purposeSelectMode && (
                            <button onClick={() => deletePurpose(p.id)} className="text-[#1A1A1A]/20 hover:text-red-400 transition-colors">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {purposes.length === 0 && (
                  <p className="text-center text-[#1A1A1A]/40 italic text-sm py-4">Nenhum propósito registrado ainda.</p>
                )}
              </div>
            )}

            {/* CONFISSÃO */}
            {activeStep === 4 && (
              <div className="space-y-6">
                {/* Countdown */}
                {nextConfession && (
                  <div className={`p-6 rounded-2xl text-center ${daysUntilNext === 0 ? 'bg-green-50 border border-green-200' : daysUntilNext! <= 7 ? 'bg-amber-50 border border-amber-200' : 'bg-[#F5F2ED] border border-[#5A5A40]/10'}`}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-1 text-[#5A5A40]">Próxima Confissão</p>
                    <p className="text-3xl font-bold text-[#5A5A40]">
                      {daysUntilNext === 0 ? 'Hoje!' : `${daysUntilNext} dia${daysUntilNext! > 1 ? 's' : ''}`}
                    </p>
                    <p className="text-sm text-[#1A1A1A]/50 mt-1">
                      {new Date(nextConfession + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                    </p>
                  </div>
                )}
                {!nextConfession && (
                  <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 text-center">
                    <p className="text-sm text-amber-700 font-bold">Nenhuma confissão agendada.</p>
                    <p className="text-xs text-amber-600 mt-1">Agende no calendário ao lado →</p>
                  </div>
                )}

                {confessionTips.map((section, i) => (
                  <div key={i} className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#5A5A40]">{section.title}</p>
                    <ul className="space-y-2">
                      {section.items.map((tip, j) => (
                        <li key={j} className="flex items-start gap-3 p-3 bg-[#F5F2ED] rounded-xl text-sm">
                          <span className="text-[#5A5A40] font-bold mt-0.5">{j + 1}.</span>
                          <span className="text-[#1A1A1A]/70">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                <div className="p-6 bg-[#5A5A40] text-white rounded-2xl text-center">
                  <p className="font-serif italic text-lg leading-relaxed">
                    "Aquele a quem perdoardes os pecados, ser-lhe-ão perdoados; aquele a quem os retiverdes, ser-lhe-ão retidos."
                  </p>
                  <p className="text-xs opacity-60 mt-3 uppercase tracking-widest">João 20, 23</p>
                </div>
              </div>
            )}
          </div>

          {/* Exam models */}
          <div className="bg-white p-8 rounded-[2rem] border border-[#1A1A1A]/5 shadow-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Book className="w-5 h-5 text-[#5A5A40]" /> Modelos de Exame
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.keys(examModels).map(m => (
                <button key={m} onClick={() => setSelectedModel(m)}
                  className={`p-4 text-left rounded-xl transition-all font-bold text-sm ${selectedModel === m ? 'bg-[#5A5A40] text-white shadow-md' : 'bg-[#F5F2ED] hover:bg-[#5A5A40]/10'}`}>
                  {m}
                </button>
              ))}
              {customModels.map(m => (
                <div key={m.id} className="relative group">
                  <button onClick={() => setSelectedModel(m.name)}
                    className={`w-full p-4 text-left rounded-xl transition-all font-bold text-sm ${selectedModel === m.name ? 'bg-[#5A5A40] text-white shadow-md' : 'bg-[#F5F2ED] hover:bg-[#5A5A40]/10'}`}>
                    {m.name}
                  </button>
                  <button onClick={e => { e.stopPropagation(); apiFetch(`/api/exam-models/${m.id}`, { method: 'DELETE' }).then(fetchCustomModels); }}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button onClick={() => setIsAddingModel(true)}
                className="p-4 border border-dashed border-[#5A5A40]/30 rounded-xl text-xs font-bold text-[#5A5A40]/40 hover:text-[#5A5A40] hover:border-[#5A5A40] transition-all flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Novo Modelo
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Private list */}
          <div className="bg-[#1A1A1A] text-white p-8 rounded-[2rem] shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#E6E6A0]" /> Lista Privada
              </h3>
              <div className="flex gap-2 items-center">
                <button onClick={() => { setSinSelectMode(!sinSelectMode); setSelectedSinIds([]); }}
                  className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg transition-all ${sinSelectMode ? 'bg-[#E6E6A0] text-[#1A1A1A]' : 'text-[#E6E6A0]/60 hover:text-[#E6E6A0]'}`}>
                  {sinSelectMode ? 'Cancelar' : 'Selec.'}
                </button>
                <button onClick={() => setIsClearingAll(true)} className="text-[10px] uppercase tracking-widest font-bold text-red-400 hover:underline">
                  Apagar Tudo
                </button>
              </div>
            </div>

            {sinSelectMode && selectedSinIds.length > 0 && (
              <button onClick={deleteSelectedSins}
                className="w-full mb-3 py-2 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-all">
                Apagar Selecionados ({selectedSinIds.length})
              </button>
            )}

            <form onSubmit={addSin} className="mb-4">
              <div className="relative">
                <input type="text" value={newSin} onChange={e => setNewSin(e.target.value)} placeholder="Anotar pecado..."
                  className="w-full bg-white/10 border-none rounded-xl py-3 px-4 text-sm placeholder:text-white/30 focus:ring-2 focus:ring-[#E6E6A0]" />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-[#E6E6A0] text-[#1A1A1A] rounded-lg">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </form>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {sins.map(sin => (
                <div key={sin.id} className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
                  {sinSelectMode && (
                    <button onClick={() => toggleSinSelect(sin.id)}>
                      {selectedSinIds.includes(sin.id)
                        ? <CheckSquare className="w-4 h-4 text-[#E6E6A0]" />
                        : <Square className="w-4 h-4 text-white/30" />}
                    </button>
                  )}
                  <span className="flex-1 text-sm text-white/80 truncate">{sin.content}</span>
                  {!sinSelectMode && (
                    <button onClick={() => setDeleteId(sin.id)} className="text-white/20 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {sins.length === 0 && <p className="text-center text-white/20 text-xs italic py-4">Nenhum pecado anotado.</p>}
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-white p-8 rounded-[2rem] border border-[#1A1A1A]/5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#5A5A40]" /> Próximas Confissões
              </h3>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-1 hover:bg-[#F5F2ED] rounded-full">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold capitalize w-20 text-center">
                  {currentMonth.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
                </span>
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-1 hover:bg-[#F5F2ED] rounded-full">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['D','S','T','Q','Q','S','S'].map((d, i) => (
                <span key={`${d}-${i}`} className="text-[10px] font-bold text-[#1A1A1A]/30">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {(() => {
                const y = currentMonth.getFullYear(), m = currentMonth.getMonth();
                const firstDay = new Date(y, m, 1).getDay();
                const days = new Date(y, m + 1, 0).getDate();
                return [...Array(firstDay).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)].map((day, i) => {
                  if (day === null) return <div key={`e-${i}`} />;
                  const dateStr = `${y}-${(m+1).toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`;
                  const isSelected = confessionDates.includes(dateStr);
                  const isToday = today === dateStr;
                  return (
                    <button key={i} onClick={() => toggleConfessionDate(dateStr)}
                      className={`aspect-square rounded-lg text-xs flex items-center justify-center transition-all ${isSelected ? 'bg-[#5A5A40] text-white font-bold' : isToday ? 'bg-[#5A5A40]/10 text-[#5A5A40] font-bold' : 'hover:bg-[#F5F2ED] text-[#1A1A1A]/60'}`}>
                      {day}
                    </button>
                  );
                });
              })()}
            </div>
            <div className="mt-4 space-y-2">
              {confessionDates.sort().map(d => (
                <div key={d} className="flex items-center justify-between text-xs p-2 bg-[#F5F2ED] rounded-lg">
                  <span className="font-bold text-[#5A5A40]">
                    {new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                  </span>
                  <button onClick={() => toggleConfessionDate(d)} className="text-red-400 hover:text-red-600">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {deleteId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteId(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-8 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-8 h-8 text-red-500" /></div>
              <h3 className="text-xl font-bold mb-2">Excluir Pecado?</h3>
              <p className="text-[#1A1A1A]/60 text-sm mb-8">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl font-bold text-[#1A1A1A]/40 hover:bg-[#F5F2ED] transition-all">Cancelar</button>
                <button onClick={() => deleteSin(deleteId)} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:scale-105 transition-all">Excluir</button>
              </div>
            </motion.div>
          </div>
        )}

        {isClearingAll && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsClearingAll(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-8 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-8 h-8 text-red-500" /></div>
              <h3 className="text-xl font-bold mb-2">Apagar Tudo?</h3>
              <p className="text-[#1A1A1A]/60 text-sm mb-8">Todos os pecados da lista privada serão apagados permanentemente.</p>
              <div className="flex gap-3">
                <button onClick={() => setIsClearingAll(false)} className="flex-1 py-3 rounded-xl font-bold text-[#1A1A1A]/40 hover:bg-[#F5F2ED] transition-all">Cancelar</button>
                <button onClick={clearAllSins} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:scale-105 transition-all">Apagar</button>
              </div>
            </motion.div>
          </div>
        )}

        {isClearingPurposes && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsClearingPurposes(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-8 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-8 h-8 text-red-500" /></div>
              <h3 className="text-xl font-bold mb-2">Apagar Todos os Propósitos?</h3>
              <p className="text-[#1A1A1A]/60 text-sm mb-8">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button onClick={() => setIsClearingPurposes(false)} className="flex-1 py-3 rounded-xl font-bold text-[#1A1A1A]/40 hover:bg-[#F5F2ED] transition-all">Cancelar</button>
                <button onClick={clearAllPurposes} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:scale-105 transition-all">Apagar</button>
              </div>
            </motion.div>
          </div>
        )}

        {isChecklistSaved && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-[#5A5A40] text-white rounded-full font-bold shadow-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Pecados adicionados à lista privada
          </motion.div>
        )}

        {isAddingModel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingModel(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Novo Modelo de Exame</h3>
                <button onClick={() => setIsAddingModel(false)} className="p-2 hover:bg-[#F5F2ED] rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={addCustomModel} className="space-y-6">
                <input type="text" value={newModelName} onChange={e => setNewModelName(e.target.value)} placeholder="Nome do Modelo"
                  className="w-full p-4 bg-[#F5F2ED] border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#5A5A40]" required />
                <textarea value={newModelQuestions} onChange={e => setNewModelQuestions(e.target.value)} placeholder="Perguntas (uma por linha)"
                  className="w-full h-48 p-4 bg-[#F5F2ED] border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#5A5A40] resize-none" required />
                <button type="submit" className="w-full py-4 bg-[#5A5A40] text-white rounded-2xl font-bold hover:scale-[1.02] transition-all">Criar Modelo</button>
              </form>
            </motion.div>
          </div>
        )}

        {selectedModel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedModel(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl max-h-[90vh] flex flex-col">
              <div className="p-8 border-b border-[#1A1A1A]/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#F5F2ED] rounded-2xl text-[#5A5A40]"><Book className="w-6 h-6" /></div>
                  <div>
                    <h3 className="text-2xl font-bold">{selectedModel}</h3>
                    <p className="text-xs text-[#5A5A40] font-sans uppercase tracking-widest">Exame de Consciência</p>
                  </div>
                </div>
                <button onClick={() => setSelectedModel(null)} className="p-2 hover:bg-[#F5F2ED] rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 overflow-y-auto flex-1 space-y-4">
                {(() => {
                  const model = customModels.find(m => m.name === selectedModel);
                  const questions = model ? model.questions : examModels[selectedModel];
                  if (questions) return questions.map((q: string, i: number) => {
                    // Split on first \n to separate commandment header from questions
                    const nlIdx = q.indexOf('\n');
                    const hasHeader = nlIdx !== -1;
                    const header = hasHeader ? q.slice(0, nlIdx) : null;
                    const body = hasHeader ? q.slice(nlIdx + 1) : q;
                    return (
                      <div key={i} className="bg-[#F5F2ED] rounded-xl overflow-hidden">
                        {header && (
                          <div className="px-4 py-3 bg-[#5A5A40]/10 border-b border-[#5A5A40]/10">
                            <p className="text-xs font-bold uppercase tracking-wider text-[#5A5A40]">{header}</p>
                          </div>
                        )}
                        <div className="p-4">
                          <p className="text-sm leading-relaxed text-[#1A1A1A]/80">{body}</p>
                        </div>
                      </div>
                    );
                  });
                  return <p className="text-center italic text-[#1A1A1A]/40 py-8">Conteúdo em breve...</p>;
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
