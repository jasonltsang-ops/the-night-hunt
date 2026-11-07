import {expect,it,vi} from 'vitest';
import {createGame,parseSave,reduce,visionPeek} from './engine';
import {applyOnlineAction,matchView} from './multiplayer';

it.each(['top','shuffle'] as const)('keeps the Day peek secret and lets Dracula choose %s',position=>{
 let s=createGame(undefined,8);
 s.turn=4;
 s.players[4].hand=['d-2'];
 s=reduce(s,{type:'stack',city:1,card:'damaging'});
 s=applyOnlineAction(s,'dracula',{type:'play',index:0});
 s=applyOnlineAction(s,'dracula',{type:'visionCity',city:1});
 expect(matchView(s,'hunter',1).state.pendingVision?.city).toBeNull();
 expect(matchView(s,'hunter',1).state.locations[1].deck[0]).toBe('encounter');
 expect(visionPeek(matchView(s,'dracula',1).state,'dracula')).toBe('damaging');
 expect(()=>reduce(s,{type:'visionReturn',position:'bottom'})).toThrow();
 const rng=vi.spyOn(Math,'random').mockReturnValue(0);
 try{
  const n=applyOnlineAction(parseSave(JSON.stringify(s)),'dracula',{type:'visionReturn',position});
  expect(n.pendingVision).toBeNull();
  expect(n.locations[1].deck).toEqual(position==='top'?s.locations[1].deck:[...s.locations[1].deck.slice(1),s.locations[1].deck[0]]);
 }finally{rng.mockRestore();}
});
