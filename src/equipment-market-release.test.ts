import {describe,expect,it} from 'vitest';
import {cards,draculaMarket,hunterMarket,preparationCards} from './data';
import {canPlayStandard,createGame,draculaLocation,equipmentCombatUsers,hurt,nextCombatPlayer,parseSave,reduce,type State} from './engine';
import {applyOnlineAction,matchView,onlineTurn} from './multiplayer';

function turn(phase:State['phase'],id:string){
 const s=createGame(undefined,4);
 s.phase=phase;
 const dracula=cards[id].side==='dracula';
 s.turn=phase==='day'?(dracula?4:0):(dracula?0:1);
 s.players[dracula?4:0].hand=[id];
 return s;
}
const reload=(s:State)=>parseSave(JSON.stringify(s));
describe('Equipment and market release',()=>{
 it('adds exactly one copy of each card to the 48-card market',()=>{
  expect(hunterMarket).toHaveLength(32);expect(draculaMarket).toHaveLength(16);
  const s=createGame(),pool=[...s.market.face,...s.market.draw];
  expect(pool).toHaveLength(48);
  for(const id of preparationCards)expect(pool.filter(card=>card===id)).toHaveLength(1);
 });
 it.each([['hm-careful-preparation','day'],['hm-traveling-merchant','night']] as const)('%s trashes another card by %s only',(id,phase)=>{
  for(const target of ['travel','hm-0']){
   const s=turn(phase,id);s.players[0].hand.push(target);
   for(const trashIndex of [undefined,0,2,1.5])expect(()=>reduce(s,{type:'play',index:0,trashIndex})).toThrow('another card');
   const n=reduce(s,{type:'play',index:0,trashIndex:1});
   expect(n.players[0].hand).toEqual([]);expect(n.players[0].discard).toEqual([id]);expect(n.played).toBe(true);
  }
 });
 it.each([['hm-careful-preparation','night'],['hm-traveling-merchant','day']] as const)('%s acquires one Hunter card by %s',(id,phase)=>{
  const s=turn(phase,id);s.players[0].hand.push('travel');s.market.face=['dm-unholy','hm-0'];
  const n=reload(reduce(s,{type:'play',index:0,trashIndex:1}));
  expect(n.players[0].hand).toEqual(['travel']);expect(n.pendingFortune).toBe(1);
  expect(()=>reduce(n,{type:'market',index:0,mode:'acquire',player:'h0'})).toThrow();
  expect(()=>reduce(n,{type:'market',index:0,mode:'deny',player:'h0'})).toThrow();
  const bought=reduce(n,{type:'market',index:1,mode:'acquire',player:'h0',destination:'equipment'});
  expect(bought.players[0].equipment).toEqual(['hm-0']);expect(bought.players[0].discard).toEqual([id]);
  expect(bought.pendingFortune).toBe(0);
 });
 it.each(['day','night'] as const)('Unholy Strength heals up to one HP by %s',phase=>{
  for(const damage of [0,3]){
   const s=turn(phase,'dm-unholy');s.players[4].damage=damage;
   const n=reduce(s,{type:'play',index:0});
   expect(n.players[4].damage).toBe(Math.max(0,damage-1));expect(n.players[4].discard).toEqual(['dm-unholy']);expect(n.played).toBe(true);
  }
 });
 it('Mesmerize acquires only a Dracula card by Day',()=>{
  const s=turn('day','dm-mesmerize');s.market.face=['hm-0','dm-pride'];
  expect(()=>reduce(s,{type:'play',index:0,marketIndex:0})).toThrow('Dracula market');
  const n=reduce(s,{type:'play',index:0,marketIndex:1});expect(n.players[4].discard).toEqual(['dm-mesmerize','dm-pride']);
  const night=turn('night','dm-mesmerize');expect(canPlayStandard(night,night.players[4],'dm-mesmerize')).toBe(false);
  expect(()=>reduce(night,{type:'play',index:0})).toThrow();
 });
 it.each(['fog','encounter'] as const)('Pride places %s at its origin or connected open location by Night without exposing identity or choices',encounter=>{
  const s=turn('night','dm-pride');s.locations[1].closed=true;s.locations[1].resolved.push(...s.locations[1].deck.splice(0));
  for(const city of [0,1,8,9,undefined])expect(()=>reduce(s,{type:'play',index:0,city,encounter})).toThrow();
  for(const city of [4,5]){
   const n=applyOnlineAction(s,'dracula',{type:'play',index:0,city,encounter});
   expect(n.locations[city].deck).toHaveLength(s.locations[city].deck.length+1);
   expect(draculaLocation(n)).toBe(4);expect(n.players[4].damage).toBe(s.players[4].damage);expect(n.players[4].discard).toEqual(['dm-pride']);
   expect(reload(n)).toEqual(n);
   const publicState=matchView(n,'hunter',2).state;
   expect(publicState.players[4].city).toBe(-1);
   expect(publicState.locations[city].deck).not.toContain('dracula');
   expect(publicState.latestResolution?.entries.join(' ')).not.toMatch(/Munich|Vienna|Fog|Brush/);
  }
  expect(()=>reduce(turn('day','dm-pride'),{type:'play',index:0,city:4,encounter})).toThrow();
 });
 it.each(['hm-0','hm-1','hm-9'])('Unholy Strength disarms %s before online Hunter Equipment reactions',target=>{
  let s=createGame(undefined,0);
  s.players.forEach((p,i)=>{p.hand=[];p.city=i<3?0:8;});
  s.players[4].city=0;s.players[4].hand=['dm-unholy'];
  s.players[0].equipment=[target];s.players[1].equipment=['hm-1'];s.players[2].equipment=['hm-9'];
  s=reduce(reduce(s,{type:'stack',city:0,card:'dracula'}),{type:'investigate',player:'h0',debug:true});
  while(nextCombatPlayer(s)){
   const p=nextCombatPlayer(s)!;
   s=applyOnlineAction(s,p.side,{type:'combatCard',player:p.id,index:p.side==='dracula'?0:-1});
  }
  expect(onlineTurn(s).actingSide).toBe('dracula');
  expect(equipmentCombatUsers(s)).toEqual([]);
  expect(()=>reduce(s,{type:target==='hm-9'?'discardPistol':'trashCombatEquipment',player:'h0'})).toThrow('Unholy Strength');
  s=reload(applyOnlineAction(s,'dracula',{type:'resolveCombat',target:{player:'h0',equipmentIndex:0}}));
  expect(s.players[0].discard).toEqual([target]);expect(onlineTurn(s).reactionWindow).toBe(true);
  expect(()=>applyOnlineAction(s,'hunter',{type:'trashCombatEquipment',player:'h0'})).toThrow();
  s=applyOnlineAction(s,'hunter',{type:'trashCombatEquipment',player:'h1'});
  s=applyOnlineAction(s,'hunter',{type:'discardPistol',player:'h2'});
  s=applyOnlineAction(s,'dracula',{type:'resolveCombat'});
  expect(s.log.at(-1)).toContain('Hunters 7, Dracula 3');
 });
 it('migrates a v8 save once, keeps Equipment and leaves earlier release state intact',()=>{
  const s=createGame(undefined,4);
  const old={...s,version:8,maturation:5,facilitiesUsed:[7]};
  old.players[0].equipment=['hm-0'];old.players[0].discard=['hm-1'];
  for(const zone of ['face','draw'] as const)old.market[zone]=old.market[zone].filter(id=>!preparationCards.includes(id));
  const n=parseSave(JSON.stringify(old));
  expect(n.version).toBe(10);expect(n.maturation).toBe(5);expect(n.facilitiesUsed).toEqual([7]);
  expect(n.players[0].equipment).toEqual(['hm-0']);expect(n.players[0].discard).toEqual(['hm-1']);
  expect([...n.market.face,...n.market.draw]).toHaveLength(48);expect(reload(n)).toEqual(n);
  hurt(n,n.players[0],4);
  expect(n.players[0].equipment).toEqual([]);expect(n.players[0].discard).toEqual([]);
 });
});
