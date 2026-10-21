# Projets voisins — Donkey Kong Country

Cartographie (oct. 2026) des efforts publics proches de **Goonk Country** : port navigateur, clone, ou fidélité ROM. Aucun ne combine **React Three Fiber + preuves ROM Rev 2 + audio capturé + personnages originaux**.

## Comparatif rapide

| Projet | Stack | Fidélité ROM | Jouable sans ROM | Statut |
|--------|--------|--------------|------------------|--------|
| **[Goonk Country](..)** (ce dépôt) | React 19, TS, Vite, R3F, Three.js | Partielle (terrain/placements/audio/oracles Jungle + Coral) | Oui | Actif |
| **[Donkey Kong Kiro](https://github.com/dkljajo/donkey-kong-kiro)** | Canvas 2D, vanilla JS | Inspiré seulement (SFX « 8-bit », pas la ROM) | Oui | Récent (2026) |
| **DKC Web Engine** (udivision / rpgmaker.net) | Construct 2 | Tilemaps « style DKC », physique retouchée | Oui | Abandonné ~2014–2018 |
| **Remake HTML5 ribis** ([DKC Atlas](http://www.dkc-atlas.com/forum/viewtopic.php?f=26&t=2136)) | Construct 2 | Visuels proches, niveau unique | Démo forum | Abandonné ~2015 |
| **[OpenDKC](https://github.com/caioaletroca/OpenDKC)** | Unity | Assets DKC (droits incertains), niveau court | Oui (build Unity) | Apprentissage, peu actif |
| **[DKC1Recomp](https://github.com/elliotttate/DKC1Recomp)** | C++ natif (snesrecomp) | **Quasi jeu entier** (code cartouche → PC) | **Non** — ROM USA 1.0 requise | Bêta jouable (Win/macOS) |
| **[DKC1 Disassembly](https://github.com/Yoshifanatic1/Donkey-Kong-Country-1-Disassembly)** | Asar / 65C816 | Rebuild ROM **USA 1.0** (MD5 `30c5f292…`) | ROM 1.0 pour rebuild | Référence GPL-3 ; **pas** notre Rev 2 — voir `disassembly-rev2.md` |
| **[DKC-Widescreen](https://github.com/elliotttate/DKC-Widescreen-358x224)** | Patch ROM + mods émulateur | Présentation élargie | ROM + émulateur | Outil niche |
| **bogaa/Donkey-Kong-Country-Practice** | Patch Asar + debug | Menu debug / vol | ROM 1.0 | Outil de pratique |

## Deux familles de « port »

### A — Clone / moteur web (comme Kiro, DKC Web)

- **Idée :** recréer les *mécaniques* et un *look* rétro sans décoder la cartouche.
- **Avantages :** léger, déployable (GitHub Pages), pas de ROM, IP propre possible (Goonk).
- **Limites :** pas de collision/musique/placements garantis frame par frame ; souvent abandonné une fois la démo faite.

**Goonk Country est déjà au-dessus de cette famille** sur : métatuiles Jungle/Coral, 119 SFX + 27 musiques capturés, tests oracle (`runtime-player-analysis.json`, `jungle-parity-walk.json`), générateurs Python depuis `level-tables.json`.

### B — Recompilation / désassemblage (comme DKC1Recomp)

- **Idée :** exécuter (ou régénérer) le **programme SNES** avec la **ROM** de l’utilisateur.
- **Avantages :** fidélité gameplay/levels la plus haute possible sans tout réécrire.
- **Limites :** application **desktop**, pas navigateur ; légalité = ROM possédée ; assets graphiques toujours dans la ROM ; Rev 2 vs 1.0 (ce dépôt cible **USA Rev 2**).

**Ce n’est pas réaliste de « refaire pareil » en copiant DKC1Recomp dans le navigateur** : le jeu généré fait des centaines de Mo de C++, pas un bundle Vite raisonnable.

## Que « refaire pareil » veut dire pour Goonk Country

Recommandation : **ne pas** basculer en clone Canvas 2D type Kiro (régression sur la route ROM). **S’inspirer** des bonnes idées web et **emprunter les méthodes** de la famille B sans devenir un recomp.

| Emprunt possible | Source | Déjà chez nous ? |
|------------------|--------|------------------|
| Rejeu d’entrées frame par frame | DKC1Recomp validator | Partiel (`jungle-parity`, `runtime-player.test`) |
| Constantes / tables depuis désassemblage | Yoshifanatic1 + IDA | Partiel (`player-states`, `rom-analysis`) |
| 5 niveaux « complets » jouables | Kiro | 7 étapes dont 2 ROM + 5 créées |
| Scanlines CRT optionnelles | Kiro | Non |
| Progression / scores locaux | Kiro | Oui (`localStorage`) |
| Manette | Kiro | Oui (`Controls.gamepad`) |

## Pistes si l’objectif est « comme DKC1Recomp mais en ligne »

1. **Hybride (recommandé, actuel)** : moteur web + données ROM prouvées (terrain, spawns, audio, oracles) + DA originale Goonk — *Goonk Country*.
2. **Lien optionnel** : page « Ouvrir avec ROM » qui **documente** DKC1Recomp pour les joueurs qui veulent le jeu Nintendo intégral sur PC (sans intégrer la ROM dans ce site).
3. **WASM long terme** : porter un sous-ensemble du moteur Rare via recomp **n’est pas** un projet du week-end ; la communauté n’a pas de DKC1Recomp-Web public mature en 2026.

## Références utiles communauté

- [DKC Atlas](https://www.dkc-atlas.com/) — niveaux, entités, forum fangames.
- [PlayPorted — DKC1Recomp](https://playported.com/ports/139-donkey-kong-country/) — fiche port PC.
- [Donkey Kong Kiro — article AWS Builder](https://builder.aws.com/content/386ipRrP09atppHieZdndohFHuU/donkey-kong-country-web-edition-bringing-retro-platformers-to-the-browser) — présentation du clone Canvas 2026.

## Conclusion

**Aucun projet public ne fait la même chose que Goonk Country** (3D web + ROM Rev 2 instrumentée + héros originaux). Le plus proche en **esprit navigateur** est **Donkey Kong Kiro** (plus simple, moins fidèle). Le plus proche en **fidélité** est **DKC1Recomp** (natif, ROM obligatoire). La suite logique de ce dépôt reste la piste **A enrichie par B** (plus de traces, plus de niveaux générés, pas un pivot vers un clone 2D).
