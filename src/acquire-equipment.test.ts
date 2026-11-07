import {describe,it,expect} from 'vitest';
import {createGame,reduce,parseSave} from './engine';
function supply(){let s=createGame();s.players[0].hand=['supply'];s.market.face=['hm-6','hm-1','hm-2','hm-3'];return reduce(s,{type:'play',index:0});}
describe('Equipment acquisition',()=>{
 it('equips immediately without another play and still refills the market',()=>{const s=supply();const n=reduce(s,{type:'market',index:0,mode:'acquire',player:'h0',destination:'equipment'});expect(n.players[0].equipment).toEqual(['hm-6']);expect(n.players[0].discard).not.toContain('hm-6');expect(n.played).toBe(true);expect(n.pendingSupply).toBe(false);expect(n.market.face).toHaveLength(10);expect(s.players[0].equipment).toEqual([]);expect(parseSave(JSON.stringify(n))).toEqual(n);});
 it('permits discarding equipment even with occupied slots',()=>{const s=supply();s.players[0].equipment=['hm-9'];const n=reduce(s,{type:'market',index:0,mode:'acquire',player:'h0',destination:'discard'});expect(n.players[0].equipment).toEqual(['hm-9']);expect(n.players[0].discard).toContain('hm-6');});
 it('requires a valid replacement when full and discards the selected item',()=>{const s=supply();s.players[0].equipment=['hm-9'];expect(()=>reduce(s,{type:'market',index:0,mode:'acquire',player:'h0',destination:'equipment'})).toThrow('Choose which');for(const replaceIndex of [-1,1,0.5])expect(()=>reduce(s,{type:'market',index:0,mode:'acquire',player:'h0',destination:'equipment',replaceIndex})).toThrow();const n=reduce(s,{type:'market',index:0,mode:'acquire',player:'h0',destination:'equipment',replaceIndex:0});expect(n.players[0].equipment).toEqual(['hm-6']);expect(n.players[0].discard).toContain('hm-9');});
 it('rejects equipping non-equipment and preserves faction restrictions',()=>{const s=supply();s.market.face=['hm-12','dm-0'];expect(()=>reduce(s,{type:'market',index:0,mode:'acquire',player:'h0',destination:'equipment'})).toThrow('equipment');expect(()=>reduce(s,{type:'market',index:1,mode:'acquire',player:'h0',destination:'equipment'})).toThrow();});
 it('works for both Family Fortune acquisitions',()=>{const s=createGame();s.players[0].hand=['signature-0-0'];s.market.face=['hm-6','hm-2','hm-1','hm-3','hm-4'];let n=reduce(s,{type:'play',index:0});n=reduce(n,{type:'market',index:0,mode:'acquire',player:'h0',destination:'equipment'});expect(n.pendingFortune).toBe(1);n=reduce(n,{type:'market',index:0,mode:'acquire',player:'h0',destination:'equipment',replaceIndex:0});expect(n.pendingFortune).toBe(0);expect(n.players[0].equipment).toEqual(['hm-2']);expect(n.players[0].discard).toEqual(['signature-0-0','hm-6']);});
});

it('migrates older saves with two equipped cards and caps HP after removing Smelling Salts',()=>{
 const s=createGame();
 s.players[0].equipment=['hm-2','hm-salts'];
 const n=parseSave(JSON.stringify(s));
 expect(n.players[0].equipment).toEqual(['hm-2']);
 expect(n.players[0].discard).toContain('hm-salts');
 expect(n.players[0].damage).toBe(0);
});
