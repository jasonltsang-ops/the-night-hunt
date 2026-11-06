import {describe,it,expect} from 'vitest';
import {createGame,reduce,hp,parseSave} from './engine';
import {cards} from './data';
describe('Medical Supplies',()=>{
 it.each(['day','night'] as const)('fully heals the acting Hunter by %s while consuming its standard play',phase=>{const s=createGame();s.phase=phase;s.turn=phase==='day'?0:1;s.players[0].hand=['hm-10'];s.players[0].damage=3;s.players[1].damage=2;const n=reduce(s,{type:'play',index:0});expect(cards['hm-10'].name).toBe('Medical Supplies');expect(hp(n,n.players[0])).toBe(4);expect(n.players[1].damage).toBe(2);expect(n.players[0].hand).not.toContain('hm-10');expect(n.players[0].discard).not.toContain('hm-10');expect(n.players[0].draw).not.toContain('hm-10');expect(n.log.at(-1)).toContain('trashed');expect(n.played).toBe(true);expect(s.players[0].damage).toBe(3);expect(parseSave(JSON.stringify(n))).toEqual(n);});
 it('uses configured maximum HP and cannot bypass knockout recovery',()=>{const s=createGame();s.config.hunterHP=6;s.players[0].damage=5;s.players[0].hand=['hm-10'];expect(hp(reduce(s,{type:'play',index:0}),s.players[0])).toBe(1);const n=reduce(s,{type:'play',index:0});expect(hp(n,n.players[0])).toBe(6);s.players[0].recovery='resting';expect(()=>reduce(s,{type:'play',index:0})).toThrow('recovering');});
});
