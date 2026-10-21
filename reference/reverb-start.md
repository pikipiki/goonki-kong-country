# Reverb Cave — origine monde et départ

Source : `scripts/reverb_start_floor.py` → `reference/reverb-start.json`, régénéré par `python3 scripts/generate_original_reverb.py`.

| Champ | Valeur | Signification |
| --- | --- | --- |
| `romWorldX` | 25472 | Premier pixel SNES de la bande jouable importée |
| `yAnchor` | 175 | Ancre Y ROM → monde `y = (romY - 175) / 32` |
| **Monde x=0** | aligné sur 25472 | Origine web `ORIGINAL_REVERB_ORIGIN.x` |
| `startYWorld` | ≈ -1.75 | Sol sondé à x=0 (`startFloorRomY` 119), pas l’intro DK y=175 |
| `flatWalkWorldX` | ≈ 5.5 | Bande plate ROM y=175 (`flatWalkRomX` 25648) — parité marche `dk-walk` |
| `flatWalkWorldY` | 0 | Sol monde sur la bande plate |

Gameplay : `ROM_REVERB.start = { x: 0, y: startYWorld }`. La marche type jungle est validée sur la bande plate (`flatWalkWorldX`, y=0) ; l’entrée x=0 est une rampe / fosse ROM (canon sprite 56 @ 25472,320).

Moteur : `originalTerrain: "cave"` désactive le mode wagon (`biome: "mine"` visuel uniquement). Collision grotte : rampes sans blocage « torse » (`originalCaveTerrain.blocksHorizontalWorld`).
