import {expect,it} from 'vitest';
import {canPlayStandard,createGame,dispatchDestinations,parseSave,reduce,visionPeek} from './engine';

it('moves another Hunter exactly one connection closer without adding a Night encounter',()=>{
 const s=createGame([4,0,1,2],8);
 s.phase='night';
 s.turn=1;
 s.players[0].hand=['signature-4-1'];
 s.players[1].city=4;
 const pending=parseSave(JSON.stringify(reduce(s,{type:'play',index:0})));
 expect(dispatchDestinations(pending,pending.players[1])).toEqual([1,3]);
 for(const city of [0,4,5,7])expect(()=>reduce(pending,{type:'urgentDispatch',player:pending.players[1].id,city})).toThrow();
 const next=reduce(pending,{type:'urgentDispatch',player:pending.players[1].id,city:3});
 expect(next.players[1].city).toBe(3);
 expect(next.locations).toEqual(s.locations);
 expect(next.pendingDispatch).toBeNull();
 expect(next.players[0].discard).toContain('signature-4-1');
});

it('requires a conscious Hunter in a different city',()=>{
 const s=createGame([4,0,1,2],8);
 const mina=s.players[0];
 mina.hand=['signature-4-1'];
 s.players[1].city=1;
 s.players[1].recovery='resting';
 expect(canPlayStandard(s,mina,mina.hand[0])).toBe(false);
 expect(()=>reduce(s,{type:'play',index:0})).toThrow('Rally the Hunters');
});

it('finishes a Shared Vision already in progress in an older save',()=>{
 const s=createGame([4,0,1,2],8);
 const mina=s.players[0];
 s.played=true;
 s.pendingVision={player:mina.id,city:1};
 const restored=parseSave(JSON.stringify(s));
 expect(visionPeek(restored,mina.id)).toBe(s.locations[1].deck[0]);
 expect(reduce(restored,{type:'visionReturn',position:'top'}).pendingVision).toBeNull();
});
