import {expect,it} from 'vitest';
import {createGame,parseSave,reduce} from './engine';

it.each(['day','night'] as const)('forces one discard and handles the Fog token by %s',phase=>{
 let s=createGame(undefined,8);
 s.phase=phase;
 s.turn=phase==='day'?4:0;
 s.players[4].hand=['d-fog'];
 s=reduce(s,{type:'play',index:0});
 if(phase==='day')expect(()=>reduce(s,{type:'placeEncounter',city:0})).toThrow();
 const city=phase==='day'?5:0;
 s=reduce(parseSave(JSON.stringify(s)),{type:'placeEncounter',city});
 expect(s.players[4].discard).toContain('d-fog');
 expect(s.locations[city].deck).toContain('fog');
 s=reduce(s,{type:'stack',city,card:'fog'});
 s.turn=phase==='day'?0:1;
 s.played=false;
 const hunter=s.players[0];
 hunter.city=city;
 hunter.hand=['investigate','travel'];
 s=reduce(s,{type:'play',index:0});
 expect(s.players[0].hand).toEqual([]);
 expect(s.players[0].discard).toEqual(['investigate','travel']);
 expect(s.players[0].damage).toBe(0);
 expect(s.locations[city].deck.includes('fog')).toBe(phase==='night');
 expect(s.locations[city].resolved.includes('fog')).toBe(phase==='day');
 expect(parseSave(JSON.stringify(s))).toEqual(s);
});
