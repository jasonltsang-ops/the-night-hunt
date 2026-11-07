import {describe,it,expect} from 'vitest';
import {createGame,reduce,parseSave,draculaLocation} from './engine';

function travel(phase:'day'|'night',card='travel',start=1){let s=createGame(undefined,start);s.phase=phase;s.turn=phase==='day'?0:1;s.players[0].hand=[card];return reduce(s,{type:'play',index:0});}
describe('Basic Travel at Night',()=>{
 it('adds one basic encounter to the destination, preserving Dracula and every existing card',()=>{const s=travel('night');expect(s.locations[1].deck).toHaveLength(5);expect(s.pendingTravelEncounter).toBe(true);const n=reduce(s,{type:'travel',city:1});expect(n.players[0].city).toBe(1);expect(n.players[0].damage).toBe(0);expect(n.locations[0]).toEqual(s.locations[0]);expect([...n.locations[1].deck].sort()).toEqual([...s.locations[1].deck,'encounter'].sort());expect(n.locations[1].deck).toHaveLength(6);expect(draculaLocation(n)).toBe(1);expect(n.addedBasicEncounters).toBe(1);expect(n.pendingTravelEncounter).toBe(false);expect(parseSave(JSON.stringify(n))).toEqual(n);expect(()=>reduce(n,{type:'travel',city:2})).toThrow();});
 it('adds nothing on Day Travel or advanced Night Travel',()=>{for(const [phase,card] of [['day','travel'],['night','hm-13'],['night','hm-14']] as const){const s=travel(phase,card);const n=reduce(s,{type:'travel',city:1});expect(n.locations).toEqual(s.locations);expect(n.addedBasicEncounters).toBe(0);}});
 it('allows a two-connection horse ride by Day and limits it to one at Night',()=>{
  const day=travel('day','hm-13');
  const night=parseSave(JSON.stringify(travel('night','hm-13')));
  expect(reduce(day,{type:'travel',city:2}).players[0].city).toBe(2);
  expect(()=>reduce(night,{type:'travel',city:2})).toThrow();
  expect(reduce(night,{type:'travel',city:1}).players[0].city).toBe(1);
 });
 it('discards Fast Horse and permanently trashes Travel by Train when played',()=>{
  const horse=travel('day','hm-13');
  expect(horse.players[0].discard).toContain('hm-13');
  const train=travel('day','hm-14');
  const hunter=train.players[0];
  expect([...hunter.hand,...hunter.draw,...hunter.discard]).not.toContain('hm-14');
  expect(reduce(train,{type:'travel',city:5}).players[0].city).toBe(5);
 });
 it.each(['day','night'] as const)('moves any selected local Hunters together by %s and trashes Group Passage',phase=>{
  const s=travel(phase,'hm-15',8);
  const pending=parseSave(JSON.stringify(s));
  expect(()=>reduce(pending,{type:'travel',city:5,companions:['h1']})).toThrow();
  expect(()=>reduce(pending,{type:'travel',city:2,companions:['h1','h1']})).toThrow();
  const n=reduce(pending,{type:'travel',city:2,companions:['h1','h2']});
  expect(n.players.slice(0,4).map(p=>p.city)).toEqual([2,2,2,0]);
  expect(n.locations).toEqual(s.locations);
  expect(n.players[0].discard).not.toContain('hm-15');
  expect(n.pendingGroupPassage).toBeUndefined();
  expect(parseSave(JSON.stringify(n))).toEqual(n);
 });
 it('keeps distant and Exhausted Hunters out of Group Passage',()=>{
  const s=travel('day','hm-15',8);
  s.players[1].city=8;
  s.players[2].recovery='waiting';
  s.players[2].damage=4;
  for(const id of ['h1','h2','dracula'])expect(()=>reduce(s,{type:'travel',city:1,companions:[id]})).toThrow();
  expect(reduce(s,{type:'travel',city:1}).players.slice(0,4).map(p=>p.city)).toEqual([1,8,0,0]);
 });
 it('can visit an empty city without reopening it or adding Night Travel damage',()=>{let s=travel('night','travel',8);s.locations[1].resolved.push(...s.locations[1].deck);s.locations[1].deck=[];s=reduce(s,{type:'travel',city:1});expect(s.locations[1].closed).toBe(true);expect(s.locations[1].deck).toEqual([]);expect(s.addedBasicEncounters).toBe(0);s=reduce(s,{type:'investigate',player:'h0',debug:true});expect(s.players[0].damage).toBe(0);expect(parseSave(JSON.stringify(s))).toEqual(s);});
 it('preserves a pending Night Travel across save/load and rejects invalid destinations without side effects',()=>{const s=travel('night');const saved=parseSave(JSON.stringify(s));expect(saved.pendingTravelEncounter).toBe(true);expect(()=>reduce(saved,{type:'travel',city:8})).toThrow();expect(saved.addedBasicEncounters).toBe(0);expect(saved.locations[1].deck).toHaveLength(5);expect(reduce(saved,{type:'travel',city:1}).addedBasicEncounters).toBe(1);});
});
