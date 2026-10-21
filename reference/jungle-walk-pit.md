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
- Au-delà : le moteur laisse DK marcher sur le sol statique ; Necky (x=2560) reste inaccessible sans save state (`jungle-necky-probe.md`).
- Piste : rejouer les scripts des spawns **cmd 5/8** omis, ou affiner les classes **197** vs **133** depuis la désassemblage Rev 2 relocalisée.

## Commandes

```bash
npm run generate:jungle-parity   # régénère dynamicParity + runtimePit
npm test -- tests/jungle-parity.test.ts
```
