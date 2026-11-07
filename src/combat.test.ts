import {describe,it,expect} from 'vitest';
import {active,createGame,reduce,parseSave,hp,hurt,draculaLocation,type State} from './engine';
function discover(count=1){let s=createGame(undefined,0);s.players.slice(0,4).forEach((p,i)=>{p.city=i<count?0:8;p.hand=i===0?['investigate']:[];});s=reduce(s,{type:'stack',city:0,card:'dracula'});return reduce(s,{type:'play',index:0});}
function choose(s:State){for(const id of [...s.combat!.hunters,'dracula'])s=reduce(s,{type:'combatCard',player:id,index:s.players.find(p=>p.id===id)!.hand.findIndex(id=>id==='combat'||id==='dm-0'||id==='dm-1')});return reduce(s,{type:'resolveCombat'});}
describe('Combat, health, escape and recovery',()=>{
 it.each([1,2])('Coordinated Strike scales with Hunters at the city (%i)',count=>{
  let s=discover(count);
  s.players[0].hand=['hm-25'];
  s.players[4].hand=[];
  for(const player of [...s.combat!.hunters,'dracula'])s=reduce(s,{type:'combatCard',player,index:player==='h0'?0:-1});
  s=reduce(s,{type:'resolveCombat'});
  expect(s.log.at(-1)).toContain(`Hunters ${count===1?2:4}, Dracula 3`);
  expect(s.players[0].discard).toContain('hm-25');
 });

 it.each([0,8])('Planned Ambush deals exactly 2 damage and skips combat effects at %i prior damage',damage=>{
  let s=discover(2);
  s.players[0].hand=['hm-21'];
  s.players[0].equipment=['hm-4'];
  s.players[1].hand=['hm-reckless'];
  s.players[4].hand=['dm-1'];
  s.players[4].damage=damage;
  for(const player of [...s.combat!.hunters,'dracula'])s=reduce(s,{type:'combatCard',player,index:0});
  expect(()=>reduce(s,{type:'discardPistol',player:'h0'})).toThrow();
  s=reduce(parseSave(JSON.stringify(s)),{type:'resolveCombat'});
  expect(s.players[4].damage).toBe(damage+2);
  expect(s.players[1].damage).toBe(1);
  expect(s.players[0].equipment).toEqual(['hm-4']);
  expect(s.players[0].discard).toContain('hm-21');
  expect(s.players[1].discard).toContain('hm-reckless');
  expect(s.players[4].discard).toContain('dm-1');
  expect(s.combat).toBeNull();
  expect(s.winner).toBe(damage===8?'hunters':null);
  expect(parseSave(JSON.stringify(s))).toEqual(s);
 });

 it('keeps Pistol for +1 Strength or discards it for +2 total, including after reload',()=>{
  let s=discover();
  s.players[0].equipment=['hm-9'];
  expect(()=>reduce(s,{type:'discardPistol',player:'h0'})).toThrow();
  s=reduce(s,{type:'combatCard',player:'h0',index:-1});
  s=reduce(s,{type:'combatCard',player:'dracula',index:-1});
  const kept=reduce(s,{type:'resolveCombat'});
  expect(kept.combat?.hunterStrength).toBe(2);
  expect(kept.players[0].equipment).toContain('hm-9');
  const discarded=parseSave(JSON.stringify(reduce(s,{type:'discardPistol',player:'h0'})));
  expect(discarded.players[0].equipment).not.toContain('hm-9');
  expect(discarded.players[0].discard).toContain('hm-9');
  expect(()=>reduce(discarded,{type:'discardPistol',player:'h0'})).toThrow();
  const resolved=reduce(discarded,{type:'resolveCombat'});
  expect(resolved.log.at(-1)).toContain('Hunters 3, Dracula 3');
 });

 it('uses 4/10 HP and ties cause zero damage while favoring Dracula',()=>{let s=discover(2);s.players[0].hand=['combat'];s.players[4].hand=[];s=choose(s);expect(s.log.at(-1)).toContain('Dracula wins the tie');expect(s.combat).toBe(null);expect(s.players.every(p=>p.damage===0)).toBe(true);expect(hp(s,s.players[4])).toBe(10);expect(hp(s,s.players[0])).toBe(4);expect(parseSave(JSON.stringify(s))).toEqual(s);});
 it('requires every choice, includes equipment and one card, and kills Dracula at zero HP',()=>{let s=discover(4);expect(()=>reduce(s,{type:'resolveCombat'})).toThrow('Each participant');s.players.slice(0,4).forEach(p=>{p.equipment=['hm-4'];p.hand=['combat'];});s.players[4].hand=[];s=choose(s);expect(s.winner).toBe('hunters');expect(hp(s,s.players[4])).toBe(0);expect(s.players[0].discard).toContain('combat');expect(parseSave(JSON.stringify(s))).toEqual(s);});
 it('lets Dracula choose remainder damage and rejects uneven allocations',()=>{let s=discover(2);s.players[4].hand=[];s=choose(s);expect(s.combat?.damage).toBe(1);expect(()=>reduce(s,{type:'allocateDamage',extra:[]})).toThrow('evenly');expect(()=>reduce(s,{type:'allocateDamage',extra:['h0','h0']})).toThrow();s=reduce(s,{type:'allocateDamage',extra:['h1']});expect(s.players[0].damage).toBe(0);expect(s.players[1].damage).toBe(1);expect(parseSave(JSON.stringify(s))).toEqual(s);});
 it.each(['day','night'] as const)('knockout removes non-basic cards everywhere and skips exactly the next %s turn',phase=>{let s=createGame(undefined,8);s.phase=phase;s.turn=phase==='day'?0:1;const p=s.players[0];p.hand=['travel','hm-0'];p.draw=['supply','signature-0-0'];p.discard=['combat','hm-26'];p.equipment=['hm-3'];hurt(s,p,9);expect(p.recovery).toBe('waiting');expect(p.equipment).toEqual([]);expect([...p.hand,...p.draw,...p.discard].sort()).toEqual(['combat','supply','travel']);expect(()=>reduce(s,{type:'play',index:0})).toThrow('recovering');s=reduce(s,{type:'advance'});while(active(s).id!=='h0')s=reduce(s,{type:'advance',debug:true});expect(active(s).recovery).toBe('resting');expect(hp(s,active(s))).toBe(0);s=reduce(s,{type:'advance'});while(active(s).id!=='h0')s=reduce(s,{type:'advance',debug:true});expect(active(s).recovery).toBe('none');expect(hp(s,active(s))).toBe(4);expect(parseSave(JSON.stringify(s))).toEqual(s);});
 it('knocks out from an ordinary encounter too',()=>{let s=createGame(undefined,8);s.players[0].damage=3;s.players[0].hand=['investigate','hm-0'];s=reduce(s,{type:'play',index:0});expect(s.players[0].recovery).toBe('waiting');expect(s.players[0].hand).toEqual([]);});
 it.each([['dm-0',1,false],['dm-1',4,true]] as const)('resolves %s after losing combat and preserves identity count', (card,city,publicCity)=>{let s=discover(4);s.players.slice(0,4).forEach(p=>{p.equipment=['hm-4'];p.hand=[];});s.players[4].hand=[card];s=choose(s);expect(s.players[4].damage).toBe(9);expect(s.combat?.stage).toBe('escape');expect(parseSave(JSON.stringify(s))).toEqual(s);s=reduce(s,{type:'escape',city,index:0});expect(draculaLocation(s)).toBe(city);expect(s.log.at(-1)!.includes(['London','Paris','Prague','Madrid','Munich'][city])).toBe(publicCity);expect(s.locations.flatMap(l=>[...l.deck,...l.resolved]).filter(c=>c==='dracula')).toHaveLength(1);expect(parseSave(JSON.stringify(s))).toEqual(s);});
 it('allows escape after Dracula wins, or declining escape',()=>{let s=discover();s.players[4].hand=['dm-0'];s=choose(s);s=reduce(s,{type:'allocateDamage',extra:[]});expect(s.players[0].damage).toBe(2);expect(s.players[0].recovery).toBe('none');expect(s.combat?.stage).toBe('escape');expect(()=>reduce(s,{type:'escape',city:4})).toThrow('valid destination');s=reduce(s,{type:'escape',city:null});expect(s.combat).toBe(null);expect(draculaLocation(s)).toBe(0);});
 it('does not allow a dead Dracula to escape',()=>{let s=discover(4);s.players[4].damage=1;s.players.slice(0,4).forEach(p=>{p.equipment=['hm-4'];p.hand=[];});s.players[4].hand=['dm-0'];s=choose(s);expect(s.winner).toBe('hunters');expect(()=>reduce(s,{type:'escape',city:1})).toThrow('Game over');});
 it('uses Hunter base 1 and Dracula base 3, including previous default saves',()=>{const s=createGame();expect(s.config.hunterBase).toBe(1);expect(s.config.draculaBase).toBe(3);const old=structuredClone(s);old.config.draculaBase=5;expect(parseSave(JSON.stringify(old)).config.draculaBase).toBe(3);});
 it('migrates a version 3 save while retaining decks, turn and locations',()=>{const s=createGame();const old=structuredClone(s) as any;old.version=3;delete old.combat;delete old.config.hunterHP;delete old.config.draculaHP;old.players.forEach((p:any)=>{delete p.equipment;delete p.recovery;});const n=parseSave(JSON.stringify(old));expect(n.version).toBe(7);expect(n.locations).toEqual(s.locations);expect(n.players[0].hand).toEqual(s.players[0].hand);expect(n.turn).toBe(s.turn);});
});
