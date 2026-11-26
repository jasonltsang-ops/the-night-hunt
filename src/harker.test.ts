import {describe,it,expect} from 'vitest';
import {createGame,reduce,parseSave,searchPeek} from './engine';
function play(card:string,phase:'day'|'night'='day',start=8){const s=createGame([1,0,2,3],start);s.phase=phase;s.turn=phase==='day'?0:1;s.players[0].hand=[card];return reduce(s,{type:'play',index:0});}
describe('Jonathan Harker signatures',()=>{
 it.each(['day','night'] as const)('examines privately and resolves exactly one encounter during %s',phase=>{const s=play('signature-1-0',phase);expect(searchPeek(s,'h0')).toHaveLength(2);expect(searchPeek(s,'h1')).toEqual([]);expect(()=>reduce(s,{type:'advance'})).toThrow();const index=searchPeek(s,'h0').indexOf('encounter');const n=reduce(s,{type:'methodicalSearch',index});expect(n.locations[0].deck).toHaveLength(3);expect(n.locations[0].resolved).toEqual(['encounter']);expect(n.players[0].damage).toBe(1);expect(n.pendingSearch).toBe(null);expect(parseSave(JSON.stringify(n))).toEqual(n);});
 it('can leave Dracula hidden or choose him to start combat',()=>{let s=createGame([1,0,2,3],0);s.players[0].hand=['signature-1-0'];s=reduce(s,{type:'stack',city:0,card:'dracula'});s=reduce(s,{type:'play',index:0});const avoid=reduce(s,{type:'methodicalSearch',index:1});expect(avoid.combat).toBe(null);expect(avoid.locations[0].deck).toContain('dracula');const discover=reduce(s,{type:'methodicalSearch',index:0});expect(discover.combat?.stage).toBe('cards');expect(discover.pendingSearch).toBe(null);});
 it('handles one-card and empty piles and saves a pending search',()=>{let s=play('signature-1-0');expect(parseSave(JSON.stringify(s)).pendingSearch).toBe('h0');s.locations[0].resolved.push(...s.locations[0].deck.splice(1));expect(searchPeek(s,'h0')).toHaveLength(1);expect(()=>reduce(s,{type:'methodicalSearch',index:1})).toThrow();s=reduce(s,{type:'methodicalSearch',index:0});expect(s.locations[0].deck).toEqual([]);s.played=false;s.players[0].hand=['signature-1-0'];s=reduce(s,{type:'play',index:0});expect(s.pendingSearch).toBe(null);expect(s.log.at(-1)).toContain('empty');});
 it.each(['day','night'] as const)('dispatches another Hunter during %s',phase=>{
  const s=play('signature-1-1',phase);
  const n=reduce(s,{type:'urgentDispatch',player:'h1',city:1});
  expect(n.players[1].city).toBe(1);
  expect(n.players[0].city).toBe(s.players[0].city);
  expect(n.addedBasicEncounters).toBe(phase==='night'?1:0);
  expect([...n.locations[1].deck].sort()).toEqual([...s.locations[1].deck,...(phase==='night'?['encounter']:[])].sort());
  expect(n.pendingDispatch).toBeNull();
  expect(parseSave(JSON.stringify(n))).toEqual(n);
 });
 it('skips the Night encounter in a consecrated destination',()=>{
  const s=play('signature-1-1','night');
  const location=s.locations[1];
  location.resolved.push(...location.deck.splice(0));
  location.closed=true;
  const n=reduce(s,{type:'urgentDispatch',player:'h1',city:1});
  expect(n.players[1].city).toBe(1);
  expect(n.locations[1]).toEqual(location);
 });
 it('rejects invalid movement, Dracula and knocked-out Hunters',()=>{const s=play('signature-1-1');expect(parseSave(JSON.stringify(s)).pendingDispatch).toBe('h0');expect(()=>reduce(s,{type:'urgentDispatch',player:'h0',city:1})).toThrow();for(const city of [0,4,8,-1,1.5])expect(()=>reduce(s,{type:'urgentDispatch',player:'h1',city})).toThrow();expect(()=>reduce(s,{type:'urgentDispatch',player:'dracula',city:1})).toThrow();s.players[1].recovery='waiting';s.players[1].damage=4;expect(()=>reduce(s,{type:'urgentDispatch',player:'h1',city:1})).toThrow();expect(()=>reduce(s,{type:'advance'})).toThrow();});
});
