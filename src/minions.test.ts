import {describe,it,expect} from 'vitest';
import {active,alliesAt,canPlaceAlly,canPlaceEncounter,createGame,darkness,draculaLocation,hp,hurt,maxHP,parseSave,reduce,removableEquipment,wraithDestinations,wraithPeek,type State} from './engine';
function deploy(card:string,city=8,state=createGame(undefined,4)){
 let s=state;s.turn=4;s.phase='day';s.played=false;s.players[4].hand=[card];s=reduce(s,{type:'play',index:0});return reduce(s,{type:'placeAlly',city});
}
function hunterTurn(s:State,city=8){s.turn=0;s.phase='day';s.played=false;s.players[0].city=city;s.players[0].hand=[];return reduce(s,{type:'city',player:'h0',city});}
function empty(s:State,city:number,leave=0){const l=s.locations[city];l.resolved.push(...l.deck.splice(leave));}
function night(s:State){s.turn=4;s.phase='day';s.played=true;return reduce(s,{type:'advance'});}
function showdown(s:State,count:number,combatCard?:string){
 s.phase='day';s.turn=0;s.played=false;s.players.forEach(p=>p.hand=[]);
 s.players.slice(0,4).forEach((p,i)=>p.city=i<count?4:0);
 s.players[0].hand=combatCard?['investigate',combatCard]:['investigate'];s=reduce(s,{type:'stack',city:4,card:'dracula'});s=reduce(s,{type:'play',index:0});
 for(const id of [...s.combat!.hunters,'dracula'])s=reduce(s,{type:'combatCard',player:id,index:id==='h0'&&combatCard?0:-1});
 return reduce(s,{type:'resolveCombat'});
}
describe('minion powers and equipped counters',()=>{
 it.each([['dm-5','hm-3'],['dm-6','hm-2'],['dm-renfield','hm-salts']])('reveals %s beneath a Hunter and permits its matching equipped counter and rejects unrelated equipment', (ally,equipment)=>{
  let s=deploy(ally,0);expect(alliesAt(s,0)[0].revealed).toBe(true);s=hunterTurn(s,0);s.players[0].equipment=['hm-4'];expect(()=>reduce(s,{type:'sacrificeEquipment',index:0})).toThrow();
  s.players[0].equipment=[equipment];expect(removableEquipment(s)).toHaveLength(1);const original=structuredClone(s);s=reduce(s,{type:'sacrificeEquipment',index:0});
  expect(alliesAt(s,0)).toEqual([]);expect(darkness(s).allies).toBe(0);expect(s.played).toBe(true);expect(s.players[0].equipment).toEqual([]);expect(s.players[0].discard).not.toContain(equipment);expect(original.players[0].equipment).toEqual([equipment]);expect(parseSave(JSON.stringify(s))).toEqual(s);
 });
 it.each(['day','night'] as const)('requires an unused %s action, the same city and equipped gear',phase=>{
  let s=deploy('dm-5');s=hunterTurn(s,8);s.phase=phase;s.turn=phase==='day'?0:1;s.players[0].hand=['hm-3'];expect(()=>reduce(s,{type:'sacrificeEquipment',index:0})).toThrow();
  s.players[0].equipment=['hm-3'];s.players[0].city=0;expect(removableEquipment(s)).toEqual([]);s.players[0].city=8;s.played=true;expect(()=>reduce(s,{type:'sacrificeEquipment',index:0})).toThrow();s.played=false;s.players[0].recovery='waiting';expect(removableEquipment(s)).toEqual([]);s.players[0].recovery='none';s=reduce(s,{type:'sacrificeEquipment',index:0});expect(s.played).toBe(true);
 });
 it('reveals an Ally when a Hunter arrives, but never reveals Dracula’s encounter identity',()=>{
  let s=deploy('dm-4',1);expect(s.locations[1].ally!.revealed).toBe(false);s=hunterTurn(s,0);s.players[0].hand=['travel'];s=reduce(s,{type:'play',index:0});s=reduce(s,{type:'travel',city:1});expect(s.locations[1].ally!.revealed).toBe(true);expect(s.log.at(-1)).toContain('Vampire Bride');expect(draculaLocation(s)).toBe(4);
 });
 it('Smelling Salts grants a persistent fifth HP, caps instead of damaging on loss, and is lost on knockout',()=>{
  let s=createGame();s.players[0].damage=2;s.players[0].hand=['hm-salts'];s=reduce(s,{type:'play',index:0});expect(maxHP(s,s.players[0])).toBe(5);expect(hp(s,s.players[0])).toBe(3);
  s.played=false;s.players[0].equipment.push('hm-4');s.players[0].hand=['hm-9'];s=reduce(s,{type:'play',index:0,replaceIndex:0,replacedDestination:'trash'});expect(maxHP(s,s.players[0])).toBe(4);expect(hp(s,s.players[0])).toBe(3);
  s.players[0].equipment=['hm-salts'];s.players[0].damage=4;expect(hp(s,s.players[0])).toBe(1);hurt(s,s.players[0],1);expect(s.players[0].equipment).toEqual([]);expect(hp(s,s.players[0])).toBe(0);expect(s.players[0].damage).toBe(4);expect(parseSave(JSON.stringify(s))).toEqual(s);
 });
 it('immediate acquisition grants the Salts HP bonus, and replacement at full health caps to four',()=>{
  let s=createGame();s.players[0].hand=['supply'];s.market.face=['hm-salts'];s=reduce(s,{type:'play',index:0});s=reduce(s,{type:'market',index:0,player:'h0',mode:'acquire',destination:'equipment'});expect(hp(s,s.players[0])).toBe(5);
  s.played=false;s.players[0].equipment.push('hm-4');s.players[0].hand=['hm-9'];s=reduce(s,{type:'play',index:0,replaceIndex:0,replacedDestination:'discard'});expect(hp(s,s.players[0])).toBe(4);expect(s.players[0].discard).toContain('hm-salts');
 });
 it.each(['day','night'] as const)('Crucifix reduces both encounter types during %s and does not reduce combat damage', phase=>{
  for(const card of ['encounter','damaging'] as const){let s=createGame(undefined,4);s.phase=phase;s.turn=phase==='day'?0:1;s.players[0].equipment=['hm-2'];s.players[0].hand=['investigate'];if(card==='damaging')s.locations[0].deck.unshift('damaging');else s=reduce(s,{type:'stack',city:0,card:'encounter'});s=reduce(s,{type:'play',index:0});expect(s.players[0].damage).toBe(card==='damaging'?1:0);}
  let s=createGame(undefined,4);s.players[0].equipment=['hm-2'];s=showdown(s,1);s=reduce(s,{type:'allocateDamage',extra:[]});expect(s.players[0].damage).toBe(2);
 });
 it.each([1,3,4])('Stake adds 2 Strength and is trashed with %i Hunters',count=>{
  const s=showdown(createGame(undefined,4),count,'hm-0');
  expect(s.log.at(-1)).toContain(`Hunters ${count+2}, Dracula 3`);
  expect(s.players[4].damage).toBe(count-1);
  expect(s.players[0].hand).not.toContain('hm-0');
  expect(s.players[0].discard).not.toContain('hm-0');
  expect(parseSave(JSON.stringify(s))).toEqual(s);
 });
 it('can trash a Stake from hand to remove Vampire Bride but not another Ally',()=>{
  let s=hunterTurn(deploy('dm-4',0),0);
  s.locations[0].wraith={card:'dm-6',revealed:true};
  s.players[0].hand=['hm-0'];
  expect(()=>reduce(s,{type:'play',index:0,ally:'dm-6'})).toThrow();
  s=reduce(s,{type:'play',index:0,ally:'dm-4'});
  expect(alliesAt(s,0).map(a=>a.card)).toEqual(['dm-6']);
  expect(s.players[0].discard).not.toContain('hm-0');
 });
 it('Bride adds three total damage only at her city on a strict Dracula win; ties cause none',()=>{
  let s=deploy('dm-4',4);s=showdown(s,1);expect(s.combat?.draculaStrength).toBe(3);expect(s.combat?.damage).toBe(5);s=reduce(s,{type:'allocateDamage',extra:[]});expect(s.players[0].recovery).toBe('waiting');
  s=showdown(deploy('dm-4',4),3);expect(s.players.slice(0,4).every(p=>p.damage===0)).toBe(true);
  s=showdown(deploy('dm-4',8),1);expect(s.combat?.damage).toBe(2);
 });
 it('Great Wolf grants +2 strength only locally and Rifle grants only +1',()=>{
  let s=deploy('dm-5',4);s.players[0].equipment=['hm-3'];s=showdown(s,1);expect(s.combat?.hunterStrength).toBe(2);expect(s.combat?.draculaStrength).toBe(5);
 });
 it('Renfield grants two current and maximum HP only on deployment, then caps health on removal',()=>{
  let s=createGame(undefined,4);s.players[4].damage=5;s=deploy('dm-renfield',8,s);expect(maxHP(s,s.players[4])).toBe(12);expect(hp(s,s.players[4])).toBe(7);expect(parseSave(JSON.stringify(s))).toEqual(s);
  s=hunterTurn(s);s.players[0].equipment=['hm-salts'];s=reduce(s,{type:'sacrificeEquipment',index:0});expect(maxHP(s,s.players[4])).toBe(10);expect(hp(s,s.players[4])).toBe(7);
  s=deploy('dm-renfield');s=hunterTurn(s);s.players[0].equipment=['hm-salts'];s=reduce(s,{type:'sacrificeEquipment',index:0});expect(hp(s,s.players[4])).toBe(10);
 });
 it('Renfield adds exactly one basic encounter at his own city on Night entry, without healing or consuming the action',()=>{
  let s=deploy('dm-renfield',8);s.players[4].damage=3;s=night(s);expect(active(s).id).toBe('dracula');expect(s.locations[8].deck).toHaveLength(6);expect(s.locations[4].deck).toHaveLength(5);expect(s.addedBasicEncounters).toBe(1);expect(hp(s,s.players[4])).toBe(9);expect(s.played).toBe(false);s=parseSave(JSON.stringify(s));expect(s.locations[8].deck).toHaveLength(6);s.players[4].hand=[];s=reduce(s,{type:'advance'});expect(s.locations[8].deck).toHaveLength(6);
 });
});
describe('permanent closure and Wraith',()=>{
 it('closes immediately on the final encounter, removes both Allies and their Darkness, and cannot receive new cards',()=>{
  let s=deploy('dm-renfield',8);s=deploy('dm-6',8,s);s=hunterTurn(s);empty(s,8,1);s.players[0].equipment=['hm-2'];s.players[0].hand=['investigate'];s=reduce(s,{type:'play',index:0});expect(s.locations[8].closed).toBe(true);expect(alliesAt(s,8)).toEqual([]);expect(darkness(s).allies).toBe(0);expect(maxHP(s,s.players[4])).toBe(10);expect(canPlaceEncounter(s,8)).toBe(false);expect(canPlaceAlly(s,'dm-5',8)).toBe(false);expect(parseSave(JSON.stringify(s))).toEqual(s);
  s=night(s);expect(s.locations[8].deck).toEqual([]);expect(s.addedBasicEncounters).toBe(0);
 });
 it('defers closure when the final card is Dracula until the showdown resolves, preserving his identity',()=>{
  let s=createGame(undefined,4);s.locations[4].deck=s.locations[4].deck.filter(c=>{if(c!=='dracula')s.locations[4].resolved.push(c);return c==='dracula';});s.players[0].city=4;s.players[0].hand=['investigate'];s=reduce(s,{type:'play',index:0});expect(s.locations[4].closed).toBe(false);expect(parseSave(JSON.stringify(s))).toEqual(s);for(const id of [...s.combat!.hunters,'dracula'])s=reduce(s,{type:'combatCard',player:id,index:-1});s=reduce(s,{type:'resolveCombat'});s=reduce(s,{type:'allocateDamage',extra:[]});expect(s.locations[4].deck).toEqual(['dracula']);expect(s.locations[4].closed).toBe(false);expect(draculaLocation(s)).toBe(4);
 });
 it('Wraith shares with an Ally and moves only orthogonally to open cities before any normal Night action',()=>{
  let s=deploy('dm-5',4);s=deploy('dm-6',4,s);empty(s,1);s=night(s);expect(alliesAt(s,4)).toHaveLength(2);expect(wraithDestinations(s)).toEqual([3,5,7]);expect(()=>reduce(s,{type:'advance',debug:true})).toThrow('Wraith');expect(()=>reduce(s,{type:'play',index:0})).toThrow('Wraith');expect(()=>reduce(s,{type:'wraithMove',city:0})).toThrow();expect(()=>reduce(s,{type:'wraithMove',city:1})).toThrow();
  s=parseSave(JSON.stringify(s));s=reduce(s,{type:'wraithMove',city:3});expect(s.locations[4].ally!.card).toBe('dm-5');expect(s.locations[4].wraith).toBe(null);expect(s.pendingWraith?.stage).toBe('peek');expect(s.played).toBe(false);
 });
 it('Wraith privately inspects the destination bottom card and can put Dracula on top without moving him or revealing the choice',()=>{
  let s=deploy('dm-6',1);s=night(s);const pile=s.locations[4].deck;pile.splice(pile.indexOf('dracula'),1);pile.push('dracula');s=reduce(s,{type:'wraithMove',city:4});expect(wraithPeek(s,'h0')).toBe(null);expect(wraithPeek(s,'dracula')).toBe('dracula');expect(parseSave(JSON.stringify(s))).toEqual(s);s=reduce(s,{type:'wraithReturn',position:'top'});expect(s.locations[4].deck[0]).toBe('dracula');expect(draculaLocation(s)).toBe(4);expect(s.pendingWraith).toBe(null);expect(s.played).toBe(false);expect(s.log.slice(-2).join(' ')).not.toMatch(/top|bottom.*Dracula|London/);expect(parseSave(JSON.stringify(s))).toEqual(s);
 });
 it('Wraith may leave the bottom card untouched and skips its ability when isolated by closed cities',()=>{
  let s=deploy('dm-6',1);s=night(s);s=reduce(s,{type:'wraithMove',city:2});const deck=[...s.locations[2].deck];s=reduce(s,{type:'wraithReturn',position:'bottom'});expect(s.locations[2].deck).toEqual(deck);expect(parseSave(JSON.stringify(s))).toEqual(s);
  s=deploy('dm-6',0);empty(s,1);empty(s,3);s=night(s);expect(s.pendingWraith).toBe(null);expect(s.locations[0].wraith).not.toBe(null);
 });
 it('migrates v6 slots, empty locations, names and new reserve cards only once',()=>{
  const old:any=createGame();old.version=6;delete old.pendingWraith;old.locations.forEach((l:any)=>{delete l.closed;delete l.wraith;});old.locations[1].ally={card:'dm-6',revealed:false};empty(old,8);old.locations[8].ally={card:'dm-4',revealed:false};old.market.draw=old.market.draw.filter((id:string)=>!['hm-salts','dm-renfield'].includes(id));old.market.face=old.market.face.filter((id:string)=>!['hm-salts','dm-renfield'].includes(id));
  const s=parseSave(JSON.stringify(old));expect(s.locations[1].wraith!.card).toBe('dm-6');expect(s.locations[1].ally).toBe(null);expect(s.locations[8].closed).toBe(true);expect(s.locations[8].ally).toBe(null);expect([...s.market.face,...s.market.draw].filter(id=>id==='hm-salts')).toHaveLength(1);expect(parseSave(JSON.stringify(s))).toEqual(s);
 });
});

it('permits Dracula to pass when closed cities leave no legal Shadow Passage or Ally placement',()=>{
 let s=createGame(undefined,4);for(let city=0;city<9;city++)if(city!==4)empty(s,city);
 s.locations[4].ally={card:'dm-4',revealed:false};s.phase='night';s.turn=0;s.players[4].hand=['d-2','dm-5'];s=reduce(s,{type:'advance'});expect(active(s).id).toBe('h0');expect(parseSave(JSON.stringify(s))).toEqual(s);
});
