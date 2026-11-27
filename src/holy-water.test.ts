import {describe,it,expect} from 'vitest';
import {alliesAt,combatCardAllowed,createGame,nextCombatPlayer,parseSave,reduce} from './engine';
import {cards} from './data';

describe('Equipped Stake and Holy Water',()=>{
 it.each([['hm-0',1],['hm-0',3],['hm-0',4],['hm-1',1],['hm-1',4]] as const)('%s adds 2 Strength without consuming the combat selection with %i Hunters',(card,count)=>{
  let s=createGame(undefined,0);
  s.players.forEach((p,i)=>{p.hand=[];if(i<4)p.city=i<count?0:8;});
  s.players[0].equipment=[card];s.players[0].hand=['combat',card];
  s=reduce(s,{type:'stack',city:0,card:'dracula'});
  s=reduce(s,{type:'investigate',player:'h0',debug:true});
  expect(combatCardAllowed(card)).toBe(false);
  expect(()=>reduce(s,{type:'combatCard',player:'h0',index:1})).toThrow();
  while(nextCombatPlayer(s)){
   const p=nextCombatPlayer(s)!;
   s=reduce(s,{type:'combatCard',player:p.id,index:p.id==='h0'?0:-1});
  }
  s=reduce(s,{type:'trashCombatEquipment',player:'h0'});
  s=parseSave(JSON.stringify(s));
  s=reduce(s,{type:'resolveCombat'});
  expect(s.log.at(-1)).toContain(`Hunters ${count+3}, Dracula 2`);
  expect(s.players[0].hand).toEqual([card]);
  expect(s.players[0].discard).toEqual(['combat']);
  expect(s.players[0].equipment).toEqual([]);
 });
 it.each(['dm-4','dm-5','dm-renfield','dm-6'])('removes %s with equipped Holy Water',card=>{
  let s=createGame(undefined,8);
  s.players[0].equipment=['hm-1'];
  if(card==='dm-6')s.locations[0].wraith={card};
  else s.locations[0].ally={card};
  s=reduce(s,{type:'sacrificeEquipment',index:0,ally:card});
  expect(alliesAt(s,0)).toEqual([]);
  expect(s.players[0].equipment).toEqual([]);
  expect(s.players[0].discard).not.toContain('hm-1');
  expect(s.played).toBe(true);
 });
 it('requires a valid local Ally target',()=>{
  const s=createGame(undefined,8);
  s.players[0].equipment=['hm-1'];
  s.locations[0].ally={card:'dm-5'};s.locations[0].wraith={card:'dm-6'};
  expect(()=>reduce(s,{type:'sacrificeEquipment',index:0})).toThrow('Choose one');
  expect(()=>reduce(s,{type:'sacrificeEquipment',index:0,ally:'dm-renfield'})).toThrow();
  expect(alliesAt(reduce(s,{type:'sacrificeEquipment',index:0,ally:'dm-6'}),0).map(a=>a.card)).toEqual(['dm-5']);
 });
 it('can equip on acquisition but cannot immediately sacrifice or use as an Item',()=>{
  let s=createGame(undefined,8);
  s.players[0].hand=['supply'];s.market.face=['hm-1'];
  s.locations[0].ally={card:'dm-4'};
  s=reduce(s,{type:'play',index:0});
  expect(()=>reduce(s,{type:'market',index:0,mode:'acquire',player:'h0',destination:'use',ally:'dm-4'})).toThrow();
  const n=reduce(s,{type:'market',index:0,mode:'acquire',player:'h0',destination:'equipment'});
  expect(cards['hm-1'].equipment).toBe(true);
  expect(parseSave(JSON.stringify(n)).players[0].equipment).toEqual(['hm-1']);
  expect(()=>reduce(n,{type:'sacrificeEquipment',index:0})).toThrow();
 });
});
