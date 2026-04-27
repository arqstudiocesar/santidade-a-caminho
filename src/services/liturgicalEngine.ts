/**
 * liturgicalEngine.ts
 * Motor litúrgico completo para o calendário romano católico.
 *
 * Funcionalidades:
 *  - Algoritmo de Gauss para cálculo da Páscoa
 *  - Cálculo de todas as datas móveis (Quaresma, Pentecostes, Corpus Christi, etc.)
 *  - Determinação do Ano Litúrgico (A, B, C) e Ciclo Ferial (I, II)
 *  - Tempo litúrgico e semana do tempo litúrgico
 *  - Banco completo de leituras do Santoral (datas fixas)
 *  - Banco completo de referências do Lecionário Dominical (A/B/C)
 *  - Banco completo de referências do Lecionário Ferial (I/II)
 *  - Leituras próprias de solenidades e festas móveis
 */

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

export type LiturgicalYear = 'A' | 'B' | 'C';
export type FerialCycle = 'I' | 'II';
export type LiturgicalSeason =
  | 'Advento' | 'Natal' | 'Tempo Comum' | 'Quaresma' | 'Tríduo Pascal' | 'Tempo Pascal';
export type CelebrationRank =
  | 'ferial' | 'memoria_facultativa' | 'memoria_obrigatoria' | 'festa' | 'solenidade';
export type LiturgicalColor = 'verde' | 'roxo' | 'branco' | 'vermelho' | 'rosa';

export interface ReadingRefs {
  firstReading: string;
  psalm: string;
  psalmAntiphon?: string;
  secondReading?: string;
  gospel: string;
  alleluia?: string;
}

export interface LiturgicalDay {
  date: string;                    // ISO yyyy-mm-dd
  liturgicalYear: LiturgicalYear;
  ferialCycle: FerialCycle;
  season: LiturgicalSeason;
  weekOfSeason: number;
  weekday: number;                 // 0=Dom … 6=Sáb
  weekdayName: string;
  color: LiturgicalColor;
  celebrationRank: CelebrationRank;
  celebrationName: string | null;
  hasProperReadings: boolean;
  readings: ReadingRefs;
  feastReadings?: ReadingRefs;     // leituras próprias quando há festa/solenidade
  isSunday: boolean;
  isHolyDay: boolean;
  seasonLabel: string;             // ex: "3º Domingo do Advento"
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. ALGORITMO DE PÁSCOA (Meeus/Jones/Butcher — derivado do algoritmo de Gauss)
// ─────────────────────────────────────────────────────────────────────────────

export function computeEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=março, 4=abril
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. DATAS MÓVEIS
// ─────────────────────────────────────────────────────────────────────────────

export interface MovableDates {
  easter: Date;
  ashWednesday: Date;       // Quarta-feira de Cinzas (47 dias antes da Páscoa)
  palmSunday: Date;         // Domingo de Ramos (7 dias antes)
  holyThursday: Date;       // Quinta-feira Santa
  goodFriday: Date;         // Sexta-feira Santa
  holySaturday: Date;       // Sábado Santo
  ascension: Date;          // Ascensão (39 dias depois — 6ª semana Pascal quinta)
  pentecost: Date;          // Pentecostes (49 dias depois)
  trinitySmith: Date;       // Santíssima Trindade (1 domingo após Pentecostes)
  corpusChristi: Date;      // Corpus Christi (2º domingo após Pentecostes no Brasil)
  sacredHeart: Date;        // Sagrado Coração (3ª sexta após Pentecostes)
  christTheKing: Date;      // Cristo Rei (último domingo antes do Advento)
  firstSundayAdvent: Date;  // 1º Domingo do Advento
}

export function computeMovableDates(year: number): MovableDates {
  const easter = computeEaster(year);
  const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

  const ashWednesday  = addDays(easter, -46);  // 46 dias antes (excluindo domingo de Páscoa, contando Cinzas)
  const palmSunday    = addDays(easter, -7);
  const holyThursday  = addDays(easter, -3);
  const goodFriday    = addDays(easter, -2);
  const holySaturday  = addDays(easter, -1);
  const ascension     = addDays(easter, 39);   // Quinta da 6ª semana Pascal (Brasil: domingo = +42)
  const pentecost     = addDays(easter, 49);
  const trinitySmith  = addDays(pentecost, 7);
  const corpusChristi = addDays(pentecost, 14); // No Brasil: 2º dom após Pentecostes (obrigação civil)
  const sacredHeart   = addDays(pentecost, 19); // 3ª sexta após Pentecostes

  // Cristo Rei = último domingo antes do 1º Advento
  // 1º Advento = domingo mais próximo de 30 de novembro
  const nov30 = new Date(year, 10, 30);
  const dow30 = nov30.getDay();
  const offset30 = dow30 <= 3 ? -dow30 : (7 - dow30);
  const firstAdvent = addDays(nov30, offset30);
  const christTheKing = addDays(firstAdvent, -7);

  return {
    easter, ashWednesday, palmSunday, holyThursday, goodFriday, holySaturday,
    ascension, pentecost, trinitySmith, corpusChristi, sacredHeart,
    christTheKing, firstSundayAdvent: firstAdvent,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ANO LITÚRGICO E CICLO FERIAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * O ano litúrgico começa no 1º Domingo do Advento.
 * Ciclo A: anos litúrgicos que começam em 2022, 2025, 2028... (div 3 == 1)
 * Ciclo B: anos litúrgicos que começam em 2023, 2026, 2029...
 * Ciclo C: anos litúrgicos que começam em 2024, 2027, 2030...
 *
 * O "ano litúrgico" é identificado pelo ano civil em que ele TERMINA
 * (ex: Advento 2025 → Ano C 2025-2026 → ano litúrgico = 2026).
 *
 * Regra: se (anoLitúrgico % 3 == 0) → Ano C; ==1 → Ano A; ==2 → Ano B
 */
export function getLiturgicalYear(date: Date): LiturgicalYear {
  const year = date.getFullYear();
  const { firstSundayAdvent } = computeMovableDates(year);
  // O ano litúrgico é identificado pelo ano em que o Advento COMEÇA
  // Se já passou o 1º Advento deste ano, o ciclo em curso começou neste ano
  // Se ainda não chegou, o ciclo em curso começou no ano anterior
  const adventYear = date >= firstSundayAdvent ? year : year - 1;
  // Âncora: Advento 2022 iniciou o Ano A. A cada 3 anos repete.
  // 2022%3=0→A, 2023%3=1→B, 2024%3=2→C, 2025%3=0→A, 2026%3=1→B, 2027%3=2→C
  const mod = ((adventYear - 2022) % 3 + 3) % 3;
  if (mod === 0) return 'A';
  if (mod === 1) return 'B';
  return 'C';
}

/**
 * Ciclo ferial: ímpar (I) ou par (II) — baseado no ano civil em que a semana cai.
 * Anos pares = Ciclo II; anos ímpares = Ciclo I.
 */
export function getFerialCycle(date: Date): FerialCycle {
  // Ciclo ferial baseado no ano civil corrente (independente do Advento):
  // Anos ímpares = Ciclo I; Anos pares = Ciclo II.
  return date.getFullYear() % 2 === 0 ? 'II' : 'I';
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. TEMPO LITÚRGICO E SEMANA
// ─────────────────────────────────────────────────────────────────────────────

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 86400000;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

interface SeasonInfo {
  season: LiturgicalSeason;
  week: number;
  color: LiturgicalColor;
}

export function getSeasonInfo(date: Date): SeasonInfo {
  const year = date.getFullYear();
  const mv = computeMovableDates(year);
  const mvPrev = computeMovableDates(year - 1);

  // Tríduo Pascal
  if (isSameDay(date, mv.holyThursday)) return { season: 'Tríduo Pascal', week: 0, color: 'branco' };
  if (isSameDay(date, mv.goodFriday))   return { season: 'Tríduo Pascal', week: 0, color: 'vermelho' };
  if (isSameDay(date, mv.holySaturday)) return { season: 'Tríduo Pascal', week: 0, color: 'roxo' };

  // Tempo Pascal: Páscoa → véspera de Pentecostes
  if (date >= mv.easter && date <= mv.pentecost) {
    const weeksPascal = Math.floor(daysBetween(mv.easter, date) / 7) + 1;
    return { season: 'Tempo Pascal', week: weeksPascal, color: 'branco' };
  }

  // Quaresma: Quarta-feira de Cinzas → Quinta-feira Santa
  if (date >= mv.ashWednesday && date < mv.holyThursday) {
    // A semana litúrgica da Quaresma é contada a partir do 1º DOMINGO da Quaresma
    // (não das Cinzas). Cinzas, Qui e Sex antes do 1º Dom = "Semana das Cinzas".
    // 1º Dom Quaresma = primeiro domingo após as Cinzas
    let firstSundayLent = new Date(mv.ashWednesday);
    while (firstSundayLent.getDay() !== 0) {
      firstSundayLent = new Date(firstSundayLent.getFullYear(), firstSundayLent.getMonth(), firstSundayLent.getDate() + 1);
    }
    const daysFromFirstSunday = daysBetween(firstSundayLent, date);
    // Antes do 1º domingo (Cinzas, Qui, Sex, Sáb) = semana 0/preparatória
    const w = daysFromFirstSunday < 0 ? 0 : Math.floor(daysFromFirstSunday / 7) + 1;
    const color: LiturgicalColor = w === 4 ? 'rosa' : 'roxo'; // 4ª Dom Laetare = rosa (não afeta feriais)
    return { season: 'Quaresma', week: w, color: 'roxo' };
  }

  // Advento atual: 1º Advento → 24 de dezembro
  const christmas = new Date(year, 11, 25);
  if (date >= mv.firstSundayAdvent && date < christmas) {
    const w = Math.floor(daysBetween(mv.firstSundayAdvent, date) / 7) + 1;
    const color: LiturgicalColor = w === 3 ? 'rosa' : 'roxo'; // 3º dom = Gaudete
    return { season: 'Advento', week: w, color };
  }

  // Natal: 25 dez → Batismo do Senhor (domingo após 6 de jan, ou 13 jan no máximo)
  const epiphany = new Date(year, 0, 6); // 6 de janeiro
  // Batismo do Senhor = domingo após Epifania (ou segunda se Epifania for domingo)
  let baptismOfLord = new Date(year, 0, 7);
  while (baptismOfLord.getDay() !== 0) baptismOfLord = new Date(baptismOfLord.getFullYear(), baptismOfLord.getMonth(), baptismOfLord.getDate() + 1);

  if (date >= christmas || (date.getMonth() === 0 && date <= baptismOfLord)) {
    return { season: 'Natal', week: 1, color: 'branco' };
  }

  // Advento do ano anterior (para datas em novembro/dezembro)
  if (date >= mvPrev.firstSundayAdvent && date < new Date(year, 11, 25)) {
    const w = Math.floor(daysBetween(mvPrev.firstSundayAdvent, date) / 7) + 1;
    const color: LiturgicalColor = w === 3 ? 'rosa' : 'roxo';
    return { season: 'Advento', week: w, color };
  }

  // Tempo Comum
  // Primeiro período: após Batismo do Senhor até Quarta-feira de Cinzas
  // Segundo período: após Pentecostes até Cristo Rei
  return { season: 'Tempo Comum', week: computeOrdinaryWeek(date, year), color: 'verde' };
}

function computeOrdinaryWeek(date: Date, year: number): number {
  const mv = computeMovableDates(year);
  // Calcular Batismo do Senhor do ano em curso
  let baptismOfLord = new Date(year, 0, 7);
  while (baptismOfLord.getDay() !== 0) baptismOfLord = new Date(baptismOfLord.getFullYear(), baptismOfLord.getMonth(), baptismOfLord.getDate() + 1);

  // Tempo Comum I: após Batismo do Senhor
  if (date > baptismOfLord && date < mv.ashWednesday) {
    const days = daysBetween(baptismOfLord, date);
    return Math.floor(days / 7) + 2; // Começa na 2ª semana
  }

  // Tempo Comum II: após Pentecostes
  if (date > mv.pentecost && date <= mv.christTheKing) {
    // Contar de trás: última semana = 34
    const daysToKing = daysBetween(date, mv.christTheKing);
    return 34 - Math.floor(daysToKing / 7);
  }

  return 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. BANCO DE LEITURAS — LECIONÁRIO DOMINICAL (A, B, C)
// ─────────────────────────────────────────────────────────────────────────────

// Formato: Record<semana_ou_codigo, ReadingRefs>
// Chave para domingos do Tempo Comum: "TC-{semana}" (ex: "TC-3")
// Chave para Advento: "ADV-{semana}"
// Chave para Quaresma: "LAQ-{semana}"
// Chave para Tempo Pascal: "PAC-{semana}"
// Chave para Natal: "NAT-{codigo}"

export const SUNDAY_LECTIONARY: Record<LiturgicalYear, Record<string, ReadingRefs>> = {
  A: {
    // ── Advento ──────────────────────────────────────────────────────────────
    'ADV-1': { firstReading: 'Is 2,1-5', psalm: 'Sl 121(122),1-2.3-4b.4cd-5.6-7.8-9', secondReading: 'Rm 13,11-14', gospel: 'Mt 24,37-44' },
    'ADV-2': { firstReading: 'Is 11,1-10', psalm: 'Sl 71(72),1-2.7-8.12-13.17', secondReading: 'Rm 15,4-9', gospel: 'Mt 3,1-12' },
    'ADV-3': { firstReading: 'Is 35,1-6a.10', psalm: 'Sl 145(146),6c-7.8-9a.9bc-10', secondReading: 'Tg 5,7-10', gospel: 'Mt 11,2-11' },
    'ADV-4': { firstReading: 'Is 7,10-14', psalm: 'Sl 23(24),1-2.3-4ab.5-6', secondReading: 'Rm 1,1-7', gospel: 'Mt 1,18-24' },
    // ── Natal ─────────────────────────────────────────────────────────────────
    'NAT-NOITE':    { firstReading: 'Is 9,1-3.5-6', psalm: 'Sl 95(96),1-2a.2b-3.11-12.13', secondReading: 'Tt 2,11-14', gospel: 'Lc 2,1-14' },
    'NAT-AURORA':   { firstReading: 'Is 62,11-12', psalm: 'Sl 96(97),1.6.11-12', secondReading: 'Tt 3,4-7', gospel: 'Lc 2,15-20' },
    'NAT-DIA':      { firstReading: 'Is 52,7-10', psalm: 'Sl 97(98),1.2-3ab.3cd-4.5-6', secondReading: 'Hb 1,1-6', gospel: 'Jo 1,1-18' },
    'NAT-SFamilia': { firstReading: 'Eclo 3,2-6.12-14', psalm: 'Sl 127(128),1-2.3.4-5', secondReading: 'Cl 3,12-21', gospel: 'Mt 2,13-15.19-23' },
    'NAT-1jan':     { firstReading: 'Nm 6,22-27', psalm: 'Sl 66(67),2-3.5.6.8', secondReading: 'Gl 4,4-7', gospel: 'Lc 2,16-21' },
    'NAT-EPIFANIA': { firstReading: 'Is 60,1-6', psalm: 'Sl 71(72),1-2.7-8.10-11.12-13', secondReading: 'Ef 3,2-3a.5-6', gospel: 'Mt 2,1-12' },
    'NAT-BATISMO':  { firstReading: 'Is 42,1-4.6-7', psalm: 'Sl 28(29),1a.2.3ac-4.9b-10', secondReading: 'At 10,34-38', gospel: 'Mt 3,13-17' },
    // ── Quaresma ──────────────────────────────────────────────────────────────
    'LAQ-1': { firstReading: 'Gn 2,7-9;3,1-7', psalm: 'Sl 50(51),3-4.5-6a.12-13.17', secondReading: 'Rm 5,12-19', gospel: 'Mt 4,1-11' },
    'LAQ-2': { firstReading: 'Gn 12,1-4a', psalm: 'Sl 32(33),4-5.18-19.20.22', secondReading: '2Tm 1,8b-10', gospel: 'Mt 17,1-9' },
    'LAQ-3': { firstReading: 'Êx 17,3-7', psalm: 'Sl 94(95),1-2.6-7.8-9', secondReading: 'Rm 5,1-2.5-8', gospel: 'Jo 4,5-42' },
    'LAQ-4': { firstReading: '1Sm 16,1b.6-7.10-13a', psalm: 'Sl 22(23),1-3a.3b-4.5.6', secondReading: 'Ef 5,8-14', gospel: 'Jo 9,1-41' },
    'LAQ-5': { firstReading: 'Ez 37,12-14', psalm: 'Sl 129(130),1-2.3-4b.4c-6.7-8', secondReading: 'Rm 8,8-11', gospel: 'Jo 11,1-45' },
    'LAQ-RAMOS': { firstReading: 'Is 50,4-7', psalm: 'Sl 21(22),8-9.17-18a.19-20.23-24', secondReading: 'Fl 2,6-11', gospel: 'Mt 26,14-27,66' },
    // ── Tempo Pascal ─────────────────────────────────────────────────────────
    'PAC-PASCOA': { firstReading: 'At 10,34a.37-43', psalm: 'Sl 117(118),1-2.16ab-17.22-23', secondReading: 'Cl 3,1-4', gospel: 'Jo 20,1-9' },
    'PAC-2':  { firstReading: 'At 2,42-47', psalm: 'Sl 117(118),2-4.13-15.22-24', secondReading: '1Pd 1,3-9', gospel: 'Jo 20,19-31' },
    'PAC-3':  { firstReading: 'At 2,14.22b-33', psalm: 'Sl 15(16),1-2a.5.7-8.9-10.11', secondReading: '1Pd 1,17-21', gospel: 'Lc 24,13-35' },
    'PAC-4':  { firstReading: 'At 2,14a.36-41', psalm: 'Sl 22(23),1-3a.3b-4.5.6', secondReading: '1Pd 2,20b-25', gospel: 'Jo 10,1-10' },
    'PAC-5':  { firstReading: 'At 6,1-7', psalm: 'Sl 32(33),1-2.4-5.18-19', secondReading: '1Pd 2,4-9', gospel: 'Jo 14,1-12' },
    'PAC-6':  { firstReading: 'At 8,5-8.14-17', psalm: 'Sl 65(66),1-3a.4-5.6-7a.16.20', secondReading: '1Pd 3,15-18', gospel: 'Jo 14,15-21' },
    'PAC-ASCENSAO': { firstReading: 'At 1,1-11', psalm: 'Sl 46(47),2-3.6-7.8-9', secondReading: 'Ef 1,17-23', gospel: 'Mt 28,16-20' },
    'PAC-7':  { firstReading: 'At 1,12-14', psalm: 'Sl 26(27),1.4.7-8', secondReading: '1Pd 4,13-16', gospel: 'Jo 17,1-11a' },
    'PAC-PENTECOSTES': { firstReading: 'At 2,1-11', psalm: 'Sl 103(104),1ab.24ac.29bc-30.31.34', secondReading: '1Cor 12,3b-7.12-13', gospel: 'Jo 20,19-23' },
    // ── Tempo Comum ──────────────────────────────────────────────────────────
    'TC-2':  { firstReading: 'Is 49,3.5-6', psalm: 'Sl 39(40),2.4ab.7-8a.8b-9.10', secondReading: '1Cor 1,1-3', gospel: 'Jo 1,29-34' },
    'TC-3':  { firstReading: 'Is 8,23b-9,3', psalm: 'Sl 26(27),1.13-14', secondReading: '1Cor 1,10-13.17', gospel: 'Mt 4,12-23' },
    'TC-4':  { firstReading: 'Sf 2,3;3,12-13', psalm: 'Sl 145(146),6c-7.8-9a.9bc-10', secondReading: '1Cor 1,26-31', gospel: 'Mt 5,1-12a' },
    'TC-5':  { firstReading: 'Is 58,7-10', psalm: 'Sl 111(112),4-5.6-7.8-9', secondReading: '1Cor 2,1-5', gospel: 'Mt 5,13-16' },
    'TC-6':  { firstReading: 'Eclo 15,15-20', psalm: 'Sl 118(119),1-2.4-5.17-18.33-34', secondReading: '1Cor 2,6-10', gospel: 'Mt 5,17-37' },
    'TC-7':  { firstReading: 'Lv 19,1-2.17-18', psalm: 'Sl 102(103),1-2.3-4.8.10.12-13', secondReading: '1Cor 3,16-23', gospel: 'Mt 5,38-48' },
    'TC-8':  { firstReading: 'Is 49,14-15', psalm: 'Sl 61(62),2-3.6-7.8-9ab', secondReading: '1Cor 4,1-5', gospel: 'Mt 6,24-34' },
    'TC-9':  { firstReading: 'Dt 11,18.26-28.32', psalm: 'Sl 30(31),2-3ab.3cd-4.17.25', secondReading: 'Rm 3,21-25a.28', gospel: 'Mt 7,21-27' },
    'TC-10': { firstReading: 'Os 6,3-6', psalm: 'Sl 49(50),1.8.12-13.14-15', secondReading: 'Rm 4,18-25', gospel: 'Mt 9,9-13' },
    'TC-11': { firstReading: 'Êx 19,2-6a', psalm: 'Sl 99(100),1b-2.3.5', secondReading: 'Rm 5,6-11', gospel: 'Mt 9,36-10,8' },
    'TC-12': { firstReading: 'Jr 20,10-13', psalm: 'Sl 68(69),8-10.14.17.33-35', secondReading: 'Rm 5,12-15', gospel: 'Mt 10,26-33' },
    'TC-13': { firstReading: '2Rs 4,8-11.14-16a', psalm: 'Sl 88(89),2-3.16-17.18-19', secondReading: 'Rm 6,3-4.8-11', gospel: 'Mt 10,37-42' },
    'TC-14': { firstReading: 'Zc 9,9-10', psalm: 'Sl 144(145),1-2.8-9.10-11.13cd-14', secondReading: 'Rm 8,9.11-13', gospel: 'Mt 11,25-30' },
    'TC-15': { firstReading: 'Is 55,10-11', psalm: 'Sl 64(65),10.11.12-13.14', secondReading: 'Rm 8,18-23', gospel: 'Mt 13,1-23' },
    'TC-16': { firstReading: 'Sb 12,13.16-19', psalm: 'Sl 85(86),5-6.9-10.15-16a', secondReading: 'Rm 8,26-27', gospel: 'Mt 13,24-43' },
    'TC-17': { firstReading: '1Rs 3,5.7-12', psalm: 'Sl 118(119),57.72.76-77.127-128.129-130', secondReading: 'Rm 8,28-30', gospel: 'Mt 13,44-52' },
    'TC-18': { firstReading: 'Is 55,1-3', psalm: 'Sl 144(145),8-9.15-16.17-18', secondReading: 'Rm 8,35.37-39', gospel: 'Mt 14,13-21' },
    'TC-19': { firstReading: '1Rs 19,9a.11-13a', psalm: 'Sl 84(85),9ab.10.11-12.13-14', secondReading: 'Rm 9,1-5', gospel: 'Mt 14,22-33' },
    'TC-20': { firstReading: 'Is 56,1.6-7', psalm: 'Sl 66(67),2-3.5.6.8', secondReading: 'Rm 11,13-15.29-32', gospel: 'Mt 15,21-28' },
    'TC-21': { firstReading: 'Is 22,19-23', psalm: 'Sl 137(138),1-2a.2bc-3.6.8bc', secondReading: 'Rm 11,33-36', gospel: 'Mt 16,13-20' },
    'TC-22': { firstReading: 'Jr 20,7-9', psalm: 'Sl 62(63),2.3-4.5-6.8-9', secondReading: 'Rm 12,1-2', gospel: 'Mt 16,21-27' },
    'TC-23': { firstReading: 'Ez 33,7-9', psalm: 'Sl 94(95),1-2.6-7.8-9', secondReading: 'Rm 13,8-10', gospel: 'Mt 18,15-20' },
    'TC-24': { firstReading: 'Eclo 27,30-28,7', psalm: 'Sl 102(103),1-2.3-4.9-10.11-12', secondReading: 'Rm 14,7-9', gospel: 'Mt 18,21-35' },
    'TC-25': { firstReading: 'Is 55,6-9', psalm: 'Sl 144(145),2-3.8-9.17-18', secondReading: 'Fl 1,20c-24.27a', gospel: 'Mt 20,1-16a' },
    'TC-26': { firstReading: 'Ez 18,25-28', psalm: 'Sl 24(25),4bc-5.6-7.8-9', secondReading: 'Fl 2,1-11', gospel: 'Mt 21,28-32' },
    'TC-27': { firstReading: 'Is 5,1-7', psalm: 'Sl 79(80),9.12.13-14.15-16.19-20', secondReading: 'Fl 4,6-9', gospel: 'Mt 21,33-43' },
    'TC-28': { firstReading: 'Is 25,6-10a', psalm: 'Sl 22(23),1-3a.3b-4.5.6', secondReading: 'Fl 4,12-14.19-20', gospel: 'Mt 22,1-14' },
    'TC-29': { firstReading: 'Is 45,1.4-6', psalm: 'Sl 95(96),1.3.4-5.7-8.9-10ac', secondReading: '1Ts 1,1-5b', gospel: 'Mt 22,15-21' },
    'TC-30': { firstReading: 'Êx 22,20-26', psalm: 'Sl 17(18),2-3a.3bc-4.47.51', secondReading: '1Ts 1,5c-10', gospel: 'Mt 22,34-40' },
    'TC-31': { firstReading: 'Ml 1,14b-2,2b.8-10', psalm: 'Sl 130(131),1.2.3', secondReading: '1Ts 2,7b-9.13', gospel: 'Mt 23,1-12' },
    'TC-32': { firstReading: 'Sb 6,12-16', psalm: 'Sl 62(63),2.3-4.5-6.7-8', secondReading: '1Ts 4,13-18', gospel: 'Mt 25,1-13' },
    'TC-33': { firstReading: 'Pv 31,10-13.19-20.30-31', psalm: 'Sl 127(128),1-2.3.4-5', secondReading: '1Ts 5,1-6', gospel: 'Mt 25,14-30' },
    'TC-34': { firstReading: 'Ez 34,11-12.15-17', psalm: 'Sl 22(23),1-2.2-3.5-6', secondReading: '1Cor 15,20-26.28', gospel: 'Mt 25,31-46' },
    // Solenidades no Tempo Comum Ano A
    'SS-TRINDADE-A': { firstReading: 'Êx 34,4b-6.8-9', psalm: 'Dn 3,52.53.54.55.56', secondReading: '2Cor 13,11-13', gospel: 'Jo 3,16-18' },
    'CORPUS-A':      { firstReading: 'Dt 8,2-3.14b-16a', psalm: 'Sl 147,12-13.14-15.19-20', secondReading: '1Cor 10,16-17', gospel: 'Jo 6,51-58' },
  },

  B: {
    'ADV-1': { firstReading: 'Is 63,16b-17.19b;64,2-7', psalm: 'Sl 79(80),2ac.3b.15-16.18-19', secondReading: '1Cor 1,3-9', gospel: 'Mc 13,33-37' },
    'ADV-2': { firstReading: 'Is 40,1-5.9-11', psalm: 'Sl 84(85),9ab.10.11-12.13-14', secondReading: '2Pd 3,8-14', gospel: 'Mc 1,1-8' },
    'ADV-3': { firstReading: 'Is 61,1-2a.10-11', psalm: 'Lc 1,46-48.49-50.53-54', secondReading: '1Ts 5,16-24', gospel: 'Jo 1,6-8.19-28' },
    'ADV-4': { firstReading: '2Sm 7,1-5.8b-12.14a.16', psalm: 'Sl 88(89),2-3.4-5.27.29', secondReading: 'Rm 16,25-27', gospel: 'Lc 1,26-38' },
    'NAT-NOITE':    { firstReading: 'Is 9,1-3.5-6', psalm: 'Sl 95(96),1-2a.2b-3.11-12.13', secondReading: 'Tt 2,11-14', gospel: 'Lc 2,1-14' },
    'NAT-AURORA':   { firstReading: 'Is 62,11-12', psalm: 'Sl 96(97),1.6.11-12', secondReading: 'Tt 3,4-7', gospel: 'Lc 2,15-20' },
    'NAT-DIA':      { firstReading: 'Is 52,7-10', psalm: 'Sl 97(98),1.2-3ab.3cd-4.5-6', secondReading: 'Hb 1,1-6', gospel: 'Jo 1,1-18' },
    'NAT-SFamilia': { firstReading: 'Gn 15,1-6;21,1-3', psalm: 'Sl 104(105),1-2.3-4.5-6.8-9', secondReading: 'Hb 11,8.11-12.17-19', gospel: 'Lc 2,22-40' },
    'NAT-1jan':     { firstReading: 'Nm 6,22-27', psalm: 'Sl 66(67),2-3.5.6.8', secondReading: 'Gl 4,4-7', gospel: 'Lc 2,16-21' },
    'NAT-EPIFANIA': { firstReading: 'Is 60,1-6', psalm: 'Sl 71(72),1-2.7-8.10-11.12-13', secondReading: 'Ef 3,2-3a.5-6', gospel: 'Mt 2,1-12' },
    'NAT-BATISMO':  { firstReading: 'Is 42,1-4.6-7', psalm: 'Sl 28(29),1a.2.3ac-4.9b-10', secondReading: 'At 10,34-38', gospel: 'Mc 1,7-11' },
    'LAQ-1': { firstReading: 'Gn 9,8-15', psalm: 'Sl 24(25),4bc-5.6-7.8-9', secondReading: '1Pd 3,18-22', gospel: 'Mc 1,12-15' },
    'LAQ-2': { firstReading: 'Gn 22,1-2.9a.10-13.15-18', psalm: 'Sl 115(116),10.15.16-17.18-19', secondReading: 'Rm 8,31b-34', gospel: 'Mc 9,2-10' },
    'LAQ-3': { firstReading: 'Êx 20,1-17', psalm: 'Sl 18(19),8.9.10.11', secondReading: '1Cor 1,22-25', gospel: 'Jo 2,13-25' },
    'LAQ-4': { firstReading: '2Cr 36,14-16.19-23', psalm: 'Sl 136(137),1-2.3.4-5.6', secondReading: 'Ef 2,4-10', gospel: 'Jo 3,14-21' },
    'LAQ-5': { firstReading: 'Jr 31,31-34', psalm: 'Sl 50(51),3-4.12-13.14-15', secondReading: 'Hb 5,7-9', gospel: 'Jo 12,20-33' },
    'LAQ-RAMOS': { firstReading: 'Is 50,4-7', psalm: 'Sl 21(22),8-9.17-18a.19-20.23-24', secondReading: 'Fl 2,6-11', gospel: 'Mc 14,1-15,47' },
    'PAC-PASCOA': { firstReading: 'At 10,34a.37-43', psalm: 'Sl 117(118),1-2.16ab-17.22-23', secondReading: '1Cor 5,6b-8', gospel: 'Mc 16,1-7' },
    'PAC-2':  { firstReading: 'At 4,32-35', psalm: 'Sl 117(118),2-4.15-16ab.22-24', secondReading: '1Jo 5,1-6', gospel: 'Jo 20,19-31' },
    'PAC-3':  { firstReading: 'At 3,13-15.17-19', psalm: 'Sl 4,2.4.7b-8.9', secondReading: '1Jo 2,1-5a', gospel: 'Lc 24,35-48' },
    'PAC-4':  { firstReading: 'At 4,8-12', psalm: 'Sl 117(118),1.8-9.21-23.26.28.29', secondReading: '1Jo 3,1-2', gospel: 'Jo 10,11-18' },
    'PAC-5':  { firstReading: 'At 9,26-31', psalm: 'Sl 21(22),26b-27.28.30.31-32', secondReading: '1Jo 3,18-24', gospel: 'Jo 15,1-8' },
    'PAC-6':  { firstReading: 'At 10,25-26.34-35.44-48', psalm: 'Sl 97(98),1.2-3ab.3cd-4', secondReading: '1Jo 4,7-10', gospel: 'Jo 15,9-17' },
    'PAC-ASCENSAO': { firstReading: 'At 1,1-11', psalm: 'Sl 46(47),2-3.6-7.8-9', secondReading: 'Ef 4,1-13', gospel: 'Mc 16,15-20' },
    'PAC-7':  { firstReading: 'At 1,15-17.20a.20c-26', psalm: 'Sl 102(103),1-2.11-12.19-20ab', secondReading: '1Jo 4,11-16', gospel: 'Jo 17,11b-19' },
    'PAC-PENTECOSTES': { firstReading: 'At 2,1-11', psalm: 'Sl 103(104),1ab.24ac.29bc-30.31.34', secondReading: '1Cor 12,3b-7.12-13', gospel: 'Jo 20,19-23' },
    'TC-2':  { firstReading: '1Sm 3,3b-10.19', psalm: 'Sl 39(40),2.4ab.7-8a.8b-9.10', secondReading: '1Cor 6,13c-15a.17-20', gospel: 'Jo 1,35-42' },
    'TC-3':  { firstReading: 'Jon 3,1-5.10', psalm: 'Sl 24(25),4bc-5.6-7.8-9', secondReading: '1Cor 7,29-31', gospel: 'Mc 1,14-20' },
    'TC-4':  { firstReading: 'Dt 18,15-20', psalm: 'Sl 94(95),1-2.6-7.8-9', secondReading: '1Cor 7,32-35', gospel: 'Mc 1,21-28' },
    'TC-5':  { firstReading: 'Jó 7,1-4.6-7', psalm: 'Sl 146(147),1-2.3-4.5-6', secondReading: '1Cor 9,16-19.22-23', gospel: 'Mc 1,29-39' },
    'TC-6':  { firstReading: 'Lv 13,1-2.45-46', psalm: 'Sl 31(32),1-2.5.11', secondReading: '1Cor 10,31-11,1', gospel: 'Mc 1,40-45' },
    'TC-7':  { firstReading: 'Is 43,18-19.21-22.24b-25', psalm: 'Sl 40(41),2-3.4-5.13-14', secondReading: '2Cor 1,18-22', gospel: 'Mc 2,1-12' },
    'TC-8':  { firstReading: 'Os 2,16b.17b.21-22', psalm: 'Sl 102(103),1-2.3-4.8.10.12-13', secondReading: '2Cor 3,1b-6', gospel: 'Mc 2,18-22' },
    'TC-9':  { firstReading: 'Dt 5,12-15', psalm: 'Sl 80(81),3-4.5-6ab.6c-8a.10-11ab', secondReading: '2Cor 4,6-11', gospel: 'Mc 2,23-3,6' },
    'TC-10': { firstReading: 'Gn 3,9-15', psalm: 'Sl 129(130),1-2.3-4.5-6.7-8', secondReading: '2Cor 4,13-5,1', gospel: 'Mc 3,20-35' },
    'TC-11': { firstReading: 'Ez 17,22-24', psalm: 'Sl 91(92),2-3.13-14.15-16', secondReading: '2Cor 5,6-10', gospel: 'Mc 4,26-34' },
    'TC-12': { firstReading: 'Jó 38,1.8-11', psalm: 'Sl 106(107),23-24.25-26.28-29.30-31', secondReading: '2Cor 5,14-17', gospel: 'Mc 4,35-41' },
    'TC-13': { firstReading: 'Sb 1,13-15;2,23-24', psalm: 'Sl 29(30),2.4.5-6.11.12.13', secondReading: '2Cor 8,7.9.13-15', gospel: 'Mc 5,21-43' },
    'TC-14': { firstReading: 'Ez 2,2-5', psalm: 'Sl 122(123),1-2a.2bcd.3-4', secondReading: '2Cor 12,7-10', gospel: 'Mc 6,1-6' },
    'TC-15': { firstReading: 'Am 7,12-15', psalm: 'Sl 84(85),9ab.10.11-12.13-14', secondReading: 'Ef 1,3-14', gospel: 'Mc 6,7-13' },
    'TC-16': { firstReading: 'Jr 23,1-6', psalm: 'Sl 22(23),1-3a.3b-4.5.6', secondReading: 'Ef 2,13-18', gospel: 'Mc 6,30-34' },
    'TC-17': { firstReading: '2Rs 4,42-44', psalm: 'Sl 144(145),10-11.15-16.17-18', secondReading: 'Ef 4,1-6', gospel: 'Jo 6,1-15' },
    'TC-18': { firstReading: 'Êx 16,2-4.12-15', psalm: 'Sl 77(78),3.4bc.23-24.25.54', secondReading: 'Ef 4,17.20-24', gospel: 'Jo 6,24-35' },
    'TC-19': { firstReading: '1Rs 19,4-8', psalm: 'Sl 33(34),2-3.4-5.6-7.8-9', secondReading: 'Ef 4,30-5,2', gospel: 'Jo 6,41-51' },
    'TC-20': { firstReading: 'Pv 9,1-6', psalm: 'Sl 33(34),2-3.10-11.12-13.14-15', secondReading: 'Ef 5,15-20', gospel: 'Jo 6,51-58' },
    'TC-21': { firstReading: 'Js 24,1-2a.15-17.18b', psalm: 'Sl 33(34),2-3.16-17.18-19.20-21.22-23', secondReading: 'Ef 5,21-32', gospel: 'Jo 6,60-69' },
    'TC-22': { firstReading: 'Dt 4,1-2.6-8', psalm: 'Sl 14(15),2-3ab.3cd-4ab.5', secondReading: 'Tg 1,17-18.21b-22.27', gospel: 'Mc 7,1-8.14-15.21-23' },
    'TC-23': { firstReading: 'Is 35,4-7a', psalm: 'Sl 145(146),6c-7.8-9a.9bc-10', secondReading: 'Tg 2,1-5', gospel: 'Mc 7,31-37' },
    'TC-24': { firstReading: 'Is 50,5-9a', psalm: 'Sl 114(116),1-2.3-4.5-6.8-9', secondReading: 'Tg 2,14-18', gospel: 'Mc 8,27-35' },
    'TC-25': { firstReading: 'Sb 2,12.17-20', psalm: 'Sl 53(54),3-4.5.6.8', secondReading: 'Tg 3,16-4,3', gospel: 'Mc 9,30-37' },
    'TC-26': { firstReading: 'Nm 11,25-29', psalm: 'Sl 18(19),8.10.12-13.14', secondReading: 'Tg 5,1-6', gospel: 'Mc 9,38-43.45.47-48' },
    'TC-27': { firstReading: 'Gn 2,18-24', psalm: 'Sl 127(128),1-2.3.4-5.6', secondReading: 'Hb 2,9-11', gospel: 'Mc 10,2-16' },
    'TC-28': { firstReading: 'Sb 7,7-11', psalm: 'Sl 89(90),12-13.14-15.16-17', secondReading: 'Hb 4,12-13', gospel: 'Mc 10,17-30' },
    'TC-29': { firstReading: 'Is 53,10-11', psalm: 'Sl 32(33),4-5.18-19.20.22', secondReading: 'Hb 4,14-16', gospel: 'Mc 10,35-45' },
    'TC-30': { firstReading: 'Jr 31,7-9', psalm: 'Sl 125(126),1-2ab.2cd-3.4-5.6', secondReading: 'Hb 5,1-6', gospel: 'Mc 10,46-52' },
    'TC-31': { firstReading: 'Dt 6,2-6', psalm: 'Sl 17(18),2-3a.3bc-4.47.51', secondReading: 'Hb 7,23-28', gospel: 'Mc 12,28b-34' },
    'TC-32': { firstReading: '1Rs 17,10-16', psalm: 'Sl 145(146),6c-7.8-9a.9bc-10', secondReading: 'Hb 9,24-28', gospel: 'Mc 12,38-44' },
    'TC-33': { firstReading: 'Dn 12,1-3', psalm: 'Sl 15(16),5.8.9-10.11', secondReading: 'Hb 10,11-14.18', gospel: 'Mc 13,24-32' },
    'TC-34': { firstReading: 'Dn 7,13-14', psalm: 'Sl 92(93),1ab.1cd-2.5', secondReading: 'Ap 1,5-8', gospel: 'Jo 18,33b-37' },
    'SS-TRINDADE-B': { firstReading: 'Dt 4,32-34.39-40', psalm: 'Sl 32(33),4-5.6.9.18-19.20.22', secondReading: 'Rm 8,14-17', gospel: 'Mt 28,16-20' },
    'CORPUS-B':      { firstReading: 'Êx 24,3-8', psalm: 'Sl 115(116),12-13.15-16bc.17-18', secondReading: 'Hb 9,11-15', gospel: 'Mc 14,12-16.22-26' },
  },

  C: {
    'ADV-1': { firstReading: 'Jr 33,14-16', psalm: 'Sl 24(25),4bc-5.8-9.10.14', secondReading: '1Ts 3,12-4,2', gospel: 'Lc 21,25-28.34-36' },
    'ADV-2': { firstReading: 'Br 5,1-9', psalm: 'Sl 125(126),1-2ab.2cd-3.4-5.6', secondReading: 'Fl 1,4-6.8-11', gospel: 'Lc 3,1-6' },
    'ADV-3': { firstReading: 'Sf 3,14-18a', psalm: 'Is 12,2-3.4bcd.5-6', secondReading: 'Fl 4,4-7', gospel: 'Lc 3,10-18' },
    'ADV-4': { firstReading: 'Mq 5,1-4a', psalm: 'Sl 79(80),2ac.3b.15-16.18-19', secondReading: 'Hb 10,5-10', gospel: 'Lc 1,39-45' },
    'NAT-NOITE':    { firstReading: 'Is 9,1-3.5-6', psalm: 'Sl 95(96),1-2a.2b-3.11-12.13', secondReading: 'Tt 2,11-14', gospel: 'Lc 2,1-14' },
    'NAT-AURORA':   { firstReading: 'Is 62,11-12', psalm: 'Sl 96(97),1.6.11-12', secondReading: 'Tt 3,4-7', gospel: 'Lc 2,15-20' },
    'NAT-DIA':      { firstReading: 'Is 52,7-10', psalm: 'Sl 97(98),1.2-3ab.3cd-4.5-6', secondReading: 'Hb 1,1-6', gospel: 'Jo 1,1-18' },
    'NAT-SFamilia': { firstReading: '1Sm 1,20-22.24-28', psalm: 'Sl 83(84),2-3.5-6.9-10', secondReading: '1Jo 3,1-2.21-24', gospel: 'Lc 2,41-52' },
    'NAT-1jan':     { firstReading: 'Nm 6,22-27', psalm: 'Sl 66(67),2-3.5.6.8', secondReading: 'Gl 4,4-7', gospel: 'Lc 2,16-21' },
    'NAT-EPIFANIA': { firstReading: 'Is 60,1-6', psalm: 'Sl 71(72),1-2.7-8.10-11.12-13', secondReading: 'Ef 3,2-3a.5-6', gospel: 'Mt 2,1-12' },
    'NAT-BATISMO':  { firstReading: 'Is 40,1-5.9-11', psalm: 'Sl 103(104),1b-2.3-4.24-25.27-28.29bc-30', secondReading: 'Tt 2,11-14;3,4-7', gospel: 'Lc 3,15-16.21-22' },
    'LAQ-1': { firstReading: 'Dt 26,4-10', psalm: 'Sl 90(91),1-2.10-11.12-13.14-15', secondReading: 'Rm 10,8-13', gospel: 'Lc 4,1-13' },
    'LAQ-2': { firstReading: 'Gn 15,5-12.17-18', psalm: 'Sl 26(27),1.7-8a.8b-9abc.13-14', secondReading: 'Fl 3,17-4,1', gospel: 'Lc 9,28b-36' },
    'LAQ-3': { firstReading: 'Êx 3,1-8a.13-15', psalm: 'Sl 102(103),1-2.3-4.6-7.8.11', secondReading: '1Cor 10,1-6.10-12', gospel: 'Lc 13,1-9' },
    'LAQ-4': { firstReading: 'Js 5,9a.10-12', psalm: 'Sl 33(34),2-3.4-5.6-7', secondReading: '2Cor 5,17-21', gospel: 'Lc 15,1-3.11-32' },
    'LAQ-5': { firstReading: 'Is 43,16-21', psalm: 'Sl 125(126),1-2ab.2cd-3.4-5.6', secondReading: 'Fl 3,8-14', gospel: 'Jo 8,1-11' },
    'LAQ-RAMOS': { firstReading: 'Is 50,4-7', psalm: 'Sl 21(22),8-9.17-18a.19-20.23-24', secondReading: 'Fl 2,6-11', gospel: 'Lc 22,14-23,56' },
    'PAC-PASCOA': { firstReading: 'At 10,34a.37-43', psalm: 'Sl 117(118),1-2.16ab-17.22-23', secondReading: 'Cl 3,1-4', gospel: 'Jo 20,1-9' },
    'PAC-2':  { firstReading: 'At 5,12-16', psalm: 'Sl 117(118),2-4.13-15.22-24', secondReading: 'Ap 1,9-11a.12-13.17-19', gospel: 'Jo 20,19-31' },
    'PAC-3':  { firstReading: 'At 5,27b-32.40b-41', psalm: 'Sl 29(30),2.4.5-6.11-12a.13b', secondReading: 'Ap 5,11-14', gospel: 'Jo 21,1-19' },
    'PAC-4':  { firstReading: 'At 13,14.43-52', psalm: 'Sl 99(100),1b-2.3.5', secondReading: 'Ap 7,9.14b-17', gospel: 'Jo 10,27-30' },
    'PAC-5':  { firstReading: 'At 14,21b-27', psalm: 'Sl 144(145),8-9.10-11.12-13ab', secondReading: 'Ap 21,1-5a', gospel: 'Jo 13,31-33a.34-35' },
    'PAC-6':  { firstReading: 'At 15,1-2.22-29', psalm: 'Sl 66(67),2-3.5.6.8', secondReading: 'Ap 21,10-14.22-23', gospel: 'Jo 14,23-29' },
    'PAC-ASCENSAO': { firstReading: 'At 1,1-11', psalm: 'Sl 46(47),2-3.6-7.8-9', secondReading: 'Ef 1,17-23', gospel: 'Lc 24,46-53' },
    'PAC-7':  { firstReading: 'At 7,55-60', psalm: 'Sl 96(97),1-2.6-7.9', secondReading: 'Ap 22,12-14.16-17.20', gospel: 'Jo 17,20-26' },
    'PAC-PENTECOSTES': { firstReading: 'At 2,1-11', psalm: 'Sl 103(104),1ab.24ac.29bc-30.31.34', secondReading: 'Rm 8,8-17', gospel: 'Jo 14,15-16.23b-26' },
    'TC-2':  { firstReading: 'Is 62,1-5', psalm: 'Sl 95(96),1-2a.2b-3.7-8a.9-10ac', secondReading: '1Cor 12,4-11', gospel: 'Jo 2,1-11' },
    'TC-3':  { firstReading: 'Ne 8,2-4a.5-6.8-10', psalm: 'Sl 18(19),8.9.10.15', secondReading: '1Cor 12,12-30', gospel: 'Lc 1,1-4;4,14-21' },
    'TC-4':  { firstReading: 'Jr 1,4-5.17-19', psalm: 'Sl 70(71),1-2.3-4a.5-6ab.15.17', secondReading: '1Cor 12,31-13,13', gospel: 'Lc 4,21-30' },
    'TC-5':  { firstReading: 'Is 6,1-2a.3-8', psalm: 'Sl 137(138),1-2ab.2c-3.4-5.7c-8', secondReading: '1Cor 15,1-11', gospel: 'Lc 5,1-11' },
    'TC-6':  { firstReading: 'Jr 17,5-8', psalm: 'Sl 1,1-2.3.4.6', secondReading: '1Cor 15,12.16-20', gospel: 'Lc 6,17.20-26' },
    'TC-7':  { firstReading: '1Sm 26,2.7-9.12-13.22-23', psalm: 'Sl 102(103),1-2.3-4.8.10.12-13', secondReading: '1Cor 15,45-49', gospel: 'Lc 6,27-38' },
    'TC-8':  { firstReading: 'Eclo 27,4-7', psalm: 'Sl 91(92),2-3.13-14.15-16', secondReading: '1Cor 15,54-58', gospel: 'Lc 6,39-45' },
    'TC-9':  { firstReading: '1Rs 8,41-43', psalm: 'Sl 116(117),1.2', secondReading: 'Gl 1,1-2.6-10', gospel: 'Lc 7,1-10' },
    'TC-10': { firstReading: '1Rs 17,17-24', psalm: 'Sl 29(30),2.4.5-6.11.12.13', secondReading: 'Gl 1,11-19', gospel: 'Lc 7,11-17' },
    'TC-11': { firstReading: '2Sm 12,7-10.13', psalm: 'Sl 31(32),1-2.5.7.11', secondReading: 'Gl 2,16.19-21', gospel: 'Lc 7,36-8,3' },
    'TC-12': { firstReading: 'Zc 12,10-11;13,1', psalm: 'Sl 62(63),2.3-4.5-6.8-9', secondReading: 'Gl 3,26-29', gospel: 'Lc 9,18-24' },
    'TC-13': { firstReading: '1Rs 19,16b.19-21', psalm: 'Sl 15(16),1-2a.5.7-8.9-10.11', secondReading: 'Gl 5,1.13-18', gospel: 'Lc 9,51-62' },
    'TC-14': { firstReading: 'Is 66,10-14c', psalm: 'Sl 65(66),1-3a.4-5.6-7a.16.20', secondReading: 'Gl 6,14-18', gospel: 'Lc 10,1-12.17-20' },
    'TC-15': { firstReading: 'Dt 30,10-14', psalm: 'Sl 68(69),14.17.30-31.33-34.36.37', secondReading: 'Cl 1,15-20', gospel: 'Lc 10,25-37' },
    'TC-16': { firstReading: 'Gn 18,1-10a', psalm: 'Sl 14(15),2-3ab.3cd-4ab.5', secondReading: 'Cl 1,24-28', gospel: 'Lc 10,38-42' },
    'TC-17': { firstReading: 'Gn 18,20-32', psalm: 'Sl 137(138),1-2ab.2c-3.6-7ab.7c-8', secondReading: 'Cl 2,12-14', gospel: 'Lc 11,1-13' },
    'TC-18': { firstReading: 'Ecl 1,2;2,21-23', psalm: 'Sl 89(90),3-4.5-6.12-13.14.17', secondReading: 'Cl 3,1-5.9-11', gospel: 'Lc 12,13-21' },
    'TC-19': { firstReading: 'Sb 18,6-9', psalm: 'Sl 32(33),1.12.18-19.20-22', secondReading: 'Hb 11,1-2.8-19', gospel: 'Lc 12,32-48' },
    'TC-20': { firstReading: 'Jr 38,4-6.8-10', psalm: 'Sl 39(40),2.3.4.18', secondReading: 'Hb 12,1-4', gospel: 'Lc 12,49-53' },
    'TC-21': { firstReading: 'Is 66,18-21', psalm: 'Sl 116(117),1.2', secondReading: 'Hb 12,5-7.11-13', gospel: 'Lc 13,22-30' },
    'TC-22': { firstReading: 'Eclo 3,17-18.20.28-29', psalm: 'Sl 67(68),4-5ac.6-7ab.10-11', secondReading: 'Hb 12,18-19.22-24a', gospel: 'Lc 14,1.7-14' },
    'TC-23': { firstReading: 'Sb 9,13-18b', psalm: 'Sl 89(90),3-4.5-6.12-13.14.17', secondReading: 'Fm 9-10.12-17', gospel: 'Lc 14,25-33' },
    'TC-24': { firstReading: 'Êx 32,7-11.13-14', psalm: 'Sl 50(51),3-4.12-13.17.19', secondReading: '1Tm 1,12-17', gospel: 'Lc 15,1-32' },
    'TC-25': { firstReading: 'Am 8,4-7', psalm: 'Sl 112(113),1-2.4-6.7-8', secondReading: '1Tm 2,1-8', gospel: 'Lc 16,1-13' },
    'TC-26': { firstReading: 'Am 6,1a.4-7', psalm: 'Sl 145(146),6c-7.8-9a.9bc-10', secondReading: '1Tm 6,11-16', gospel: 'Lc 16,19-31' },
    'TC-27': { firstReading: 'Hab 1,2-3;2,2-4', psalm: 'Sl 94(95),1-2.6-7.8-9', secondReading: '2Tm 1,6-8.13-14', gospel: 'Lc 17,5-10' },
    'TC-28': { firstReading: '2Rs 5,14-17', psalm: 'Sl 97(98),1.2-3ab.3cd-4', secondReading: '2Tm 2,8-13', gospel: 'Lc 17,11-19' },
    'TC-29': { firstReading: 'Êx 17,8-13', psalm: 'Sl 120(121),1-2.3-4.5-6.7-8', secondReading: '2Tm 3,14-4,2', gospel: 'Lc 18,1-8' },
    'TC-30': { firstReading: 'Eclo 35,15b-17.20-22a', psalm: 'Sl 33(34),2-3.17-18.19.23', secondReading: '2Tm 4,6-8.16-18', gospel: 'Lc 18,9-14' },
    'TC-31': { firstReading: 'Sb 11,22-12,2', psalm: 'Sl 144(145),1-2.8-9.10-11.13cd-14', secondReading: '2Ts 1,11-2,2', gospel: 'Lc 19,1-10' },
    'TC-32': { firstReading: '2Mc 7,1-2.9-14', psalm: 'Sl 16(17),1.5-6.8b.15', secondReading: '2Ts 2,16-3,5', gospel: 'Lc 20,27-38' },
    'TC-33': { firstReading: 'Ml 3,19-20a', psalm: 'Sl 97(98),5-6.7-8.9', secondReading: '2Ts 3,7-12', gospel: 'Lc 21,5-19' },
    'TC-34': { firstReading: '2Sm 5,1-3', psalm: 'Sl 121(122),1-2.3-4b.4cd-5', secondReading: 'Cl 1,12-20', gospel: 'Lc 23,35-43' },
    'SS-TRINDADE-C': { firstReading: 'Pv 8,22-31', psalm: 'Sl 8,4-5.6-7.8-9', secondReading: 'Rm 5,1-5', gospel: 'Jo 16,12-15' },
    'CORPUS-C':      { firstReading: 'Gn 14,18-20', psalm: 'Sl 109(110),1.2.3.4', secondReading: '1Cor 11,23-26', gospel: 'Lc 9,11b-17' },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. SANTORAL — DATAS FIXAS (Próprio dos Santos)
// ─────────────────────────────────────────────────────────────────────────────

export interface SaintEntry {
  name: string;
  rank: CelebrationRank;
  color: LiturgicalColor;
  readings?: ReadingRefs;
}

// Chave: "MM-DD"
export const SANCTORAL: Record<string, SaintEntry> = {
  // JANEIRO
  '01-01': { name: 'Solenidade de Santa Maria, Mãe de Deus', rank: 'solenidade', color: 'branco',
    readings: { firstReading: 'Nm 6,22-27', psalm: 'Sl 66(67),2-3.5.6.8', secondReading: 'Gl 4,4-7', gospel: 'Lc 2,16-21' } },
  '01-06': { name: 'Epifania do Senhor', rank: 'solenidade', color: 'branco',
    readings: { firstReading: 'Is 60,1-6', psalm: 'Sl 71(72),1-2.7-8.10-11.12-13', secondReading: 'Ef 3,2-3a.5-6', gospel: 'Mt 2,1-12' } },
  '01-13': { name: 'Batismo do Senhor', rank: 'festa', color: 'branco',
    readings: { firstReading: 'Is 42,1-4.6-7', psalm: 'Sl 28(29),1a.2.3ac-4.9b-10', secondReading: 'At 10,34-38', gospel: 'Mt 3,13-17' } },
  '01-17': { name: 'Santo Antônio, Abade — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Hb 13,7-9a', psalm: 'Sl 15(16),1-2a.5.7-8.9-10.11', gospel: 'Mt 19,16-26' } },
  '01-20': { name: 'São Sebastião, mártir — Memória', rank: 'memoria_obrigatoria', color: 'vermelho',
    readings: { firstReading: '2Tm 2,8-10;3,10-12', psalm: 'Sl 125(126),1-2ab.2cd-3.4-5.6', gospel: 'Jo 17,11b-19' } },
  '01-21': { name: 'Santa Inês, virgem e mártir — Memória', rank: 'memoria_obrigatoria', color: 'vermelho',
    readings: { firstReading: '1Cor 1,26-31', psalm: 'Sl 22(23),1-3a.3b-4.5.6', gospel: 'Mt 13,44-46' } },
  '01-22': { name: 'São Vicente Diácono e Mártir — Memória', rank: 'memoria_obrigatoria', color: 'vermelho',
    readings: { firstReading: 'At 6,8-10;7,54-60', psalm: 'Sl 30(31),3cd-4.6.8ab.17.21ab', gospel: 'Mt 10,17-22' } },
  '01-24': { name: 'São Francisco de Sales, bispo e doutor — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Ef 3,8-12', psalm: 'Sl 36(37),3-4.5-6.27-28.39-40', gospel: 'Mt 18,12-14' } },
  '01-25': { name: 'Conversão de São Paulo, Apóstolo — Festa', rank: 'festa', color: 'branco',
    readings: { firstReading: 'At 22,3-16', psalm: 'Sl 116(117),1.2', gospel: 'Mc 16,15-18' } },
  '01-26': { name: 'Santos Timóteo e Tito, bispos — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: '2Tm 1,1-8', psalm: 'Sl 95(96),1-2a.2b-3.7-8a.10', gospel: 'Lc 10,1-9' } },
  '01-28': { name: 'São Tomás de Aquino, presbítero e doutor — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Sb 7,7-10.15-16', psalm: 'Sl 118(119),9.10.11.12.13.14', gospel: 'Mt 23,8-12' } },
  '01-31': { name: 'São João Bosco, presbítero — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Is 58,6-11', psalm: 'Sl 111(112),1-2.3-5.9', gospel: 'Mt 18,1-5.10' } },
  // FEVEREIRO
  '02-02': { name: 'Apresentação do Senhor — Festa', rank: 'festa', color: 'branco',
    readings: { firstReading: 'Ml 3,1-4', psalm: 'Sl 23(24),7.8.9.10', secondReading: 'Hb 2,14-18', gospel: 'Lc 2,22-40' } },
  '02-03': { name: 'São Brás, bispo e mártir — Memória', rank: 'memoria_facultativa', color: 'vermelho',
    readings: { firstReading: '2Tm 2,8-13', psalm: 'Sl 33(34),2-3.17-18.19.23', gospel: 'Jo 15,18-21' } },
  '02-05': { name: 'Santa Águeda, virgem e mártir — Memória', rank: 'memoria_obrigatoria', color: 'vermelho',
    readings: { firstReading: '1Cor 1,26-31', psalm: 'Sl 30(31),3cd-4.6.8ab.17.21ab', gospel: 'Mt 25,1-13' } },
  '02-06': { name: 'São Paulo Miki e companheiros, mártires — Memória', rank: 'memoria_obrigatoria', color: 'vermelho',
    readings: { firstReading: 'Gl 2,19-20', psalm: 'Sl 125(126),1-2ab.2cd-3.4-5.6', gospel: 'Jo 12,24-26' } },
  '02-10': { name: 'Santa Escolástica, virgem — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: '1Jo 4,7-16', psalm: 'Sl 148,1-2.11-12.13.14', gospel: 'Mt 12,46-50' } },
  '02-11': { name: 'Nossa Senhora de Lourdes — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Is 66,10-14c', psalm: 'Jt 13,18bcde.19', gospel: 'Jo 2,1-11' } },
  '02-14': { name: 'Santos Cirilo, monge, e Metódio, bispo — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'At 13,46-49', psalm: 'Sl 116(117),1.2', gospel: 'Lc 10,1-9' } },
  '02-17': { name: 'Santos Sete Fundadores da Ordem dos Servitas — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Gl 2,19-20', psalm: 'Sl 23(24),1.2.3-4ab.5-6', gospel: 'Jo 12,24-26' } },
  '02-21': { name: 'São Pedro Damião, bispo e doutor — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: '1Rs 19,9-18', psalm: 'Sl 93(94),1-2.13-14.17-18', gospel: 'Mt 11,28-30' } },
  '02-22': { name: 'Cátedra de São Pedro, Apóstolo — Festa', rank: 'festa', color: 'branco',
    readings: { firstReading: '1Pd 5,1-4', psalm: 'Sl 22(23),1-3a.3b-4.5.6', gospel: 'Mt 16,13-19' } },
  '02-23': { name: 'São Policarpo, bispo e mártir — Memória', rank: 'memoria_obrigatoria', color: 'vermelho',
    readings: { firstReading: 'Ap 2,8-11', psalm: 'Sl 30(31),3cd-4.6.8ab.17.21ab', gospel: 'Jo 15,18-21' } },
  // MARÇO
  '03-04': { name: 'São Casimiro — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Mq 6,8', psalm: 'Sl 14(15),2-3ab.3cd-4ab.5', gospel: 'Mt 5,1-12' } },
  '03-07': { name: 'Santos Perpétua e Felicidade, mártires — Memória', rank: 'memoria_obrigatoria', color: 'vermelho',
    readings: { firstReading: 'Ap 7,9-17', psalm: 'Sl 123(124),2-3.4-5.7b-8', gospel: 'Jo 17,11b-19' } },
  '03-08': { name: 'São João de Deus, religioso — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Is 58,6-11', psalm: 'Sl 41(42),2.3;43(44),3.4', gospel: 'Mt 25,31-40' } },
  '03-17': { name: 'Santo Patrício, bispo — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'At 13,46-49', psalm: 'Sl 116(117),1.2', gospel: 'Mc 16,15-20' } },
  '03-18': { name: 'São Cirilo de Jerusalém, bispo e doutor — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Is 61,1-3a', psalm: 'Sl 88(89),2-3.21-22.25.27', gospel: 'Jo 16,12-15' } },
  '03-19': { name: 'São José, esposo da Virgem Maria — Solenidade', rank: 'solenidade', color: 'branco',
    readings: { firstReading: '2Sm 7,4-5a.12-14a.16', psalm: 'Sl 88(89),2-3.4-5.27.29', secondReading: 'Rm 4,13.16-18.22', gospel: 'Mt 1,16.18-21.24a' } },
  '03-25': { name: 'Anunciação do Senhor — Solenidade', rank: 'solenidade', color: 'branco',
    readings: { firstReading: 'Is 7,10-14;8,10c', psalm: 'Sl 39(40),7-8a.8b-9.10.11', secondReading: 'Hb 10,4-10', gospel: 'Lc 1,26-38' } },
  // ABRIL
  '04-02': { name: 'São Francisco de Paula, eremita — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Gl 2,19-20', psalm: 'Sl 15(16),1-2a.5.7-8.9-10.11', gospel: 'Mt 6,24-34' } },
  '04-04': { name: 'Santo Isidoro, bispo e doutor — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Pv 2,1-9', psalm: 'Sl 18(19),8.9.10.11', gospel: 'Mt 13,47-52' } },
  '04-05': { name: 'São Vicente Ferrer, presbítero — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: '1Cor 1,18-25', psalm: 'Sl 1,1-2.3.4.6', gospel: 'Jo 15,9-17' } },
  '04-07': { name: 'São João Batista de La Salle, presbítero — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Is 52,7-10', psalm: 'Sl 95(96),1-3.7-8a.10', gospel: 'Mc 10,13-16' } },
  '04-11': { name: 'São Estanislau, bispo e mártir — Memória', rank: 'memoria_obrigatoria', color: 'vermelho',
    readings: { firstReading: 'Ap 12,10-12a', psalm: 'Sl 33(34),2-3.17-18.19.23', gospel: 'Jo 17,11b-19' } },
  '04-13': { name: 'São Martinho I, papa e mártir — Memória', rank: 'memoria_facultativa', color: 'vermelho',
    readings: { firstReading: 'Fp 1,27-30', psalm: 'Sl 17(18),2-3a.3bc-4.22-23', gospel: 'Jo 15,18-21' } },
  '04-21': { name: 'São Anselmo, bispo e doutor — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Ef 3,14-19', psalm: 'Sl 144(145),1-2.8-9.10-11', gospel: 'Jo 17,24-26' } },
  '04-23': { name: 'São Jorge, mártir — Memória', rank: 'memoria_facultativa', color: 'vermelho',
    readings: { firstReading: '2Tm 2,8-13', psalm: 'Sl 125(126),1-2ab.2cd-3.4-5.6', gospel: 'Jo 15,18-21' } },
  '04-24': { name: 'São Fidélis de Sigmaringa, presbítero e mártir — Memória', rank: 'memoria_obrigatoria', color: 'vermelho',
    readings: { firstReading: '2Cor 4,7-15', psalm: 'Sl 30(31),3cd-4.6.8ab.17.21ab', gospel: 'Jo 12,24-26' } },
  '04-25': { name: 'São Marcos, Evangelista — Festa', rank: 'festa', color: 'vermelho',
    readings: { firstReading: '1Pd 5,5b-14', psalm: 'Sl 88(89),2-3.6-7.16-17', gospel: 'Mc 16,15-20' } },
  '04-28': { name: 'São Pedro Chanel, presbítero e mártir — Memória', rank: 'memoria_obrigatoria', color: 'vermelho',
    readings: { firstReading: 'Is 52,13-53,12', psalm: 'Sl 117(118),1-2.16ab-17.22-24', gospel: 'Mt 28,16-20' } },
  '04-29': { name: 'Santa Catarina de Sena, virgem e doutora — Festa', rank: 'festa', color: 'branco',
    readings: { firstReading: '1Jo 1,5-2,2', psalm: 'Sl 102(103),1-2.3-4.8.10', gospel: 'Mt 11,25-30' } },
  '04-30': { name: 'São Pio V, papa — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Ef 6,10-20', psalm: 'Sl 21(22),2-3.4-5.6-7', gospel: 'Jo 10,11-16' } },
  // MAIO
  '05-01': { name: 'São José Operário — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Gn 1,26-2,3', psalm: 'Sl 89(90),2.3-4.12-13.14.16', gospel: 'Mt 13,54-58' } },
  '05-02': { name: 'São Atanásio, bispo e doutor — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: '1Jo 5,1-5', psalm: 'Sl 36(37),3-4.5-6.27-28.39-40', gospel: 'Mt 10,22-25a' } },
  '05-03': { name: 'Santos Filipe e Tiago, Apóstolos — Festa', rank: 'festa', color: 'vermelho',
    readings: { firstReading: '1Cor 15,1-8', psalm: 'Sl 18(19),2-3.4-5', gospel: 'Jo 14,6-14' } },
  '05-10': { name: 'São Damião de Molokai, presbítero — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Is 61,1-3', psalm: 'Sl 22(23),1-3a.3b-4.5.6', gospel: 'Mc 6,34-44' } },
  '05-12': { name: 'Santos Nereu, Aquileu e Pancrácio, mártires — Memória', rank: 'memoria_obrigatoria', color: 'vermelho',
    readings: { firstReading: 'Ap 7,9-17', psalm: 'Sl 123(124),2-3.4-5.7b-8', gospel: 'Mc 13,9-13' } },
  '05-13': { name: 'Nossa Senhora de Fátima — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Is 61,9-11', psalm: 'Jt 13,18bcde.19', gospel: 'Lc 1,26-38' } },
  '05-14': { name: 'São Matias, Apóstolo — Festa', rank: 'festa', color: 'vermelho',
    readings: { firstReading: 'At 1,15-17.20-26', psalm: 'Sl 112(113),1-2.3-4.5-6.7-8', gospel: 'Jo 15,9-17' } },
  '05-15': { name: 'São Isidoro Lavrador — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Gn 2,15', psalm: 'Sl 127(128),1-2.3.4-5', gospel: 'Mt 6,25-34' } },
  '05-18': { name: 'São João I, papa e mártir — Memória', rank: 'memoria_facultativa', color: 'vermelho',
    readings: { firstReading: 'At 4,8-12', psalm: 'Sl 2,1-3.4-6.7-9', gospel: 'Jo 21,15-17' } },
  '05-20': { name: 'São Bernardino de Sena, presbítero — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'At 4,8-12', psalm: 'Sl 144(145),1-2.10-11.12-13ab', gospel: 'Lc 9,57-62' } },
  '05-21': { name: 'São Cristóvão Magallanes e companheiros, mártires — Memória', rank: 'memoria_obrigatoria', color: 'vermelho',
    readings: { firstReading: '1Pd 4,13-16', psalm: 'Sl 124(125),1-2.3.4-5', gospel: 'Mt 16,24-27' } },
  '05-22': { name: 'Santa Rita de Cássia, religiosa — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Gl 2,19-20', psalm: 'Sl 22(23),1-3a.3b-4.5.6', gospel: 'Mt 11,25-30' } },
  '05-25': { name: 'São Beda, presbítero e doutor — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Pv 3,13-18', psalm: 'Sl 118(119),14.24.72.103.111.131', gospel: 'Mt 13,47-52' } },
  '05-26': { name: 'São Filipe Néri, presbítero — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Rm 5,1-5', psalm: 'Sl 97(98),1.2-3ab.3cd-4', gospel: 'Jo 15,7-11' } },
  '05-27': { name: 'São Agostinho de Cantuária, bispo — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Is 52,7-10', psalm: 'Sl 95(96),1-3.7-8a.10', gospel: 'Mc 16,15-20' } },
  '05-31': { name: 'Visitação de Nossa Senhora — Festa', rank: 'festa', color: 'branco',
    readings: { firstReading: 'Sf 3,14-18a', psalm: 'Is 12,2-3.4bcd.5-6', gospel: 'Lc 1,39-56' } },
  // JUNHO
  '06-01': { name: 'São Justino, mártir — Memória', rank: 'memoria_obrigatoria', color: 'vermelho',
    readings: { firstReading: '1Cor 1,18-25', psalm: 'Sl 33(34),2-3.4-5.6-7.8-9', gospel: 'Mc 6,14-29' } },
  '06-02': { name: 'Santos Marcelino e Pedro, mártires — Memória', rank: 'memoria_facultativa', color: 'vermelho',
    readings: { firstReading: 'Sb 3,1-9', psalm: 'Sl 125(126),1-2ab.2cd-3.4-5.6', gospel: 'Mt 5,1-12' } },
  '06-03': { name: 'São Carlos Lwanga e companheiros, mártires — Memória', rank: 'memoria_obrigatoria', color: 'vermelho',
    readings: { firstReading: 'Sb 3,1-9', psalm: 'Sl 123(124),2-3.4-5.7b-8', gospel: 'Mt 5,1-12a' } },
  '06-05': { name: 'São Bonifácio, bispo e mártir — Memória', rank: 'memoria_obrigatoria', color: 'vermelho',
    readings: { firstReading: 'At 26,19-23', psalm: 'Sl 116(117),1.2', gospel: 'Mc 16,15-20' } },
  '06-06': { name: 'São Norberto, bispo — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Ez 34,11-16', psalm: 'Sl 22(23),1-3a.3b-4.5.6', gospel: 'Jo 10,11-16' } },
  '06-09': { name: 'São Éfrem, diácono e doutor — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Rm 8,22-27', psalm: 'Sl 70(71),1-2.3-4a.5-6ab', gospel: 'Jo 7,37-39' } },
  '06-11': { name: 'São Barnabé, Apóstolo — Memória', rank: 'memoria_obrigatoria', color: 'vermelho',
    readings: { firstReading: 'At 11,21b-26;13,1-3', psalm: 'Sl 97(98),1.2-3ab.3cd-4.5-6', gospel: 'Mt 10,7-13' } },
  '06-13': { name: 'Santo Antônio de Pádua, presbítero e doutor — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Is 61,1-3a', psalm: 'Sl 88(89),2-3.4-5.21-22.25', gospel: 'Mt 5,1-12a' } },
  '06-19': { name: 'São Romualdo, abade — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Flp 3,8-14', psalm: 'Sl 22(23),1-3a.3b-4.5.6', gospel: 'Lc 14,25-33' } },
  '06-21': { name: 'São Luís Gonzaga, religioso — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: '1Jo 5,1-5', psalm: 'Sl 24(25),2-3.4-5ab.6-7bc.20-21', gospel: 'Mt 22,35-40' } },
  '06-22': { name: 'São Paulino de Nola, bispo — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: '1Jo 3,14-18', psalm: 'Sl 111(112),1-2.3-5.9', gospel: 'Jo 15,12-17' } },
  '06-24': { name: 'Natividade de São João Batista — Solenidade', rank: 'solenidade', color: 'branco',
    readings: { firstReading: 'Is 49,1-6', psalm: 'Sl 138(139),1-3.13-14ab.14c-15', secondReading: 'At 13,22-26', gospel: 'Lc 1,57-66.80' } },
  '06-27': { name: 'São Cirilo de Alexandria, bispo e doutor — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Is 40,12-14.18-19.21-23.25-26', psalm: 'Sl 113(114),1-2.3-4.5-6.7-8', gospel: 'Jo 1,1-5.9-14.16-18' } },
  '06-28': { name: 'São Ireneu, bispo e mártir — Memória', rank: 'memoria_obrigatoria', color: 'vermelho',
    readings: { firstReading: 'At 20,17-18a.28-32.36', psalm: 'Sl 110(111),1-2.3-4.5-6.7-8', gospel: 'Jo 17,20-26' } },
  '06-29': { name: 'São Pedro e São Paulo, Apóstolos — Solenidade', rank: 'solenidade', color: 'vermelho',
    readings: { firstReading: 'At 12,1-11', psalm: 'Sl 33(34),2-3.4-5.6-7.8-9', secondReading: '2Tm 4,6-8.17-18', gospel: 'Mt 16,13-19' } },
  '06-30': { name: 'Santos Primeiros Mártires da Igreja de Roma — Memória', rank: 'memoria_obrigatoria', color: 'vermelho',
    readings: { firstReading: 'Sb 3,1-9', psalm: 'Sl 124(125),1-2.3.4-5', gospel: 'Mt 5,1-12a' } },
  // JULHO
  '07-01': { name: 'São Junípero Serra, presbítero — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Is 52,7-10', psalm: 'Sl 95(96),1-3.7-8a.10', gospel: 'Mc 16,15-20' } },
  '07-03': { name: 'São Tomé, Apóstolo — Festa', rank: 'festa', color: 'vermelho',
    readings: { firstReading: 'Ef 2,19-22', psalm: 'Sl 116(117),1.2', gospel: 'Jo 20,24-29' } },
  '07-04': { name: 'Santa Isabel de Portugal — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Cl 3,12-17', psalm: 'Sl 127(128),1-2.3.4-5', gospel: 'Mt 5,1-12a' } },
  '07-05': { name: 'São Antônio Zaccaria, presbítero — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: '2Tm 1,13-14;2,1-3', psalm: 'Sl 1,1-2.3.4.6', gospel: 'Mt 9,9-13' } },
  '07-06': { name: 'Santa Maria Goretti, virgem e mártir — Memória', rank: 'memoria_obrigatoria', color: 'vermelho',
    readings: { firstReading: '1Cor 6,13c-15a.17-20', psalm: 'Sl 30(31),3cd-4.6.8ab.17.21ab', gospel: 'Mt 5,25-34' } },
  '07-09': { name: 'São Augusto Czartoryski e companheiros, mártires — Memória', rank: 'memoria_obrigatoria', color: 'vermelho',
    readings: { firstReading: 'Rm 8,31b-39', psalm: 'Sl 123(124),2-3.4-5.7b-8', gospel: 'Mc 13,9-13' } },
  '07-11': { name: 'São Bento, abade — Festa', rank: 'festa', color: 'branco',
    readings: { firstReading: 'Pv 2,1-9', psalm: 'Sl 33(34),2-3.11-12.17-18.19.23', gospel: 'Mt 19,27-29' } },
  '07-13': { name: 'São Henrique II, imperador — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Dt 17,14-20', psalm: 'Sl 100(101),1-2.3-4.6-7', gospel: 'Mt 7,24-27' } },
  '07-14': { name: 'São Camilo de Lelis, presbítero — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Is 58,6-11', psalm: 'Sl 41(42),2.3;43(44),3.4', gospel: 'Jo 15,9-17' } },
  '07-15': { name: 'São Boaventura, bispo e doutor — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Ef 3,14-19', psalm: 'Sl 144(145),10-11.12-13ab.17-18', gospel: 'Mc 10,13-16' } },
  '07-16': { name: 'Nossa Senhora do Monte Carmelo — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Zc 2,14-17', psalm: 'Jt 13,18bcde.19', gospel: 'Mt 12,46-50' } },
  '07-20': { name: 'São Apolinário, bispo e mártir — Memória', rank: 'memoria_obrigatoria', color: 'vermelho',
    readings: { firstReading: 'At 20,17-18a.28-32.36', psalm: 'Sl 109(110),1.2.3.4', gospel: 'Jo 10,11-16' } },
  '07-21': { name: 'São Lourenço de Brindisi, presbítero e doutor — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: '1Cor 1,18-25', psalm: 'Sl 36(37),3-4.5-6.27-28.39-40', gospel: 'Mt 28,16-20' } },
  '07-22': { name: 'Santa Maria Madalena — Festa', rank: 'festa', color: 'branco',
    readings: { firstReading: 'Ct 3,1-4a', psalm: 'Sl 62(63),2.3-4.5-6.8-9', gospel: 'Jo 20,1-2.11-18' } },
  '07-23': { name: 'Santa Brígida, religiosa — Festa', rank: 'festa', color: 'branco',
    readings: { firstReading: 'Gl 2,19-20', psalm: 'Sl 33(34),2-3.4-5.6-7.8-9', gospel: 'Jo 15,1-8' } },
  '07-24': { name: 'São Charbel Makhlouf, presbítero — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Rm 8,14-17', psalm: 'Sl 15(16),1-2a.5.7-8.9-10.11', gospel: 'Lc 9,23-26' } },
  '07-25': { name: 'São Tiago, Apóstolo — Festa', rank: 'festa', color: 'vermelho',
    readings: { firstReading: '2Cor 4,7-15', psalm: 'Sl 65(66),10-11.12-13.16-17', gospel: 'Mt 20,20-28' } },
  '07-26': { name: 'Santos Joaquim e Ana, pais da Virgem Maria — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Eclo 44,1.10-15', psalm: 'Sl 131(132),11.13-14.17-18', gospel: 'Mt 13,16-17' } },
  '07-29': { name: 'Santa Marta, Maria e Lázaro — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: '1Jo 4,7-16', psalm: 'Sl 33(34),2-3.4-5.6-7.8-9', gospel: 'Jo 11,19-27' } },
  '07-30': { name: 'São Pedro Crisólogo, bispo e doutor — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Is 55,10-11', psalm: 'Sl 18(19),8.9.10.11', gospel: 'Mt 5,13-16' } },
  '07-31': { name: 'Santo Inácio de Loyola, presbítero — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: '1Cor 10,31-11,1', psalm: 'Sl 33(34),2-3.4-5.6-7.8-9', gospel: 'Lc 14,25-33' } },
  // AGOSTO
  '08-01': { name: 'São Afonso Maria de Ligório, bispo e doutor — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Is 55,1-3', psalm: 'Sl 144(145),8-9.15-16.17-18', gospel: 'Mt 5,13-19' } },
  '08-02': { name: 'São Éusébio de Vercelli, bispo — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: '2Tm 2,22b-26', psalm: 'Sl 111(112),1-2.3-5.9', gospel: 'Jo 17,20-23' } },
  '08-04': { name: 'São João Maria Vianney, presbítero — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Os 11,1.3-4.8c-9', psalm: 'Sl 22(23),1-3a.3b-4.5.6', gospel: 'Mt 9,35-10,1' } },
  '08-05': { name: 'Dedicação da Basílica de Santa Maria Maior — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Ap 21,1-5a', psalm: 'Sl 95(96),1-2a.2b-3.5b-6.7-8.9-10ac', gospel: 'Lc 11,27-28' } },
  '08-06': { name: 'Transfiguração do Senhor — Festa', rank: 'festa', color: 'branco',
    readings: { firstReading: 'Dn 7,9-10.13-14', psalm: 'Sl 96(97),1-2.5-6.9', secondReading: '2Pd 1,16-19', gospel: 'Mc 9,2-10' } },
  '08-07': { name: 'Santos Sisto II, papa, e companheiros, mártires — Memória', rank: 'memoria_facultativa', color: 'vermelho',
    readings: { firstReading: 'Sb 3,1-9', psalm: 'Sl 33(34),2-3.17-18.19.23', gospel: 'Jo 12,24-26' } },
  '08-08': { name: 'São Domingos, presbítero — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Os 2,16b.17b.21-22', psalm: 'Sl 33(34),2-3.4-5.6-7.8-9', gospel: 'Lc 9,57-62' } },
  '08-09': { name: 'Santa Teresa Benedita da Cruz, virgem e mártir — Memória', rank: 'memoria_obrigatoria', color: 'vermelho',
    readings: { firstReading: 'Os 2,16b.17b.21-22', psalm: 'Sl 44(45),11-12.14-15.16-17', gospel: 'Mt 25,1-13' } },
  '08-10': { name: 'São Lourenço, diácono e mártir — Festa', rank: 'festa', color: 'vermelho',
    readings: { firstReading: '2Cor 9,6-10', psalm: 'Sl 111(112),1-2.5-6.7-8.9', gospel: 'Jo 12,24-26' } },
  '08-11': { name: 'Santa Clara, virgem — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Flp 3,8-14', psalm: 'Sl 15(16),1-2a.5.7-8.9-10.11', gospel: 'Mt 19,27-29' } },
  '08-13': { name: 'Santos Ponciano, papa, e Hipólito, presbítero, mártires — Memória', rank: 'memoria_facultativa', color: 'vermelho',
    readings: { firstReading: 'Ap 2,10c', psalm: 'Sl 33(34),2-3.17-18.19.23', gospel: 'Mt 10,34-39' } },
  '08-14': { name: 'São Maximiliano Maria Kolbe, presbítero e mártir — Memória', rank: 'memoria_obrigatoria', color: 'vermelho',
    readings: { firstReading: 'Sb 3,1-9', psalm: 'Sl 15(16),1-2a.5.7-8.9-10.11', gospel: 'Jo 15,13-15' } },
  '08-15': { name: 'Assunção de Nossa Senhora — Solenidade', rank: 'solenidade', color: 'branco',
    readings: { firstReading: 'Ap 11,19a;12,1-6a.10ab', psalm: 'Sl 44(45),11-12.14-15.16-17', secondReading: '1Cor 15,20-27', gospel: 'Lc 1,39-56' } },
  '08-16': { name: 'São Estêvão da Hungria — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Dt 4,1-8', psalm: 'Sl 24(25),4bc-5.6-7.8-9', gospel: 'Mt 5,1-12a' } },
  '08-19': { name: 'São João Eudes, presbítero — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Jr 20,9', psalm: 'Sl 114(116),10-11.12-13.15-16', gospel: 'Mt 11,25-27' } },
  '08-20': { name: 'São Bernardo, abade e doutor — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Ct 2,8-14', psalm: 'Sl 130(131),1.2.3', gospel: 'Jo 15,1-8' } },
  '08-21': { name: 'São Pio X, papa — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Is 58,6-11', psalm: 'Sl 111(112),1-2.3-5.9', gospel: 'Mt 5,13-19' } },
  '08-22': { name: 'Santíssima Virgem Maria, Rainha — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Is 9,1-6', psalm: 'Sl 44(45),11-12.14-15.16-17', gospel: 'Lc 1,26-38' } },
  '08-23': { name: 'Santa Rosa de Lima, virgem — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Mq 7,7-8.18-20', psalm: 'Sl 23(24),1-2.3-4ab.5-6', gospel: 'Mt 19,27-29' } },
  '08-24': { name: 'São Bartolomeu, Apóstolo — Festa', rank: 'festa', color: 'vermelho',
    readings: { firstReading: 'Ap 21,9b-14', psalm: 'Sl 144(145),10-11.12-13ab.17-18', gospel: 'Jo 1,45-51' } },
  '08-25': { name: 'São Luís, rei; São José de Calasanz, presbítero — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Is 58,6-11', psalm: 'Sl 111(112),1-2.3-5.9', gospel: 'Mt 19,13-15' } },
  '08-27': { name: 'Santa Mônica — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Eclo 26,2-4.13-16', psalm: 'Sl 30(31),10-11.12.13-14', gospel: 'Lc 7,11-17' } },
  '08-28': { name: 'Santo Agostinho, bispo e doutor — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: '1Jo 4,7-16', psalm: 'Sl 32(33),2-3.4-5.11-12.21-22', gospel: 'Jo 17,20-26' } },
  '08-29': { name: 'Martírio de São João Batista — Memória', rank: 'memoria_obrigatoria', color: 'vermelho',
    readings: { firstReading: 'Jr 1,17-19', psalm: 'Sl 70(71),1-2.3-4a.5-6ab.15.17', gospel: 'Mc 6,17-29' } },
  // SETEMBRO
  '09-03': { name: 'São Gregório Magno, papa e doutor — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Ez 34,11-16', psalm: 'Sl 22(23),1-3a.3b-4.5.6', gospel: 'Jo 21,15-17' } },
  '09-08': { name: 'Natividade de Nossa Senhora — Festa', rank: 'festa', color: 'branco',
    readings: { firstReading: 'Mq 5,1-4a', psalm: 'Sl 12(13),6ab.6c', gospel: 'Mt 1,1-16.18-23' } },
  '09-09': { name: 'São Pedro Claver, presbítero — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: '1Cor 9,16-19.22-23', psalm: 'Sl 116(117),1.2', gospel: 'Lc 14,25-33' } },
  '09-12': { name: 'Santíssimo Nome de Maria — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Zc 2,14-17', psalm: 'Jt 13,18bcde.19', gospel: 'Lc 1,39-47' } },
  '09-13': { name: 'São João Crisóstomo, bispo e doutor — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Ez 3,17-21', psalm: 'Sl 116(117),1.2', gospel: 'Mt 5,13-16' } },
  '09-14': { name: 'Exaltação da Santa Cruz — Festa', rank: 'festa', color: 'vermelho',
    readings: { firstReading: 'Nm 21,4b-9', psalm: 'Sl 77(78),1bc-2.34-35.36-37.38', secondReading: 'Fl 2,6-11', gospel: 'Jo 3,13-17' } },
  '09-15': { name: 'Nossa Senhora das Dores — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Hb 5,7-9', psalm: 'Sl 30(31),2-3ab.3cd-4.5-6.15-16.20', gospel: 'Jo 19,25-27' } },
  '09-16': { name: 'Santos Cornélio, papa, e Cipriano, bispo, mártires — Memória', rank: 'memoria_obrigatoria', color: 'vermelho',
    readings: { firstReading: 'Rm 8,31b-39', psalm: 'Sl 33(34),2-3.17-18.19.23', gospel: 'Jo 17,11b-19' } },
  '09-17': { name: 'Santa Hildegarda de Bingen, virgem e doutora — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Rm 8,14-17', psalm: 'Sl 15(16),1-2a.5.7-8.9-10.11', gospel: 'Jo 4,23-24' } },
  '09-19': { name: 'São Januário, bispo e mártir — Memória', rank: 'memoria_facultativa', color: 'vermelho',
    readings: { firstReading: '2Cor 6,4-10', psalm: 'Sl 33(34),2-3.17-18.19.23', gospel: 'Jo 12,24-26' } },
  '09-20': { name: 'Santos André Kim Taegon, Paulo Chong Hasang e companheiros, mártires — Memória', rank: 'memoria_obrigatoria', color: 'vermelho',
    readings: { firstReading: 'Sb 3,1-9', psalm: 'Sl 123(124),2-3.4-5.7b-8', gospel: 'Mc 13,9-13' } },
  '09-21': { name: 'São Mateus, Apóstolo e Evangelista — Festa', rank: 'festa', color: 'vermelho',
    readings: { firstReading: 'Ef 4,1-7.11-13', psalm: 'Sl 18(19),2-3.4-5', gospel: 'Mt 9,9-13' } },
  '09-26': { name: 'Santos Cosme e Damião, mártires — Memória', rank: 'memoria_facultativa', color: 'vermelho',
    readings: { firstReading: 'Sb 3,1-9', psalm: 'Sl 125(126),1-2ab.2cd-3.4-5.6', gospel: 'Lc 9,23-26' } },
  '09-27': { name: 'São Vicente de Paulo, presbítero — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: '1Cor 1,26-31', psalm: 'Sl 111(112),1-2.4-5.9', gospel: 'Mt 9,35-38' } },
  '09-28': { name: 'São Wenceslau, mártir — Memória', rank: 'memoria_facultativa', color: 'vermelho',
    readings: { firstReading: 'Dn 3,13-20.24-25.28', psalm: 'Sl 33(34),2-3.17-18.19.23', gospel: 'Mt 10,28-33' } },
  '09-29': { name: 'Santos Miguel, Gabriel e Rafael, Arcanjos — Festa', rank: 'festa', color: 'branco',
    readings: { firstReading: 'Dn 7,9-10.13-14', psalm: 'Sl 137(138),1-2ab.2c-3.4-5.7c-8', gospel: 'Jo 1,47-51' } },
  '09-30': { name: 'São Jerônimo, presbítero e doutor — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: '2Tm 3,14-17', psalm: 'Sl 118(119),9.10.11.12.13.14', gospel: 'Mt 13,47-52' } },
  // OUTUBRO
  '10-01': { name: 'Santa Teresinha do Menino Jesus, virgem e doutora — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Is 66,10-14c', psalm: 'Sl 130(131),1.2.3', gospel: 'Mt 18,1-5' } },
  '10-02': { name: 'Santos Anjos da Guarda — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Êx 23,20-23a', psalm: 'Sl 90(91),1-2.3-4.5-6.10-11', gospel: 'Mt 18,1-5.10' } },
  '10-04': { name: 'São Francisco de Assis — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Gl 6,14-18', psalm: 'Sl 15(16),1-2a.5.7-8.9-10.11', gospel: 'Mt 11,25-30' } },
  '10-06': { name: 'São Bruno, presbítero — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Flp 3,8-14', psalm: 'Sl 33(34),2-3.4-5.6-7.8-9', gospel: 'Lc 14,25-33' } },
  '10-07': { name: 'Nossa Senhora do Rosário — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'At 1,12-14', psalm: 'Sl 44(45),11-12.14-15.16-17', gospel: 'Lc 1,26-38' } },
  '10-09': { name: 'São Dionísio, bispo, e companheiros, mártires; São João Leonardi, presbítero — Memória', rank: 'memoria_facultativa', color: 'vermelho',
    readings: { firstReading: 'Sb 3,1-9', psalm: 'Sl 126(127),1-2.3.4-5', gospel: 'Lc 9,23-26' } },
  '10-11': { name: 'São João XXIII, papa — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Ez 34,11-16', psalm: 'Sl 22(23),1-3a.3b-4.5.6', gospel: 'Jo 21,15-17' } },
  '10-14': { name: 'São Calisto I, papa e mártir — Memória', rank: 'memoria_facultativa', color: 'vermelho',
    readings: { firstReading: 'Hb 13,7-9a', psalm: 'Sl 115(116),12-13.15-16bc.17-18', gospel: 'Mt 28,16-20' } },
  '10-15': { name: 'Santa Teresa de Jesus, virgem e doutora — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Rm 8,22-27', psalm: 'Sl 70(71),1-2.3-4a.5-6ab.15.17', gospel: 'Jo 15,1-8' } },
  '10-16': { name: 'Santa Margarida Maria Alacoque, virgem; São Hedwiges, religiosa — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Ez 11,19-20', psalm: 'Sl 39(40),2.4ab.7-8a.8b-9.10', gospel: 'Mt 11,28-30' } },
  '10-17': { name: 'São Inácio de Antioquia, bispo e mártir — Memória', rank: 'memoria_obrigatoria', color: 'vermelho',
    readings: { firstReading: 'Flp 3,17-4,1', psalm: 'Sl 33(34),2-3.4-5.6-7.8-9', gospel: 'Jo 12,24-26' } },
  '10-18': { name: 'São Lucas, Evangelista — Festa', rank: 'festa', color: 'vermelho',
    readings: { firstReading: '2Tm 4,9-17b', psalm: 'Sl 144(145),10-11.12-13ab.17-18', gospel: 'Lc 10,1-9' } },
  '10-19': { name: 'São Paulo da Cruz, presbítero; São João de Brébeuf, presbítero e mártir e companheiros, mártires — Memória', rank: 'memoria_facultativa', color: 'vermelho',
    readings: { firstReading: 'Gl 2,19-20', psalm: 'Sl 116(117),1.2', gospel: 'Lc 9,23-26' } },
  '10-22': { name: 'São João Paulo II, papa — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Is 52,7-10', psalm: 'Sl 95(96),1-3.7-8a.10', gospel: 'Jo 21,15-17' } },
  '10-23': { name: 'São João de Cápistrano, presbítero — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Ef 6,10-20', psalm: 'Sl 143(144),1.2.9-10', gospel: 'Mt 11,25-30' } },
  '10-24': { name: 'São Antônio Maria Claret, bispo — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Is 61,1-3a', psalm: 'Sl 95(96),1-3.7-8a.10', gospel: 'Lc 9,1-6' } },
  '10-28': { name: 'Santos Simão e Judas, Apóstolos — Festa', rank: 'festa', color: 'vermelho',
    readings: { firstReading: 'Ef 2,19-22', psalm: 'Sl 19(20),2.3.4.5', gospel: 'Lc 6,12-16' } },
  // NOVEMBRO
  '11-01': { name: 'Todos os Santos — Solenidade', rank: 'solenidade', color: 'branco',
    readings: { firstReading: 'Ap 7,2-4.9-14', psalm: 'Sl 23(24),1bc-2.3-4ab.5-6', secondReading: '1Jo 3,1-3', gospel: 'Mt 5,1-12a' } },
  '11-02': { name: 'Comemoração de Todos os Fiéis Defuntos', rank: 'solenidade', color: 'roxo',
    readings: { firstReading: 'Jó 19,1.23-27a', psalm: 'Sl 26(27),1.4.7-8a.8b-9abc.13-14', secondReading: 'Rm 8,31b-35.37-39', gospel: 'Jo 6,37-40' } },
  '11-03': { name: 'São Martinho de Porres, religioso — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Mq 6,8', psalm: 'Sl 111(112),1-2.3-5.9', gospel: 'Lc 6,27-38' } },
  '11-04': { name: 'São Carlos Borromeu, bispo — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Ez 34,11-16', psalm: 'Sl 22(23),1-3a.3b-4.5.6', gospel: 'Jo 10,11-16' } },
  '11-09': { name: 'Dedicação da Basílica de Latrão — Festa', rank: 'festa', color: 'branco',
    readings: { firstReading: 'Ez 47,1-2.8-9.12', psalm: 'Sl 45(46),2-3.5-6.8-9', secondReading: '1Cor 3,9c-11.16-17', gospel: 'Jo 2,13-22' } },
  '11-10': { name: 'São Leão Magno, papa e doutor — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'At 20,17-18a.28-32.36', psalm: 'Sl 109(110),1.2.3.4', gospel: 'Jo 10,11-16' } },
  '11-11': { name: 'São Martinho de Tours, bispo — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Is 61,1-3a', psalm: 'Sl 88(89),2-3.21-22.25.27', gospel: 'Mt 25,31-40' } },
  '11-12': { name: 'São Josafá, bispo e mártir — Memória', rank: 'memoria_obrigatoria', color: 'vermelho',
    readings: { firstReading: 'Ez 34,11-16', psalm: 'Sl 22(23),1-3a.3b-4.5.6', gospel: 'Jo 10,11-16' } },
  '11-13': { name: 'São Nicolau I, papa — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Is 52,7-10', psalm: 'Sl 95(96),1-3.7-8a.10', gospel: 'Mt 16,13-19' } },
  '11-15': { name: 'São Alberto Magno, bispo e doutor — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Sb 7,7-10.15-16', psalm: 'Sl 118(119),9.10.11.12.13.14', gospel: 'Mt 5,13-16' } },
  '11-16': { name: 'Santa Margarida da Escócia; Santa Gertrudes, virgem — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Pv 31,10-13.19-20.30-31', psalm: 'Sl 127(128),1-2.3.4-5', gospel: 'Mt 5,1-12a' } },
  '11-17': { name: 'Santa Isabel da Hungria, religiosa — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Fl 4,4-9', psalm: 'Sl 111(112),1-2.3-5.9', gospel: 'Mt 25,31-40' } },
  '11-18': { name: 'Dedicação das Basílicas de São Pedro e São Paulo — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'At 28,11-16.30-31', psalm: 'Sl 97(98),1.2-3ab.3cd-4.5-6', gospel: 'Mt 14,22-33' } },
  '11-21': { name: 'Apresentação de Nossa Senhora — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Zc 2,14-17', psalm: 'Jt 13,18bcde.19', gospel: 'Mt 12,46-50' } },
  '11-22': { name: 'Santa Cecília, virgem e mártir — Memória', rank: 'memoria_obrigatoria', color: 'vermelho',
    readings: { firstReading: 'Ct 8,6-7', psalm: 'Sl 148,1-2.3-4.9-10.11-12ab.12c-13a.13bc-14', gospel: 'Mt 25,1-13' } },
  '11-23': { name: 'São Clemente I, papa e mártir — Memória', rank: 'memoria_facultativa', color: 'vermelho',
    readings: { firstReading: 'Hb 13,7-9a', psalm: 'Sl 115(116),12-13.15-16bc.17-18', gospel: 'Mt 28,16-20' } },
  '11-24': { name: 'São André Dung-Lac, presbítero, e companheiros, mártires — Memória', rank: 'memoria_obrigatoria', color: 'vermelho',
    readings: { firstReading: 'Rm 8,31b-39', psalm: 'Sl 116(117),1.2', gospel: 'Lc 9,23-26' } },
  '11-25': { name: 'Santa Catarina de Alexandria, virgem e mártir — Memória', rank: 'memoria_facultativa', color: 'vermelho',
    readings: { firstReading: '1Cor 1,18-25', psalm: 'Sl 118(119),89.90.91.175.176', gospel: 'Mt 25,1-13' } },
  '11-30': { name: 'São André, Apóstolo — Festa', rank: 'festa', color: 'vermelho',
    readings: { firstReading: 'Rm 10,9-18', psalm: 'Sl 18(19),2-3.4-5', gospel: 'Mt 4,18-22' } },
  // DEZEMBRO
  '12-03': { name: 'São Francisco Xavier, presbítero — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: '1Cor 9,16-19.22-23', psalm: 'Sl 116(117),1.2', gospel: 'Mc 16,15-20' } },
  '12-04': { name: 'São João Damasceno, presbítero e doutor — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Ef 3,14-19', psalm: 'Sl 144(145),1-2.8-9.10-11', gospel: 'Jo 17,24-26' } },
  '12-06': { name: 'São Nicolau, bispo — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Is 61,1-3a', psalm: 'Sl 88(89),2-3.4-5.21-22.25', gospel: 'Mt 25,31-40' } },
  '12-07': { name: 'São Ambrósio, bispo e doutor — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: 'Ef 3,8-12', psalm: 'Sl 36(37),3-4.5-6.27-28.39-40', gospel: 'Jo 10,11-16' } },
  '12-08': { name: 'Imaculada Conceição de Nossa Senhora — Solenidade', rank: 'solenidade', color: 'branco',
    readings: { firstReading: 'Gn 3,9-15.20', psalm: 'Sl 97(98),1.2-3ab.3cd-4', secondReading: 'Ef 1,3-6.11-12', gospel: 'Lc 1,26-38' } },
  '12-09': { name: 'São Juan Diego Cuauhtlatoatzin — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Zc 2,14-17', psalm: 'Jt 13,18bcde.19', gospel: 'Lc 1,26-38' } },
  '12-11': { name: 'São Dâmaso I, papa — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Ez 34,11-16', psalm: 'Sl 22(23),1-3a.3b-4.5.6', gospel: 'Jo 10,11-16' } },
  '12-12': { name: 'Nossa Senhora de Guadalupe — Festa', rank: 'festa', color: 'branco',
    readings: { firstReading: 'Zc 2,14-17', psalm: 'Jt 13,18bcde.19', gospel: 'Lc 1,39-47' } },
  '12-13': { name: 'Santa Lúcia, virgem e mártir — Memória', rank: 'memoria_obrigatoria', color: 'vermelho',
    readings: { firstReading: '2Cor 10,17-11,2', psalm: 'Sl 30(31),3cd-4.6.8ab.17.21ab', gospel: 'Mt 25,1-13' } },
  '12-14': { name: 'São João da Cruz, presbítero e doutor — Memória', rank: 'memoria_obrigatoria', color: 'branco',
    readings: { firstReading: '1Cor 2,1-10a', psalm: 'Sl 36(37),3-4.5-6.27-28.39-40', gospel: 'Lc 14,25-33' } },
  '12-21': { name: 'São Pedro Canísio, presbítero e doutor — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Is 7,10-14', psalm: 'Sl 23(24),1-2.3-4ab.5-6', gospel: 'Lc 1,26-38' } },
  '12-23': { name: 'São João de Kety, presbítero — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: 'Lc 1,1-4', psalm: 'Sl 70(71),1-2.5-6ab.15.17', gospel: 'Lc 2,41-52' } },
  '12-26': { name: 'São Estêvão, primeiro mártir — Festa', rank: 'festa', color: 'vermelho',
    readings: { firstReading: 'At 6,8-10;7,54-60', psalm: 'Sl 30(31),3cd-4.6.8ab.17.21ab', gospel: 'Mt 10,17-22' } },
  '12-27': { name: 'São João, Apóstolo e Evangelista — Festa', rank: 'festa', color: 'branco',
    readings: { firstReading: '1Jo 1,1-4', psalm: 'Sl 96(97),1-2.5-6.11-12', gospel: 'Jo 20,2-8' } },
  '12-28': { name: 'Santos Inocentes, mártires — Festa', rank: 'festa', color: 'vermelho',
    readings: { firstReading: '1Jo 1,5-2,2', psalm: 'Sl 123(124),2-3.4-5.7b-8', gospel: 'Mt 2,13-18' } },
  '12-29': { name: 'São Tomás Becket, bispo e mártir — Memória', rank: 'memoria_facultativa', color: 'vermelho',
    readings: { firstReading: '1Cor 4,9-16', psalm: 'Sl 34(35),17-18.19-23.24.27-28', gospel: 'Mt 10,28-33' } },
  '12-31': { name: 'São Silvestre I, papa — Memória', rank: 'memoria_facultativa', color: 'branco',
    readings: { firstReading: '1Jo 2,18-21', psalm: 'Sl 95(96),1-2a.2b-3.5b-6.7-8.9-10ac', gospel: 'Jo 1,1-18' } },
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. LEITURAS DE SOLENIDADES MÓVEIS
// ─────────────────────────────────────────────────────────────────────────────

export function getMovableFeastReadings(date: Date, mv: MovableDates, litYear: LiturgicalYear): {
  name: string; rank: CelebrationRank; color: LiturgicalColor; readings: ReadingRefs
} | null {
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const dateStr = fmt(date);

  if (dateStr === fmt(mv.holyThursday)) return { name: 'Quinta-feira Santa — Missa da Ceia do Senhor', rank: 'solenidade', color: 'branco',
    readings: { firstReading: 'Êx 12,1-8.11-14', psalm: 'Sl 115(116),12-13.15-16bc.17-18', secondReading: '1Cor 11,23-26', gospel: 'Jo 13,1-15' } };

  if (dateStr === fmt(mv.goodFriday)) return { name: 'Sexta-feira Santa — Paixão do Senhor', rank: 'solenidade', color: 'vermelho',
    readings: { firstReading: 'Is 52,13-53,12', psalm: 'Sl 30(31),2.6.12-13.15-16.17.25', secondReading: 'Hb 4,14-16;5,7-9', gospel: 'Jo 18,1-19,42' } };

  if (dateStr === fmt(mv.easter)) return { name: 'Domingo de Páscoa — Ressurreição do Senhor', rank: 'solenidade', color: 'branco',
    readings: SUNDAY_LECTIONARY[litYear]['PAC-PASCOA'] };

  if (dateStr === fmt(mv.ascension)) return { name: 'Ascensão do Senhor — Solenidade', rank: 'solenidade', color: 'branco',
    readings: SUNDAY_LECTIONARY[litYear]['PAC-ASCENSAO'] };

  if (dateStr === fmt(mv.pentecost)) return { name: 'Pentecostes — Solenidade', rank: 'solenidade', color: 'vermelho',
    readings: SUNDAY_LECTIONARY[litYear]['PAC-PENTECOSTES'] };

  if (dateStr === fmt(mv.trinitySmith)) return { name: 'Santíssima Trindade — Solenidade', rank: 'solenidade', color: 'branco',
    readings: SUNDAY_LECTIONARY[litYear][`SS-TRINDADE-${litYear}`] || SUNDAY_LECTIONARY['A']['SS-TRINDADE-A'] };

  if (dateStr === fmt(mv.corpusChristi)) return { name: 'Santíssimo Corpo e Sangue de Cristo (Corpus Christi) — Solenidade', rank: 'solenidade', color: 'branco',
    readings: SUNDAY_LECTIONARY[litYear][`CORPUS-${litYear}`] || SUNDAY_LECTIONARY['A']['CORPUS-A'] };

  if (dateStr === fmt(mv.sacredHeart)) return { name: 'Sagrado Coração de Jesus — Solenidade', rank: 'solenidade', color: 'branco',
    readings: (() => {
      const sacredHeartReadings: Record<LiturgicalYear, ReadingRefs> = {
        A: { firstReading: 'Dt 7,6-11', psalm: 'Sl 102(103),1-2.3-4.6-7.8.10', secondReading: '1Jo 4,7-16', gospel: 'Mt 11,25-30' },
        B: { firstReading: 'Os 11,1.3-4.8c-9', psalm: 'Is 12,2-3.4bcd.5-6', secondReading: 'Ef 3,8-12.14-19', gospel: 'Jo 19,31-37' },
        C: { firstReading: 'Ez 34,11-16', psalm: 'Sl 22(23),1-3a.3b-4.5.6', secondReading: 'Rm 5,5b-11', gospel: 'Lc 15,3-7' },
      };
      return sacredHeartReadings[litYear];
    })() };

  if (dateStr === fmt(mv.christTheKing)) return { name: 'Nosso Senhor Jesus Cristo, Rei do Universo — Solenidade', rank: 'solenidade', color: 'branco',
    readings: SUNDAY_LECTIONARY[litYear]['TC-34'] };

  // Domingo de Ramos (não tem leituras no banco dominical, pega aqui)
  if (dateStr === fmt(mv.palmSunday)) return { name: 'Domingo de Ramos — Paixão do Senhor', rank: 'solenidade', color: 'vermelho',
    readings: SUNDAY_LECTIONARY[litYear]['LAQ-RAMOS'] };

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. FUNÇÃO PRINCIPAL: getLiturgicalDay
// ─────────────────────────────────────────────────────────────────────────────

export function getLiturgicalDay(date: Date): LiturgicalDay {
  const year = date.getFullYear();
  const mv = computeMovableDates(year);
  const mvPrev = computeMovableDates(year - 1);

  const litYear = getLiturgicalYear(date);
  const ferialCycle = getFerialCycle(date);
  const { season, week, color } = getSeasonInfo(date);

  const weekday = date.getDay(); // 0=Dom
  const weekdayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const weekdayName = weekdayNames[weekday];
  const isSunday = weekday === 0;

  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const mmdd = `${mm}-${dd}`;
  const dateISO = `${year}-${mm}-${dd}`;

  // ── 1. Verificar solenidades/festas MÓVEIS (maior prioridade) ────────────
  const movableFeast = getMovableFeastReadings(date, mv, litYear)
    || getMovableFeastReadings(date, mvPrev, litYear);

  if (movableFeast) {
    return {
      date: dateISO, liturgicalYear: litYear, ferialCycle, season, weekOfSeason: week,
      weekday, weekdayName, color: movableFeast.color,
      celebrationRank: movableFeast.rank,
      celebrationName: movableFeast.name,
      hasProperReadings: true,
      readings: movableFeast.readings,
      isSunday: isSunday || movableFeast.rank === 'solenidade',
      isHolyDay: true,
      seasonLabel: movableFeast.name,
    };
  }

  // ── 2. Verificar Santoral (datas fixas) ──────────────────────────────────
  const saint = SANCTORAL[mmdd];
  const hasSaintFeast = saint && (saint.rank === 'solenidade' || saint.rank === 'festa' || saint.rank === 'memoria_obrigatoria' || saint.rank === 'memoria_facultativa');

  // ── 3. Determinar leituras do dia (Dominical ou Ferial) ──────────────────
  let sundayKey = '';
  let baseReadings: ReadingRefs;

  if (isSunday || (saint?.rank === 'solenidade')) {
    // Determinar chave do domingo
    sundayKey = getSundayKey(season, week, litYear, mv, date);
    baseReadings = SUNDAY_LECTIONARY[litYear][sundayKey] || getFallbackReadings(season, litYear);
  } else {
    baseReadings = getFerialReadings(season, week, weekday, ferialCycle, litYear);
  }

  // ── 4. Se solenidade do santoral, ela substitui tudo ────────────────────
  if (saint?.rank === 'solenidade' && saint.readings) {
    return {
      date: dateISO, liturgicalYear: litYear, ferialCycle, season, weekOfSeason: week,
      weekday, weekdayName, color: saint.color,
      celebrationRank: saint.rank,
      celebrationName: saint.name,
      hasProperReadings: true,
      readings: saint.readings,
      feastReadings: saint.readings,
      isSunday: true, isHolyDay: true,
      seasonLabel: saint.name,
    };
  }

  // ── 5. Montar rótulo da celebração ────────────────────────────────────────
  const seasonLabel = buildSeasonLabel(season, week, weekday, weekdayName, isSunday, litYear);

  return {
    date: dateISO, liturgicalYear: litYear, ferialCycle, season, weekOfSeason: week,
    weekday, weekdayName, color,
    celebrationRank: saint ? saint.rank : 'ferial',
    celebrationName: saint ? saint.name : null,
    hasProperReadings: !!(saint?.readings),
    readings: baseReadings,
    feastReadings: (saint?.readings && saint.rank !== 'ferial') ? saint.readings : undefined,
    isSunday,
    isHolyDay: !!(saint && saint.rank !== 'memoria_facultativa'),
    seasonLabel,
  };
}

function getSundayKey(
  season: LiturgicalSeason, week: number,
  litYear: LiturgicalYear, mv: MovableDates, date: Date
): string {
  switch (season) {
    case 'Advento':      return `ADV-${week}`;
    case 'Quaresma':     return `LAQ-${week}`;
    case 'Tempo Pascal': return week === 7 ? `PAC-7` : `PAC-${week}`;
    case 'Natal': {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      if (month === 12 && day === 25) return 'NAT-DIA';
      if (month === 1 && day === 1)   return 'NAT-1jan';
      if (month === 1 && day === 6)   return 'NAT-EPIFANIA';
      // Sagrada Família = 1º dom após Natal
      return 'NAT-SFamilia';
    }
    case 'Tempo Comum':  return `TC-${week}`;
    default:             return `TC-${week}`;
  }
}

function getFallbackReadings(season: LiturgicalSeason, litYear: LiturgicalYear): ReadingRefs {
  const fallbacks: Partial<Record<LiturgicalSeason, ReadingRefs>> = {
    'Advento':      { firstReading: 'Is 40,1-5.9-11', psalm: 'Sl 84(85),9ab.10.11-12.13-14', gospel: 'Lc 3,1-6' },
    'Quaresma':     { firstReading: 'Jl 2,12-18', psalm: 'Sl 50(51),3-4.5-6a.12-13.14.17', gospel: 'Mt 6,1-6.16-18' },
    'Tempo Pascal': { firstReading: 'At 2,1-11', psalm: 'Sl 117(118),1-2.16ab-17.22-23', gospel: 'Jo 20,19-31' },
    'Natal':        { firstReading: 'Is 52,7-10', psalm: 'Sl 97(98),1.2-3ab.3cd-4.5-6', secondReading: 'Hb 1,1-6', gospel: 'Jo 1,1-18' },
    'Tempo Comum':  { firstReading: 'Ecl 1,2;2,21-23', psalm: 'Sl 89(90),3-4.5-6.12-13.14.17', gospel: 'Lc 12,13-21' },
  };
  return fallbacks[season] || { firstReading: 'Is 40,1-5', psalm: 'Sl 84(85),9-14', gospel: 'Jo 1,1-14' };
}

// ─────────────────────────────────────────────────────────────────────────────
// LECIONÁRIO FERIAL DA QUARESMA (único em todos os anos — não muda com A/B/C)
// Chave: "SEM{semana}-{dia}" onde dia: 1=Seg,2=Ter,3=Qua,4=Qui,5=Sex,6=Sáb
// Semana 0 = dias entre Cinzas e 1º Domingo
// ─────────────────────────────────────────────────────────────────────────────
const LENT_FERIAL: Record<string, ReadingRefs> = {
  // Semana das Cinzas (dias antes do 1º Domingo)
  'SEM0-3': { firstReading: 'Jl 2,12-18', psalm: 'Sl 50(51),3-4.5-6a.12-13.14.17', gospel: 'Mt 6,1-6.16-18' }, // Quarta-Cinzas
  'SEM0-4': { firstReading: 'Dt 30,15-20', psalm: 'Sl 1,1-2.3.4.6', gospel: 'Lc 9,22-25' },
  'SEM0-5': { firstReading: 'Is 58,1-9a', psalm: 'Sl 50(51),3-4.5-6a.18-19', gospel: 'Mt 9,14-15' },
  'SEM0-6': { firstReading: 'Is 58,9b-14', psalm: 'Sl 85(86),1-2.3-4.5-6', gospel: 'Lc 5,27-32' },
  // 1ª Semana da Quaresma
  'SEM1-1': { firstReading: 'Lv 19,1-2.11-18', psalm: 'Sl 18(19),8.9.10.15', gospel: 'Mt 25,31-46' },
  'SEM1-2': { firstReading: 'Is 55,10-11', psalm: 'Sl 33(34),4-5.6-7.16-17.18-19', gospel: 'Mt 6,7-15' },
  'SEM1-3': { firstReading: 'Jon 3,1-10', psalm: 'Sl 50(51),3-4.12-13.18-19', gospel: 'Lc 11,29-32' },
  'SEM1-4': { firstReading: 'Est 4,17k.l.m-n.p-r', psalm: 'Sl 137(138),1-2ab.2c-3.7c-8', gospel: 'Mt 7,7-12' },
  'SEM1-5': { firstReading: 'Ez 18,21-28', psalm: 'Sl 129(130),1-2.3-4.5-7a.7bc-8', gospel: 'Mt 5,20-26' },
  'SEM1-6': { firstReading: 'Dt 26,16-19', psalm: 'Sl 118(119),1-2.4-5.7-8', gospel: 'Mt 5,43-48' },
  // 2ª Semana da Quaresma
  'SEM2-1': { firstReading: 'Dn 9,4b-10', psalm: 'Sl 78(79),8.9.11.13', gospel: 'Lc 6,36-38' },
  'SEM2-2': { firstReading: 'Is 1,10.16-20', psalm: 'Sl 49(50),8-9.16bc-17.21.23', gospel: 'Mt 23,1-12' },
  'SEM2-3': { firstReading: 'Jr 18,18-20', psalm: 'Sl 30(31),5-6.14.15-16', gospel: 'Mt 20,17-28' },
  'SEM2-4': { firstReading: 'Jr 17,5-10', psalm: 'Sl 1,1-2.3.4.6', gospel: 'Lc 16,19-31' },
  'SEM2-5': { firstReading: 'Gn 37,3-4.12-13a.17b-28', psalm: 'Sl 104(105),16-17.18-19.20-21', gospel: 'Mt 21,33-43.45-46' },
  'SEM2-6': { firstReading: 'Mq 7,14-15.18-20', psalm: 'Sl 102(103),1-2.3-4.9-10.11-12', gospel: 'Lc 15,1-3.11-32' },
  // 3ª Semana da Quaresma
  'SEM3-1': { firstReading: '2Rs 5,1-15a', psalm: 'Sl 41(42),2.3;43(44),3.4', gospel: 'Lc 4,24-30' },
  'SEM3-2': { firstReading: 'Dn 3,25.34-43', psalm: 'Sl 24(25),4bc-5.6-7.8-9', gospel: 'Mt 18,21-35' },
  'SEM3-3': { firstReading: 'Dt 4,1.5-9', psalm: 'Sl 147,12-13.15-16.19-20', gospel: 'Mt 5,17-19' },
  'SEM3-4': { firstReading: 'Jr 7,23-28', psalm: 'Sl 94(95),1-2.6-7.8-9', gospel: 'Lc 11,14-23' },
  'SEM3-5': { firstReading: 'Os 14,2-10', psalm: 'Sl 80(81),6c-8a.8bc-9.10-11ab.14.17', gospel: 'Mc 12,28b-34' },
  'SEM3-6': { firstReading: 'Os 6,1-6', psalm: 'Sl 50(51),3-4.18-19.20-21ab', gospel: 'Lc 18,9-14' },
  // 4ª Semana da Quaresma
  'SEM4-1': { firstReading: 'Is 65,17-21', psalm: 'Sl 29(30),2.4.5-6.11-12a.13b', gospel: 'Jo 4,43-54' },
  'SEM4-2': { firstReading: 'Ez 47,1-9.12', psalm: 'Sl 45(46),2-3.5-6.8-9', gospel: 'Jo 5,1-3a.5-16' },
  'SEM4-3': { firstReading: 'Is 49,8-15', psalm: 'Sl 144(145),8-9.13cd-14.17-18', gospel: 'Jo 5,17-30' },
  'SEM4-4': { firstReading: 'Êx 32,7-14', psalm: 'Sl 105(106),19-20.21-22.23', gospel: 'Jo 5,31-47' },
  'SEM4-5': { firstReading: 'Sb 2,1a.12-22', psalm: 'Sl 33(34),17-18.19-20.21.23', gospel: 'Jo 7,1-2.10.25-30' },
  'SEM4-6': { firstReading: 'Jr 11,18-20', psalm: 'Sl 7,2-3.9bc-10.11-12', gospel: 'Jo 7,40-53' },
  // 5ª Semana da Quaresma
  'SEM5-1': { firstReading: 'Dn 13,41c-62', psalm: 'Sl 22(23),1-3a.3b-4.5.6', gospel: 'Jo 8,1-11' },
  'SEM5-2': { firstReading: 'Nm 21,4-9', psalm: 'Sl 101(102),2-3.16-18.19-21', gospel: 'Jo 8,21-30' },
  'SEM5-3': { firstReading: 'Dn 3,14-20.24-25.28', psalm: 'Dn 3,52.53.54.55.56', gospel: 'Jo 8,31-42' },
  'SEM5-4': { firstReading: 'Gn 17,3-9', psalm: 'Sl 104(105),4-5.6-7.8-9', gospel: 'Jo 8,51-59' },
  'SEM5-5': { firstReading: 'Jr 20,10-13', psalm: 'Sl 17(18),2-3a.3bc-4.5-6.7', gospel: 'Jo 10,31-42' },
  'SEM5-6': { firstReading: 'Ez 37,21-28', psalm: 'Jr 31,10.11-12abcd.13', gospel: 'Jo 11,45-56' },
  // Semana Santa (antes do Tríduo)
  'SEM6-1': { firstReading: 'Is 42,1-7', psalm: 'Sl 26(27),1.2.3.13-14', gospel: 'Jo 12,1-11' },
  'SEM6-2': { firstReading: 'Is 49,1-6', psalm: 'Sl 70(71),1-2.3-4a.5ab.6ab.15.17', gospel: 'Jo 13,21-33.36-38' },
  'SEM6-3': { firstReading: 'Is 50,4-9a', psalm: 'Sl 68(69),8-10.21-22.31.33-34', gospel: 'Mt 26,14-25' },
};

// ─────────────────────────────────────────────────────────────────────────────
// LECIONÁRIO FERIAL DO TEMPO PASCAL
// Chave: "W{semana}-{dia}" onde semana=2..7, dia: 1=Seg 2=Ter 3=Qua 4=Qui 5=Sex 6=Sáb
// Semana 1 = Oitava da Páscoa (festivos — não entram aqui)
// Semana 2 = Segunda semana do Tempo Pascal, etc.
// Estas leituras são IGUAIS em todos os anos (A, B, C) — só os domingos variam.
// ─────────────────────────────────────────────────────────────────────────────
const EASTER_FERIAL: Record<string, ReadingRefs> = {
  // ── SEMANA 2 ──────────────────────────────────────────────────────────────
  'W2-1': { firstReading: 'At 4,23-31',     psalm: 'Sl 2,1-3.4-6.7-9',                       gospel: 'Jo 3,1-8' },
  'W2-2': { firstReading: 'At 4,32-37',     psalm: 'Sl 92(93),1-2.5',                         gospel: 'Jo 3,7b-15' },
  'W2-3': { firstReading: 'At 5,17-26',     psalm: 'Sl 33(34),2-3.4-5.6-7.8-9',              gospel: 'Jo 3,16-21' },
  'W2-4': { firstReading: 'At 5,27-33',     psalm: 'Sl 33(34),2.9.17-18.19-20',               gospel: 'Jo 3,31-36' },
  'W2-5': { firstReading: 'At 5,34-42',     psalm: 'Sl 27(28),1.8-9',                         gospel: 'Jo 6,1-15' },
  'W2-6': { firstReading: 'At 6,1-7',       psalm: 'Sl 32(33),1-2.4-5.18-19',                 gospel: 'Jo 6,16-21' },
  // ── SEMANA 3 ──────────────────────────────────────────────────────────────
  'W3-1': { firstReading: 'At 6,8-15',      psalm: 'Sl 118(119),23-24.26-27.29-30',           gospel: 'Jo 6,22-29' },
  'W3-2': { firstReading: 'At 7,51—8,1a',   psalm: 'Sl 30(31),3cd-4.6.7b-8ab.17.21ab',        gospel: 'Jo 6,30-35' },
  'W3-3': { firstReading: 'At 8,1b-8',      psalm: 'Sl 65(66),1-3a.4-5.6-7a.16.20',           gospel: 'Jo 6,35-40' },
  'W3-4': { firstReading: 'At 8,26-40',     psalm: 'Sl 65(66),8-9.16-17.20',                  gospel: 'Jo 6,44-51' },
  'W3-5': { firstReading: 'At 9,1-20',      psalm: 'Sl 116(117),1.2',                          gospel: 'Jo 6,52-59' },
  'W3-6': { firstReading: 'At 9,31-42',     psalm: 'Sl 115(116),12-13.14-15.16-17',            gospel: 'Jo 6,60-69' },
  // ── SEMANA 4 ──────────────────────────────────────────────────────────────
  'W4-1': { firstReading: 'At 11,1-18',     psalm: 'Sl 41(42),2-3;43(44),3-4',                gospel: 'Jo 10,11-18' },
  'W4-2': { firstReading: 'At 11,19-26',    psalm: 'Sl 87(88),1-2.3-4.5-6',                   gospel: 'Jo 10,22-30' },
  'W4-3': { firstReading: 'At 12,24—13,5a', psalm: 'Sl 67(68),1-6a',                           gospel: 'Jo 12,44-50' },
  'W4-4': { firstReading: 'At 13,13-25',    psalm: 'Sl 88(89),2-3.21-22.25.27',               gospel: 'Jo 13,16-20' },
  'W4-5': { firstReading: 'At 13,26-33',    psalm: 'Sl 2,6-7.8-9.10-11ab',                    gospel: 'Jo 14,1-6' },
  'W4-6': { firstReading: 'At 13,44-52',    psalm: 'Sl 97(98),1.2-3ab.3cd-4.5-6',             gospel: 'Jo 14,7-14' },
  // ── SEMANA 5 ──────────────────────────────────────────────────────────────
  'W5-1': { firstReading: 'At 14,5-18',     psalm: 'Sl 115(116),1-2.3-4',                     gospel: 'Jo 14,21-26' },
  'W5-2': { firstReading: 'At 14,19-28',    psalm: 'Sl 144(145),10-11.12-13ab.21',             gospel: 'Jo 14,27-31a' },
  'W5-3': { firstReading: 'At 15,1-6',      psalm: 'Sl 121(122),1-2.3-4ab.4cd-5',             gospel: 'Jo 15,1-8' },
  'W5-4': { firstReading: 'At 15,7-21',     psalm: 'Sl 95(96),1-2a.2b-3.10',                  gospel: 'Jo 15,9-11' },
  'W5-5': { firstReading: 'At 15,22-31',    psalm: 'Sl 56(57),8-9.10.12',                     gospel: 'Jo 15,12-17' },
  'W5-6': { firstReading: 'At 16,1-10',     psalm: 'Sl 99(100),1-2.3.5',                      gospel: 'Jo 15,18-21' },
  // ── SEMANA 6 ──────────────────────────────────────────────────────────────
  'W6-1': { firstReading: 'At 16,11-15',    psalm: 'Sl 149,1b-2.3-4.5-6a.9b',                 gospel: 'Jo 15,26—16,4a' },
  'W6-2': { firstReading: 'At 16,22-34',    psalm: 'Sl 137(138),1-2ab.2c-3.7c-8',             gospel: 'Jo 16,5-11' },
  'W6-3': { firstReading: 'At 17,15.22—18,1', psalm: 'Sl 148,1-2.11-12.13.14',               gospel: 'Jo 16,12-15' },
  'W6-4': { firstReading: 'At 1,1-11',      psalm: 'Sl 46(47),2-3.6-7.8-9',                   gospel: 'Mc 16,15-20' }, // Ascensão (quinta da 6ª semana no Brasil)
  'W6-5': { firstReading: 'At 18,9-18',     psalm: 'Sl 46(47),2-3.4-5.6-7',                   gospel: 'Jo 16,20-23a' },
  'W6-6': { firstReading: 'At 18,23-28',    psalm: 'Sl 46(47),2-3.8-9.10',                    gospel: 'Jo 16,23b-28' },
  // ── SEMANA 7 (entre Ascensão e Pentecostes) ───────────────────────────────
  'W7-1': { firstReading: 'At 19,1-8',      psalm: 'Sl 67(68),2-3.4-5.6-7',                   gospel: 'Jo 16,29-33' },
  'W7-2': { firstReading: 'At 20,17-27',    psalm: 'Sl 67(68),10-11.20-21',                   gospel: 'Jo 17,1-11a' },
  'W7-3': { firstReading: 'At 20,28-38',    psalm: 'Sl 67(68),29-30.33-35a.35bc-36',          gospel: 'Jo 17,11b-19' },
  'W7-4': { firstReading: 'At 22,30;23,6-11', psalm: 'Sl 15(16),1-2a.5.7-8.9-10.11',         gospel: 'Jo 17,20-26' },
  'W7-5': { firstReading: 'At 25,13b-21',   psalm: 'Sl 102(103),1-2.11-12.19-20ab',           gospel: 'Jo 21,15-19' },
  'W7-6': { firstReading: 'At 28,16-20.30-31', psalm: 'Sl 10(11),4.5.7',                      gospel: 'Jo 21,20-25' },
};

function getFerialReadings(
  season: LiturgicalSeason, week: number,
  weekday: number, cycle: FerialCycle, litYear: LiturgicalYear
): ReadingRefs {
  // Quaresma: banco de leituras próprias (igual em todos os anos)
  if (season === 'Quaresma') {
    const key = `SEM${week}-${weekday}`;
    if (LENT_FERIAL[key]) return LENT_FERIAL[key];
    // Semana 0 = dias das Cinzas (qui=4, sex=5, sáb=6)
    const key0 = `SEM0-${weekday}`;
    if (LENT_FERIAL[key0]) return LENT_FERIAL[key0];
  }

  // Tempo Pascal: banco de leituras completo (igual em todos os anos)
  if (season === 'Tempo Pascal' && weekday >= 1 && weekday <= 6) {
    const easterKey = `W${week}-${weekday}`;
    if (EASTER_FERIAL[easterKey]) return EASTER_FERIAL[easterKey];
  }

  // Tempo Comum: orientação para a IA (sem banco próprio aqui)
  const cycleLabel = cycle === 'I' ? 'I' : 'II';
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return {
    firstReading: `Lecionário Ferial — ${season} Semana ${week} ${days[weekday]} Ciclo ${cycleLabel}`,
    psalm: `Salmo Responsorial — ${season} Semana ${week}`,
    gospel: `Evangelho — ${season} Semana ${week} ${days[weekday]}`,
  };
}

function buildSeasonLabel(
  season: LiturgicalSeason, week: number, weekday: number,
  weekdayName: string, isSunday: boolean, litYear: LiturgicalYear
): string {
  const ordinal = ['', '1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º',
    '9º', '10º', '11º', '12º', '13º', '14º', '15º', '16º', '17º', '18º',
    '19º', '20º', '21º', '22º', '23º', '24º', '25º', '26º', '27º', '28º',
    '29º', '30º', '31º', '32º', '33º', '34º'];

  if (isSunday) {
    switch (season) {
      case 'Advento':      return `${ordinal[week]} Domingo do Advento — Ano ${litYear}`;
      case 'Natal':        return `Tempo do Natal — Domingo`;
      case 'Quaresma':     return `${ordinal[week]} Domingo da Quaresma — Ano ${litYear}`;
      case 'Tempo Pascal': return `${ordinal[week]} Domingo do Tempo Pascal — Ano ${litYear}`;
      case 'Tempo Comum':  return `${ordinal[week]} Domingo do Tempo Comum — Ano ${litYear}`;
      default: return `Domingo — Ano ${litYear}`;
    }
  }
  switch (season) {
    case 'Advento':  return `Advento — Semana ${week} — ${weekdayName}`;
    case 'Quaresma': return `Quaresma — Semana ${week} — ${weekdayName}`;
    default:         return `${season} — Semana ${ordinal[week]} — ${weekdayName}`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. UTILITÁRIOS PÚBLICOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna a data local do usuário corrigida pelo fuso horário do navegador.
 * Evita o bug de fuso: entre 21h-23h59 no Brasil, o servidor UTC já está no
 * dia seguinte — usar esta função garante que o cálculo use o dia certo.
 *
 * @param tzOffsetMinutes  Offset em minutos (ex: -180 para UTC-3/Brasília).
 *                         Se omitido, usa o fuso do ambiente atual (browser ou server).
 */
export function getLocalDate(tzOffsetMinutes?: number): Date {
  if (tzOffsetMinutes !== undefined) {
    // Calcula a data local forçando o offset explícito.
    // Ex: 23h50 UTC-0 + (-180 min) = 20h50 UTC-3 → ainda é o mesmo dia no Brasil.
    const utcMs = Date.now();
    const localMs = utcMs + tzOffsetMinutes * 60 * 1000;
    const d = new Date(localMs);
    // Retorna um Date cujos métodos getFullYear/Month/Date correspondem ao UTC ajustado.
    return new Date(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      d.getUTCHours(),
      d.getUTCMinutes(),
      d.getUTCSeconds()
    );
  }
  // Sem offset explícito: usa America/Sao_Paulo como referência padrão,
  // garantindo consistência com o resto do sistema (PrayerRoutine, groqService).
  const brl = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); // YYYY-MM-DD
  const [y, m, d] = brl.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0); // meio-dia para evitar ambiguidade de DST
}

/** Retorna o dia litúrgico para hoje. */
export function getTodayLiturgical(tzOffsetMinutes?: number): LiturgicalDay {
  return getLiturgicalDay(getLocalDate(tzOffsetMinutes));
}

/** Retorna informações resumidas para uso no groqService */
export function getTodayLiturgicalSummary(tzOffsetMinutes?: number): {
  dateISO: string;
  datePT: string;
  liturgicalYear: LiturgicalYear;
  ferialCycle: FerialCycle;
  season: LiturgicalSeason;
  weekOfSeason: number;
  seasonLabel: string;
  celebrationName: string | null;
  celebrationRank: CelebrationRank;
  hasProperReadings: boolean;
  readings: ReadingRefs;
  feastReadings?: ReadingRefs;
  color: LiturgicalColor;
  isSunday: boolean;
} {
  const localDate = getLocalDate(tzOffsetMinutes);
  const day = getLiturgicalDay(localDate);
  const datePT = localDate.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return { ...day, dateISO: day.date, datePT };
}
