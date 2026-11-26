import React from 'react';

const portraits: Record<string, {coat: string; skin: string; hair: string; silhouette: string; detail: string; detailColor: string}> = {
 'Lord Godalming': {coat:'#536c62', skin:'#e2b088', hair:'#302739', silhouette:'M6 1h5v4h2v2H3V5h3z', detail:'M6 10h4v1H6zm1 2h2v3H7z', detailColor:'#e0bd78'},
 'Jonathan Harker': {coat:'#76614d', skin:'#e9bb96', hair:'#6a463b', silhouette:'M6 2h5v1h1v3h-2V4H7v2H4V4h2z', detail:'M6 11h4v1H6zm1 1h2v3H7z', detailColor:'#b96665'},
 'Van Helsing': {coat:'#5f5274', skin:'#cf9a72', hair:'#bbb1a8', silhouette:'M5 2h6v1h1v4h-2V4H6v3H4V3h1z', detail:'M5 8h2v1h2V8h2v2h-1v1H6v-1H5z', detailColor:'#bbb1a8'},
 'Dr. Seward': {coat:'#426a73', skin:'#e7b795', hair:'#554337', silhouette:'M6 2h5v1h1v3h-2V4H7v1H4V3h2z', detail:'M4 6h8v1h-1v1H9V7H7v1H5V7H4z', detailColor:'#d3b980'},
 'Mina Harker': {coat:'#865468', skin:'#ebbf9f', hair:'#84523c', silhouette:'M6 2h4v1h2v2h1v5h-2V6h-1V5H7v1H5v4H3V5h1V3h2z', detail:'M7 11h2v2H7zm-1 2h1v2H6zm3 0h1v2H9z', detailColor:'#eed599'},
 Dracula: {coat:'#843e55', skin:'#d6c1c1', hair:'#272333', silhouette:'M4 2h3v1h2V2h3v5h-2V5H9v1H7V5H6v2H4z', detail:'M5 6h2v1H5zm4 0h2v1H9zM3 10h2v2h2v3H4v-2H3zm8 0h2v3h-1v2H9v-3h2z', detailColor:'#f28c96'},
};

export function PlayerPortrait({name,exhausted=false}: {name: string; exhausted?: boolean}) {
 const portrait = portraits[name];
 if (!portrait) return null;
 return <span className="portrait-with-status"><svg className="player-portrait" width="32" height="32" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
  <path fill="#343041" d="M2 0h12v1h1v1h1v12h-1v1h-1v1H2v-1H1v-1H0V2h1V1h1z"/>
  <path fill={portrait.coat} d="M5 10h6v1h2v1h1v3H2v-3h1v-1h2z"/>
  <path fill={portrait.skin} d="M6 3h4v1h1v5h-1v1H9v1H7v-1H6V9H5V4h1z"/>
  <path fill="#302739" d="M6 6h1v1H6zm3 0h1v1H9z"/>
  <path fill={portrait.hair} d={portrait.silhouette}/>
  <path fill={portrait.detailColor} d={portrait.detail}/>
 </svg>{exhausted&&<svg className="exhausted-icon" width="20" height="20" viewBox="0 0 16 16" shapeRendering="crispEdges" role="img" aria-label="Exhausted">
  <title>Exhausted</title>
  <path fill="#433345" d="M1 0h14v1h1v14h-1v1H1v-1H0V1h1z"/>
  <path fill="#f49caa" d="M11 2h2v2h2v2h-2v2h-2V6H9V4h2z"/>
  <path fill="#e6d6dd" d="M2 6h1v4h2V8h3v2h5v2h1v2h-1v-1H3v1H2z"/>
 </svg>}</span>;
}
