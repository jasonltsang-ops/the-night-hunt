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

it('cannot discard from an empty Dracula hand even when the Hunter has another card', () => {
 const state = createGame([2, 0, 1, 3]);
 state.players[0].hand = ['signature-2-1', 'combat'];
 state.players[4].hand = [];
 const action = { type: 'play', index: 0, choice: 'discard-dracula' } as const;
 expect(() => reduce(state, action)).toThrow('Dracula has no card to discard.');
 expect(state.players[0].hand).toEqual(['signature-2-1', 'combat']);
});
