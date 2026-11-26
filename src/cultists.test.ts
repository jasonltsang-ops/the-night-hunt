import {expect,it} from 'vitest';
import {cultists} from './data';
import {canPlaceEncounter,canSwapBetween,createGame,parseSave,reduce} from './engine';

it.each([
 ['day','night',[],2],
 ['night','day',[],1],
 ['day','day',['hm-2'],0],
 ['night','night',['hm-2'],1],
] as const)('places Cultists by %s and resolves them by %s with equipment %j',(placementPhase,phase,equipment,damage)=>{
 let s=createGame(undefined,0);
 s.phase=placementPhase;
 s.turn=placementPhase==='day'?4:0;
 s.players[4].hand=[cultists];
 const city=8;
 const location=s.locations[city];
 location.resolved.push(...location.deck);
 location.deck=[];
 location.closed=true;
 s=reduce(s,{type:'play',index:0});
 expect(canPlaceEncounter(s,city)).toBe(true);
 expect(canPlaceEncounter(s,9)).toBe(false);
 s=parseSave(JSON.stringify(s));
 s=reduce(s,{type:'placeEncounter',city});
 expect(s.locations[city].deck).toEqual([cultists]);
 expect(s.locations[city].closed).toBe(true);
 expect(canSwapBetween(s,7,city)).toBe(false);
 expect(canPlaceEncounter(s,city)).toBe(false);
 expect(s.players[4].discard).not.toContain(cultists);
 s=parseSave(JSON.stringify(s));
 s.phase=phase;
 s.turn=phase==='day'?0:1;
 s.played=false;
 s.players[0].city=city;
 s.players[0].equipment=[...equipment];
 s.players[0].hand=['investigate'];
 s=reduce(s,{type:'play',index:0});
 expect(s.players[0].damage).toBe(damage);
 expect(s.locations[city].deck).toEqual([]);
 expect(s.locations[city].closed).toBe(true);
 expect(s.locations[city].resolved.at(-1)).toBe(cultists);
});

it('adds one Cultists card to a pre-Cultists market on load',()=>{
 const s=createGame();
 s.draculaMarketUpdated=4;
 for(const zone of ['face','draw'] as const)s.market[zone]=s.market[zone].filter(id=>id!==cultists);
 const loaded=parseSave(JSON.stringify(s));
 expect(loaded.market.face).toEqual(s.market.face);
 expect(loaded.market.draw.filter(id=>id===cultists)).toHaveLength(1);
 expect(parseSave(JSON.stringify(loaded))).toEqual(loaded);
});
