import {expect,it} from 'vitest';
import {cards,addedHunterCopies,hunterMarket} from './data';
import {createGame,parseSave,reduce} from './engine';

it.each([['day','hm-12'],['night','hm-12b']] as const)('First Aid heals both Hunters by %s and discards', (phase,id)=>{
 const s=createGame(undefined,8);
 s.phase=phase;
 s.turn=phase==='day'?0:1;
 s.players[0].hand=[id];
 s.players[0].damage=2;
 s.players[1].damage=1;
 s.players[2].city=2;
 expect(()=>reduce(s,{type:'play',index:0,healTarget:'h2'})).toThrow();
 const n=reduce(s,{type:'play',index:0,healTarget:'h1'});
 expect(n.players.slice(0,2).map(p=>p.damage)).toEqual([1,0]);
 expect(n.players[0].discard).toContain(id);
 expect(parseSave(JSON.stringify(n))).toEqual(n);
});

it('First Aid heals only its user when other Hunters are distant or Exhausted',()=>{
 const s=createGame(undefined,8);
 s.players[0].hand=['hm-12'];
 s.players[0].damage=2;
 s.players[1].damage=4;
 s.players[1].recovery='waiting';
 s.players[2].city=2;
 s.players[3].city=3;
 const n=reduce(s,{type:'play',index:0});
 expect(n.players[0].damage).toBe(1);
 expect(n.players[1].damage).toBe(4);
});

it('builds the revised Hunter market and updates old saves once',()=>{
 const names=hunterMarket.map(id=>cards[id].name);
 for(const [name,count] of [['First Aid',2],['Fast Horse',1],['Travel by Train',2],['Group Passage',1],['Medical Kit',2],['Quincy Morris',1]] as const){
  expect(names.filter(n=>n===name)).toHaveLength(count);
 }
 const old=createGame(undefined,8);
 delete old.hunterMarketUpdated;
 old.market.face=['hm-10','hm-16',...old.market.face.slice(0,8).filter(id=>!addedHunterCopies.includes(id))];
 old.market.draw=old.market.draw.filter(id=>!addedHunterCopies.includes(id));
 old.players[0].hand=['hm-10','travel'];
 const migrated=parseSave(JSON.stringify(old));
 expect(migrated.players[0].hand).toEqual(['travel']);
 expect(migrated.market.face).not.toContain('hm-16');
 expect(migrated.market.face).not.toContain('hm-10');
 for(const id of addedHunterCopies)expect(migrated.market.draw.filter(c=>c===id)).toHaveLength(1);
 migrated.market.draw=migrated.market.draw.filter(id=>id!=='hm-14b');
 expect(parseSave(JSON.stringify(migrated))).toEqual(migrated);
});

it('removes the seven cut cards from existing market and Hunter zones',()=>{
 const s=createGame();
 s.hunterMarketUpdated=2;
 s.market.face[0]='hm-23';
 s.market.draw.push('hm-12c','hm-13b');
 s.market.discard.push('hm-20b');
 s.players[0].equipment=['hm-5','hm-8'];
 s.players[0].hand=['hm-15b','travel'];
 const n=parseSave(JSON.stringify(s));
 expect(n.players[0].hand).toEqual(['travel']);
 expect(n.players[0].equipment).toEqual([]);
 for(const id of ['hm-23','hm-12c','hm-13b','hm-20b']){
  expect([...n.market.face,...n.market.draw,...n.market.discard]).not.toContain(id);
 }
 expect(parseSave(JSON.stringify(n))).toEqual(n);
});
