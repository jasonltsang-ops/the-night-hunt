export const cities = ['London','Paris','Prague','Madrid','Munich','Vienna','Marseille','Rome','Athens'] as const;

export const hunters = ['Lord Godalming','Jonathan Harker','Van Helsing','Dr. Seward','Mina Harker'];

export type Card = { id:string; name:string; side:'hunter'|'dracula'; timing:('day'|'night')[]; description:string; event?:{healAll?:number;drawAll?:number;darkness?:number;encountersPerCity?:number}; travel?:number; nightTravel?:number; trashOnPlay?:boolean; groupTravel?:boolean; healing?:number; healCompanion?:boolean; strength?:number; coordinatedStrength?:number; discardStrength?:number; endsShowdownDamage?:number; selfDamage?:number; combatEffect?:'disarm'|'mesmerize'; equipment?:boolean; trashAfterCombat?:boolean; removesAnyAlly?:boolean; item?:boolean; removesAllyType?:string; removesAlly?:string; maxHP?:number; encounterReduction?:number; investigation?:'top'|'bottom'|'rumors'|'repeat'|'discard'; escape?:'mist'|'bats'; ally?:{type:string;strength:number;victoryDamage?:number} };

const make = (id:string,name:string,side:Card['side'],description:string):Card => ({id,name,side,timing:['day','night'],description});

export const cards:Record<string,Card> = {};

function add(id:string,name:string,side:Card['side'],description='Effect reserved for a later stage.') { cards[id]=make(id,name,side,description); return id; }

add('travel','Ready the Carriage','hunter','Move one adjacent city.'); add('supply','Visit the Market','hunter',''); add('investigate','Investigate','hunter','Reveal and resolve the top encounter at your city.'); add('combat','Combat','hunter','Combat bonus +2 (Stage 4).');

export const signatures = [['Family Fortune',"Lucy’s Revenge"],['Methodical Search','Urgent Dispatch'],['Correspondence','Vampire Lore'],['Medical Expertise','Wax Cylinders'],['Hypnosis','Rally the Hunters']].map((pair,i)=>pair.map((name,j)=>add(`signature-${i}-${j}`,name,'hunter')));

export const retiredHunterCards = ['hm-5','hm-8','hm-10','hm-12c','hm-13b','hm-15b','hm-16','hm-20b','hm-23','hm-24','hm-27','hm-28','hm-29'];
export const hunterMarket = ['Wooden Stake','Holy Water','Crucifix','Hunting Rifle','Silver Dagger','Blessed Blade','Reinforced Coat of Arms','Medical Kit','Garlic Wreath','Pistol','Medical Kit','Medical Assistance','First Aid','Fast Horse','Travel by Train','Group Passage','Emergency Transit','Thorough Search','Careful Investigation','Local Rumors','Coordinated Search','Planned Ambush','Uncover Conspiracy','Sacred Investigation','Determined Assault','Coordinated Strike','Vampire Slayer','Defensive Formation','Final Stand','Prepared Ambush'].flatMap((name,i)=>retiredHunterCards.includes(`hm-${i}`)?[]:[add(`hm-${i}`,name,'hunter')]);

export const retiredDraculaCards=['dm-2','dm-3','dm-7','dm-8','dm-9'];
export const draculaMarket = ['Escape as Mist','Escape as Bats','Escape as Bats','False Trail','Vampire Bride','Wolf Pack','Dark Familiar','Deadly Ambush','Lost in Darkness','Gathering Darkness'].flatMap((name,i)=>retiredDraculaCards.includes(`dm-${i}`)?[]:[add(`dm-${i}`,name,'dracula')]);

['Savage Attack','Delaying Encounter','Shadow Passage','Dark Influence','Call of the Night','Brush with Darkness'].forEach((name,i)=>add(`d-${i}`,name,'dracula'));

add('d-fog','Fog','dracula','Night: Add to any open city. Day: Add to an open city within 1 connection of Dracula, including his city. Announce the city and shuffle its pile. When investigated, the Hunter discards a random card. Remove Fog by Day or shuffle it back at Night.');
export const startingEncounterMix = cities.map((city,i)=>({
 encounter:city==='Munich'?3:4,
 fog:[0,2,4,6,8].includes(i)?1:0,
 damaging:[1,3,4,5,7].includes(i)?1:0,
}));
export const encounterNames={encounter:'Brush with Darkness',dracula:'Dracula',damaging:'Savage Attack',fog:'Fog'};

export const defaults = { handSize:3, hunterHP:4, draculaHP:10, darknessTarget:10, hunterBase:1, draculaBase:3, basicCombat:1, brushDamage:1, savageDamage:2 };

export function adjacent(a:number,b:number) { return a>=0 && a<9 && b>=0 && b<9 && Math.abs(a%3-b%3)+Math.abs(Math.floor(a/3)-Math.floor(b/3))===1; }



for(const [id,range] of [['travel',1],['hm-13',2],['hm-14',3]] as const){cards[id].travel=range;cards[id].description=`Move up to ${range} connection(s); choose a destination on the map.`;}


cards.supply.timing=['day','night'];


cards['hm-13'].nightTravel=1;
cards['hm-13'].description='Move up to 2 connections by Day or 1 by Night. Adds no encounter. Discard after play.';
cards['hm-15'].travel=2;
cards['hm-15'].groupTravel=true;
cards['hm-15'].trashOnPlay=true;
cards['hm-15'].description='Move up to 2 connections by Day or Night. You may bring any number of other conscious Hunters from your city. Trash after play.';
cards['hm-14'].trashOnPlay=true;
cards['hm-14'].description='Move up to 3 connections by Day or Night. Adds no encounter. Trash after play.';

cards['d-2'].timing=['day','night'];
cards['d-4'].description='Night: Heal 1 HP. Day: Immediately play another card as if it were Night.';

cards['d-3'].timing=['day','night'];
export const darkInfluenceText={night:'Acquire 1 Dracula card or trash 1 Hunter card from the market.',day:'Trash 1 Hunter card from the market.'};
cards['d-3'].description='Night: '+darkInfluenceText.night+' Day: '+darkInfluenceText.day;

cards['d-0'].timing=['day','night'];
cards['d-5'].description='Encounter: deals 1 damage when investigated.';
cards['d-0'].description='Night: Add to any open city. Day: Add to an open city within 1 connection of Dracula, including his city. Announce that city and shuffle its encounter deck. Deals 2 damage when investigated.';

cards.travel.timing=['day','night'];
cards.travel.description='Move one connection. At Night, add a Brush with Darkness to the destination pile if open. Or discard to draw 1 card.';

cards.combat.name='A Lucky Find';
cards.combat.timing=['day','night'];
cards.combat.healing=1;
cards.combat.description='Choose: heal yourself for 1 hitpoint OR contribute +1 strength during combat. Full combat is not implemented in this discovery-wins playtest.';

// Prototype combat values; conditional bonuses remain future work.
[2,1,1,2,2,2,1,1,1,1].forEach((strength,i)=>{const card=cards['hm-'+i];if(card){card.strength=strength;card.equipment=true;card.description='+'+strength+' Str.';}});
cards['hm-6'].encounterReduction=1;
cards['hm-6'].description='+1 Str. Prevent 1 encounter damage.';
cards['hm-17'].investigation='top';
cards['hm-17'].description='Review the top 2 cards at your city. Investigate one and leave the other on top. Discard after play.';
cards['hm-18'].investigation='bottom';
cards['hm-18'].description='Review the top 2 cards at your city. Investigate one and put the other on the bottom. Discard after play.';
cards['hm-19'].investigation='rumors';
cards['hm-19'].description='Review the top 4 cards at your city, then shuffle the location deck. Discard after play.';
cards['hm-20'].investigation='repeat';
cards['hm-20'].description='Investigate. If another Hunter is at your city, you may investigate again. Discard after play.';
cards['hm-22'].investigation='discard';
cards['hm-22'].description='Reveal the top card at your city. Discard an encounter without taking damage. If you reveal Dracula, begin a showdown.';
cards['hm-21'].endsShowdownDamage=2;
cards['hm-21'].description='Combat: cancel Dracula’s combat card, deal 2 damage to Dracula, and immediately end the showdown.';
cards['hm-9'].discardStrength=2;
cards['hm-9'].description='+1 Str, or discard for +2 Str in this showdown.';
for(const [id,strength] of [['combat',1],['signature-0-1',3],['signature-2-1',2],['hm-25',1],['hm-26',2]] as const){cards[id].strength=strength;if(id!=='combat')cards[id].description='Keep in hand: +'+strength+' strength in combat. Conditional effects remain deferred; signature values are provisional.';}
cards.combat.description='Heal 1 HP or discard in combat for +1 Str.';
cards['signature-2-1'].description='Use in combat for +2 Str. Or play on your turn to discard one random card from your hand or Dracula’s hand. Then discard Vampire Lore.';
cards['signature-0-1'].description='Use in combat for +3 Str, then discard.';
cards['dm-0'].escape='mist';cards['dm-0'].description='Choose as your combat card. If Dracula survives, optionally escape one connection after combat. Destination stays secret. Night action: move 1 connection secretly.';
cards['dm-1'].escape='bats';cards['dm-1'].description='Choose as your combat card. If Dracula survives, optionally escape up to two connections after combat. Final destination is public. Day action: move 1 connection secretly.';

// Location allies share one prototype bonus, with types retained for future effects.
for(const [id,type] of [['dm-4','Vampire'],['dm-5','Beast'],['dm-6','Supernatural']] as const){cards[id].ally={type,strength:2};cards[id].timing=['day','night'];cards[id].description='Play by Day or Night: attach face-down to any city with no ally. Grants Dracula +2 strength in combat at that city and +1 Darkness while deployed. Removing it loses that Darkness point. One ally per city.';}

cards['signature-0-0'].description='Acquire two Hunter cards from the shared market into your discard pile. You cannot deny or replace cards. If fewer than two Hunter cards are available, acquire as many as possible.';

cards['signature-4-0'].description='Choose another conscious Hunter at your city to discard one random card from their hand. Then learn whether Dracula is in your city or any surrounding city, including diagonals. His exact location stays hidden. Requires another Hunter with a card in hand.';

cards['signature-3-0'].healing=2;cards['signature-3-0'].description='Heal yourself or another conscious Hunter at your city for 2 HP, up to full health. Cannot revive a Exhausted Hunter or skip recovery.';

cards['signature-2-0'].description='Day or Night. Exchange one card from your hand with a conscious Hunter anywhere. You may immediately play the exact card you received if it is legal this phase.';
cards['signature-3-1'].description='Choose any city occupied by a Hunter. Reveal its top encounter, then return it to the top or bottom without resolving it.';
cards['signature-4-1'].description='Move another conscious Hunter one connection closer to your city. This uses no action for that Hunter and adds no Night encounter.';

cards['d-2'].description='Night: Swap Dracula with a card in an adjacent city, or bluff by swapping two non-Dracula cards between adjacent cities. Shuffle both piles and announce only the cities. Day: Privately view the top encounter of any city. You may shuffle that pile.';

export const visitTheMarketText={day:'Acquire 1 Hunter card or trash 1 Dracula card.',night:'Trash 1 card and refill its slot.'};
cards.supply.description='Day: '+visitTheMarketText.day+' Night: '+visitTheMarketText.night;

// Intended sacrifice targets; ally removal is pending implementation.
for(const [id,type] of [['hm-0','Vampire'],['hm-1','Undead'],['hm-2','Supernatural'],['hm-3','Beast']] as const)cards[id].removesAllyType=type;

cards['hm-12'].healing=1;
cards['hm-12'].healCompanion=true;
cards['hm-12'].description='Heal yourself and one other conscious Hunter at your city for 1 HP each. Discard after play.';

// Consumable Items use no equipment slots.
cards['hm-7'].item=true;cards['hm-7'].equipment=false;delete cards['hm-7'].strength;cards['hm-7'].healing=2;cards['hm-7'].description='Heal yourself for 2 HP, then trash.';

cards['hm-25'].coordinatedStrength=2;
cards['hm-25'].description='+1 Str, or +2 Str if another Hunter is participating at your city. Discard after play.';
cards['hm-26'].description='+2 Str. Discard after play.';
export const recklessAssault=add('hm-reckless','Reckless Assault','hunter');
hunterMarket.push(recklessAssault);
cards[recklessAssault].strength=2;
cards[recklessAssault].selfDamage=1;
cards[recklessAssault].description='+2 Str. Lose 1 HP immediately when chosen. If you reach 0 HP, finish the showdown before becoming Exhausted. Discard after play.';


// Unique persistent equipment and the four current minions.
hunterMarket.push(add('hm-salts','Smelling Salts','hunter'));
draculaMarket.push(add('dm-renfield','Renfield','dracula'));
cards['dm-5'].name='Great Wolf';
cards['dm-6'].name='Wraith';
cards['hm-0'].strength=2;
cards['hm-0'].item=true;
cards['hm-0'].equipment=false;
cards['hm-0'].trashAfterCombat=true;
cards['hm-0'].description='Play as your combat card for +2 Str, then trash. Or trash to remove a revealed Vampire Bride at your city.';
cards['hm-3'].strength=1;
cards['hm-3'].description='+1 Str. Trash to remove Great Wolf.';
cards['hm-2'].strength=undefined;cards['hm-2'].encounterReduction=1;
cards['hm-2'].description='Prevent 1 encounter damage. Trash to banish Wraith.';
cards['hm-salts'].equipment=true;cards['hm-salts'].maxHP=1;
cards['hm-salts'].description='+1 max HP and heal 1 HP when equipped. Trash to remove Renfield.';
for(const id of hunterMarket){delete cards[id].removesAllyType;delete cards[id].removesAlly;}
for(const [equipment,ally] of [['hm-0','dm-4'],['hm-3','dm-5'],['hm-2','dm-6'],['hm-salts','dm-renfield']])cards[equipment].removesAlly=ally;
cards['dm-4'].ally={type:'Vampire',strength:0,victoryDamage:3};
cards['dm-5'].ally={type:'Beast',strength:2};
cards['dm-6'].ally={type:'Supernatural',strength:0};
cards['dm-renfield'].ally={type:'Human',strength:0};
cards['dm-4'].description='At this city, Dracula’s showdown victory deals +3 damage. +1 Darkness. Vulnerable to Wooden Stake.';
cards['dm-5'].description='+2 Str for Dracula at this city. +1 Darkness. Vulnerable to Hunting Rifle.';
cards['dm-6'].description='Start of Dracula’s Night turn: move 1 connection to an open city, even with another Ally. Privately move its bottom encounter to the top or leave it. +1 Darkness. Vulnerable to Crucifix.';
cards['dm-renfield'].description='+2 max HP for Dracula and heal 2 HP on deployment. Start of Dracula’s Night turn: shuffle a Brush with Darkness into Renfield’s city. +1 Darkness. Vulnerable to Smelling Salts.';

// Medical Assistance becomes a second copy of the Medical Kit Item.
cards['hm-11']={...cards['hm-7'],id:'hm-11'};

cards['hm-1'].equipment=false;cards['hm-1'].item=true;cards['hm-1'].strength=2;cards['hm-1'].trashAfterCombat=true;cards['hm-1'].removesAnyAlly=true;cards['hm-1'].description='Play as your combat card for +2 Str, then trash. Or trash to remove a revealed Ally at your city.';

export const combatOrder=['Lord Godalming','Jonathan Harker','Dr. Seward','Van Helsing','Mina Harker'] as const;

cards['signature-1-0'].description='Privately examine the top two encounters at your city. Choose one to reveal and resolve; shuffle the other back into the remaining pile. With one encounter, resolve that one. An empty pile has no effect.';
cards['signature-1-1'].description='Move yourself or another conscious Hunter one orthogonally connected city. Does not consume that Hunter’s action or add an encounter from Ready the Carriage at Night.';

function addHunterCopies(copies:string[][]){
 return copies.map(([id,original])=>{
  cards[id]={...cards[original],id};
  hunterMarket.push(id);
  return id;
 });
}
export const addedHunterCopies = addHunterCopies([
 ['hm-12b','hm-12'],['hm-14b','hm-14'],
]);
export const extraUncoverConspiracy='hm-22b';
export const addedInvestigationCopies=addHunterCopies([
 ['hm-17b','hm-17'],['hm-18b','hm-18'],['hm-19b','hm-19'],[extraUncoverConspiracy,'hm-22'],
]);

export const newDraculaCombatCards=[
 add('dm-unholy','Unholy Strength','dracula','+1 Str. Choose one equipped item a participating Hunter must discard. Discard after play.'),
 add('dm-mesmerize','Mesmerize','dracula','Set one participating Hunter’s total Str to 0 for this showdown. Discard after play.'),
 add('dm-pride','Pride of Dracula','dracula','+4 Str. Dracula takes 2 damage immediately when chosen. Discard after play.'),
];
draculaMarket.push(...newDraculaCombatCards);
cards['dm-unholy'].strength=1;
cards['dm-unholy'].combatEffect='disarm';
cards['dm-mesmerize'].combatEffect='mesmerize';
cards['dm-pride'].strength=4;
cards['dm-pride'].selfDamage=2;

export const eventCards=['hm-texas','dm-hildesheim'] as const;
hunterMarket.push(add('hm-texas','Quincy Morris','hunter'));
cards['hm-texas'].event={healAll:2,drawAll:1};
cards['hm-texas'].description='Event: every conscious Hunter heals 2 HP and draws 1 card. Play by Day or Night as your action, then trash permanently. Does not revive Exhausted Hunters.';
draculaMarket.push(add('dm-hildesheim','Immanuel Hildesheim','dracula'));
cards['dm-hildesheim'].event={encountersPerCity:1};
cards['dm-hildesheim'].description='Shuffle 1 Brush with Darkness into each open city, then trash.';
