import {describe,it,expect} from 'vitest';
import {createGame,reduce,parseSave,draw} from './engine';

describe('Equipment replacement',()=>{
 it.each(['discard','trash'] as const)('enforces %s disposal on acquisition',replacedDestination=>{
  const s=createGame();
  s.players[0].equipment=['hm-9'];s.players[0].hand=['supply'];
  s.market.face=['hm-6','hm-1','hm-2','hm-3'];
  const pending=reduce(s,{type:'play',index:0});
  const apply=()=>reduce(pending,{type:'market',index:0,mode:'acquire',player:'h0',destination:'equipment',replacedDestination});
  if(replacedDestination==='trash'){expect(apply).toThrow('must be discarded');return;}
  const n=apply();
  expect(n.players[0].equipment).toEqual(['hm-6']);
  expect(n.players[0].discard).toContain('hm-9');
  expect(n.market.face).toHaveLength(10);
  expect(n.pendingSupply).toBe(false);
  expect(parseSave(JSON.stringify(n))).toEqual(n);
  n.players[0].draw=[];
  draw(n.players[0],2);
  expect(n.players[0].hand).toContain('hm-9');
 });
 it.each(['discard','trash'] as const)('enforces %s disposal when equipping from hand',replacedDestination=>{
  const s=createGame();
  s.players[0].equipment=['hm-4'];s.players[0].hand=['hm-6'];
  const apply=()=>reduce(s,{type:'play',index:0,replacedDestination});
  if(replacedDestination==='trash'){expect(apply).toThrow('must be discarded');return;}
  const n=apply();
  expect(n.players[0].equipment).toEqual(['hm-6']);
  expect(n.players[0].discard).toContain('hm-4');
  expect(s.players[0].equipment).toEqual(['hm-4']);
  expect(n.played).toBe(true);
 });
});
