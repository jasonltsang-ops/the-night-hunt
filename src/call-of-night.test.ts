import {expect,it} from 'vitest';
import {active,canPlayStandard,canPlaceEncounter,canUseMarket,cardPhase,createGame,parseSave,reduce} from './engine';

function setup(hand=['d-4','d-0']){
 const s=createGame(undefined,0);
 s.turn=4;
 s.players[4].hand=hand;
 return s;
}
it('grants exactly one Night-effect play during Day and resolves a distant encounter',()=>{
 let s=setup(['d-4','d-0','d-3']);
 s=reduce(s,{type:'play',index:0});
 expect(s.played).toBe(true);
 expect(s.nightPlay).toBe('choose');
 expect(s.phase).toBe('day');
 expect(active(s).id).toBe('dracula');
 expect(()=>reduce(s,{type:'advance'})).toThrow('bonus card');
 s=parseSave(JSON.stringify(s));
 s=reduce(s,{type:'play',index:0});
 expect(canPlaceEncounter(s,8)).toBe(true);
 expect(()=>reduce(s,{type:'play',index:0})).toThrow();
 s=parseSave(JSON.stringify(s));
 const n=reduce(s,{type:'placeEncounter',city:8});
 expect(n.locations[8].deck).toHaveLength(6);
 expect(n.nightPlay).toBeUndefined();
 expect(cardPhase(n)).toBe('day');
 expect(n.players[4].discard).toEqual(['d-4','d-0']);
 expect(()=>reduce(n,{type:'play',index:0})).toThrow();
 expect(parseSave(JSON.stringify(n))).toEqual(n);
});
it('allows Shadow Passage in the bonus play without triggering scheduled Night abilities',()=>{
 let s=setup(['d-4','d-2']);
 s=reduce(s,{type:'play',index:0});
 expect(canPlayStandard(s,s.players[4],'d-2')).toBe(true);
 s=reduce(s,{type:'play',index:0});
 const index=s.locations[0].deck.indexOf('dracula');
 s=reduce(s,{type:'swap',moveDracula:true,from:0,to:1,fromIndex:index,toIndex:0});
 expect(s.players[4].city).toBe(1);
 expect(s.phase).toBe('day');
 expect(s.turn).toBe(4);
 expect(s.nightPlay).toBeUndefined();
});
it('allows Dark Influence acquisition during the Day bonus, retaining it through reload',()=>{
 let s=setup(['d-4','d-3']);
 s.market.face=['dm-0','hm-0','hm-1','hm-2','hm-3'];
 s=reduce(s,{type:'play',index:0});
 s=reduce(s,{type:'play',index:0});
 s=parseSave(JSON.stringify(s));
 expect(canUseMarket(s,'dm-0','acquire')).toBe(true);
 s=reduce(s,{type:'market',index:0,mode:'acquire',player:'dracula'});
 expect(s.players[4].discard).toContain('dm-0');
 expect(s.nightPlay).toBeUndefined();
 expect(s.phase).toBe('day');
});
it.each([0,1,5])('Night play heals up to one HP with %i damage',damage=>{
 let s=setup(['d-4']);
 s.phase='night';
 s.turn=0;
 s.players[4].damage=damage;
 s=reduce(s,{type:'play',index:0});
 expect(s.players[4].damage).toBe(Math.max(0,damage-1));
 expect(s.nightPlay).toBeUndefined();
 expect(s.played).toBe(true);
});
it('finishes without a bonus when no eligible card remains',()=>{
 let s=setup(['d-4','dm-0']);
 s=reduce(s,{type:'play',index:0});
 expect(s.nightPlay).toBeUndefined();
 expect(()=>reduce(s,{type:'advance'})).not.toThrow();
});
it('a second Call uses its Night healing ability and grants no further play',()=>{
 let s=setup(['d-4','d-4','d-0']);
 s.players[4].damage=2;
 s=reduce(s,{type:'play',index:0});
 s=reduce(s,{type:'play',index:0});
 expect(s.players[4].damage).toBe(1);
 expect(s.nightPlay).toBeUndefined();
 expect(()=>reduce(s,{type:'play',index:0})).toThrow();
});
