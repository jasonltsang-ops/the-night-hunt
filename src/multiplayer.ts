import {active, cardsForReview, escapeDestinations, maxHP, nextCombatPlayer, pistolUsers, reduce, type Action, type State} from './engine';

export type Side='hunter'|'dracula';
export type OnlineAction=Action|{type:'finishReactions'};
export type MatchView={state:State;revision:number;side:Side;actingSide:Side|null;reactionWindow:boolean};

const normalActions=new Set([
 'chooseStart','play','advance','travel','market','trade','sacrificeEquipment','swap','placeEncounter','placeAlly',
 'wraithMove','wraithReturn','methodicalSearch','urgentDispatch','visionCity','visionReturn','medicalExpertise',
 'psychicConnection','assessmentDiscard','correspondenceTrade','resolveInvestigation',
]);

export function onlineTurn(s:State){
 if(s.winner)return {actingSide:null,reactionWindow:false};
 if(!s.combat)return {actingSide:active(s).side,reactionWindow:false};
 const chooser=nextCombatPlayer(s);
 if(chooser)return {actingSide:chooser.side,reactionWindow:false};
 const reactionWindow=s.combat.stage==='cards'&&!s.combat.onlineReactionsDone&&pistolUsers(s).length>0;
 return {actingSide:reactionWindow?'hunter' as const:'dracula' as const,reactionWindow};
}

export function applyOnlineAction(s:State,side:Side,action:OnlineAction){
 const turn=onlineTurn(s);
 if(!action||typeof action.type!=='string'||('debug' in action&&action.debug)||turn.actingSide!==side)throw Error('This action is unavailable for your side.');
 if(!s.combat){
  if(action.type==='market'&&!['acquire','deny','refresh'].includes(action.mode))throw Error('Choose a valid market action.');
  if(!normalActions.has(action.type))throw Error('This action is unavailable in online play.');
  return reduce(s,action as Action);
 }
 if(turn.reactionWindow){
  if(action.type==='finishReactions'){
   const next=structuredClone(s);
   next.combat!.onlineReactionsDone=true;
   return next;
  }
  if(action.type==='discardPistol')return reduce(s,action);
 }else if(nextCombatPlayer(s)){
  if(action.type==='combatCard')return reduce(s,action);
 }else{
  const expected={cards:'resolveCombat',damage:'allocateDamage',escape:'escape'}[s.combat.stage];
  if(action.type===expected)return reduce(s,action as Action);
 }
 throw Error('Finish the current showdown step first.');
}

function publicEntry(entry:string,side:Side){
 if(entry.startsWith('Debug:'))return null;
 if(side==='hunter')return entry;
 if(entry.startsWith('Cards permanently removed:'))return 'The Exhausted Hunter’s equipment and non-basic cards were removed.';
 if(entry.startsWith('Psychic Connection:'))return 'Mina resolved Psychic Connection.';
 if(entry.includes('discarded a hand card and traded'))return 'Two Hunters traded cards.';
 return entry;
}

export function matchView(s:State,side:Side,revision:number):MatchView{
 const state=structuredClone(s);
 const actor=active(s);
 const dracula=s.players[4];
 const publicDraculaCard=s.combat?.stage==='cards'&&!nextCombatPlayer(s)?s.combat.choices.dracula:-1;
 const escapeCities=side==='dracula'&&s.combat?.stage==='escape'?escapeDestinations(s):[];
 const reviewCount=side==='hunter'?cardsForReview(s):0;
 state.publicDraculaMaxHP=maxHP(s,dracula);
 state.players.forEach(player=>{
  const filler=player.side==='hunter'?'travel':'d-0';
  player.draw=player.draw.map(()=>filler);
  if(player.side!==side){
   player.hand=player.hand.map(()=>filler);
   player.discard=player.discard.map(()=>filler);
   if(player.side==='dracula')player.city=-1;
   const choice=state.combat?.choices[player.id];
   if(choice!==undefined&&choice>=0){
    state.combat!.choices[player.id]=0;
    if(player.side==='dracula'&&publicDraculaCard>=0)player.hand[0]=dracula.hand[publicDraculaCard];
   }
  }
 });
 state.locations.forEach((location,city)=>{
  location.resolved=location.resolved.map(()=> 'encounter');
  if(!(side==='dracula'&&s.pendingSwap)&&!escapeCities.includes(city))location.deck=location.deck.map((card,index)=>{
   const reviewing=side==='hunter'&&((city===actor.city&&index<reviewCount)||(city===s.pendingVision?.city&&index===0));
   const wraithPeek=side==='dracula'&&s.pendingWraith?.stage==='peek'&&s.pendingWraith.city===city&&index===location.deck.length-1;
   return reviewing||wraithPeek?card:'encounter';
  });
  if(side==='hunter'){
   if(location.ally&&!location.ally.revealed)location.ally.card='dm-4';
   if(location.wraith&&!location.wraith.revealed){
    location.wraith.card='dm-4';
    if(!location.ally){location.ally=location.wraith;location.wraith=null;}
   }
  }
 });
 if(side==='hunter'){
  if(state.pendingAlly)state.pendingAlly='dm-4';
  state.pendingWraith=null;
 }
 if(side==='dracula'&&state.pendingVision)state.pendingVision.city=null;
 const filter=(entries:string[])=>entries.flatMap(entry=>publicEntry(entry,side)??[]);
 state.log=filter(state.log);
 if(state.latestResolution)state.latestResolution.entries=filter(state.latestResolution.entries);
 for(const zone of ['draw','discard','denied'] as const)state.market[zone]=state.market[zone].map(()=> 'travel');
 return {state,side,revision,...onlineTurn(s)};
}
