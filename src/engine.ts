import { retiredDraculaCards, newDraculaCombatCards, recklessAssault, extraUncoverConspiracy, addedInvestigationCopies, addedHunterCopies, retiredHunterCards, adjacent, cities, combatOrder, eventCards, cards, defaults, draculaMarket, hunterMarket, hunters, signatures } from './data';
export type Player = {id:string; name:string; side:'hunter'|'dracula'; city:number; hand:string[]; draw:string[]; discard:string[]; damage:number; equipment:string[]; recovery:'none'|'waiting'|'resting'|'ready'};
export type Encounter = 'encounter'|'dracula'|'damaging';
export type DeployedAlly = {card:string;revealed:boolean};
export type Location = {deck:Encounter[]; resolved:Encounter[]; closed:boolean; ally:DeployedAlly|null; wraith:DeployedAlly|null};
export function setupLocations(start:number):Location[]{if(!Number.isInteger(start)||start<0||start>8)throw Error('Invalid Dracula starting city.');return cities.map((_,i)=>({deck:shuffle<Encounter>(['encounter','encounter','encounter','encounter',i===start?'dracula':'encounter']),resolved:[],closed:false,ally:null,wraith:null}));}
export function draculaLocation(s:State){return s.locations.findIndex(l=>l.deck.includes('dracula')||l.resolved.includes('dracula'));}
export type Market = {face:string[]; draw:string[]; discard:string[]; denied:string[]};
export type State = {version:7; draculaMarketUpdated?:true|2; hunterMarketUpdated?:true|2|3; investigationCopiesAdded?:true|2; pendingInvestigation?:string; correspondence?:{stage:'trade'}|{stage:'play';index:number}; pendingGroupPassage?:true; pendingAssessment?:true; nightPlay?:'choose'|'resolve'; latestResolution?:{entries:string[];debug:boolean}; eventCardsAdded:boolean; setupIndex:number|null; pendingSearch:string|null; pendingDispatch:string|null; pendingWraith:{city:number;stage:'move'|'peek'}|null; eventDarkness:number; exhaustionDarkness:number; pendingVision:{player:string;city:number|null}|null; pendingMedical:string|null; pendingPsychic:string|null; pendingFortune:number; pendingAlly:string|null; combat:Combat|null; locations:Location[]; pendingSwap:boolean; pendingEncounter:boolean; winner:null|'hunters'|'dracula'; round:number; phase:'day'|'night'; turn:number; played:boolean; pendingSupply:boolean; pendingInfluence:boolean; pendingTravel:number; pendingTravelEncounter:boolean; addedBasicEncounters:number; players:Player[]; market:Market; log:string[]; config:typeof defaults};
export function shuffle<T>(a:T[],rng:()=>number=Math.random):T[] { const b=[...a]; for(let i=b.length-1;i>0;i--){const j=Math.floor(rng()*(i+1)); [b[i],b[j]]=[b[j],b[i]];} return b; }
export function draw(p:Player,n:number) { for(let i=0;i<n;i++){if(!p.draw.length){p.draw=shuffle(p.discard);p.discard=[];} const c=p.draw.pop();if(c)p.hand.push(c);} }
function market(deck:string[]):Market {const all=shuffle(deck);return {face:all.splice(0,10),draw:all,discard:[],denied:[]};}
export function createGame(selected=[0,1,2,3],start=Math.floor(Math.random()*9)):State {
 if(selected.length!==4 || new Set(selected).size!==4 || selected.some(i=>!Number.isInteger(i)||i<0||i>4))throw Error('Choose four different Hunters.');
 const players:Player[]=selected.map((i,n)=>({id:`h${n}`,name:hunters[i],side:'hunter',city:0,damage:0,equipment:[],recovery:'none',hand:[],draw:shuffle(['travel','travel','supply','supply','investigate','investigate','combat',...signatures[i]]),discard:[]}));
 players.push({id:'dracula',name:'Dracula',side:'dracula',city:start,damage:0,equipment:[],recovery:'none',hand:[],draw:shuffle(['d-0','d-0','d-0','d-0','d-2','d-2','d-3','d-3','d-4']),discard:[]});players.forEach(p=>draw(p,defaults.handSize));
 return {version:7,draculaMarketUpdated:2,hunterMarketUpdated:3,investigationCopiesAdded:2,eventCardsAdded:true,setupIndex:null,pendingSearch:null,pendingDispatch:null,pendingWraith:null,eventDarkness:0,exhaustionDarkness:0,pendingVision:null,pendingMedical:null,pendingPsychic:null,pendingFortune:0,pendingAlly:null,combat:null,locations:setupLocations(start),pendingSwap:false,pendingEncounter:false,winner:null,round:1,phase:'day',turn:0,played:false,pendingSupply:false,pendingInfluence:false,pendingTravel:0,pendingTravelEncounter:false,addedBasicEncounters:0,players,market:market([...hunterMarket,...draculaMarket]),log:['Game created. Dracula has 10 HP; Hunters have 4 HP. Discovery starts combat.'],config:{...defaults}};
}
function refillMarket(m:Market,target=m.face.length){
 const before=m.face.length;
 if(before<=3)target=10;
 while(m.face.length<target){
  if(!m.draw.length&&m.discard.length){m.draw=shuffle(m.discard);m.discard=[];}
  const next=m.draw.pop();
  if(!next)break;
  m.face.push(next);
 }
 return m.face.length-before;
}
export function cardPhase(s:State){return s.nightPlay?'night':s.phase;}
export function active(s:State) {if(s.setupIndex!==null&&s.setupIndex!==undefined)return s.players[s.setupIndex];return s.players[s.phase==='day'?s.turn:s.turn===0?4:s.turn-1];}
type CombatTarget = {player:string;equipmentIndex?:number};
export type Combat = {pistolStrength?:Record<string,number>;cancelledDraculaCard?:true; discardedEquipmentStrength?:number;pendingKnockouts?:string[];city:number; hunters:string[]; stage:'cards'|'damage'|'escape'; choices:Record<string,number>; hunterStrength:number; draculaStrength:number; damage:number; escape:'mist'|'bats'|null};
export type TradeReceipt={destination:'hand'|'discard'|'equipment';replaceIndex?:number;replacedDestination?:'discard'|'trash'};
export type Action = {type:'resolveInvestigation';index?:number;repeat?:boolean}|{type:'correspondenceTrade';player:string;offerIndex:number;receiveIndex:number}|{type:'discardPistol';player:string}|{type:'assessmentDiscard';index:number}|{type:'methodicalSearch';index:number}|{type:'urgentDispatch';player:string;city:number}| {type:'chooseStart';player:string;city:number}| {type:'wraithMove';city:number}|{type:'wraithReturn';position:'top'|'bottom'}|{type:'sacrificeEquipment';index:number;ally?:string}| {type:'removeAlly';city:number;debug:true;card?:string}| {type:'trade';player:string;discardIndex:number;offerIndex:number;receiveIndex:number;offerZone?:'hand'|'equipment';receiveZone?:'hand'|'equipment';receiveTo?:TradeReceipt;partnerTo?:TradeReceipt}| {type:'visionCity';city:number}|{type:'visionReturn';position:'top'|'bottom'}| {type:'medicalExpertise';player:string}| {type:'psychicConnection';player:string}| {type:'placeAlly';city:number}| {type:'combatCard';player:string;index:number}|{type:'resolveCombat';target?:CombatTarget}|{type:'allocateDamage';extra:string[]}|{type:'escape';city:number|null;index?:number}| {type:'placeEncounter';city:number}| {type:'swap';moveDracula:boolean;from:number;to:number;fromIndex:number;toIndex:number}|{type:'investigate';player:string;debug:true}|{type:'stack';city:number;card:Encounter}| {type:'play';index:number;ally?:string;healTarget?:string;choice?:'heal'|'combat';replaceIndex?:number;replacedDestination?:'discard'|'trash'}|{type:'travel';city:number;companions?:string[]}|{type:'advance';debug?:boolean}|{type:'market';index:number;ally?:string;mode:'acquire'|'deny'|'replace'|'refresh';player:string;debug?:boolean;destination?:'discard'|'equipment'|'use';replaceIndex?:number;replacedDestination?:'discard'|'trash'}|{type:'draw';player:string}|{type:'add';player:string;card:string}|{type:'remove';player:string;zone:'hand'|'draw'|'discard';index:number}|{type:'city';player:string;city:number};
export function reduce(state:State,a:Action):State {
 const s=structuredClone(state);const p=active(s);let message='';
 const player=('player' in a)?s.players.find(p=>p.id===a.player):undefined;
 if('player' in a && !player)throw Error('Unknown player.');
 if(s.setupIndex!==null&&s.setupIndex!==undefined){if(a.type!=='chooseStart')throw Error('Finish choosing starting cities before playing.');if(a.player!==p.id||!Number.isInteger(a.city)||a.city<0||a.city>8)throw Error('Choose a valid city for the current setup player.');p.city=a.city;if(s.setupIndex<4){s.log.push(`${p.name} chose ${cities[a.city]} as their starting city.`);s.setupIndex++;}else{s.locations=setupLocations(a.city);s.setupIndex=null;s.log.push('Dracula chose his hidden starting city after the Hunters. All city encounter piles shuffled.');s.log.push(`Game begins: ${active(s).name}, Day.`);}recordResolution(state,s,a);return s;}
 if(a.type==='chooseStart')throw Error('Starting locations have already been chosen.');
 if(s.winner&&['discardPistol','combatCard','resolveCombat','allocateDamage','escape','play','travel','swap','advance','market','investigate','placeEncounter','placeAlly','trade','psychicConnection','medicalExpertise','correspondenceTrade','assessmentDiscard','visionCity','visionReturn','methodicalSearch','resolveInvestigation','urgentDispatch','removeAlly','sacrificeEquipment','wraithMove','wraithReturn'].includes(a.type))throw Error('Game over: '+(s.winner==='hunters'?'Dracula was defeated.':'Dracula reached the Darkness target.')+' Start a new game to continue.');
 if(s.pendingWraith&&!['wraithMove','wraithReturn'].includes(a.type))throw Error('Resolve Wraith’s Night movement and examination before continuing.');
 if(a.type==='wraithMove'){moveWraith(s,a.city);message=`Wraith moved to ${cities[a.city]}. Dracula privately examined the bottom encounter.`;}
 if(a.type==='wraithReturn'){returnWraithEncounter(s,a.position);message='Wraith returned the privately examined encounter to its pile.';}
 if(a.type==='sacrificeEquipment'){message=sacrificeEquipment(s,a.index,a.ally);}
 if(s.combat&&!['discardPistol','combatCard','resolveCombat','allocateDamage','escape'].includes(a.type))throw Error('Resolve combat before continuing.');
 if(p.recovery!=='none'&&a.type==='play')throw Error('This Hunter is recovering; end the turn.');
 if(a.type==='combatCard'){message=chooseCombatCard(s,a.player,a.index);}
 if(a.type==='discardPistol'){
  if(!pistolUsers(s).some(h=>h.id===a.player))throw Error('A participating Hunter must have a Pistol equipped and all combatants must finish choosing cards.');
  const index=player!.equipment.findIndex(id=>cards[id].discardStrength!==undefined);
  const [id]=player!.equipment.splice(index,1);
  const bonus=cards[id].discardStrength!;
  player!.discard.push(id);
  const combat=s.combat!;
  const bonuses=combat.pistolStrength??={};
  bonuses[player!.id]=(bonuses[player!.id]??0)+bonus;
  message=`${player!.name} discarded ${cards[id].name} for +${bonus} Strength in this showdown.`;
 }
 if(a.type==='resolveCombat'){message=resolveCombat(s,a.target);}
 if(a.type==='allocateDamage'){message=allocateDamage(s,a.extra);}
 if(a.type==='escape'){message=escapeCombat(s,a.city,a.index);}
 if(s.pendingInvestigation&&!s.combat&&a.type!=='resolveInvestigation'&&!(a.type==='advance'&&a.debug))throw Error('Resolve the investigation choice before continuing.');
 if(a.type==='resolveInvestigation')message=resolveInvestigationChoice(s,p,a);
 if(s.pendingSearch&&a.type!=='methodicalSearch'&&!(a.type==='advance'&&a.debug))throw Error('Resolve Methodical Search before continuing.');
 if(s.pendingDispatch&&a.type!=='urgentDispatch'&&!(a.type==='advance'&&a.debug))throw Error('Resolve Urgent Dispatch before continuing.');
 if(a.type==='methodicalSearch'){if(s.pendingSearch!==p.id||!Number.isInteger(a.index)||a.index<0||a.index>=Math.min(2,s.locations[p.city].deck.length))throw Error('Choose one of the examined encounters.');const l=s.locations[p.city],chosen=l.deck.splice(a.index,1)[0];l.deck=shuffle(l.deck);l.deck.unshift(chosen);s.pendingSearch=null;investigate(s,p,'Methodical Search: ');}
 if(a.type==='urgentDispatch'){if(s.pendingDispatch!==p.id||!dispatchTargets(s).some(h=>h.id===a.player)||!adjacent(player!.city,a.city))throw Error('Choose a conscious Hunter and an orthogonally adjacent destination.');const from=player!.city;player!.city=a.city;s.pendingDispatch=null;message=`Urgent Dispatch: ${p.name} moved ${player!.name} from ${cities[from]} to ${cities[a.city]}.`;}
 if(s.pendingAlly&&a.type!=='placeAlly'&&!(a.type==='advance'&&a.debug))throw Error('Place the ally before continuing.');
 if(a.type==='removeAlly'){if(a.debug!==true)throw Error('Ally removal is currently a debug tool.');removeLocationAlly(s,a.city,a.card);message=`Debug: removed the ally in ${cities[a.city]}. Ally Darkness decreased by 1.`;}
 if(a.type==='placeAlly'){
  const card=s.pendingAlly;
  if(!card||p.side!=='dracula')throw Error('Play an ally first.');
  if(!canPlaceAlly(s,card,a.city))throw Error('Choose an open city with no ally in the required slot.');
  const before=hp(s,s.players[4]),capacity=maxHP(s,s.players[4]);
  const deployed={card,revealed:false};
  if(card==='dm-6')s.locations[a.city].wraith=deployed;else s.locations[a.city].ally=deployed;
  s.pendingAlly=null;adjustCapacity(s,s.players[4],before,capacity);
  message=`Dracula placed an ally in ${cities[a.city]}. +1 Ally Darkness while it remains in play.`;
 }
 if(s.pendingPsychic&&a.type!=='psychicConnection'&&!(a.type==='advance'&&a.debug))throw Error('Resolve Psychic Connection before continuing.');
 if(a.type==='psychicConnection'){const mina=s.players.find(p=>p.id===s.pendingPsychic);if(!mina||mina.id!==p.id||!psychicTargets(s,mina.id).some(h=>h.id===a.player))throw Error('Choose another conscious Hunter at Mina’s city with a card in hand.');const index=Math.floor(Math.random()*player!.hand.length);player!.discard.push(player!.hand.splice(index,1)[0]);const city=draculaLocation(s);const near=Math.abs(city%3-mina.city%3)<=1&&Math.abs(Math.floor(city/3)-Math.floor(mina.city/3))<=1;s.pendingPsychic=null;message=`Psychic Connection: ${player!.name} discarded a random card. ${near?'The Count’s presence is near.':'The Count’s presence is distant.'}`;}
 if(s.correspondence?.stage==='trade'&&a.type!=='correspondenceTrade'&&!(a.type==='advance'&&a.debug))throw Error('Finish the Correspondence exchange before continuing.');
 if(s.correspondence?.stage==='play'&&a.type!=='play'&&a.type!=='advance')throw Error('Play the received card or end the turn.');
 if(a.type==='correspondenceTrade'){
  const offered=p.hand[a.offerIndex],received=player!.hand[a.receiveIndex];
  if(s.correspondence?.stage!=='trade'||!correspondencePartners(s).includes(player!)||!Number.isInteger(a.offerIndex)||!Number.isInteger(a.receiveIndex)||!offered||!received)throw Error('Choose one card from each Hunter’s hand for Correspondence.');
  p.hand[a.offerIndex]=received;
  player!.hand[a.receiveIndex]=offered;
  s.correspondence={stage:'play',index:a.offerIndex};
  if(!canPlayStandard(s,p,received,a.offerIndex))delete s.correspondence;
  message=`${p.name} exchanged hand cards with ${player!.name} using Correspondence.${s.correspondence?' The received card may be played immediately.':''}`;
 }
 if(s.pendingAssessment&&a.type!=='assessmentDiscard'&&!(a.type==='advance'&&a.debug))throw Error('Choose a discard for Clinical Assessment before continuing.');
 if(a.type==='assessmentDiscard'){
  if(!s.pendingAssessment||!Number.isInteger(a.index)||!p.hand[a.index])throw Error('Choose a card from your hand to discard for Clinical Assessment.');
  p.discard.push(p.hand.splice(a.index,1)[0]);
  delete s.pendingAssessment;
  message=`${p.name} discarded one card for Clinical Assessment.`;
 }
 if(s.pendingMedical&&a.type!=='medicalExpertise'&&!(a.type==='advance'&&a.debug))throw Error('Resolve Medical Expertise before continuing.');
 if(a.type==='medicalExpertise'){if(s.pendingMedical!==p.id||!medicalTargets(s,p.id).some(h=>h.id===a.player))throw Error('Choose a conscious Hunter at Dr. Seward’s city.');const healed=Math.min(player!.damage,cards['signature-3-0'].healing??2);player!.damage-=healed;s.pendingMedical=null;message=`Medical Expertise: ${p.name} healed ${player!.name} for ${healed} HP (${hp(s,player!)} / ${maxHP(s,player!)} HP).`;}
 if(s.pendingVision&&!['visionCity','visionReturn'].includes(a.type)&&!(a.type==='advance'&&a.debug))throw Error('Resolve Shared Vision before continuing.');
 if(a.type==='visionCity'){if(!s.pendingVision||s.pendingVision.city!==null||!visionCities(s,s.pendingVision.player).includes(a.city))throw Error('Choose another city with an encounter card.');s.pendingVision.city=a.city;message='Shared Vision: Mina privately examined the top encounter in another city.';}
 if(a.type==='visionReturn'){const v=s.pendingVision;if(!v||v.city===null||!['top','bottom'].includes(a.position))throw Error('Examine a city first, then choose top or bottom.');const deck=s.locations[v.city].deck;if(!deck.length)throw Error('The selected encounter deck is empty.');if(a.position==='bottom')deck.push(deck.shift()!);s.pendingVision=null;message='Shared Vision: Mina returned the examined encounter to its pile.';}
 if(a.type==='trade'){
 if(p.side!=='hunter'||p.recovery!=='none'||s.played||!tradePartners(s).some(h=>h.id===a.player))throw Error('Trade requires your unused action and another conscious Hunter at your city.');
 const offerZone=a.offerZone??'hand',receiveZone=a.receiveZone??'hand';
 if(!['hand','equipment'].includes(offerZone)||!['hand','equipment'].includes(receiveZone)||!Number.isInteger(a.discardIndex)||!Number.isInteger(a.offerIndex)||!Number.isInteger(a.receiveIndex)||a.discardIndex<0||a.offerIndex<0||a.receiveIndex<0||(offerZone==='hand'&&a.discardIndex===a.offerIndex)||!p.hand[a.discardIndex]||!p[offerZone][a.offerIndex]||!player![receiveZone][a.receiveIndex])throw Error('Choose a hand discard, a different hand card or equipped item to offer, and a partner card or equipment.');
 const offered=p[offerZone][a.offerIndex],received=player![receiveZone][a.receiveIndex];
 p.discard.push(p.hand.splice(a.discardIndex,1)[0]);
 const before=hp(s,p),capacity=maxHP(s,p),otherHP=hp(s,player!),otherMax=maxHP(s,player!);
 p[offerZone].splice(a.offerIndex-(offerZone==='hand'&&a.discardIndex<a.offerIndex?1:0),1);player![receiveZone].splice(a.receiveIndex,1);
 if(offerZone==='equipment')adjustCapacity(s,p,before,capacity);if(receiveZone==='equipment')adjustCapacity(s,player!,otherHP,otherMax);
 receiveTrade(s,p,received,a.receiveTo??{destination:receiveZone==='equipment'?'discard':'hand'},offerZone==='hand'?a.offerIndex-(a.discardIndex<a.offerIndex?1:0):undefined);
 receiveTrade(s,player!,offered,a.partnerTo??{destination:offerZone==='equipment'?'discard':'hand'},receiveZone==='hand'?a.receiveIndex:undefined);
 s.played=true;message=`${p.name} discarded a hand card and traded ${cards[offered].name} (${offerZone}) for ${cards[received].name} (${receiveZone}) with ${player!.name}.`;
 }

 if(a.type==='play') {if(s.played&&s.nightPlay!=='choose'&&s.correspondence?.stage!=='play')throw Error('The standard card play is already used.');const phase=cardPhase(s);const c=p.hand[a.index];if(s.correspondence?.stage==='play'&&(s.correspondence.index!==a.index||!canPlayStandard(s,p,c,a.index)))throw Error('Correspondence only allows playing the exact received card.');if(!c||!cards[c].timing.includes(phase)||cards[c].side!==p.side)throw Error('Card cannot be played now.');if(combatCardAllowed(c)&&c!=='combat'&&!cards[c].item)throw Error('Keep this card in hand for combat.');if(c==='combat'&&a.choice==='combat')throw Error('Choose this card when combat begins; it is not a standard play.');if(c==='combat'&&!['heal','combat'].includes(a.choice??''))throw Error('Choose healing or combat for A Lucky Find.');if(c==='d-2'&&!s.locations.some((l,i)=>l.deck.some(c=>c!=='dracula')&&s.locations.some((other,j)=>j!==i&&other.deck.some(c=>c!=='dracula')))&&!s.locations.some((l,i)=>l.deck.length&&adjacent(draculaLocation(s),i)))throw Error('No legal Shadow Passage swap is available.');if(cards[c].ally&&!cities.some((_,city)=>canPlaceAlly(s,c,city)))throw Error('Every city is consecrated or already has an ally in the required slot.');if(c==='signature-4-0'&&!psychicTargets(s,p.id).length)throw Error('Psychic Connection requires another conscious Hunter in your city with a card in hand.');if(c==='signature-4-1'&&!visionCities(s,p.id).length)throw Error('Shared Vision requires another city with an encounter card.');if(c==='signature-2-0'&&(p.hand.length<2||!correspondencePartners(s).length))throw Error('Correspondence requires another card in hand and a conscious Hunter with a card to exchange.');if(s.nightPlay==='choose')s.nightPlay='resolve';delete s.correspondence;p.hand.splice(a.index,1);if(!cards[c].trashOnPlay)p.discard.push(c);s.played=true;s.pendingSupply=c==='supply';s.pendingFortune=c==='signature-0-0'?2:0;s.pendingInfluence=c==='d-3';s.pendingTravel=(phase==='night'?cards[c].nightTravel:undefined)??cards[c].travel??0;if(cards[c].groupTravel)s.pendingGroupPassage=true;s.pendingTravelEncounter=c==='travel'&&phase==='night';s.pendingSwap=c==='d-2';s.pendingEncounter=c==='d-0';message=`${p.name} played ${cards[c].name}.${c==='supply'?(phase==='day'?' Acquire a Hunter card or deny a Dracula card in the shared market.':' Trash one face-up market card and refill its slot from the market draw pile.'):s.pendingEncounter?(phase==='night'?' Choose any city for the Savage Attack.':' Choose Dracula’s city or an orthogonally adjacent city.'):s.pendingInfluence?(phase==='night'?' Acquire a Dracula card or deny a Hunter card.':' Deny a Hunter card.') :s.pendingTravel?' Choose a valid destination on the map.':s.pendingSwap?' Choose whether to move Dracula, then secretly swap cards between two cities.':c==='investigate'?' Investigate the top encounter.':' Effect deferred beyond Stage 1.'}`;if(cards[c].event){p.discard.pop();message=resolveEvent(s,p,c);}if(cards[c].item){p.discard.pop();const effect=useItem(s,p,c,a.ally);message=`${p.name} used ${cards[c].name}, ${effect} and trashed the Item permanently.`;}if(c==='signature-1-0'){if(s.locations[p.city].deck.length){s.pendingSearch=p.id;message=`${p.name} played Methodical Search. Privately examine up to two encounters and choose one to resolve.`;}else{investigate(s,p,'Methodical Search: ');message='';}}if(c==='signature-1-1'){s.pendingDispatch=p.id;message=`${p.name} played Urgent Dispatch. Choose a conscious Hunter to move one connection.`;}if(cards[c].healCompanion){
 const companions=medicalTargets(s,p.id).filter(h=>h.id!==p.id);
 const companion=companions.find(h=>h.id===a.healTarget);
 if((companions.length||a.healTarget!==undefined)&&!companion)throw Error('Choose one conscious Hunter at your city for First Aid.');
 const results=[p,...(companion?[companion]:[])].map(h=>{
  const healed=Math.min(h.damage,cards[c].healing??0);
  h.damage-=healed;
  return `${h.name} healed ${healed} HP`;
 });
 message=`First Aid: ${results.join('. ')}.`;
}if(c==='signature-4-1'){s.pendingVision={player:p.id,city:null};message=`${p.name} played Shared Vision. Privately choose another city to examine.`;}if(c==='signature-2-0'){
 s.correspondence={stage:'trade'};
 message=`${p.name} played Correspondence. Choose a Hunter and exchange one hand card each.`;
}if(c==='signature-3-1'){
 const before=p.hand.length;
 p.discard.pop();
 draw(p,2);
 p.discard.push(c);
 if(p.hand.length)s.pendingAssessment=true;
 message=`${p.name} played Clinical Assessment and drew ${p.hand.length-before} card(s).${s.pendingAssessment?' Choose one card to discard.':''}`;
}if(c==='signature-3-0'){s.pendingMedical=p.id;message=`${p.name} played Medical Expertise. Choose yourself or another conscious Hunter at your city to heal 2 HP.`;}if(c==='signature-4-0'){s.pendingPsychic=p.id;message=`${p.name} played Psychic Connection. Choose another Hunter in this city to discard a random card.`;}if(c==='signature-0-0'){message=`${p.name} played Family Fortune. Acquire two Hunter market cards; denial is not allowed.`;if(!s.market.face.some(id=>cards[id].side==='hunter')){s.pendingFortune=0;message+=' No Hunter cards available.';}}if(c==='combat'){if(a.choice==='heal'){const healed=Math.min(p.damage,cards.combat.healing??1);p.damage-=healed;message=`${p.name} played A Lucky Find and healed ${healed} damage (${p.damage} remaining).`;}else message=`${p.name} played A Lucky Find for +${s.config.basicCombat} combat strength. Combat resolution remains deferred under the discovery-wins playtest rule.`;}if(cards[c].ally){p.discard.pop();s.pendingAlly=c;message='Dracula played an ally. Choose an open city with a free slot.';}if(cards[c].equipment){p.discard.pop();equip(s,p,c,a.replaceIndex,a.replacedDestination,false);message=`${p.name} equipped ${cards[c].name}.`;}if(c==='investigate'){investigate(s,p,message+' ');message='';}
if(cards[c].investigation){
 const mode=cards[c].investigation;
 const deck=s.locations[p.city].deck;
 if(((mode==='top'||mode==='bottom')&&deck.length>=2)||(mode==='rumors'&&deck.length)){
  s.pendingInvestigation=c;
  message=`${p.name} played ${cards[c].name}. Review the top cards privately.`;
 }else if(mode==='rumors'){
  message=`${p.name} played ${cards[c].name}, but the location deck is empty.`;
 }else{
  investigate(s,p,`${p.name} played ${cards[c].name}. `,mode==='discard');
  if(mode==='repeat'&&(s.combat||canRepeatInvestigation(s,p)))s.pendingInvestigation=c;
  message='';
 }
}if(s.pendingSupply&&!s.market.face.length){s.pendingSupply=false;message+=' No legal market target; Supply resolves without a market change.';}if(s.pendingInfluence&&!s.market.face.some(id=>canUseMarket(s,id,'acquire')||canUseMarket(s,id,'deny'))){s.pendingInfluence=false;message+=' No legal market target; Dark Influence resolves without a market change.';}if(cards[c].trashOnPlay)message+=' The card was trashed permanently.';
if(c==='d-4'){
 if(phase==='night'){
  const healed=Math.min(p.damage,1);p.damage-=healed;
  message=`Dracula played Call of the Night and healed ${healed} HP (${hp(s,p)} / ${maxHP(s,p)} HP).`;
 }else{
  s.nightPlay='choose';
  message='Dracula played Call of the Night. Immediately play one more card using its Night ability.';
  if(!p.hand.some(id=>canPlayStandard(s,p,id))){delete s.nightPlay;message+=' No eligible card remains; the bonus play ends.';}
 }
}}
 if(a.type==='advance') {delete s.pendingInvestigation;delete s.correspondence;delete s.pendingAssessment;if(!a.debug&&s.nightPlay==='choose')throw Error('Play the Call of the Night bonus card before ending the turn.');delete s.nightPlay;if(!a.debug&&(s.pendingSearch||s.pendingDispatch))throw Error('Resolve the Hunter card before ending the turn.');s.pendingSearch=null;s.pendingDispatch=null;if(!a.debug&&s.pendingVision)throw Error('Resolve Shared Vision before ending the turn.');s.pendingVision=null;if(!a.debug&&s.pendingMedical)throw Error('Resolve Medical Expertise before ending the turn.');s.pendingMedical=null;if(!a.debug&&s.pendingPsychic)throw Error('Resolve Psychic Connection before ending the turn.');s.pendingPsychic=null;if(!a.debug&&s.pendingFortune)throw Error('Finish Family Fortune before ending the turn.');s.pendingFortune=0;if(!a.debug&&s.pendingAlly)throw Error('Place the ally before ending the turn.');if(a.debug&&s.pendingAlly){p.discard.push(s.pendingAlly);s.pendingAlly=null;}if(!a.debug&&s.pendingEncounter)throw Error('Place the Savage Attack before ending the turn.');if(!a.debug&&s.pendingInfluence)throw Error('Resolve Dark Influence before ending the turn.');if(!a.debug&&s.pendingSwap)throw Error('Resolve Shadow Passage before ending the turn.');if(!a.debug&&s.pendingTravel)throw Error('Choose a Travel destination before ending the turn.');if(!a.debug&&s.pendingSupply)throw Error('Resolve Supply before ending the turn.');if(!a.debug&&p.side==='dracula'&&p.recovery==='none'&&!s.played&&p.hand.some(c=>canPlayStandard(s,p,c)))throw Error('Play one card before ending the turn.');if(!a.debug&&p.side==='hunter'&&p.recovery==='none'&&!s.played)s.log.push(`${p.name} passed without playing a card.`);s.pendingSupply=false;s.pendingInfluence=false;s.pendingTravel=0;delete s.pendingGroupPassage;s.pendingTravelEncounter=false;s.pendingSwap=false;s.pendingEncounter=false;s.played=false;if(p.recovery==='resting')p.recovery='ready';s.turn++;if(s.turn===5){s.turn=0;if(s.phase==='day')s.phase='night';else{s.phase='day';s.round++;s.players.forEach(p=>{p.discard.push(...p.hand);p.hand=[];draw(p,s.config.handSize);});}}prepareTurn(s);message=`${a.debug?'Debug advance. ':''}${calendarLabel(s)}, ${s.phase}: ${active(s).name}.`;if(s.round!==state.round&&calendar(s).day===1)message+=' New week: Dracula gains 3 accumulated Darkness.';}
 if(a.type==='market'&&a.mode==='refresh'){if(!s.pendingSupply||s.phase!=='night'||p.side!=='hunter'||player!.id!==p.id||a.debug)throw Error('Night Supply is required to trash and refill a market slot.');const m=s.market,c=m.face[a.index];if(!c)throw Error('Market slot is empty.');m.denied.push(c);if(!m.draw.length&&m.discard.length){m.draw=shuffle(m.discard);m.discard=[];}const next=m.draw.pop();if(next)m.face[a.index]=next;else m.face.splice(a.index,1);s.pendingSupply=false;const refilled=refillMarket(m);s.log.push(`${p.name}: Night Supply trashed ${cards[c].name}. ${next?'Slot refilled with '+cards[next].name+'.':'No replacement cards remain.'}${refilled?' Market refilled to '+m.face.length+' cards.':''}`);recordResolution(state,s,a);return s;}
 if(a.type==='market') {if(!a.debug&&((!s.pendingSupply&&!s.pendingInfluence&&!s.pendingFortune)||player!.id!==p.id||a.mode==='replace'))throw Error('A Supply, Family Fortune or Dark Influence play is required.');const m=s.market;const c=m.face[a.index];if(!c)throw Error('Market slot is empty.');if(!a.debug&&s.pendingSupply&&a.mode==='deny'&&cards[c].side!=='dracula')throw Error('Supply can only deny a Dracula card.');if(!a.debug&&s.pendingFortune&&(a.mode!=='acquire'||cards[c].side!=='hunter'))throw Error('Family Fortune only acquires Hunter cards; denial is not allowed.');if(!a.debug&&!canUseMarket(s,c,a.mode))throw Error('Dark Influence: deny a Hunter card, or at Night acquire a Dracula card.');if(a.mode==='acquire'){if(cards[c].side!==player!.side)throw Error('Wrong faction market.');if(a.destination==='use'){if(player!.side!=='hunter'||!cards[c].item||player!.recovery!=='none')throw Error('Only a conscious Hunter can immediately use an acquired Item.');const effect=useItem(s,player!,c,a.ally);s.log.push(`${player!.name} immediately used ${cards[c].name}, ${effect} and trashed the Item permanently.`);}else if(a.destination==='equipment'){if(player!.side!=='hunter'||!cards[c].equipment||player!.recovery!=='none')throw Error('Only a conscious Hunter can equip acquired equipment.');equip(s,player!,c,a.replaceIndex,a.replacedDestination,true);}else player!.discard.push(c);}else m[a.mode==='deny'?'denied':'discard'].push(c);m.face.splice(a.index,1);const refilled=refillMarket(m,a.mode==='replace'?m.face.length+1:m.face.length);if(!a.debug){s.pendingSupply=false;s.pendingInfluence=false;if(s.pendingFortune){s.pendingFortune--;if(!m.face.some(id=>cards[id].side==='hunter'))s.pendingFortune=0;}}message=`${a.debug?'Debug: ':''}${player!.name}: ${a.mode} ${cards[c].name}.${a.mode==='acquire'?(a.destination==='equipment'?' Equipped immediately.':a.destination==='use'?' Used immediately and trashed.':' Placed in discard.'):''}${refilled?' Market refilled to '+m.face.length+' cards.':''}`;}
 if(a.type==='travel'){if(!s.pendingTravel||p.side!=='hunter'||!validDestination(p.city,a.city,s.pendingTravel))throw Error('Choose a valid Travel destination.');const companions=a.companions??[];
 const eligible=groupPassagePartners(s);
 if(new Set(companions).size!==companions.length||companions.some(id=>!eligible.some(h=>h.id===id)))throw Error('Choose distinct conscious Hunters from your city for Group Passage.');
 const from=p.city;
 p.city=a.city;
 const travelers=eligible.filter(h=>companions.includes(h.id));
 for(const hunter of travelers)hunter.city=a.city;
 const group=s.pendingGroupPassage;
 delete s.pendingGroupPassage;
 s.pendingTravel=0;
 message=`${p.name} traveled from ${cities[from]} to ${cities[a.city]}.`;if(group&&travelers.length)message+=` Group Passage brought ${travelers.map(h=>h.name).join(', ')}.`;if(s.pendingTravelEncounter){if(isOpenLocation(s,a.city)){addBasicEncounter(s,a.city);message+=' Travel by Carriage at Night: one basic encounter added to the destination and its deck shuffled.';}else message+=' Consecrated location: no Night Travel encounter added.';}s.pendingTravelEncounter=false;}
 if(a.type==='investigate'){if(player!.side!=='hunter'||player!.recovery!=='none')throw Error('Only conscious Hunters investigate.');investigate(s,player!,'Debug: ');}
 if(a.type==='swap'){if(!s.pendingSwap||p.side!=='dracula'||cardPhase(s)!=='night')throw Error('Play Shadow Passage first.');if(typeof a.moveDracula!=='boolean')throw Error('Choose whether to move Dracula first.');if(!Number.isInteger(a.from)||!Number.isInteger(a.to)||!s.locations[a.from]||!s.locations[a.to]||a.from===a.to)throw Error('Choose two distinct valid cities.');if(a.moveDracula&&(a.from!==draculaLocation(s)||!adjacent(a.from,a.to)||!isOpenLocation(s,a.to)))throw Error('Move Dracula from his actual city to an adjacent city.');const left=s.locations[a.from].deck,right=s.locations[a.to].deck;if(!Number.isInteger(a.fromIndex)||!Number.isInteger(a.toIndex)||!left[a.fromIndex]||!right[a.toIndex])throw Error('Select one available card in each city.');if(a.moveDracula?left[a.fromIndex]!=='dracula':left[a.fromIndex]==='dracula'||right[a.toIndex]==='dracula')throw Error(a.moveDracula?'Select Dracula in his city.':'Bluff swaps cannot move Dracula.');[left[a.fromIndex],right[a.toIndex]]=[right[a.toIndex],left[a.fromIndex]];s.locations[a.from].deck=shuffle(left);s.locations[a.to].deck=shuffle(right);s.players[4].city=draculaLocation(s);s.pendingSwap=false;message=`Shadow Passage: cards swapped between ${cities[a.from]} and ${cities[a.to]}; both decks shuffled.`;}
 if(a.type==='placeEncounter'){if(!s.pendingEncounter||p.side!=='dracula')throw Error('Play Savage Attack first.');if(!canPlaceEncounter(s,a.city))throw Error('Choose Dracula’s city or an orthogonally adjacent city.');const l=s.locations[a.city];l.deck=shuffle([...l.deck,'damaging']);s.pendingEncounter=false;message=`Dracula placed a Savage Attack in ${cities[a.city]}; its encounter deck was shuffled.`;}
 if(a.type==='stack'){if(!s.locations[a.city]||!['encounter','dracula','damaging'].includes(a.card))throw Error('Invalid encounter setup.');const l=s.locations[a.city];const i=l.deck.indexOf(a.card);if(i<0)throw Error('That card is not in this city deck.');l.deck.splice(i,1);l.deck.unshift(a.card);message=`Debug: stacked ${a.card} in ${cities[a.city]}.`;}
 if(a.type==='draw'){draw(player!,1);message=`Debug: ${player!.name} drew a card.`;}
 if(a.type==='add'){if(!cards[a.card]||cards[a.card].side!==player!.side)throw Error('Choose a card of the correct faction.');player!.discard.push(a.card);message=`Debug: added ${cards[a.card].name} to ${player!.name} discard.`;}
 if(a.type==='remove'){const c=player![a.zone].splice(a.index,1)[0];if(!c)throw Error('Card not found.');message=`Debug: removed ${cards[c].name} from ${player!.name}.`;}
 if(a.type==='city'){if(player!.side==='dracula')throw Error('Use Shadow Passage to move Dracula.');if(!Number.isInteger(a.city)||a.city<0||a.city>8)throw Error('Invalid city.');player!.city=a.city;message=`Debug: relocated ${player!.name}.`;}
 if(s.pendingInvestigation&&cards[s.pendingInvestigation].investigation==='repeat'&&(p.recovery!=='none'||hp(s,p)===0||(!s.combat&&!canRepeatInvestigation(s,p))))delete s.pendingInvestigation;
 if(s.nightPlay==='resolve'&&!hasPendingAction(s))delete s.nightPlay;
 if(message)s.log.push(message);
 settleLocations(s);checkDarknessVictory(s);recordResolution(state,s,a);return s;
}
function removeRetiredHeavenlyHost(raw:State & {heavenlyHostAdded?:true;pendingConsecration?:string}){
 if(raw.heavenlyHostAdded!==true)return;
 const isRetained=(id:string)=>id!=='hm-host-1'&&id!=='hm-host-2';
 for(const zone of ['face','draw','discard','denied'] as const)raw.market[zone]=raw.market[zone].filter(isRetained);
 for(const player of raw.players){
  for(const zone of ['hand','draw','discard'] as const)player[zone]=player[zone].filter(isRetained);
 }
 for(const location of raw.locations)delete (location as Location & {consecrated?:true}).consecrated;
 if(raw.pendingConsecration){
  raw.played=false;
  delete raw.latestResolution;
 }
 delete raw.pendingConsecration;
 delete raw.heavenlyHostAdded;
}
function updateHunterMarket(s:State){
 if(s.hunterMarketUpdated===3&&s.draculaMarketUpdated===2)return;
 const additions=s.hunterMarketUpdated===3||s.hunterMarketUpdated===2?[]:s.hunterMarketUpdated===true?[recklessAssault]:[...addedHunterCopies,recklessAssault];
 if(!s.draculaMarketUpdated)additions.push(...newDraculaCombatCards);
 const keep=(id:string)=>!retiredHunterCards.includes(id)&&!retiredDraculaCards.includes(id);
 for(const zone of ['face','draw','discard','denied'] as const)s.market[zone]=s.market[zone].filter(keep);
 for(const p of s.players){
  const choice=s.combat?.choices[p.id];
  if(choice!==undefined&&choice>=0)s.combat!.choices[p.id]=keep(p.hand[choice])?p.hand.slice(0,choice).filter(keep).length:-1;
  if(p===active(s)&&s.correspondence?.stage==='play'){
   const index=s.correspondence.index;
   if(keep(p.hand[index]))s.correspondence.index=p.hand.slice(0,index).filter(keep).length;
   else delete s.correspondence;
  }
  for(const zone of ['hand','draw','discard','equipment'] as const)p[zone]=p[zone].filter(keep);
 }
 const owned=new Set([...s.market.face,...s.market.draw,...s.market.discard,...s.market.denied,...s.players.flatMap(p=>[...p.hand,...p.draw,...p.discard,...p.equipment])]);
 s.market.draw.unshift(...shuffle(additions.filter(id=>!owned.has(id))));
 refillMarket(s.market);
 if(s.pendingInfluence&&!s.market.face.some(id=>canUseMarket(s,id,'acquire')||canUseMarket(s,id,'deny')))s.pendingInfluence=false;
 if(s.pendingFortune&&!s.market.face.some(id=>cards[id]?.side==='hunter'))s.pendingFortune=0;
 if(s.pendingPsychic&&!psychicTargets(s,s.pendingPsychic).length)s.pendingPsychic=null;
 if(s.correspondence?.stage==='trade'&&(!active(s).hand.length||!correspondencePartners(s).length))delete s.correspondence;
 if(s.correspondence?.stage==='play'&&!canPlayStandard(s,active(s),active(s).hand[s.correspondence.index],s.correspondence.index))delete s.correspondence;
 if(s.pendingInvestigation&&!keep(s.pendingInvestigation))delete s.pendingInvestigation;
 s.hunterMarketUpdated=3;
 s.draculaMarketUpdated=2;
}
export function parseSave(text:string):State {const raw=JSON.parse(text);if(raw.config){
 raw.config.brushDamage??=raw.config.encounterDayDamage??defaults.brushDamage;
 raw.config.savageDamage??=raw.config.encounterNightDamage??defaults.savageDamage;
 delete raw.config.encounterDayDamage;
 delete raw.config.encounterNightDamage;
}const migrated=Number.isInteger(raw.version)&&raw.version>=1&&raw.version<=6;if(raw.version===1){const old=raw.markets;raw.market=market([...old.hunter.face,...old.dracula.face,...old.hunter.draw,...old.dracula.draw]);raw.market.discard=[...old.hunter.discard,...old.dracula.discard];raw.market.denied=[...old.hunter.denied,...old.dracula.denied];delete raw.markets;raw.version=2;raw.pendingTravel=0;raw.log.push('Migrated to one shared ten-card market; available market cards reshuffled.');}if(raw.version===2){const start=raw.players[4].city;raw.locations=setupLocations(start);raw.pendingSwap=false;raw.winner=null;raw.players.forEach((p:Player)=>p.damage=0);raw.config={...defaults,...raw.config};raw.version=3;raw.log.push('Encounter playtest initialized: five shuffled cards per city, one Dracula card.');}if(raw.version===3){raw.exhaustionDarkness=0;raw.version=4;raw.combat=null;raw.config={...defaults,...raw.config};raw.players.forEach((p:Player)=>{p.equipment=[];p.recovery='none';p.damage=Math.min(p.damage,p.side==='hunter'?raw.config.hunterHP:raw.config.draculaHP);if(p.side==='hunter')hurt(raw,p,0);});if(raw.winner==='hunters'){raw.players[4].damage=raw.config.draculaHP;}raw.exhaustionDarkness=0;raw.log.push('Combat rules enabled. Existing Hunter damage retained up to 4 HP with exhaustion applied; previous playtest victories retained.');}if(raw.version===4){raw.version=5;raw.pendingAlly=null;raw.locations.forEach((l:Location)=>l.ally=null);}if(raw.version===5){raw.version=6;raw.eventDarkness=0;raw.log.push('Calendar and Darkness enabled: elapsed weeks count toward weekly Darkness; deployed allies each contribute 1.');}if(raw.version===6){raw.version=7;raw.pendingWraith=null;for(const l of raw.locations){l.closed=false;l.wraith=null;if(l.ally?.card==='dm-6'){l.wraith=l.ally;l.ally=null;}}raw.log.push('Four minions, persistent equipment and closed locations enabled. Empty cities now become permanently consecrated.');}if(raw.exhaustionDarkness===undefined)raw.exhaustionDarkness=0;if(raw.pendingVision===undefined)raw.pendingVision=null;if(raw.pendingMedical===undefined)raw.pendingMedical=null;if(raw.pendingPsychic===undefined)raw.pendingPsychic=null;if(raw.pendingFortune===undefined)raw.pendingFortune=0;if(raw.pendingEncounter===undefined)raw.pendingEncounter=false;if(raw.pendingInfluence===undefined)raw.pendingInfluence=false;if(raw.addedBasicEncounters===undefined)raw.addedBasicEncounters=0;if(raw.pendingTravelEncounter===undefined)raw.pendingTravelEncounter=raw.pendingTravel>0&&raw.phase==='night'&&active(raw).discard.at(-1)==='travel';if(raw.config?.basicCombat===2)raw.config.basicCombat=1;if(raw.config?.draculaBase===5)raw.config.draculaBase=3;if(raw.pendingSearch===undefined)raw.pendingSearch=null;if(raw.pendingDispatch===undefined)raw.pendingDispatch=null;if(raw.setupIndex===undefined)raw.setupIndex=null;removeRetiredHeavenlyHost(raw);const s=raw as State;updateHunterMarket(s);
if(s.investigationCopiesAdded===undefined||s.investigationCopiesAdded===true){
 const additions=s.investigationCopiesAdded===true?[extraUncoverConspiracy]:addedInvestigationCopies;
 const owned=new Set([...s.market.face,...s.market.draw,...s.market.discard,...s.market.denied,...s.players.flatMap(p=>[...p.hand,...p.draw,...p.discard,...p.equipment])]);
 s.market.draw.unshift(...shuffle(additions.filter(id=>!owned.has(id))));
 s.investigationCopiesAdded=2;
}
if(s.investigationCopiesAdded!==2)throw Error('Invalid investigation market state.');
if(s.latestResolution!==undefined&&(!s.latestResolution||!Array.isArray(s.latestResolution.entries)||s.latestResolution.entries.some(e=>typeof e!=='string')||typeof s.latestResolution.debug!=='boolean'))throw Error('Invalid resolution summary.');if(migrated){const owned=[...s.market.face,...s.market.draw,...s.market.discard,...s.market.denied,...s.players.flatMap(p=>[...p.hand,...p.draw,...p.discard,...p.equipment])];for(const id of ['hm-salts','dm-renfield'])if(!owned.includes(id)&&!s.locations.some(l=>l.ally?.card===id||l.wraith?.card===id)&&s.pendingAlly!==id)s.market.draw.unshift(id);}if(s.version!==7||!Number.isSafeInteger(s.exhaustionDarkness)||s.exhaustionDarkness<0||!Number.isSafeInteger(s.eventDarkness)||s.eventDarkness<0||!Number.isSafeInteger(s.round)||s.round<1||!['day','night'].includes(s.phase)||!Number.isInteger(s.turn)||s.turn<0||s.turn>4||typeof s.played!=='boolean'||typeof s.pendingSupply!=='boolean'||typeof s.pendingInfluence!=='boolean'||!Array.isArray(s.log)||!s.log.every(x=>typeof x==='string')||s.players?.length!==5||new Set(s.players.map(p=>p.id)).size!==5)throw Error('Invalid Stage 1 save.');s.players.forEach((p,i)=>{if(typeof p.id!=='string'||typeof p.name!=='string'||p.side!==(i===4?'dracula':'hunter')||!Number.isInteger(p.city)||p.city<(s.setupIndex!==null?-1:0)||p.city>8)throw Error('Invalid player.');for(const id of p.equipment.filter(id=>cards[id]?.item)){p.equipment.splice(p.equipment.indexOf(id),1);p.discard.push(id);}['hand','draw','discard','equipment'].forEach(z=>check((p as unknown as Record<string,string[]>)[z]));});if(s.eventCardsAdded===undefined){const owned=[...s.market.face,...s.market.draw,...s.market.discard,...s.market.denied,...s.players.flatMap(p=>[...p.hand,...p.draw,...p.discard,...p.equipment])];for(const id of eventCards)if(!owned.includes(id))s.market.draw.unshift(id);s.eventCardsAdded=true;s.log.push('Added Quincy Morris and Immanuel Hildesheim to the market reserve.');}if(s.eventCardsAdded!==true)throw Error('Invalid event market state.');const m=s.market;if(!m||!Array.isArray(m.face)||m.face.length>10)throw Error('Invalid market.');[m.face,m.draw,m.discard,m.denied].forEach(check);if(!Number.isInteger(s.pendingTravel)||s.pendingTravel<0||s.pendingTravel>3)throw Error('Invalid Travel state.');if(!s.config||Object.keys(defaults).some(k=>!Number.isInteger(s.config[k as keyof typeof defaults])||s.config[k as keyof typeof defaults]<1))throw Error('Invalid configuration.');if(s.correspondence!==undefined){
 const pending=s.correspondence,p=active(s);
 if(!pending||s.setupIndex!==null||!s.played||s.combat||s.winner||p.side!=='hunter'||p.recovery!=='none'||!p.discard.includes('signature-2-0')||(pending.stage==='trade'?(!p.hand.length||!correspondencePartners(s).length):pending.stage!=='play'||!Number.isInteger(pending.index)||!canPlayStandard(s,p,p.hand[pending.index],pending.index)))throw Error('Invalid Correspondence choice.');
}
if(s.pendingInvestigation!==undefined){
 const p=active(s),mode=cards[s.pendingInvestigation]?.investigation;
 if(s.setupIndex!==null||s.winner||!s.played||p.side!=='hunter'||!p.discard.includes(s.pendingInvestigation)||
  (mode==='repeat'?(!s.combat&&!canRepeatInvestigation(s,p)):s.combat||!['top','bottom','rumors'].includes(mode??'')||s.locations[p.city].deck.length<(mode==='rumors'?1:2)))throw Error('Invalid investigation choice.');
}
if(s.pendingGroupPassage!==undefined&&(s.pendingGroupPassage!==true||s.setupIndex!==null||!s.played||active(s).side!=='hunter'||s.pendingTravel!==2||s.pendingTravelEncounter))throw Error('Invalid Group Passage choice.');if(s.pendingAssessment!==undefined&&(s.pendingAssessment!==true||s.setupIndex!==null||s.combat||s.winner||!s.played||active(s).side!=='hunter'||!active(s).hand.length||!active(s).discard.includes('signature-3-1')))throw Error('Invalid Clinical Assessment choice.');if(s.nightPlay!==undefined&&(!['choose','resolve'].includes(s.nightPlay)||s.phase!=='day'||s.turn!==4||!s.played||s.combat||s.setupIndex!==null||(s.nightPlay==='choose'?hasPendingAction(s):!hasPendingAction(s))))throw Error('Invalid Call of the Night bonus play.');
if(s.setupIndex!==null){validateSetup(s);return s;}if(!Number.isInteger(s.pendingFortune)||s.pendingFortune<0||s.pendingFortune>2||(s.pendingFortune>0&&(!s.played||active(s).side!=='hunter'||s.pendingSupply||s.pendingInfluence||s.combat||!s.market.face.some(id=>cards[id].side==='hunter'))))throw Error('Invalid Family Fortune state.');if(s.pendingPsychic!==null&&(s.pendingPsychic!==active(s).id||active(s).side!=='hunter'||!s.played||s.combat||!psychicTargets(s,s.pendingPsychic).length))throw Error('Invalid Psychic Connection state.');if(s.pendingMedical!==null&&(s.pendingMedical!==active(s).id||active(s).side!=='hunter'||!s.played||s.combat||!medicalTargets(s,s.pendingMedical).length))throw Error('Invalid Medical Expertise state.');if(s.pendingVision!==null){const v=s.pendingVision;if(!v||v.player!==active(s).id||active(s).side!=='hunter'||!s.played||s.combat||!visionCities(s,v.player).length||(v.city!==null&&!visionCities(s,v.player).includes(v.city)))throw Error('Invalid Shared Vision state.');}for(const p of s.players)for(const zone of ['hand','draw','discard'] as const)p[zone]=p[zone].map(id=>id==='d-1'?'d-0':id);if(migrated)settleLocations(s);if(s.pendingSearch!==null&&(s.pendingSearch!==active(s).id||active(s).side!=='hunter'||!s.played||s.combat||!s.locations[active(s).city].deck.length))throw Error('Invalid Methodical Search state.');if(s.pendingDispatch!==null&&(s.pendingDispatch!==active(s).id||active(s).side!=='hunter'||!s.played||s.combat))throw Error('Invalid Urgent Dispatch state.');validateEncounters(s);if(s.pendingAlly!==null&&(!cards[s.pendingAlly]?.ally||active(s).side!=='dracula'||!s.played||s.combat))throw Error('Invalid pending ally.');for(const l of s.locations){if(l.ally!==null&&(!l.ally||!cards[l.ally.card]?.ally||typeof l.ally.revealed!=='boolean'))throw Error('Invalid location ally.');}validateMinions(s);if(s.winner==='dracula'&&darkness(s).total<s.config.darknessTarget)throw Error('Invalid Darkness victory state.');if(migrated)checkDarknessVictory(s);if(!s.winner&&darkness(s).total>=s.config.darknessTarget)throw Error('Missing Darkness victory state.');return s;}
function check(a:string[]){if(!Array.isArray(a)||a.some(c=>!cards[c]))throw Error('Unknown cards in save.');}
export function groupPassagePartners(s:State){
 const p=active(s);
 if(!s.pendingGroupPassage||!s.pendingTravel||p.side!=='hunter')return [];
 return s.players.filter(h=>h.side==='hunter'&&h.id!==p.id&&h.city===p.city&&h.recovery==='none'&&hp(s,h)>0);
}
export function validDestination(from:number,to:number,range:number){if(!Number.isInteger(to)||to<0||to>8||from===to)return false;if(range===1)return adjacent(from,to);return Math.abs(from%3-to%3)+Math.abs(Math.floor(from/3)-Math.floor(to/3))<=range;}

function canRepeatInvestigation(s:State,p:Player){
 return !s.winner&&p.recovery==='none'&&hp(s,p)>0&&s.locations[p.city].deck.length>0&&s.players.some(h=>h.side==='hunter'&&h.id!==p.id&&h.city===p.city);
}
export function investigationReview(s:State,viewer:string,debug=false){
 const p=active(s),mode=s.pendingInvestigation?cards[s.pendingInvestigation].investigation:undefined;
 if((!debug&&viewer!==p.id)||(mode!=='top'&&mode!=='bottom'&&mode!=='rumors'))return [];
 return s.locations[p.city].deck.slice(0,mode==='rumors'?4:2);
}
function resolveInvestigationChoice(s:State,p:Player,a:Extract<Action,{type:'resolveInvestigation'}>){
 const id=s.pendingInvestigation;
 if(!id)throw Error('No investigation choice is pending.');
 const card=cards[id];
 const deck=s.locations[p.city].deck;
 delete s.pendingInvestigation;
 if(card.investigation==='rumors'){
  s.locations[p.city].deck=shuffle(deck);
  return `${p.name} privately reviewed the top encounters and shuffled the deck in ${cities[p.city]}.`;
 }
 if(card.investigation==='repeat'){
  if(typeof a.repeat!=='boolean'||!canRepeatInvestigation(s,p))throw Error('Choose whether to investigate again.');
  if(!a.repeat)return `${p.name} ended Coordinated Search after one investigation.`;
 }else{
  if((a.index!==0&&a.index!==1)||deck.length<2)throw Error('Choose one of the reviewed cards to investigate.');
  const chosen=deck.splice(a.index,1)[0];
  if(card.investigation==='bottom')deck.push(deck.shift()!);
  deck.unshift(chosen);
 }
 investigate(s,p,card.name+'. ');
 return '';
}
function investigate(s:State,p:Player,prefix:string,discardEncounter=false){const l=s.locations[p.city];const c=l.deck.shift();if(!c){s.log.push(`${prefix}${p.name} investigated ${cities[p.city]}: the deck is empty.`);return;}l.resolved.push(c);if(c==='dracula'){for(const ally of alliesAt(s,p.city))if(!ally.revealed){ally.revealed=true;s.log.push(`Ally revealed in ${cities[p.city]}: ${cards[ally.card].name}.`);}s.combat={city:p.city,hunters:s.players.filter(h=>h.side==='hunter'&&h.city===p.city&&h.recovery==='none'&&hp(s,h)>0).sort((a,b)=>combatRank(a)-combatRank(b)).map(h=>h.id),stage:'cards',choices:{},hunterStrength:0,draculaStrength:0,damage:0,escape:null};s.log.push(`${prefix}${p.name} discovered Dracula in ${cities[p.city]}. Choose combat cards for the showdown.`);return;}const base=c==='damaging'?s.config.savageDamage:s.config.brushDamage;let damage=base;
if(discardEncounter){
 s.log.push(`${prefix}${p.name} discarded ${c==='damaging'?'Savage Attack':'Brush with Darkness'} in ${cities[p.city]} without taking damage.`);
 return;
}
const prevention:string[]=[];
for(const id of p.equipment){
 const prevented=Math.min(damage,cards[id].encounterReduction??0);
 if(prevented>0){
  damage-=prevented;
  prevention.push(`${cards[id].name} prevented ${prevented} damage.`);
 }
}
const remaining=Math.max(0,hp(s,p)-damage);
s.log.push([`${prefix}${p.name} revealed ${c==='damaging'?'Savage Attack':'Brush with Darkness'} in ${cities[p.city]} and took ${damage} damage (${remaining} HP remaining).`,...prevention].join(' '));
hurt(s,p,damage);}
function validateEncounters(s:State){if(!Array.isArray(s.locations)||s.locations.length!==9||typeof s.pendingSwap!=='boolean'||typeof s.pendingEncounter!=='boolean'||(s.winner!==null&&s.winner!=='hunters'&&s.winner!=='dracula'))throw Error('Invalid encounter state.');const all=s.locations.flatMap(l=>{if(!Array.isArray(l.deck)||!Array.isArray(l.resolved))throw Error('Invalid location deck.');return [...l.deck,...l.resolved];});if(!Number.isInteger(s.addedBasicEncounters)||s.addedBasicEncounters<0||typeof s.pendingTravelEncounter!=='boolean'||all.filter(c=>c!=='damaging').length!==45+s.addedBasicEncounters||all.filter(c=>c==='dracula').length!==1||all.some(c=>c!=='dracula'&&c!=='encounter'&&c!=='damaging')||s.players.some(p=>!Number.isInteger(p.damage)||p.damage<0)||s.players[4].city!==draculaLocation(s))throw Error('Invalid encounter cards or damage.');if(s.winner==='hunters'&&hp(s,s.players[4])>0)throw Error('Invalid victory state.');
for(const p of s.players){if(!['none','waiting','resting','ready'].includes(p.recovery)||p.equipment.length>2||p.equipment.some(id=>!cards[id].equipment)||p.damage>maxHP(s,p))throw Error('Invalid health or equipment.');}
if(s.combat){const c=s.combat;if(c.discardedEquipmentStrength!==undefined&&(c.stage!=='cards'||!Number.isSafeInteger(c.discardedEquipmentStrength)||c.discardedEquipmentStrength<=0||nextCombatPlayer(s)))throw Error('Invalid discarded equipment bonus.');if(c.cancelledDraculaCard!==undefined&&(c.cancelledDraculaCard!==true||(c.stage==='cards'&&(combatParticipants(s).some(p=>c.choices[p.id]===undefined)||!(c.choices.dracula>=0)))))throw Error('Invalid cancelled Dracula card.');if(c.pendingKnockouts!==undefined&&(!Array.isArray(c.pendingKnockouts)||new Set(c.pendingKnockouts).size!==c.pendingKnockouts.length||c.pendingKnockouts.some(id=>!c.hunters.includes(id)||hp(s,s.players.find(p=>p.id===id)!)!==0)))throw Error('Invalid deferred exhaustion.');if(!Number.isInteger(c.city)||c.city<0||c.city>8||!['cards','damage','escape'].includes(c.stage)||!Array.isArray(c.hunters)||!c.hunters.length||new Set(c.hunters).size!==c.hunters.length||c.hunters.some(id=>!s.players.some(p=>p.id===id&&p.side==='hunter'&&p.city===c.city))||!c.choices||!['hunterStrength','draculaStrength','damage'].every(k=>Number.isInteger(c[k as 'damage'])&&c[k as 'damage']>=0)||![null,'mist','bats'].includes(c.escape))throw Error('Invalid combat save.');for(const [id,index] of Object.entries(c.choices)){const p=s.players.find(p=>p.id===id);if(!p||!Number.isInteger(index)||index< -1||(index>=0&&!p.hand[index])||(id!=='dracula'&&!c.hunters.includes(id)))throw Error('Invalid combat choice.');}}
}

export function visibleDraculaLocation(s:State,viewer:string,debug=false):number|null{return debug||(viewer==='dracula'&&active(s).side==='dracula')?draculaLocation(s):null;}

export function canUseMarket(s:State,id:string,mode:'acquire'|'deny'|'replace'|'refresh'):boolean{const card=cards[id];if(!card||mode==='replace')return false;const p=active(s);if(s.pendingFortune&&p.side==='hunter')return mode==='acquire'&&card.side==='hunter';if(s.pendingSupply&&p.side==='hunter'&&s.phase==='night')return mode==='refresh';if(mode==='refresh')return false;if(s.pendingSupply&&p.side==='hunter'&&s.phase==='day')return mode==='acquire'?card.side==='hunter':card.side==='dracula';if(s.pendingInfluence&&p.side==='dracula')return mode==='deny'?card.side==='hunter':cardPhase(s)==='night'&&card.side==='dracula';return false;}

export function canPlaceEncounter(s:State,city:number){return Number.isInteger(city)&&city>=0&&city<9&&isOpenLocation(s,city)&&(cardPhase(s)==='night'||city===draculaLocation(s)||adjacent(draculaLocation(s),city));}

export function hp(s:State,p:Player){return Math.max(0,maxHP(s,p)-p.damage);}
export function hurt(s:State,p:Player,amount:number){
 p.damage=Math.min(maxHP(s,p),p.damage+amount);
 if(p.side!=='hunter'||hp(s,p)!==0||p.recovery!=='none')return;

 const removed=p.equipment.map(id=>cards[id].name);
 p.equipment=[];
 p.damage=maxHP(s,p);
 for(const zone of ['hand','draw','discard'] as const){
  p[zone]=p[zone].filter(id=>{
   if(['travel','supply','investigate','combat'].includes(id))return true;
   removed.push(cards[id].name);
   return false;
  });
 }
 p.recovery='waiting';
 s.log.push(`${p.name} became Exhausted. Their next turn is spent recovering.`);
 if(removed.length)s.log.push(`Cards permanently removed: ${removed.join(', ')}.`);
 s.exhaustionDarkness=(s.exhaustionDarkness??0)+1;
 s.log.push('Dracula gains 1 accumulated Darkness.');
}
function prepareTurn(s:State){const p=active(s);if(s.phase==='night'&&s.turn===0)startNight(s);if(p.recovery==='waiting')p.recovery='resting';else if(p.recovery==='ready'){p.recovery='none';p.damage=0;if(!p.hand.length)draw(p,s.config.handSize);s.log.push(`${p.name} returns at full HP.`);}}
function combatRank(p:Player){return p.side==='dracula'?combatOrder.length:combatOrder.findIndex(name=>name===p.name);}
export function combatParticipants(s:State){return s.combat?[...s.combat.hunters,'dracula'].map(id=>s.players.find(p=>p.id===id)!).sort((a,b)=>combatRank(a)-combatRank(b)):[];}
export function nextCombatPlayer(s:State){return s.combat?.stage==='cards'?combatParticipants(s).find(p=>s.combat!.choices[p.id]===undefined):undefined;}
export function combatCardAllowed(id:string){return cards[id]&&(cards[id].strength!==undefined&&!cards[id].equipment||!!cards[id].escape||cards[id].endsShowdownDamage!==undefined||!!cards[id].combatEffect);}
function chooseCombatCard(s:State,id:string,index:number){const c=s.combat,p=s.players.find(p=>p.id===id);if(!c||c.stage!=='cards'||!p||!combatParticipants(s).includes(p)||!Number.isInteger(index)||index< -1||index>=p.hand.length||(index>=0&&!combatCardAllowed(p.hand[index])))throw Error('Choose one eligible combat card or no card.');if(nextCombatPlayer(s)?.id!==id)throw Error('Choose combat cards in order: Godalming, Harker, Seward, Helsing, Mina, then Dracula.');c.choices[id]=index;
 const cost=index>=0?cards[p.hand[index]].selfDamage:undefined;
 if(cost&&p.side==='dracula'){
  hurt(s,p,cost);
  s.log.push(`Dracula took ${cost} damage from ${cards[p.hand[index]].name} (${hp(s,p)} HP remaining).`);
  if(hp(s,p)===0){
   discardChosenCombatCards(s);
   applyDeferredKnockouts(s);
   s.combat=null;
   s.winner='hunters';
   return 'Dracula is defeated. Hunters win!';
  }
 }else if(cost){
  p.damage=Math.min(maxHP(s,p),p.damage+cost);
  if(hp(s,p)===0)(c.pendingKnockouts??=[]).push(p.id);
  s.log.push(`${p.name} lost ${cost} HP on choosing a combat card (${hp(s,p)} HP remaining).`);
 }
 return 'Combat card selected.';
}
export function combatCardStrength(s:State,id:string){
 const card=cards[id];
 const city=s.combat?.city;
 const together=city!==undefined&&s.players.filter(p=>p.side==='hunter'&&p.city===city).length>1;
 return (together?card.coordinatedStrength:undefined)??card.strength??0;
}
export function pistolUsers(s:State){
 if(s.winner||s.combat?.stage!=='cards'||nextCombatPlayer(s)||ambushDamage(s))return [];
 return combatParticipants(s).filter(p=>p.side==='hunter'&&p.recovery==='none'&&hp(s,p)>0&&p.equipment.some(id=>cards[id].discardStrength!==undefined));
}
function ambushDamage(s:State){
 const combat=s.combat!;
 for(const hunter of combatParticipants(s)){
  if(hunter.side!=='hunter')continue;
  const card=cards[hunter.hand[combat.choices[hunter.id]]];
  if(card?.endsShowdownDamage!==undefined)return card.endsShowdownDamage;
 }
 return 0;
}
function discardChosenCombatCards(s:State){
 const combat=s.combat!;
 for(const p of combatParticipants(s)){
  const index=combat.choices[p.id];
  if(index>=0)p.discard.push(p.hand.splice(index,1)[0]);
 }
}
export function draculaCombatTargets(s:State):CombatTarget[]{
 const c=s.combat;
 if(!c||c.stage!=='cards'||nextCombatPlayer(s)||c.cancelledDraculaCard||ambushDamage(s))return [];
 const card=cards[s.players[4].hand[c.choices.dracula]];
 const hunters=combatParticipants(s).filter(p=>p.side==='hunter');
 if(card?.combatEffect==='mesmerize')return hunters.map(p=>({player:p.id}));
 if(card?.combatEffect==='disarm')return hunters.flatMap(p=>p.equipment.map((_,equipmentIndex)=>({player:p.id,equipmentIndex})));
 return [];
}
function resolveCombat(s:State,target?:CombatTarget){const c=s.combat;if(!c||c.stage!=='cards')throw Error('No combat card selection pending.');const participants=combatParticipants(s);if(participants.some(p=>c.choices[p.id]===undefined))throw Error('Each participant must choose a card or no card.');
 const ambush=ambushDamage(s);
 if(ambush){
  discardChosenCombatCards(s);
  const dracula=s.players[4];
  hurt(s,dracula,ambush);
  const result=`Planned Ambush ended the showdown.${c.choices.dracula>=0?' Dracula’s combat card was cancelled.':''} Dracula took ${ambush} damage (${hp(s,dracula)} HP remaining).`;
  if(hp(s,dracula)===0){
   s.winner='hunters';
   applyDeferredKnockouts(s);
   s.combat=null;
   return result+' Dracula is defeated. Hunters win!';
  }
  endCombat(s);
  return result;
 }
 const targets=draculaCombatTargets(s);
 const chosen=target&&targets.find(t=>t.player===target.player&&t.equipmentIndex===target.equipmentIndex);
 if((targets.length||target)&&!chosen)throw Error('Choose a valid Hunter or equipped item for Dracula’s combat card.');
 let mesmerized:string|undefined;
 if(chosen?.equipmentIndex!==undefined){
  const hunter=participants.find(p=>p.id===chosen.player)!;
  const before=hp(s,hunter),capacity=maxHP(s,hunter);
  const [id]=hunter.equipment.splice(chosen.equipmentIndex,1);
  hunter.discard.push(id);
  if(before>0)adjustCapacity(s,hunter,before,capacity);
  else hunter.damage=maxHP(s,hunter);
  s.log.push(`Unholy Strength forced ${hunter.name} to discard ${cards[id].name}.`);
 }else if(chosen){
  mesmerized=chosen.player;
  s.log.push(`Mesmerize reduced ${participants.find(p=>p.id===mesmerized)!.name}’s Strength to 0.`);
 }
 c.hunterStrength=c.discardedEquipmentStrength??0;c.draculaStrength=s.config.draculaBase+alliesAt(s,c.city).reduce((n,a)=>n+cards[a.card].ally!.strength,0);for(const p of participants){const index=c.choices[p.id];const id=index>=0?p.hand[index]:null;if(id&&!combatCardAllowed(id))throw Error('Invalid combat card.');const cancelled=p.side==='dracula'&&c.cancelledDraculaCard;const bonus=id&&!cancelled?combatCardStrength(s,id):0;if(p.side==='hunter'){
 if(p.id!==mesmerized)c.hunterStrength+=s.config.hunterBase+p.equipment.reduce((n,id)=>n+(cards[id].strength??0),0)+bonus+(c.pistolStrength?.[p.id]??0);
}else{c.draculaStrength+=bonus;c.escape=id&&!cancelled?(cards[id].escape??null):null;}}
for(const p of participants){const index=c.choices[p.id];if(index>=0){
 const [played]=p.hand.splice(index,1);
 if(cards[played].trashAfterCombat)s.log.push(`${p.name} used ${cards[played].name} and trashed it permanently.`);
 else p.discard.push(played);
}}c.choices={};delete c.discardedEquipmentStrength;delete c.pistolStrength;
const difference=c.hunterStrength-c.draculaStrength;const extra=difference<0?alliesAt(s,c.city).reduce((n,a)=>n+(cards[a.card].ally!.victoryDamage??0),0):0;c.damage=Math.abs(difference)+extra;const result=`Combat: Hunters ${c.hunterStrength}, Dracula ${c.draculaStrength}. ${difference>0?'Hunters win':'Dracula wins'+(difference===0?' the tie':'')}; ${c.damage} damage.`;
if(difference>0){hurt(s,s.players[4],c.damage);if(hp(s,s.players[4])===0){s.winner='hunters';applyDeferredKnockouts(s);s.combat=null;return result+' Dracula is defeated. Hunters win!';}finishCombatDamage(s);}else if(difference<0)c.stage='damage';else finishCombatDamage(s);return result;}
function allocateDamage(s:State,extra:string[]){const c=s.combat;if(!c||c.stage!=='damage')throw Error('No damage allocation pending.');const remainder=c.damage%c.hunters.length;if(extra.length!==remainder||new Set(extra).size!==extra.length||extra.some(id=>!c.hunters.includes(id)))throw Error('Divide damage as evenly as possible; choose exactly the remainder recipients.');const each=Math.floor(c.damage/c.hunters.length);const allocation=c.hunters.map(id=>{const p=s.players.find(p=>p.id===id)!;const amount=each+(extra.includes(id)?1:0);if(c.pendingKnockouts?.includes(p.id))p.damage=Math.min(maxHP(s,p),p.damage+amount);else hurt(s,p,amount);return `${p.name}: ${amount}`;});finishCombatDamage(s);return 'Dracula allocated damage: '+allocation.join(', ')+'.';}
function finishCombatDamage(s:State){const c=s.combat!;if(c.escape&&escapeDestinations(s).length)c.stage='escape';else endCombat(s);}
function endCombat(s:State){const c=s.combat!;applyDeferredKnockouts(s);const l=s.locations[c.city];const i=l.resolved.indexOf('dracula');if(i>=0){l.resolved.splice(i,1);l.deck=shuffle([...l.deck,'dracula']);}s.combat=null;}
export function escapeDestinations(s:State){const c=s.combat;if(!c?.escape)return [];return cities.map((_,i)=>i).filter(i=>validDestination(c.city,i,c.escape==='mist'?1:2)&&isOpenLocation(s,i));}
function escapeCombat(s:State,city:number|null,index=0){const c=s.combat;if(!c||c.stage!=='escape')throw Error('No escape pending.');if(city===null){endCombat(s);return 'Dracula declined to escape; his identity was shuffled back into the same city.';}if(!escapeDestinations(s).includes(city)||!Number.isInteger(index)||!s.locations[city].deck[index])throw Error('Choose a valid destination and a card to swap.');const target=s.locations[city],from=s.locations[c.city];const token=target.deck.splice(index,1,'dracula')[0];const found=from.resolved.indexOf('dracula');if(found<0)throw Error('Dracula identity is missing.');from.resolved.splice(found,1);from.deck=shuffle([...from.deck,token]);target.deck=shuffle(target.deck);s.players[4].city=city;const message=c.escape==='mist'?'Dracula escaped as Mist; destination secret.':`Dracula escaped as Bats to ${cities[city]}.`;applyDeferredKnockouts(s);s.combat=null;return message;}

export function psychicTargets(s:State,source:string):Player[]{const mina=s.players.find(p=>p.id===source);return mina?s.players.filter(p=>p.side==='hunter'&&p.id!==mina.id&&p.city===mina.city&&p.recovery==='none'&&hp(s,p)>0&&p.hand.length>0):[];}

export function medicalTargets(s:State,source:string):Player[]{const healer=s.players.find(p=>p.id===source);return healer?s.players.filter(p=>p.side==='hunter'&&p.city===healer.city&&p.recovery==='none'&&hp(s,p)>0):[];}

export function visionCities(s:State,source:string):number[]{const mina=s.players.find(p=>p.id===source);return mina?s.locations.map((_,i)=>i).filter(i=>i!==mina.city&&s.locations[i].deck.length>0):[];}
export function visionPeek(s:State,viewer:string,debug=false):Encounter|null{const v=s.pendingVision;return v&&v.city!==null&&(viewer===v.player||debug)?s.locations[v.city].deck[0]??null:null;}

export function tradePartners(s:State):Player[]{const p=active(s);return p.side==='hunter'&&p.recovery==='none'&&p.hand.length>=1&&p.hand.length+p.equipment.length>=2?s.players.filter(h=>h.side==='hunter'&&h.id!==p.id&&h.city===p.city&&h.recovery==='none'&&hp(s,h)>0&&h.hand.length+h.equipment.length>0):[];}

export function itemAllyTargets(s:State,p:Player,id:string){
 return alliesAt(s,p.city).filter(ally=>ally.revealed&&(cards[id].removesAnyAlly||cards[id].removesAlly===ally.card));
}
function useItem(s:State,player:Player,id:string,ally?:string){
 if(!cards[id]?.item||player.side!=='hunter'||player.recovery!=='none')throw Error('Only a conscious Hunter can use an Item.');
 if(cards[id].removesAnyAlly||cards[id].removesAlly){
  const targets=itemAllyTargets(s,player,id);
  const target=ally??(targets.length===1?targets[0].card:undefined);
  if(!target||!targets.some(a=>a.card===target))throw Error('Choose one revealed ally at your city.');
  detachAlly(s,player.city,target);
  return `removed ${cards[target].name} from ${cities[player.city]}`;
 }
 const healed=Math.min(player.damage,cards[id].healing??0);
 player.damage-=healed;
 return `healed ${healed} HP`;
}

function applyDeferredKnockouts(s:State){for(const id of s.combat?.pendingKnockouts??[]){const p=s.players.find(p=>p.id===id);if(p)hurt(s,p,0);}}


const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'] as const;
export function calendar(s:Pick<State,'round'>){
 const elapsed=s.round-1;
 return {week:Math.floor(elapsed/7)+1,day:elapsed%7+1,weekday:weekdays[elapsed%7]};
}
export function calendarLabel(s:Pick<State,'round'>){const c=calendar(s);return `Week ${c.week}, day ${c.day} (${c.weekday})`;}
export function darkness(s:State){
 const weekly=(calendar(s).week-1)*3;
 const allies=s.locations.reduce((n,_,city)=>n+alliesAt(s,city).length,0);
 return {weekly,events:s.eventDarkness,exhaustions:s.exhaustionDarkness,accumulated:weekly+s.eventDarkness+s.exhaustionDarkness,allies,total:weekly+s.eventDarkness+s.exhaustionDarkness+allies};
}
function checkDarknessVictory(s:State){
 if(!s.winner&&darkness(s).total>=s.config.darknessTarget){
  s.winner='dracula';
  s.log.push(`Dracula wins with ${darkness(s).total} Darkness (target ${s.config.darknessTarget}).`);
 }
}
// Event Darkness is accumulated permanently, independently of deployed allies.
export function grantEventDarkness(s:State,amount:number){
 if(s.winner)throw Error('Game over: no further Darkness can be gained.');
 if(!Number.isSafeInteger(amount)||amount<=0||!Number.isSafeInteger(s.eventDarkness+amount))throw Error('Event Darkness must be a positive whole number.');
 s.eventDarkness+=amount;
 s.log.push(`An event granted Dracula ${amount} accumulated Darkness.`);
 checkDarknessVictory(s);
}

export function alliesAt(s:State,city:number):DeployedAlly[]{return [s.locations[city]?.ally,s.locations[city]?.wraith].filter((a):a is DeployedAlly=>!!a);}
export function maxHP(s:State,p:Player){
 return p.side==='hunter'?s.config.hunterHP+p.equipment.reduce((n,id)=>n+(cards[id]?.maxHP??0),0):s.config.draculaHP+(s.locations.some(l=>l.ally?.card==='dm-renfield')?2:0);
}
function adjustCapacity(s:State,p:Player,previousHP:number,previousMax:number){
 const nextMax=maxHP(s,p);const nextHP=Math.min(nextMax,previousHP+Math.max(0,nextMax-previousMax));p.damage=nextMax-nextHP;
}
function equip(s:State,p:Player,card:string,index:number|undefined,destination:'discard'|'trash'|undefined,requireChoice:boolean){
 const before=hp(s,p),capacity=maxHP(s,p);
 if(p.equipment.length>=2){const slot=index??(requireChoice?-1:0);if(!Number.isInteger(slot)||slot<0||slot>=p.equipment.length)throw Error('Choose which equipped item to replace.');const replaced=p.equipment.splice(slot,1)[0];if(destination!=='trash')p.discard.push(replaced);s.log.push(`${p.name} ${destination==='trash'?'trashed permanently':'discarded'} replaced ${cards[replaced].name}.`);}
 else if(index!==undefined)throw Error('A free equipment slot is available.');
 p.equipment.push(card);adjustCapacity(s,p,before,capacity);
}
export function isOpenLocation(s:State,city:number){const l=s.locations[city];return !!l&&!l.closed&&l.deck.length>0;}
export function canPlaceAlly(s:State,card:string,city:number){
 if(!Number.isInteger(city)||!isOpenLocation(s,city)||!cards[card]?.ally)return false;
 if(card==='dm-6')return !s.locations.some(l=>l.wraith);
 if(card==='dm-renfield'&&s.locations.some(l=>l.ally?.card===card))return false;
 return !s.locations[city].ally;
}
function detachAlly(s:State,city:number,card:string){
 const l=s.locations[city];const before=hp(s,s.players[4]),capacity=maxHP(s,s.players[4]);
 if(l.wraith?.card===card){l.wraith=null;s.pendingWraith=null;}else if(l.ally?.card===card)l.ally=null;else throw Error('Choose a city with that ally.');
 adjustCapacity(s,s.players[4],before,capacity);
}
export function removeLocationAlly(s:State,city:number,card?:string){
 if(s.winner)throw Error('Game over: allies cannot be removed.');
 if(!Number.isInteger(city)||!alliesAt(s,city).length)throw Error('Choose a city with an ally.');
 detachAlly(s,city,card??alliesAt(s,city)[0].card);
}
export function removableEquipment(s:State,p=active(s)){
 if(s.winner||s.combat||hasPendingAction(s)||s.pendingWraith||s.played||p.side!=='hunter'||p.recovery!=='none'||hp(s,p)===0)return [];
 return p.equipment.map((card,index)=>({card,index})).filter(({card})=>alliesAt(s,p.city).some(a=>a.revealed&&(cards[card].removesAnyAlly||a.card===cards[card].removesAlly)));
}
function hasPendingAction(s:State){return !!(s.pendingInvestigation||s.correspondence||s.pendingAssessment||s.pendingSearch||s.pendingDispatch||s.pendingAlly||s.pendingVision||s.pendingMedical||s.pendingPsychic||s.pendingFortune||s.pendingSupply||s.pendingInfluence||s.pendingTravel||s.pendingSwap||s.pendingEncounter);}
function sacrificeEquipment(s:State,index:number,ally?:string){
 const p=active(s);if(!removableEquipment(s,p).some(e=>e.index===index))throw Error('Use your unused Day or Night action and matching equipped item at a revealed Ally’s city.');
 const card=p.equipment[index];const targets=alliesAt(s,p.city).filter(a=>a.revealed&&(cards[card].removesAnyAlly||a.card===cards[card].removesAlly));const target=ally??(targets.length===1?targets[0].card:undefined);if(!target||!targets.some(a=>a.card===target))throw Error('Choose one revealed ally at your city.');const before=hp(s,p),capacity=maxHP(s,p);p.equipment.splice(index,1);adjustCapacity(s,p,before,capacity);
 detachAlly(s,p.city,target);s.played=true;
 return `${p.name} trashed ${cards[card].name} permanently to remove ${cards[target].name} in ${cities[p.city]}. Dracula lost 1 Ally Darkness.`;
}
function settleLocations(s:State){
 s.locations.forEach((l,city)=>{
  // Dracula's revealed identity still occupies this location until the showdown finishes.
  const identityInCombat=!!s.combat&&s.combat.city===city&&l.resolved.includes('dracula');
  if(!l.deck.length&&!identityInCombat&&!l.closed){l.closed=true;s.log.push(`${cities[city]} consecrated permanently: no encounters remain.`);}
  if(l.closed){for(const a of alliesAt(s,city)){detachAlly(s,city,a.card);s.log.push(`${cards[a.card].name} removed from consecrated ${cities[city]}; Dracula lost 1 Ally Darkness.`);}}
  else if(s.players.some(p=>p.side==='hunter'&&p.city===city)){for(const a of alliesAt(s,city))if(!a.revealed){a.revealed=true;s.log.push(`Ally revealed in ${cities[city]}: ${cards[a.card].name}.`);}}
 });
}
function addBasicEncounter(s:State,city:number){if(!isOpenLocation(s,city))throw Error('New encounters cannot be placed in a consecrated location.');s.locations[city].deck=shuffle([...s.locations[city].deck,'encounter']);s.addedBasicEncounters++;}
export function wraithDestinations(s:State){
 const from=s.pendingWraith?.city??s.locations.findIndex(l=>l.wraith);
 return cities.map((_,i)=>i).filter(i=>adjacent(from,i)&&isOpenLocation(s,i));
}
function startNight(s:State){
 settleLocations(s);
 for(let city=0;city<9;city++)if(s.locations[city].ally?.card==='dm-renfield'&&isOpenLocation(s,city)){addBasicEncounter(s,city);s.log.push(`Renfield added a basic encounter in ${cities[city]}; its pile was shuffled.`);}
 const city=s.locations.findIndex(l=>l.wraith);
 if(city>=0){if(wraithDestinations(s).length)s.pendingWraith={city,stage:'move'};else s.log.push('Wraith has no open adjacent city; its Night ability is skipped.');}
}
function moveWraith(s:State,city:number){
 const pending=s.pendingWraith;if(!pending||pending.stage!=='move'||!Number.isInteger(city)||!wraithDestinations(s).includes(city))throw Error('Move Wraith to an open orthogonally adjacent city.');
 const wraith=s.locations[pending.city].wraith;if(!wraith)throw Error('Wraith is missing.');s.locations[pending.city].wraith=null;s.locations[city].wraith=wraith;s.pendingWraith={city,stage:'peek'};
}
export function wraithPeek(s:State,viewer:string,debug=false):Encounter|null{
 const pending=s.pendingWraith;return pending?.stage==='peek'&&(viewer==='dracula'||debug)?s.locations[pending.city].deck.at(-1)??null:null;
}
function returnWraithEncounter(s:State,position:'top'|'bottom'){
 const pending=s.pendingWraith;if(!pending||pending.stage!=='peek'||!['top','bottom'].includes(position))throw Error('Examine the bottom encounter first.');
 const deck=s.locations[pending.city].deck;if(position==='top'&&deck.length)deck.unshift(deck.pop()!);s.pendingWraith=null;
}

function validateMinions(s:State){
 for(const l of s.locations){
  if(typeof l.closed!=='boolean'||(l.closed&&(l.deck.length||l.ally||l.wraith)))throw Error('Invalid consecrated location.');
  if(l.wraith!==null&&(!l.wraith||l.wraith.card!=='dm-6'||typeof l.wraith.revealed!=='boolean'))throw Error('Invalid Wraith.');
  if(l.ally?.card==='dm-6')throw Error('Wraith must use its sharing slot.');
  if(!l.closed&&!l.deck.length&&!(s.combat&&s.locations[s.combat.city]===l&&l.resolved.includes('dracula')))throw Error('Empty locations must be consecrated.');
 }
 if(s.locations.filter(l=>l.wraith).length>1||s.locations.filter(l=>l.ally?.card==='dm-renfield').length>1)throw Error('Duplicate unique minion.');
 if(s.pendingWraith!==null){const w=s.pendingWraith;if(!w||!Number.isInteger(w.city)||!s.locations[w.city]?.wraith||!['move','peek'].includes(w.stage)||s.phase!=='night'||s.turn!==0||s.combat||hasPendingAction(s)||s.played||(w.stage==='move'&&!wraithDestinations(s).length))throw Error('Invalid pending Wraith ability.');}
}

export function correspondencePartners(s:State){
 const p=active(s);
 return s.players.filter(h=>h.side==='hunter'&&h.id!==p.id&&h.recovery==='none'&&hp(s,h)>0&&h.hand.length>0);
}
export function canPlayStandard(s:State,p:Player,card:string,index=p.hand.indexOf(card)){
 const c=cards[card];
 if(s.winner||s.combat||s.pendingWraith||(s.played&&s.nightPlay!=='choose'&&s.correspondence?.stage!=='play')||p.id!==active(s).id||p.recovery!=='none'||!c||c.side!==p.side||!c.timing.includes(cardPhase(s)))return false;
 if(s.correspondence?.stage==='play'&&s.correspondence.index!==index)return false;
 if(card==='signature-2-0'&&(p.hand.length<2||!correspondencePartners(s).length))return false;
 if(c.item&&(c.removesAnyAlly||c.removesAlly)&&!itemAllyTargets(s,p,card).length)return false;
 if(combatCardAllowed(card)&&card!=='combat'&&!c.item)return false;
 if(c.ally&&!cities.some((_,city)=>canPlaceAlly(s,card,city)))return false;
 if(card==='signature-4-0'&&!psychicTargets(s,p.id).length)return false;
 if(card==='signature-4-1'&&!visionCities(s,p.id).length)return false;
 if(card==='d-2')return s.locations.some((l,city)=>isOpenLocation(s,city)&&adjacent(draculaLocation(s),city))||s.locations.filter((l,city)=>isOpenLocation(s,city)&&l.deck.some(c=>c!=='dracula')).length>=2;
 if(card==='d-0')return cities.some((_,city)=>canPlaceEncounter(s,city));
 return true;
}

function receiveTrade(s:State,p:Player,id:string,to:TradeReceipt,handIndex?:number){
 if(to.destination==='equipment'){if(!cards[id].equipment)throw Error('Only equipment can enter equipment slots.');equip(s,p,id,to.replaceIndex,to.replacedDestination,true);}
 else if(to.destination==='discard')p.discard.push(id);
 else if(to.destination==='hand')p.hand.splice(handIndex??p.hand.length,0,id);
 else throw Error('Choose a valid trade destination.');
}

export function createSetup(selected=[0,1,2,3]):State{const s=createGame(selected,0);s.setupIndex=0;s.players.forEach(p=>p.city=-1);s.locations=cities.map(()=>({deck:['encounter','encounter','encounter','encounter'],resolved:[],closed:false,ally:null,wraith:null}));s.log=['Setup: Hunters choose their starting cities first, then Dracula chooses secretly after seeing them.'];return s;}
function validateSetup(s:State){const index=s.setupIndex;if(!Number.isInteger(index)||index!<0||index!>4||s.round!==1||s.phase!=='day'||s.turn!==0||s.played||s.winner||s.combat||s.pendingWraith||s.pendingSupply||s.pendingInfluence||s.pendingFortune||s.pendingTravel||s.pendingEncounter||s.pendingSwap||s.pendingAlly||s.pendingMedical||s.pendingPsychic||s.pendingVision||s.pendingSearch||s.pendingDispatch||!Array.isArray(s.locations)||s.locations.length!==9)throw Error('Invalid starting-city setup.');s.players.forEach((p,i)=>{if(i<index!?(p.city<0||p.city>8):p.city!==-1)throw Error('Invalid starting-city selection order.');});if(s.locations.some(l=>l.closed||l.ally||l.wraith||l.resolved.length||l.deck.length!==4||l.deck.some(c=>c!=='encounter')))throw Error('Invalid setup encounter piles.');}

export function dispatchTargets(s:State){return s.players.filter(h=>h.side==='hunter'&&h.recovery==='none'&&hp(s,h)>0);}
export function searchPeek(s:State,viewer:string,debug=false):Encounter[]{return s.pendingSearch&&(viewer===s.pendingSearch||debug)?s.locations[active(s).city].deck.slice(0,2):[];}

function resolveEvent(s:State,actor:Player,id:string){const effect=cards[id].event!;const details:string[]=[];
 if(effect.healAll||effect.drawAll){for(const h of s.players.filter(h=>h.side==='hunter'&&h.recovery==='none'&&hp(s,h)>0)){const healed=Math.min(h.damage,effect.healAll??0);h.damage-=healed;const before=h.hand.length;draw(h,effect.drawAll??0);details.push(`${h.name}: healed ${healed} HP, drew ${h.hand.length-before}`);}}
 if(effect.encountersPerCity){const affected:string[]=[];for(let city=0;city<s.locations.length;city++){if(!isOpenLocation(s,city))continue;for(let count=0;count<effect.encountersPerCity;count++)addBasicEncounter(s,city);affected.push(cities[city]);}details.push(`Brush with Darkness added to ${affected.join(', ')||'no open cities'}; affected piles shuffled`);}
 if(effect.darkness)grantEventDarkness(s,effect.darkness);
 return `${actor.name} played ${cards[id].name}: ${details.join('; ')}${effect.darkness?`; +${effect.darkness} accumulated Darkness`:''}. Event trashed permanently.`;
}

function recordResolution(before:State,after:State,a:Action){
 if(a.type==='advance'&&!after.winner&&darkness(before).total===darkness(after).total)return;
 after.latestResolution={entries:after.log.slice(before.log.length).filter(Boolean),debug:('debug' in a&&a.debug===true)||['draw','add','remove','city','stack'].includes(a.type)};
}
