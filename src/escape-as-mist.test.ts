import {expect,it} from 'vitest';
import {createGame,draculaLocation,escapeDestinations,parseSave,reduce} from './engine';
import {applyOnlineAction,matchView} from './multiplayer';

function escapeSetup(closeVienna=false){
 let s=createGame(undefined,4);
 s.players[0].city=4;
 if(closeVienna){
  const city=s.locations[5];
  city.resolved.push(...city.deck);
  city.deck=[];
  city.closed=true;
 }
 s=reduce(s,{type:'stack',city:4,card:'dracula'});
 s.locations[4].resolved.push(...s.locations[4].deck.splice(1));
 s.players[4].hand=['dm-0'];
 s=reduce(s,{type:'investigate',player:'h0',debug:true});
 s=reduce(s,{type:'combatCard',player:'h0',index:-1});
 s=reduce(s,{type:'combatCard',player:'dracula',index:0});
 s=reduce(s,{type:'resolveCombat'});
 return reduce(s,{type:'allocateDamage',extra:[]});
}

it.each([false,true])('Mist adds one card to the origin and each open neighbor without identifying the destination (closed city: %s)',closed=>{
 const s=escapeSetup(closed);
 const destinations=escapeDestinations(s);
 expect(destinations).toEqual(closed?[1,3,7]:[1,3,5,7]);
 expect(()=>applyOnlineAction(s,'dracula',{type:'escape',city:0})).toThrow('valid escape destination');
 if(closed)expect(()=>applyOnlineAction(s,'dracula',{type:'escape',city:5})).toThrow();
 const next=applyOnlineAction(s,'dracula',{type:'escape',city:7});
 for(const [city,location] of next.locations.entries()){
  const before=s.locations[city].deck.length;
  expect(location.deck).toHaveLength(before+(city===4||destinations.includes(city)?1:0));
  if(city===4||destinations.includes(city)&&city!==7)
   expect(location.deck.filter(card=>card==='encounter')).toHaveLength(s.locations[city].deck.filter(card=>card==='encounter').length+1);
 }
 expect(next.addedBasicEncounters).toBe(destinations.length);
 expect(next.locations[4].closed).toBe(false);
 expect(draculaLocation(next)).toBe(7);
 expect(parseSave(JSON.stringify(next))).toEqual(next);
 const hunterView=matchView(next,'hunter',1).state;
 expect(hunterView.players[4].city).toBe(-1);
 expect(hunterView.locations.flatMap(location=>location.deck)).not.toContain('dracula');
 expect(hunterView.log.at(-1)).not.toContain('Rome');
});

it('declining Mist adds no decoys and shuffles Dracula back into the showdown city',()=>{
 const s=escapeSetup();
 const next=reduce(s,{type:'escape',city:null});
 expect(draculaLocation(next)).toBe(4);
 expect(next.addedBasicEncounters).toBe(0);
 expect(next.locations[4].deck).toEqual(['dracula']);
});
