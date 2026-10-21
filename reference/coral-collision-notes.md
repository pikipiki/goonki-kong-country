# Coral Capers — collisions ROM vs web

## Source

Métadonnées métatuiles **Underwater** (`$E90000`), régénérées via `npm run generate:coral-terrain`. Les bandes marines 512 px (`marineBandLocal`) empilent plusieurs « étages » de sol en ROM Y.

## Problème observé (invisible)

1. **Plafonds** : `ceilingCoralWorld` trouve le premier sol au-dessus de la tête dans la colonne, parfois un corail d’un **autre étage** (web Y≈4 alors que DK nage à Y≈2,8) → blocage vertical sans mesh aligné.
2. **Sols fantômes** : `queryCoral` remontait un `floorY` **au-dessus** des pieds → le moteur poussait DK vers le haut (`p.y < floorY`).
3. **Murs horizontaux** : l’ancienne variante `blocksCoralHorizontal` comparait le torse à un `floorY` web (pas la sonde ROM `absRomFloor`), créant des murs dans l’eau libre.

## Correctifs moteur (Rev 2 web)

| Zone | Comportement |
|------|----------------|
| Nage | `blocksCoralHorizontal(..., { swim: true })` — seuil ROM ~18 px entre pieds et bord. |
| Sol | Snap seulement si `floorY <= pieds + 6 cm` ; pas de correction « vers le haut » en eau. |
| Plafond | Collision seulement si plafond **dans la couche** (`ceiling <= y + 1,12`) et **à portée** (`roofGap < 22 cm`). |

## Diagnostic

```bash
npm test -- tests/coral-collision-scan.test.ts
```

Les compteurs `phantomFloors` / `lowCeilings` restent élevés dans les tables statiques ; le moteur ne doit plus tous les traiter comme solides en nage libre.

## ROM

La résolution exacte côté SNES (état 40, `$9C`, eau vs solide) n’est pas encore rejouée — ces garde-fous alignent le **ressenti** sur l’eau libre en attendant `probe:coral` / états sous l’eau.
