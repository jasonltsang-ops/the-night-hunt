import {createMatchHandler,type Room} from './multiplayer-server';
import assets from 'virtual:night-hunt-assets';

type Statement={
 bind(...values:(string|number)[]):Statement;
 first<T>():Promise<T|null>;
 run():Promise<{meta:{changes:number}}>;
};
type Environment={DB:{prepare(query:string):Statement}};

export default {
 async fetch(request:Request,env:Environment){
  const path=new URL(request.url).pathname;
  if(path==='/api/matches'||path.startsWith('/api/matches/')){
   try{
    const handle=createMatchHandler({
     async get(id){
      const row=await env.DB.prepare('SELECT room_json FROM matches WHERE id = ?').bind(id).first<{room_json:string}>();
      return row?JSON.parse(row.room_json) as Room:undefined;
     },
     async create(room){
      await env.DB.prepare('INSERT INTO matches (id, revision, room_json) VALUES (?, ?, ?)').bind(room.id,room.revision,JSON.stringify(room)).run();
     },
     async update(room,expectedRevision){
      const result=await env.DB.prepare('UPDATE matches SET revision = ?, room_json = ? WHERE id = ? AND revision = ?')
       .bind(room.revision,JSON.stringify(room),room.id,expectedRevision).run();
      return result.meta.changes===1;
     },
    });
    return await handle(request);
   }catch{
    return Response.json({error:'The match server could not complete the request.'},{status:500,headers:{'Cache-Control':'no-store'}});
   }
  }
  if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405});
  const asset=Object.hasOwn(assets,path)?assets[path]:undefined;
  if(!asset)return new Response('Not found',{status:404});
  return new Response(request.method==='HEAD'?null:asset.content,{headers:{
   'Content-Type':asset.contentType,
   'Cache-Control':path==='/'?'no-cache':'public, max-age=31536000, immutable',
   'Referrer-Policy':'no-referrer',
   'X-Content-Type-Options':'nosniff',
   'Content-Security-Policy':"default-src 'self'; frame-ancestors *",
  }});
 },
};
