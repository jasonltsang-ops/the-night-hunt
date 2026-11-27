import {expect,it} from 'vitest';
import {createGame,createSetup,hp,maxHP,parseSave,reduce} from './engine';
import {matchView} from './multiplayer';

it('starts Dracula at 6 of 8 HP in both setup and a started game',()=>{
 for(const s of [createSetup(),createGame()]){
  expect(hp(s,s.players[4])).toBe(6);
  expect(maxHP(s,s.players[4])).toBe(8);
  const view=matchView(s,'hunter',0).state;
  expect(hp(view,view.players[4])).toBe(6);
  expect(maxHP(view,view.players[4])).toBe(8);
 }
});

it('allows Unholy Strength to heal immediately and caps healing at 8',()=>{
 let s=createGame();
 s.turn=4;s.players[4].hand=['dm-unholy'];
 for(const expected of [7,8,8]){
  s.played=false;s.players[4].hand=['dm-unholy'];
  s=reduce(s,{type:'play',index:0});
  expect(hp(s,s.players[4])).toBe(expected);
 }
});

it('raises the standard maximum for old saves while preserving current HP',()=>{
 const s=createGame();
 const old={...s,version:9,config:{...s.config,draculaHP:6}};
 old.players[4].damage=2;
 const n=parseSave(JSON.stringify(old));
 expect(hp(n,n.players[4])).toBe(4);
 expect(maxHP(n,n.players[4])).toBe(8);
 expect(parseSave(JSON.stringify(n))).toEqual(n);
});
