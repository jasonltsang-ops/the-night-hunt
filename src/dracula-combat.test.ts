import {expect,it} from 'vitest';
import {draculaMarket,newDraculaCombatCards} from './data';
import {createGame,draculaCombatTargets,nextCombatPlayer,parseSave,reduce,type State} from './engine';

function showdown(card:string,hunterCard?:string,count=1){
 let s=createGame(undefined,0);
 s.players.forEach((p,i)=>{p.hand=[];if(i<4)p.city=i<count?0:8;});
 s.players[0].hand=hunterCard?[hunterCard]:[];
 s.players[4].hand=[card];
 s=reduce(s,{type:'stack',city:0,card:'dracula'});
 return reduce(s,{type:'investigate',player:'h0',debug:true});
}
function choose(s:State){
 while(nextCombatPlayer(s)){
  const p=nextCombatPlayer(s)!;
  s=reduce(s,{type:'combatCard',player:p.id,index:p.hand.length?0:-1});
 }
 return s;
}

it('Unholy Strength discards a Hunter’s item before computing strengths',()=>{
 let s=showdown('dm-unholy');
 s.players[0].equipment=['hm-4'];
 s=choose(s);
 expect(draculaCombatTargets(s)).toEqual([{player:'h0',equipmentIndex:0}]);
 expect(()=>reduce(s,{type:'resolveCombat'})).toThrow('Choose a valid');
 const n=reduce(s,{type:'resolveCombat',target:{player:'h0',equipmentIndex:0}});
 expect(n.players[0].equipment).toEqual([]);
 expect(n.players[0].discard).toContain('hm-4');
 expect(n.players[4].discard).toContain('dm-unholy');
 expect(n.combat?.hunterStrength).toBe(1);
 expect(n.combat?.draculaStrength).toBe(4);
});
it('Unholy Strength grants +1 without equipment to target',()=>{
 const n=reduce(choose(showdown('dm-unholy')),{type:'resolveCombat'});
 expect(n.combat?.draculaStrength).toBe(4);
});
it('Mesmerize zeroes base, equipment, combat card, and Pistol boost for one Hunter',()=>{
 let s=showdown('dm-mesmerize','hm-26',2);
 s.players[0].equipment=['hm-9'];
 s=choose(s);
 s=reduce(s,{type:'discardPistol',player:'h0'});
 s=parseSave(JSON.stringify(s));
 expect(()=>reduce(s,{type:'resolveCombat',target:{player:'h2'}})).toThrow();
 const n=reduce(s,{type:'resolveCombat',target:{player:'h0'}});
 expect(n.combat?.hunterStrength).toBe(1);
 expect(n.combat?.draculaStrength).toBe(3);
 expect(n.players[0].discard).toEqual(['hm-9','hm-26']);
 expect(n.players[4].discard).toContain('dm-mesmerize');
});
it('Planned Ambush cancels a targeted card without requiring a target',()=>{
 const n=reduce(choose(showdown('dm-mesmerize','hm-21')),{type:'resolveCombat'});
 expect(n.combat).toBeNull();
 expect(n.players[4].damage).toBe(2);
 expect(n.players[4].discard).toContain('dm-mesmerize');
});
it('Pride immediately costs 2 HP, adds 4 Str, and can defeat Dracula',()=>{
 const s=choose(showdown('dm-pride'));
 expect(s.players[4].damage).toBe(2);
 const n=reduce(parseSave(JSON.stringify(s)),{type:'resolveCombat'});
 expect(n.combat?.draculaStrength).toBe(7);
 expect(n.players[4].damage).toBe(2);
 expect(n.players[4].discard).toContain('dm-pride');
 const wounded=showdown('dm-pride');
 wounded.players[4].damage=8;
 const defeated=choose(wounded);
 expect(defeated.winner).toBe('hunters');
 expect(defeated.combat).toBeNull();
 expect(defeated.players[4].discard).toContain('dm-pride');
 expect(parseSave(JSON.stringify(defeated))).toEqual(defeated);
});
it('updates old Dracula markets once and retires the four placeholders',()=>{
 const s=createGame();
 delete s.draculaMarketUpdated;
 for(const zone of ['face','draw'] as const)s.market[zone]=s.market[zone].filter(id=>!newDraculaCombatCards.includes(id));
 s.market.draw.push('dm-3','dm-7');
 s.players[4].hand=['dm-8','dm-9','d-0'];
 const n=parseSave(JSON.stringify(s));
 expect(n.players[4].hand).toEqual(['d-0']);
 expect(n.market.draw).not.toContain('dm-3');
 expect(n.market.draw).not.toContain('dm-7');
 for(const id of newDraculaCombatCards)expect(n.market.draw).toContain(id);
 expect(draculaMarket).toHaveLength(10);
 expect(parseSave(JSON.stringify(n))).toEqual(n);
});

it('retires the extra Bats card without restoring previously acquired combat cards',()=>{
 const s=createGame();
 s.draculaMarketUpdated=true;
 for(const zone of ['face','draw'] as const)s.market[zone]=s.market[zone].filter(id=>id!=='dm-pride');
 s.players[4].discard.push('dm-2','dm-1');
 const n=parseSave(JSON.stringify(s));
 expect(n.players[4].discard).toEqual(['dm-1']);
 expect([...n.market.face,...n.market.draw]).not.toContain('dm-pride');
 expect(parseSave(JSON.stringify(n))).toEqual(n);
});

it.each([['day','dm-1','Bats'],['night','dm-0','Mist']] as const)('allows the %s alternate use of %s',(phase,card,name)=>{
 const s=createGame(undefined,0);
 s.phase=phase;
 s.turn=phase==='day'?4:0;
 s.players[4].hand=[card];
 const wrongPhase=structuredClone(s);
 wrongPhase.phase=phase==='day'?'night':'day';
 wrongPhase.turn=phase==='day'?0:4;
 expect(()=>reduce(wrongPhase,{type:'play',index:0})).toThrow();
 const pending=parseSave(JSON.stringify(reduce(s,{type:'play',index:0})));
 const fromIndex=pending.locations[0].deck.indexOf('dracula');
 const move={type:'swap',moveDracula:true,from:0,to:1,fromIndex,toIndex:0} as const;
 expect(()=>reduce(pending,{...move,to:2})).toThrow();
 expect(()=>reduce(pending,{...move,moveDracula:false})).toThrow();
 const n=reduce(pending,move);
 expect(n.players[4].city).toBe(1);
 expect(n.players[4].discard).toContain(card);
 expect(n.log.at(-1)).toBe(name==='Mist'?'Dracula moved as Mist. Destination hidden.':'Dracula moved as Bats. Destination hidden.');
 expect(parseSave(JSON.stringify(n))).toEqual(n);
});
