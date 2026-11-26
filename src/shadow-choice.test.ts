import {describe,it,expect} from 'vitest';
import {createGame,reduce,draculaLocation,parseSave} from './engine';
function setup(){let s=createGame(undefined,4);s.phase='night';s.turn=0;s.players[4].hand=['d-2'];return reduce(s,{type:'play',index:0});}
describe('Shadow Passage movement choice',()=>{
 it('requires an explicit choice and locks actual movement to Dracula and adjacent cities',()=>{const s=setup();const index=s.locations[4].deck.indexOf('dracula');expect(()=>reduce(s,{type:'swap',from:4,to:5,fromIndex:index,toIndex:0} as any)).toThrow('whether');for(const to of [0,2,6,8])expect(()=>reduce(s,{type:'swap',moveDracula:true,from:4,to,fromIndex:index,toIndex:0})).toThrow('adjacent');expect(()=>reduce(s,{type:'swap',moveDracula:true,from:0,to:1,fromIndex:0,toIndex:0})).toThrow('actual city');expect(()=>reduce(s,{type:'swap',moveDracula:true,from:4,to:5,fromIndex:s.locations[4].deck.findIndex(c=>c!=='dracula'),toIndex:0})).toThrow('Select Dracula');const n=reduce(s,{type:'swap',moveDracula:true,from:4,to:5,fromIndex:index,toIndex:0});expect(draculaLocation(n)).toBe(5);expect(parseSave(JSON.stringify(n))).toEqual(n);});
 it('permits adjacent Night bluff cities while excluding Dracula from either card choice',()=>{const s=setup();const n=reduce(s,{type:'swap',moveDracula:false,from:0,to:1,fromIndex:0,toIndex:0});expect(draculaLocation(n)).toBe(4);const index=s.locations[4].deck.indexOf('dracula');expect(()=>reduce(s,{type:'swap',moveDracula:false,from:4,to:5,fromIndex:index,toIndex:0})).toThrow('cannot move');expect(()=>reduce(s,{type:'swap',moveDracula:false,from:1,to:4,fromIndex:0,toIndex:index})).toThrow('cannot move');expect(()=>reduce(s,{type:'swap',moveDracula:false,from:0,to:0,fromIndex:0,toIndex:0})).toThrow('distinct');expect(n.log.at(-1)).not.toMatch(/bluff|did not|moved Dracula/i);expect(parseSave(JSON.stringify(n))).toEqual(n);});
 it('rejects a bluff when no adjacent decks can be swapped',()=>{let s=createGame(undefined,4);s.locations.forEach((l,i)=>{if(i!==0&&i!==8){l.resolved.push(...l.deck);l.deck=[];}});s.phase='night';s.turn=0;s.players[4].hand=['d-2'];expect(()=>reduce(s,{type:'play',index:0})).toThrow('No legal Shadow Passage');});
});

describe('Wolf Form',()=>{
 const wolf='dm-wolf-form';
 function playWolf(){
  const s=createGame(undefined,0);
  s.phase='night';
  s.turn=0;
  s.players[4].hand=[wolf];
  return reduce(s,{type:'play',index:0});
 }
 it('moves two connections through consecrated ground and saves the pending swap',()=>{
  let s=playWolf();
  const intermediate=s.locations[1];
  intermediate.resolved.push(...intermediate.deck);
  intermediate.deck=[];
  intermediate.closed=true;
  s=parseSave(JSON.stringify(s));
  const move={type:'swap',moveDracula:true,from:0,to:2,fromIndex:s.locations[0].deck.indexOf('dracula'),toIndex:0} as const;
  for(const to of [1,5])expect(()=>reduce(s,{...move,to})).toThrow('within two connections');
  const n=reduce(s,move);
  expect(draculaLocation(n)).toBe(2);
  expect(n.players[4].discard).toContain(wolf);
  expect(n.pendingWolfForm).toBeUndefined();
  expect(n.log.at(-1)).toBe('Wolf Form: cards swapped between London and Prague; both decks shuffled.');
 });
 it('can bluff across the same range with the same public announcement',()=>{
  const s=playWolf();
  const n=reduce(s,{type:'swap',moveDracula:false,from:0,to:2,fromIndex:s.locations[0].deck.findIndex(c=>c!=='dracula'),toIndex:0});
  expect(draculaLocation(n)).toBe(0);
  expect(n.log.at(-1)).toBe('Wolf Form: cards swapped between London and Prague; both decks shuffled.');
 });
 it('cannot be played by day',()=>{
  const s=createGame();
  s.turn=4;
  s.players[4].hand=[wolf];
  expect(()=>reduce(s,{type:'play',index:0})).toThrow('Card cannot be played now');
 });
 it('adds one copy to an existing market and preserves a later denial',()=>{
  const s=createGame();
  s.draculaMarketUpdated=2;
  s.market.face=s.market.face.filter(id=>id!==wolf);
  s.market.draw=s.market.draw.filter(id=>id!==wolf);
  const n=parseSave(JSON.stringify(s));
  expect(n.market.face).toEqual(s.market.face);
  expect(n.market.draw.filter(id=>id===wolf)).toHaveLength(1);
  n.market.draw=n.market.draw.filter(id=>id!==wolf);
  n.market.denied.push(wolf);
  expect(parseSave(JSON.stringify(n)).market).toEqual(n.market);
 });
});
