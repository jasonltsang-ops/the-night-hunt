import {describe,it,expect} from 'vitest';
import {calendar,createGame,darkness,grantEventDarkness,parseSave,reduce,removeLocationAlly,type State} from './engine';

function endDay(s:State){
 // Normal passing turns, including Dracula with no eligible cards.
 s.players.forEach(p=>p.hand=[]);
 for(let turn=0;turn<10;turn++)s=reduce(s,{type:'advance'});
 return s;
}
function deploy(s:State,city:number){
 s.phase='day';s.turn=4;s.played=false;s.players[4].hand=['dm-4'];
 s=reduce(s,{type:'play',index:0});
 expect(darkness(s).allies).toBe(s.locations.filter(l=>l.ally).length);
 return reduce(s,{type:'placeAlly',city});
}
describe('calendar and Darkness',()=>{
 it('starts on Week 1 Sunday with zero Darkness; Day-to-Night does not advance the date',()=>{
  let s=createGame();expect(calendar(s)).toEqual({week:1,day:1,weekday:'Sunday'});expect(darkness(s).total).toBe(0);
  s.players.forEach(p=>p.hand=[]);
  for(let i=0;i<5;i++)s=reduce(s,{type:'advance'});
  expect(s.phase).toBe('night');expect(calendar(s).weekday).toBe('Sunday');
  for(let i=0;i<5;i++)s=reduce(s,{type:'advance'});
  expect(calendar(s)).toEqual({week:1,day:2,weekday:'Monday'});expect(darkness(s).weekly).toBe(0);
 });
 it('awards 3 only after all seven days, with no repeated awards on Sunday turns or reload',()=>{
  let s=createGame();for(let day=0;day<6;day++)s=endDay(s);
  expect(calendar(s).weekday).toBe('Saturday');expect(darkness(s).weekly).toBe(0);
  s=endDay(s);expect(calendar(s)).toEqual({week:2,day:1,weekday:'Sunday'});expect(darkness(s).weekly).toBe(3);
  expect(parseSave(JSON.stringify(s))).toEqual(s);
  s=reduce(s,{type:'advance'});expect(darkness(s).weekly).toBe(3);
 });
 it('wins without Allies/events at Week 5 Sunday and prevents further play',()=>{
  let s=createGame();for(let day=0;day<28;day++)s=endDay(s);
  expect(calendar(s)).toEqual({week:5,day:1,weekday:'Sunday'});expect(darkness(s).total).toBe(12);expect(s.winner).toBe('dracula');
  expect(()=>reduce(s,{type:'advance',debug:true})).toThrow('Game over');expect(parseSave(JSON.stringify(s))).toEqual(s);
 });
 it('counts deployed Allies only, loses one when removed, and never compounds them weekly',()=>{
  let s=createGame();s.players[4].discard.push('dm-5');expect(darkness(s).allies).toBe(0);
  s=deploy(s,8);s.phase='day';s.turn=0;s.played=false;
  for(let day=0;day<7;day++)s=endDay(s);
  expect(darkness(s)).toEqual({weekly:3,events:0,accumulated:3,allies:1,total:4});
  s=reduce(s,{type:'removeAlly',city:8,debug:true});expect(darkness(s).total).toBe(3);
  expect(()=>removeLocationAlly(s,8)).toThrow('with an ally');
 });
 it('ends play immediately when deployment reaches the target, without exposing the Ally identity',()=>{
  let s=createGame();s.round=22;s=deploy(s,8);
  expect(darkness(s).total).toBe(10);expect(s.winner).toBe('dracula');expect(s.log.slice(-2).join(' ')).not.toContain('Vampire Bride');
  expect(()=>reduce(s,{type:'removeAlly',city:8,debug:true})).toThrow('Game over');expect(parseSave(JSON.stringify(s))).toEqual(s);
 });
 it('supports future event awards, preserves them on reload, and checks event-triggered victory',()=>{
  const s=createGame();grantEventDarkness(s,2);expect(darkness(s).events).toBe(2);expect(parseSave(JSON.stringify(s))).toEqual(s);
  for(const amount of [-1,0,1.5,NaN])expect(()=>grantEventDarkness(s,amount)).toThrow('positive whole number');
  grantEventDarkness(s,8);expect(s.winner).toBe('dracula');expect(()=>grantEventDarkness(s,1)).toThrow('Game over');
 });
 it('migrates version 5 using elapsed weeks and deployed Allies without duplicate awards',()=>{
  const old:any=createGame();old.version=5;delete old.eventDarkness;old.round=15;old.locations[8].ally={card:'dm-4',revealed:false};
  const s=parseSave(JSON.stringify(old));expect(s.version).toBe(6);expect(darkness(s).total).toBe(7);expect(calendar(s).week).toBe(3);expect(parseSave(JSON.stringify(s))).toEqual(s);
  old.round=22;expect(parseSave(JSON.stringify(old)).winner).toBe('dracula');
  old.winner='hunters';old.players[4].damage=10;expect(parseSave(JSON.stringify(old)).winner).toBe('hunters');
 });
 it('rejects missing/invalid score data and inconsistent terminal saves',()=>{
  const s:any=createGame();for(const value of [undefined,-1,0.5,'2']){s.eventDarkness=value;expect(()=>parseSave(JSON.stringify(s))).toThrow();}
  s.eventDarkness=0;s.winner='dracula';expect(()=>parseSave(JSON.stringify(s))).toThrow('Darkness victory');
  s.winner=null;s.eventDarkness=10;expect(()=>parseSave(JSON.stringify(s))).toThrow('Missing Darkness victory');
 });
});
