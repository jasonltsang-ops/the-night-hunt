import {describe,it,expect} from 'vitest';
import {createGame,reduce,active} from './engine';
describe('Voluntary Hunter pass',()=>{
 it.each(['day','night'] as const)('passes an eligible hand during %s without discarding or playing',phase=>{const s=createGame();s.phase=phase;s.turn=phase==='day'?0:1;s.players[0].hand=['travel','supply'];const before=structuredClone(s.players[0]);const n=reduce(s,{type:'advance'});expect(active(n).id).toBe('h1');expect(n.players[0]).toEqual(before);expect(n.log.some(x=>x.includes('passed without playing'))).toBe(true);});
 it('still requires completing a started effect',()=>{const s=createGame();s.players[0].hand=['travel'];const n=reduce(s,{type:'play',index:0});expect(()=>reduce(n,{type:'advance'})).toThrow('destination');});
 it('leaves Dracula’s obligation to play an eligible card unchanged',()=>{const s=createGame();s.turn=4;s.players[4].hand=['d-0'];expect(()=>reduce(s,{type:'advance'})).toThrow('Play one card');});
});
