import {expect,it} from 'vitest';
import {canPlayStandard,createGame,parseSave,reduce} from './engine';

function setup(phase:'day'|'night'='day',received='hm-18'){
 const s=createGame(undefined,8);
 s.phase=phase;
 s.turn=phase==='day'?2:3;
 s.players[2].hand=['signature-2-0','travel',received];
 s.players[1].city=7;
 s.players[1].hand=[received];
 return reduce(s,{type:'stack',city:0,card:'encounter'});
}

it.each(['day','night'] as const)('trades across the map and allows only the received copy by %s',phase=>{
 let s=reduce(setup(phase),{type:'play',index:0});
 expect(()=>reduce(s,{type:'advance'})).toThrow('Correspondence');
 s=reduce(parseSave(JSON.stringify(s)),{type:'correspondenceTrade',player:'h1',offerIndex:0,receiveIndex:0});
 expect(s.players[1].hand).toEqual(['travel']);
 expect(s.players[2].hand).toEqual(['hm-18','hm-18']);
 expect(s.players[2].discard).toContain('signature-2-0');
 expect(canPlayStandard(s,s.players[2],'hm-18',1)).toBe(false);
 expect(()=>reduce(s,{type:'play',index:1})).toThrow('exact received card');
 s=reduce(parseSave(JSON.stringify(s)),{type:'play',index:0});
 expect(s.players[2].hand).toEqual(['hm-18']);
 s=reduce(s,{type:'resolveInvestigation',index:0});
 expect(s.players[2].damage).toBe(1);
 expect(s.correspondence).toBeUndefined();
 expect(()=>reduce(s,{type:'play',index:0})).toThrow();
});

it('lets Helsing keep a combat-only received card and blocks Exhausted partners',()=>{
 const initial=setup('day','hm-21');
 initial.players[0].hand=['travel'];
 initial.players[0].damage=4;
 initial.players[0].recovery='waiting';
 let s=reduce(initial,{type:'play',index:0});
 expect(()=>reduce(s,{type:'correspondenceTrade',player:'h0',offerIndex:0,receiveIndex:0})).toThrow();
 s=reduce(s,{type:'correspondenceTrade',player:'h1',offerIndex:0,receiveIndex:0});
 expect(s.correspondence).toBeUndefined();
 expect(s.players[2].hand).toContain('hm-21');
 expect(()=>reduce(s,{type:'advance'})).not.toThrow();
});

it('allows ending the turn to keep an otherwise playable card',()=>{
 let s=reduce(setup(),{type:'play',index:0});
 s=reduce(s,{type:'correspondenceTrade',player:'h1',offerIndex:0,receiveIndex:0});
 expect(s.correspondence?.stage).toBe('play');
 s=reduce(s,{type:'advance'});
 expect(s.correspondence).toBeUndefined();
 expect(s.players[2].hand).toEqual(['hm-18','hm-18']);
});
