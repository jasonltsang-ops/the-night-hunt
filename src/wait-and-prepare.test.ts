import { describe, expect, it } from 'vitest';
import { active, createGame, reduce } from './engine';

describe('Wait and Prepare', () => {
 for (const phase of ['day', 'night'] as const) {
  it(`draws without moving or adding an encounter during ${phase}`, () => {
   const state = createGame();
   state.phase = phase;
   if (phase === 'night') state.turn = 1;
   const hunter = active(state);
   hunter.hand = ['travel'];
   hunter.draw = [];
   hunter.discard = ['combat'];
   const result = reduce(state, { type: 'play', index: 0, choice: 'prepare' });
   expect(active(result)).toMatchObject({ city: hunter.city, hand: ['combat'], discard: ['travel'] });
   expect(result.locations).toEqual(state.locations);
   expect(result.pendingTravel).toBe(0);
   expect(result.pendingTravelEncounter).toBe(false);
   expect(() => reduce(result, { type: 'play', index: 0, choice: 'heal' })).toThrow();
  });
 }
 it('cannot draw the same carriage just played when no other cards are available', () => {
  const state = createGame();
  Object.assign(active(state), { hand: ['travel'], draw: [], discard: [] });
  const result = reduce(state, { type: 'play', index: 0, choice: 'prepare' });
  expect(active(result)).toMatchObject({ hand: [], discard: ['travel'] });
 });
});
