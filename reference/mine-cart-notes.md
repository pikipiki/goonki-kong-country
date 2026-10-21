# Mine Cart Carnage — extraction ROM (début portage)

Régénérer : `python3 scripts/analyze_level_tables.py` → `reference/level-tables.json`.

| Clé JSON | entranceId | levelId | Placements | Musique |
| --- | ---: | ---: | ---: | --- |
| `MineCartCarnage` | 39 (`0x27`) | 25 | 79 | MineCartMadness |
| `MineCartCheckpoint` | 59 (`0x3b`) | 25 | 79 (même liste) | MineCartMadness |

Environnement collision : **MineCartCarnage** (id 9), données `$E60D88`, **78** classes de tuiles. Export JSON : `mineCartMetatiles`, `mineCartCollisionAttributePairs`, `mineCartCollisionSurfaceSamples` (même méthode que grotte/jungle).

**Web** : `npm run generate:mine-cart-terrain` → `originalMineCartTerrain.ts` ; `npm run generate:mine-cart` → `ROM_MINE_CART` + `reference/mine-cart-start.json`. Route carte étape **2** avec `game.start(2, true)` ; dev `/?play=minecart`. `originalTerrain: "mineCart"` active le wagon (`vx` fixe prototype) et la collision rails ROM.

Départ : monde **x=0** = SNES **293**, `start.y` ≈ **0,125** (rail ROM y=179). Sortie @ SNES 14820 → `finishZone`.

Prototype `LEVELS[2]` inchangé sans `originalRoute`.
