import {describe,it,expect} from 'vitest';
import {createGame,reduce,active} from './engine';
describe('Voluntary Hunter pass',()=>{
 it.each(['day','night'] as const)('passes an eligible hand during %s without discarding or playing',phase=>{const s=createGame();s.phase=phase;s.turn=phase==='day'?0:1;s.players[0].hand=['travel','supply'];const before=structuredClone(s.players[0]);const n=reduce(s,{type:'advance'});expect(active(n).id).toBe('h1');expect(n.players[0]).toEqual(before);expect(n.log.some(x=>x.includes('passed without playing'))).toBe(true);});
 it.each(['day','night'] as const)('can permanently trash one non-basic hand card and pass by %s',phase=>{
  const s=createGame();
  s.phase=phase;s.turn=phase==='day'?0:1;
  s.players[0].hand=['travel','hm-13'];
  expect(()=>reduce(s,{type:'advance',trashIndex:0})).toThrow('non-basic card');
  const next=reduce(s,{type:'advance',trashIndex:1});
  expect(active(next).id).toBe('h1');
  expect(next.players[0].hand).toEqual(['travel']);
  expect(next.players[0].discard).toEqual(s.players[0].discard);
  expect(next.log.some(entry=>entry.includes('permanently trashed Fast Horse'))).toBe(true);
  expect(s.players[0].hand).toEqual(['travel','hm-13']);
  s.played=true;
  expect(()=>reduce(s,{type:'advance',trashIndex:1})).toThrow('unused Hunter turn');
 });
 it('still requires completing a started effect',()=>{const s=createGame();s.players[0].hand=['travel'];const n=reduce(s,{type:'play',index:0});expect(()=>reduce(n,{type:'advance'})).toThrow('destination');});
 it('leaves Dracula’s obligation to play an eligible card unchanged',()=>{const s=createGame();s.turn=4;s.players[4].hand=['d-0'];expect(()=>reduce(s,{type:'advance'})).toThrow('Play one card');});
});
