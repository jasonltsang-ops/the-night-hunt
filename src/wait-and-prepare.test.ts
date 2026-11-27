import {expect,it} from 'vitest';
import {createGame,reduce} from './engine';

it.each(['day','night'] as const)('Ready the Carriage only moves by %s',phase=>{
 const s=createGame(undefined,8);
 s.phase=phase;s.turn=phase==='day'?0:1;
 s.players[0].hand=['travel'];
 expect(()=>reduce(s,{type:'play',index:0,choice:'prepare'})).toThrow('only moves');
 const played=reduce(s,{type:'play',index:0});
 expect(played.players[0].hand).toEqual([]);
 const moved=reduce(played,{type:'travel',city:1});
 expect(moved.players[0].city).toBe(1);
 expect(moved.locations[1].deck).toHaveLength(phase==='night'?5:4);
});
