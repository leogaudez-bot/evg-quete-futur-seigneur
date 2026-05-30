export const PROPHECY_API_URL = (import.meta.env.VITE_PROPHECY_API_URL || 'https://crudcrud.com/api/0e1b667177624df69e3f2ab672a8ab4f').replace(/\/$/, '');

const isCrudCrud = PROPHECY_API_URL.includes('crudcrud.com/api/');
const now = () => new Date().toISOString();
const rid = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
const cleanName = name => String(name || '').trim().slice(0, 40) || 'Chevalier anonyme';
const noId = obj => Object.fromEntries(Object.entries(obj).filter(([k]) => k !== '_id'));

async function http(path, options = {}) {
  if (!PROPHECY_API_URL) throw new Error('API des prophéties non configurée.');
  const res = await fetch(`${PROPHECY_API_URL}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) }
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Erreur API ${res.status}`);
  return body;
}

async function getCollection(name){ return http(`/${name}`); }
async function postRecord(name, value){ return http(`/${name}`, { method:'POST', body: JSON.stringify(value) }); }
async function putRecord(name, record){ return http(`/${name}/${record._id}`, { method:'PUT', body: JSON.stringify(noId(record)) }); }

function aggregateMarkets(markets, wagers){
  return [...markets].map(m => {
    const ws = wagers.filter(w => w.marketId === m.id);
    return {
      ...m,
      totalYesStake: ws.filter(w => w.outcome === 'yes').reduce((s,w)=>s+Number(w.stake||0),0),
      totalNoStake: ws.filter(w => w.outcome === 'no').reduce((s,w)=>s+Number(w.stake||0),0),
      wagerCount: ws.length
    };
  }).sort((a,b) => (a.status === 'open' ? 0 : 1) - (b.status === 'open' ? 0 : 1) || String(b.createdAt).localeCompare(String(a.createdAt)));
}

async function crudState(playerNames = []){
  let [markets, wagers, balances] = await Promise.all([getCollection('markets'), getCollection('wagers'), getCollection('balances')]);
  for (const raw of playerNames.map(cleanName).filter(Boolean)) {
    if (!balances.some(b => b.userName === raw)) {
      await postRecord('balances', { userName: raw, balance: 500, createdAt: now(), updatedAt: now() });
    }
  }
  if (playerNames.length) balances = await getCollection('balances');
  return { markets: aggregateMarkets(markets, wagers), wagers: wagers.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))), balances, serverTime: now(), disclaimer:'Écus fictifs uniquement — aucun argent réel.' };
}

export async function fetchBetState(playerNames = []) {
  if (isCrudCrud) return crudState(playerNames);
  const qs = new URLSearchParams({ players: playerNames.join(',') });
  return http(`/state?${qs}`);
}

export async function createMarket(input) {
  if (!isCrudCrud) return http('/markets', { method:'POST', body: JSON.stringify(input) });
  const market = {
    id: rid('market'),
    title: String(input.title || '').trim().slice(0,120),
    description: String(input.description || '').trim().slice(0,260),
    creatorName: cleanName(input.creatorName),
    oddsYes: Math.min(10, Math.max(1.01, Number(input.oddsYes || 1.5))),
    oddsNo: Math.min(10, Math.max(1.01, Number(input.oddsNo || 2))),
    minStake: Math.min(200, Math.max(1, Math.floor(Number(input.minStake || 10)))),
    maxStake: Math.min(500, Math.max(10, Math.floor(Number(input.maxStake || 200)))),
    status:'open', winningOutcome:null, createdAt:now(), resolvedAt:null
  };
  market.maxStake = Math.max(market.minStake, market.maxStake);
  if (market.title.length < 8) throw new Error('Question trop courte.');
  return { market: await postRecord('markets', market) };
}

async function ensureCrudBalance(userName){
  const name = cleanName(userName);
  const balances = await getCollection('balances');
  const existing = balances.find(b => b.userName === name);
  return existing || postRecord('balances', { userName:name, balance:500, createdAt:now(), updatedAt:now() });
}

export async function placeWager(marketId, input) {
  if (!isCrudCrud) return http(`/markets/${marketId}/wagers`, { method:'POST', body: JSON.stringify(input) });
  const markets = await getCollection('markets');
  const market = markets.find(m => m.id === marketId);
  if (!market) throw new Error('Pari introuvable.');
  if (market.status !== 'open') throw new Error('Pari fermé.');
  const outcome = input.outcome === 'no' ? 'no' : 'yes';
  const stake = Math.floor(Number(input.stake));
  if (!Number.isFinite(stake) || stake < market.minStake || stake > market.maxStake) throw new Error(`Mise entre ${market.minStake} et ${market.maxStake} écus.`);
  const balance = await ensureCrudBalance(input.userName);
  if (Number(balance.balance) < stake) throw new Error('Pas assez d’écus dans la bourse.');
  const odds = outcome === 'yes' ? Number(market.oddsYes) : Number(market.oddsNo);
  const wager = { id:rid('wager'), marketId, userName:cleanName(input.userName), outcome, stake, odds, payout:Math.floor(stake * odds), status:'active', createdAt:now() };
  await postRecord('wagers', wager);
  await putRecord('balances', { ...balance, balance:Number(balance.balance)-stake, updatedAt:now() });
  return { wager };
}

export async function resolveMarket(marketId, outcome) {
  if (!isCrudCrud) return http(`/markets/${marketId}/resolve`, { method:'POST', body: JSON.stringify({ outcome }) });
  const winningOutcome = outcome === 'no' ? 'no' : 'yes';
  const [markets, wagers, balances] = await Promise.all([getCollection('markets'), getCollection('wagers'), getCollection('balances')]);
  const market = markets.find(m => m.id === marketId);
  if (!market) throw new Error('Pari introuvable.');
  if (market.status !== 'open') throw new Error('Pari déjà clôturé.');
  const related = wagers.filter(w => w.marketId === marketId && w.status === 'active');
  for (const w of related) {
    const status = w.outcome === winningOutcome ? 'won' : 'lost';
    await putRecord('wagers', { ...w, status });
    if (status === 'won') {
      const b = balances.find(x => x.userName === w.userName) || await ensureCrudBalance(w.userName);
      b.balance = Number(b.balance) + Number(w.payout);
      b.updatedAt = now();
      await putRecord('balances', b);
    }
  }
  await putRecord('markets', { ...market, status:'resolved', winningOutcome, resolvedAt:now() });
  return { marketId, winningOutcome };
}

export async function cancelMarket(marketId) {
  if (!isCrudCrud) return http(`/markets/${marketId}/cancel`, { method:'POST', body: JSON.stringify({}) });
  const [markets, wagers, balances] = await Promise.all([getCollection('markets'), getCollection('wagers'), getCollection('balances')]);
  const market = markets.find(m => m.id === marketId);
  if (!market) throw new Error('Pari introuvable.');
  if (market.status !== 'open') throw new Error('Pari déjà clôturé.');
  for (const w of wagers.filter(w => w.marketId === marketId && w.status === 'active')) {
    await putRecord('wagers', { ...w, status:'refunded' });
    const b = balances.find(x => x.userName === w.userName) || await ensureCrudBalance(w.userName);
    b.balance = Number(b.balance) + Number(w.stake);
    b.updatedAt = now();
    await putRecord('balances', b);
  }
  await putRecord('markets', { ...market, status:'cancelled', resolvedAt:now() });
  return { marketId };
}
