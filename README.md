# Goonk Country

A mobile platform game starring Rose and Violet, with a shared TypeScript
simulation, Three.js rendering and Canvas 2D scenes. Portrait, landscape,
keyboard, gamepad, touch and click controls are supported.

The 2D demo includes Jungle Hijinxs and the final ship boss. The island map opens
all seven stages; its confirmation panel offers 2D for the two supported scenes
and 3D for the full route. English is the default language.

## Run locally

Use Node **22.12+** (CI uses Node 24).

```sh
npm ci
npm run dev
```

Open <http://127.0.0.1:5174>. The development server also accepts LAN connections
for testing on a phone. `npm run build` produces `dist/`; `npm run preview` serves
that build. For GitHub Pages, use `npm run preview:pages`.

```sh
npm run format && npx eslint . --max-warnings 0 && npx vitest run && npm run test:e2e
npm run test:production
npm run test:functional
```

The production check owns its preview server on port 5191 and verifies the real
build in both mobile orientations, including its Content Security Policy.
Functional tests reuse a reachable development server or start and close their
own. They never close an existing user server. The three complete playthroughs
use real keyboard input and keep damage enabled.

```sh
# Run just the mobile and mechanics checks on an isolated development server:
FUNCTIONAL_PORT=5184 npm run test:functional -- test:mobile test:mechanics
```

GitHub Actions runs architecture, format, ESLint, vitest, e2e, production CSP and
`npm audit` (Playwright browsers cached under `~/.cache/ms-playwright`; see
`.github/workflows/quality.yml`). Functional and playthrough scripts are local;
install browsers with `npx playwright install --with-deps chromium` when needed.
Functional scripts use Chrome on
macOS when installed, otherwise Playwright's Chromium. `BROWSER_EXECUTABLE`
selects another executable; `GAME_URL` targets an existing server. Browser
captures and logs go to `artifacts/browser/` (override with
`BROWSER_ARTIFACTS_DIR`).

## Work on the project

- [Architecture and extension guide](docs/architecture.md)
- [Contribution workflow](CONTRIBUTING.md)
- [Security scope and reporting](SECURITY.md)
- [Architecture review and validation](docs/architecture-review.md)
- [Claude handoff](CLAUDE_HANDOFF.md) / [Gemini handoff](GEMINI_HANDOFF.md)

The engine's public entry point is `src/game/engine.ts`. The stage catalog,
configuration JSON, renderers and UI have distinct responsibilities. Changes to
presentation do not require changing collision bodies or movement rules.

## Controls

Arrow keys or A/D (Q/D also supported) move; Space jumps or swims; Shift runs;
X performs an action; C swaps buddies; P/Escape pauses. The virtual pad provides
latched actions for touch combinations. Enguarde has separate quick thrusts and
charged attacks. The control labels adapt to the active mount and stage.

## ROM evidence and assets

This remains an adaptation, with documented omissions. Jungle, Barrel Cannon
Canyon, Mine Cart Madness and Coral Capers use verified source metadata; the
remaining stages use adapted layouts. A ROM file is not required to run the
checked-in game. Some graphics and audio assets were extracted from the user's
ROM; this repository cleanup does not assign a new license to those assets.

- [Deep analysis and limitations](reference/rom-deep-analysis.md)
- [Collision and spawn evidence](reference/level-tables.md)
- [Mobile design decisions](reference/mobile-design.md)
- [Reverse-engineering method](reference/reverse-engineering.md)

```sh
npm run verify:rom
npm run generate:terrain
npm run generate:cave-terrain
npm run generate:mine-cart-terrain
npm run generate:plush-contour
```

Terrain generators read verified metadata and write numeric JSON. Algorithms
remain maintained TypeScript. ROM analysis commands require the user's own ROM;
see the evidence documents for the corresponding inputs and provenance.

### Repeatable full playthroughs

```sh
npm run test:playthrough:stable          # 3 runs each: Canyon, Coral, final boss
npm run test:playthrough:stable -- coral # same matrix for one stage
```

The matrix checks desktop, phone portrait and landscape, with 0/25/50 ms
controller delays. It also checks the boss in 2D and 3D. Each run owns its server
and browser, uses real keyboard events and normal damage, and checks the live
physics against an isolated engine copy. Failure is returned as a nonzero exit
code; no automatic retries or disabled enemies are used. Full logs, input traces,
state snapshots and captures are retained separately under `artifacts/browser/`.

The default scenarios replay reviewed inputs from `tests/fixtures/playthrough/`.
See [the stability report](docs/playthrough-stability.md) to inspect the fixes,
understand browser clock control, and regenerate a scenario after an intentional
gameplay change. `PLAYTHROUGH_REPLAN=1` explicitly enables the exploratory pilot;
it never silently replaces a failing recorded scenario.
