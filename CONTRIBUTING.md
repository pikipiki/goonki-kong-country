# Contributing

Start with [the architecture guide](docs/architecture.md). Use `npm ci` with the
checked-in lockfile. Create a focused branch and keep unrelated art, gameplay
and tooling changes in separate commits when possible.

## Choose the owner of a change

| Work                              | Primary location                                | Verification                                  |
| --------------------------------- | ----------------------------------------------- | --------------------------------------------- |
| Physics, damage, items, mounts    | `src/game/engine/`                              | Engine tests; mechanics/browser check         |
| Stage placements and route safety | `src/game/`, `src/game/data/`                   | Route/collision tests; relevant playthrough   |
| 3D models and scenery             | `src/game3d/`                                   | Mobile, ground and visual browser checks      |
| 2D sprites, camera and effects    | `src/game2d/`                                   | Rendering regressions; production check       |
| Map, menus and input              | `src/app/`, `src/islandMap/`, `src/components/` | E2E; both phone orientations                  |
| Reproduction tools                | `scripts/`                                      | Run the changed generator or browser scenario |

These are responsibility boundaries, not assignments to particular people.
Work in parallel within them and coordinate changes to shared contracts first.

## Keep code approachable

Prefer direct control flow and descriptive units in names. Keep related helpers
in one cohesive module; avoid creating a separate file for every conditional.
Keep the engine free of React, Three.js and renderer imports; ESLint enforces
that direct dependency boundary. The public engine facade stays stable.

Use the existing `Input`, `Level`, `Enemy`, `Save` and animal contracts. A renderer
observes the simulation; it does not implement a second set of movement rules.
Tests should describe observable behavior and use `tests/helpers/simulation.ts`
for fixed-step execution. Mark deliberately incomplete Web API test doubles at
the boundary rather than weakening application types.

Put adjustable policies in the configuration described in the architecture
guide. Keep ROM facts in their evidence files. Mesh coordinates and authored
stage placements may remain local where their shape is easier to understand;
avoid replacing them with hundreds of unexplained global constants.

Files are limited to 300 meaningful lines and functions to 80. Refactor by
responsibility before adding exceptions. Generated ROM placement modules have
an existing exception; numeric terrain matrices now live in JSON instead.

## Before submitting

```sh
npm run format && npx eslint . --max-warnings 0 && npx vitest run && npm run test:e2e
npm run test:production
```

For a collision or movement change, run the corresponding functional scenario;
run `npm run test:functional` for the full regression suite. Include portrait and
landscape evidence for a visible mobile change. Do not disable damage to claim
a successful full playthrough.

A pull request should explain the trigger, resulting behavior and validation.
Report any remaining limitation precisely. Do not publish extracted assets or
change their licensing as part of an unrelated code change.
