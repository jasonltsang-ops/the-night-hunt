import {describe,it,expect} from 'vitest';
import {createGame,reduce,draculaLocation,parseSave,canPlaceEncounter} from './engine';

function play(phase:'day'|'night',start=4){const s=createGame(undefined,start);s.phase=phase;s.turn=phase==='day'?4:0;s.players[4].hand=['d-0'];return reduce(s,{type:'play',index:0});}
describe('Damaging Encounter',()=>{
 it.each(['day','night'] as const)('enforces the placement range for %s',phase=>{
  const s=play(phase);expect(s.pendingEncounter).toBe(true);expect(s.players[4].discard).toContain('d-0');expect(()=>reduce(s,{type:'advance'})).toThrow('Place the Damaging Encounter');
  for(const city of phase==='day'?[4,1,3,5,7]:[0,1,2,3,4,5,6,7,8]){expect(canPlaceEncounter(s,city)).toBe(true);const n=reduce(s,{type:'placeEncounter',city});expect(n.locations[city].deck).toHaveLength(6);expect(n.locations[city].deck).toContain('damaging');expect(draculaLocation(n)).toBe(4);expect(n.pendingEncounter).toBe(false);expect(n.log.at(-1)).not.toContain('Dracula’s city');expect(parseSave(JSON.stringify(n))).toEqual(n);expect(()=>reduce(n,{type:'placeEncounter',city})).toThrow('Play Damaging Encounter');}
  for(const city of phase==='day'?[0,2,6,8,-1,9,1.5]:[-1,9,1.5])expect(()=>reduce(s,{type:'placeEncounter',city})).toThrow('orthogonally');expect(s.locations[4].deck).toHaveLength(5);
 });
 it('publishes the selected destination and shuffles all cards without losing Dracula',()=>{const s=play('day',0);const n=reduce(s,{type:'placeEncounter',city:0});expect([...n.locations[0].deck].sort()).toEqual(['damaging','dracula','encounter','encounter','encounter','encounter']);expect(n.log.at(-1)).toBe('Dracula placed a Damaging Encounter in London; its encounter deck was shuffled.');expect(draculaLocation(n)).toBe(0);expect(()=>reduce(s,{type:'placeEncounter',city:2})).toThrow();});
 it.each(['day','night'] as const)('uses investigation timing for damage after %s placement',placedPhase=>{
  const placed=reduce(play(placedPhase),{type:'placeEncounter',city:1});
  for(const [phase,damage] of [['day',1],['night',2]] as const){let s=reduce(placed,{type:'stack',city:1,card:'damaging'});s.phase=phase;s.turn=phase==='day'?0:1;s.played=false;s.players[0].city=1;s.players[0].hand=['investigate'];s=reduce(s,{type:'play',index:0});expect(s.players[0].damage).toBe(damage);expect(s.locations[1].deck).toHaveLength(5);expect(s.locations[1].resolved).toEqual(['damaging']);expect(s.log.at(-1)).toContain('Damaging Encounter');expect(parseSave(JSON.stringify(s))).toEqual(s);}
 });
 it('cannot replenish an empty city, but can add repeatedly to an open one',()=>{let s=play('day');s.locations[1].resolved.push(...s.locations[1].deck);s.locations[1].deck=[];expect(()=>reduce(s,{type:'placeEncounter',city:1})).toThrow();s=reduce(s,{type:'placeEncounter',city:3});expect(s.locations[1].closed).toBe(true);s.played=false;s.players[4].hand=['d-0'];s=reduce(s,{type:'play',index:0});s=reduce(s,{type:'placeEncounter',city:3});expect(s.locations[3].deck.filter(c=>c==='damaging')).toHaveLength(2);expect(parseSave(JSON.stringify(s))).toEqual(s);});
 it('preserves pending placement on load and normalizes older saves',()=>{const s=play('night');expect(parseSave(JSON.stringify(s)).pendingEncounter).toBe(true);const {pendingEncounter,...old}=s;expect(parseSave(JSON.stringify(old)).pendingEncounter).toBe(false);});
});
