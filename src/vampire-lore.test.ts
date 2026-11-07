import { expect, it } from 'vitest';
import { createGame, reduce } from './engine';
import { applyOnlineAction, matchView } from './multiplayer';

it('discards a random card from Dracula without naming it to the Hunters', () => {
 const state = createGame([2, 0, 1, 3]);
 state.players[0].hand = ['signature-2-1'];
 state.players[4].hand = ['d-2'];
 const next = applyOnlineAction(state, 'hunter', { type: 'play', index: 0, choice: 'discard-dracula' });
 expect(next.players[4].hand).toEqual([]);
 expect(next.players[4].discard).toContain('d-2');
 expect(next.players[0].discard).toContain('signature-2-1');
 expect(matchView(next, 'hunter', 1).state.log.at(-1)).toBe('Vampire Lore: Dracula discarded one random card.');
});

it('excludes Vampire Lore itself from the random discard and requires another card', () => {
 const state = createGame([2, 0, 1, 3]);
 state.players[0].hand = ['signature-2-1'];
 const action = { type: 'play', index: 0, choice: 'discard-own' } as const;
 expect(() => reduce(state, action)).toThrow();
 state.players[0].hand.push('combat');
 const next = reduce(state, action);
 expect(next.players[0].hand).toEqual([]);
 expect(next.players[0].discard.slice(-2)).toEqual(['signature-2-1', 'combat']);
});
