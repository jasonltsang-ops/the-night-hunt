# The Night Hunt — Current Rules

Last reviewed: November 6, 2026.

This is the shared rules reference for development and playtesting across project chats. It describes the current prototype, rather than preserving superseded versions of the design. Numeric balance values remain provisional.

**Status terms:** **Implemented** means the prototype resolves the effect. **Partial** means only the listed part works. **Planned** means the design exists but the effect is not implemented. **Open** means a decision is still needed. Implementation limitations below are not automatically permanent game rules.

## 1. Players, objectives and balance

One player controls Dracula. Four Hunters are selected from Lord Godalming, Jonathan Harker, Van Helsing, Dr. Seward and Mina Harker. The current interface supports one person controlling everyone; AI and network multiplayer are not implemented.

Hunters win by reducing Dracula to 0 HP in combat. Merely discovering Dracula no longer wins the game; it starts a showdown.

Dracula wins immediately at **10 total Darkness**. Total Darkness is accumulated weekly/event points plus one point per Ally currently deployed. When an Ally is removed or defeated, its point is lost; it never generates a recurring weekly point. Reaching the target ends normal play, so removing an Ally afterwards cannot undo a victory.

| Value | Current setting |
|---|---:|
| Hunter maximum HP | 4 each; 5 with Smelling Salts |
| Hunter base combat strength | 1 each |
| Dracula maximum HP | 10; 12 while Renfield is deployed |
| Dracula base combat strength | 3 |
| Opening hand / end-of-round draw | 3 cards |
| Equipment capacity | 2 per Hunter |
| Ordinary or Damaging Encounter damage when investigated by Day | 1 |
| Ordinary or Damaging Encounter damage when investigated at Night | 2 |
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

Connections are orthogonal: horizontal and vertical neighbors only. Diagonal cities are not connected. Psychic Connection has its own proximity rule that includes diagonals.

Hunters currently start in London; this starting-city rule is provisional. Dracula's starting city can be selected in new-game setup or randomized secretly.

Each city receives four ordinary encounters. Add Dracula's identity card to his starting city and a fifth ordinary encounter to each other city. Shuffle each city independently. Every city starts with five cards: **44 ordinary encounters and exactly one Dracula identity across the map**. There are no separate decoy identity cards in the current implementation.

A city **permanently closes when its encounter pile reaches 0**. Remove all Allies there immediately and lose their Darkness contributions. New encounters and Allies cannot be placed there by any source, including Night Travel, Renfield, Damaging Encounter or Wraith movement. Hunters can still travel through or stop there, with no Night Travel addition. Closed locations cannot host Dracula or be swap/escape destinations.

If the final encounter is Dracula's identity, defer closure during the showdown: his revealed identity still occupies the location. If he survives without escaping, reshuffle it into that pile; if he escapes, the normal swapped encounter replaces him. If defeated, the game ends and any now-empty city closes. This preserves the existing swap/continuation rule without stranding Dracula's identity.

The top card is the next card investigated. The interface displays remaining encounter counts, not resolved counts. Added encounters can increase a city's pile beyond five. Exactly one Dracula identity must remain in the game.

## 3. Personal starting decks

Each Hunter starts with nine cards:

| Card | Copies |
|---|---:|
| Travel | 2 |
| Supply | 2 |
| Investigate | 2 |
| A Lucky Find | 1 |
| First character-specific card | 1 |
| Second character-specific card | 1 |

Dracula starts with nine cards:

| Card | Copies |
|---|---:|
| Damaging Encounter | 4 |
| Shadow Passage | 2 |
| Dark Influence | 2 |
| Call of the Night | 1 |

Shuffle personal decks and draw three. Delaying Encounter is no longer in Dracula's starting deck; old saves convert it to Damaging Encounter. Call of the Night is still a placeholder.

## 4. Turns, timing and drawing

The game starts **Week 1, day 1 (Sunday), Day phase**, at zero Darkness. One full Day/Night round is one calendar day. After the final scheduled Night turn (including a pass or recovery turn), advance the day. After Saturday (day 7), advance to the next week's Sunday and add **3 accumulated Darkness**. There is no starting award on Week 1 Sunday. Combat and unresolved choices must finish before the calendar advances. Without Allies or events, Dracula reaches 12 Darkness and wins on Week 5 Sunday, after 28 complete days.

The display separates accumulated Darkness (weekly points plus event points) from Ally Darkness. Event resolution has a shared engine hook, but individual event effects and point values remain planned. Old saves migrate their existing round to the matching calendar date, count elapsed weeks, and include deployed Allies; a previously completed Hunter victory is preserved.

1. **Day:** each Hunter in selected-player order, then Dracula.
2. **Night:** first resolve Dracula’s beginning-of-Night effects (Renfield, then Wraith), then Dracula’s standard turn, then each Hunter in the same order. These effects do not use his standard action.
3. **End of round:** discard unused hands, then everyone draws three cards.

Each scheduled turn permits one standard card play. Resolve its choices before ending the turn. The turn structure does not automatically draw cards between Day and Night. When a personal draw pile runs out, shuffle its discard into a new draw pile; draw as many cards as available.

Hunters may pass voluntarily even with playable cards. A Hunter can instead trade or trash equipped counter-equipment to remove an Ally, as described below. Dracula must play an eligible standard-action card when one is available, or pass when no eligible card is available. Combat-only cards are held for combat, not played as standard actions.

Most implemented action cards are eligible by Day and Night. **Shadow Passage is Night only.** Supply works in both phases but has different effects. Other card timing remains configurable and provisional. Additional-play effects are not implemented yet.

## 5. Shared market and card ownership

There is **one shared market**, not separate faction displays. Shuffle one copy of each of the 31 Hunter market cards and 11 Dracula market cards into a combined 42-card pool. Display ten; the remaining 32 form the reserve. Smelling Salts and Renfield are additions to the previous market, rather than replacements for other cards. There is no guaranteed faction mix: the display may contain many Dracula cards or none. There are no costs or currency.

Acquisition removes a face-up card and normally places it in the acquiring player's personal discard. Players acquire their own faction's cards. Equipment and Items have acquisition choices described in section 8.

The display depletes across turns and rounds. **When a removal leaves three or fewer cards, immediately refill toward ten**, even mid-turn. Keep the remaining face-up cards. Refill only as far as available cards permit. Dawn and round changes do not refill the market.

Denied or trashed cards leave the game permanently and never recycle. A market replacement discard, if present, can be reshuffled when the reserve is exhausted. Night Supply is a specific one-slot trash-and-refill effect, independent of the usual depletion cycle. Debug replacement is a testing tool.

### Basic Supply — Hunter

| Timing | Choose one effect |
|---|---|
| Day | Acquire one Hunter card OR permanently deny one Dracula card. |
| Night | Permanently trash any one face-up market card, then refill that slot from the reserve. No acquisition. |

If the display is completely empty, Supply resolves with no market change. If a card remains, its applicable choice must be resolved.

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

Basic Travel works by Day or Night: choose one orthogonally adjacent city and move the Hunter there. This becomes their actual location for investigations, combat and other effects.

At Night, after basic Travel to an open city, add one ordinary encounter to the destination and shuffle the entire destination pile, including Dracula if present. No immediate damage is dealt. Day Travel adds nothing.

Train Ticket moves up to two connections; Express Train moves up to three. The current implementation does not give advanced travel cards basic Travel's Night encounter penalty. Group Passage and Emergency Transit are still placeholders.

### Basic Investigate

Reveal and remove the top encounter at the acting Hunter's current city. Ordinary and Damaging Encounters deal 1 damage by Day or 2 by Night, based on the phase **when investigated**, not when placed. Finding Dracula starts combat. An empty pile resolves without damage. Resolved ordinary encounters do not recycle automatically.

### Damaging Encounter — Dracula

Playable by Day or Night. Place one new hidden Damaging Encounter into a chosen city:

- **Day:** Dracula's actual city or an open orthogonally adjacent city.
- **Night:** any open city.

Publicly announce the chosen city and shuffle its entire pile, including Dracula if present. The played personal action card goes to Dracula's discard; a separate encounter token is added to the city. This cannot replenish an empty or closed pile and does not move Dracula. When investigated, it uses the normal 1-Day / 2-Night damage rule.

### Shadow Passage — Dracula

Night only. First privately choose whether to move Dracula:

- **Move:** select Dracula's identity in his actual city and swap it with one selected card from an orthogonally adjacent city.
- **Bluff:** swap two non-Dracula cards between any two distinct cities. These cities need not be adjacent; Dracula stays where he is.

Both selected piles must be open and contain a card. Shuffle both after the swap. Publicly announce only the two involved cities, not the selected cards, whether Dracula moved, or his destination. The played Shadow Passage card goes to personal discard. The engine derives Dracula's true location from his identity card.

## 7. Combat, damage and knockout

Discovering Dracula pauses normal play. All conscious Hunters at that city participate. Each participating Hunter contributes base strength 1, bonuses from up to two equipped items, and optionally one eligible combat card from hand. Dracula contributes base strength 3, Great Wolf’s +2 bonus if it is at the combat city, and optionally one eligible combat card from hand. Every participant chooses a card or explicitly chooses no card.

Sum each side's strength. Dracula wins ties, but ties deal zero showdown damage. Otherwise, the losing side takes damage equal to the strength difference, plus applicable Wooden Stake or Vampire Bride bonus damage. Each equipped Stake on a participating Hunter adds 1 damage on a Hunter victory; Vampire Bride adds 2 total damage on a Dracula victory at her city. These effects do not add strength and do not trigger on ties. Played combat cards go to their owners' discards unless another rule removes them.

- When Hunters win, Dracula takes all damage. At 0 HP, Hunters win the game and normal play ends.
- When Dracula wins, divide damage as evenly as possible among participating Hunters. Dracula chooses which Hunters take one extra point when there is a remainder.

Combat cards contribute during the showdown rather than using a separate standard action. The investigating Hunter has already spent their standard action; other participants' scheduled turns are not consumed by joining combat.

### Final Stand

Final Stand contributes **+2 strength** and deals **1 damage to its Hunter** when the showdown resolves. If this cost brings them to 0 HP, they still contribute their base, equipment and card bonuses and remain part of damage allocation. Their knockout waits until combat concludes, including any escape resolution. Apply it even if Dracula is defeated. Selecting and then changing a combat card does not charge the cost; resolution does.

### Hunter knockout and recovery

At 0 HP, a Hunter is knocked out. Permanently remove all their equipment and all non-basic cards in their hand, draw and discard. Basic cards are Travel, Supply, Investigate and A Lucky Find. Keep their city position. They cannot act or participate in new combat while knocked out.

Their next scheduled Day or Night turn is spent recovering. At the start of their following scheduled turn, they return at full HP; if their hand is empty, draw up to the normal hand size. Healing cannot revive a knocked-out Hunter or bypass recovery. Final Stand has the explicit delayed-knockout exception above.

### Dracula's escape and continued hiding

Escape as Mist and Escape as Bats are chosen as Dracula's combat card. If Dracula survives, he can use the escape regardless of which side won, or decline it.

| Card | Movement | Public information |
|---|---|---|
| Escape as Mist | One orthogonal connection | Destination stays hidden. |
| Escape as Bats | Up to two orthogonal connections | Final destination is announced. |

Swap Dracula's revealed identity with a chosen card in the destination pile, then shuffle both city piles. Empty/closed destination piles are ineligible. If Dracula stays, shuffle his identity back into his current city pile. The same-city identity reshuffle remains a provisional continuation rule; permanent closure is implemented.

## 8. Equipment, Items, healing and trash

**Discard** keeps a card in its owner's personal deck cycle. **Trash** permanently removes it from all game piles; it cannot be drawn, recycled or reacquired through normal play.

### Equipment

Hunters have two persistent equipment slots. On acquiring equipment, choose to equip it immediately without another action or put it in personal discard. Equipment in hand can be equipped using a standard card play.

When replacing equipped equipment, choose which old item to replace and whether to discard or permanently trash it. This choice applies both when acquiring and when equipping from hand. Equipment stays attached between turns and combats until removed, replaced or lost through knockout.

### Counter-equipment

All four counters provide persistent benefits while equipped. To remove the matching revealed Ally, a conscious Hunter must be at its city with that counter **equipped**, and spend their unused standard **Day or Night action**. Permanently **trash** the equipped card; remove the Ally and its 1 Darkness. A card merely in hand does not qualify. This replaces the earlier discard-cost idea and earlier type-wide sacrifice metadata. No other equipment currently removes Allies.

| Equipment | Persistent benefit | Ally removed |
|---|---|---|
| Wooden Stake | +1 damage to Dracula when its Hunter participates in a strictly winning showdown; no strength bonus | Vampire Bride |
| Hunting Rifle | +1 combat strength | Great Wolf |
| Crucifix | Reduce the equipped Hunter’s ordinary/Damaging Encounter damage by 1, minimum 0 (normally 0 Day / 1 Night); no combat damage reduction | Wraith |
| Smelling Salts | +1 maximum HP; equipping also grants 1 current HP | Renfield |

When Smelling Salts leaves play (replacement or sacrifice), return to the base maximum and cap current HP at that maximum; do not subtract an extra point from a wounded Hunter. Knockout removes all equipment and leaves the Hunter at 0 HP until recovery. The HP bonus is applied both when equipping from hand and when equipping immediately on acquisition.

### Items

Items use no equipment slots. On acquiring an Item, choose to use it immediately without another action or put it in personal discard. Using it later from hand takes a standard play. **Every Item is permanently trashed after use**, whether used on acquisition or from hand.

Medical Kit is the currently classified consumable Item: heal its user for 2 HP, up to maximum health, then trash it. It has no combat bonus and cannot revive a knocked-out Hunter. It is not Equipment.

Medical Supplies currently restores its user to full HP and is trashed when played from hand. It is implemented as a healing action rather than an Item; immediate use on acquisition is not currently available for this card. Its intended classification is **open**.

### A Lucky Find

This replaces the starting Combat card. Play it as a normal action by Day or Night to heal yourself for 1 HP, capped at full health, then discard it. Alternatively, keep it in hand and contribute +1 strength as your combat card when a showdown occurs. The combat use does not also heal.

## 9. Character cards and trading

Each Hunter receives the following two signature cards. Implemented effects below supersede earlier draft descriptions.

| Hunter | Card | Current effect / status |
|---|---|---|
| Lord Godalming | Family Fortune | Implemented: acquire two Hunter cards as described in section 5. |
| Lord Godalming | Lucy's Revenge | Partial: +3 combat; signature value provisional, special Dracula condition not implemented. |
| Jonathan Harker | Methodical Search | Planned: examine two encounters, resolve one, shuffle the other back. Currently a placeholder. |
| Jonathan Harker | Urgent Dispatch | Planned: move yourself or another Hunter one connection. Currently a placeholder. |
| Van Helsing | Correspondence | Planned signature effect; currently a placeholder. General trading below is implemented separately. |
| Van Helsing | Vampire Lore | Partial: +2 combat; signature value provisional, target-specific condition not implemented. |
| Dr. Seward | Medical Expertise | Implemented: heal yourself or another conscious Hunter at your city for 2 HP, capped at maximum. Cannot revive or skip recovery. |
| Dr. Seward | Clinical Assessment | Planned: discard/draw and Supply. Currently a placeholder. |
| Mina Harker | Psychic Connection | Implemented: another conscious Hunter at Mina's city discards one random hand card; then learn whether Dracula is in Mina's city or any surrounding city, including diagonals. Requires an eligible other Hunter with a hand card; does not reveal the exact city. |
| Mina Harker | Shared Vision | Implemented: privately examine the top encounter of any other nonempty city; return it to the top or bottom without resolving it. |

Any conscious Hunter may trade instead of their standard card play. They must share a city with another conscious Hunter and discard one hand card as the cost. Then exchange one different remaining hand card OR one equipped item for one hand card OR equipped item belonging to the partner. Both Hunters may offer equipped equipment. The initiator needs a hand card for the discard cost and something else to trade; the partner may have only equipped equipment and no hand cards. Received equipment offers immediate equipping or placement in discard; with full slots, choose a replacement and discard or trash it as normal. Non-equipment received goes to hand. Equipment leaving its owner loses its bonuses; immediate equipping applies bonuses to the new owner. This uses the initiator's standard action but does not consume the partner's later scheduled turn.

## 10. Market card reference

One copy of each listed card starts in the combined market pool. Placeholder cards are present and acquirable, but their intended effects are not resolved by the prototype. Playing an action placeholder currently consumes the standard play and records a deferred-effect message; do not treat that as successful resolution of its intended effect.

### Hunter market: 31 cards

| # | Card | Current implementation |
|---|---|---|
| 1 | Wooden Stake | Equipment: +1 damage on Hunter victory; trash using an action to remove Vampire Bride. |
| 2 | Holy Water | Equipment: +2 combat strength, then trash after contributing to the showdown; alternatively trash as an action to remove any one revealed ally at your city. |
| 3 | Crucifix | Equipment: reduce encounter damage by 1; trash using an action to remove Wraith. |
| 4 | Hunting Rifle | Equipment: +1 combat; trash using an action to remove Great Wolf. |
| 5 | Silver Dagger | Equipment, +2 combat. |
| 6 | Blessed Blade | Equipment, +2 combat. |
| 7 | Protective Amulet | Equipment, +1 combat. Damage prevention planned. |
| 8 | Medical Kit | Item: heal 2 and trash; immediate-use acquisition option. No combat bonus. |
| 9 | Garlic Wreath | Equipment, +1 combat. |
| 10 | Reinforced Coat | Equipment, +1 combat. Damage prevention planned. |
| 11 | Medical Supplies | Implemented healing action: restore self to full HP, then trash. Item classification open. Replaces the original First Aid entry. |
| 12 | Medical Kit (second copy) | Item: heal 2 and trash; immediate-use acquisition option. Replaces Medical Assistance. |
| 13 | Rest and Recovery | Placeholder; intended healing and a draw. |
| 14 | Train Ticket | Implemented: move up to 2 connections. |
| 15 | Express Train | Implemented: move up to 3 connections. |
| 16 | Group Passage | Placeholder; intended group movement. |
| 17 | Emergency Transit | Placeholder; intended movement and another play. |
| 18 | Thorough Search | Placeholder; intended two investigations. |
| 19 | Careful Investigation | Placeholder; intended examine two, resolve one. |
| 20 | Local Informant | Placeholder; intended adjacent-city peek. |
| 21 | Coordinated Search | Placeholder; intended investigations by two Hunters. |
| 22 | Track the Count | Placeholder; intended proximity information. |
| 23 | Uncover Conspiracy | Placeholder; intended ally reveal and draw. |
| 24 | Sacred Investigation | Placeholder; intended investigation and possible Heavenly Host. |
| 25 | Determined Assault | +3 combat. |
| 26 | Coordinated Strike | +2 combat; additional shared-city bonus not implemented. |
| 27 | Vampire Slayer | +4 combat. |
| 28 | Defensive Formation | +2 combat; damage prevention not implemented. |
| 29 | Final Stand | +2 combat, take 1 damage; knockout delayed until combat concludes. |
| 30 | Prepared Ambush | +2 combat; no-allies conditional bonus not implemented. |
| 31 | Smelling Salts | Equipment: +1 maximum/current HP; trash using an action to remove Renfield. |

### Dracula market: 11 cards

| # | Card | Current implementation |
|---|---|---|
| 1 | Escape as Mist | Combat escape; one connection, destination hidden. |
| 2 | Escape as Bats | Combat escape; up to two connections, destination public. |
| 3 | Wings of Darkness | Placeholder; advanced movement effect not implemented. |
| 4 | False Trail | Placeholder. |
| 5 | Vampire Bride | +2 total damage on a strict Dracula combat victory at her city. |
| 6 | Great Wolf | +2 Dracula strength in combat at its city. |
| 7 | Wraith | Beginning-of-Night movement and private bottom-encounter control; shares a city with another Ally. |
| 8 | Deadly Ambush | Placeholder. |
| 9 | Lost in Darkness | Placeholder. |
| 10 | Gathering Darkness | Placeholder; its event effect and Darkness amount are not assigned yet. |
| 11 | Renfield | +2 Dracula maximum/current HP on deployment; adds one ordinary encounter to his city at the beginning of each Dracula Night turn. |

### Location allies

Dracula acquires an Ally into discard, then plays it by Day or Night as a standard action. Deploy it in an open city. One ordinary Ally (Bride, Great Wolf or Renfield) may occupy a city, plus Wraith in a separate sharing slot. The card leaves Dracula's personal deck and stays deployed until removed. There is only one Wraith and one Renfield in the game.

**Reveal immediately whenever any Hunter is present**, including deployment beneath a Hunter, Hunter arrival and Wraith movement into a Hunter's city. Once revealed, it stays revealed. Revealing an Ally never examines or resolves the city's encounters or reveals Dracula's identity. An Ally can be removed with its matching equipped counter, or automatically when its city closes. It never returns to Dracula's discard. Each deployed Ally contributes **1 Darkness**, even while face-down, wherever Dracula is. Acquired or pending-deployment cards contribute nothing.

- **Vampire Bride:** no strength bonus. When Dracula wins by strength at her city, add **2 total damage** to the normal Hunter damage pool; distribute the combined total evenly using the existing remainder choice. Ties still deal 0 damage.
- **Great Wolf:** **+2 Dracula strength** only in combat at its city.
- **Wraith:** no combat bonus. At the beginning of Dracula's Night turn, move one orthogonal connection to an open city, even if another Ally occupies it. Publicly announce movement. Dracula privately examines the destination's bottom encounter, moving it to the top or leaving it on the bottom. Do not reveal the card or placement choice in the log. Resolve this before Dracula plays or ends his normal turn. As an explicit fallback when every adjacent city is closed, Wraith stays put and skips its ability; it does not inspect its current pile. Closed destinations are never legal.
- **Renfield:** global **+2 maximum HP** for Dracula, and **+2 current HP on deployment** (normally up to 12). No recurring healing or strength bonus. At the beginning of each Dracula Night turn, add **one ordinary encounter to Renfield's own open city** and shuffle the entire pile, including Dracula if present. If removed, return Dracula to his base maximum, capping current HP without subtracting extra HP from an already wounded Dracula. A closed city removes Renfield immediately, before his ability can replenish it.

At the beginning of Night, resolve existing closures, then Renfield's automatic encounter placement, then Wraith's movement/examination. These are free scheduled effects; they do not draw or consume cards, use a standard action, or repeat after reload. A newly deployed Ally waits until the next beginning-of-Night trigger.

## 11. Hidden information and playtest tools

Hunter views conceal Dracula's location and city-pile identities. During Dracula's Day or Night turn, selecting Dracula in Player desk shows his true city and a map marker labeled **Dracula (hidden)**. Shadow Passage selection, Shared Vision and Wraith peeks have private controls. Public logs announce only information specified by each effect, such as a placement city or swap city pair.

Debug mode reveals city piles, Dracula's location, personal decks and market reserves. It supports forced draws, personal card addition/removal, Hunter relocation, investigations, putting existing encounters on top, market manipulation, phase advancement, reset and save/load. Debug actions bypass normal rules; hidden debug logs are not public action information.

The interface is a solo testing tool, not a secure role boundary: a tester can select another player's view. Local saves and JSON exports contain hidden information. Hot-seat handoffs and authenticated multiplayer privacy are not implemented. Each action autosaves; JSON export/import provides separate snapshots.

## 12. Planned mechanics and open decisions

- **Darkness:** calendar, weekly generation, deployed-Ally contributions, and the victory check are implemented. Specific event effects/amounts and balance testing remain planned; target 10 is provisional.
- **Call of the Night:** original intention is to draft a Vampire from a separate supply and shuffle it into a chosen city; neither supply nor resolution exists yet.
- **Consecration:** Heavenly Host, cleared-city requirement, and final-hiding restrictions remain planned. No city is currently consecrated by the engine.
- **Card completion:** placeholder signatures, travel, healing, investigation and Dracula market cards need finalized effects and implementations.
- **Equipment:** the four named counters and their sacrifice actions are implemented; Protective Amulet/Reinforced Coat prevention and other deferred equipment effects remain planned. Medical Kit remains an Item.
- **Items:** identify any other cards to reclassify; Medical Supplies is a specific open case. Do not infer that every healing card is an Item.
- **Basic Encounter supply:** the original unlimited acquisition/placement action is not implemented. Current ordinary encounters come from setup, Night basic Travel or Renfield; Damaging Encounter adds its own hazard.
- **Combat balance:** HP, flat bonuses, ally values, strength-difference damage, tie behavior and recovery pacing remain playtest values. Further conditional bonuses are incomplete.
- **Closed cities:** permanent closure, automatic Ally removal and blocked encounter placement are implemented. Hunter travel remains permitted; Dracula swaps/escapes and Wraith movement cannot enter closed cities.
- **Card timing and extra plays:** timing outside explicit phase rules is provisional; extra-play cards need their own action accounting.
- **Dracula survival:** current same-city identity reshuffle after combat is a provisional continuation rule.
- **City abilities, secure hot-seat handoffs, networking and AI:** not implemented; AI and networking remain outside current scope.

## 13. Maintaining this reference

Read this document before proposing or implementing rule changes in another project chat. Discussion of an option does not itself settle a rule.

When a rule change is accepted, update this document, the relevant data/engine/UI, and meaningful rule tests together. Mark a change as planned until implemented; record implementation discrepancies explicitly rather than silently turning them into design decisions. Keep the balance table and card reference current. Advance the review date when checking a new revision.

Source references: `src/data.ts` contains card definitions and defaults; `src/engine.ts` contains rule resolution; `src/main.tsx` contains player views and choices; `src/*.test.ts` contains automated rule examples. If code conflicts with this document, flag and reconcile the discrepancy before relying on the behavior as an agreed rule.

### Public health display

Dracula’s current and maximum HP are public information, shown in a health bar beside the Darkness tracker for every player view. This display does not reveal Dracula’s location. The maximum includes active ally effects such as Renfield.

Medical Assistance has been replaced by a second Medical Kit with identical Item behavior. The Hunter market pool contains two Medical Kits; the total pool size is unchanged. Existing Medical Assistance cards become Medical Kits using the same saved card ID.

Holy Water is consumable Equipment, not an Item: it occupies a slot, grants +2 strength when its Hunter participates in a showdown, and is permanently trashed on combat resolution regardless of the outcome. It is not consumed merely by discovering Dracula or choosing cards. Instead of using it in combat, a Hunter may spend their unused Day or Night action and trash it to remove one chosen revealed Dracula ally at their current city. This works against any ally, including Wraith in a shared slot, and removes its Darkness contribution.

### Combat card selection order

Participating Hunters choose their combat card (or no card) in this fixed order: Lord Godalming, Jonathan Harker, Dr. Seward, Van Helsing, Mina Harker. Skip characters not selected for the game, knocked out, or not participating in that city. Dracula chooses after the participating Hunters. The player desk follows the next chooser automatically. The engine rejects out-of-order selections, and each choice is locked once made. This ordering is independent of the selected Hunter turn order.
