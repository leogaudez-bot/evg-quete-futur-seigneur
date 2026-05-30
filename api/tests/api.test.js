import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const dir = mkdtempSync(path.join(tmpdir(), 'evg-api-'));
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = path.join(dir, 'test.sqlite');
const { app, db } = await import('../server.js');

function listen(){
  return new Promise(resolve => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
  });
}
async function api(server, pathname, options = {}){
  const port = server.address().port;
  const res = await fetch(`http://127.0.0.1:${port}${pathname}`, {
    ...options,
    headers: { 'content-type':'application/json', ...(options.headers || {}) }
  });
  const body = await res.json();
  return { res, body };
}

test('state seeds markets and balances for players', async () => {
  const server = await listen();
  try {
    const { res, body } = await api(server, '/state?players=Alexis,Léo');
    assert.equal(res.status, 200);
    assert.ok(body.markets.length >= 3);
    assert.equal(body.balances.find(b => b.userName === 'Alexis').balance, 500);
  } finally { server.close(); }
});

test('placing a wager debits ecus and resolving pays fixed odds once', async () => {
  const server = await listen();
  try {
    const state = await api(server, '/state?players=Alexis');
    const market = state.body.markets.find(m => m.status === 'open');
    const stake = 50;
    const wager = await api(server, `/markets/${market.id}/wagers`, { method:'POST', body: JSON.stringify({ userName:'Alexis', outcome:'yes', stake }) });
    assert.equal(wager.res.status, 201);
    assert.equal(wager.body.wager.payout, Math.floor(stake * market.oddsYes));
    let afterStake = await api(server, '/state?players=Alexis');
    assert.equal(afterStake.body.balances.find(b => b.userName === 'Alexis').balance, 450);
    const resolved = await api(server, `/markets/${market.id}/resolve`, { method:'POST', body: JSON.stringify({ outcome:'yes' }) });
    assert.equal(resolved.res.status, 200);
    let afterResolve = await api(server, '/state?players=Alexis');
    assert.equal(afterResolve.body.balances.find(b => b.userName === 'Alexis').balance, 450 + Math.floor(stake * market.oddsYes));
    const duplicate = await api(server, `/markets/${market.id}/resolve`, { method:'POST', body: JSON.stringify({ outcome:'yes' }) });
    assert.equal(duplicate.res.status, 409);
  } finally { server.close(); }
});

test.after(() => {
  db.close();
  rmSync(dir, { recursive:true, force:true });
});
