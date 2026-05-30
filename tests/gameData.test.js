import test from 'node:test';
import assert from 'node:assert/strict';
import { assignRoles, finalEnding, makeDeck } from '../src/gameData.js';

test('makeDeck adapts duration and intensity', () => {
  assert.equal(makeDeck({ duration: 'court', intensity: 'soft' }).length, 6);
  assert.equal(makeDeck({ duration: 'standard', intensity: 'medium' }).length, 9);
  assert.equal(makeDeck({ duration: 'long', intensity: 'hard' }).length, 12);
  assert.ok(makeDeck({ duration: 'long', intensity: 'soft' }).every(q => q.intensity === 'soft'));
});

test('assignRoles includes groom and participants with roles', () => {
  const assigned = assignRoles(['Alice', 'Bob'], 'Léo');
  assert.equal(assigned.length, 3);
  assert.equal(assigned[0].player, 'Léo');
  assert.ok(assigned[0].name);
  assert.ok(assigned[1].badge);
});

test('finalEnding selects the highest unlocked ending', () => {
  assert.equal(finalEnding(0).title, 'Écuyer magnifique mais approximatif');
  assert.equal(finalEnding(16).title, 'Seigneur du banquet');
  assert.equal(finalEnding(99).title, 'Roi consort de la Sigma Chevalerie');
});
