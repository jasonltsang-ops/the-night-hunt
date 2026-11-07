import {describe,it,expect} from 'vitest';
import {createGame,reduce,parseSave,draculaLocation,visibleDraculaLocation} from './engine';

describe('Encounters and Shadow Passage',()=>{
 it('sets up each city’s encounter mix and replaces one Brush with Dracula',()=>{
  for(let city=0;city<9;city++){
   const s=createGame(undefined,city);
   expect(s.locations.map(l=>l.deck.length)).toEqual([5,5,5,5,5,5,5,5,5]);
   expect(s.locations.every(l=>l.resolved.length===0)).toBe(true);
   s.locations.forEach((location,i)=>{
    expect(location.deck.filter(c=>c==='fog')).toHaveLength([0,2,4,6,8].includes(i)?1:0);
    expect(location.deck.filter(c=>c==='damaging')).toHaveLength([1,3,4,5,7].includes(i)?1:0);
    expect(location.deck.filter(c=>c==='encounter')).toHaveLength((i===4?3:4)-(city===i?1:0));
   });
   expect(parseSave(JSON.stringify(s))).toEqual(s);
   expect(s.locations.flatMap(l=>l.deck).filter(c=>c==='encounter')).toHaveLength(34);
   expect(s.locations.flatMap(l=>l.deck).filter(c=>c==='dracula')).toHaveLength(1);
   expect(draculaLocation(s)).toBe(city);
  }
 });
 it.each([['day',1],['night',1]] as const)('investigates the actual Hunter location during %s, dealing %i damage', (phase,damage)=>{
  let s=createGame(undefined,8);s.phase=phase;s.turn=phase==='day'?0:1;s.players[0].city=1;s.players[0].hand=['investigate'];
  s=reduce(s,{type:'stack',city:1,card:'encounter'});const before=structuredClone(s);s=reduce(s,{type:'play',index:0});
  expect(s.players[0].damage).toBe(damage);expect(s.locations[1].deck).toHaveLength(4);expect(s.locations[1].resolved).toEqual(['encounter']);expect(s.locations[0].deck).toHaveLength(5);expect(s.players[0].discard).toContain('investigate');expect(before.players[0].damage).toBe(0);expect(s.winner).toBe(null);
  expect(parseSave(JSON.stringify(s))).toEqual(s);
 });
 it('discovers Dracula and pauses normal play for combat',()=>{
  let s=createGame(undefined,0);s=reduce(s,{type:'stack',city:0,card:'dracula'});s.players[0].hand=['investigate'];s=reduce(s,{type:'play',index:0});
  expect(s.winner).toBe(null);expect(s.players[0].damage).toBe(0);expect(s.combat?.stage).toBe('cards');expect(()=>reduce(s,{type:'advance'})).toThrow('Resolve combat');expect(parseSave(JSON.stringify(s)).combat).toEqual(s.combat);
 });
 it('resolves an empty deck without damage or extra cards',()=>{
  let s=createGame(undefined,8);s.config.hunterHP=10;for(let i=0;i<6;i++)s=reduce(s,{type:'investigate',player:'h0',debug:true});
  expect(s.players[0].damage).toBe(4);expect(s.locations[0].deck).toEqual([]);expect(s.log.at(-1)).toContain('deck is empty');
 });
 it('swaps Dracula with an adjacent encounter and announces only the city pair',()=>{
  let s=createGame(undefined,0);s.phase='night';s.turn=0;s.players[4].hand=['d-2'];s=reduce(s,{type:'play',index:0});expect(s.pendingSwap).toBe(true);expect(s.players[4].discard).toContain('d-2');expect(()=>reduce(s,{type:'advance'})).toThrow('Resolve Shadow Passage');
  const index=s.locations[0].deck.indexOf('dracula');const n=reduce(s,{type:'swap',moveDracula:true,from:0,to:1,fromIndex:index,toIndex:0});
  expect(draculaLocation(n)).toBe(1);expect(n.players[4].city).toBe(1);expect(draculaLocation(s)).toBe(0);expect(n.pendingSwap).toBe(false);expect(n.locations.map(l=>l.deck.length)).toEqual([5,5,5,5,5,5,5,5,5]);expect(n.log.at(-1)).toBe('Shadow Passage: cards swapped between London and Paris; both decks shuffled.');expect(parseSave(JSON.stringify(n))).toEqual(n);
  expect(()=>reduce(n,{type:'swap',moveDracula:false,from:0,to:1,fromIndex:0,toIndex:0})).toThrow();
 });
 it('supports bluff swaps, validates adjacency and selected cards, and rejects empty decks',()=>{
  let s=createGame(undefined,8);s.phase='night';s.turn=0;s.players[4].hand=['d-2'];s=reduce(s,{type:'play',index:0});
  expect(()=>reduce(s,{type:'swap',moveDracula:false,from:0,to:4,fromIndex:0,toIndex:0})).toThrow('adjacent');
  expect(draculaLocation(reduce(s,{type:'swap',moveDracula:false,from:2,to:5,fromIndex:0,toIndex:0}))).toBe(8);
  expect(()=>reduce(s,{type:'swap',moveDracula:false,from:0,to:1,fromIndex:5,toIndex:0})).toThrow('available');
  const n=reduce(s,{type:'swap',moveDracula:false,from:0,to:1,fromIndex:0,toIndex:0});expect(draculaLocation(n)).toBe(8);
  s.locations[0].resolved.push(...s.locations[0].deck);s.locations[0].deck=[];expect(()=>reduce(s,{type:'swap',moveDracula:false,from:0,to:1,fromIndex:0,toIndex:0})).toThrow('available');
 });
 it('keeps the Night swap action unavailable by Day',()=>{
  let s=createGame();s.turn=4;s.players[4].hand=['d-2'];expect(reduce(s,{type:'play',index:0}).pendingVision?.shadow).toBe(true);s.phase='night';s.turn=0;s=reduce(s,{type:'play',index:0});expect(s.pendingSwap).toBe(true);s.phase='day';s.turn=4;expect(()=>reduce(s,{type:'swap',moveDracula:false,from:0,to:1,fromIndex:0,toIndex:0})).toThrow();
 });
 it.each(['day','night'] as const)('shows Dracula his actual location during his %s turn, hiding it from Hunters',phase=>{
  let s=createGame(undefined,4);s.phase=phase;s.turn=phase==='day'?4:0;expect(visibleDraculaLocation(s,'dracula')).toBe(4);for(const hunter of s.players.slice(0,4))expect(visibleDraculaLocation(s,hunter.id)).toBe(null);expect(visibleDraculaLocation(s,'h0',true)).toBe(4);
  s.phase='night';s.turn=0;s.players[4].hand=['d-2'];s=reduce(s,{type:'play',index:0});s=reduce(s,{type:'swap',moveDracula:true,from:4,to:5,fromIndex:s.locations[4].deck.indexOf('dracula'),toIndex:0});expect(visibleDraculaLocation(s,'dracula')).toBe(5);expect(visibleDraculaLocation(s,'h0')).toBe(null);s=reduce(s,{type:'advance'});expect(visibleDraculaLocation(s,'dracula')).toBe(null);
 });
 it('preserves the original city decks when loading an ongoing game',()=>{
  const s=createGame(undefined,4);
  delete s.mixedStartingEncounters;
  s.locations.forEach((location,i)=>{
   location.deck=['encounter','encounter','encounter','encounter',i===4?'dracula':'encounter'];
  });
  expect(parseSave(JSON.stringify(s))).toEqual(s);
 });
 it('preserves an ongoing game with four starting cards in Munich',()=>{
  const s=createGame(undefined,4);
  s.mixedStartingEncounters=true;
  const deck=s.locations[4].deck;
  deck.splice(deck.indexOf('encounter'),1);
  expect(parseSave(JSON.stringify(s))).toEqual(s);
 });
 it('migrates old saves and rejects malformed encounter saves',()=>{
  const s=createGame(undefined,4);const old={...s,version:2};const migrated=parseSave(JSON.stringify(old));expect(migrated.version).toBe(7);expect(migrated.players[0].city).toBe(s.players[0].city);expect(migrated.locations.map(l=>l.deck.length)).toEqual([5,5,5,5,5,5,5,5,5]);
  s.locations[0].deck.push('dracula');expect(()=>parseSave(JSON.stringify(s))).toThrow();
 });
});
