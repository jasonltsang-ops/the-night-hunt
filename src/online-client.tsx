import React,{useEffect,useRef,useState,type ReactNode} from 'react';
import {hunters} from './data';
import type {MatchView,OnlineAction} from './multiplayer';

type Session={id:string;token:string;inviteToken?:string};
export type OnlineGame={
 match:MatchView;
 submit:(action:OnlineAction)=>void;
 error:string;
 busy:boolean;
 invite?:string;
 leave:()=>void;
};
const key='night-hunt-online-seat';
const validKey=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{32}$/.test(value);

function readSession():Session|null{
 const invitation=new URLSearchParams(location.hash.slice(1)).get('join')?.split('.');
 if(invitation?.length===2&&invitation.every(validKey))return {id:invitation[0],token:invitation[1]};
 try{
  const value=JSON.parse(localStorage.getItem(key)??'null');
  if(validKey(value?.id)&&validKey(value?.token))return value;
 }catch{/* Private browsing can restrict storage. */}
 return null;
}

export function OnlinePlay({renderSolo,renderGame}:{
 renderSolo:(open:()=>void)=>ReactNode;
 renderGame:(game:OnlineGame)=>ReactNode;
}){
 const [session,setSession]=useState(readSession);
 const [mode,setMode]=useState<'solo'|'lobby'|'online'>(()=>session?'online':'solo');
 const [match,setMatch]=useState<MatchView|null>(null);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [selected,setSelected]=useState([0,1,2,3]);
 const inFlight=useRef(false);
 const leave=()=>{setError('');setMode('solo');};

 useEffect(()=>{
  if(!session)return;
  try{localStorage.setItem(key,JSON.stringify(session));}catch{/* The active tab can still play. */}
  if(new URLSearchParams(location.hash.slice(1)).has('join'))history.replaceState(null,'',location.pathname+location.search);
 },[session]);

 useEffect(()=>{
  if(mode!=='online'||!session)return;
  let stopped=false;
  let timer:ReturnType<typeof setTimeout>;
  async function poll(){
   try{
    const response=await fetch('/api/matches/'+session!.id,{headers:{Authorization:'Bearer '+session!.token},cache:'no-store'});
    if(!response.ok)throw Error(response.status===404?'This match or seat link is unavailable.':'The match server is unavailable.');
    const next:MatchView=await response.json();
    if(!stopped){
     setMatch(current=>!current||next.revision>=current.revision?next:current);
     setError(current=>current.startsWith('Connection:')?'':current);
    }
   }catch(error){
    if(!stopped)setError('Connection: '+(error instanceof Error?error.message:'Unable to reach the match.'));
   }finally{if(!stopped)timer=setTimeout(poll,1200);}
  }
  void poll();
  return ()=>{stopped=true;clearTimeout(timer);};
 },[mode,session]);

 async function create(){
  setBusy(true);setError('');
  try{
   const response=await fetch('/api/matches',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({hunters:selected})});
   const data=await response.json().catch(()=>null);
   if(!response.ok||!data?.match)throw Error(data?.error??'This preview needs a multiplayer server to create matches.');
   setSession({id:data.id,token:data.token,inviteToken:data.inviteToken});
   setMatch(data.match);
   setMode('online');
  }catch(error){setError(error instanceof Error?error.message:'Unable to create a match.');}
  finally{setBusy(false);}
 }

 async function submit(action:OnlineAction){
  if(!session||!match||inFlight.current||match.actingSide!==match.side)return;
  inFlight.current=true;setBusy(true);setError('');
  try{
   const response=await fetch('/api/matches/'+session.id,{
    method:'POST',
    headers:{Authorization:'Bearer '+session.token,'Content-Type':'application/json'},
    body:JSON.stringify({revision:match.revision,action}),
   });
   const data=await response.json();
   const next:MatchView|undefined=response.ok?data:data.match;
   if(next)setMatch(current=>!current||next.revision>=current.revision?next:current);
   if(!response.ok)throw Error(data.error??'The action failed.');
  }catch(error){setError(error instanceof Error?error.message:'Unable to send the action.');}
  finally{inFlight.current=false;setBusy(false);}
 }

 if(mode==='solo')return renderSolo(()=>setMode('lobby'));
 if(mode==='online'&&match&&session){
  const invite=session.inviteToken?location.origin+location.pathname+'#join='+session.id+'.'+session.inviteToken:undefined;
  return renderGame({match,submit,error,busy,invite,leave});
 }
 return <main>
  <header><h1>The Night Hunt</h1><button onClick={leave}>Back to solo play</button></header>
  <section>
   <h2>Play online</h2>
   {mode==='online'?<p role="status">Connecting to the match…</p>:<>
    <p>Create a match as Dracula. Share the Hunter invitation with a friend who will control all four Hunters.</p>
    <div>{hunters.map((name,index)=><label className="choice" key={name}>
     <input type="checkbox" checked={selected.includes(index)} disabled={busy} onChange={e=>setSelected(e.target.checked?[...selected,index]:selected.filter(id=>id!==index))}/>{name}
    </label>)}</div>
    <div className="buttons">
     <button disabled={busy||selected.length!==4} onClick={()=>void create()}>Create match</button>
     {session&&<button disabled={busy} onClick={()=>{setError('');setMode('online');}}>Resume match</button>}
    </div>
   </>}
   {error&&<p role="alert" className="error">{error}</p>}
  </section>
 </main>;
}

export function OnlineBanner({game}:{game:OnlineGame}){
 const {side,actingSide,reactionWindow}=game.match;
 return <section className="online-banner">
  <h2>Online match · {side==='hunter'?'Hunters':'Dracula'}</h2>
  {game.invite&&<label>Hunter invitation <input readOnly value={game.invite} onFocus={e=>e.target.select()}/></label>}
  <p role="status">{actingSide===null?'Match complete.':actingSide===side?'Your side can act.':`Waiting for ${actingSide==='hunter'?'the Hunters':'Dracula'}.`}</p>
  {reactionWindow&&side==='hunter'&&<button disabled={game.busy} onClick={()=>game.submit({type:'finishReactions'})}>Finish equipment choices</button>}
  <button onClick={game.leave}>Back to solo play</button>
  {game.error&&<p role="alert" className="error">{game.error}</p>}
 </section>;
}
