# The Night Hunt — Current Rules

Last reviewed: November 5, 2026.

This is the shared rules reference for development and playtesting across project chats. It describes the current prototype, rather than preserving superseded versions of the design. Numeric balance values remain provisional.

**Status terms:** **Implemented** means the prototype resolves the effect. **Partial** means only the listed part works. **Planned** means the design exists but the effect is not implemented. **Open** means a decision is still needed. Implementation limitations below are not automatically permanent game rules.

## 1. Players, objectives and balance

One player controls Dracula. Four Hunters are selected from Lord Godalming, Jonathan Harker, Van Helsing, Dr. Seward and Mina Harker. The current interface supports one person controlling everyone; AI and network multiplayer are not implemented.

Hunters win by reducing Dracula to 0 HP in combat. Merely discovering Dracula no longer wins the game; it starts a showdown.

Dracula's intended victory is reaching 10 Darkness. Darkness generation and this victory condition are **planned**, not implemented. The current prototype has no Dracula victory condition.

| Value | Current setting |
|---|---:|
| Hunter maximum HP | 4 each |
| Hunter base combat strength | 1 each |
| Dracula maximum HP | 10 |
| Dracula base combat strength | 3 |
| Opening hand / end-of-round draw | 3 cards |
| Equipment capacity | 2 per Hunter |
| Ordinary or Damaging Encounter damage when investigated by Day | 1 |
| Ordinary or Damaging Encounter damage when investigated at Night | 2 |
| Intended Darkness victory target | 10, not active |

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

1. **Day:** each Hunter in selected-player order, then Dracula.
2. **Night:** Dracula, then each Hunter in the same order.
3. **End of round:** discard unused hands, then everyone draws three cards.

Each scheduled turn permits one standard card play. Resolve its choices before ending the turn. The turn structure does not automatically draw cards between Day and Night. When a personal draw pile runs out, shuffle its discard into a new draw pile; draw as many cards as available.

Hunters may pass voluntarily even with playable cards. A Hunter can instead use the trade action described below. Dracula must play an eligible standard-action card when one is available, or pass when no eligible card is available. Combat-only cards are held for combat, not played as standard actions.

Most implemented action cards are eligible by Day and Night. **Shadow Passage is Night only.** Supply works in both phases but has different effects. Other card timing remains configurable and provisional. Additional-play effects are not implemented yet.

## 5. Shared market and card ownership

There is **one shared market**, not separate faction displays. Shuffle one copy of each of the 30 Hunter market cards and 10 Dracula market cards into a combined 40-card pool. Display ten; the remaining 30 form the reserve. There is no guaranteed faction mix: the display may contain many Dracula cards or none. There are no costs or currency.

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

At Night, after basic Travel, add one ordinary encounter to the destination and shuffle the entire destination pile, including Dracula if present. No immediate damage is dealt. Day Travel adds nothing.

Train Ticket moves up to two connections; Express Train moves up to three. The current implementation does not give advanced travel cards basic Travel's Night encounter penalty. Group Passage and Emergency Transit are still placeholders.

### Basic Investigate

Reveal and remove the top encounter at the acting Hunter's current city. Ordinary and Damaging Encounters deal 1 damage by Day or 2 by Night, based on the phase **when investigated**, not when placed. Finding Dracula starts combat. An empty pile resolves without damage. Resolved ordinary encounters do not recycle automatically.

### Damaging Encounter — Dracula

Playable by Day or Night. Place one new hidden Damaging Encounter into a chosen city:

- **Day:** Dracula's actual city or an orthogonally adjacent city.
- **Night:** any city.

Publicly announce the chosen city and shuffle its entire pile, including Dracula if present. The played personal action card goes to Dracula's discard; a separate encounter token is added to the city. This can replenish an empty pile and does not move Dracula. When investigated, it uses the normal 1-Day / 2-Night damage rule.

### Shadow Passage — Dracula

Night only. First privately choose whether to move Dracula:

- **Move:** select Dracula's identity in his actual city and swap it with one selected card from an orthogonally adjacent city.
- **Bluff:** swap two non-Dracula cards between any two distinct cities. These cities need not be adjacent; Dracula stays where he is.

Both selected piles must contain a card. Shuffle both after the swap. Publicly announce only the two involved cities, not the selected cards, whether Dracula moved, or his destination. The played Shadow Passage card goes to personal discard. The engine derives Dracula's true location from his identity card.

## 7. Combat, damage and knockout

Discovering Dracula pauses normal play. All conscious Hunters at that city participate. Each participating Hunter contributes base strength 1, bonuses from up to two equipped items, and optionally one eligible combat card from hand. Dracula contributes base strength 3, the location ally's bonus if present, and optionally one eligible combat card from hand. Every participant chooses a card or explicitly chooses no card.

Sum each side's strength. Dracula wins ties, but ties deal zero showdown damage. Otherwise, the losing side takes damage equal to the strength difference. Played combat cards go to their owners' discards unless another rule removes them.

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

Swap Dracula's revealed identity with a chosen card in the destination pile, then shuffle both city piles. Empty destination piles are currently ineligible. If Dracula stays, shuffle his identity back into his current city pile. These continuation and empty-pile restrictions remain provisional prototype rules.

## 8. Equipment, Items, healing and trash

**Discard** keeps a card in its owner's personal deck cycle. **Trash** permanently removes it from all game piles; it cannot be drawn, recycled or reacquired through normal play.

### Equipment

Hunters have two persistent equipment slots. On acquiring equipment, choose to equip it immediately without another action or put it in personal discard. Equipment in hand can be equipped using a standard card play.

When replacing equipped equipment, choose which old item to replace and whether to discard or permanently trash it. This choice applies both when acquiring and when equipping from hand. Equipment stays attached between turns and combats until removed, replaced or lost through knockout.

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

Any conscious Hunter may trade instead of their standard card play. They must share a city with another conscious Hunter, have at least two hand cards, and choose one to discard. Exchange a different remaining hand card for one card from the partner's hand. Equipped cards are not traded. The partner needs at least one hand card; this does not consume the partner's later scheduled turn.

## 10. Market card reference

One copy of each listed card starts in the combined market pool. Placeholder cards are present and acquirable, but their intended effects are not resolved by the prototype. Playing an action placeholder currently consumes the standard play and records a deferred-effect message; do not treat that as successful resolution of its intended effect.

### Hunter market: 30 cards

| # | Card | Current implementation |
|---|---|---|
| 1 | Wooden Stake | Equipment, +2 combat. Ally-removal sacrifice planned. |
| 2 | Holy Water | Equipment, +1 combat. Ally-removal sacrifice planned. |
| 3 | Crucifix | Equipment, +1 combat. Ally-removal sacrifice planned. |
| 4 | Hunting Rifle | Equipment, +2 combat. Ally-removal sacrifice planned. |
| 5 | Silver Dagger | Equipment, +2 combat. |
| 6 | Blessed Blade | Equipment, +2 combat. |
| 7 | Protective Amulet | Equipment, +1 combat. Damage prevention planned. |
| 8 | Medical Kit | Item: heal 2 and trash; immediate-use acquisition option. No combat bonus. |
| 9 | Garlic Wreath | Equipment, +1 combat. Ally-removal sacrifice planned. |
| 10 | Reinforced Coat | Equipment, +1 combat. Damage prevention planned. |
| 11 | Medical Supplies | Implemented healing action: restore self to full HP, then trash. Item classification open. Replaces the original First Aid entry. |
| 12 | Medical Assistance | Placeholder; intended healing for multiple Hunters. |
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

### Dracula market: 10 cards

| # | Card | Current implementation |
|---|---|---|
| 1 | Escape as Mist | Combat escape; one connection, destination hidden. |
| 2 | Escape as Bats | Combat escape; up to two connections, destination public. |
| 3 | Wings of Darkness | Placeholder; advanced movement effect not implemented. |
| 4 | False Trail | Placeholder. |
| 5 | Vampire Bride | Vampire ally, +2 strength at attached city. |
| 6 | Wolf Pack | Beast ally, +2 strength at attached city. |
| 7 | Dark Familiar | Supernatural ally, +2 strength at attached city. |
| 8 | Deadly Ambush | Placeholder. |
| 9 | Lost in Darkness | Placeholder. |
| 10 | Gathering Darkness | Placeholder; no Darkness generation yet. |

### Location allies

Dracula acquires an ally into discard, then plays it by Day or Night as a standard action. Attach it face-down to any city without an ally. One ally per city. The card leaves Dracula's personal deck and remains attached to that city.

Hunters can see that an ally exists, but not its identity until revealed; Dracula and Debug views can inspect it. Discovering Dracula at that city automatically reveals the ally, which adds its bonus. All three implemented allies currently provide **+2**, superseding the original 3/2/1 values. Allies stay attached through combat and Dracula's escape.

Hunter investigation of an ally instead of the encounter pile, equipment sacrifice to remove allies, and distinct ally powers are **planned**. The equipment's displayed removal types are design metadata, not functioning removal actions. The engine currently has only the three market ally cards; expansion to nine allies is not implemented.

## 11. Hidden information and playtest tools

Hunter views conceal Dracula's location and city-pile identities. During Dracula's Day or Night turn, selecting Dracula in Player desk shows his true city and a map marker labeled **Dracula (hidden)**. Shadow Passage selection and Shared Vision peeks have private controls. Public logs announce only information specified by each effect, such as a placement city or swap city pair.

Debug mode reveals city piles, Dracula's location, personal decks and market reserves. It supports forced draws, personal card addition/removal, Hunter relocation, investigations, putting existing encounters on top, market manipulation, phase advancement, reset and save/load. Debug actions bypass normal rules; hidden debug logs are not public action information.

The interface is a solo testing tool, not a secure role boundary: a tester can select another player's view. Local saves and JSON exports contain hidden information. Hot-seat handoffs and authenticated multiplayer privacy are not implemented. Each action autosaves; JSON export/import provides separate snapshots.

## 12. Planned mechanics and open decisions

- **Darkness:** generation, pacing and Dracula's actual victory check; target 10 is provisional.
- **Call of the Night:** original intention is to draft a Vampire from a separate supply and shuffle it into a chosen city; neither supply nor resolution exists yet.
- **Consecration:** Heavenly Host, cleared-city requirement, and final-hiding restrictions remain planned. No city is currently consecrated by the engine.
- **Card completion:** placeholder signatures, travel, healing, investigation and Dracula market cards need finalized effects and implementations.
- **Equipment:** prevention and sacrifice/removal effects remain planned; the old Medical Kit combat bonus is superseded by its Item classification.
- **Items:** identify any other cards to reclassify; Medical Supplies is a specific open case. Do not infer that every healing card is an Item.
- **Basic Encounter supply:** the original unlimited acquisition/placement action is not implemented. Current ordinary encounters come from setup or Night basic Travel; Damaging Encounter adds its own hazard.
- **Combat balance:** HP, flat bonuses, ally values, strength-difference damage, tie behavior and recovery pacing remain playtest values. Further conditional bonuses are incomplete.
- **Empty city piles:** current swaps/escapes require a selected destination card. Decide whether future movement can enter an empty city without a swap partner.
- **Card timing and extra plays:** timing outside explicit phase rules is provisional; extra-play cards need their own action accounting.
- **Dracula survival:** current same-city identity reshuffle after combat is a provisional continuation rule.
- **City abilities, secure hot-seat handoffs, networking and AI:** not implemented; AI and networking remain outside current scope.

## 13. Maintaining this reference

Read this document before proposing or implementing rule changes in another project chat. Discussion of an option does not itself settle a rule.

When a rule change is accepted, update this document, the relevant data/engine/UI, and meaningful rule tests together. Mark a change as planned until implemented; record implementation discrepancies explicitly rather than silently turning them into design decisions. Keep the balance table and card reference current. Advance the review date when checking a new revision.

Source references: `src/data.ts` contains card definitions and defaults; `src/engine.ts` contains rule resolution; `src/main.tsx` contains player views and choices; `src/*.test.ts` contains automated rule examples. If code conflicts with this document, flag and reconcile the discrepancy before relying on the behavior as an agreed rule.
