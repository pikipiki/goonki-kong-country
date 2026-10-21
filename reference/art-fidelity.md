# Fidélité visuelle — passe du 21 octobre 2026

Cette passe rapproche les décors de la composition sombre et dense du Donkey Kong Country SNES original tout en conservant de vrais volumes 3D. Elle ne revendique pas une reconstruction exacte des modèles SGI ni des niveaux originaux.

## Références consultées

- Manuel original fourni par Nintendo : https://www.nintendo.com/es-es/games/oms/snes-classic/manuals/dk-country/manual.pdf — source primaire pour l'univers, l'écran de jeu et les compagnons animaux. Le PDF a été lu ; l'outil de capture des pages a échoué.
- Capture originale SNES Jungle Hijinxs : https://www.mariowiki.com/File:Jungle_Hijinxs_SNES.png — référence de composition et de palette, aucune image intégrée dans les assets livrés.
- Index de captures SNES : https://www.mobygames.com/game/5199/donkey-kong-country/screenshots/ — Coral Capers et grottes repérés dans l'index ; les pages individuelles ont renvoyé une erreur 403. Leur contenu n'est donc pas une preuve visuelle exploitée pour une correspondance exacte.

## Changements dans src/game3d/World.tsx

- Jungle : sous-bois en deux plans, nouvelles fougères à folioles fines, troncs élargis et racines en contreforts. Les éléments supplémentaires restent derrière la zone jouable pour garder les obstacles lisibles.
- Lagon : profondeur bleu pétrole, coraux roses/ocre ramifiés en vraie géométrie, éventails et algues entre rochers. Les anciens faisceaux de cylindres en forme de trépieds sont remplacés par un corail à ramifications.
- Mines/temple : colonnes de roche imbriquées derrière les rails, strates et profondeur sombre.
- Sol : rebord moussu irrégulier plutôt que perles sphériques, pierres de tailles/orientations variées. Matériaux et textures procédurales existants conservés.
- Lumière : clé chaude latérale, remplissage plus froid et fond profond ; ambiance sous-marine distincte.
- Performance : végétation et coraux instanciés par chunk, visibilité distante conservée. La grande feuille passe de 216 à 96 triangles et les cylindres de cinq à deux segments verticaux, afin de financer la densité supplémentaire.

## Vérification

- TypeScript et compilation Vite réussis après les derniers changements.
- Captures Chrome headless réelles, 1280 × 720 : `work/faithful-jungle.png`, `work/faithful-lagoon.png`, `work/faithful-mine.png` dans l'espace de travail Codex. Aucun événement pageerror observé.
- Échantillon final intégré (incluant les autres changements de l'équipe) : 53 FPS, DPR adaptatif 1, 183 appels de dessin, 157 072 triangles. Mesure d'une scène Chrome émulée, pas une garantie sur téléphone.
- Aucun changement de géométrie de collision, moteur, caméra, commandes ou personnage dans cette passe.

## Limites et suite prioritaire

La géométrie reste stylisée et plusieurs éléments restent plus anguleux que les rendus pré-calculés originaux. Les lieux, perspectives et placements ne reproduisent pas encore le tracé original. Une comparaison capturée dans un émulateur du ROM Rev 2 fourni, avec cadrages et palettes par niveau, serait nécessaire pour mesurer et continuer la fidélité précisément. Contrôler les nouveaux feuillages, contrastes et FPS sur un vrai appareil iOS/Android en portrait et paysage avant d'augmenter encore la densité.
