import {describe,it,expect} from 'vitest';
import {createGame,reduce,parseSave} from './engine';

describe('Shared market refill threshold',()=>{
 it('depletes from ten to four without refilling, then immediately refills to ten at three',()=>{
  let s=createGame();const reserve=[...s.market.draw];
  for(let count=9;count>=4;count--){s=reduce(s,{type:'market',index:0,mode:'deny',player:'h0',debug:true});expect(s.market.face).toHaveLength(count);expect(s.market.draw).toEqual(reserve);}
  const survivors=s.market.face.slice(1),denied=s.market.face[0];s=reduce(s,{type:'market',index:0,mode:'deny',player:'h0',debug:true});expect(s.market.face).toHaveLength(10);expect(s.market.face.slice(0,3)).toEqual(survivors);expect(s.market.draw).toHaveLength(23);expect(s.market.denied).toContain(denied);expect(s.market.face).not.toContain(denied);expect(parseSave(JSON.stringify(s))).toEqual(s);
 });
 it('refills within the acquisition action without advancing phase or turn',()=>{
  let s=createGame();s.phase='night';s.turn=0;s.players[4].hand=['d-3'];s.market.face=['dm-0','hm-0','hm-1','hm-2'];s.market.draw=Array.from({length:8},(_,i)=>`hm-${i+3}`);s=reduce(s,{type:'play',index:0});s=reduce(s,{type:'market',index:0,mode:'acquire',player:'dracula'});expect(s.market.face).toHaveLength(10);expect(s.players[4].discard).toContain('dm-0');expect(s.market.draw).toHaveLength(1);expect(s.phase).toBe('night');expect(s.turn).toBe(0);expect(s.played).toBe(true);
 });
 it('does not replenish at dawn or on phase transitions',()=>{
  let s=createGame();s.market.face=s.market.face.slice(0,6);s.phase='night';s.turn=4;const before=structuredClone(s.market);s=reduce(s,{type:'advance',debug:true});expect(s.phase).toBe('day');expect(s.round).toBe(2);expect(s.market).toEqual(before);
 });
 it('uses remaining reserve and recyclable discards, but never denied cards',()=>{
  let s=createGame();s.market.face=['hm-0','hm-1','hm-2','hm-3'];s.market.draw=['hm-4'];s.market.discard=['hm-9'];s.market.denied=['hm-6'];s=reduce(s,{type:'market',index:0,mode:'deny',player:'h0',debug:true});expect(s.market.face).toHaveLength(5);expect(s.market.face).toContain('hm-4');expect(s.market.face).toContain('hm-9');expect(s.market.draw).toEqual([]);expect(s.market.discard).toEqual([]);expect(s.market.face).not.toContain('hm-6');expect(s.market.face).not.toContain('hm-0');
 });
});
