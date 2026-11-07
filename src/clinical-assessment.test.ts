import {expect,it} from 'vitest';
import {createGame,parseSave,reduce,visionCities} from './engine';
import {matchView} from './multiplayer';

it.each(['top','bottom'] as const)('reveals a card at another Hunter’s city and returns it to the %s without resolving it',position=>{
 let s=createGame(undefined,8);
 s.players[0].city=8;
 s.players[3].hand=['signature-3-1'];
 s.turn=3;
 s=reduce(s,{type:'stack',city:8,card:'dracula'});
 s=reduce(s,{type:'play',index:0});
 expect(visionCities(s,s.players[3].id)).toEqual([0,8]);
 expect(()=>reduce(s,{type:'visionCity',city:1})).toThrow();
 s=reduce(s,{type:'visionCity',city:8});
 expect(matchView(s,'dracula',1).state.log.at(-1)).toBe('Wax Cylinders revealed Dracula in Athens.');
 const deck=[...s.locations[8].deck];
 s=reduce(parseSave(JSON.stringify(s)),{type:'visionReturn',position});
 expect(s.locations[8].deck).toEqual(position==='top'?deck:[...deck.slice(1),deck[0]]);
 expect(s.locations[8].resolved).toEqual([]);
 expect(s.combat).toBeNull();
 expect(s.players[3].discard).toContain('signature-3-1');
});

it('lets an in-progress Clinical Assessment from an older save finish',()=>{
 const old=createGame();
 old.turn=3;
 old.played=true;
 old.pendingAssessment=true;
 old.assessmentDrawnFrom=0;
 old.players[3].discard=['signature-3-1'];
 old.players[3].hand=['combat','travel'];
 const next=reduce(parseSave(JSON.stringify(old)),{type:'assessmentDiscard',index:0});
 expect(next.pendingAssessment).toBeUndefined();
 expect(()=>reduce(next,{type:'play',index:0,choice:'prepare'})).not.toThrow();
});
