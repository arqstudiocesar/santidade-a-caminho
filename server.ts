import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import Database from 'better-sqlite3';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Banco de dados ────────────────────────────────────────────────────────────
// No Vercel o único diretório gravável é /tmp (dados efêmeros entre cold-starts)
const DB_PATH = process.env.VERCEL ? '/tmp/caminho.db' : path.join(__dirname, 'spiritual_path.db');
const db = new Database(DB_PATH);

// Ativar WAL mode para melhor performance e robustez
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ────────────────────────────────────────────────────────────────────
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
    title TEXT DEFAULT '', content TEXT NOT NULL, type TEXT DEFAULT 'free',
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
  CREATE TABLE IF NOT EXISTS user_prayers (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
    title TEXT NOT NULL, text TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'habituais',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ── Migrações ─────────────────────────────────────────────────────────────────
const tblExists  = (t: string) => !!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(t);
const colExists  = (t: string, c: string) => tblExists(t) && (db.prepare(`PRAGMA table_info(${t})`).all() as any[]).some((r:any) => r.name === c);

for (const t of ['journal_entries','sins','confession_purposes','custom_exam_models','lectio_history','prayer_intentions']) {
  if (tblExists(t) && !colExists(t, 'user_id'))
    db.exec(`ALTER TABLE ${t} ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1`);
}
if (tblExists('prayers') && !colExists('prayers','user_id'))
  db.exec(`ALTER TABLE prayers ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1`);
// Migração: adiciona coluna title ao diário se não existir
if (tblExists('journal_entries') && !colExists('journal_entries', 'title'))
  db.exec(`ALTER TABLE journal_entries ADD COLUMN title TEXT DEFAULT ''`);

if (!tblExists('virtues')) {
  db.exec(`CREATE TABLE virtues (
    id TEXT NOT NULL, user_id INTEGER NOT NULL DEFAULT 1,
    name TEXT NOT NULL, level INTEGER DEFAULT 0,
    is_priority BOOLEAN DEFAULT 0, last_evaluated DATE,
    PRIMARY KEY (id, user_id)
  )`);
} else if (!colExists('virtues','user_id')) {
  db.exec(`
    ALTER TABLE virtues RENAME TO virtues_old;
    CREATE TABLE virtues (id TEXT NOT NULL, user_id INTEGER NOT NULL DEFAULT 1,
      name TEXT NOT NULL, level INTEGER DEFAULT 0,
      is_priority BOOLEAN DEFAULT 0, last_evaluated DATE, PRIMARY KEY (id, user_id));
    INSERT OR IGNORE INTO virtues SELECT id, 1, name, level, is_priority, last_evaluated FROM virtues_old;
    DROP TABLE virtues_old;
  `);
}

// ── Virtudes & Seed ───────────────────────────────────────────────────────────
const ALL_VIRTUES = [
  'Fé','Esperança','Caridade','Prudência','Justiça','Fortaleza','Temperança',
  'Humildade','Paciência','Pureza','Obediência','Caridade Fraterna','Castidade',
  'Mansidão','Benignidade','Longanimidade','Modéstia','Continência','Fidelidade',
  'Pobreza de Espírito','Sinceridade','Gratidão','Generosidade','Afabilidade',
  'Laboriosidade','Perseverança','Discrição','Resiliência','Responsabilidade',
];
const virtueId = (n: string) => n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'_');
function seedVirtues(userId: number) {
  const ins = db.prepare('INSERT OR IGNORE INTO virtues (id, user_id, name) VALUES (?,?,?)');
  ALL_VIRTUES.forEach(v => ins.run(virtueId(v), userId, v));
}

// ── Helpers Auth ──────────────────────────────────────────────────────────────
const hashPwd = (p: string) => crypto.createHash('sha256').update(p + 'caminho_salt_2026').digest('hex');
const genToken = () => crypto.randomBytes(32).toString('hex');

// ── Seed do usuário admin (sempre que não existir) ────────────────────────────
// IMPORTANTE: No Vercel, o banco /tmp é apagado a cada cold-start.
// Por isso, verificamos SEMPRE se o admin existe e recriamos se necessário.
function ensureAdminUser() {
  const existing = db.prepare("SELECT id FROM users WHERE username='admin'").get() as any;
  if (!existing) {
    const hash = hashPwd('admin123');
    const r = db.prepare("INSERT INTO users (username, password_hash, display_name) VALUES ('admin',?,'Administrador')").run(hash);
    seedVirtues(r.lastInsertRowid as number);
    console.log('✅ Usuário admin criado/recriado');
  } else {
    seedVirtues(existing.id);
  }
}

// Garante admin ao iniciar
ensureAdminUser();

// Seed de todos os outros usuários existentes
(db.prepare('SELECT id FROM users').all() as any[]).forEach((u:any) => seedVirtues(u.id));

function getUser(req: express.Request) {
  const auth = (req.headers.authorization || req.query.token as string || '').replace('Bearer ','').trim();
  if (!auth) return null;
  // Garante que o schema existe (proteção contra cold start do Vercel)
  ensureAdminUser();
  const s = db.prepare('SELECT s.user_id, u.username, u.display_name FROM sessions s JOIN users u ON s.user_id=u.id WHERE s.token=?').get(auth) as any;
  return s ? { id: s.user_id, username: s.username, display_name: s.display_name } : null;
}
function requireUser(req: express.Request, res: express.Response) {
  const u = getUser(req);
  if (!u) res.status(401).json({ error: 'Não autenticado' });
  return u;
}

// ── Groq ──────────────────────────────────────────────────────────────────────
const GROQ_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODELS = ['llama-3.3-70b-versatile','llama-3.1-8b-instant','llama3-8b-8192'];

async function callGroq(messages: any[], maxTokens = 1000, json = false, idx = 0): Promise<string> {
  if (idx >= GROQ_MODELS.length) throw new Error('Todos os modelos Groq falharam.');
  const body: any = { model: GROQ_MODELS[idx], messages, max_tokens: maxTokens, temperature: 0.7 };
  if (json) body.response_format = { type: 'json_object' };
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    if (r.status === 429 || r.status === 503) {
      await new Promise(res => setTimeout(res, 1000));
      return callGroq(messages, maxTokens, json, idx + 1);
    }
    const e = await r.json().catch(() => ({})) as any;
    throw new Error(e?.error?.message || `HTTP ${r.status}`);
  }
  return ((await r.json()) as any).choices?.[0]?.message?.content ?? '';
}

// ── App Express ───────────────────────────────────────────────────────────────
const app = express();
app.use(express.json({ limit: '4mb' }));

// ── CORS para o Vercel ────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── Auth ──────────────────────────────────────────────────────────────────────
app.post('/api/auth/register', (req, res) => {
  // Garante que o banco está ok antes de qualquer operação
  ensureAdminUser();
  const { username, password, display_name } = req.body;
  if (!username?.trim() || !password?.trim()) return res.status(400).json({ error: 'Usuário e senha obrigatórios' });
  if (username.trim().length < 3) return res.status(400).json({ error: 'Usuário deve ter ao menos 3 caracteres' });
  if (password.length < 4) return res.status(400).json({ error: 'Senha deve ter ao menos 4 caracteres' });
  if (db.prepare('SELECT id FROM users WHERE username=?').get(username.trim())) return res.status(409).json({ error: 'Nome de usuário já existe' });
  const r = db.prepare('INSERT INTO users (username, password_hash, display_name) VALUES (?,?,?)').run(username.trim(), hashPwd(password), display_name?.trim() || username.trim());
  seedVirtues(r.lastInsertRowid as number);
  const token = genToken();
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?,?)').run(token, r.lastInsertRowid);
  res.json({ success: true, token, user: db.prepare('SELECT id, username, display_name FROM users WHERE id=?').get(r.lastInsertRowid) });
});

app.post('/api/auth/login', (req, res) => {
  // Garante que o banco está ok — recria admin se o /tmp foi apagado
  ensureAdminUser();
  const { username, password } = req.body;
  if (!username?.trim() || !password?.trim()) return res.status(400).json({ error: 'Preencha todos os campos' });
  const user = db.prepare('SELECT * FROM users WHERE username=?').get(username.trim()) as any;
  if (!user || user.password_hash !== hashPwd(password)) return res.status(401).json({ error: 'Usuário ou senha incorretos' });
  const token = genToken();
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?,?)').run(token, user.id);
  res.json({ success: true, token, user: { id: user.id, username: user.username, display_name: user.display_name } });
});

app.post('/api/auth/logout', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ','').trim();
  if (token) db.prepare('DELETE FROM sessions WHERE token=?').run(token);
  res.json({ success: true });
});

app.get('/api/auth/me', (req, res) => {
  // Se o banco foi apagado (cold-start Vercel), recria o admin antes de verificar
  ensureAdminUser();
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

// ── IA (Groq proxy) ───────────────────────────────────────────────────────────
app.post('/api/ai/generate', async (req, res) => {
  if (!GROQ_KEY) return res.status(500).json({ error: 'GROQ_API_KEY não configurada', text: '' });
  const { messages, responseFormat, maxTokens } = req.body;
  if (!Array.isArray(messages)) return res.status(400).json({ error: 'messages deve ser array' });
  try {
    res.json({ text: await callGroq(messages, maxTokens || 1000, responseFormat === 'json') });
  } catch (e: any) { res.status(502).json({ error: e.message, text: '' }); }
});

// ── Dashboard ─────────────────────────────────────────────────────────────────
app.get('/api/dashboard', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  const priorityVirtue = db.prepare('SELECT * FROM virtues WHERE is_priority=1 AND user_id=? LIMIT 1').get(u.id);
  const recentJournal  = db.prepare('SELECT * FROM journal_entries WHERE user_id=? ORDER BY created_at DESC LIMIT 5').all(u.id);
  const pendingSins    = (db.prepare('SELECT COUNT(*) as count FROM sins WHERE is_confessed=0 AND user_id=?').get(u.id) as any).count;
  res.json({ priorityVirtue, recentJournal, pendingSinsCount: pendingSins, today: new Date().toISOString().split('T')[0], userName: u.display_name });
});

// ── Virtudes ──────────────────────────────────────────────────────────────────
app.get('/api/virtues', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
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

// ── Diário ────────────────────────────────────────────────────────────────────
app.get('/api/journal', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  res.json(db.prepare('SELECT * FROM journal_entries WHERE user_id=? ORDER BY created_at DESC').all(u.id));
});
app.post('/api/journal', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  const { content, type, title } = req.body;
  const r = db.prepare('INSERT INTO journal_entries (title, content, type, user_id) VALUES (?,?,?,?)').run(title||'', content, type||'free', u.id);
  res.json({ success: true, id: r.lastInsertRowid });
});
app.put('/api/journal/:id', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  const { content, type, title } = req.body;
  db.prepare('UPDATE journal_entries SET title=?, content=?, type=? WHERE id=? AND user_id=?').run(title||'', content, type, req.params.id, u.id);
  res.json({ success: true });
});
app.delete('/api/journal/:id', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  db.prepare('DELETE FROM journal_entries WHERE id=? AND user_id=?').run(req.params.id, u.id);
  res.json({ success: true });
});
app.delete('/api/journal', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  db.prepare('DELETE FROM journal_entries WHERE user_id=?').run(u.id);
  res.json({ success: true });
});

// ── Orações ───────────────────────────────────────────────────────────────────
const DEFAULT_PRAYERS = [
  { id:'morning',   name:'Oferecimento do Dia',    period:'morning' },
  { id:'angelus',   name:'Angelus',                period:'afternoon' },
  { id:'rosary',    name:'Santo Rosário',           period:'evening' },
  { id:'compline',  name:'Completas (Oração Noturna)', period:'night' },
  { id:'divine',    name:'Coroa Divina Misericórdia',  period:'afternoon' },
  { id:'liturgy',   name:'Liturgia das Horas',     period:'morning' },
];
app.get('/api/prayers', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  const ins = db.prepare('INSERT OR IGNORE INTO prayers (id, user_id, name, period) VALUES (?,?,?,?)');
  DEFAULT_PRAYERS.forEach(p => ins.run(p.id, u.id, p.name, p.period));
  res.json(db.prepare('SELECT * FROM prayers WHERE user_id=?').all(u.id));
});
app.post('/api/prayers', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  const { id, name, period } = req.body;
  db.prepare('INSERT OR REPLACE INTO prayers (id, user_id, name, period) VALUES (?,?,?,?)').run(id || genToken().slice(0,8), u.id, name, period);
  res.json({ success: true });
});
app.put('/api/prayers/:id', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  const { is_completed, name, period } = req.body;
  if (is_completed !== undefined) {
    db.prepare('UPDATE prayers SET is_completed=?, last_completed=CURRENT_DATE WHERE id=? AND user_id=?').run(is_completed ? 1 : 0, req.params.id, u.id);
  }
  if (name !== undefined) db.prepare('UPDATE prayers SET name=?, period=? WHERE id=? AND user_id=?').run(name, period, req.params.id, u.id);
  res.json({ success: true });
});
app.delete('/api/prayers/:id', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  db.prepare('DELETE FROM prayers WHERE id=? AND user_id=?').run(req.params.id, u.id);
  res.json({ success: true });
});

// ── Pecados ───────────────────────────────────────────────────────────────────
app.get('/api/sins', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  res.json(db.prepare('SELECT * FROM sins WHERE user_id=? ORDER BY created_at DESC').all(u.id));
});
app.post('/api/sins', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  const sins: string[] = Array.isArray(req.body.sins) ? req.body.sins : [req.body.content];
  const ins = db.prepare('INSERT INTO sins (content, user_id) VALUES (?,?)');
  sins.forEach(s => { if (s?.trim()) ins.run(s.trim(), u.id); });
  res.json({ success: true });
});
app.put('/api/sins/:id', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  db.prepare('UPDATE sins SET is_confessed=? WHERE id=? AND user_id=?').run(req.body.is_confessed ? 1 : 0, req.params.id, u.id);
  res.json({ success: true });
});
// Rotas específicas ANTES de :id (ordem importa no Express)
app.delete('/api/sins/clear-all', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  db.prepare('DELETE FROM sins WHERE user_id=?').run(u.id);
  res.json({ success: true });
});
app.post('/api/sins/confess-all', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  db.prepare("UPDATE sins SET is_confessed=1 WHERE user_id=?").run(u.id);
  res.json({ success: true });
});
app.delete('/api/sins', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  db.prepare('DELETE FROM sins WHERE user_id=?').run(u.id);
  res.json({ success: true });
});
app.delete('/api/sins/:id', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  db.prepare('DELETE FROM sins WHERE id=? AND user_id=?').run(req.params.id, u.id);
  res.json({ success: true });
});

// ── Propósitos ────────────────────────────────────────────────────────────────
app.get('/api/purposes', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  res.json(db.prepare('SELECT * FROM confession_purposes WHERE user_id=? ORDER BY created_at DESC').all(u.id));
});
app.post('/api/purposes', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  const r = db.prepare('INSERT INTO confession_purposes (content, user_id) VALUES (?,?)').run(req.body.content, u.id);
  res.json({ success: true, id: r.lastInsertRowid });
});
app.put('/api/purposes/:id', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  db.prepare('UPDATE confession_purposes SET is_fulfilled=? WHERE id=? AND user_id=?').run(req.body.is_fulfilled ? 1 : 0, req.params.id, u.id);
  res.json({ success: true });
});
// Rotas específicas ANTES de :id
app.delete('/api/purposes/clear-all', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  db.prepare('DELETE FROM confession_purposes WHERE user_id=?').run(u.id);
  res.json({ success: true });
});
app.put('/api/purposes/:id/toggle', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  db.prepare('UPDATE confession_purposes SET is_fulfilled=NOT is_fulfilled WHERE id=? AND user_id=?').run(req.params.id, u.id);
  res.json({ success: true });
});
app.delete('/api/purposes', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  db.prepare('DELETE FROM confession_purposes WHERE user_id=?').run(u.id);
  res.json({ success: true });
});
app.delete('/api/purposes/:id', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  db.prepare('DELETE FROM confession_purposes WHERE id=? AND user_id=?').run(req.params.id, u.id);
  res.json({ success: true });
});

// ── Modelos de Exame ──────────────────────────────────────────────────────────
app.get('/api/exam-models', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  const rows = db.prepare('SELECT * FROM custom_exam_models WHERE user_id=? ORDER BY created_at DESC').all(u.id) as any[];
  res.json(rows.map(r => ({ ...r, questions: JSON.parse(r.questions) })));
});
app.post('/api/exam-models', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  const { name, questions } = req.body;
  const r = db.prepare('INSERT INTO custom_exam_models (name, questions, user_id) VALUES (?,?,?)').run(name, JSON.stringify(questions), u.id);
  res.json({ success: true, id: r.lastInsertRowid });
});
app.delete('/api/exam-models/:id', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  db.prepare('DELETE FROM custom_exam_models WHERE id=? AND user_id=?').run(req.params.id, u.id);
  res.json({ success: true });
});

// ── Lectio Divina ─────────────────────────────────────────────────────────────
// Suporta ambos os nomes: /api/lectio (novo) e /api/lectio-history (legado)
const lectioGet = (req: any, res: any) => {
  const u = requireUser(req, res); if (!u) return;
  res.json(db.prepare('SELECT * FROM lectio_history WHERE user_id=? ORDER BY created_at DESC').all(u.id));
};
const lectioPost = (req: any, res: any) => {
  const u = requireUser(req, res); if (!u) return;
  const { book, chapter, start_verse, end_verse, content, meditation, prayer, contemplation, action, type } = req.body;
  const r = db.prepare('INSERT INTO lectio_history (book, chapter, start_verse, end_verse, content, meditation, prayer, contemplation, action, type, user_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .run(book, chapter, start_verse, end_verse, content, meditation, prayer, contemplation, action, type||'guided', u.id);
  res.json({ success: true, id: r.lastInsertRowid });
};
const lectioDeleteOne = (req: any, res: any) => {
  const u = requireUser(req, res); if (!u) return;
  db.prepare('DELETE FROM lectio_history WHERE id=? AND user_id=?').run(req.params.id, u.id);
  res.json({ success: true });
};
const lectioDeleteAll = (req: any, res: any) => {
  const u = requireUser(req, res); if (!u) return;
  db.prepare('DELETE FROM lectio_history WHERE user_id=?').run(u.id);
  res.json({ success: true });
};
// Rotas novas e legadas
app.get('/api/lectio', lectioGet);
app.get('/api/lectio-history', lectioGet);
app.post('/api/lectio', lectioPost);
app.post('/api/lectio-history', lectioPost);
app.delete('/api/lectio/:id', lectioDeleteOne);
app.delete('/api/lectio-history/:id', lectioDeleteOne);
app.delete('/api/lectio', lectioDeleteAll);
app.delete('/api/lectio-history', lectioDeleteAll);

// ── Migração: user_prayers (caso o banco já exista sem a tabela) ──────────────
if (!tblExists('user_prayers')) {
  db.exec(`CREATE TABLE user_prayers (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
    title TEXT NOT NULL, text TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'habituais',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
}

// ── Orações do Usuário (personalizadas) ───────────────────────────────────────
app.get('/api/user-prayers', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  res.json(db.prepare('SELECT * FROM user_prayers WHERE user_id=? ORDER BY title ASC').all(u.id));
});
app.post('/api/user-prayers', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  const { title, text, category } = req.body;
  if (!title?.trim() || !text?.trim()) return res.status(400).json({ error: 'Título e texto obrigatórios' });
  const validCategories = ['habituais', 'ladainhas', 'formais'];
  const cat = validCategories.includes(category) ? category : 'habituais';
  const r = db.prepare('INSERT INTO user_prayers (user_id, title, text, category) VALUES (?,?,?,?)').run(u.id, title.trim(), text.trim(), cat);
  res.json({ success: true, id: r.lastInsertRowid });
});
app.delete('/api/user-prayers/:id', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  db.prepare('DELETE FROM user_prayers WHERE id=? AND user_id=?').run(req.params.id, u.id);
  res.json({ success: true });
});

// ── Intenções de Oração ───────────────────────────────────────────────────────
app.get('/api/intentions', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  res.json(db.prepare('SELECT * FROM prayer_intentions WHERE user_id=? ORDER BY created_at DESC').all(u.id));
});
app.post('/api/intentions', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  const r = db.prepare('INSERT INTO prayer_intentions (content, user_id) VALUES (?,?)').run(req.body.content, u.id);
  res.json({ success: true, id: r.lastInsertRowid });
});
app.put('/api/intentions/:id', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  db.prepare('UPDATE prayer_intentions SET is_answered=? WHERE id=? AND user_id=?').run(req.body.is_answered ? 1 : 0, req.params.id, u.id);
  res.json({ success: true });
});
app.delete('/api/intentions/:id', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  db.prepare('DELETE FROM prayer_intentions WHERE id=? AND user_id=?').run(req.params.id, u.id);
  res.json({ success: true });
});

// ── Configurações do usuário ──────────────────────────────────────────────────
app.get('/api/settings', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  const s = db.prepare('SELECT * FROM user_settings WHERE user_id=?').get(u.id);
  res.json(s || { user_id: u.id, name: u.display_name });
});
app.post('/api/settings', (req, res) => {
  const u = requireUser(req, res); if (!u) return;
  const { name, last_confession, next_confession } = req.body;
  db.prepare(`INSERT INTO user_settings (user_id, name, last_confession, next_confession) VALUES (?,?,?,?)
    ON CONFLICT(user_id) DO UPDATE SET name=excluded.name, last_confession=excluded.last_confession, next_confession=excluded.next_confession`)
    .run(u.id, name, last_confession, next_confession);
  res.json({ success: true });
});

// ── Liturgia (scraping Canção Nova) ───────────────────────────────────────────
app.get('/api/liturgy-today', async (req, res) => {
  try {
    const now = new Date();
    const dd = now.getDate().toString().padStart(2,'0');
    const mm = (now.getMonth()+1).toString().padStart(2,'0');
    const yyyy = now.getFullYear().toString();
    const dateStr = `${dd}/${mm}/${yyyy}`;
    const urls = [
      `https://liturgia.cancaonova.com/pb/${yyyy}/${mm}/${dd}/`,
      'https://liturgia.cancaonova.com/pb/',
    ];
    let html = '', bestUrl = '';
    for (const url of urls) {
      try {
        const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120', 'Accept-Language': 'pt-BR,pt;q=0.9' }, signal: AbortSignal.timeout(15000) });
        if (!r.ok) continue;
        const h = await r.text();
        if (h.length > html.length) { html = h; bestUrl = url; }
      } catch { continue; }
    }
    if (!html) return res.json({ success: false, date: dateStr });

    const cleanHtml = (raw: string) => raw
      .replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'')
      .replace(/<br[^>]*>/gi,'\n').replace(/<p[^>]*>/gi,'\n').replace(/<\/p>/gi,'\n')
      .replace(/<div[^>]*>/gi,'\n').replace(/<\/div>/gi,'\n')
      .replace(/<strong[^>]*>/gi,'').replace(/<\/strong>/gi,'')
      .replace(/<em[^>]*>/gi,'').replace(/<\/em>/gi,'')
      .replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ')
      .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#\d+;/g,'')
      .replace(/[ \t]{2,}/g,' ').replace(/\n{3,}/g,'\n\n').trim();

    interface Reading { type: string; reference: string; text: string; }
    const readings: Reading[] = [];
    const pats = [
      { id: 'tab-1leitura', type: '1ª Leitura' },{ id: 'tab-1-leitura', type: '1ª Leitura' },
      { id: 'tab-salmo', type: 'Salmo Responsorial' },
      { id: 'tab-2leitura', type: '2ª Leitura' },{ id: 'tab-2-leitura', type: '2ª Leitura' },
      { id: 'tab-evangelho', type: 'Evangelho' },
    ];
    for (const p of pats) {
      const re = new RegExp('id=["\']' + p.id + '["\'][^>]*>([\\s\\S]{100,8000}?)(?=id=["\']tab-|<\\/section|$)','i');
      const m = html.match(re); if (!m?.[1]) continue;
      const refM = m[1].match(/<strong[^>]*>([^<]{5,60})<\/strong>/i) || m[1].match(/\(([A-Za-z]\w{0,8}\s+\d[^)]{2,40})\)/);
      const text = cleanHtml(m[1]);
      if (text.length > 80) readings.push({ type: p.type, reference: refM?.[1]?.trim() || '', text });
    }
    if (readings.filter(r => r.type.includes('Leitura') || r.type.includes('Evangelho')).length >= 2)
      return res.json({ success: true, structured: { readings }, date: dateStr });

    let main = '';
    const mainM = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    const artM  = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (mainM?.[1]?.length > 300) main = mainM[1];
    else if (artM?.[1]?.length > 300) main = artM[1];
    else main = html.slice(0, 20000);
    const fullText = cleanHtml(main);
    res.json({ success: fullText.length > 200, text: fullText.slice(0,8000), url: bestUrl, date: dateStr });
  } catch (e: any) { res.json({ success: false, error: e.message }); }
});

// ── Claude API com web search (leituras) ─────────────────────────────────────
app.get('/api/claude-liturgy', async (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY || '';
  if (!key) return res.json({ success: false, error: 'ANTHROPIC_API_KEY não configurada' });
  try {
    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getFullYear()}`;
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-beta': 'web-search-2025-03-05' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 4000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: 'Especialista em Liturgia Católica. Retorne APENAS JSON válido.',
        messages: [{ role: 'user', content: `Busque leituras da Missa Católica de hoje (${dateStr}) em liturgia.cancaonova.com/pb/ e retorne JSON: {"title":"...","readings":[{"type":"1ª Leitura","reference":"...","text":"..."},{"type":"Salmo Responsorial","reference":"...","text":"..."},{"type":"Evangelho","reference":"...","text":"..."}]}` }],
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!r.ok) return res.json({ success: false, error: `HTTP ${r.status}` });
    const data = await r.json() as any;
    const txt = (data.content||[]).filter((b:any)=>b.type==='text').map((b:any)=>b.text).join('');
    const parsed = JSON.parse(txt.replace(/^```json\s*/i,'').replace(/```\s*$/i,'').trim());
    if (parsed?.readings?.length >= 2) return res.json({ success: true, data: parsed, date: dateStr });
    res.json({ success: false, error: 'Leituras não encontradas' });
  } catch (e: any) { res.json({ success: false, error: e.message }); }
});

// ── Intenção do Papa ──────────────────────────────────────────────────────────
app.get('/api/pope-intention', async (req, res) => {
  try {
    const months = ['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
    const url = `https://redemundialdeoracaodopapa.pt/intencoes_mensais/${months[new Date().getMonth()]}-${new Date().getFullYear()}-intencao-do-papa/`;
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return res.json({ success: false });
    const html = await r.text();
    const match = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) || html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    const raw = match ? match[1] : html.slice(0, 5000);
    const text = raw.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/\s{3,}/g,' ').trim().slice(0,3000);
    res.json(text.length > 100 ? { success: true, url, text } : { success: false });
  } catch (e: any) { res.json({ success: false, error: e.message }); }
});

// ── Notícias Católicas ────────────────────────────────────────────────────────
app.get('/api/catholic-news', async (req, res) => {
  try {
    const now = new Date();
    const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
    const dateStr = `${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`;
    const sources = [
      { url: 'https://www.vaticannews.va/pt.html', label: 'Vatican News' },
      { url: 'https://www.vaticannews.va/pt/papa.html', label: 'Vatican News - Papa' },
    ];
    let combined = `Data: ${dateStr}\n\n`;
    for (const src of sources) {
      try {
        const r = await fetch(src.url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'pt-BR,pt;q=0.9' }, signal: AbortSignal.timeout(10000) });
        if (!r.ok) continue;
        const html = await r.text();
        const text = html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<nav[\s\S]*?<\/nav>/gi,'').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/\s{3,}/g,' ').trim();
        combined += `\n--- ${src.label} ---\n${text.slice(0,2500)}\n`;
      } catch { continue; }
    }
    res.json({ success: combined.length > 100, text: combined.slice(0,6000), date: dateStr });
  } catch (e: any) { res.json({ success: false, error: e.message }); }
});

// ── Frontend: servir build estático (local apenas; no Vercel a CDN faz isso) ──
if (!process.env.VERCEL) {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// ── Export para Vercel Serverless (obrigatório) ───────────────────────────────
export default app;

// ── Para execução local (tsx server.ts) ───────────────────────────────────────
if (!process.env.VERCEL) {
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🕊️  Caminho da Santidade em http://localhost:${PORT}`);
    if (!GROQ_KEY) console.warn('⚠️  GROQ_API_KEY não configurada!');
  });
}
