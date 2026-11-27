import {describe,expect,it} from 'vitest';
import {cards,draculaMarket,hunterMarket,maturationCards} from './data';
import {createGame,createSetup,darkness,hp,parseSave,reduce,type State} from './engine';
import {applyOnlineAction,matchView} from './multiplayer';
import {createMatchHandler,type Room} from './multiplayer-server';

const load=(s:State)=>parseSave(JSON.stringify(s));
const activate=(s:State,target?:number)=>reduce(s,{type:'facility',discardIndex:0,target});
function hunterAt(city:number){
 const s=createGame(undefined,8),p=s.players[0];
 p.city=city;p.hand=['travel','combat','hm-1'];
 return s;
}
function nextDay(s:State){
 s.phase='night';s.turn=4;
 return reduce(s,{type:'advance',debug:true});
}
function deploy(s:State,id:string,city:number){
 s.phase='day';s.turn=4;s.played=false;s.players[4].hand=[id];
 return reduce(reduce(s,{type:'play',index:0}),{type:'placeAlly',city});
}

describe('Vampire Maturation release',()=>{
 it('has 30 Hunter and 16 Dracula market cards with one copy of each new card',()=>{
  expect(hunterMarket).toHaveLength(30);expect(draculaMarket).toHaveLength(16);
  for(const id of maturationCards)expect(draculaMarket.filter(card=>card===id)).toHaveLength(1);
 });
 it.each(maturationCards.flatMap(id=>['day','night'].map(phase=>[id,phase] as const)))('plays and discards %s at %s',(id,phase)=>{
  const s=createGame(undefined,8);
  s.phase=phase as State['phase'];s.turn=phase==='day'?4:0;
  const d=s.players[4];d.hand=[id];d.damage=2;
  const n=reduce(s,{type:'play',index:0,city:0});
  expect(n.maturation).toBe(phase==='night'&&id==='dm-blood-rites'?2:1);
  expect(n.players[4].damage).toBe(phase==='night'&&id==='dm-blood-offering'?1:2);
  expect(n.locations[0].deck).toHaveLength(phase==='night'&&id==='dm-midnight-ritual'?5:4);
  expect(n.players[4].discard).toContain(id);expect(n.played).toBe(true);
  expect(load(n)).toEqual(n);
 });
 it('carries excess, awards permanent Darkness and checks victory immediately',()=>{
  const s=createGame();s.maturation=6;s.eventDarkness=7;s.phase='night';s.players[4].hand=['dm-blood-rites'];
  const n=reduce(s,{type:'play',index:0});
  expect(n.maturation).toBe(1);expect(darkness(n).total).toBe(10);expect(n.winner).toBe('dracula');
 });
 it('advances at dawn without issuing a separate week bonus',()=>{
  const s=createGame();s.round=7;s.maturation=1;s.maturationDarkness=3;
  const n=nextDay(s);expect(n.round).toBe(8);expect(n.maturation).toBe(2);expect(darkness(n).total).toBe(3);
  expect(n.log.join(' ')).toContain('Completed Day/Night cycle');
 });
 it('caps Blood Offering and rejects invalid or consecrated Ritual targets',()=>{
  const s=createGame(undefined,8);s.phase='night';s.players[4].hand=['dm-blood-offering'];
  expect(hp(reduce(s,{type:'play',index:0}),s.players[4])).toBe(s.config.draculaHP);
  s.players[4].hand=['dm-midnight-ritual'];s.locations[0].closed=true;
  for(const city of [undefined,0,-1,9,1.5])expect(()=>reduce(s,{type:'play',index:0,city})).toThrow('open city');
  expect(s.players[4].hand).toEqual(['dm-midnight-ritual']);
 });
 it('keeps a permanent point for each Ally, including equipment and consecration removal',()=>{
  let s=deploy(createGame(undefined,8),'dm-5',0);s=deploy(s,'dm-4',1);
  expect(darkness(s).total).toBe(4);
  s.turn=0;s.played=false;s.players[0].equipment=['hm-3'];
  s=reduce(s,{type:'sacrificeEquipment',index:0});expect(darkness(s).total).toBe(3);
  s.players[0].city=1;s.played=false;
  s.locations[1].resolved.push(...s.locations[1].deck.splice(1));
  s.players[0].hand=['investigate'];s=reduce(s,{type:'play',index:0});
  expect(s.locations[1].closed).toBe(true);expect(darkness(s).total).toBe(2);
 });
 it('Wraith movement and reload retain the same Darkness total',()=>{
  let s=deploy(createGame(undefined,8),'dm-6',0);
  s.phase='night';s.turn=0;s.played=false;s.pendingWraith={city:0,stage:'move'};
  s=reduce(s,{type:'wraithMove',city:1});expect(darkness(load(s)).total).toBe(2);
 });
 it('uses each Renfield reserve encounter once across save and reload',()=>{
  let s=deploy(createGame(undefined,8),'dm-renfield',0);
  for(const remaining of [2,1,0,0]){
   s.phase='day';s.turn=4;s=load(reduce(s,{type:'advance',debug:true}));
   expect(s.locations[0].ally?.reserve).toHaveLength(remaining);
  }
  expect(s.locations[0].deck).toHaveLength(7);
 });
 it('preserves v7 score and progress without inserting another copy on reload',()=>{
  const s=createGame(undefined,8);
  const old={...s,version:7,round:10,config:{...s.config,allyDarkness:2}};
  old.locations[0].ally={card:'dm-5'};
  for(const zone of ['face','draw'] as const)old.market[zone]=old.market[zone].filter(id=>!maturationCards.includes(id));
  const n=parseSave(JSON.stringify(old));
  expect(darkness(n).total).toBe(5);expect(n.maturation).toBe(2);
  expect([...n.market.face,...n.market.draw]).toHaveLength(46);expect(load(n)).toEqual(n);
 });
});

describe('starting groups',()=>{
 it.each([1,2,3,4])('adds one encounter per additional Hunter in a group of %s',count=>{
  let s=createSetup();
  for(let i=0;i<4;i++)s=load(reduce(s,{type:'chooseStart',player:'h'+i,city:i<count?0:i}));
  expect(s.locations[0].deck).toHaveLength(3+count);
  s=load(reduce(s,{type:'chooseStart',player:'dracula',city:0}));
  expect(s.locations[0].deck).toHaveLength(3+count);
  expect(s.locations[0].deck.filter(card=>card==='dracula')).toHaveLength(1);
  expect(s.locations.flatMap(l=>l.deck)).toHaveLength(35+count);
  s.players[0].hand=['travel'];s=reduce(s,{type:'play',index:0});
  expect(reduce(s,{type:'travel',city:1}).locations[1].deck).toHaveLength(4);
 });
});

describe('city facilities',()=>{
 it('uses the Hospital in a consecrated city, pays once, shares usage and resets at dawn',()=>{
  const s=hunterAt(0);const p=s.players[0];p.damage=2;
  s.locations[0].resolved.push(...s.locations[0].deck.splice(0));s.locations[0].closed=true;
  let n=load(activate(s));expect(n.players[0].damage).toBe(1);expect(n.players[0].discard).toEqual(['travel']);expect(n.played).toBe(true);
  n.players[1].city=0;n.players[1].damage=1;n=reduce(n,{type:'advance'});
  expect(()=>activate(n)).toThrow('Already used');expect(nextDay(n).facilitiesUsed).toEqual([]);
 });
 it('Archives publicly exposes identity without resolving it or leaking the shuffled deck',()=>{
  const s=hunterAt(1);s.locations[8].deck[s.locations[8].deck.indexOf('dracula')]='encounter';
  s.locations[1].deck[0]='dracula';s.players[4].city=1;
  const n=applyOnlineAction(s,'hunter',{type:'facility',discardIndex:0});
  for(const side of ['hunter','dracula'] as const)expect(matchView(n,side,2).state.log.join(' ')).toContain('Publicly revealed Dracula');
  expect(n.combat).toBeNull();expect(n.locations[1].deck).toContain('dracula');expect(n.locations[1].resolved).toEqual([]);
  expect(matchView(n,'hunter',2).state.locations[1].deck).not.toContain('dracula');
  expect(matchView(n,'hunter',2).state.players[4].city).toBe(-1);
 });
 it.each([2,5])('moves from %s without a Brush and adds only the Stables accident',city=>{
  const s=hunterAt(city),destination=city===2?1:4;
  expect(()=>activate(s,0)).toThrow('adjacent');
  const n=activate(s,destination);expect(n.players[0].city).toBe(destination);
  expect(n.locations[destination].deck.filter(card=>card==='damaging')).toHaveLength(s.locations[destination].deck.filter(card=>card==='damaging').length+(city===5?1:0));
  expect(n.addedBasicEncounters).toBe(0);
  if(city===5){s.locations[destination].closed=true;expect(activate(s,destination).locations[destination].deck).toEqual(s.locations[destination].deck);}
 });
 it('Bazaar permanently trashes and replaces only a Hunter card',()=>{
  const s=hunterAt(3);s.market.face=['hm-3','dm-4'];s.market.draw=['hm-2'];
  expect(()=>activate(s,1)).toThrow('Hunter market card');
  const n=activate(s,0);expect(n.market.face).toEqual(['hm-2','dm-4']);
  expect(n.market.denied).toContain('hm-3');expect(n.players[0].discard).toEqual(['travel']);
 });
 it('Trading House follows normal discard, immediate equipment and Item acquisition',()=>{
  const s=hunterAt(6);s.market.face=['hm-3','dm-4','hm-1'];s.locations[6].ally={card:'dm-5'};s.permanentAllyDarkness=1;
  expect(()=>activate(s,1)).toThrow('Hunter market card');expect(activate(s,0).players[0].discard).toContain('hm-3');
  expect(reduce(s,{type:'facility',discardIndex:0,target:0,destination:'equipment'}).players[0].equipment).toContain('hm-3');
  const used=reduce(s,{type:'facility',discardIndex:0,target:2,destination:'use',ally:'dm-5'});
  expect(used.locations[6].ally).toBeNull();expect(darkness(used).total).toBe(1);
 });
 it('Public Square draws with a reshuffle and consumes the action',()=>{
  const s=hunterAt(7);s.players[0].draw=[];s.players[0].discard=['investigate'];
  const n=activate(s);expect(n.players[0].hand).toHaveLength(3);expect(n.players[0].draw).toHaveLength(1);
  expect(()=>reduce(n,{type:'play',index:0,choice:'heal'})).toThrow('already used');
 });
 it.each([1,2])('Monastery can trash either a basic or non-basic card at index %s',index=>{
  const s=hunterAt(8);const hand=s.players[0].hand;
  expect(()=>activate(s,0)).toThrow('different');
  const n=activate(s,index);expect(n.players[0].hand).not.toContain(hand[index]);expect(n.players[0].discard).toEqual(['travel']);
 });
 it('rejects Night, Munich, missing cost, empty archives, recovery and a different online side without changing state',()=>{
  const s=hunterAt(1),original=structuredClone(s);
  expect(()=>reduce(s,{type:'facility',discardIndex:-1})).toThrow('discard');
  expect(()=>applyOnlineAction(s,'dracula',{type:'facility',discardIndex:0})).toThrow();
  expect(s).toEqual(original);
  s.locations[1].deck=[];expect(()=>activate(s)).toThrow('No encounters');
  s.players[0].city=4;expect(()=>activate(s)).toThrow('No facility');
  s.players[0].city=7;s.players[0].recovery='resting';expect(()=>activate(s)).toThrow('recovering');
  s.phase='night';s.turn=1;expect(()=>activate(s)).toThrow('Day');
 });
 it('synchronizes the facility and Maturation state through the match API and reconnect',async()=>{
  const state=hunterAt(7);state.maturation=4;
  let room:Room={id:'a'.repeat(32),tokens:{hunter:'b'.repeat(32),dracula:'c'.repeat(32)},state,revision:0};
  const handler=createMatchHandler({get:()=>room,create:()=>{},update:(next,revision)=>{
   if(revision!==room.revision)return false;
   room=JSON.parse(JSON.stringify(next));return true;
  }});
  const url='https://test.local/api/matches/'+room.id;
  const post=await handler(new Request(url,{method:'POST',headers:{Authorization:'Bearer '+room.tokens.hunter},body:JSON.stringify({revision:0,action:{type:'facility',discardIndex:0}})}));
  expect(post.status).toBe(200);
  const response=await handler(new Request(url,{headers:{Authorization:'Bearer '+room.tokens.dracula}}));
  const view=await response.json();
  expect(view.revision).toBe(1);expect(view.state.facilitiesUsed).toEqual([7]);expect(view.state.maturation).toBe(4);
  expect(view.state.players[0].hand.every((id:string)=>cards[id].id==='travel')).toBe(true);
 });
});

it.each(['travel','hm-1'])('A Lucky Find permanently trashes %s and discards itself',target=>{
 const s=hunterAt(0);s.players[0].hand=['combat',target];
 const n=reduce(s,{type:'play',index:0,choice:'trash',trashIndex:1});
 expect(n.players[0].hand).toEqual([]);expect(n.players[0].discard).toEqual(['combat']);
});
