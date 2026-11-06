import {describe,it,expect} from 'vitest';
import {createGame,reduce,parseSave} from './engine';
import {cards} from './data';
describe('A Lucky Find',()=>{
 it.each(['day','night'] as const)('heals one damage during %s, discards and consumes the standard play',phase=>{const s=createGame();s.phase=phase;s.turn=phase==='day'?0:1;s.players[0].hand=['combat'];s.players[0].damage=3;const n=reduce(s,{type:'play',index:0,choice:'heal'});expect(n.players[0].damage).toBe(2);expect(s.players[0].damage).toBe(3);expect(n.players[0].hand).toEqual([]);expect(n.players[0].discard).toContain('combat');expect(n.played).toBe(true);expect(parseSave(JSON.stringify(n))).toEqual(n);});
 it('does not heal beyond zero damage and requires a choice',()=>{const s=createGame();s.players[0].hand=['combat'];expect(()=>reduce(s,{type:'play',index:0})).toThrow('Choose healing or combat');expect(reduce(s,{type:'play',index:0,choice:'heal'}).players[0].damage).toBe(0);});
 it('reserves +1 combat for a showdown rather than wasting a standard play',()=>{const s=createGame();s.players[0].hand=['combat'];s.players[0].damage=2;expect(cards.combat.name).toBe('A Lucky Find');expect(s.config.basicCombat).toBe(1);expect(()=>reduce(s,{type:'play',index:0,choice:'combat'})).toThrow('when combat begins');expect(s.players[0].damage).toBe(2);});
});
