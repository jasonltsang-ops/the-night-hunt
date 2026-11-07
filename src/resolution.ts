import {visitTheMarketText} from './data';
import {cardPhase,nextCombatPlayer,type State} from './engine';

export function resolutionView(s:State,debug=false){
 const snapshot=s.latestResolution;
 const entries=snapshot?(snapshot.debug&&!debug?[]:snapshot.entries.filter(e=>debug||!e.startsWith('Debug:'))):s.log.filter(e=>debug||!e.startsWith('Debug:')).slice(-1);
 let status='Resolved',next='';
 if(s.winner){status='Game over';next=s.winner==='hunters'?'Hunters win: Dracula was defeated.':'Dracula wins: the Darkness target was reached.';}
 else if(s.combat){status='Combat in progress';next=s.combat.stage==='cards'?`${nextCombatPlayer(s)?.name??'All combatants have chosen'}${nextCombatPlayer(s)?': choose a combat card or no card.':'; resolve the showdown.'}`:s.combat.stage==='damage'?'Dracula allocates the combat damage.':'Dracula chooses whether and where to escape.';}
 else if(s.nightPlay==='choose'){status='Choice needed';next='Call of the Night: immediately play one more card using its Night ability.';}
 else if(s.correspondence){status='Choice needed';next=s.correspondence.stage==='trade'?'Exchange one hand card with another Hunter.':'Play the received card or end your turn to keep it.';}
 else if(s.pendingAssessment){status='Choice needed';next='Choose one card from Dr. Seward’s hand to discard.';}
 else if(s.pendingInvestigation){status='Choice needed';next='Resolve the investigation choice below the map.';}
 else if(s.pendingSearch){status='Choice needed';next='Choose one examined encounter to resolve in Methodical Search.';}
 else if(s.pendingDispatch){status='Choice needed';next=s.pendingRally?'Choose another Hunter and move them one connection closer.':'Choose a Hunter and adjacent destination for Urgent Dispatch.';}
 else if(s.pendingSupply||s.pendingInfluence||s.pendingFortune){status='Choice needed';next=s.pendingFortune?`Acquire ${s.pendingFortune} more Hunter card(s) for Family Fortune.`:s.pendingInfluence?cardPhase(s)==='night'?'Dark Influence: acquire a Dracula card or deny a Hunter card.':'Dark Influence: deny a Hunter card.':visitTheMarketText[s.phase];}
 else if(s.pendingTravel){status='Choice needed';next='Choose a valid destination on the map.';}
 else if(s.pendingEncounter||s.pendingAlly||s.pendingSwap||s.pendingWraith){status='Choice needed';next=s.pendingSwap?'Dracula resolves the hidden Shadow Passage swap.':s.pendingWraith?'Dracula resolves Wraith’s ability.':s.pendingAlly?'Dracula chooses a city for the ally.':'Dracula chooses a city for the encounter.';}
 else if(s.pendingVision||s.pendingMedical||s.pendingPsychic){status='Choice needed';next=s.pendingVision?s.pendingVision.wax?'Choose a Hunter’s city or return the revealed card.':'Resolve Shared Vision in the private character controls.':s.pendingMedical?'Choose a Hunter to heal.':'Choose another Hunter to contribute a card to Hypnosis.';}
 return {entries,status,next};
}
