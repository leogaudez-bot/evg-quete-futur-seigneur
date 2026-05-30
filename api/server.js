import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'data', 'prophecies.sqlite');
const allowedOrigins = (process.env.CORS_ORIGIN || 'https://leogaudez-bot.github.io,http://localhost:5173,http://127.0.0.1:5173')
  .split(',').map(x => x.trim()).filter(Boolean);

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS markets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  creatorName TEXT NOT NULL,
  oddsYes REAL NOT NULL,
  oddsNo REAL NOT NULL,
  minStake INTEGER NOT NULL DEFAULT 10,
  maxStake INTEGER NOT NULL DEFAULT 200,
  status TEXT NOT NULL DEFAULT 'open',
  winningOutcome TEXT,
  createdAt TEXT NOT NULL,
  resolvedAt TEXT
);
CREATE TABLE IF NOT EXISTS balances (
  userName TEXT PRIMARY KEY,
  balance INTEGER NOT NULL DEFAULT 500,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS wagers (
  id TEXT PRIMARY KEY,
  marketId TEXT NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  userName TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK(outcome IN ('yes','no')),
  stake INTEGER NOT NULL,
  odds REAL NOT NULL,
  payout INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS wagers_market_idx ON wagers(marketId);
CREATE INDEX IF NOT EXISTS wagers_user_idx ON wagers(userName);
`);

const seedMarkets = [
  ['Alexis va vomir avant minuit ?', 'Valide si deux témoins ou une preuve vidéo confirment la prophétie.', 'Le Grand Chambellan', 1.20, 2.80, 10, 200],
  ['Le futur marié va chanter une chanson paillarde ?', 'Un couplet complet minimum. Le barde de la cour juge la performance.', 'Le Barde Royal', 1.80, 1.90, 10, 150],
  ['Quelqu’un va perdre un accessoire médiéval ?', 'Épée, couronne, cape, blason ou dignité matérielle.', 'Le Devin Ivre', 1.55, 2.25, 5, 120],
  ['Une maison va tenter une alliance honteuse ?', 'Deux équipes complotent ouvertement contre une troisième.', 'La Banque du Royaume', 2.10, 1.60, 10, 180]
];
if (db.prepare('SELECT COUNT(*) AS c FROM markets').get().c === 0) {
  const ins = db.prepare(`INSERT INTO markets (id,title,description,creatorName,oddsYes,oddsNo,minStake,maxStake,status,createdAt)
    VALUES (@id,@title,@description,@creatorName,@oddsYes,@oddsNo,@minStake,@maxStake,'open',@createdAt)`);
  const now = new Date().toISOString();
  seedMarkets.forEach((m, i) => ins.run({ id: `seed-${i+1}`, title:m[0], description:m[1], creatorName:m[2], oddsYes:m[3], oddsNo:m[4], minStake:m[5], maxStake:m[6], createdAt: now }));
}

const app = express();
app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.some(o => origin === o || origin.startsWith(o))) return cb(null, true);
    return cb(null, true); // party app: permissive reads/writes, no real money or secrets
  }
}));
app.use(express.json({ limit: '50kb' }));

function now(){ return new Date().toISOString(); }
function id(prefix){ return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`; }
function cleanName(name){ return String(name || '').trim().slice(0, 40) || 'Chevalier anonyme'; }
function clampOdds(value){ const n = Number(value); if (!Number.isFinite(n)) return null; return Math.round(Math.min(10, Math.max(1.01, n)) * 100) / 100; }
function clampStake(value, min = 1, max = 500){ const n = Math.floor(Number(value)); if (!Number.isFinite(n)) return null; return Math.min(max, Math.max(min, n)); }
function ensureBalance(userName){
  const name = cleanName(userName);
  const t = now();
  db.prepare(`INSERT OR IGNORE INTO balances (userName,balance,createdAt,updatedAt) VALUES (?,500,?,?)`).run(name,t,t);
  return db.prepare('SELECT userName,balance FROM balances WHERE userName=?').get(name);
}
function getAggregatedMarkets(){
  return db.prepare(`
    SELECT m.*,
      COALESCE(SUM(CASE WHEN w.outcome='yes' THEN w.stake ELSE 0 END),0) totalYesStake,
      COALESCE(SUM(CASE WHEN w.outcome='no' THEN w.stake ELSE 0 END),0) totalNoStake,
      COUNT(w.id) wagerCount
    FROM markets m
    LEFT JOIN wagers w ON w.marketId=m.id
    GROUP BY m.id
    ORDER BY CASE m.status WHEN 'open' THEN 0 WHEN 'resolved' THEN 1 ELSE 2 END, m.createdAt DESC
  `).all();
}

app.get('/health', (req, res) => res.json({ ok:true, service:'evg-prophecies-api', time: now() }));

app.get('/state', (req, res) => {
  const players = String(req.query.players || '').split(',').map(cleanName).filter(Boolean).slice(0, 50);
  players.forEach(ensureBalance);
  const balances = db.prepare('SELECT userName,balance FROM balances ORDER BY userName').all();
  const wagers = db.prepare('SELECT * FROM wagers ORDER BY createdAt DESC LIMIT 400').all();
  res.json({ markets: getAggregatedMarkets(), wagers, balances, serverTime: now(), disclaimer: 'Écus fictifs uniquement — aucun argent réel.' });
});

app.post('/markets', (req, res) => {
  const title = String(req.body.title || '').trim().slice(0, 120);
  if (title.length < 8) return res.status(400).json({ error:'Question trop courte.' });
  const creatorName = cleanName(req.body.creatorName);
  const oddsYes = clampOdds(req.body.oddsYes ?? 1.5);
  const oddsNo = clampOdds(req.body.oddsNo ?? 2.0);
  const minStake = clampStake(req.body.minStake ?? 10, 1, 200);
  const maxStake = clampStake(req.body.maxStake ?? 200, Math.max(10, minStake), 500);
  if (!oddsYes || !oddsNo || !minStake || !maxStake) return res.status(400).json({ error:'Paramètres invalides.' });
  const market = { id:id('market'), title, description:String(req.body.description || '').trim().slice(0, 260), creatorName, oddsYes, oddsNo, minStake, maxStake, createdAt:now() };
  db.prepare(`INSERT INTO markets (id,title,description,creatorName,oddsYes,oddsNo,minStake,maxStake,status,createdAt)
    VALUES (@id,@title,@description,@creatorName,@oddsYes,@oddsNo,@minStake,@maxStake,'open',@createdAt)`).run(market);
  res.status(201).json({ market: db.prepare('SELECT * FROM markets WHERE id=?').get(market.id) });
});

app.post('/markets/:id/wagers', (req, res) => {
  const tx = db.transaction(() => {
    const market = db.prepare('SELECT * FROM markets WHERE id=?').get(req.params.id);
    if (!market) throw Object.assign(new Error('Pari introuvable.'), { status:404 });
    if (market.status !== 'open') throw Object.assign(new Error('Pari fermé.'), { status:409 });
    const outcome = req.body.outcome === 'no' ? 'no' : 'yes';
    const stake = Math.floor(Number(req.body.stake));
    if (!Number.isFinite(stake) || stake < market.minStake || stake > market.maxStake) throw Object.assign(new Error(`Mise entre ${market.minStake} et ${market.maxStake} écus.`), { status:400 });
    const userName = cleanName(req.body.userName);
    const balance = ensureBalance(userName);
    if (balance.balance < stake) throw Object.assign(new Error('Pas assez d’écus dans la bourse.'), { status:409 });
    const odds = outcome === 'yes' ? market.oddsYes : market.oddsNo;
    const payout = Math.floor(stake * odds);
    const wager = { id:id('wager'), marketId:market.id, userName, outcome, stake, odds, payout, createdAt:now() };
    db.prepare('UPDATE balances SET balance=balance-?, updatedAt=? WHERE userName=?').run(stake, now(), userName);
    db.prepare(`INSERT INTO wagers (id,marketId,userName,outcome,stake,odds,payout,status,createdAt)
      VALUES (@id,@marketId,@userName,@outcome,@stake,@odds,@payout,'active',@createdAt)`).run(wager);
    return wager;
  });
  try { res.status(201).json({ wager: tx() }); } catch(e){ res.status(e.status || 500).json({ error:e.message }); }
});

app.post('/markets/:id/resolve', (req, res) => {
  const tx = db.transaction(() => {
    const outcome = req.body.outcome === 'no' ? 'no' : 'yes';
    const market = db.prepare('SELECT * FROM markets WHERE id=?').get(req.params.id);
    if (!market) throw Object.assign(new Error('Pari introuvable.'), { status:404 });
    if (market.status !== 'open') throw Object.assign(new Error('Pari déjà clôturé.'), { status:409 });
    db.prepare("UPDATE markets SET status='resolved', winningOutcome=?, resolvedAt=? WHERE id=?").run(outcome, now(), market.id);
    const winners = db.prepare("SELECT * FROM wagers WHERE marketId=? AND outcome=? AND status='active'").all(market.id, outcome);
    for (const w of winners) db.prepare('UPDATE balances SET balance=balance+?, updatedAt=? WHERE userName=?').run(w.payout, now(), w.userName);
    db.prepare("UPDATE wagers SET status=CASE WHEN outcome=? THEN 'won' ELSE 'lost' END WHERE marketId=? AND status='active'").run(outcome, market.id);
    return { marketId: market.id, winningOutcome: outcome, winners: winners.length };
  });
  try { res.json(tx()); } catch(e){ res.status(e.status || 500).json({ error:e.message }); }
});

app.post('/markets/:id/cancel', (req, res) => {
  const tx = db.transaction(() => {
    const market = db.prepare('SELECT * FROM markets WHERE id=?').get(req.params.id);
    if (!market) throw Object.assign(new Error('Pari introuvable.'), { status:404 });
    if (market.status !== 'open') throw Object.assign(new Error('Pari déjà clôturé.'), { status:409 });
    const wagers = db.prepare("SELECT * FROM wagers WHERE marketId=? AND status='active'").all(market.id);
    for (const w of wagers) db.prepare('UPDATE balances SET balance=balance+?, updatedAt=? WHERE userName=?').run(w.stake, now(), w.userName);
    db.prepare("UPDATE wagers SET status='refunded' WHERE marketId=? AND status='active'").run(market.id);
    db.prepare("UPDATE markets SET status='cancelled', resolvedAt=? WHERE id=?").run(now(), market.id);
    return { marketId: market.id, refunded: wagers.length };
  });
  try { res.json(tx()); } catch(e){ res.status(e.status || 500).json({ error:e.message }); }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => console.log(`EVG prophecies API listening on ${PORT}, db=${DB_PATH}`));
}

export { app, db };
