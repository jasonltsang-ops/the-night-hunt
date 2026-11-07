import {createSetup, normalizeEquipmentSlots, type State} from './engine';
import {applyOnlineAction, matchView, type OnlineAction, type Side} from './multiplayer';

export type Room={id:string;tokens:Record<Side,string>;revision:number;state:State};
export type RoomStore={
 get(id:string):Room|undefined|Promise<Room|undefined>;
 create(room:Room):void|Promise<void>;
 update(room:Room,expectedRevision:number):boolean|Promise<boolean>;
};

const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
const randomKey=()=>crypto.randomUUID().replaceAll('-','');

export function createMatchHandler(store:RoomStore){
 async function getRoom(id:string){
  const room=await store.get(id);
  if(!room||!room.state.players.some(p=>p.side==='hunter'&&p.equipment.length>1))return room;
  const state=structuredClone(room.state);
  normalizeEquipmentSlots(state);
  return {...room,state};
 }
 return async function handle(request:Request):Promise<Response>{
  const path=new URL(request.url).pathname;
  if(path==='/api/matches'&&request.method==='POST'){
   const body=await request.json().catch(()=>null);
   if(!body||!Array.isArray(body.hunters))return json({error:'Choose four different Hunters.'},400);
   let state:State;
   try{state=createSetup(body.hunters);}
   catch{return json({error:'Choose four different Hunters.'},400);}
   const room:Room={id:randomKey(),tokens:{dracula:randomKey(),hunter:randomKey()},revision:0,state};
   await store.create(room);
   return json({id:room.id,token:room.tokens.dracula,inviteToken:room.tokens.hunter,match:matchView(state,'dracula',0)},201);
  }
  const route=/^\/api\/matches\/([a-f0-9]{32})$/.exec(path);
  if(!route)return json({error:'Match endpoint not found.'},404);
  const room=await getRoom(route[1]);
  const token=/^Bearer ([a-f0-9]{32})$/.exec(request.headers.get('Authorization')??'')?.[1];
  const side=room&&token===room.tokens.dracula?'dracula':room&&token===room.tokens.hunter?'hunter':null;
  if(!room||!side)return json({error:'This match or seat link is unavailable.'},404);
  if(request.method==='GET')return json(matchView(room.state,side,room.revision));
  if(request.method!=='POST')return json({error:'Unsupported method.'},405);
  const body=await request.json().catch(()=>null) as {revision?:number;action?:OnlineAction}|null;
  if(!body||!Number.isSafeInteger(body.revision)||!body.action)return json({error:'Invalid action.'},400);

  const conflict=(current:Room)=>json({error:'The match advanced. Review the new state and try again.',match:matchView(current.state,side,current.revision)},409);
  const current=await getRoom(room.id)??room;
  if(body.revision!==current.revision)return conflict(current);
  let state:State;
  try{state=applyOnlineAction(current.state,side,body.action);}
  catch(error){return json({error:error instanceof Error?error.message:'That action could not be applied.'},400);}
  const next={...current,state,revision:current.revision+1};
  if(!await store.update(next,current.revision))return conflict(await getRoom(room.id)??current);
  return json(matchView(state,side,next.revision));
 };
}
