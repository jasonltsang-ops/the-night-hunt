# The Night Hunt — Current Rules

Last reviewed: November 6, 2026.

This is the shared rules reference for development and playtesting across project chats. It describes the current prototype, rather than preserving superseded versions of the design. Numeric balance values remain provisional.

**Status terms:** **Implemented** means the prototype resolves the effect. **Partial** means only the listed part works. **Planned** means the design exists but the effect is not implemented. **Open** means a decision is still needed. Implementation limitations below are not automatically permanent game rules.

## 1. Players, objectives and balance

One player controls Dracula. Four Hunters are selected from Lord Godalming, Jonathan Harker, Van Helsing, Dr. Seward and Mina Harker. Solo play supports one person controlling everyone. In two-player online play, one player controls Dracula and one controls all four Hunters.

Hunters win by reducing Dracula to 0 HP in combat. Merely discovering Dracula no longer wins the game; it starts a showdown.

Dracula wins immediately at **10 total Darkness**. Total Darkness is accumulated weekly/event/exhaustion points plus one point per Ally currently deployed. When an Ally is removed or defeated, its point is lost; it never generates a recurring weekly point. Reaching the target ends normal play, so removing an Ally afterwards cannot undo a victory.

| Value | Current setting |
|---|---:|
| Hunter maximum HP | 4 each; 5 with Smelling Salts |
| Hunter base combat strength | 1 each |
| Dracula maximum HP | 10; 12 while Renfield is deployed |
| Dracula base combat strength | 3 |
| Opening hand / end-of-round draw | 3 cards |
| Equipment capacity | 1 per Hunter |
| Brush with Darkness damage | 1 |
| Savage Attack damage | 2 |
| Darkness victory target | 10 |
| Darkness per completed week | 3 |
| Darkness per Ally currently in play | 1 |

These values are provisional and primarily defined in `src/data.ts`.

## 2. Map and setup

| | | |
|---|---|---|
| London | Paris | Prague |
| Madrid | Munich | Vienna |
| Marseille | Rome | Athens |

One connection takes you to an orthogonally adjacent city, directly above, below, left, or right on the map. Hypnosis has its own proximity rule that includes diagonals.

Each selected Hunter chooses their starting city first, in selected-player order. Hunters may share a city without a limit. After all four positions are chosen and visible, Dracula chooses his hidden starting city last. Dracula may choose any city, including one occupied by Hunters. This does not itself trigger combat. All city encounter piles are finalized and shuffled after Dracula chooses, then the first Hunter's Day turn begins. Setup choices do not consume actions. Starting-location setup is saved so it can be resumed; ongoing saves keep their existing positions.

Build each city's starting encounter pile as follows.

| Cities | Brush with Darkness | Fog | Savage Attack | Total |
|---|---:|---:|---:|---:|
| London, Prague, Marseille, Athens | 4 | 1 | 0 | 5 |
| Madrid, Vienna, Paris, Rome | 4 | 0 | 1 | 5 |
| Munich | 3 | 1 | 1 | 5 |

Dracula secretly replaces one Brush with Darkness in his chosen starting city with his identity card. Shuffle each city's pile independently. Show the starting mixes during city selection. Once play begins, show only the remaining card counts. The map starts with 45 cards in total, including exactly one Dracula identity.

A city **becomes permanently consecrated when its encounter pile reaches 0**. Remove all Allies there immediately and lose their Darkness contributions. New encounters and Allies cannot be placed there by any source, including Ready the Carriage at Night, Renfield, Savage Attack or Wraith movement. Hunters can still travel through or stop there, without adding a Night encounter from Ready the Carriage. Consecrated locations cannot host Dracula or be swap/escape destinations.

If the final encounter is Dracula's identity, defer consecration during the showdown: his revealed identity still occupies the location. If he survives without escaping, reshuffle it into that pile; if he escapes, the normal swapped encounter replaces him. If defeated, the game ends and any now-empty city becomes consecrated. This preserves the existing swap/continuation rule without stranding Dracula's identity.

The top card is the next card investigated. The interface displays remaining encounter counts, not resolved counts. Added encounters can increase a city's pile beyond five. Exactly one Dracula identity must remain in the game.

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
| Savage Attack | 2 |
| Fog | 2 |
| Shadow Passage | 2 |
| Dark Influence | 2 |
| Call of the Night | 1 |

Shuffle personal decks and draw three. The retired card named Delaying Encounter still converts to Savage Attack when loading older saves. Call of the Night grants a bonus Night-effect card play by Day, or heals 1 HP by Night.

## 4. Turns, timing and drawing

The game starts **Week 1, day 1 (Sunday), Day phase**, at zero Darkness. One full Day/Night round is one calendar day. After the final scheduled Night turn (including a pass or recovery turn), advance the day. After Saturday (day 7), advance to the next week's Sunday and add **3 accumulated Darkness**. There is no starting award on Week 1 Sunday. Combat and unresolved choices must finish before the calendar advances. Without Allies or events, Dracula reaches 12 Darkness and wins on Week 5 Sunday, after 28 complete days.

The display separates accumulated Darkness (weekly points plus event and exhaustion points) from Ally Darkness. Immanuel Hildesheim adds encounters and grants no Darkness. Old saves migrate their existing round to the matching calendar date, count elapsed weeks, and include deployed Allies; a previously completed Hunter victory is preserved.

1. **Day:** each Hunter in selected-player order, then Dracula.
2. **Night:** first resolve Dracula’s beginning-of-Night effects (Renfield, then Wraith), then Dracula’s standard turn, then each Hunter in the same order. These effects do not use his standard action.
3. **End of round:** discard unused hands, then everyone draws three cards.

Each scheduled turn permits one standard card play. Resolve its choices before ending the turn. The turn structure does not automatically draw cards between Day and Night. When a personal draw pile runs out, shuffle its discard into a new draw pile; draw as many cards as available.

Hunters may pass voluntarily even with playable cards. A Hunter can instead trade or trash equipped counter-equipment to remove an Ally, as described below. Dracula must play an eligible standard-action card when one is available, or pass when no eligible card is available. Combat-only cards are held for combat, not played as standard actions.

Most implemented action cards are eligible by Day and Night. **Shadow Passage is Night only.** Visit the Market works in both phases but has different effects. Other card timing remains configurable and provisional. Additional-play effects are not implemented yet.

## 5. Shared market and card ownership

There is **one shared market**, not separate faction displays. Shuffle 30 Hunter market cards and 10 Dracula market cards into a combined 40-card pool. Display ten; the remaining 30 form the reserve. Smelling Salts and Renfield are additions to the previous market, rather than replacements for other cards. There is no guaranteed faction mix: the display may contain many Dracula cards or none. There are no costs or currency.

Acquisition removes a face-up card and normally places it in the acquiring player's personal discard. Players acquire their own faction's cards. Equipment and Items have acquisition choices described in section 8.

The display depletes across turns and rounds. **When a removal leaves three or fewer cards, immediately refill toward ten**, even mid-turn. Keep the remaining face-up cards. Refill only as far as available cards permit. Dawn and round changes do not refill the market.

Denied or trashed cards leave the game permanently and never recycle. A market replacement discard, if present, can be reshuffled when the reserve is exhausted. Visit the Market at Night replaces its selected slot first, then applies the usual refill check. If three or fewer face-up cards remain, refill toward ten immediately. Debug replacement is a testing tool.

### Visit the Market — Hunter

| Timing | Choose one effect |
|---|---|
| Day | Acquire 1 Hunter card or deny 1 Dracula card. |
| Night | Trash 1 face-up card and refill its slot. |

If the display is completely empty, Visit the Market resolves with no market change. If a card remains, its applicable choice must be resolved.

### Dark Influence — Dracula

| Timing | Choose one effect |
|---|---|
| Day | Permanently deny one Hunter card. |
| Night | Acquire one Dracula card OR permanently deny one Hunter card. |

This is one market action; the earlier replace-then-acquire design is superseded. With no legal target, the card resolves without a market change.

### Family Fortune — Lord Godalming

Acquire two Hunter market cards, one at a time. Denial is not permitted. Normal equipment/Item acquisition choices apply. Any threshold refill happens between acquisitions, so newly revealed cards can be selected. If no Hunter cards remain available, stop acquiring.

## 6. Movement, investigations and encounters

### Hunter Travel

Ready the Carriage works by Day or Night: move the Hunter one connection. This becomes their actual location for investigations, combat and other effects. Alternatively, **Wait and Prepare**: stay in your current city and draw one card, then discard Ready the Carriage. This uses the card play, grants no additional play, and adds no encounter.

At Night, after using Ready the Carriage to enter an open city, add one ordinary encounter to the destination and shuffle the entire destination pile, including Dracula if present. No immediate damage is dealt. Ready the Carriage adds nothing by Day.

Travel by Train moves up to three connections by Day or Night. Fast Horse moves up to two connections by Day or one by Night. Neither card adds an encounter. Discard Fast Horse after play and permanently trash Travel by Train after play. Group Passage moves the acting Hunter and any chosen conscious Hunters in their city up to two connections by Day or Night. Everyone moves to the same destination. No encounter is added, and the card is permanently trashed after play.

### Basic Investigate

Reveal and remove the top encounter at the acting Hunter's current city. Brush with Darkness deals 1 damage and Savage Attack deals 2 damage when investigated, by Day or Night. Finding Dracula starts combat. An empty pile resolves without damage. Resolved ordinary encounters do not recycle automatically.

### Savage Attack — Dracula

Playable by Day or Night. Place one new hidden Savage Attack into a chosen city:

- **Day:** Dracula's actual city or an open orthogonally adjacent city.
- **Night:** any open city.

Publicly announce the chosen city and shuffle its entire pile, including Dracula if present. The played personal action card goes to Dracula's discard; a separate encounter token is added to the city. This cannot replenish an empty or consecrated pile and does not move Dracula. When investigated, it deals 2 damage.

### Fog — Dracula

Fog uses the same placement rules as Savage Attack. When investigated, the investigating Hunter discards one random card from their remaining hand if they have one. Fog deals no damage. By Day, discard Fog from the city pile. At Night, shuffle it back into that city pile.

### Shadow Passage — Dracula

Night only. First privately choose whether to move Dracula:

- **Move:** select Dracula's identity in his actual city and swap it with one selected card from an orthogonally adjacent city.
- **Bluff:** swap two non-Dracula cards between any two distinct cities. These cities need not be adjacent; Dracula stays where he is.

Both selected piles must be open and contain a card. Shuffle both after the swap. Publicly announce only the two involved cities, not the selected cards, whether Dracula moved, or his destination. The played Shadow Passage card goes to personal discard. The engine derives Dracula's true location from his identity card.

## 7. Combat, damage and exhaustion

Discovering Dracula pauses normal play. All conscious Hunters at that city participate. Each participating Hunter contributes base strength 1, bonuses from one equipped item, and optionally one eligible combat card from hand. Dracula contributes base strength 3, Great Wolf’s +2 bonus if it is at the combat city, and optionally one eligible combat card from hand. Every participant chooses a card or explicitly chooses no card.

Sum each side's strength. Dracula wins ties, but ties deal zero showdown damage. Otherwise, the losing side takes damage equal to the strength difference, plus 3 damage if Dracula wins at Vampire Bride’s city. Played combat cards go to their owners' discards unless another rule removes them.

- When Hunters win, Dracula takes all damage. At 0 HP, Hunters win the game and normal play ends.
- When Dracula wins, divide damage as evenly as possible among participating Hunters. Dracula chooses which Hunters take one extra point when there is a remainder.

Combat cards contribute during the showdown rather than using a separate standard action. The investigating Hunter has already spent their standard action; other participants' scheduled turns are not consumed by joining combat.

### Reckless Assault

Planned Ambush resolves after all combat cards are chosen and ends the showdown immediately. Dracula takes 2 damage, his combat card is cancelled, and all chosen cards go to discard. Skip normal strength comparison, equipment effects, other combat card effects at resolution, and escape. HP already lost to Reckless Assault still applies. If multiple Hunters chose Planned Ambush, deal the 2 damage once. If Dracula survives, shuffle his identity back into the city.

Reckless Assault contributes **+2 strength** and deals **1 damage to its Hunter** as soon as the Hunter locks in the card. If this cost brings them to 0 HP, they still contribute their base, equipment and card bonuses and remain part of damage allocation. Their exhaustion waits until combat concludes, including any escape resolution. Apply it even if Dracula is defeated.

Unholy Strength, Mesmerize, and Pride of Dracula go to discard after play. Unholy Strength still grants +1 Str if the Hunters have no equipment. Mesmerize zeroes the chosen Hunter’s Strength, including equipment, combat cards, and Pistol boosts. Pride of Dracula can defeat Dracula before the showdown resolves.

### Hunter exhaustion and recovery

At 0 HP, a Hunter is Exhausted. Dracula gains 1 permanent accumulated Darkness each time a Hunter becomes Exhausted. Count each exhaustion once; a recovered Hunter can award another point if Exhausted again. Existing saves start this counter at zero, without retroactive awards. For Reckless Assault, award the point when deferred exhaustion takes effect after combat; an already resolved Hunter victory remains a Hunter victory. Permanently remove all their equipment and all non-basic cards in their hand, draw and discard. Basic cards are Ready the Carriage, Visit the Market, Investigate and A Lucky Find. Keep their city position. They cannot act or participate in new combat while Exhausted.

Their next scheduled Day or Night turn is spent recovering. At the start of their following scheduled turn, they return at full HP; if their hand is empty, draw up to the normal hand size. Healing cannot revive a Exhausted Hunter or bypass recovery. Reckless Assault has the explicit delayed-exhaustion exception above.

### Dracula's escape and continued hiding

Escape as Mist and Escape as Bats are chosen as Dracula's combat card. If Dracula survives, he can use the escape regardless of which side won, or decline it.

| Card | Movement | Public information |
|---|---|---|
| Escape as Mist | One orthogonal connection | Destination stays hidden. |
| Escape as Bats | Up to two orthogonal connections | Final destination is announced. |

Swap Dracula's revealed identity with a chosen card in the destination pile, then shuffle both city piles. Empty/consecrated destination piles are ineligible. If Dracula stays, shuffle his identity back into his current city pile. The same-city identity reshuffle remains a provisional continuation rule; permanent consecration is implemented.

## 8. Equipment, Items, healing and trash

**Discard** keeps a card in its owner's personal deck cycle. **Trash** permanently removes it from all game piles; it cannot be drawn, recycled or reacquired through normal play.

### Equipment

On acquiring equipment, choose to equip it immediately without another action or put it in personal discard. Equipment in hand can be equipped using a standard card play.

Each Hunter has one equipment slot. When replacing the equipped card, choose whether to discard or permanently trash it. Older saves keep the first equipped card and move extra equipment to discard. This choice applies both when acquiring and when equipping from hand. Equipment stays attached between turns and combats until removed, replaced or lost through exhaustion.

### Counter-equipment

The three equipment counters provide persistent benefits while equipped. To remove the matching revealed Ally, a conscious Hunter must be at its city with that counter **equipped**, and spend their unused standard **Day or Night action**. Permanently **trash** the equipped card; remove the Ally and its 1 Darkness. A card merely in hand does not qualify. This replaces the earlier discard-cost idea and earlier type-wide sacrifice metadata. No other equipment currently removes Allies.

| Equipment | Persistent benefit | Ally removed |
|---|---|---|
| Hunting Rifle | +1 combat strength | Great Wolf |
| Crucifix | Reduce the equipped Hunter’s ordinary/Savage Attack damage by 1, minimum 0 (normally 0 Day / 1 Night); no combat damage reduction | Wraith |
| Smelling Salts | +1 maximum HP; equipping also grants 1 current HP | Renfield |

When Smelling Salts leaves play (replacement or sacrifice), return to the base maximum and cap current HP at that maximum; do not subtract an extra point from a wounded Hunter. Exhaustion removes all equipment and leaves the Hunter at 0 HP until recovery. The HP bonus is applied both when equipping from hand and when equipping immediately on acquisition.

### Items

Items use no equipment slots. On acquiring an Item, choose to use it immediately without another action or put it in personal discard. Using it later from hand takes a standard play. **Every Item is permanently trashed after use**, whether used on acquisition or from hand.

Medical Kit is the currently classified consumable Item: heal its user for 2 HP, up to maximum health, then trash it. It has no combat bonus and cannot revive a Exhausted Hunter. It is not Equipment.


### A Lucky Find

This replaces the starting Combat card. Play it as a normal action by Day or Night to heal yourself for 1 HP, capped at full health, then discard it. Alternatively, keep it in hand and contribute +1 strength as your combat card when a showdown occurs. The combat use does not also heal.

## 9. Character cards and trading

Each Hunter receives the following two signature cards. Implemented effects below supersede earlier draft descriptions.

| Hunter | Card | Current effect / status |
|---|---|---|
| Lord Godalming | Family Fortune | Implemented: acquire two Hunter cards as described in section 5. |
| Lord Godalming | Lucy's Revenge | Use in combat for +3 Strength, then discard. |
| Jonathan Harker | Methodical Search | Implemented: privately examine the top two encounters at your city, resolve one and shuffle the other back with the remaining pile. With one card, resolve that card; an empty pile does nothing. |
| Jonathan Harker | Urgent Dispatch | Implemented: move yourself or another conscious Hunter one orthogonal connection, without consuming their action or adding an encounter from Ready the Carriage at Night. |
| Van Helsing | Correspondence | Day or Night. Exchange one hand card each with another conscious Hunter anywhere on the map. You may immediately play the exact card you received if legal this phase, or keep it in hand and end your turn. Discard Correspondence after play. |
| Van Helsing | Vampire Lore | Use in combat for +2 Strength. Or play by Day or Night to discard one random card from your remaining hand or Dracula’s hand. The chosen hand must contain a card. Discard Vampire Lore after use. |
| Dr. Seward | Medical Expertise | Implemented: heal yourself or another conscious Hunter at your city for 2 HP, capped at maximum. Cannot revive or skip recovery. |
| Dr. Seward | Wax Cylinders | Day or Night. Choose a city occupied by any Hunter with a nonempty encounter pile. Reveal the top card and return it to the top or bottom without resolving it. |
| Mina Harker | Hypnosis | Implemented: another conscious Hunter at Mina's city discards one random hand card; then learn whether Dracula is in Mina's city or any surrounding city, including diagonals. Requires an eligible other Hunter with a hand card; does not reveal the exact city. |
| Mina Harker | Rally the Hunters | Day or Night. Move another conscious Hunter one orthogonal connection closer to Mina’s city. This uses no action for the moved Hunter and adds no Night encounter. |

Any conscious Hunter may trade instead of their standard card play. They must share a city with another conscious Hunter and discard one hand card as the cost. Then exchange one different remaining hand card OR one equipped item for one hand card OR equipped item belonging to the partner. Both Hunters may offer equipped equipment. The initiator needs a hand card for the discard cost and something else to trade; the partner may have only equipped equipment and no hand cards. Received equipment offers immediate equipping or placement in discard; with full slots, choose a replacement and discard or trash it as normal. Non-equipment received goes to hand. Equipment leaving its owner loses its bonuses; immediate equipping applies bonuses to the new owner. This uses the initiator's standard action but does not consume the partner's later scheduled turn.

## 10. Market card reference

One copy of each listed card starts in the combined market pool. Placeholder cards are present and acquirable, but their intended effects are not resolved by the prototype. Playing an action placeholder currently consumes the standard play and records a deferred-effect message; do not treat that as successful resolution of its intended effect.

### Hunter market: 30 cards

| # | Card | Current implementation |
|---|---|---|
| 1 | Wooden Stake | Item. Play as your combat card for +2 Str, then trash. Or trash to remove a revealed Vampire Bride at your city. |
| 2 | Holy Water | Item. Play as your combat card for +2 Str and trash after use, or trash to remove a revealed Ally at your city. |
| 3 | Crucifix | Equipment: reduce encounter damage by 1; trash using an action to remove Wraith. |
| 4 | Hunting Rifle | Equipment: +1 combat; trash using an action to remove Great Wolf. |
| 5 | Silver Dagger | Equipment, +2 Str in combat. |
| 6 | Reinforced Coat of Arms | Equipment. +1 Str. Prevent 1 encounter damage. |
| 7 | Medical Kit | Item: heal 2 and trash; immediate-use acquisition option. No combat bonus. |
| 8 | Pistol | Equipment. +1 Strength in combat, or discard it after combat cards are chosen for +2 Strength in that showdown. |
| 9 | Medical Kit (second copy) | Item: heal 2 and trash; immediate-use acquisition option. Replaces Medical Assistance. |
| 10 | First Aid | Heal yourself and one other conscious Hunter at your city for 1 HP each. Heal only yourself if alone. Discard after play. |
| 11 | First Aid | Heal yourself and one other conscious Hunter at your city for 1 HP each. Heal only yourself if alone. Discard after play. |
| 12 | Fast Horse | Move up to 2 connections by Day or 1 by Night. Adds no encounter. Discard after play. |
| 13 | Travel by Train | Move up to 3 connections by Day or Night. Adds no encounter. Trash after play. |
| 14 | Travel by Train | Move up to 3 connections by Day or Night. Adds no encounter. Trash after play. |
| 15 | Group Passage | Move up to 2 connections with any number of conscious Hunters from your city. Trash after play. |
| 16 | Thorough Search | Privately review the top 2 cards at your city. Investigate one and leave the other on top. Discard after play. |
| 17 | Thorough Search | Privately review the top 2 cards at your city. Investigate one and leave the other on top. Discard after play. |
| 18 | Careful Investigation | Privately review the top 2 cards at your city. Investigate one and put the other on the bottom. Discard after play. |
| 19 | Careful Investigation | Privately review the top 2 cards at your city. Investigate one and put the other on the bottom. Discard after play. |
| 20 | Local Rumors | Privately review up to 4 cards from the top of your city deck, then shuffle it. Discard after play. |
| 21 | Local Rumors | Privately review up to 4 cards from the top of your city deck, then shuffle it. Discard after play. |
| 22 | Coordinated Search | Investigate. If another Hunter is at your city, you may investigate again. Discard after play. |
| 23 | Planned Ambush | Combat card. Cancel Dracula’s combat card, deal 2 damage to Dracula, and end the showdown before normal combat effects. |
| 24 | Uncover Conspiracy | Reveal the top card at your city. Discard an encounter without taking damage. If you reveal Dracula, begin a showdown. |
| 25 | Uncover Conspiracy | Reveal the top card at your city. Discard an encounter without taking damage. If you reveal Dracula, begin a showdown. |
| 26 | Coordinated Strike | +1 Str, or +2 Str with another Hunter at your city. Discard after play. |
| 27 | Vampire Slayer | +2 Str. Discard after play. |
| 28 | Reckless Assault | +2 Str and lose 1 HP immediately when chosen. Exhaustion waits until combat concludes. Discard after play. |
| 29 | Smelling Salts | Equipment: +1 maximum/current HP; trash using an action to remove Renfield. |
| 30 | Quincy Morris | One-use Event: all conscious Hunters heal 2 HP and draw 1 card. |

### Dracula market: 10 cards

| # | Card | Current implementation |
|---|---|---|
| 1 | Escape as Mist | Combat escape or Night action. Move one connection and keep the destination hidden. |
| 2 | Escape as Bats | Combat escape up to two connections with the destination announced. As a Day action, move one connection secretly. |
| 3 | Vampire Bride | +3 total damage on a strict Dracula combat victory at her city. |
| 4 | Great Wolf | +2 Dracula strength in combat at its city. |
| 5 | Wraith | Beginning-of-Night movement and private bottom-encounter control; shares a city with another Ally. |
| 6 | Renfield | +2 Dracula maximum/current HP on deployment; adds one ordinary encounter to his city at the beginning of each Dracula Night turn. |
| 7 | Immanuel Hildesheim | One-use Event: shuffle one Brush with Darkness into each open city. |
| 8 | Unholy Strength | +1 Str. Choose a participating Hunter’s equipped item to discard before comparing Strength. |
| 9 | Mesmerize | Reduce one participating Hunter’s total Strength to 0 for the showdown. |
| 10 | Pride of Dracula | +4 Str. Dracula takes 2 damage immediately when chosen. |

### Location allies

Dracula acquires an Ally into discard, then plays it by Day or Night as a standard action. Deploy it in an open city. One ordinary Ally (Bride, Great Wolf or Renfield) may occupy a city, plus Wraith in a separate sharing slot. The card leaves Dracula's personal deck and stays deployed until removed. There is only one Wraith and one Renfield in the game.

**Reveal immediately whenever any Hunter is present**, including deployment beneath a Hunter, Hunter arrival and Wraith movement into a Hunter's city. Once revealed, it stays revealed. Revealing an Ally never examines or resolves the city's encounters or reveals Dracula's identity. An Ally can be removed with its matching equipped counter, or automatically when its city becomes consecrated. It never returns to Dracula's discard. Each deployed Ally contributes **1 Darkness**, even while face-down, wherever Dracula is. Acquired or pending-deployment cards contribute nothing.

- **Vampire Bride:** no strength bonus. When Dracula wins by strength at her city, add **3 total damage** to the normal Hunter damage pool; distribute the combined total evenly using the existing remainder choice. Ties still deal 0 damage.
- **Great Wolf:** **+2 Dracula strength** only in combat at its city.
- **Wraith:** no combat bonus. At the beginning of Dracula's Night turn, move one orthogonal connection to an open city, even if another Ally occupies it. Publicly announce movement. Dracula privately examines the destination's bottom encounter, moving it to the top or leaving it on the bottom. Do not reveal the card or placement choice in the log. Resolve this before Dracula plays or ends his normal turn. As an explicit fallback when every adjacent city is consecrated, Wraith stays put and skips its ability; it does not inspect its current pile. Consecrated destinations are never legal.
- **Renfield:** global **+2 maximum HP** for Dracula, and **+2 current HP on deployment** (normally up to 12). No recurring healing or strength bonus. At the beginning of each Dracula Night turn, add **one ordinary encounter to Renfield's own open city** and shuffle the entire pile, including Dracula if present. If removed, return Dracula to his base maximum, capping current HP without subtracting extra HP from an already wounded Dracula. A consecrated city removes Renfield immediately, before his ability can replenish it.

At the beginning of Night, resolve existing closures, then Renfield's automatic encounter placement, then Wraith's movement/examination. These are free scheduled effects; they do not draw or consume cards, use a standard action, or repeat after reload. A newly deployed Ally waits until the next beginning-of-Night trigger.

## 11. Hidden information and playtest tools

Hunter views conceal Dracula's location and city-pile identities. During Dracula's Day or Night turn, selecting Dracula in Player desk shows his true city and a map marker labeled **Dracula (hidden)**. Shadow Passage selection and Wraith peeks have private controls. Public logs announce only information specified by each effect, such as a placement city or swap city pair.

Debug mode reveals city piles, Dracula's location, personal decks and market reserves. It supports forced draws, personal card addition/removal, Hunter relocation, investigations, putting existing encounters on top, market manipulation, phase advancement, reset and save/load. Debug actions bypass normal rules; hidden debug logs are not public action information.

In solo play, a tester can select another player’s view. Local saves and JSON exports contain hidden information. Online play uses separate seat invitations and server-filtered views. The server validates and saves each online action. Solo actions autosave in the browser, and JSON export/import provides separate snapshots.

## 12. Planned mechanics and open decisions

- **Darkness:** calendar, weekly generation, deployed-Ally contributions, and the victory check are implemented. Specific event effects/amounts and balance testing remain planned; target 10 is provisional.
- **Call of the Night:** by Day, immediately play one additional card from hand using its Night timing and ability. Resolve all choices before ending the turn. The actual phase and calendar remain Day, so scheduled Night effects do not trigger. If no eligible card remains, the bonus ends. By Night, heal Dracula for 1 HP, capped at maximum. Both played cards enter discard normally. A second Call of the Night used for the bonus heals 1 HP.
- **Card completion:** placeholder signatures, travel, healing, investigation and Dracula market cards need finalized effects and implementations.
- **Equipment:** the named Ally counters and their removal actions are implemented; other deferred equipment effects remain planned. Medical Kit remains an Item.
- **Items:** identify any other cards to reclassify; Do not infer that every healing card is an Item.
- **Brush with Darkness supply:** the original unlimited acquisition/placement action is not implemented. Current ordinary encounters come from setup, Ready the Carriage at Night or Renfield; Savage Attack adds its own hazard.
- **Combat balance:** HP, flat bonuses, ally values, strength-difference damage, tie behavior and recovery pacing remain playtest values. Further conditional bonuses are incomplete.
- **Consecrated cities:** permanent consecration, automatic Ally removal and blocked encounter placement are implemented. Hunter travel remains permitted; Dracula swaps/escapes and Wraith movement cannot enter consecrated cities.
- **Card timing and extra plays:** timing outside explicit phase rules is provisional; extra-play cards need their own action accounting.
- **Dracula survival:** current same-city identity reshuffle after combat is a provisional continuation rule.
- **City abilities, secure hot-seat handoffs, and AI:** remain outside the current prototype.

## 13. Maintaining this reference

Read this document before proposing or implementing rule changes in another project chat. Discussion of an option does not itself settle a rule.

When a rule change is accepted, update this document, the relevant data/engine/UI, and meaningful rule tests together. Mark a change as planned until implemented; record implementation discrepancies explicitly rather than silently turning them into design decisions. Keep the balance table and card reference current. Advance the review date when checking a new revision.

Source references: `src/data.ts` contains card definitions and defaults; `src/engine.ts` contains rule resolution; `src/main.tsx` contains player views and choices; `src/*.test.ts` contains automated rule examples. If code conflicts with this document, flag and reconcile the discrepancy before relying on the behavior as an agreed rule.

### Public health display

Dracula’s current and maximum HP are public information, shown in a health bar beside the Darkness tracker for every player view. This display does not reveal Dracula’s location. The maximum includes active ally effects such as Renfield.

Medical Assistance has been replaced by a second Medical Kit with identical Item behavior. The Hunter market pool contains two Medical Kits. Existing Medical Assistance cards become Medical Kits using the same saved card ID.

Wooden Stake is an Item. Play it as your combat card for +2 Str. Trash it when used in a resolved showdown. Alternatively, trash it to remove a revealed Vampire Bride at your city, immediately on acquisition or as a Day or Night action from hand.

Holy Water is an Item. Play it from hand as your one combat card for +2 Str and trash it when its effect resolves. Alternatively, use it to remove one revealed Ally at your city, including Wraith in a shared slot. You may do this immediately on acquisition or by playing it from hand as your Day or Night action. Trash it after use.

### Combat card selection order

Participating Hunters choose their combat card (or no card) in this fixed order: Lord Godalming, Jonathan Harker, Dr. Seward, Van Helsing, Mina Harker. Skip characters not selected for the game, Exhausted, or not participating in that city. Dracula chooses after the participating Hunters. The player desk follows the next chooser automatically. The engine rejects out-of-order selections, and each choice is locked once made. This ordering is independent of the selected Hunter turn order.

### One-use character Events (provisional)

One Quincy Morris is added to the Hunter market pool and one Immanuel Hildesheim to the Dracula market pool. These are additions, not starting-deck cards or replacements. Acquire into discard normally; no immediate-use acquisition option. Both can be played by Day or Night as a standard action and are permanently trashed after resolving. They are Events, not Equipment, Items or deployed Allies.

- **Quincy Morris:** each conscious Hunter, anywhere on the map, heals 2 HP up to their current maximum and draws 1 card. It does not revive Exhausted or recovering Hunters and does not grant extra actions. Drawing recycles personal discards normally and may produce fewer cards if none remain. The event is removed before drawing, so it cannot draw itself.
- **Immanuel Hildesheim:** shuffle one Brush with Darkness into each open city. Trash the Event after play.

Existing saves add missing new Events to the market reserve once, without altering the current face-up display, positions or hands. Saved initialization prevents trashed Events returning on later loads. Hildesheim's spelling follows Bram Stoker's novel; these event effects are game abstractions.

### Latest resolution display

A public Latest resolution panel appears directly beneath the Darkness and Dracula HP trackers. It groups all log messages generated by the latest action, shows whether a choice or combat resolution is still pending, and retains the result across normal turn advancement and save/load. Debug-only resolution details stay hidden when Debug is disabled. The full chronological log remains available below. This changes presentation, not game mechanics.
