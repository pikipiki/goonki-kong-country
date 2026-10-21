> Mise à jour prioritaire du 21 octobre 2026 : les anciens repères et noms ci-dessous peuvent être obsolètes. Lire `decor-import-fixes.md` et le haut de `CLAUDE_HANDOFF.md` : pointeurs d’attributs explicites, Canyon Jungle, Minecart Madness Walkway et véritable carte marine à échelle uniforme.

# Reverb Cave — métadonnées Rev 2

Entrée `$17` (23), checkpoint `$19` (25), `levelId` **6**, **120** placements, **43** formations bananes. Musique : vérifier le dispatcher (l’extracteur peut encore lire `DKIslandSwing` sur cette entrée — à corriger).

## Coordonnées

- Bande d’objets SNES : **X ∈ [25472, 36112]** (sortie `ExitDoor` @ 36112, Y=255).
- Origine web : `ORIGINAL_REVERB_ORIGIN = { x: 25472, y: 175 }` → monde **x=0** au début de la bande jouable.
- **Départ** : `start.y` = sol sondé à x=0 (ROM y≈119, monde ≈ **-1.75**) — voir `reference/reverb-start.json`. Marche plate type jungle à `flatWalkWorldX`≈5.5 (ROM y=175).
- Biome visuel `mine` mais **pas** de mode wagon (`originalTerrain: "cave"` désactive `cart`).
- Formations bananes : X souvent **< 25472** dans le JSON ; le générateur ajoute `ROM_WORLD_X` quand `x < ROM_WORLD_X/2`.

## Pipeline

```bash
npm run analyze:levels
npm run generate:cave-terrain
npm run generate:reverb
```

Fichiers : `originalCaveTerrain.ts` (1136 colonnes `$DA0000`), `originalReverb.ts`.

## Jeu

- Jeu : carte étape **1** avec `originalRoute` (`game.start(1, true)`), ou dev `/?play=reverb`.
- Physique : même sonde que la jungle (`originalCaveTerrain.ts`), sans rebord fosse x≈454.

## Limites

- Canons / plateformes mobiles : beaucoup d’omissions (scripts partiels).
- Murs bonus : `ram1375` présents dans le ROM mais pas relinkés (`jungle-bonus-walls` absent pour la grotte).
- Parité sol : pas de capture `reverb-walk.state` ni tests de marche.
