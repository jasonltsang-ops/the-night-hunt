import {describe,it,expect} from 'vitest';
import {createGame,parseSave} from './engine';
describe('Four starting Savage Attacks',()=>{
 it('starts Dracula with four damaging encounters and no delaying encounters',()=>{const p=createGame().players[4];const deck=[...p.hand,...p.draw,...p.discard];expect(deck).toHaveLength(9);expect(deck.filter(id=>id==='d-0')).toHaveLength(4);expect(deck).not.toContain('d-1');expect(deck.filter(id=>id==='d-4')).toHaveLength(1);});
 it('converts delaying cards in all personal save zones without changing other cards or turns',()=>{const s=createGame();const p=s.players[4];p.hand=['d-1','d-2'];p.draw=['d-1','d-3'];p.discard=['d-1','d-4'];const n=parseSave(JSON.stringify(s));expect(n.players[4].hand).toEqual(['d-0','d-2']);expect(n.players[4].draw).toEqual(['d-0','d-3']);expect(n.players[4].discard).toEqual(['d-0','d-4']);expect(n.turn).toBe(s.turn);expect(n.locations).toEqual(s.locations);expect(parseSave(JSON.stringify(n))).toEqual(n);});
});
