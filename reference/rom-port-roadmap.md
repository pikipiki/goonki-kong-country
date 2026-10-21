# Portage ROM USA Rev 2 — état et ordre

SHA-256 : `628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527`. Extraction : `npm run analyze:levels` → `reference/level-tables.json`.

## Niveaux dans `level-tables.json` (passe actuelle)

| Clé JSON | levelId ROM | Placements | Web |
|----------|------------:|-----------:|-----|
| JungleHijinxs | 0 | 66 | `ROM_JUNGLE`, route originale étape **0** |
| ReverbCave | 6 | 120 | `ROM_REVERB`, carte étape **1** + `/?play=reverb` |
| CoralCapers | 97 | 41 | `ROM_CORAL`, route originale étape **3** |
| MineCartCarnage | 25 | 79 | `ROM_MINE_CART`, carte étape **2** + `/?play=minecart` |

Checkpoints (même listes que le niveau principal) : `JungleCheckpoint`, `CoralCheckpoint`.

## Pipeline par couche

1. **Tables** — `analyze_level_tables.py` (signatures Rev 2, pas adresses V1 seules).
2. **Terrain** — Jungle : `generate:terrain` → `originalTerrain.ts`. Grotte : `generate:cave-terrain` → `originalCaveTerrain.ts` (`$DA0000`, 154 classes collision). Coral : `generate:coral-terrain` → `originalCoralTerrain.ts` (bandes 512 px, `$E90000`).
3. **Placements** — `generate:jungle` / `generate:reverb` / `generate:coral` → `originalJungle.ts` / `originalReverb.ts` / `originalCoral.ts`.
4. **Moteur** — `engine.ts` : `originalTerrain` jungle \| coral, nage lagon, `finishZone`, culling ennemis.
5. **Preuves** — `probe:jungle`, `probe:coral`, parité JSON, tests `tests/*`.

## Prochaines étapes ROM (ordre suggéré)

1. Étendre `analyze_level_tables.py` pour d’autres entrées `entranceToLevelId` (grotte `$DA0000`, etc.) — pas encore dans le JSON exporté.
2. Formations bananes : développer `bananaFormations` Jungle/Coral (`level-tables.md` § formes) → pickups `amount:1` sans duplication des régimes spawn.
3. Save states SNES : `coral-swim.state`, `necky-approach.state` → `probe:coral` / noix Necky.
4. Rebord jungle cmd **5/8** — scripts spawn ou états objet (`jungle-omitted-spawns.json`).
5. Activer une **3ᵉ route ROM** sur la carte quand terrain + générateur existent (pas de renommage des 7 étapes prototype).

## URLs dev (Vite)

- Jungle : `/?play=jungle`
- Reverb Cave : `/?play=reverb`
- Mine Cart : `/?play=minecart`
- Coral : `/?play=coral&x=20&y=3.2` (profondeur `depth=start|mid|shallow|deep`)

## Docs liées

- `coral-collision-notes.md`, `coral-rom-notes.md`, `jungle-walk-pit.md`, `level-tables.md`, `fidelity-roadmap.md`
