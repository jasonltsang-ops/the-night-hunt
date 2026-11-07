import {mkdirSync,readdirSync,readFileSync,renameSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {defineConfig,type Plugin} from 'vite';
import {createMatchHandler,type Room} from './src/multiplayer-server';

function onlineMatches():Plugin{
 const directory=resolve(process.cwd(),'.night-hunt-matches');
 function get(id:string){
  try{return JSON.parse(readFileSync(resolve(directory,id+'.json'),'utf8')) as Room;}
  catch(error){
   if((error as NodeJS.ErrnoException).code==='ENOENT')return undefined;
   throw error;
  }
 }
 function save(room:Room){
  mkdirSync(directory,{recursive:true});
  const file=resolve(directory,room.id+'.json');
  writeFileSync(file+'.tmp',JSON.stringify(room),{mode:0o600});
  renameSync(file+'.tmp',file);
 }
 const handle=createMatchHandler({
  get,
  create:save,
  update(room,expectedRevision){
   if(get(room.id)?.revision!==expectedRevision)return false;
   save(room);
   return true;
  },
 });
 const mount=(server:Parameters<NonNullable<Plugin['configureServer']>>[0]|Parameters<NonNullable<Plugin['configurePreviewServer']>>[0])=>{
  server.middlewares.use(async(req,res,next)=>{
   if(!req.url?.startsWith('/api/matches'))return next();
   try{
    let body='';
    for await(const chunk of req){
     body+=chunk;
     if(body.length>16384){
      res.writeHead(413,{'Content-Type':'application/json'});
      res.end(JSON.stringify({error:'Request too large.'}));
      return;
     }
    }
    const response=await handle(new Request(new URL(req.url,'http://localhost'),{
     method:req.method,
     headers:{Authorization:req.headers.authorization??''},
     body:body||undefined,
    }));
    res.writeHead(response.status,Object.fromEntries(response.headers));
    res.end(await response.text());
   }catch{
    res.writeHead(500,{'Content-Type':'application/json','Cache-Control':'no-store'});
    res.end(JSON.stringify({error:'The match server could not complete the request.'}));
   }
  });
 };
 return {name:'night-hunt-online',configureServer:mount,configurePreviewServer:mount};
}

function siteAssets():Plugin{
 const name='virtual:night-hunt-assets';
 return {
  name:'night-hunt-site-assets',
  resolveId(id){if(id===name)return '\0'+name;},
  load(id){
   if(id!=='\0'+name)return;
   const assets:Record<string,{content:string;contentType:string}>={
    '/':{content:readFileSync('dist/index.html','utf8'),contentType:'text/html; charset=utf-8'},
   };
   for(const file of readdirSync('dist/assets')){
    assets['/assets/'+file]={
     content:readFileSync('dist/assets/'+file,'utf8'),
     contentType:file.endsWith('.css')?'text/css; charset=utf-8':'application/javascript; charset=utf-8',
    };
   }
   return 'export default '+JSON.stringify(assets);
  },
 };
}

export default defineConfig(({isSsrBuild})=>({
 plugins:[onlineMatches(),siteAssets()],
 server:{fs:{deny:['.env','.env.*','*.{crt,pem}','**/.git/**','**/.night-hunt-matches/**']}},
 build:isSsrBuild?{rollupOptions:{output:{entryFileNames:'index.js'}}}:undefined,
}));
