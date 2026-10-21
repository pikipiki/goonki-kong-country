# Validation0.4 — analyse runtime, terrain et audio

- TypeScript et58tests dans7fichiers : réussis dans le staging intégré.
- Cinq producteurs d’analyse statique réexécutés ; audit de55observations explicites bytes réussi, aucun rapport manquant.
- Audio :27M4A décodés complètement,119WAV comparés à leurs capturesPCM,146SHA vérifiées ; provenance et limites dans audio-runtime-capture.json.
- `test:original` réussi : Jungleoriginal, KONG4, déplacement, lecture musique/effets, AquaticAmbience, pause/reprise et2formats, aucune erreur.
- `test:mobile` et `test:browser` réussis après adaptation de l’attente d’arrêt à l’inertie originale ; aucune erreur,6formats et7transitions.
- Échantillon mobile :57FPS,148appels,117070triangles,DPR1,35. Pas une mesure sur téléphone physique.
- Pas de partie complète, ni de parité exhaustive. La validation de copie finale est ajoutée à la fin de cette passe.

---

# Validation 0.3.1 — carte et tonneaux

- TypeScript et build Vite réussis dans le dépôt final.
- **44 tests unitaires, cinq fichiers : tous réussis.** Quatre nouveaux tests sur maintien du vol canon, entrée dans un autre canon, oscillation de la direction, auto-départ et roulage au sol des tonneaux lancés.
- `npm run test:map` : canvas 3D, sélection d’étape, verrouillage et entrée dans le niveau choisi, portrait/paysage ; aucune erreur. Les déblocages sont préparés pour tester plusieurs nœuds ; ce n’est pas une partie complète.
- `npm run test:browser` et `npm run test:mobile` : réussis après correction d’une lecture d’angle sur un canon de l’ancienne scène lors d’un changement de niveau. Six formats, sept transitions, multi-touch, mode clic, pause et rotation ; aucune erreur.
- Captures `island-map-landscape.png` et `island-map-portrait.png` : la carte 3D représente les sept étapes de l’adaptation, pas la carte originale exacte. Capture paysage inspectée.
- Aucun audio original extrait ou validé dans cette passe. Aucun téléphone physique testé. Périmètre restant dans `world-barrels-audio.md`.

---

# Validation de la version 0.3 — 21 octobre 2026

- **Dépôt final autonome** : TypeScript et build Vite réussis ; **40 tests, quatre fichiers**, tous réussis.
- `test:buddies` contre le build final : libération et montée depuis une entrée contrôlée près de la caisse, quatre montures, quatre descentes par le bouton, nage verticale et attaque d’Enguarde ; aucune erreur JavaScript/console. Captures des quatre montures en paysage et de Rambi/Enguarde en portrait. Les états initiaux sont préparés, les gestes de montée/descente utilisent les commandes.
- `test:mobile` : multi-touch, clic, rotation, pause, six formats et sept transitions de scène réussis ; aucune erreur. Échantillon final : 60 FPS, 109 appels, 63 712 triangles, DPR 1,35 (scène ponctuelle, pas une garantie mobile).
- `test:browser` réussi : saut, changement, déplacement et six autres scènes ; aucune erreur JavaScript/console.
- Les onze nouveaux tests unitaires couvrent caisse/montée, constantes ROM, descente même avec une seule peluche, fuite après choc sans perte immédiate de peluche, corne de Rambi, hauteur Winky, flutter Expresso, direction/attaque Enguarde et saut hors rebord/chaîne de roulade.
- `scripts/analyze_buddies.py` : **14 signatures Rev 2 vérifiées** dans la ROM fournie en lecture seule, avec séquences d’octets et limites dans `buddy-analysis.json`.
- Captures inspectées : Rambi monté, Enguarde monté, jungle/lagon/grotte. La scène de montage utilise les vrais modèles, sans rasterisation de personnages.

Les limites restent les mêmes : pas de téléphone physique, pas de session humaine complète de toutes les étapes, pas d’exécution SNES ni de parité image par image. Lire `fidelity-roadmap.md`, `buddy-analysis.md` et `art-fidelity.md` avant de conclure à une fidélité complète. Les chiffres graphiques varient selon la scène ; la capture jungle intégrée de la passe DA donnait 183 appels et 157 072 triangles, avec DPR adaptatif 1.

---

## Rapport historique de la version 0.2

# Validation de la version mobile 0.2 — 21 octobre 2026

- `npm run build` : TypeScript et compilation Vite réussis dans le dépôt autonome.
- `npm test` : **29 tests réussis** dans trois fichiers.
- `npm run test:browser` : saut, changement de peluche, déplacement par boutons, rendu des six autres étapes ; aucune erreur JavaScript ou console.
- `npm run test:mobile` contre **la version compilée via son adresse réseau local** : événements tactiles simultanés (direction + saut), relâchement sans déplacement bloqué, mode clic seul, bouton d’arrêt, saut au clic, pause/reprise, rotation en cours de partie et sept transitions de scène réussis.
- Formats émulés : 390 × 844, 844 × 390, 320 × 568, 430 × 932, 932 × 430 et 768 × 1024. Vérification de l’absence de débordement et de la présence des boutons dans le viewport.
- Les boutons d’action et de direction atteignent au moins 44 × 44 px CSS dans le contrôle portrait. Les zones de jeu et de commandes ne se recouvrent pas.
- Budget graphique contrôlé : moins de 300 appels de rendu dans le scénario ; pixel ratio maximal de 1,35. Dernier échantillon du test : 109 appels, 64 192 triangles, DPR 1,35. L’échantillon ne représente pas toutes les scènes ni les performances d’un téléphone physique.
- Les tests unitaires couvrent aussi le cadrage mobile, les sources tactiles indépendantes, le volume de la banane et les collisions des nouveaux modèles, en plus de la physique, de la progression et de la traversabilité des plateformes existantes.

## Captures

`mobile-title.png`, `mobile-portrait.png`, `mobile-landscape.png`, `mobile-title-landscape.png`, `title-desktop.png`, `stage-*.png` et `bestiary-3d.png` montrent le résultat. Le bestiaire est une mise en place de contrôle utilisant les vrais maillages du jeu ; son alignement et ses légendes sont propres à cette capture.

## Limites de la vérification

Chrome sur le poste de développement avec émulation tactile, et non un téléphone physique. iOS Safari, les encoches matérielles et plusieurs appareils Android restent à vérifier sur appareil. Les tests de scènes préparent les états directement ; ils ne constituent pas une partie complète jouée à la main. La rétro-ingénierie SNES conserve les limites documentées dans `reverse-engineering.md`.

Version locale : http://127.0.0.1:5174/?v=mobile-2
Version réseau local : http://192.168.1.164:5174/ (téléphone sur le même Wi-Fi).
