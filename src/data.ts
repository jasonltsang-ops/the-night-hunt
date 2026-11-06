export const cities = ['London','Paris','Prague','Madrid','Munich','Vienna','Marseille','Rome','Athens'] as const;

export const hunters = ['Lord Godalming','Jonathan Harker','Van Helsing','Dr. Seward','Mina Harker'];

export type Card = { id:string; name:string; side:'hunter'|'dracula'; timing:('day'|'night')[]; description:string; travel?:number; healing?:number; strength?:number; selfDamage?:number; equipment?:boolean; item?:boolean; removesAllyType?:string; escape?:'mist'|'bats'; ally?:{type:string;strength:number} };

const make = (id:string,name:string,side:Card['side'],description:string):Card => ({id,name,side,timing:['day','night'],description});

export const cards:Record<string,Card> = {};

function add(id:string,name:string,side:Card['side'],description='Effect reserved for a later stage.') { cards[id]=make(id,name,side,description); return id; }

add('travel','Travel','hunter','Move one adjacent city.'); add('supply','Supply','hunter','Acquire one Hunter market card OR permanently deny one Dracula market card.'); add('investigate','Investigate','hunter','Reveal and resolve the top encounter at your city.'); add('combat','Combat','hunter','Combat bonus +2 (Stage 4).');

export const signatures = [['Family Fortune',"Lucy’s Revenge"],['Methodical Search','Urgent Dispatch'],['Correspondence','Vampire Lore'],['Medical Expertise','Clinical Assessment'],['Psychic Connection','Shared Vision']].map((pair,i)=>pair.map((name,j)=>add(`signature-${i}-${j}`,name,'hunter')));

export const hunterMarket = ['Wooden Stake','Holy Water','Crucifix','Hunting Rifle','Silver Dagger','Blessed Blade','Protective Amulet','Medical Kit','Garlic Wreath','Reinforced Coat','Medical Supplies','Medical Assistance','Rest and Recovery','Train Ticket','Express Train','Group Passage','Emergency Transit','Thorough Search','Careful Investigation','Local Informant','Coordinated Search','Track the Count','Uncover Conspiracy','Sacred Investigation','Determined Assault','Coordinated Strike','Vampire Slayer','Defensive Formation','Final Stand','Prepared Ambush'].map((name,i)=>add(`hm-${i}`,name,'hunter'));

export const draculaMarket = ['Escape as Mist','Escape as Bats','Wings of Darkness','False Trail','Vampire Bride','Wolf Pack','Dark Familiar','Deadly Ambush','Lost in Darkness','Gathering Darkness'].map((name,i)=>add(`dm-${i}`,name,'dracula'));

['Damaging Encounter','Delaying Encounter','Shadow Passage','Dark Influence','Call of the Night','Basic Encounter'].forEach((name,i)=>add(`d-${i}`,name,'dracula'));

export const defaults = { handSize:3, hunterHP:4, draculaHP:10, darknessTarget:10, hunterBase:1, draculaBase:3, basicCombat:1, encounterDayDamage:1, encounterNightDamage:2 };

export function adjacent(a:number,b:number) { return a>=0 && a<9 && b>=0 && b<9 && Math.abs(a%3-b%3)+Math.abs(Math.floor(a/3)-Math.floor(b/3))===1; }



for(const [id,range] of [['travel',1],['hm-13',2],['hm-14',3]] as const){cards[id].travel=range;cards[id].description=`Move up to ${range} connection(s); choose a destination on the map.`;}


cards.supply.timing=['day','night'];

cards['d-2'].description='Secretly swap one selected encounter card from each of two adjacent cities, then shuffle both decks. Publicly announce only the two cities.';

cards['d-2'].timing=['night'];

cards['d-3'].timing=['day','night'];
cards['d-3'].description='Day: permanently deny one Hunter market card. Night: acquire one Dracula market card into your discard OR permanently deny one Hunter market card.';

cards['d-0'].timing=['day','night'];
cards['d-0'].description='Day: add a Damaging Encounter to your city or an orthogonally adjacent city. Night: add it to any city. Announce that city and shuffle its encounter deck. When investigated: 1 damage by Day or 2 by Night.';

cards.travel.timing=['day','night'];
cards.travel.description='Move one orthogonally adjacent city. At Night, add one basic encounter to the destination and shuffle its entire encounter deck.';

cards.combat.name='A Lucky Find';
cards.combat.timing=['day','night'];
cards.combat.healing=1;
cards.combat.description='Choose: heal yourself for 1 hitpoint OR contribute +1 strength during combat. Full combat is not implemented in this discovery-wins playtest.';

// Prototype combat values; conditional bonuses remain future work.
[2,1,1,2,2,2,1,1,1,1].forEach((strength,i)=>{cards['hm-'+i].strength=strength;cards['hm-'+i].equipment=true;cards['hm-'+i].description='Equip for +'+strength+' combat strength. On acquisition: equip immediately or place in discard. Maximum two items; choose an item to replace and discard or permanently trash it. Special sacrifice/prevention effects remain deferred.';});
for(const [id,strength] of [['combat',1],['signature-0-1',3],['signature-2-1',2],['hm-24',3],['hm-25',2],['hm-26',4],['hm-27',2],['hm-28',3],['hm-29',2]] as const){cards[id].strength=strength;if(id!=='combat')cards[id].description='Keep in hand: +'+strength+' strength in combat. Conditional effects remain deferred; signature values are provisional.';}
cards.combat.description='On your turn: heal 1 HP. During combat: contribute +1 strength as your one combat card.';
cards['dm-0'].escape='mist';cards['dm-0'].description='Choose as your combat card. If Dracula survives, optionally escape one connection after combat. Destination stays secret.';
cards['dm-1'].escape='bats';cards['dm-1'].description='Choose as your combat card. If Dracula survives, optionally escape up to two connections after combat. Final destination is public.';

// Location allies share one prototype bonus, with types retained for future effects.
for(const [id,type] of [['dm-4','Vampire'],['dm-5','Beast'],['dm-6','Supernatural']] as const){cards[id].ally={type,strength:2};cards[id].timing=['day','night'];cards[id].description='Play by Day or Night: attach face-down to any city with no ally. Grants Dracula +2 strength in combat at that city. One ally per city.';}

cards['signature-0-0'].description='Acquire two Hunter cards from the shared market into your discard pile. You cannot deny or replace cards. If fewer than two Hunter cards are available, acquire as many as possible.';

cards['signature-4-0'].description='Choose another conscious Hunter at your city to discard one random card from their hand. Then learn whether Dracula is in your city or any surrounding city, including diagonals. His exact location stays hidden. Requires another Hunter with a card in hand.';

cards['signature-3-0'].healing=2;cards['signature-3-0'].description='Heal yourself or another conscious Hunter at your city for 2 HP, up to full health. Cannot revive a knocked-out Hunter or skip recovery.';

cards['signature-4-1'].description='Privately examine the top encounter of any other city, then return it to the top or bottom of that city’s encounter pile without resolving it.';

cards['d-2'].description='Night: first choose whether to move Dracula. If yes, swap Dracula from his actual city with a card in an orthogonally adjacent city. If no, swap non-Dracula cards between any two distinct cities. Shuffle both piles; publicly announce only the cities.';

cards.supply.description='Day: acquire one Hunter market card OR permanently deny one Dracula card. Night: permanently trash any one face-up market card and refill that slot with the top market draw card. No acquisition at Night.';

// Intended sacrifice targets; ally removal is pending implementation.
for(const [id,type] of [['hm-0','Vampire'],['hm-1','Undead'],['hm-2','Supernatural'],['hm-3','Beast'],['hm-8','Vampire']] as const)cards[id].removesAllyType=type;

cards['hm-10'].description='Restore yourself to maximum HP, then trash this card permanently. Cannot revive a knocked-out Hunter or skip recovery.';

// Consumable Items use no equipment slots.
cards['hm-7'].item=true;cards['hm-7'].equipment=false;delete cards['hm-7'].strength;cards['hm-7'].healing=2;cards['hm-7'].description='Item: heal yourself for 2 HP, then trash this card. On acquisition, use immediately without an extra action or place in discard for later. Cannot revive a knocked-out Hunter.';

cards['hm-28'].strength=2;cards['hm-28'].selfDamage=1;cards['hm-28'].description='Final Stand: +2 combat strength; take 1 damage. If this reaches 0 HP, still participate fully and be knocked out only after combat concludes.';
