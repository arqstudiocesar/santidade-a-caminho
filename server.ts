import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const DB_PATH = process.env.DB_PATH || (process.env.VERCEL ? '/tmp/spiritual_path.db' : 'spiritual_path.db');
const db = new Database(DB_PATH);

// ── Schema: criar todas as tabelas ───────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL DEFAULT 1,
    name TEXT, last_confession DATE, next_confession DATE,
    UNIQUE(user_id)
  );
  CREATE TABLE IF NOT EXISTS journal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL DEFAULT 1,
    content TEXT NOT NULL, type TEXT DEFAULT 'free',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS prayers (
    id TEXT NOT NULL, user_id INTEGER NOT NULL DEFAULT 1,
    name TEXT NOT NULL, period TEXT,
    is_completed BOOLEAN DEFAULT 0, last_completed DATE,
    PRIMARY KEY (id, user_id)
  );
  CREATE TABLE IF NOT EXISTS sins (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL DEFAULT 1,
    content TEXT NOT NULL, is_confessed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS confession_purposes (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL DEFAULT 1,
    content TEXT NOT NULL, is_fulfilled BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS custom_exam_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL DEFAULT 1,
    name TEXT NOT NULL, questions TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS lectio_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL DEFAULT 1,
    book TEXT NOT NULL, chapter INTEGER NOT NULL,
    start_verse INTEGER, end_verse INTEGER,
    content TEXT, meditation TEXT, prayer TEXT, contemplation TEXT,
    action TEXT, type TEXT DEFAULT 'guided',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS prayer_intentions (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL DEFAULT 1,
    content TEXT NOT NULL, is_answered BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ── Migração: garantir colunas user_id e tabela virtues com chave composta ───
function tableExists(name: string): boolean {
  const r = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name);
  return !!r;
}
function columnExists(table: string, col: string): boolean {
  if (!tableExists(table)) return false;
  return (db.prepare(`PRAGMA table_info(${table})`).all() as any[]).some((c: any) => c.name === col);
}

// Migrar tabelas simples: adicionar user_id se não existe
const simpleTables = ['journal_entries','sins','confession_purposes','custom_exam_models','lectio_history','prayer_intentions'];
for (const t of simpleTables) {
  if (tableExists(t) && !columnExists(t, 'user_id')) {
    db.exec(`ALTER TABLE ${t} ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1`);
    console.log(`[migration] user_id adicionado: ${t}`);
  }
}

// Migrar prayers: pode ter PK simples ou composta
if (tableExists('prayers') && !columnExists('prayers', 'user_id')) {
  db.exec(`ALTER TABLE prayers ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1`);
  console.log('[migration] user_id adicionado: prayers');
}

// Virtudes: precisa de PK composta (id, user_id)
if (!tableExists('virtues')) {
  // Banco novo: criar direto com PK composta
  db.exec(`CREATE TABLE virtues (
    id TEXT NOT NULL, user_id INTEGER NOT NULL DEFAULT 1,
    name TEXT NOT NULL, level INTEGER DEFAULT 0,
    is_priority BOOLEAN DEFAULT 0, last_evaluated DATE,
    PRIMARY KEY (id, user_id)
  )`);
  console.log('[migration] Tabela virtues criada com PK composta.');
} else {
  // Tabela existe: verificar se tem user_id
  if (!columnExists('virtues', 'user_id')) {
    // PK simples antiga - migrar para PK composta
    db.exec(`
      ALTER TABLE virtues RENAME TO virtues_old;
      CREATE TABLE virtues (
        id TEXT NOT NULL, user_id INTEGER NOT NULL DEFAULT 1,
        name TEXT NOT NULL, level INTEGER DEFAULT 0,
        is_priority BOOLEAN DEFAULT 0, last_evaluated DATE,
        PRIMARY KEY (id, user_id)
      );
      INSERT OR IGNORE INTO virtues SELECT id, 1, name, level, is_priority, last_evaluated FROM virtues_old;
      DROP TABLE virtues_old;
    `);
    console.log('[migration] Tabela virtues migrada para PK composta.');
  }
}

// ── Seed virtudes para um usuário ────────────────────────────────────────────
// Lista completa de virtudes
const ALL_VIRTUES = [
  // Teologais
  'Fé','Esperança','Caridade',
  // Cardeais
  'Prudência','Justiça','Fortaleza','Temperança',
  // Humanas & Morais
  'Humildade','Paciência','Pureza','Obediência','Caridade Fraterna',
  'Castidade','Mansidão','Benignidade','Longanimidade','Modéstia',
  'Continência','Fidelidade','Pobreza de Espírito','Sinceridade',
  'Gratidão','Generosidade','Afabilidade','Laboriosidade',
  'Perseverança','Discrição','Resiliência','Responsabilidade',
];

function virtueId(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'_');
}

function seedVirtues(userId: number) {
  // Sempre insere virtudes que ainda não existem para o usuário (seed incremental)
  const ins = db.prepare('INSERT OR IGNORE INTO virtues (id, user_id, name) VALUES (?,?,?)');
  let added = 0;
  ALL_VIRTUES.forEach(v => {
    const r = ins.run(virtueId(v), userId, v);
    if (r.changes > 0) added++;
  });
  if (added > 0) console.log(`[seed] ${added} virtude(s) adicionada(s) para usuário ${userId}`);
}

// ── Usuário padrão ────────────────────────────────────────────────────────────
const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
if (userCount === 0) {
  const hash = crypto.createHash('sha256').update('admin123caminho_salt_2026').digest('hex');
  const r = db.prepare("INSERT INTO users (username, password_hash, display_name) VALUES ('admin',?,'Administrador')").run(hash);
  const uid = r.lastInsertRowid as number;
  seedVirtues(uid);
  console.log('\n👤  Usuário padrão criado: admin / admin123\n');
} else {
  // Garantir que todos os usuários existentes têm virtudes
  const allUsers = db.prepare('SELECT id FROM users').all() as any[];
  allUsers.forEach((u: any) => seedVirtues(u.id));
}

// ── Auth helpers ──────────────────────────────────────────────────────────────
function hashPwd(pwd: string) {
  return crypto.createHash('sha256').update(pwd + 'caminho_salt_2026').digest('hex');
}
function generateToken() { return crypto.randomBytes(32).toString('hex'); }

function getUser(req: express.Request): { id: number; username: string; display_name: string } | null {
  const auth = (req.headers.authorization || req.query.token as string || '').replace('Bearer ', '').trim();
  if (!auth) return null;
  const session = db.prepare('SELECT s.user_id, u.username, u.display_name FROM sessions s JOIN users u ON s.user_id=u.id WHERE s.token=?').get(auth) as any;
  return session ? { id: session.user_id, username: session.username, display_name: session.display_name } : null;
}

function requireUser(req: express.Request, res: express.Response): { id: number; username: string; display_name: string } | null {
  const u = getUser(req);
  if (!u) { res.status(401).json({ error: 'Não autenticado' }); return null; }
  return u;
}

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODELS = ['llama-3.3-70b-versatile','llama-3.1-8b-instant','llama3-8b-8192'];

async function callGroq(messages: any[], maxTokens = 1000, jsonMode = false, modelIndex = 0): Promise<string> {
  if (modelIndex >= GROQ_MODELS.length) throw new Error('Todos os modelos Groq falharam.');
  const model = GROQ_MODELS[modelIndex];
  const body: any = { model, messages, max_tokens: maxTokens, temperature: 0.7 };
  if (jsonMode) body.response_format = { type: 'json_object' };
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any;
    if (res.status === 429 || res.status === 503) {
      await new Promise(r => setTimeout(r, 1000));
      return callGroq(messages, maxTokens, jsonMode, modelIndex + 1);
    }
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  return ((await res.json()) as any).choices?.[0]?.message?.content ?? '';
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  app.use(express.json({ limit: '4mb' }));

  // ── Auth ──────────────────────────────────────────────────────────────────
  app.post('/api/auth/register', (req, res) => {
    const { username, password, display_name } = req.body;
    if (!username?.trim() || !password?.trim()) return res.status(400).json({ error: 'Usuário e senha obrigatórios' });
    if (username.trim().length < 3) return res.status(400).json({ error: 'Usuário deve ter ao menos 3 caracteres' });
    if (password.length < 4) return res.status(400).json({ error: 'Senha deve ter ao menos 4 caracteres' });
    if (db.prepare('SELECT id FROM users WHERE username=?').get(username.trim())) return res.status(409).json({ error: 'Nome de usuário já existe' });
    const r = db.prepare('INSERT INTO users (username, password_hash, display_name) VALUES (?,?,?)').run(username.trim(), hashPwd(password), display_name?.trim() || username.trim());
    seedVirtues(r.lastInsertRowid as number);
    const token = generateToken();
    db.prepare('INSERT INTO sessions (token, user_id) VALUES (?,?)').run(token, r.lastInsertRowid);
    res.json({ success: true, token, user: db.prepare('SELECT id, username, display_name FROM users WHERE id=?').get(r.lastInsertRowid) });
  });

  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username?.trim() || !password?.trim()) return res.status(400).json({ error: 'Preencha todos os campos' });
    const user = db.prepare('SELECT * FROM users WHERE username=?').get(username.trim()) as any;
    if (!user || user.password_hash !== hashPwd(password)) return res.status(401).json({ error: 'Usuário ou senha incorretos' });
    const token = generateToken();
    db.prepare('INSERT INTO sessions (token, user_id) VALUES (?,?)').run(token, user.id);
    res.json({ success: true, token, user: { id: user.id, username: user.username, display_name: user.display_name } });
  });

  app.post('/api/auth/logout', (req, res) => {
    const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
    if (token) db.prepare('DELETE FROM sessions WHERE token=?').run(token);
    res.json({ success: true });
  });

  app.get('/api/auth/me', (req, res) => {
    const u = getUser(req);
    if (!u) return res.status(401).json({ error: 'Não autenticado' });
    res.json({ id: u.id, username: u.username, display_name: u.display_name });
  });

  app.put('/api/auth/profile', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    const { display_name, password, new_password } = req.body;
    if (display_name?.trim()) db.prepare('UPDATE users SET display_name=? WHERE id=?').run(display_name.trim(), u.id);
    if (new_password?.trim()) {
      const user = db.prepare('SELECT password_hash FROM users WHERE id=?').get(u.id) as any;
      if (user.password_hash !== hashPwd(password || '')) return res.status(401).json({ error: 'Senha atual incorreta' });
      db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hashPwd(new_password), u.id);
    }
    res.json({ success: true, user: db.prepare('SELECT id, username, display_name FROM users WHERE id=?').get(u.id) });
  });

  // ── AI Proxy ──────────────────────────────────────────────────────────────
  app.post('/api/ai/generate', async (req, res) => {
    if (!GROQ_API_KEY) return res.status(500).json({ error: 'GROQ_API_KEY não configurada' });
    const { messages, responseFormat, maxTokens } = req.body;
    if (!Array.isArray(messages)) return res.status(400).json({ error: 'messages deve ser array' });
    try {
      res.json({ text: await callGroq(messages, maxTokens || 1000, responseFormat === 'json') });
    } catch (e: any) { res.status(502).json({ error: e.message }); }
  });

  // ── Intenção do Papa ──────────────────────────────────────────────────────
  app.get('/api/pope-intention', async (req, res) => {
    try {
      const now = new Date();
      const months = ['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
      const slug = months[now.getMonth()];
      const year = now.getFullYear();
      const urls = [
        `https://redemundialdeoracaodopapa.pt/intencoes_mensais/${slug}-${year}-intencao-do-papa/`,
        `https://www.acidigital.com/`,
      ];
      for (const url of urls) {
        try {
          const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) });
          if (!r.ok) continue;
          const html = await r.text();
          const match = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) || html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
          const raw = match ? match[1] : html.slice(0, 5000);
          const text = raw.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/\s{3,}/g,' ').trim().slice(0,3000);
          if (text.length > 100) return res.json({ success: true, url, text });
        } catch { continue; }
      }
      res.json({ success: false });
    } catch (e: any) { res.json({ success: false, error: e.message }); }
  });


  // ── Liturgia diária — scraping + extração estruturada ─────────────────────
  app.get('/api/liturgy-today', async (req, res) => {
    try {
      const now = new Date();
      const dd = now.getDate().toString().padStart(2, '0');
      const mm = (now.getMonth() + 1).toString().padStart(2, '0');
      const yyyy = now.getFullYear().toString();
      const dateStr = dd + '/' + mm + '/' + yyyy;

      const urls = [
        'https://liturgia.cancaonova.com/pb/' + yyyy + '/' + mm + '/' + dd + '/',
        'https://liturgia.cancaonova.com/pb/',
      ];

      let html = '';
      let bestUrl = '';

      for (const url of urls) {
        try {
          const r = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120',
              'Accept': 'text/html,application/xhtml+xml',
              'Accept-Language': 'pt-BR,pt;q=0.9',
            },
            signal: AbortSignal.timeout(15000),
          });
          if (!r.ok) continue;
          const h = await r.text();
          if (h.length > html.length) { html = h; bestUrl = url; }
        } catch { continue; }
      }

      if (!html) return res.json({ success: false, date: dateStr });

      // ── Limpar e extrair texto de uma região HTML ──────────────────────────
      const extractText = (raw: string): string => raw
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<br[^>]*>/gi, '\n')
        .replace(/<p[^>]*>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<div[^>]*>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<strong[^>]*>/gi, '')
        .replace(/<\/strong>/gi, '')
        .replace(/<em[^>]*>/gi, '')
        .replace(/<\/em>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&#\d+;/g, '')
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      // ── Extrair leituras por padrões de tabs/sections ──────────────────────
      interface Reading { type: string; reference: string; text: string; }
      const readings: Reading[] = [];

      // Padrões possíveis de IDs/classes no site
      const tabPatterns = [
        { id: 'tab-1leitura',   type: '1ª Leitura' },
        { id: 'tab-1-leitura',  type: '1ª Leitura' },
        { id: 'tab-salmo',      type: 'Salmo Responsorial' },
        { id: 'tab-2leitura',   type: '2ª Leitura' },
        { id: 'tab-2-leitura',  type: '2ª Leitura' },
        { id: 'tab-evangelho',  type: 'Evangelho' },
      ];

      for (const pat of tabPatterns) {
        // Match: id="tab-X"...content...next id= or </section or </div class
        const re = new RegExp(
          'id=["\']' + pat.id + '["\'][^>]*>([\\s\\S]{100,8000}?)(?=id=["\']tab-|<\/section|$)',
          'i'
        );
        const m = html.match(re);
        if (!m || !m[1]) continue;

        const raw = m[1];
        // Extract reference from bold/heading near start
        const refM = raw.match(/<strong[^>]*>([^<]{5,60})<\/strong>/i)
          || raw.match(/<h[23][^>]*>([^<]{5,60})<\/h[23]>/i)
          || raw.match(/\(([A-Za-z]\w{0,8}\s+\d[^)]{2,40})\)/);
        const ref = refM ? refM[1].trim() : '';

        const text = extractText(raw);
        if (text.length > 80) {
          readings.push({ type: pat.type, reference: ref, text });
        }
      }

      // Extrair título e cor
      let pageTitle = '';
      let liturgicalColor = '';
      const titleM = html.match(/class="[^"]*title[^"]*"[^>]*>([^<]+)/i)
        || html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      if (titleM) pageTitle = titleM[1].replace(/<[^>]+>/g, '').trim();
      const colorM = html.match(/ROXO|BRANCO|VERDE|VERMELHO|ROSA/i);
      if (colorM) liturgicalColor = colorM[0].toLowerCase();

      // Se extraiu leituras estruturadas, retornar
      if (readings.filter(r => r.type.includes('Leitura') || r.type.includes('Evangelho')).length >= 2) {
        return res.json({ success: true, structured: { readings, pageTitle, liturgicalColor }, date: dateStr });
      }

      // Fallback: texto limpo da página inteira para a IA
      let main = '';
      const mainM = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
      const artM = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
      if (mainM && mainM[1].length > 300) main = mainM[1];
      else if (artM && artM[1].length > 300) main = artM[1];
      else main = html.slice(0, 20000);

      const fullText = extractText(main);
      if (fullText.length < 200) return res.json({ success: false, date: dateStr });

      res.json({ success: true, text: fullText.slice(0, 8000), url: bestUrl, date: dateStr, pageTitle, liturgicalColor });
    } catch (e: any) {
      res.json({ success: false, error: (e as Error).message });
    }
  });

  // ── Liturgia via Claude API (Anthropic) com web search ────────────────────
  app.get('/api/claude-liturgy', async (req, res) => {
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
    if (!ANTHROPIC_API_KEY) return res.json({ success: false, error: 'ANTHROPIC_API_KEY não configurada' });

    try {
      const now = new Date();
      const dd = now.getDate().toString().padStart(2, '0');
      const mm = (now.getMonth() + 1).toString().padStart(2, '0');
      const yyyy = now.getFullYear().toString();
      const dateStr = dd + '/' + mm + '/' + yyyy;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'web-search-2025-03-05',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{
            role: 'user',
            content: `Busque as leituras da Missa Católica de hoje (${dateStr}) no site liturgia.cancaonova.com/pb/ ou vaticannews.va.

Retorne APENAS o seguinte JSON (sem texto antes ou depois):
{
  "title": "dia e semana litúrgica",
  "readings": [
    {"type": "1ª Leitura", "reference": "referência", "text": "texto integral completo"},
    {"type": "Salmo Responsorial", "reference": "referência", "text": "R. antífona\n\n1. estrofe\n\nR. antífona"},
    {"type": "Evangelho", "reference": "referência", "text": "texto integral completo"}
  ]
}`,
          }],
          system: 'Você é especialista em Liturgia Católica. Busque as leituras REAIS do dia no site oficial. Retorne APENAS JSON válido com os textos integrais.',
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({})) as any;
        return res.json({ success: false, error: err?.error?.message || `HTTP ${response.status}` });
      }

      const data = await response.json() as any;
      // Extract text from content blocks
      const textContent = (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
      const clean = textContent.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed = JSON.parse(clean);

      if (parsed?.readings?.length >= 2) {
        return res.json({ success: true, data: parsed, date: dateStr });
      }
      res.json({ success: false, error: 'Leituras não encontradas' });
    } catch (e: any) {
      res.json({ success: false, error: (e as Error).message });
    }
  });

    // ── Dashboard (corrigido - não força 401 quando não está logado) ─────────────
app.get('/api/dashboard', (req, res) => {
  const u = getUser(req);   // ← mudado de requireUser para getUser

  if (!u) {
    // Usuário não logado → retorna dados para não quebrar a tela
    return res.json({
      priorityVirtue: { 
        id: "humildade", 
        name: "Humildade", 
        level: 5, 
        is_priority: true 
      },
      recentJournal: [],
      pendingSinsCount: 3,
      today: new Date().toISOString().split('T')[0],
      userName: "Caminhante"
    });
  }

  // Usuário logado → usa o banco normalmente (comportamento original)
  const priorityVirtue = db.prepare('SELECT * FROM virtues WHERE is_priority=1 AND user_id=? LIMIT 1').get(u.id);
  const recentJournal = db.prepare('SELECT * FROM journal_entries WHERE user_id=? ORDER BY created_at DESC LIMIT 5').all(u.id);
  const pendingSins = (db.prepare('SELECT COUNT(*) as count FROM sins WHERE is_confessed=0 AND user_id=?').get(u.id) as any).count;

  res.json({ 
    priorityVirtue, 
    recentJournal, 
    pendingSinsCount: pendingSins, 
    today: new Date().toISOString().split('T')[0], 
    userName: u.display_name 
  });
});

  // ── Virtudes ──────────────────────────────────────────────────────────────
  app.get('/api/virtues', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    // Ensure all virtues exist for this user (sync new ones)
    seedVirtues(u.id);
    res.json(db.prepare('SELECT * FROM virtues WHERE user_id=?').all(u.id));
  });
  app.put('/api/virtues/:id', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    const { level, is_priority } = req.body;
    if (level !== undefined) db.prepare('UPDATE virtues SET level=?, last_evaluated=CURRENT_DATE WHERE id=? AND user_id=?').run(level, req.params.id, u.id);
    if (is_priority !== undefined) {
      if (is_priority) db.prepare('UPDATE virtues SET is_priority=0 WHERE user_id=?').run(u.id);
      db.prepare('UPDATE virtues SET is_priority=? WHERE id=? AND user_id=?').run(is_priority ? 1 : 0, req.params.id, u.id);
    }
    res.json({ success: true });
  });
  app.post('/api/virtues/:id/toggle-priority', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    db.prepare('UPDATE virtues SET is_priority=0 WHERE user_id=?').run(u.id);
    db.prepare('UPDATE virtues SET is_priority=NOT is_priority WHERE id=? AND user_id=?').run(req.params.id, u.id);
    res.json({ success: true });
  });

  // ── Diário ────────────────────────────────────────────────────────────────
  app.get('/api/journal', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    res.json(db.prepare('SELECT * FROM journal_entries WHERE user_id=? ORDER BY created_at DESC').all(u.id));
  });
  app.post('/api/journal', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    const r = db.prepare('INSERT INTO journal_entries (content, type, user_id) VALUES (?,?,?)').run(req.body.content, req.body.type||'free', u.id);
    res.json({ success: true, id: r.lastInsertRowid });
  });
  app.put('/api/journal/:id', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    db.prepare('UPDATE journal_entries SET content=?, type=? WHERE id=? AND user_id=?').run(req.body.content, req.body.type, req.params.id, u.id);
    res.json({ success: true });
  });
  app.delete('/api/journal/:id', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    db.prepare('DELETE FROM journal_entries WHERE id=? AND user_id=?').run(req.params.id, u.id); res.json({ success: true });
  });
  app.delete('/api/journal', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    db.prepare('DELETE FROM journal_entries WHERE user_id=?').run(u.id); res.json({ success: true });
  });

  // ── Pecados ───────────────────────────────────────────────────────────────
  app.get('/api/sins', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    res.json(db.prepare('SELECT * FROM sins WHERE is_confessed=0 AND user_id=? ORDER BY created_at DESC').all(u.id));
  });
  app.post('/api/sins', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    db.prepare('INSERT INTO sins (content, user_id) VALUES (?,?)').run(req.body.content, u.id); res.json({ success: true });
  });
  app.delete('/api/sins/clear-all', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    db.prepare('DELETE FROM sins WHERE user_id=?').run(u.id); res.json({ success: true });
  });
  app.post('/api/sins/confess-all', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    db.prepare('UPDATE sins SET is_confessed=1 WHERE is_confessed=0 AND user_id=?').run(u.id); res.json({ success: true });
  });
  app.delete('/api/sins/:id', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    db.prepare('DELETE FROM sins WHERE id=? AND user_id=?').run(req.params.id, u.id); res.json({ success: true });
  });

  // ── Propósitos ────────────────────────────────────────────────────────────
  app.get('/api/purposes', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    res.json(db.prepare('SELECT * FROM confession_purposes WHERE user_id=? ORDER BY created_at DESC').all(u.id));
  });
  app.post('/api/purposes', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    const r = db.prepare('INSERT INTO confession_purposes (content, user_id) VALUES (?,?)').run(req.body.content, u.id);
    res.json({ success: true, id: r.lastInsertRowid });
  });
  app.put('/api/purposes/:id/toggle', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    db.prepare('UPDATE confession_purposes SET is_fulfilled=NOT is_fulfilled WHERE id=? AND user_id=?').run(req.params.id, u.id); res.json({ success: true });
  });
  app.delete('/api/purposes/clear-all', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    db.prepare('DELETE FROM confession_purposes WHERE user_id=?').run(u.id); res.json({ success: true });
  });
  app.post('/api/purposes/delete-multiple', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    const { ids } = req.body;
    if (!Array.isArray(ids)||ids.length===0) return res.status(400).json({ error: 'ids inválidos' });
    db.prepare(`DELETE FROM confession_purposes WHERE id IN (${ids.map(()=>'?').join(',')}) AND user_id=?`).run(...ids, u.id);
    res.json({ success: true });
  });
  app.delete('/api/purposes/:id', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    db.prepare('DELETE FROM confession_purposes WHERE id=? AND user_id=?').run(req.params.id, u.id); res.json({ success: true });
  });

  // ── Modelos de Exame ──────────────────────────────────────────────────────
  app.get('/api/exam-models', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    const models = db.prepare('SELECT * FROM custom_exam_models WHERE user_id=? ORDER BY created_at DESC').all(u.id) as any[];
    res.json(models.map(m => ({ ...m, questions: JSON.parse(m.questions) })));
  });
  app.post('/api/exam-models', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    db.prepare('INSERT INTO custom_exam_models (name, questions, user_id) VALUES (?,?,?)').run(req.body.name, JSON.stringify(req.body.questions), u.id);
    res.json({ success: true });
  });
  app.delete('/api/exam-models/:id', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    db.prepare('DELETE FROM custom_exam_models WHERE id=? AND user_id=?').run(req.params.id, u.id); res.json({ success: true });
  });

  // ── Lectio Divina ─────────────────────────────────────────────────────────
  app.get('/api/lectio-history', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    res.json(db.prepare('SELECT * FROM lectio_history WHERE user_id=? ORDER BY created_at DESC').all(u.id));
  });
  app.post('/api/lectio-history', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    const { book,chapter,start_verse,end_verse,content,meditation,prayer,contemplation,action,type } = req.body;
    const r = db.prepare(`INSERT INTO lectio_history (book,chapter,start_verse,end_verse,content,meditation,prayer,contemplation,action,type,user_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .run(book,chapter,start_verse,end_verse,content||'',meditation||'',prayer||'',contemplation||'',action||'',type||'guided',u.id);
    res.json({ success: true, id: r.lastInsertRowid });
  });
  app.post('/api/lectio-history/delete-multiple', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    const { ids } = req.body;
    if (!Array.isArray(ids)||ids.length===0) return res.status(400).json({ error: 'ids inválidos' });
    db.prepare(`DELETE FROM lectio_history WHERE id IN (${ids.map(()=>'?').join(',')}) AND user_id=?`).run(...ids, u.id);
    res.json({ success: true });
  });
  app.delete('/api/lectio-history/:id', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    db.prepare('DELETE FROM lectio_history WHERE id=? AND user_id=?').run(req.params.id, u.id); res.json({ success: true });
  });
  app.delete('/api/lectio-history', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    db.prepare('DELETE FROM lectio_history WHERE user_id=?').run(u.id); res.json({ success: true });
  });

  // ── Orações ───────────────────────────────────────────────────────────────
  app.get('/api/prayers', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    res.json(db.prepare('SELECT * FROM prayers WHERE user_id=? ORDER BY period, name').all(u.id));
  });
  app.post('/api/prayers', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    db.prepare('INSERT OR REPLACE INTO prayers (id, name, period, user_id) VALUES (?,?,?,?)').run(req.body.id, req.body.name, req.body.period, u.id);
    res.json({ success: true });
  });
  app.put('/api/prayers/:id/toggle', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    const prayer = db.prepare('SELECT * FROM prayers WHERE id=? AND user_id=?').get(req.params.id, u.id) as any;
    if (!prayer) return res.status(404).json({ error: 'Não encontrado' });
    const today = new Date().toISOString().split('T')[0];
    const done = prayer.last_completed === today;
    db.prepare('UPDATE prayers SET is_completed=?, last_completed=? WHERE id=? AND user_id=?').run(done?0:1, done?null:today, req.params.id, u.id);
    res.json({ success: true });
  });
  app.delete('/api/prayers/:id', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    db.prepare('DELETE FROM prayers WHERE id=? AND user_id=?').run(req.params.id, u.id); res.json({ success: true });
  });

  // ── Intenções de Oração ───────────────────────────────────────────────────
  app.get('/api/intentions', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    res.json(db.prepare('SELECT * FROM prayer_intentions WHERE user_id=? ORDER BY created_at DESC').all(u.id));
  });
  app.post('/api/intentions', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    const r = db.prepare('INSERT INTO prayer_intentions (content, user_id) VALUES (?,?)').run(req.body.content, u.id);
    res.json({ success: true, id: r.lastInsertRowid });
  });
  app.put('/api/intentions/:id/toggle', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    db.prepare('UPDATE prayer_intentions SET is_answered=NOT is_answered WHERE id=? AND user_id=?').run(req.params.id, u.id); res.json({ success: true });
  });
  app.delete('/api/intentions/:id', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    db.prepare('DELETE FROM prayer_intentions WHERE id=? AND user_id=?').run(req.params.id, u.id); res.json({ success: true });
  });

  // ── Configurações ─────────────────────────────────────────────────────────
  app.get('/api/settings', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    res.json(db.prepare('SELECT * FROM user_settings WHERE user_id=?').get(u.id) || {});
  });
  app.post('/api/settings', (req, res) => {
    const u = requireUser(req, res); if (!u) return;
    const { name, last_confession, next_confession } = req.body;
    db.prepare(`INSERT INTO user_settings (user_id,name,last_confession,next_confession) VALUES (?,?,?,?)
      ON CONFLICT(user_id) DO UPDATE SET name=excluded.name, last_confession=excluded.last_confession, next_confession=excluded.next_confession`)
      .run(u.id, name, last_confession, next_confession);
    res.json({ success: true });
  });


  // ── Busca web para notícias católicas reais ─────────────────────────────
  app.get('/api/catholic-news', async (req, res) => {
    try {
      const now = new Date();
      const day = now.getDate();
      const monthsPT = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
      const monthName = monthsPT[now.getMonth()];
      const year = now.getFullYear();
      const dateStr = `${day} de ${monthName} de ${year}`;

      const sources = [
        { url: 'https://www.vaticannews.va/pt.html', label: 'Vatican News' },
        { url: 'https://www.vaticannews.va/pt/papa.html', label: 'Vatican News - Papa' },
      ];

      let combinedText = `Data: ${dateStr}

`;
      for (const src of sources) {
        try {
          const r = await fetch(src.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'text/html,application/xhtml+xml',
              'Accept-Language': 'pt-BR,pt;q=0.9',
            },
            signal: AbortSignal.timeout(10000),
          });
          if (!r.ok) continue;
          const html = await r.text();
          const text = html
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<nav[\s\S]*?<\/nav>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/\s{3,}/g, ' ').trim();
          const relevant = text.slice(0, 2500);
          combinedText += `
--- ${src.label} (${src.url}) ---
${relevant}
`;
        } catch { continue; }
      }

      res.json({
        success: combinedText.length > 100,
        text: combinedText.slice(0, 6000),
        date: dateStr,
      });
    } catch (e: any) {
      res.json({ success: false, error: e.message });
    }
  });


  // ── Frontend ──────────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
  }

  // Para Vercel: exportar o app; para outros ambientes: app.listen
  if (process.env.VERCEL) {
    // No Vercel, o módulo deve exportar o handler
    (global as any).__vercelApp = app;
  } else {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🕊️  Caminho da Santidade em http://localhost:${PORT}`);
      if (!GROQ_API_KEY) console.warn('⚠️  GROQ_API_KEY não configurada! Adicione no arquivo .env');
    });
  }

  return app;
}

// Inicializar servidor (sempre, para qualquer ambiente)
const appPromise = startServer();

// Export para Vercel Serverless Functions
export default async function handler(req: any, res: any) {
  const app = await appPromise;
  return (app as any)(req, res);
}
