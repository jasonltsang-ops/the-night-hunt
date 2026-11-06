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

Enable Debug mode to inspect hidden information and construct test situations. The prototype supports personal decks, a shared market, Hunter travel and investigations, hidden Dracula swaps, encounters, a seven-day calendar, weekly/Ally Darkness and Dracula victory, combat, recovery, equipment, consumable Items, four distinct location Allies, equipped counters that can be trashed to remove them, permanent city closure, and selected character abilities. Some cards remain placeholders; consult the rules reference before testing an effect.

Each action autosaves in the browser. Export JSON before resetting if you want an independent snapshot. Saves contain hidden information and use schema version 7, with migrations for earlier versions. This is a solo testing interface; selecting players is not a secure hot-seat handoff.

## Project structure

- `RULES.md`: current rules, balance and implementation status.
- `src/data.ts`: cities, card definitions, character decks and configurable balance values.
- `src/engine.ts`: typed game state, rules, combat and save validation/migration.
- `src/main.tsx`: responsive player interface, local storage and debug tools.
- `src/style.css`: interface styling.
- `src/*.test.ts`: automated rule tests and scenario examples.

Documentation records the current implementation without making unresolved design decisions permanent. No AI opponents or multiplayer networking are implemented.

## Ally update

The market now has 31 Hunter and 11 Dracula cards: Smelling Salts and Renfield were added. Great Wolf replaces the Wolf Pack name; Wraith replaces Dark Familiar. See RULES.md for each persistent benefit and counter.

Hunters reveal Allies by being at their city. Use the equipped counter’s “Trash … to remove …” button to spend the standard Day/Night action. Wraith shares with one other Ally and resolves its mandatory movement/private bottom-card choice before Dracula’s Night action. Renfield adds an encounter to his own city each Night. A city emptied of encounters closes permanently, removes its Allies and cannot receive more encounters.

Version 7 saves preserve pending Wraith choices. Older saves migrate their Ally slots and empty cities, and add the two new cards to the market reserve once. They do not replay beginning-of-Night effects. JSON snapshots still contain hidden information.
