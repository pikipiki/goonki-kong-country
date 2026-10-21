# Capture SNES — NutThrowingNecky (Jungle Hijinxs)

## Blocage actuel

Depuis `ground.state` (DK idle, x=156), une marche droite atteint **x≈454** puis la fosse (vy positif, `groundDistance` négatif). Le Necky ROM est à **x=2560**. Aucune séquence simple saut+droite testée ne franchit la fosse sans **save state** intermédiaire.

## Preuves déjà dans le dépôt

| Fichier | Contenu |
|---------|---------|
| `necky-ballistics.json` | Template noix vx **−300** / vy **768**, gravité **−112**, table `DATA_B68EE0` @ `0x368EE2` |
| `necky-runtime-capture.json` | `nutEvents: []` + limitations |
| `level-tables.json` | Spawn sprite **14** @ (2560, 240), `$13E9=36578` |

## Prochaine capture (quand un état existe)

1. Créer ou obtenir un `.state` Snes9x avec DK **après la fosse**, idéalement x∈[2520, 2620].
2. Placer sous `work/runtime-rom/jungle-necky/necky-approach.state` (hors commit ROM).
3. Lancer :

```bash
npm run probe:jungle
```

4. Étendre `probe_jungle_extensions.py` pour charger ce state dans `run_necky_watch` (argument `--necky-state`).

## Critères nut valides

- `spriteId == 16` (NeckyNut)
- Coordonnées x∈(0, 5500), y∈(0, 512)
- `|vxRaw|+|vyRaw| > 0`
- Joueur x ≥ 2400
