import {describe,it,expect} from 'vitest';
import {createGame,reduce,parseSave,canUseMarket} from './engine';
function setup(){const s=createGame();s.phase='night';s.turn=1;s.players[0].hand=['supply'];s.market.face=['hm-0','dm-0','hm-1','dm-1'];s.market.draw=['hm-salts','dm-4'];return reduce(s,{type:'play',index:0});}
describe('Visit the Market at Night',()=>{
 it.each([0,1])('permanently trashes either faction at slot %i and replaces exactly that slot from top of draw',index=>{const s=setup();const original=s.market.face[index];const n=reduce(s,{type:'market',index,mode:'refresh',player:'h0'});expect(n.market.denied).toContain(original);const face=[...s.market.face];face[index]='dm-4';expect(n.market.face).toEqual(face);expect(n.market.draw).toEqual(['hm-salts']);expect(n.players[0].discard).toEqual(['supply']);expect(n.pendingSupply).toBe(false);expect(n.played).toBe(true);expect(s.market.face[index]).toBe(original);expect(parseSave(JSON.stringify(n))).toEqual(n);expect(()=>reduce(n,{type:'advance'})).not.toThrow();expect(()=>reduce(n,{type:'market',index,mode:'refresh',player:'h0'})).toThrow();});
 it('disallows acquire, deny, debug replacement and another player during Visit the Market at Night',()=>{const s=setup();expect(canUseMarket(s,'hm-0','refresh')).toBe(true);expect(canUseMarket(s,'dm-0','refresh')).toBe(true);for(const mode of ['acquire','deny','replace'] as const){expect(canUseMarket(s,'hm-0',mode)).toBe(false);expect(()=>reduce(s,{type:'market',index:0,mode,player:'h0'})).toThrow();}expect(()=>reduce(s,{type:'market',index:0,mode:'refresh',player:'h1'})).toThrow();});
 it('immediately refills to ten after Visit the Market at Night when only three cards remain',()=>{
 const s=setup();
 s.market.face.pop();
 s.market.draw=['hm-2','hm-3','hm-4','hm-salts','hm-6','hm-7','hm-14','hm-9'];
 const n=reduce(s,{type:'market',index:0,mode:'refresh',player:'h0'});
 expect(n.market.face).toHaveLength(10);
 expect(n.market.face.slice(0,3)).toEqual(['hm-9','dm-0','hm-1']);
 expect(n.market.draw).toEqual([]);
 expect(n.market.denied).toContain('hm-0');
 expect(n.pendingSupply).toBe(false);
 expect(n.turn).toBe(s.turn);
 expect(n.log.at(-1)).toContain('Market refilled to 10 cards');
 expect(parseSave(JSON.stringify(n))).toEqual(n);
});
 it('handles depleted draw and recyclable market discards without returning trashed cards',()=>{let s=setup();s.market.draw=[];s.market.discard=['hm-9'];let n=reduce(s,{type:'market',index:0,mode:'refresh',player:'h0'});expect(n.market.face[0]).toBe('hm-9');expect(n.market.denied).toContain('hm-0');s=setup();s.market.draw=[];n=reduce(s,{type:'market',index:0,mode:'refresh',player:'h0'});expect(n.market.face).toHaveLength(3);expect(n.pendingSupply).toBe(false);expect(n.log.at(-1)).toContain('No replacement');});
 it('keeps Visit the Market by Day unchanged and rejects trash/refill by Day',()=>{let s=createGame();s.players[0].hand=['supply'];s.market.face=['hm-0','dm-0'];s=reduce(s,{type:'play',index:0});expect(canUseMarket(s,'hm-0','acquire')).toBe(true);expect(canUseMarket(s,'dm-0','deny')).toBe(true);expect(canUseMarket(s,'hm-0','refresh')).toBe(false);expect(()=>reduce(s,{type:'market',index:0,mode:'refresh',player:'h0'})).toThrow('Visit the Market at Night');});
});
