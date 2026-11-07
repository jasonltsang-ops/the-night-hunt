import {expect,it} from 'vitest';
import {addedInvestigationCopies,cards,hunterMarket} from './data';
import {createGame,investigationReview,parseSave,reduce} from './engine';

it.each([['hm-17b',0],['hm-18b',4]] as const)('places the unchosen card correctly after %s',(id,position)=>{
 const s=createGame(undefined,8);
 s.locations[0].deck.unshift('damaging');
 s.players[0].hand=[id];
 const pending=parseSave(JSON.stringify(reduce(s,{type:'play',index:0})));
 expect(investigationReview(pending,'h0')).toEqual(['damaging','encounter']);
 expect(investigationReview(pending,'dracula')).toEqual([]);
 expect(()=>reduce(pending,{type:'advance'})).toThrow();
 const n=reduce(pending,{type:'resolveInvestigation',index:1});
 expect(n.locations[0].deck[position]).toBe('damaging');
 expect(n.players[0].damage).toBe(1);
 expect(n.players[0].discard).toContain(id);
});

it('Local Rumors privately reviews four cards and shuffles without resolving one',()=>{
 const s=createGame(undefined,0);
 s.players[0].hand=['hm-19b'];
 const pending=reduce(s,{type:'play',index:0});
 expect(investigationReview(pending,'h0')).toEqual(s.locations[0].deck.slice(0,4));
 expect(investigationReview(pending,'h1')).toEqual([]);
 const n=reduce(pending,{type:'resolveInvestigation'});
 expect([...n.locations[0].deck].sort()).toEqual([...s.locations[0].deck].sort());
 expect(n.locations[0].resolved).toEqual([]);
 expect(n.players[0].damage).toBe(0);
 expect(n.players[0].discard).toContain('hm-19b');
});

it('Coordinated Search offers one optional follow-up if another Hunter is present',()=>{
 const s=createGame(undefined,8);
 s.players[0].hand=['hm-20'];
 const pending=reduce(s,{type:'play',index:0});
 expect(pending.players[0].damage).toBe(1);
 const stopped=reduce(pending,{type:'resolveInvestigation',repeat:false});
 expect(stopped.locations[0].resolved).toHaveLength(1);
 const repeated=reduce(pending,{type:'resolveInvestigation',repeat:true});
 expect(repeated.locations[0].resolved).toHaveLength(2);
 expect(repeated.players[0].damage).toBe(2);
 expect(repeated.pendingInvestigation).toBeUndefined();
 s.players.slice(1,4).forEach(p=>p.city=1);
 expect(reduce(s,{type:'play',index:0}).pendingInvestigation).toBeUndefined();
});

it('Uncover Conspiracy discards Savage Attack harmlessly and starts a showdown on Dracula',()=>{
 let s=createGame(undefined,0);
 s.players[0].hand=['hm-22'];
 s.locations[0].deck.unshift('damaging');
 const discarded=reduce(s,{type:'play',index:0});
 expect(discarded.locations[0].resolved).toEqual(['damaging']);
 expect(discarded.players[0].damage).toBe(0);
 expect(discarded.players[0].discard).toContain('hm-22');
 s=reduce(s,{type:'stack',city:0,card:'dracula'});
 expect(reduce(s,{type:'play',index:0}).combat?.city).toBe(0);
});

it('adds the extra market copies once to an old save',()=>{
 const s=createGame();
 delete s.investigationCopiesAdded;
 for(const zone of ['face','draw'] as const)s.market[zone]=s.market[zone].filter(id=>!addedInvestigationCopies.includes(id));
 const n=parseSave(JSON.stringify(s));
 for(const name of ['Thorough Search','Careful Investigation','Local Rumors','Uncover Conspiracy']){
  expect(hunterMarket.filter(id=>cards[id].name===name)).toHaveLength(2);
 }
 for(const id of addedInvestigationCopies)expect(n.market.draw).toContain(id);
 n.market.draw=n.market.draw.filter(id=>id!=='hm-17b');
 expect(parseSave(JSON.stringify(n))).toEqual(n);
});

it('adds only the second Uncover Conspiracy to saves with the previous investigation update',()=>{
 const s=createGame();
 s.investigationCopiesAdded=true;
 for(const zone of ['face','draw'] as const)s.market[zone]=s.market[zone].filter(id=>id!=='hm-22b'&&id!=='hm-17b');
 const n=parseSave(JSON.stringify(s));
 expect(n.market.draw).toContain('hm-22b');
 expect([...n.market.face,...n.market.draw]).not.toContain('hm-17b');
 expect(parseSave(JSON.stringify(n))).toEqual(n);
});
