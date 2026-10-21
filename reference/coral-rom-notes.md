# Coral Capers — notes ROM Rev 2

## Sortie

`UnderwaterExitDoor` (sprite **107**), spawn cmd **2** @ **x=2024**, **y=19488** (`level-tables.json`). Zone de fin web : `finishZone` dans `ROM_CORAL` (généré par `npm run generate:coral`).

## Profondeur

Les spawns utilisent **Y ROM 17960–19632** mappés linéairement en web **5,5 (surface) → 0,5 (fond)**. Collision : `originalCoralTerrain.ts` + bandes marines 512 px.

## Nage DK

Constantes : `reference/underwater-motion.json` — vitesse horizontale **vxRaw 512**. Traces **`npm run probe:coral`** → `runtime-coral-player.json` (scénarios `dk-swim-right/up/down`). Tant que `work/runtime-rom/coral/coral-swim.state` est absent, la sonde utilise **`jungle.state`** (proxy) : les vyRaw ne reflètent pas la nage sous l’eau. **`npm run generate:coral-parity`** pousse les métriques probe dans `verticalSwim.snesProbe`.

**Capture idéale :** sauver un état dans Coral Capers sous l’eau (DK, pas Enguarde) → `work/runtime-rom/coral/coral-swim.state`, puis relancer `probe:coral` + `generate:coral-parity`.

## Ennemis importés

| Sprite | Nom Yoshifanatic | Kind web | `patrolSpeed` |
|-------:|------------------|----------|---------------|
| 83 | Bitesize | croc | 2.05 |
| 84 | Chomps | croc | 1.55 |
| 85 | Chomps Jr | croc | 1.75 |
| 87 | Croctopus | croc | 1.45 |
| 97 | Clambo | bee | 1.1 |

Comportements fins (attaques, invulnérabilités) non encore rejoués depuis les scripts ROM.

## Commandes

```bash
npm run probe:coral
npm run generate:coral-parity
npm run generate:coral
npm run generate:coral-terrain
```
