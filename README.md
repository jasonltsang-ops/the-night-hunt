# The Night Hunt

Browser-based asymmetric board-game prototype built with React, TypeScript and Vite. Game rules live separately from the interface and are covered by Vitest tests.

## Current rules

Read [RULES.md](RULES.md) for the current rules, provisional balance values, card implementation status, and open design questions. It is the shared reference for all project chats. Earlier design descriptions may be superseded; update the rules document alongside accepted rule changes.

## Run and test

With Node.js 20.19+ or 22.12+ and npm:

```sh
npm install
npm run dev
npm test
npm run build
```

Open the local URL printed by Vite. To use the established playtest address:

```sh
npm run dev -- --port 5174
```

On this machine, dependencies are installed but npm may not be on PATH. Equivalent commands are:

```sh
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174
node node_modules/vitest/vitest.mjs run
node node_modules/typescript/bin/tsc -b
node node_modules/vite/bin/vite.js build
```

## Playtesting

Select the active player in Player desk, play an action or pass where permitted, resolve its choices, then end the turn. Discovery pauses normal play for combat. Select each participant to choose a combat card or no card. Dracula selects damage remainder recipients and any escape destination through his view.

Enable Debug mode to inspect hidden information and construct test situations. The prototype supports personal decks, a shared market, Hunter travel and investigations, hidden Dracula swaps, encounters, a seven-day calendar, Vampire Maturation and Ally Darkness and Dracula victory, combat, recovery, equipment, consumable Items, four distinct location Allies, equipped counters that can be trashed to remove them, permanent city closure, and selected character abilities. Some cards remain placeholders; consult the rules reference before testing an effect.

Each action autosaves in the browser. Export JSON before resetting if you want an independent snapshot. Saves contain hidden information and use schema version 8, with migrations for earlier versions. This is a solo testing interface; selecting players is not a secure hot-seat handoff.

## Project structure

- `RULES.md`: current rules, balance and implementation status.
- `src/data.ts`: cities, card definitions, character decks and configurable balance values.
- `src/engine.ts`: typed game state, rules, combat and save validation/migration.
- `src/main.tsx`: responsive player interface, local storage and debug tools.
- `src/style.css`: interface styling.
- `src/*.test.ts`: automated rule tests and scenario examples.

Documentation records the current implementation without making unresolved design decisions permanent. AI opponents remain outside the prototype.

## November 2026 gameplay update

- Every Ally deployment adds 2 Darkness. Any removal subtracts 1. Wraith movement preserves the score. Hunter exhaustion still adds 1 permanent Darkness.
- Seven spaces of Vampire Maturation award 3 permanent Darkness. Each full Day/Night cycle advances the track, as do Blood Rites, Blood Offering, and Midnight Ritual. The market contains 46 cards.
- Each Hunter after the first in a starting city adds one Brush with Darkness. Eight city facilities offer Day actions that cost a card and share a once-per-Day limit.
- Digital and printable cards use separate timing lines, centered OR separators and a combat symbol. The existing Gothic art was adjusted for print and three illustrations were added. The compact [print kit](output/pdf/The%20Night%20Hunt%20-%20Tabletop%20Print%20Kit.pdf) is served at /print-kit.pdf.

### Saved games

Version 8 keeps the calendar and the existing Darkness total. It banks previously earned calendar Darkness, uses elapsed days in the current week as the initial Maturation progress, and keeps one temporary point per deployed Ally. Any second point already on the scoreboard for a deployed Ally moves into permanent Darkness. Historic removed Allies receive no retroactive points. Facilities begin unused. The three new market cards enter the bottom of the reserve once. Incomplete setup applies grouped-start counts to choices already made. Active games preserve their encounter piles.

Renfield's stored reserve survives reloads. Older saves without a reserve use an empty reserve. Local saves and online rooms use the same migration. Online rooms preserve revision checks and store migrated state with the next accepted action.

### Illustrated print generation

Run the following from the checkout using Node with native TypeScript support and Python with Pillow, ReportLab and pypdf. The original Gothic Edition art directory contains the artwork manifest and originals. The new art directory contains the three new matching card PNGs. Omit the compact flag for a print-quality edition. Add the thumbnails flag to regenerate the digital illustrations.

```sh
python tools/build-print-edition.py ORIGINAL_ART NEW_ART "output/pdf/The Night Hunt - Tabletop Print Kit.pdf" --compact
```

## Two-player online playtest

Open the [hosted playtest](https://the-night-hunt-playtest.ornatehelix2.chatgpt.site/) or run one shared game server and give both players its browser URL. Select **Play online**, choose four Hunters, and select **Host as Hunters** or **Host as Dracula**. Share the invitation for the other side. The Hunter player controls all four Hunters and chooses their starting cities before Dracula chooses his. The invitation grants access to that seat. Keep it between the players.

For a test on one computer, open the invite in a second browser profile. For two devices on the same network, serve the game on the host’s network address:

```bash
npm run build
npm run preview -- --host 0.0.0.0 --port 5174
```

Open the Network URL printed by the server on the host before creating the match, so the invitation uses an address both devices can reach. Both devices use the same server. For internet play, use the hosted preview or run a multiplayer server behind HTTPS.

Hosted matches save in Sites storage. Local server matches save in `.night-hunt-matches/`. Browsers remember their seat on that host. Solo games keep their existing browser saves. The multiplayer prototype runs on one server instance.
