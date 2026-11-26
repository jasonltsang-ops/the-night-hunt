import React from 'react';
import {cards} from './data';

const cardSprites: Record<string, {color:string; pixels:string; accent?:string; accentColor?:string; detail?:string}> = {
 'hm-2': {color:'#d9ac6a',pixels:'M7 1h2v4h5v2H9v8H7V7H2V5h5z',accent:'M7 2h1v12H7z'},
 'hm-3': {color:'#ba895d',pixels:'M2 9h5V8h6v2H7v2H4v2H1v-3h1z',accent:'M7 7h8v2H7z'},
 'hm-4': {color:'#c9d7e8',pixels:'M13 1h2v4h-2v2h-2v2H9v2H7V9h2V7h2V5h2z',accent:'M5 9h2v2h2v2H7v-1H5v2H3v1H1v-2h2v-2h2z'},
 'hm-6': {color:'#7d9bc8',pixels:'M5 2h6v1h2v1h2v5h-3v5H4V9H1V4h2V3h2z',accent:'M6 3h4v3H6zm1 4h2v5H7z'},
 'hm-9': {color:'#b6bacb',pixels:'M3 4h12v4H8v2H6v4H2v-4h1z',accent:'M3 9h3v1H5v3H2v-2h1z'},
 'dm-4': {color:'#a76b9b',pixels:'M5 1h6v1h2v3h1v5h-1v3h1v2H2v-3h1V4h1V2h1z',accent:'M8 4h4v3h1v1h1v1h-2v3h-2v2H8v-3H7V6h1z',accentColor:'#f0bfce',detail:'M10 7h2v1h-2zm1 3h2v1h-2z'},
 'dm-5': {color:'#a7aec7',pixels:'M3 1h1v2h2v2h2V3h1v3h2v2h2v1h2v2h-2v2H8v2H3v-3H2V6h1z',accent:'M7 9h3v1h4v1h-2v1H8v2H6v-3h1z',accentColor:'#dce0ed',detail:'M9 7h1v1H9zm5 2h1v2h-1z'},
 'dm-6': {color:'#a5c0df',pixels:'M5 2h6v1h2v2h1v9h-2v-2h-2v2H8v-2H6v2H4v-2H2V5h1V3h2z',accent:'M5 6h2v2H5zm4 0h2v2H9z'},
 'dm-renfield': {color:'#c2ab79',pixels:'M5 2h6v1h2v3h-1v5h-2v2h3v2H3v-2h3v-2H4V6H3V4h2z',accent:'M5 6h2v1H5zm4 0h2v1H9zm-3 3h4v1H6z'},
 'hm-salts': {color:'#8bbaae',pixels:'M6 4h4v2h2v2h1v6H3V8h1V6h2z',accent:'M5 2h6v2H5zm0 7h6v3H5z'},
};

export function CardName({id}:{id:string}) {
 const card=cards[id];
 if(!card.equipment&&!card.ally)return <>{card.name}</>;
 const sprite=cardSprites[id];
 return <span className="card-name-with-icon">{card.name}{sprite&&<svg width="16" height="16" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
  <path fill={sprite.color} d={sprite.pixels}/>
  {sprite.accent&&<path fill={sprite.accentColor??"#ebd4a6"} d={sprite.accent}/>}
  {sprite.detail&&<path fill="#39263d" d={sprite.detail}/>}
 </svg>}</span>;
}
