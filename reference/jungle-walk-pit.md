# Jungle — fosse / rebord x≈454 (SNES)

## Ce que dit la ROM statique

Les métatuiles et `probeSNES` / `originalTerrain.query` signalent un sol à **y=175** pour **x=448…462** (tuile 78, classe 197). Les échantillons `surfaceSamples` dans `level-tables.json` sont cohérents.

## Ce que dit l’émulateur (dk-walk-terrain)

Depuis `ground.state`, maintien **Right** :

| Phase | Frames | x (px) | y | `groundDistance` | État joueur |
|------:|-------:|-------:|--:|-----------------:|------------:|
| Marche plate | 1–155 | 156→452 | 175 | 0 | 0 |
| Blocage mur | 156–199 | 454 | 175 | 0 | **17** (vyRaw positif, toujours « au sol ») |
| Chute | ≥200 | ↓ | ↑ | &lt;0 | **11** |

Le joueur ne dépasse pas **x=454** avant la chute. La chute n’est **pas** expliquée par une fin de métatuile dans nos tables : c’est collision **objet / état** (RAM `$9C`, plateformes dynamiques ou drapeaux de classe non reproduits dans `profileFlags` seuls).

## Impact web

- Parité **position** : testée jusqu’à la frame **155** (`jungle-parity-walk.json` → `dynamicParity`).
- Rebord moteur (`engine.ts`, `jungle-omitted-spawns.json` → `runtimePit`) : sur la passerelle haute (`y ≤ 0,55`), maintien **Right** près de **x=14,1875** bloque ~**44** frames puis désactive le snap au sol plat (chute). Les tables statiques gardent **y=175** sur les tuiles lip mais **pas** de second sol probe sous la fosse (`tests/pit-terrain.probe.test.ts`). Spawns **cmd 5/8** dans `jungle-omitted-spawns.json` — **pas** au rebord (x=3136 / 4992).
- Necky (x=2560) : `npm run attempt:necky-bridge` (auto, meilleur x≈454) ; capture fiable = save state (`jungle-necky-probe.md`, `pit-best-attempt.state`).
- Piste : rejouer les scripts des spawns **cmd 5/8** omis, ou affiner les classes **197** vs **133** depuis la désassemblage Rev 2 relocalisée.

## Commandes

```bash
npm run generate:jungle-parity   # régénère dynamicParity + runtimePit
npm test -- tests/jungle-parity.test.ts
```
