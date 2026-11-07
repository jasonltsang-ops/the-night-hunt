import {describe,it,expect} from 'vitest';
import {createGame,reduce,parseSave,draculaLocation,darkness} from './engine';
import {hunterMarket,draculaMarket} from './data';
describe('Character Events',()=>{
 it('adds one copy of each Event to the shared market pool',()=>{const s=createGame();expect(hunterMarket).toContain('hm-texas');expect(draculaMarket).toContain('dm-hildesheim');expect([...s.market.face,...s.market.draw].filter(id=>id==='hm-texas')).toHaveLength(1);expect([...s.market.face,...s.market.draw].filter(id=>id==='dm-hildesheim')).toHaveLength(1);expect(s.market.face).toHaveLength(10);expect(s.market.draw).toHaveLength(30);});
 it.each(['day','night'] as const)('Texas heals and draws for conscious Hunters globally during %s, then leaves the game',phase=>{const s=createGame();s.phase=phase;s.turn=phase==='day'?0:1;s.players.forEach(p=>{p.hand=[];p.draw=['travel'];p.discard=[];});s.players[0].hand=['hm-texas'];s.players[0].damage=3;s.players[1].damage=1;s.players[2].damage=4;s.players[2].recovery='waiting';s.players[3].city=8;const n=reduce(s,{type:'play',index:0});expect(n.players[0].damage).toBe(1);expect(n.players[1].damage).toBe(0);expect(n.players[2].damage).toBe(4);expect(n.players[2].hand).toEqual([]);expect(n.players[3].hand).toEqual(['travel']);expect(n.players[0].hand).toEqual(['travel']);expect(n.players[0].discard).toEqual([]);expect(n.played).toBe(true);expect(parseSave(JSON.stringify(n))).toEqual(n);});
 it('Texas cannot draw itself from an exhausted personal deck',()=>{const s=createGame();s.players[0].hand=['hm-texas'];s.players[0].draw=[];s.players[0].discard=[];const n=reduce(s,{type:'play',index:0});expect(n.players[0].hand).toEqual([]);expect(n.players[0].discard).toEqual([]);});
 it.each(['day','night'] as const)('Hildesheim adds hazards to every open city without adding Darkness during %s',phase=>{const s=createGame(undefined,4);s.phase=phase;s.turn=phase==='day'?4:0;s.players[4].hand=['dm-hildesheim'];s.locations[0].resolved.push(...s.locations[0].deck);s.locations[0].deck=[];s.locations[0].closed=true;const n=reduce(s,{type:'play',index:0});expect(n.eventDarkness).toBe(0);expect(n.addedBasicEncounters).toBe(8);expect(n.locations[0].deck).toEqual([]);expect(n.locations[0].closed).toBe(true);for(let i=1;i<9;i++){expect([...n.locations[i].deck].sort()).toEqual([...s.locations[i].deck,'encounter'].sort());}expect(draculaLocation(n)).toBe(4);expect(n.players[4].discard).not.toContain('dm-hildesheim');expect(parseSave(JSON.stringify(n))).toEqual(n);});
 it('does not win through Hildesheim at 8 Darkness',()=>{const s=createGame();s.turn=4;s.eventDarkness=8;s.players[4].hand=['dm-hildesheim'];const n=reduce(s,{type:'play',index:0});expect(darkness(n).total).toBe(8);expect(n.winner).toBeNull();expect(n.players[4].discard).not.toContain('dm-hildesheim');expect(parseSave(JSON.stringify(n))).toEqual(n);});
 it('adds Events to existing reserves once, without resurrecting them after use',()=>{const s=createGame();const old=structuredClone(s) as Partial<typeof s>;delete old.eventCardsAdded;for(const zone of ['face','draw'] as const)old.market![zone]=old.market![zone].filter(id=>!['hm-texas','dm-hildesheim'].includes(id));const n=parseSave(JSON.stringify(old));expect(n.market.face).toEqual(old.market!.face);expect(n.market.draw).toContain('hm-texas');expect(n.market.draw).toContain('dm-hildesheim');n.market.draw=n.market.draw.filter(id=>id!=='hm-texas');const loaded=parseSave(JSON.stringify(n));expect(loaded.market.draw).not.toContain('hm-texas');expect(loaded.market.draw.filter(id=>id==='dm-hildesheim')).toHaveLength(1);});
});

it('removes retired Heavenly Host cards and cancels a pending choice when loading a save',()=>{
 const s=createGame(undefined,4);
 s.played=true;
 s.players[0].hand.push('hm-host-1');
 s.market.draw.push('hm-host-1');
 s.market.denied.push('hm-host-2');
 const city=s.locations[1];
 city.resolved=city.deck;
 city.deck=[];
 city.closed=true;
 const old={...s,heavenlyHostAdded:true,pendingConsecration:'hm-host-2',locations:s.locations.map((l,i)=>i===1?{...l,consecrated:true}:l)};
 const loaded=parseSave(JSON.stringify(old));
 expect(loaded.players[0].hand).not.toContain('hm-host-1');
 expect(loaded.market.draw).not.toContain('hm-host-1');
 expect(loaded.market.denied).not.toContain('hm-host-2');
 expect(loaded.locations[1]).toEqual(city);
 expect(loaded.played).toBe(false);
});
