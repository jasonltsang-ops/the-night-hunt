import {describe,it,expect} from 'vitest';
import {active,createGame,parseSave,reduce} from './engine';

describe('Work the Market with an exhausted market',()=>{
 it('resolves without a target, preserves the save, and allows the next turn',()=>{
  const s=createGame();s.players[0].hand=['supply'];
  s.market.denied.push(...s.market.face,...s.market.draw);s.market.face=[];s.market.draw=[];
  const n=reduce(s,{type:'play',index:0});
  expect(n.pendingSupply).toBe(false);expect(n.played).toBe(true);
  expect(n.players[0].discard).toContain('supply');
  expect(n.log.at(-1)).toContain('No legal market target');
  expect(parseSave(JSON.stringify(n))).toEqual(n);
  expect(active(reduce(n,{type:'advance'})).id).toBe('h1');
  expect(s.players[0].hand).toEqual(['supply']);
 });
 it.each(['hm-0','dm-0'])('still requires resolving the last available card %s',id=>{
  const s=createGame();s.players[0].hand=['supply'];s.market.face=[id];s.market.draw=[];
  const n=reduce(s,{type:'play',index:0});expect(n.pendingSupply).toBe(true);
  expect(()=>reduce(n,{type:'advance'})).toThrow('Resolve Work the Market');
  const done=reduce(n,{type:'market',index:0,mode:id==='hm-0'?'acquire':'deny',player:'h0'});
  expect(done.pendingSupply).toBe(false);expect(active(reduce(done,{type:'advance'})).id).toBe('h1');
 });
});