import {describe,it,expect} from 'vitest';
import {createGame,reduce,parseSave,alliesAt} from './engine';
import {cards} from './data';

describe('Holy Water',()=>{
 it.each([1,4])('plays from hand for +2 and trashes on resolution with %i Hunters',count=>{
  let s=createGame(undefined,0);
  s.players.forEach(p=>p.hand=[]);
  s.players.slice(0,4).forEach((p,i)=>p.city=i<count?0:8);
  s.players[0].hand=['investigate','hm-1'];
  s=reduce(s,{type:'stack',city:0,card:'dracula'});
  s=reduce(s,{type:'play',index:0});
  for(const player of [...s.combat!.hunters,'dracula']){
   s=reduce(s,{type:'combatCard',player,index:player==='h0'?0:-1});
  }
  expect(s.players[0].hand).toContain('hm-1');
  s=reduce(s,{type:'resolveCombat'});
  expect(s.log.join(' ')).toContain(`Hunters ${count+2}, Dracula 3`);
  expect(s.players[0].hand).not.toContain('hm-1');
  expect(s.players[0].discard).not.toContain('hm-1');
  expect(parseSave(JSON.stringify(s))).toEqual(s);
 });
 it.each(['dm-4','dm-5','dm-renfield','dm-6'])('can remove revealed %s at the Hunter city from hand',card=>{
  let s=createGame(undefined,8);
  s.players[0].hand=['hm-1'];
  if(card==='dm-6')s.locations[0].wraith={card,revealed:true};
  else s.locations[0].ally={card,revealed:true};
  s=reduce(s,{type:'play',index:0,ally:card});
  expect(alliesAt(s,0)).toEqual([]);
  expect(s.players[0].hand).toEqual([]);
  expect(s.players[0].discard).not.toContain('hm-1');
  expect(s.played).toBe(true);
 });
 it('requires a valid choice among revealed local allies',()=>{
  const s=createGame(undefined,8);
  s.players[0].hand=['hm-1'];
  s.locations[0].ally={card:'dm-5',revealed:true};
  s.locations[0].wraith={card:'dm-6',revealed:true};
  expect(()=>reduce(s,{type:'play',index:0})).toThrow('Choose one');
  const n=reduce(s,{type:'play',index:0,ally:'dm-6'});
  expect(alliesAt(n,0).map(a=>a.card)).toEqual(['dm-5']);
  s.locations[0].wraith!.revealed=false;
  expect(()=>reduce(s,{type:'play',index:0,ally:'dm-6'})).toThrow();
  expect(()=>reduce(s,{type:'play',index:0,ally:'dm-renfield'})).toThrow();
  expect(s.players[0].hand).toEqual(['hm-1']);
 });
 it('allows immediate use on acquisition and keeps existing saves playable',()=>{
  const old=createGame(undefined,8);
  old.players[0].equipment=['hm-1'];
  const loaded=parseSave(JSON.stringify(old));
  expect(loaded.players[0].equipment).toEqual([]);
  expect(loaded.players[0].discard).toContain('hm-1');
  expect(cards['hm-1'].item).toBe(true);

  let s=createGame(undefined,8);
  s.players[0].hand=['supply'];
  s.market.face=['hm-1'];
  s.locations[0].ally={card:'dm-4',revealed:true};
  s=reduce(s,{type:'play',index:0});
  const n=reduce(s,{type:'market',index:0,mode:'acquire',player:'h0',destination:'use',ally:'dm-4'});
  expect(alliesAt(n,0)).toEqual([]);
  expect(n.players[0].discard).not.toContain('hm-1');
  expect(n.pendingSupply).toBe(false);
 });
});
