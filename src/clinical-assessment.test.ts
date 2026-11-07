import {expect,it} from 'vitest';
import {createGame,parseSave,reduce} from './engine';

const assessment='signature-3-1';

it.each(['day','night'] as const)('draws two before choosing a discard during %s',phase=>{
 let s=createGame();
 s.phase=phase;
 s.turn=phase==='day'?3:4;
 const seward=s.players[3];
 seward.hand=[assessment,'travel'];
 seward.draw=['combat'];
 seward.discard=['investigate'];
 s=reduce(s,{type:'play',index:0});
 expect(s.players[3].hand).toEqual(['travel','combat','investigate']);
 expect(s.players[3].discard).toEqual([assessment]);
 expect(()=>reduce(s,{type:'advance'})).toThrow('Clinical Assessment');
 expect(()=>reduce(s,{type:'assessmentDiscard',index:3})).toThrow();
 s=parseSave(JSON.stringify(s));
 s=reduce(s,{type:'assessmentDiscard',index:1});
 expect(s.players[3].hand).toEqual(['travel','investigate']);
 expect(s.players[3].discard).toEqual([assessment,'combat']);
 expect(s.pendingAssessment).toBeUndefined();
 expect(()=>reduce(s,{type:'assessmentDiscard',index:0})).toThrow();
 expect(()=>reduce(s,{type:'play',index:0})).toThrow('drawn with Clinical Assessment');
 const played=reduce(parseSave(JSON.stringify(s)),{type:'play',index:1});
 expect(played.players[3].hand).toEqual(['travel']);
 expect(played.players[3].discard).toContain('investigate');
 expect(()=>reduce(played,{type:'play',index:0})).toThrow();
});

it('cannot draw the played copy when the deck and discard are empty',()=>{
 const s=createGame();
 s.turn=3;
 s.players[3].hand=[assessment];
 s.players[3].draw=[];
 const n=reduce(s,{type:'play',index:0});
 expect(n.players[3].hand).toEqual([]);
 expect(n.players[3].discard).toEqual([assessment]);
 expect(n.pendingAssessment).toBeUndefined();
 expect(()=>reduce(n,{type:'advance'})).not.toThrow();
});
