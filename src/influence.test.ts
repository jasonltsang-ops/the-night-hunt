import {describe,it,expect} from 'vitest';
import {createGame,reduce,canUseMarket,parseSave} from './engine';

function influence(phase:'day'|'night'){
 const s=createGame();s.phase=phase;s.turn=phase==='day'?4:0;s.players[4].hand=['d-3'];s.market.face=['hm-0','dm-0'];s.market.draw=['hm-1'];return reduce(s,{type:'play',index:0});
}
describe('Dark Influence',()=>{
 it.each(['day','night'] as const)('denies a Hunter during %s and refills immediately',phase=>{
  const s=influence(phase);expect(s.pendingInfluence).toBe(true);expect(s.players[4].discard).toContain('d-3');expect(()=>reduce(s,{type:'advance'})).toThrow('Resolve Dark Influence');
  expect(canUseMarket(s,'hm-0','deny')).toBe(true);expect(canUseMarket(s,'dm-0','deny')).toBe(false);expect(canUseMarket(s,'hm-0','acquire')).toBe(false);
  expect(()=>reduce(s,{type:'market',index:1,mode:'deny',player:'dracula'})).toThrow();expect(()=>reduce(s,{type:'market',index:0,mode:'acquire',player:'dracula'})).toThrow();expect(()=>reduce(s,{type:'market',index:0,mode:'deny',player:'h0'})).toThrow();
  const n=reduce(s,{type:'market',index:0,mode:'deny',player:'dracula'});expect(n.market.denied).toEqual(['hm-0']);expect(n.market.face).toEqual(['dm-0','hm-1']);expect(n.pendingInfluence).toBe(false);expect(()=>reduce(n,{type:'market',index:1,mode:'acquire',player:'dracula'})).toThrow();
 });
 it('acquires a Dracula card into discard at Night only',()=>{
  const day=influence('day');expect(canUseMarket(day,'dm-0','acquire')).toBe(false);expect(()=>reduce(day,{type:'market',index:1,mode:'acquire',player:'dracula'})).toThrow();
  const night=influence('night');expect(canUseMarket(night,'dm-0','acquire')).toBe(true);const n=reduce(night,{type:'market',index:1,mode:'acquire',player:'dracula'});expect(n.players[4].discard).toContain('dm-0');expect(n.players[4].hand).not.toContain('dm-0');expect(n.pendingInfluence).toBe(false);expect(n.market.face).toEqual(['hm-0','hm-1']);
 });
 it('persists pending resolution across saves',()=>{const s=influence('night');expect(parseSave(JSON.stringify(s)).pendingInfluence).toBe(true);});
 it('resolves without blocking when no legal Day target exists',()=>{const s=createGame();s.turn=4;s.players[4].hand=['d-3'];s.market.face=['dm-0'];const n=reduce(s,{type:'play',index:0});expect(n.pendingInfluence).toBe(false);expect(n.log.at(-1)).toContain('No legal market target');expect(reduce(n,{type:'advance'}).phase).toBe('night');});
});
