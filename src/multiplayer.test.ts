import {expect,it} from 'vitest';
import {createMatchHandler,type Room} from './multiplayer-server';
import {applyOnlineAction,matchView} from './multiplayer';
import {createGame,reduce,type Action} from './engine';

function setup(){
 const rooms=new Map<string,Room>();
 const handle=createMatchHandler({
  get:id=>rooms.get(id),
  create:room=>{rooms.set(room.id,room);},
  update:(room,revision)=>{
   if(rooms.get(room.id)?.revision!==revision)return false;
   rooms.set(room.id,room);
   return true;
  },
 });
 const request=(path:string,body?:unknown,token?:string)=>handle(new Request('https://game.test/api/matches'+path,{
  method:body?'POST':'GET',
  headers:token?{Authorization:'Bearer '+token}:{},
  body:body?JSON.stringify(body):undefined,
 }));
 return request;
}

it('keeps both seats synchronized, blocks impersonation, and rejects competing turns',async()=>{
 const request=setup();
 const created=await request('',{hunters:[0,1,2,3]});
 expect(created.status).toBe(201);
 const {id,token,inviteToken}=await created.json();
 const path='/'+id;
 const play=(revision:number,action:Action,seat:string)=>request(path,{revision,action},seat);
 expect((await request(path)).status).toBe(404);
 expect((await play(0,{type:'chooseStart',player:'h0',city:0},token)).status).toBe(400);
 const results=await Promise.all([
  play(0,{type:'chooseStart',player:'h0',city:0},inviteToken),
  play(0,{type:'chooseStart',player:'h0',city:1},inviteToken),
 ]);
 expect(results.map(r=>r.status).sort()).toEqual([200,409]);
 for(let i=1;i<4;i++)expect((await play(i,{type:'chooseStart',player:'h'+i,city:i},inviteToken)).status).toBe(200);
 expect((await play(4,{type:'chooseStart',player:'dracula',city:8},inviteToken)).status).toBe(400);
 expect((await play(4,{type:'chooseStart',player:'dracula',city:8},token)).status).toBe(200);
 const hunter=await (await request(path,undefined,inviteToken)).json();
 const dracula=await (await request(path,undefined,token)).json();
 expect(hunter.revision).toBe(5);
 expect(dracula.revision).toBe(5);
 expect(hunter.actingSide).toBe('hunter');
 expect(hunter.state.players[4].city).toBe(-1);
 expect(hunter.state.locations.flatMap((l:Room['state']['locations'][number])=>l.deck)).not.toContain('dracula');
 expect(dracula.state.players[4].city).toBe(8);
 expect((await play(5,{type:'advance',debug:true},inviteToken)).status).toBe(400);
 expect((await play(5,{type:'advance'},inviteToken)).status).toBe(200);
});

it('exposes only the exact encounter cards the Hunter side has reviewed',()=>{
 const s=createGame(undefined,0);
 s.players[4].hand=['dm-pride','dm-bats','d-4'];
 s.players[0].hand=['hm-19'];
 s.locations[0].deck=['dracula','damaging','encounter','encounter','damaging'];
 s.locations[1].ally={card:'dm-renfield',revealed:false};
 const pending=reduce(s,{type:'play',index:0});
 const hunters=matchView(pending,'hunter',1).state;
 const dracula=matchView(pending,'dracula',1).state;
 expect(hunters.players[4].hand).toEqual(['d-0','d-0','d-0']);
 expect(hunters.locations[0].deck).toEqual(['dracula','damaging','encounter','encounter','encounter']);
 expect(hunters.locations[1].ally?.card).toBe('dm-4');
 expect(hunters.publicDraculaMaxHP).toBe(12);
 expect(dracula.locations[0].deck.every(card=>card==='encounter')).toBe(true);
});

it('lets Hunters finish Pistol choices before Dracula resolves the showdown',()=>{
 let s=createGame(undefined,0);
 s.players.forEach(p=>p.hand=[]);
 s.players.slice(1,4).forEach(p=>p.city=8);
 s.players[0].equipment=['hm-9'];
 s=reduce(s,{type:'stack',city:0,card:'dracula'});
 s=reduce(s,{type:'investigate',player:'h0',debug:true});
 s=applyOnlineAction(s,'hunter',{type:'combatCard',player:'h0',index:-1});
 s=applyOnlineAction(s,'dracula',{type:'combatCard',player:'dracula',index:-1});
 expect(()=>applyOnlineAction(s,'dracula',{type:'resolveCombat'})).toThrow();
 s=applyOnlineAction(s,'hunter',{type:'finishReactions'});
 expect(applyOnlineAction(s,'dracula',{type:'resolveCombat'}).combat?.stage).toBe('damage');
});
