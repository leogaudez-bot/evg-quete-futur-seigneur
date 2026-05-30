import test from 'node:test';
import assert from 'node:assert/strict';
import { createTeams, getEvent, getMiniGame, getStage, pickContestants, rankTeams } from '../src/gameData.js';

test('createTeams distributes players into multiple houses', () => {
  const teams = createTeams(['Alice','Bob','Chloé','David','Emma','Franck'], 3);
  assert.equal(teams.length, 3);
  assert.deepEqual(teams.map(t => t.players.length), [2,2,2]);
  assert.ok(teams[0].players[0].role);
});

test('createTeams clamps to playable team count', () => {
  assert.equal(createTeams(['A'], 4).length, 2);
  assert.equal(createTeams(['A','B','C','D','E'], 99).length, 4);
});

test('round helpers loop through stages, games and events', () => {
  assert.equal(getStage(0).name, 'La Taverne');
  assert.equal(getStage(7).name, 'Le Pont du Malaise');
  assert.ok(getMiniGame(20).title);
  assert.ok(getEvent(20).effect);
});

test('pickContestants selects one or two player contestants', () => {
  const teams = createTeams(['Alice','Bob','Chloé','David'], 2);
  const picked = pickContestants(teams, 1);
  assert.ok(picked.length >= 1);
  assert.ok(picked[0].name);
  assert.ok(picked[0].house);
});

test('rankTeams sorts by score descending', () => {
  const teams = createTeams(['Alice','Bob','Chloé','David'], 2).map((t,i) => ({ ...t, score: i === 0 ? 2 : 7 }));
  assert.equal(rankTeams(teams)[0].score, 7);
});
