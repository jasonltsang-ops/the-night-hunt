import {expect,it} from 'vitest';
import {active,createGame,darkness,hurt,nextCombatPlayer,parseSave,reduce} from './engine';

it('awards one permanent Darkness per exhaustion, including after recovery',()=>{
 let s=createGame();
 const p=s.players[0];
 hurt(s,p,4);
 expect(darkness(s).exhaustions).toBe(1);
 hurt(s,p,2);
 expect(darkness(s).exhaustions).toBe(1);
 s=parseSave(JSON.stringify(s));
 for(let n=0;n<20&&!(active(s).id==='h0'&&active(s).recovery==='none');n++)s=reduce(s,{type:'advance',debug:true});
 expect(s.players[0].recovery).toBe('none');
 expect(darkness(s).exhaustions).toBe(1);
 hurt(s,s.players[0],4);
 expect(darkness(s).exhaustions).toBe(2);
 expect(parseSave(JSON.stringify(s)).exhaustionDarkness).toBe(2);
});

it('awards encounter exhaustion Darkness and immediately checks victory',()=>{
 let s=createGame(undefined,8);
 s.eventDarkness=9;
 s.players[0].damage=3;
 s.players[0].hand=['investigate','hm-13'];
 s.players[0].equipment=['hm-4'];
 s=reduce(s,{type:'play',index:0});
 expect(s.winner).toBe('dracula');
 expect(darkness(s).total).toBe(10);
 expect(s.latestResolution?.entries.slice(0,4)).toEqual([
  expect.stringContaining('took 1 damage (0 HP remaining)'),
  expect.stringContaining('became Exhausted'),
  expect.stringMatching(/Cards permanently removed: Silver Dagger, Fast Horse/),
  'Dracula gains 1 accumulated Darkness.',
 ]);
 expect(parseSave(JSON.stringify(s)).exhaustionDarkness).toBe(1);
});

it('awards Reckless Assault exhaustion once when combat finishes',()=>{
 let s=createGame(undefined,0);
 s.players.forEach((p,i)=>{if(i<4)p.city=i===0?0:8;p.hand=[];});
 s.players[0].damage=3;
 s.players[0].hand=['hm-reckless'];
 s=reduce(s,{type:'stack',city:0,card:'dracula'});
 s=reduce(s,{type:'investigate',player:'h0',debug:true});
 while(nextCombatPlayer(s)){
  const p=nextCombatPlayer(s)!;
  s=reduce(s,{type:'combatCard',player:p.id,index:p.side==='hunter'?0:-1});
 }
 s=reduce(s,{type:'resolveCombat'});
 expect(s.players[0].recovery).toBe('waiting');
 expect(s.exhaustionDarkness).toBe(1);
 expect(parseSave(JSON.stringify(s)).exhaustionDarkness).toBe(1);
});

it('loads previous saves without retroactive awards and rejects invalid counters',()=>{
 const s=createGame();
 hurt(s,s.players[0],4);
 const old:Partial<typeof s>=s;
 delete old.exhaustionDarkness;
 expect(parseSave(JSON.stringify(old)).exhaustionDarkness).toBe(0);
 for(const counter of [-1,1.5,'1']){
  expect(()=>parseSave(JSON.stringify({...s,exhaustionDarkness:counter}))).toThrow();
 }
});
