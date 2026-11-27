# The Night Hunt — Current Rules

Last reviewed November 27, 2026.

This is the shared rules reference for development and playtesting across project chats. It describes the current prototype, rather than preserving superseded versions of the design. Numeric balance values remain provisional.

**Status terms:** **Implemented** means the prototype resolves the effect. **Partial** means only the listed part works. **Planned** means the design exists but the effect is not implemented. **Open** means a decision is still needed. Implementation limitations below are not automatically permanent game rules.

## 1. Players, objectives and balance

One player controls Dracula. Four Hunters are selected from Lord Godalming, Jonathan Harker, Van Helsing, Dr. Seward and Mina Harker. Solo play supports one person controlling everyone. In two-player online play, one player controls Dracula and one controls all four Hunters.

Hunters win by reducing Dracula to 0 HP in combat. Merely discovering Dracula no longer wins the game; it starts a showdown.

Dracula wins immediately at **10 total Darkness**. Deploying any Ally immediately grants 2 Darkness. One point is permanent and one remains tied to the Ally. Any removal, including equipment counters and consecration, subtracts only the tied point. Moving an existing Ally grants no Darkness. For example, two deployments take Dracula from 0 to 4 Darkness. Removing both Allies leaves 2. Each Hunter exhaustion adds 1 permanent Darkness.

| Value | Current setting |
|---|---:|
| Hunter maximum HP | 4 each; 5 with Smelling Salts |
| Hunter base combat strength | 1 each |
| Dracula starting HP | 6 |
| Dracula maximum HP | 8 |
| Dracula base combat strength | 2 by Day, 3 by Night |
| Opening hand / end-of-round draw | 3 cards |
| Equipment capacity | 1 per Hunter |
| Brush with Darkness damage | 1 |
| Tragic Accident damage | 2 |
| Darkness victory target | 10 |
| Permanent Darkness per vampire matured | 3 |
| Darkness per Ally deployment | 2 (1 permanent, 1 tied to the Ally) |

These values are provisional and primarily defined in `src/data.ts`.

## 2. Map and setup

| | | |
|---|---|---|
| London | Amsterdam | Prague |
| Marseille | Munich | Vienna |
| Madrid | Rome | Athens |

A city is either **open** or **consecrated**. An **open city** is any city that has not been consecrated.

A connected city is one step directly above, below, left, or right on the map. When the current city is eligible too, the wording is **your city or a connected city**. Hypnosis includes the current city, connected locations, and neighboring diagonal locations.

Each selected Hunter chooses their starting city first, in selected-player order. Each Hunter after the first in a city adds one Brush with Darkness to its starting pile. This applies only during initial placement. Zero or one Hunter gives 4 encounters, two give 5, three give 6, and four give 7. After all four positions are chosen and visible, Dracula chooses his hidden starting city last. Dracula may choose any city, including one occupied by Hunters. This does not itself trigger combat. All city encounter piles are finalized and shuffled after Dracula chooses, then the first Hunter's Day turn begins. Setup choices do not consume actions. Starting-location setup is saved so it can be resumed; ongoing saves keep their existing positions.

Build each city's starting encounter pile as follows.

| Cities | Brush with Darkness | Fog | Tragic Accident | Total |
|---|---:|---:|---:|---:|
| London, Prague, Madrid, Athens | 3 | 1 | 0 | 4 |
| Marseille, Vienna, Amsterdam, Rome | 3 | 0 | 1 | 4 |
| Munich | 2 | 1 | 1 | 4 |

Dracula secretly replaces one Brush with Darkness in his chosen starting city with his identity card. Shuffle each city's pile independently. Show the starting mixes during city selection. Once play begins, show only the remaining card counts. The map starts with 36 base encounters plus up to 3 from grouped starts and contains exactly one Dracula identity.

A city **becomes permanently consecrated when its encounter pile reaches 0**. Remove all Allies there immediately and lose 1 Darkness per removed Ally. Cultists can be placed as an encounter in a consecrated city. The city stays consecrated and still blocks other encounter placements and Allies. Hunters can still travel through or stop there, without adding a Night encounter from Ready the Carriage. Consecrated locations cannot host Dracula or be swap/escape destinations.

If the final encounter is Dracula's identity, defer consecration during the showdown: his revealed identity still occupies the location. If he survives without escaping, reshuffle it into that pile; if he escapes, the normal swapped encounter replaces him. If defeated, the game ends and any now-empty city becomes consecrated. This preserves the existing swap/continuation rule without stranding Dracula's identity.

The top card is the next card investigated. The interface displays remaining encounter counts, not resolved counts. Added encounters can increase a city's pile beyond four. Exactly one Dracula identity must remain in the game.

## 3. Personal starting decks

Each Hunter starts with nine cards:

| Card | Copies |
|---|---:|
| Ready the Carriage | 2 |
| Visit the Market | 2 |
| Investigate | 2 |
| A Lucky Find | 1 |
| First character-specific card | 1 |
| Second character-specific card | 1 |

Dracula starts with nine cards:

| Card | Copies |
|---|---:|
| Tragic Accident | 2 |
| Fog | 2 |
| Shadow Passage | 2 |
| Dark Influence | 2 |
| Call of the Night | 1 |

Shuffle personal decks and draw three. The retired card named Delaying Encounter still converts to Tragic Accident when loading older saves. Call of the Night grants a bonus Night-effect card play by Day, or heals 1 HP by Night.

## 4. Turns, timing and drawing

The game starts **Week 1, day 1 (Sunday), Day phase**, at zero Darkness and zero Vampire Maturation. One full Day/Night cycle advances the calendar one day and advances the seven-space Maturation track by 1. Combat and pending choices must resolve before the next turn and day. Each time Maturation reaches 7, Dracula immediately gains **3 permanent Darkness**, and the track resets with excess progress carried over. Advancing by 2 from 6 awards 3 Darkness and leaves 1 progress. The calendar still rolls over after Saturday. Only Maturation awards Darkness for elapsed time.

The public trackers show permanent Darkness, the points tied to deployed Allies, and separate Maturation progress. Both daily progress and card progress are logged.

1. **Day:** each Hunter in selected-player order, then Dracula.
2. **Night:** first resolve Dracula’s beginning-of-Night effects (Renfield, then Wraith), then Dracula’s standard turn, then each Hunter in the same order. These effects do not use his standard action.
3. **End of round:** discard unused hands, then everyone draws three cards.

Each scheduled turn permits one standard card play. Played cards normally go to the player’s discard pile after use. Follow any card-specific instruction to trash, equip, deploy, or place the card instead. Resolve its choices before ending the turn. The turn structure does not automatically draw cards between Day and Night. When a personal draw pile runs out, shuffle its discard into a new draw pile; draw as many cards as available.

Hunters may pass voluntarily even with playable cards. A Hunter can instead activate a Day facility, trade, or trash equipped counter-equipment to remove an Ally, as described below. Dracula must play an eligible standard-action card when one is available, or pass when no eligible card is available. Combat-only cards are held for combat, not played as standard actions.

Most implemented action cards are eligible by Day and Night. Visit the Market works in both phases but has different effects. Other card timing remains configurable and provisional. Call of the Night provides an additional play using the selected card’s Night effect.

## 5. Shared market and card ownership

Shuffle **32 Hunter cards and 16 Dracula cards** into one shared 48-card market. Display ten and keep 38 in reserve. There is no guaranteed faction mix or currency cost.

Acquisition removes a face-up card and normally places it in the acquiring player's personal discard. Players acquire their own faction's cards. Equipment and Items have acquisition choices described in section 8.

The display depletes across turns and rounds. **When a removal leaves three or fewer cards, immediately refill toward ten**, even mid-turn. Keep the remaining face-up cards. Refill only as far as available cards permit. Dawn and round changes do not refill the market.

Denied or trashed cards leave the game permanently and never recycle. A market replacement discard, if present, can be reshuffled when the reserve is exhausted. Visit the Market at Night replaces its selected slot first, then applies the usual refill check. If three or fewer face-up cards remain, refill toward ten immediately. Debug replacement is a testing tool.

### Visit the Market — Hunter

| Timing | Choose one effect |
|---|---|
| Day | Acquire 1 Hunter card or trash 1 Dracula card. |
| Night | Trash 1 card and refill its slot. |

If the display is completely empty, Visit the Market resolves with no market change. If a card remains, its applicable choice must be resolved.

### Dark Influence — Dracula

| Timing | Choose one effect |
|---|---|
| Day | Trash 1 Hunter card from the market. |
| Night | Acquire 1 Dracula card or trash 1 Hunter card from the market. |

This is one market action; the earlier replace-then-acquire design is superseded. With no legal target, the card resolves without a market change.

### Family Fortune — Lord Godalming

By Day, acquire two Hunter market cards, one at a time. At Night, acquire one. Denial is not permitted. Normal equipment/Item acquisition choices apply. Any threshold refill happens between acquisitions, so newly revealed cards can be selected. If no Hunter cards remain available, stop acquiring.

### Hunter preparation cards

Each appears once in the shared market and is discarded after its standard action. Trashing requires a separate card from the same hand, basic or non-basic. Acquisition follows the usual Hunter market rules.

| Card | Day | Night |
|---|---|---|
| Careful Preparation | Trash another card from your hand. | Acquire one Hunter market card. |
| Traveling Merchant | Acquire one Hunter market card. | Trash another card from your hand. |

### Dracula Maturation cards

Each appears once in the shared market. Acquired copies follow normal deckbuilding rules. Play one as your standard action. Afterwards it goes to your discard pile. No extra cost or discard is required. Only the completed daily cycle and specific card effects advance Maturation.

| Card | Day | Night |
|---|---|---|
| Blood Rites | Advance Maturation by 1. | Advance Maturation by 2. |
| Blood Offering | Advance Maturation by 1. | Advance Maturation by 1 and heal Dracula 1 HP, up to his maximum. |
| Midnight Ritual | Advance Maturation by 1. | Advance Maturation by 1 and shuffle a Brush with Darkness into any open city Dracula chooses. Consecrated cities are ineligible. |

### City facilities

A conscious Hunter may use the facility in their current city during their Day turn by discarding one card and spending their standard action. Each city facility can be used once per Day, shared across all Hunters. All reset at dawn. A consecrated city retains its facility. Recovery and exhaustion prevent activation. Cancelled selections and invalid choices spend nothing.

| City | Facility | Effect |
|---|---|---|
| London | Hospital | Heal yourself 1 HP, up to your normal maximum. |
| Amsterdam | Archives | Publicly reveal the top encounter, then shuffle it back with the pile. An empty pile cannot be examined. |
| Prague | Coaching Inn | Move to a connected location. Add no encounter. |
| Marseille | Bazaar | Permanently trash one face-up Hunter market card, replace its slot if possible, then apply normal refill rules. |
| Munich | — | No facility. Munich has four orthogonal connections. |
| Vienna | Rundown Stables | Move to a connected location. If it is open, Dracula chooses one Brush with Darkness, Fog, or Tragic Accident and shuffles it into the destination. The live digital game still uses Tragic Accident for this facility. |
| Madrid | Trading House | Acquire one face-up Hunter market card using normal acquisition, equipment and Item rules. |
| Rome | Public Square | Draw one card using the normal discard reshuffle rules. The draw grants no extra action. |
| Athens | Monastery | Permanently trash a different card from your hand. Basic and non-basic cards qualify. |

For playtesting, the Archives publicly reveals Dracula’s identity if it is drawn. Shuffle it back without starting combat. The Archives never resolves an encounter, applies damage or Fog, or removes a card. Its shuffle order stays hidden.

## 6. Movement, investigations and encounters

### Hunter Travel

Ready the Carriage works by Day or Night: move the Hunter one connection. This becomes their actual location for investigations, combat and other effects.

At Night, after using Ready the Carriage to enter an open city, add one ordinary encounter to the destination and shuffle the entire destination pile, including Dracula if present. No immediate damage is dealt. Hunters may enter consecrated cities at Night and skip any encounter placement required by their travel card. Ready the Carriage adds nothing by Day.

Travel by Train moves up to three connections by Day or Night. Fast Horse moves up to two connections by Day or one by Night. Neither card adds an encounter. Discard Fast Horse after play and permanently trash Travel by Train after play. Group Passage moves the acting Hunter and any chosen conscious Hunters in their city up to two connections by Day or Night. Everyone moves to the same destination. No encounter is added, and the card is permanently trashed after play.

### Basic Investigate

Reveal and remove the top encounter at the acting Hunter's current city. Brush with Darkness deals 1 damage and Tragic Accident deals 2 damage when investigated, by Day or Night. Finding Dracula starts combat. An empty pile resolves without damage. Resolved ordinary encounters do not recycle automatically.

### Tragic Accident — Dracula

Playable by Day or Night. Place one new hidden Tragic Accident into a chosen city:

- **Day:** An open city within one connection of Dracula, including his current city.
- **Night:** any open city.

Publicly announce the chosen city and shuffle its entire pile, including Dracula if present. The played personal action card goes to Dracula's discard; a separate encounter token is added to the city. This cannot replenish an empty or consecrated pile and does not move Dracula. When investigated, it deals 2 damage.

### Fog — Dracula

Fog uses the same placement rules as Tragic Accident. When investigated, the investigating Hunter discards one random card from their remaining hand if they have one. Fog deals no damage. By Day, discard Fog from the city pile. At Night, shuffle it back into that city pile.

### Moving Dracula and bluffing

**Move Dracula.** Privately choose an open destination within the card’s range. Swap Dracula’s identity card with one encounter of your choice from the destination pile. Shuffle both piles separately. If Dracula is moving after a showdown, swap his revealed identity card and put the chosen encounter back into the city he left.

**Bluff.** Privately choose two open cities within the card’s range of each other. Swap one non-Dracula encounter of your choice from each pile, then shuffle both piles separately. Dracula stays where he is.

**Public information.** Reveal only what the card says to reveal. When a card allows either moving or bluffing, keep that choice and the swapped cards private.

### Shadow Passage and Wolf Form

- **Shadow Passage by Day:** Privately look at the top encounter in any nonempty city. Leave it on top or shuffle that pile.
- **Shadow Passage by Night:** Move Dracula or bluff 1 connection. Announce both cities.
- **Wolf Form by Night:** Move Dracula or bluff up to 2 connections. Announce both cities.

## 7. Combat, damage and exhaustion

Discovering Dracula pauses normal play. All conscious Hunters at that city participate. Each participating Hunter contributes base strength 1, bonuses from one equipped item, and optionally one eligible combat card from hand. Dracula contributes base strength 2 by Day or 3 by Night, Great Wolf’s +2 bonus if it is at the combat city, and optionally one eligible combat card from hand. Every participant chooses a card or explicitly chooses no card.

Sum each side's strength. Dracula wins ties. The losing side takes damage equal to the strength difference. If Dracula wins at Vampire Bride’s city, the Hunters take 2 additional damage, even on a tie. Played combat cards go to their owners' discards unless another rule removes them.

- When Hunters win, Dracula takes all damage. At 0 HP, Hunters win the game and normal play ends.
- When Dracula wins, divide damage as evenly as possible among participating Hunters. Dracula chooses which Hunters take one extra point when there is a remainder.

Combat cards contribute during the showdown rather than using a separate standard action. The investigating Hunter has already spent their standard action; other participants' scheduled turns are not consumed by joining combat.

### Reckless Assault

Planned Ambush resolves after all combat cards are chosen and ends the showdown immediately. Dracula takes 2 damage, his combat card is cancelled, and all chosen cards go to discard. Skip normal strength comparison, equipment effects, other combat card effects at resolution, and escape. HP already lost to Reckless Assault still applies. If multiple Hunters chose Planned Ambush, deal the 2 damage once. If Dracula survives, shuffle his identity back into the city.

Reckless Assault contributes **+2 strength** and deals **1 damage to its Hunter** as soon as the Hunter locks in the card. If this cost brings them to 0 HP, they still contribute their base, equipment and card bonuses and remain part of damage allocation. Their exhaustion waits until combat concludes, including any escape resolution. Apply it even if Dracula is defeated.

Outside combat, Dracula can spend his Day action to discard Escape as Mist and draw one card, or his Night action to discard Escape as Bats and draw one card. Reshuffle the existing discard pile if needed. The played card is added to the discard after the draw, and the new card does not grant another play.

Unholy Strength, Mesmerize, and Pride of Dracula return to discard after either use. Unholy Strength discards the selected Hunter’s equipped card before any Hunter Equipment combat activation, including Pistol, Wooden Stake, or Holy Water. It still grants +1 Strength without a target. Mesmerize zeroes the chosen Hunter’s entire Strength, including combat cards and Equipment bonuses. Pride of Dracula’s combat damage can defeat Dracula before the showdown resolves.

### Hunter exhaustion and recovery

At 0 HP, a Hunter is Exhausted. Dracula gains 1 permanent accumulated Darkness each time a Hunter becomes Exhausted. Count each exhaustion once; a recovered Hunter can award another point if Exhausted again. Existing saves start this counter at zero, without retroactive awards. For Reckless Assault, award the point when deferred exhaustion takes effect after combat; an already resolved Hunter victory remains a Hunter victory. Permanently remove all their equipment and all non-basic cards in their hand, draw and discard. Basic cards are Ready the Carriage, Visit the Market, Investigate and A Lucky Find. Keep their city position. They cannot act or participate in new combat while Exhausted.

Their next scheduled Day or Night turn is spent recovering. At the start of their following scheduled turn, they return at full HP; if their hand is empty, draw up to the normal hand size. Healing cannot revive a Exhausted Hunter or bypass recovery. Reckless Assault has the explicit delayed-exhaustion exception above.

### Dracula's escape and continued hiding

Escape as Mist and Escape as Bats are chosen as Dracula's combat card. If Dracula survives, he can use the escape regardless of which side won, or decline it.

| Card | Movement | Public information |
|---|---|---|
| Escape as Mist | Secretly place Dracula in one open connected city. Add one Brush with Darkness to the city he left and to each other open connected city. | Destination stays hidden. |
| Escape as Bats | Up to two orthogonal connections | Final destination is announced. |

For Mist, shuffle each added card into its pile. Each affected pile gains one card. If there is no open connected city, Dracula stays. Bats uses the shared Move Dracula rule. If Dracula stays, shuffle his identity back into his current city pile. The same-city identity reshuffle remains a provisional continuation rule; permanent consecration is implemented.

## 8. Equipment, Items, healing and trash

**Discard** keeps a card in its owner's personal deck cycle. **Trash** permanently removes it from all game piles; it cannot be drawn, recycled or reacquired through normal play.

### Equipment

On acquiring equipment, choose to equip it immediately without another action or put it in personal discard. Equipment in hand can be equipped using a standard card play.

**Equipment.** Each Hunter may have one Equipment card equipped. When you acquire Equipment, either equip it immediately or put it in your discard pile. You can also spend your Day or Night action to equip a card from your hand. If you replace Equipment, put the old card in your discard pile. Equipment stays equipped between turns. Backup Equipment cycles through your deck normally. Trading and exhaustion can remove equipped cards. Older saves with excess Equipment retain the first card and move the rest to discard.

### Counter-equipment

Equipment counters apply only while equipped. To remove the matching Ally, a conscious Hunter must be at its city with that counter **equipped**, and spend their unused standard **Day or Night action**. Permanently **trash** the equipped card; remove the Ally and subtract 1 Darkness. A card merely in hand does not qualify. This replaces the earlier discard-cost idea and earlier type-wide sacrifice metadata. No other equipment currently removes Allies.

| Equipment | Persistent benefit | Ally removed |
|---|---|---|
| Hunting Rifle | +1 combat strength | Great Wolf |
| Crucifix | Reduce the equipped Hunter’s ordinary/Tragic Accident damage by 1, minimum 0 (normally 0 Day / 1 Night); no combat damage reduction | Wraith |
| Smelling Salts | +1 maximum HP; equipping also grants 1 current HP | Renfield |

When Smelling Salts leaves play (replacement or sacrifice), return to the base maximum and cap current HP at that maximum; do not subtract an extra point from a wounded Hunter. Exhaustion removes all equipment and leaves the Hunter at 0 HP until recovery. The HP bonus is applied both when equipping from hand and when equipping immediately on acquisition.

### Items

Items use no equipment slots. On acquiring an Item, choose to use it immediately without another action or put it in personal discard. Using it later from hand takes a standard play. **Every Item is permanently trashed after use**, whether used on acquisition or from hand.

Wooden Stake and Holy Water are Equipment. In a showdown, trash either equipped card for +2 Strength in addition to your normal combat card selection. As a Day or Night standard action, trash an equipped Wooden Stake to remove Vampire Bride, or equipped Holy Water to remove any Ally at your location. Both combat and Ally-removal uses permanently trash the Equipment.

Medical Kit is the currently classified consumable Item: heal its user for 2 HP, up to maximum health, then trash it. It has no combat bonus and cannot revive a Exhausted Hunter. It is not Equipment.


### A Lucky Find

This replaces the starting Combat card. Play it as a normal action by Day or Night to heal yourself for 1 HP, capped at full health, then discard it. Alternatively, keep it in hand and contribute +1 strength as your combat card when a showdown occurs. The combat use does not also heal. Alternatively, discard A Lucky Find as a standard Day or Night action to permanently trash any other card in your hand, including a basic card.

## 9. Character cards and trading

Each Hunter receives the following two signature cards. Implemented effects below supersede earlier draft descriptions.

| Hunter | Card | Current effect / status |
|---|---|---|
| Lord Godalming | Family Fortune | Acquire two Hunter market cards by Day or one at Night, as described in section 5. |
| Lord Godalming | Lucy's Revenge | Use in combat for +3 Strength, then discard. |
| Jonathan Harker | Methodical Search | Implemented: privately examine the top two encounters at your city, resolve one and shuffle the other back with the remaining pile. With one card, resolve that card; an empty pile does nothing. |
| Jonathan Harker | Urgent Dispatch | Move another conscious Hunter one connection without consuming their action. At Night, add a Brush with Darkness and shuffle the destination pile unless the city is consecrated. |
| Van Helsing | Correspondence | Day or Night. Exchange one hand card each with another conscious Hunter anywhere on the map. You may immediately play the exact card you received if legal this phase, or keep it in hand and end your turn. Discard Correspondence after play. |
| Van Helsing | Vampire Lore | Use in combat for +2 Strength. Or play by Day or Night to discard one random card from Dracula’s hand. Dracula must have a card in hand. Discard Vampire Lore after use. |
| Dr. Seward | Medical Expertise | Implemented: heal yourself or another conscious Hunter at your city for 2 HP, capped at maximum. Cannot revive or skip recovery. |
| Dr. Seward | Wax Cylinders | Day or Night. Choose a city occupied by any Hunter with a nonempty encounter pile. Reveal the top card and return it to the top or bottom without resolving it. |
| Mina Harker | Hypnosis | Implemented: another conscious Hunter at Mina's city discards one random hand card; then learn whether Dracula is in Mina's city or any surrounding city, including diagonals. Requires an eligible other Hunter with a hand card; does not reveal the exact city. |
| Mina Harker | Rally the Hunters | Day or Night. Move another conscious Hunter one orthogonal connection closer to Mina’s city. This uses no action for the moved Hunter and adds no Night encounter. |

A conscious Hunter who passes without using their standard action may permanently trash one non-basic card from their hand before ending the turn. Passing without trashing is also allowed.

Any conscious Hunter may trade instead of their standard card play. They must share a city with another conscious Hunter and discard one hand card as the cost. Then exchange one different remaining hand card OR one equipped item for one hand card OR equipped item belonging to the partner. Unique character cards cannot be exchanged, including through Correspondence. Both Hunters may offer equipped equipment. The initiator needs a hand card for the discard cost and something else to trade; the partner may have only equipped equipment and no hand cards. Received equipment offers immediate equipping or placement in discard; if the slot is occupied, discard the replaced Equipment. Non-equipment received goes to hand. Equipment leaving its owner loses its bonuses; immediate equipping applies bonuses to the new owner. This uses the initiator's standard action but does not consume the partner's later scheduled turn.

## 10. Market card reference

One copy of each listed card starts in the combined market pool. Placeholder cards are present and acquirable, but their intended effects are not resolved by the prototype. Playing an action placeholder currently consumes the standard play and records a deferred-effect message; do not treat that as successful resolution of its intended effect.

### Hunter market: 32 cards

| # | Card | Current implementation |
|---|---|---|
| 1 | Wooden Stake | Equipment. Trash in combat for +2 Strength or spend a Day/Night action to trash it and remove Vampire Bride at your location. |
| 2 | Holy Water | Equipment. Trash in combat for +2 Strength or spend a Day/Night action to trash it and remove any Ally at your location. |
| 3 | Crucifix | Equipment: reduce encounter damage by 1; trash using an action to remove Wraith. |
| 4 | Hunting Rifle | Equipment: +1 combat; trash using an action to remove Great Wolf. |
| 5 | Silver Dagger | Equipment, +2 Str in combat. |
| 6 | Hunting Apparel | Equipment. +1 Str. Prevent 1 encounter damage. |
| 7 | Medical Kit | Item: heal 2 and trash; immediate-use acquisition option. No combat bonus. |
| 8 | Pistol | Equipment. +1 Strength in combat, or discard it after combat cards are chosen for +2 Strength in that showdown. |
| 9 | Medical Kit (second copy) | Item: heal 2 and trash; immediate-use acquisition option. Replaces Medical Assistance. |
| 10 | First Aid | Heal yourself and one other conscious Hunter at your city for 1 HP each. Heal only yourself if alone. |
| 11 | First Aid | Heal yourself and one other conscious Hunter at your city for 1 HP each. Heal only yourself if alone. |
| 12 | Fast Horse | Move up to 2 connections by Day or 1 by Night. Adds no encounter. |
| 13 | Travel by Train | Move up to 3 connections by Day or Night. Adds no encounter. Trash after play. |
| 14 | Travel by Train | Move up to 3 connections by Day or Night. Adds no encounter. Trash after play. |
| 15 | Group Passage | Move up to 2 connections with any number of conscious Hunters from your city. Trash after play. |
| 16 | Thorough Search | Privately review the top 2 cards at your city. Investigate one and leave the other on top. |
| 17 | Thorough Search | Privately review the top 2 cards at your city. Investigate one and leave the other on top. |
| 18 | Careful Investigation | Privately review the top 2 cards at your city. Investigate one and put the other on the bottom. |
| 19 | Careful Investigation | Privately review the top 2 cards at your city. Investigate one and put the other on the bottom. |
| 20 | Local Rumors | Privately review up to 4 cards from the top of your city deck, then shuffle it. |
| 21 | Local Rumors | Privately review up to 4 cards from the top of your city deck, then shuffle it. |
| 22 | Coordinated Search | Investigate. If another Hunter is at your city, you may investigate again. |
| 23 | Planned Ambush | Combat card. Cancel Dracula’s combat card, deal 2 damage to Dracula, and end the showdown before normal combat effects. |
| 24 | Uncover Conspiracy | Reveal the top card at your city. Discard an encounter without taking damage. If you reveal Dracula, begin a showdown. |
| 25 | Uncover Conspiracy | Reveal the top card at your city. Discard an encounter without taking damage. If you reveal Dracula, begin a showdown. |
| 26 | Coordinated Strike | +1 Str, or +2 Str with another Hunter at your city. |
| 27 | Vampire Slayer | +2 Str. |
| 28 | Reckless Assault | +2 Str and lose 1 HP immediately when chosen. Exhaustion waits until combat concludes. |
| 29 | Smelling Salts | Equipment: +1 maximum/current HP; trash using an action to remove Renfield. |
| 30 | Quincy Morris | One-use Event: all conscious Hunters heal 2 HP and draw 1 card. |
| 31 | Careful Preparation | Day: Trash another hand card. Night: Acquire one Hunter market card. |
| 32 | Traveling Merchant | Day: Acquire one Hunter market card. Night: Trash another hand card. |

### Dracula market: 16 cards

| # | Card | Current implementation |
|---|---|---|
| 1 | Escape as Mist | Combat: secret placement with Brush with Darkness decoys. Day: discard to draw one card. Night: move Dracula one connection secretly. |
| 2 | Escape as Bats | Combat: move Dracula up to two connections and announce the destination. Day: move Dracula one connection secretly. Night: discard to draw one card. |
| 3 | Vampire Bride | +2 total damage when Dracula wins at her city, including ties. |
| 4 | Great Wolf | +2 Dracula strength in combat at its city. |
| 5 | Wraith | Beginning-of-Night movement and private bottom-encounter control; shares a city with another Ally. |
| 6 | Renfield | Heal Dracula 2 HP on deployment; add one random remaining reserve encounter each Night (three total). |
| 7 | Immanuel Hildesheim | One-use Event: shuffle one Brush with Darkness into each open city. |
| 8 | Unholy Strength | Combat: +1 Strength and discard a participating Hunter’s Equipment before Hunter Equipment combat activations. Day or Night: Heal Dracula 1 HP up to maximum. |
| 9 | Mesmerize | Combat: Set one participating Hunter’s Strength to 0. Day: Acquire one Dracula market card. |
| 10 | Pride of Dracula | Combat: +4 Strength and Dracula immediately loses 2 HP. Night: Choose Fog or Brush with Darkness and shuffle it into your location or a connected location. It must be open. The public log keeps the destination and encounter type private. |
| 11 | Wolf Form | Night action. Move Dracula or bluff up to 2 connections. Announce both cities. |
| 12 | Szgany Bodyguards | Day or Night. Move Dracula 1 connection and announce the destination. Shuffle the played card into the destination pile. If resolved as an encounter, it deals 1 damage that cannot be modified, then leaves play. |
| 13 | Cultists | Day or Night. Shuffle the played card into any city, including a consecrated city. When investigated, deal 1 damage by Day or 2 by Night with normal prevention, then remove the encounter. |
| 14 | Blood Rites | +1 Maturation by Day or +2 by Night. |
| 15 | Blood Offering | +1 Maturation. At Night, also heal Dracula 1 HP. |
| 16 | Midnight Ritual | +1 Maturation. At Night, also shuffle one Brush with Darkness into an open city. |

### Location allies

**Dark Ally.** Dracula acquires an Ally into discard, then plays it by Day or Night as a standard action. Deploy it in an open city. One ordinary Ally (Bride, Great Wolf or Renfield) may occupy a city, plus Wraith in a separate sharing slot. The card leaves Dracula's personal deck and stays deployed until removed. There is only one Wraith and one Renfield in the game.

The Ally’s identity is public when played, and its city is public when placed. An Ally can be removed with its matching equipped counter, or automatically when its city becomes consecrated. It never returns to Dracula’s discard. Each deployment grants **2 Darkness**, wherever Dracula is. Removal costs 1 Darkness. Acquired or pending-deployment cards contribute nothing.

- **Vampire Bride:** no strength bonus. When Dracula wins at her city, including on a tie, add **2 total damage** to the Hunter damage pool. Distribute the combined total evenly using the existing remainder choice.
- **Great Wolf:** **+2 Dracula strength** only in combat at its city.
- **Wraith:** no combat bonus. At the beginning of Dracula's Night turn, move one orthogonal connection to an open city, even if another Ally occupies it. Publicly announce movement. Dracula privately examines the destination's bottom encounter, moving it to the top or leaving it on the bottom. Do not reveal the card or placement choice in the log. Resolve this before Dracula plays or ends his normal turn. As an explicit fallback when every connected location is consecrated, Wraith stays put and skips its ability; it does not inspect its current pile. Consecrated destinations are never legal.
- **Renfield:** Heal Dracula 2 HP on deployment, capped at his maximum HP. Reserve one Fog, one Tragic Accident and one Brush with Darkness. At the beginning of each Dracula Night turn, randomly select and remove one remaining reserve encounter and shuffle it into Renfield’s own open city. Once exhausted, the reserve generates no more encounters. Removing Renfield discards unused reserve encounters. Saved Renfield reserves are preserved. Older saves without reserve data use an empty reserve.

At the beginning of Night, resolve existing closures, then Renfield's automatic encounter placement, then Wraith's movement/examination. These are free scheduled effects; they do not draw or consume cards, use a standard action, or repeat after reload. A newly deployed Ally waits until the next beginning-of-Night trigger.

## 11. Hidden information and playtest tools

Hunter views conceal Dracula's location and city-pile identities. During Dracula's Day or Night turn, selecting Dracula in Player desk shows his true city and a map marker labeled **Dracula (hidden)**. Shadow Passage selection and Wraith peeks have private controls. Public logs announce only information specified by each effect, such as a placement city or swap city pair.

Debug mode reveals city piles, Dracula's location, personal decks and market reserves. It supports forced draws, personal card addition/removal, Hunter relocation, investigations, putting existing encounters on top, market manipulation, phase advancement, reset and save/load. Debug actions bypass normal rules; hidden debug logs are not public action information.

In solo play, a tester can select another player’s view. Local saves and JSON exports contain hidden information. Online play uses separate seat invitations and server-filtered views. The server validates and saves each online action. Solo actions autosave in the browser, and JSON export/import provides separate snapshots.

## 12. Planned mechanics and open decisions

- **Darkness:** calendar, Vampire Maturation, permanent and tied Ally points, and the victory check are implemented. Specific event effects/amounts and balance testing remain planned; target 10 is provisional.
- **Call of the Night:** by Day, immediately play one additional card from hand using its Night timing and ability. Resolve all choices before ending the turn. The actual phase and calendar remain Day, so scheduled Night effects do not trigger. If no eligible card remains, the bonus ends. By Night, heal Dracula for 1 HP, capped at maximum. Both played cards enter discard normally. A second Call of the Night used for the bonus heals 1 HP.
- **Card completion:** placeholder signatures, travel, healing, investigation and Dracula market cards need finalized effects and implementations.
- **Equipment:** the named Ally counters and their removal actions are implemented; other deferred equipment effects remain planned. Medical Kit remains an Item.
- **Items:** identify any other cards to reclassify; Do not infer that every healing card is an Item.
- **Brush with Darkness supply:** the original unlimited acquisition/placement action is not implemented. Current ordinary encounters come from setup, Ready the Carriage at Night or Renfield; Tragic Accident adds its own hazard.
- **Combat balance:** HP, flat bonuses, ally values, strength-difference damage, tie behavior and recovery pacing remain playtest values. Further conditional bonuses are incomplete.
- **Consecrated cities:** permanent consecration, automatic Ally removal and blocked encounter placement are implemented, with Cultists as a placement exception. Hunter travel remains permitted; Dracula swaps/escapes and Wraith movement cannot enter consecrated cities.
- **Card timing and extra plays:** timing outside explicit phase rules is provisional; extra-play cards need their own action accounting.
- **Dracula survival:** current same-city identity reshuffle after combat is a provisional continuation rule.
- **City abilities, secure hot-seat handoffs, and AI:** remain outside the current prototype.

## 13. Maintaining this reference

Read this document before proposing or implementing rule changes in another project chat. Discussion of an option does not itself settle a rule.

When a rule change is accepted, update this document, the relevant data/engine/UI, and meaningful rule tests together. Mark a change as planned until implemented; record implementation discrepancies explicitly rather than silently turning them into design decisions. Keep the balance table and card reference current. Advance the review date when checking a new revision.

Source references: `src/data.ts` contains card definitions and defaults; `src/engine.ts` contains rule resolution; `src/main.tsx` contains player views and choices; `src/*.test.ts` contains automated rule examples. If code conflicts with this document, flag and reconcile the discrepancy before relying on the behavior as an agreed rule.

### Public health display

Dracula’s current and maximum HP are public information, shown in a health bar beside the Darkness tracker for every player view. This display does not reveal Dracula’s location. Renfield does not increase maximum HP.

Medical Assistance has been replaced by a second Medical Kit with identical Item behavior. The Hunter market pool contains two Medical Kits. Existing Medical Assistance cards become Medical Kits using the same saved card ID.



### Combat card selection order

Participating Hunters choose their combat card (or no card) in this fixed order: Lord Godalming, Jonathan Harker, Dr. Seward, Van Helsing, Mina Harker. Skip characters not selected for the game, Exhausted, or not participating in that city. Dracula chooses after the participating Hunters. The player desk follows the next chooser automatically. The engine rejects out-of-order selections, and each choice is locked once made. This ordering is independent of the selected Hunter turn order.

### One-use character Events (provisional)

One Quincy Morris is added to the Hunter market pool and one Immanuel Hildesheim to the Dracula market pool. These are additions, not starting-deck cards or replacements. Acquire into discard normally; no immediate-use acquisition option. Both can be played by Day or Night as a standard action and are permanently trashed after resolving. They are Events, not Equipment, Items or deployed Allies.

- **Quincy Morris:** each conscious Hunter, anywhere on the map, heals 2 HP up to their current maximum and draws 1 card. It does not revive Exhausted or recovering Hunters and does not grant extra actions. Drawing recycles personal discards normally and may produce fewer cards if none remain. The event is removed before drawing, so it cannot draw itself.
- **Immanuel Hildesheim:** shuffle one Brush with Darkness into each open city. Trash the Event after play.

Existing saves add missing new Events to the market reserve once, without altering the current face-up display, positions or hands. Saved initialization prevents trashed Events returning on later loads. Hildesheim's spelling follows Bram Stoker's novel; these event effects are game abstractions.

### Latest resolution display

A public Latest resolution panel appears directly beneath the Darkness and Dracula HP trackers. It groups all log messages generated by the latest action, shows whether a choice or combat resolution is still pending, and retains the result across normal turn advancement and save/load. Debug-only resolution details stay hidden when Debug is disabled. The full chronological log remains available below. This changes presentation, not game mechanics.
