import {expect,it} from 'vitest';
import {bodyguards} from './data';
import {createGame,draculaLocation,parseSave,reduce} from './engine';

it.each(['day','night'] as const)('moves and resolves Szgany Bodyguards during %s',phase=>{
 let s=createGame(undefined,0);
 s.phase=phase;
 s.turn=phase==='day'?4:0;
 for(const zone of ['face','draw'] as const)s.market[zone]=s.market[zone].filter(id=>id!==bodyguards);
 s.players[4].hand=[bodyguards];
 s=reduce(s,{type:'play',index:0});
 s=parseSave(JSON.stringify(s));
 const move={type:'swap',moveDracula:true,from:0,to:1,fromIndex:s.locations[0].deck.indexOf('dracula'),toIndex:0} as const;
 expect(()=>reduce(s,{...move,to:2})).toThrow('adjacent');
 expect(()=>reduce(s,{...move,moveDracula:false})).toThrow('must move Dracula');
 const before=s.locations[1].deck.length;
 s=reduce(s,move);
 expect(draculaLocation(s)).toBe(1);
 expect(s.locations[1].deck).toHaveLength(before+1);
 expect(s.locations[1].deck.filter(id=>id===bodyguards)).toHaveLength(1);
 expect(s.players[4].discard).not.toContain(bodyguards);
 expect(parseSave(JSON.stringify(s))).toEqual(s);
 s.players[0].city=1;
 s.players[0].equipment=['hm-2'];
 s.config.brushDamage=3;
 s=reduce(s,{type:'stack',city:1,card:bodyguards});
 s=reduce(s,{type:'investigate',player:'h0',debug:true});
 expect(s.players[0].damage).toBe(1);
 expect(s.locations[1].resolved).toContain(bodyguards);
 expect(s.locations[1].deck).not.toContain(bodyguards);
 expect(s.log.at(-1)).not.toContain('prevented');
});

it('adds one Szgany Bodyguards to an existing market reserve',()=>{
 const s=createGame();
 s.draculaMarketUpdated=3;
 for(const zone of ['face','draw'] as const)s.market[zone]=s.market[zone].filter(id=>id!==bodyguards);
 const loaded=parseSave(JSON.stringify(s));
 expect(loaded.market.face).toEqual(s.market.face);
 expect(loaded.market.draw.filter(id=>id===bodyguards)).toHaveLength(1);
 expect(parseSave(JSON.stringify(loaded))).toEqual(loaded);
});
