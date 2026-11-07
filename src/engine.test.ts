import {describe,it,expect} from 'vitest';

import {active,createGame,draw,parseSave,reduce,shuffle} from './engine';

import {adjacent,hunterMarket,draculaMarket} from './data';

describe('Stage 1 foundation',()=>{

 it('creates four unique Hunters, Dracula, nine-card decks and 3-card hands',()=>{const s=createGame([1,2,3,4]);expect(s.players).toHaveLength(5);s.players.forEach(p=>{expect(p.hand).toHaveLength(3);expect(p.hand.length+p.draw.length+p.discard.length).toBe(9);});expect(s.market.face).toHaveLength(10);expect(s.market.draw).toHaveLength(30);expect(new Set([...s.market.face,...s.market.draw]).size).toBe(40);expect(()=>createGame([0,0,1,2])).toThrow();});

 it('has exactly the orthogonal map connections',()=>{expect(adjacent(0,1)).toBe(true);expect(adjacent(0,3)).toBe(true);expect(adjacent(0,4)).toBe(false);expect(adjacent(2,3)).toBe(false);});

 it('recycles discard only when draw is exhausted without losing cards',()=>{const p=createGame().players[0];p.hand=[];p.draw=['travel'];p.discard=['supply','combat'];draw(p,4);expect(p.hand).toHaveLength(3);expect(p.hand[0]).toBe('travel');expect(p.draw).toHaveLength(0);expect(p.discard).toHaveLength(0);expect(shuffle([1,2,3],()=>0).sort()).toEqual([1,2,3]);});

 it('enforces a single play and immutable transitions',()=>{const s=createGame();s.players[0].hand=['travel','supply','investigate'];const n=reduce(s,{type:'play',index:0});expect(s.players[0].hand).toHaveLength(3);expect(n.players[0].hand).toHaveLength(2);expect(()=>reduce(n,{type:'play',index:0})).toThrow();expect(active(reduce(s,{type:'advance'})).id).toBe('h1');});

 it('orders day Hunters then Dracula, night Dracula then Hunters, cleans up and draws',()=>{let s=createGame();const names=[];for(let i=0;i<10;i++){names.push(active(s).id);s=reduce(s,{type:'advance',debug:true});}expect(names).toEqual(['h0','h1','h2','h3','dracula','dracula','h0','h1','h2','h3']);expect(s.round).toBe(2);expect(s.phase).toBe('day');s.players.forEach(p=>{expect(p.hand).toHaveLength(3);expect(p.discard).toHaveLength(3);expect(p.draw).toHaveLength(3);});});

 it('uses a shared market, refills and permanently denies either faction',()=>{let s=createGame();s.players[0].hand=['supply'];s.market.face=['hm-0','dm-0'];s.market.draw=['hm-1','dm-1'];s=reduce(s,{type:'play',index:0});expect(()=>reduce(s,{type:'advance'})).toThrow();s=reduce(s,{type:'market',index:0,mode:'acquire',player:'h0'});expect(s.players[0].discard).toContain('hm-0');expect(s.market.face).toEqual(['dm-0','dm-1','hm-1']);expect(()=>reduce(s,{type:'market',index:0,mode:'acquire',player:'h0'})).toThrow();s=reduce(s,{type:'market',index:0,mode:'deny',player:'h0',debug:true});expect(s.market.denied).toEqual(['dm-0']);expect(s.market.face).toEqual(['dm-1','hm-1']);});

 it('recycles replacement discards and rejects wrong-faction acquisition',()=>{let s=createGame();s.market.face=['dm-0'];s.market.draw=[];s=reduce(s,{type:'market',index:0,mode:'replace',player:'dracula',debug:true});expect(s.market.face).toEqual(['dm-0']);expect(()=>reduce(s,{type:'market',index:0,mode:'acquire',player:'h0',debug:true})).toThrow();});

 it('allows a shared market with zero or ten Dracula cards',()=>{const s=createGame();s.market.face=hunterMarket.slice(0,10);expect(parseSave(JSON.stringify(s)).market.face).toHaveLength(10);s.market.face=draculaMarket.slice(0,10);expect(parseSave(JSON.stringify(s)).market.face).toHaveLength(10);});

 it('moves only after a valid destination and saves the new location',()=>{let s=createGame();s.players[0].hand=['travel'];s=reduce(s,{type:'play',index:0});expect(s.players[0].city).toBe(0);expect(()=>reduce(s,{type:'advance'})).toThrow();for(const city of [0,2,4,8,-1,1.5])expect(()=>reduce(s,{type:'travel',city})).toThrow();const moved=reduce(s,{type:'travel',city:1});expect(moved.players[0].city).toBe(1);expect(s.players[0].city).toBe(0);expect(moved.players[0].discard).toContain('travel');expect(parseSave(JSON.stringify(moved)).players[0].city).toBe(1);expect(()=>reduce(moved,{type:'travel',city:2})).toThrow();expect(active(reduce(moved,{type:'advance'})).id).toBe('h1');});

 it('uses card-specific travel ranges',()=>{let s=createGame();s.players[0].hand=['hm-13'];s=reduce(s,{type:'play',index:0});expect(reduce(s,{type:'travel',city:4}).players[0].city).toBe(4);expect(()=>reduce(s,{type:'travel',city:8})).toThrow();});

 it('migrates old separate markets without losing cards',()=>{const s=createGame();const {market,...rest}=s;const old={...rest,version:1,markets:{hunter:{face:market.face,draw:market.draw,discard:[],denied:[]},dracula:{face:[],draw:[],discard:[],denied:[]}}};const loaded=parseSave(JSON.stringify(old));expect(loaded.version).toBe(7);expect(loaded.market.face).toHaveLength(10);expect(loaded.market.draw).toHaveLength(30);expect(loaded.players).toEqual(s.players);});

 it('restricts normal Work the Market to acquiring Hunters or denying Dracula',()=>{const initial=createGame();initial.players[0].hand=['supply'];initial.market.face=['hm-0','dm-0'];initial.market.draw=['hm-1'];const s=reduce(initial,{type:'play',index:0});expect(()=>reduce(s,{type:'market',index:0,mode:'deny',player:'h0'})).toThrow('Work the Market can only deny a Dracula card.');expect(()=>reduce(s,{type:'market',index:1,mode:'acquire',player:'h0'})).toThrow();expect(s.pendingSupply).toBe(true);expect(s.market.face).toEqual(['hm-0','dm-0']);const denied=reduce(s,{type:'market',index:1,mode:'deny',player:'h0'});expect(denied.market.denied).toEqual(['dm-0']);expect(denied.pendingSupply).toBe(false);expect(denied.market.face).toEqual(['hm-0','hm-1']);const acquired=reduce(s,{type:'market',index:0,mode:'acquire',player:'h0'});expect(acquired.players[0].discard).toContain('hm-0');expect(reduce(s,{type:'market',index:0,mode:'deny',player:'h0',debug:true}).market.denied).toEqual(['hm-0']);});
 it('allows Work the Market by day and night with phase-specific actions',()=>{const s=createGame();s.players[0].hand=['supply'];expect(reduce(s,{type:'play',index:0}).pendingSupply).toBe(true);s.phase='night';s.turn=1;const n=reduce(s,{type:'play',index:0});expect(n.pendingSupply).toBe(true);expect(()=>reduce(n,{type:'advance'})).toThrow('Resolve Work the Market');});
 it('allows a pass with no eligible cards',()=>{const s=createGame();s.players[0].hand=[];expect(active(reduce(s,{type:'advance'})).id).toBe('h1');});

 it('round-trips saves and rejects malformed data',()=>{const s=createGame();expect(parseSave(JSON.stringify(s))).toEqual(s);expect(()=>parseSave('{}')).toThrow();s.players[0].hand=['unknown'];expect(()=>parseSave(JSON.stringify(s))).toThrow();});

});

