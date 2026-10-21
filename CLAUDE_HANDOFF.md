# État prioritaire de reprise — 0.4.0 (22 octobre 2026)

Cette section prévaut sur l’historique ci-dessous. Dépôt : `Documents/git/goonk-country`. Handoff avant commit : `.cursor/skills/handoff-before-commit/SKILL.md`.

**Dernier commit** : Enguarde — attaque rapide répétable (bouton ➜, annule charge forte) + script `enguarde-quick-browser.mjs`. Commit précédent (22 oct.) : Canyon 50 canons, bonus fermés, tactile/charges, canons 3D, HMR, `canyonTerrain`, traversées. **202 tests / 34 fichiers**, `npm run build` OK.

## Enguarde : petites attaques répétables sur mobile — 22 octobre 2026

- Gros bouton droit **Attaque rapide** (flèche horizontale) distinct du bouton Charge. Chaque appui déclenche immédiatement une pointe courte de 0,32 s à vitesse 7,5, sans concentration. Bouton répétable aussi en mode clic : chaque appui recrée un front d’entrée, sans attendre l’ancienne impulsion de saut de 350 ms.
- Bouton Charge inchangé pour la préparation puis le déclenchement de la forte accélération à vitesse 18. L’attaque rapide annule le verrou écran de charge et remet la préparation/`mountCharged` à zéro avant le calcul des vitesses : aucune charge forte accidentelle sur ce relâchement. Fonctionne aussi en clavier via le saut d’Enguarde.
- Libellés et aide contextuelle EN/FR dans `GameControls.tsx` / `resources.ts`. Pas de quatrième bouton à ajouter sur petit écran. `repeatable` ne concerne que le bouton rapide d’Enguarde.
- Tests unitaires : huit attaques de suite sans concentration, vitesse immédiate dès la première frame, annulation d’une charge déjà prête. **202 tests / 34 fichiers**, build TypeScript/Vite et diff-check OK.
- `node scripts/enguarde-quick-browser.mjs` : huit vrais appuis = huit attaques courtes ; quatre cas portrait/paysage × tactile/clic. Preuves `reference/enguarde-quick-regression.json`, `enguarde-quick-*-*.png`.

## Entrée bonus condamnée après le retour — précision utilisateur, 22 octobre 2026

- L’entrée extérieure doit aussi être bouchée après avoir visité la salle. `Game.completedBonus` mémorise chaque bonus sorti, même sans trésor ramassé. `tryEnterBonus` refuse ensuite toute nouvelle entrée dans cette salle pendant ce parcours. Une perte de vie conserve cet état ; recommencer/changer le niveau le réinitialise avec les autres objets du parcours.
- `isBonusCompleted` reconnaît aussi les récompenses d’anciennes visites dans les parties déjà ouvertes avant cette mise à jour. Le marqueur est indépendant du nombre de trésors pour les nouvelles visites.
- `BonusRoom` affiche désormais des planches croisées (`completed-bonus-plug`) à la place du passage et retire la flèche BONUS. L’accès au bonus est désactivé ; le chemin principal reste praticable devant cette porte en profondeur. Les murs restent marqués cassés, donc roulade ou projectile ne réactivent pas la porte.
- Tests : retour sans récompense, tentative de réentrée, perte de vie, roulade/projection, autre salle toujours disponible et remise à zéro sur nouveau parcours. Vérification navigateur après une vraie traversée de salle et après expiration du délai : plug visible, flèche cachée, entrée refusée, en portrait et paysage.
- **Validation : 200 tests / 34 fichiers**, build TypeScript/Vite OK. `npm run test:mechanics` : 20 vérifications. Preuves `reference/mechanics-bonus-closed-*.png`, `mechanics-regression.json`.

## Bonus, commandes tactiles, animaux et direction des canons — 22 octobre 2026

- **Bonus :** à l’entrée dans la scène bonus, un obstacle solide pleine hauteur ferme le passage à gauche derrière les peluches. Planches et traverse visibles (`sealed-bonus-entrance`). La sortie à droite restitue toujours l’état du niveau et les récompenses. La fermeture concerne l’intérieur de la salle ; les murs cassés du niveau principal restent conservés.
- **Mobile, dans les deux modes de direction :** un appui enclenche la préparation de charge Rambi/Enguarde, le suivant la lance. Jauge et bouton pressé restent visibles ; les doigts sont disponibles pour sauter/diriger. Expresso : appui pour battre des ailes/planer, second appui pour replier. Indications EN/FR contextuelles et libellé du bouton changent avec l’état.
- **Tonneaux portés :** un appui écran prend le tonneau, relâcher le doigt le conserve, un second appui le lance, y compris en saut. `Input.tapAction` identifie l’action écran indépendamment du mode de direction. Clavier : maintien puis relâchement inchangés. `Controls.set` n’émet plus de faux relâchement lorsqu’une autre source tient encore la même touche.
- **Animations :** Rambi abaisse la tête, se tasse et gratte le sol pendant la préparation ; Enguarde recule/tremble et accélère queue/nageoires ; halo pulsant indique la charge. Expresso déploie davantage ses ailes avec un battement lisible de profil. Tailles des peluches conservées. Charges adaptées, pas mécanique native DKC1 revendiquée.
- **Canons :** suppression du sprite fixe ↗ qui restait orienté vers la caméra. Flèche en vraie géométrie 3D dans l’axe local +Y, bouche ouverte et cerclage de sortie distinct. `Game.cannonAngle` renvoie l’angle du vecteur discret réellement tiré : corps, flèche et tir concordent, y compris les canons oscillants. Centre du modèle canon aligné avec son ancre physique.
- **Validation : 198 tests / 34 fichiers**, TypeScript/Vite build OK. `npm run test:mechanics` : 18 vérifications en portrait/paysage (charge + saut, animations, nage, ailes, port/saut/lancer, bonus fermé et retour). `node scripts/cannon-directions-browser.mjs` : 50 canons × 2 formats, axe de chaque flèche aligné avec le tir (dot minimal 0,9999999999999998), aucun sprite directionnel. `npm run test:mobile` : six tailles, multitouch, clic, rotation, pause, sept transitions, ~59 fps, aucune erreur JS. Tests ciblés, aucune nouvelle traversée complète revendiquée.
- Preuves : `reference/mechanics-regression.json`, `mechanics-*-charging-*`, `cannon-direction-regression.json`, `cannon-direction-*.png`.

## Mur invisible dans la partie déjà ouverte — correction suivante

- Le bloc avait disparu du mesh mais React Fast Refresh conservait l'instance `Game` créée par `useState` et ses anciennes méthodes, pouvant conserver les anciennes fermetures de collisions.
- `App.tsx` synchronise maintenant le prototype de l'instance existante avec `Game.prototype` dans un effet. Aucun reset de la position, vie, progression ou objets de la partie.
- Régression `node scripts/engine-hot-update-browser.mjs` : ouvre une partie et place le joueur dans le canon 2 ; modification temporaire inoffensive du moteur, attend le vrai HMR, vérifie identité conservée + prototype renouvelé + position et canon inchangés, puis tire via Space. Résultat : x=29,0689, y=9,03125, HP2, cinq vies, aucune erreur JS. `engine.ts` restauré dans finally. Test ciblé, pas nouvelle traversée intégrale.
- Preuves : `reference/canyon-hmr-regression.json`, `canyon-live-collision-fixed.png`.

## Suppression ciblée du bloc après le tonneau — capture 23:41

- Demande utilisateur : retirer la plateforme suspendue qui bloque le tir après le premier canon horizontal du Canyon (canon index 2, x=18,75).
- `src/game/canyonTerrain.ts` retire uniquement la ligne 0 aux pixels ROM x=[26304,26368), soit monde x=[26,28), y=[9,53125,10,5]. Les données ROM brutes dans `originalCaveTerrain.ts` restent intactes. Sol en dessous conservé.
- Moteur, volumes solides, mesh et plateformes de présentation utilisent cette même adaptation. Générateur reverb modifié pour conserver son import après régénération.
- `tests/canyon-clearance.test.ts` contrôle les 64 bandes pixel, la conservation des autres cellules, l’absence de mesh/collision et le tir normal depuis le canon 2.
- Validation actuelle : **193 tests / 33 fichiers**, build TypeScript/Vite et diff-check OK. Reproduction navigateur séparée en portrait 700×963 : tir via Space, x=29,0689, y=9,03125, HP2, cinq vies, aucune erreur JS. Placement initial dans le canon pour ce test ciblé ; aucune nouvelle traversée intégrale revendiquée.
- Tests : `tests/canyon-clearance.test.ts`. Preuves traversée : `reference/canyon-playthrough.*`.

## Parcours réels au clavier — terminés (passe précédente)

- **Coral Capers : clear, zéro mort, cinq vies, HP final 1, 183,52 s.** Les 21 ennemis et les dégâts étaient actifs. Enguarde libéré puis monté ; suite à pied après perte de la monture sur contact, et seconde peluche récupérée normalement. Preuves : `reference/coral-playthrough.md`, JSON et capture.
- **Barrel Cannon Canyon : clear, zéro mort, cinq vies, HP final 2, 49,28 s.** 35 ennemis initiaux actifs, 18 encore vivants à l’arrivée. Toutes les vies du journal sont à cinq. Preuves : `reference/canyon-playthrough.md`, JSON, règles et capture. Les essais antérieurs sont conservés séparément et ne constituent pas des réussites.
- **Import critique : 50 canons, pas 36.** Les 120 enregistrements principaux contiennent six commandes5 vers des listes enfants après en-tête nul de huit octets. Ces listes ajoutent 18 acteurs : 14 canons + quatre Zingers. Décodage dans `analyze_level_tables.py`, génération dans `generate_original_reverb.py`, preuves Rev2 dans `canyon-groups-evidence.json`. Les indices directs restent stables, les enfants sont ajoutés en fin avec provenance parent/enfant. Le générateur conserve désormais les clés i18n du Canyon.
- **Physique corrigée :** déplacement des canons partagé entre rendu et collision ; capture couvrant le corps au-dessus des pieds ; `rollJumpMomentum` conserve l’élan du saut après roulade et permet le freinage. Remise à zéro au sol, mur, dégât, canon, monture et bonus. Les tailles des peluches restent **2,2 / 2,05** ; course et saut normaux inchangés.
- Le pilote lit `window.goonk`, simule des copies isolées et utilise les vraies touches, dont la pause KeyP. Aucune écriture de position, vie, invincibilité, ennemi ou horloge dans le jeu navigateur. Les pauses de préparation distinguent ce test d’une partie humaine continue. La pause remet les entrées à zéro : les touches sont envoyées après la reprise. Les règles pilotent uniquement des touches.
- **Validation : 191 tests / 32 fichiers**, TypeScript/build OK. Carte : quatre formats. Mobile : six formats, multitouch, clic, rotation, pause, sept transitions. Mécaniques : 14 contrôles dans deux orientations. Stages : sept × deux orientations, dont 35 modèles ennemis au Canyon après l’import des groupes. Les tests de charge ont rétabli le libellé accessible EN/FR de la jauge.
- Commandes : `npm run test:playthrough:canyon` et `npm run test:playthrough:coral` depuis le dépôt, serveur sur 5174. `GAME_URL`, `BROWSER_EXECUTABLE` possibles. Le serveur de la traversée était **Vite en développement** sur les sources canoniques ; build production vérifié séparément. La capture Canyon est prise à l’instant de fin avant le rafraîchissement du récapitulatif.
- **Limites :** activation native des groupes, rotations/automatismes de canons et trajectoires natives des Zingers encore partiellement adaptés ; il ne s’agit pas d’une émulation complète. Les deux traversées ne prouvent pas tous les chemins.

## i18n EN/FR

- **Langue par défaut** : `en` (`src/i18n.ts`). Catalogue **EN + FR** dans `src/i18n/resources.ts` ; clés stables dans `src/i18n/keys.ts` ; données niveau / ennemis / animaux / décor = clés, affichage via `tx()` / `t()`.
- **Sélecteur** : `LanguageSelect` dans la barre du haut ; persistance `localStorage` clé `goonk-country-lang` ; `document.documentElement.lang` synchronisé.
- **Audio** : messages d’erreur chargement via `tr(L.audio.*)`.
- **Générateurs** : labels salle bonus → clé `bonus.room` (jungle/reverb) ; regen reverb/jungle sans réintroduire du français en dur dans les TS générés Le générateur reverb conserve aussi `name`, `subtitle` et `tip` sous clés `L` (vérifié par régénération idempotente).
- **Intégration actuelle** : **191 / 32** (`npm test`), `npm run build` OK.

## Animaux, bonus, sols, carte (après `44dd570`)

- **Montures / contrôles** : charges tenues (~0,65 s) et relâchement boost (adaptation, pas DKC1 ROM — voir `buddy-controls-review.md`). Flutter Expresso maintenu ou basculé au clic ; jauge + mode clic. Taille peluches **2,2 / 2,05** conservée.
- **Bonus** : scène séparée, porte ouverte, sortie à droite ; restauration niveau, monture, pickups et murs cassés.
- **Roulade** : multiplicateurs **Rose 1,125 / Violette 1,0** (course/saut à pied inchangés).
- **Lagon** : échelle marine **×1,5** (`marineScale.ts`, `ROM_CORAL_SOURCE`, `marine-room-scale.md`) ; collision nage ~0,95 ; tests entrée→sortie.
- **Sols visibles** : canyon/wagon/jungle — culling corrigé (origine ROM), faces opaques = collision, faux socles jungle retirés ; `routeSafety.ts`, `cannonMotion.ts`, `test:ground` + captures `ground-fixed-*`.
- **Boss** : tonneaux blessent hors récupération ; sauts / phases testés.
- **Carte** : `IslandMap` / `App` revus (`map-ui-review.md`). `test:mechanics` (montures + bonus).

## Imports ROM (ne pas rétablir les anciennes approximations)

## Corrections critiques des imports : ne pas rétablir les anciennes approximations

- L’entrée **$17** était appelée « Reverb Cave », mais c’est **Barrel Cannon Canyon**, niveau $06. Ses 120 enregistrements principaux (36 canons directs, auxquels s’ajoutent désormais 14 canons de groupes) étaient superposés à la carte **Cave $DA0000**, étrangère au parcours. La routine Rev 2 sélectionne **l’environnement 0, Jungle $D90000**. L’étape 1 utilise désormais les colonnes Jungle à X=25472..36112, et porte le bon nom/biome. `ROM_REVERB`, `originalTerrain="cave"`, `originalCaveTerrain.ts` et `/?play=reverb` restent des **alias techniques de compatibilité**, pas des preuves que cette route est une grotte. `/?play=canyon` fonctionne aussi. Les données de grotte véritable sont conservées dans `level-tables.json`, mais ce parcours n’en est pas une.
- L’entrée **$27** correspond à **Minecart Madness**, pas Carnage. Elle sélectionne **Walkway $CB0000, environnement 2**, avec attributs **$F00000**. Les placements étaient confrontés au terrain Carnage $E60D88. Carte et nom corrigés ; départ du mode wagon sur le premier wagon importé **x=699, y=178** (coordonnées web x=12.6875, y=0.09375), au lieu d’un point sous les rails. `ROM_MINE_CART` et les noms de fichiers existants restent compatibles.
- Les attributs des environnements ne sont **pas des tranches concaténées après Jungle** : ils viennent de la table de pointeurs à `environmentPointers+0x70`. Ancien calcul cave/cart lisait notamment des données de sprites inutilisées. `analyze_level_tables.py` lit maintenant les vrais pointeurs.
- Coral : ancienne lecture **column-major 16 rangées avec attributs Jungle** incorrecte. Le code marin Rev 2 à **0x018187** calcule une carte **row-major, 64 tuiles / 128 octets par rangée** ; attributs **0x29C380**, 197 classes, profils marins **0x01844B** (distincts de la table horizontale). `scripts/analyze_coral_terrain.py` reproduit l’extraction en lecture seule, SHA-256 Rev 2 vérifié ; `reference/coral-terrain-v2.json` conserve les octets de preuve et les tables numériques.
- Coral conserve maintenant **32 pixels par unité sur les deux axes**, avec Y montant et origine **17952** : fini l’écrasement de ~52 unités en 5 et la superposition de trois bandes/ennemis. Sortie à y=48, limites web -0.9..53.9. Pose de nage horizontale et corps de collision de 0.95 unité pour les passages étroits. Un test explore un chemin de nage continu entrée → volume de sortie. Cela ne remplace pas une capture du vrai point d’entrée SNES, encore inféré dans cette adaptation.

Preuves : `reference/level-tables.json` → `routeEnvironmentEvidence`, `environmentData[].collisionAttributePointer`, `canyonMetatiles` et `mineCartMetatiles.environmentId`; `reference/coral-terrain-v2.json`. Le désassemblage USA 1.0 sert seulement de nomenclature ; les constantes et signatures ci-dessus sont vérifiées dans **la Rev 2 fournie**. REA ne fournit pas de désassemblage 65C816 adapté ici ; extraction ciblée Python, pas une nouvelle exécution de l’émulateur.

## Physique, visibilité et décor

- Toutes les 7 étapes accessibles depuis la carte avec sauvegarde neuve. `save.unlocked` conserve le rôle de progression pour Continuer, sans verrouiller la sélection.
- `terrainSolids.ts` : surfaces visibles, balayage murs/plafonds/sols, sol réel des tonneaux et animaux. Rebord Jungle artificiel « 44 frames puis chute » retiré : il faisait tomber dans un sol dessiné. Le rendu conserve les vrais sols de collision ; les plafonds et couches superposées ont une géométrie distincte.
- Ennemis terrestres : gravité, suivi des pentes, demi-tour aux rebords/murs. Mort prioritaire sur le clignotement. Culling sur les bornes réelles de caméra avec marge ; simulation avant affichage. `sceneRevision` remonte les acteurs à chaque chargement, même pour la même étape. Caméra verticale suit les quatre routes importées.
- Boss : rebond sûr sur la tête pendant une descente, même protégée. Perte de HP du boss seulement en récupération ; côtés/dessous restent dangereux. Saut normal depuis le pont testé.
- Décor : suppression des façades de murs en double et du plan d’eau dans les environnements terrestres. Végétation/coraux derrière le plan des personnages ; lianes moins étirées. Socle de falaise en retrait derrière la jungle et appuis des plateformes hautes. Les couches de sol jouables ne sont pas masquées pour cacher les défauts.
- Un seul propriétaire visuel des murs cassables ; disparition immédiate après destruction. Caches invisibles avant révélation ; salles bonus suivent les ensembles mutables en temps réel, sans ancien rectangle doré de repérage. Doublons de décor supprimés. Papillons avec ailes animées, au lieu de points roses statiques.
- Le wagon ne s’affiche que dans le parcours wagon. Commandes portrait en colonnes flexibles : bouton de saut dans le viewport à 320 px. Conseils de jeu débarrassés des coordonnées/adresses/notes d’extraction ROM.

## Validation et commandes

**191 tests / 32 fichiers** (`npm test`). Navigateur : `test:browser`, `test:map`, `test:mobile`, `test:stages`, `test:decor`, **`test:ground`**, **`test:mechanics`**. Docs : `bugfix-validation.md`, `decor-import-fixes.md`, `route-safety-fixes.md`.

Générateurs : `analyze:levels`, `analyze:coral-terrain`, `generate:coral-terrain`, puis `generate:jungle|canyon|mine-cart|coral` — ne pas réintroduire l’ancienne compression verticale du lagon ni les attributs cave/cart concaténés.

## Limites de reprise

- Modèles 3D adaptés ; pas de textures chip ROM. Charges montures = adaptation utilisateur, pas preuve DKC1.
- Ennemis aquatiques / oiseaux encore partiellement provisoires ; espacement abeilles wagon à affiner si signalé.
- Départs de routes et entrée SNES lagon encore partiellement inférés ; tests géométriques ≠ parcours humain complet.
- Audio : 27 M4A + 119 WAV ; écoute comparative dans `audio-playback-notes.md`.

**Priorité suivante :** captures SNES des spawns, hazards wagon omis, parité canons canyon si écart gameplay restant.


---

# Dernière extension utilisateur — version 0.3.1

Dernière lecture du quota pendant cette passe : **90 % utilisés sur 5 heures, 32 % sur la semaine**, usage inclus encore autorisé. Aucun reset consommé. Ce rapport est sauvegardé avant épuisement.

L’utilisateur exige aussi **tous les mécanismes de tonneaux** (porter, lancer, entrer dans les canons et leurs variantes), **tous les environnements**, **une carte où les deux protagonistes se déplacent**, et **les musiques et bruitages fidèles**. Lire en priorité `reference/world-barrels-audio.md` : cette demande complète le périmètre 0.3 ci-dessous et reste en partie à réaliser.

Ajouts concrets de cette passe : `src/IslandMap.tsx`, carte 3D avec les deux vrais Goonk qui parcourent un chemin vers l’étape sélectionnée ; sélection accessible et bouton Entrer dans `App.tsx`. C’est encore la carte des sept parcours créés, pas la carte originale intégralement reconstruite.

Tonneaux : vol canon préservé, exclusion du canon source permettant les chaînes, canon oscillant dont l’angle visible correspond au tir, support d’autoFire (non placé), tonneaux en bois lancés qui roulent sur les plateformes. Champs `Player.launched`, `cannonLock`, `cannonTime`, méthode `Game.cannonAngle`, variantes facultatives `BarrelSpec.rotationSpeed`/`autoFire`. Les valeurs temporelles et balistiques restent adaptées. Quatre nouveaux tests : **44 tests unitaires passent** dans cinq fichiers. `scripts/map-browser.mjs` et commande `npm run test:map` contrôlent la carte ; le résultat final figure dans la validation.

Audio : toujours synthèse provisoire, aucune musique originale livrée. `reference/audio-inventory.json` indexe 27 pistes et 119 étiquettes d’effets de la source USA 1.0, pas 119 sons uniques vérifiés en Rev 2. Driver SPC700, séquences, BRR et playback Rev 2 restent à analyser/restituer. **Ne pas remplacer cette demande par de nouvelles boucles génériques et prétendre à la fidélité.**

Continuer d’abord les preuves et lacunes de `world-barrels-audio.md` et `fidelity-roadmap.md`. Préserver la version jouable ; ne pas annoncer tous les mondes, tonneaux ou sons présents. Aucun commit Git n’a encore été créé ; tous les fichiers restent non suivis.

---

# Mise à jour prioritaire pour Claude — version 0.3.0

**Lire cette mise à jour avant le rapport 0.2 historique conservé plus bas.**

L’utilisateur a précisé après le premier relais : « La DA doit ressembler au jeu original », le gameplay et l’univers doivent être fidèles, notamment les peluches chevauchant les animaux terrestres/marins et les roulades. Il autorise une rétro-ingénierie complète si nécessaire. Cet objectif de fidélité est maintenant explicite : ne plus le présenter comme une extension facultative « si demandée ». La version 0.3 améliore ces éléments sans prétendre que le jeu complet est reproduit.

## Travail ajouté et conservé

- **Quatre montures** : Rambi, Enguarde, Winky, Expresso, avec modèles 3D animés distincts, caisses à libérer et montée en sautant sur le dos (proximité pour Enguarde sous l’eau). Changer descend même avec une seule peluche. Un choc fait fuir l’animal sans retirer immédiatement une peluche ; il est récupérable.
- Rambi attaque de la corne ; Winky saute plus haut et peut écraser les abeilles ; Expresso court vite, plane au saut maintenu et enjambe les petits ennemis ; Enguarde nage sur deux axes et attaque au rostre. Le lagon possède des flèches verticales pour le mode clic aussi.
- **Roulade et roue distinctes** : Rose se replie et Violette étend ses membres. Direction conservée, élan propre, accélération après un ennemi, saut après sortie du rebord tant que la roulade persiste. Les deux peuvent vaincre Klump en roulant, seule Rose peut le vaincre par saut à pied.
- **DA** : fougères et sous-bois plus denses en plans derrière l’action, racines élargies, rebords rocheux plus irréguliers, coraux ramifiés et lumière chaud/froid plus proche des références. Toujours géométrie stylisée ; pas d’équivalence exacte attestée.
- **14 nouvelles signatures Rev 2** : `reference/buddy-analysis.json`, `reference/buddy-analysis.md`, `scripts/analyze_buddies.py`. Cibles marche/course, impulsions de saut monté et gravité maintenue, impulsion d’attaque Enguarde, bases/chaîne/plafond de roulade et branche autorisant le saut hors rebord. Les nombres sont importés depuis le JSON dans `src/game/animals.ts`.

## Fichiers et commandes supplémentaires

`src/game/animals.ts` définit types, dimensions et paramètres sourcés. `Game.animals`, `Game.mount`, `releaseAnimal`, `dismount` et `updateAnimals` sont dans `src/game/engine.ts`. Les placements facultatifs `Level.animals` sont dans `levels.ts` : Rambi jungle, Winky canopée/temple, Expresso canopée/neige, Enguarde lagon. La simulation reste à 60 Hz.

`src/game3d/AnimalModels.tsx` construit les quatre silhouettes (+X vers l’avant, origine au sol) ; `Animals.tsx` gère caisses et placement ; `Goonk.tsx` gère pose assise et roulade/roue ; `Scene.tsx` monte les animaux. `GameControls.tsx` adapte les libellés Descendre/Rostre/Corne/Bondir/Planer et la nage verticale. `World.tsx` contient la passe DA.

```sh
npm run analyze:buddies -- '/Users/sevenone./Downloads/Donkey Kong Country (USA) (Rev 2).zip'
npm test
npm run build
# Avec le serveur actif :
npm run test:buddies
npm run test:mobile
```

**40 tests unitaires passent, dans quatre fichiers**, dont 11 nouveaux sur montures, dégâts, descente, capacités et roulade hors rebord. TypeScript et build Vite passent également dans le dépôt final. Les contrôles navigateur des quatre montures et la suite mobile passent contre le build final ; voir `reference/validation.md`. Ne pas confondre test navigateur préparant une scène et partie complète jouée.

## Fidélité restant à établir : priorité de reprise

Lire **`reference/fidelity-roadmap.md`** avant d’étendre le jeu. Les parcours sont encore sept créations originales ; la totalité des niveaux/objets/boss/régions, cordes/lianes, salles bonus et jetons animaux, services Kong et Squawks ne sont pas reconstruits. Les ennemis aquatiques actuels sont encore provisoires. Les timings exacts, accélérations, contacts des montures, fuite/récupération et flutter soutenu comportent des réglages d’adaptation. Les impulsions animales vérifiées sont appliquées immédiatement, alors que la ROM les déclenche après des poses d’animation. Le +24 pixels de l’entrée flutter de la ROM n’a pas été transposé aveuglément en téléportation 3D.

L’étape apportant le plus de preuves est une **exécution contrôlée de la ROM fournie dans un émulateur**, avec captures des positions/vitesses/états et des cadrages visuels, puis comparaison des mêmes entrées côté web. REA expose un mode 6502, qui ne suffit pas à désassembler correctement le 65C816 SNES ; cette analyse a donc continué directement sur les octets. Aucune exécution SNES n’est attestée à ce stade. Poursuivre l’analyse par questions concrètes avant de revendiquer une rétro-ingénierie exhaustive.

**Quota Codex :** au contrôle de la passe 0.3, 84 % de la fenêtre de 5 heures et 31 % de la fenêtre hebdomadaire étaient utilisés ; usage inclus autorisé, solde supplémentaire 0. Valeurs historiques à revérifier ; aucun reset consommé. Rapport sauvegardé avant la limite ; aucune surveillance automatique créée.

---

# Rapport historique 0.2 — conserver comme contexte, la mise à jour ci-dessus prévaut

# Relais pour Claude — Goonk Country 0.2.0

Rapport préparé le **21 octobre 2026**, à la demande de l’utilisateur, avant épuisement éventuel de son quota Codex. Ce document décrit un projet déjà réalisé et testé ; il faut le lire avant de modifier le code.

## Message de reprise à donner à Claude

> Continue le projet `/Users/sevenone./Documents/git/goonk-country`. Lis d’abord ce rapport, le README et les trois documents de `reference/` : `mobile-design.md`, `reverse-engineering.md`, `validation.md`. L’objectif est une adaptation 3D de Donkey Kong Country avec les peluches Goonk rose et violette issues de `tontie-re`, mobile first, jouable en portrait et paysage, au tactile, avec commandes virtuelles et au clic. Une version jouable de sept étapes existe. Préserve le travail présent et les éventuelles modifications de l’utilisateur. Commence par vérifier le fonctionnement actuel, puis traite les points réellement observés : ergonomie et performances sur téléphone, partie complète et équilibrage. Ne réécris pas le moteur sans raison mesurée. Ne présente pas la rétro-ingénierie comme complète, ni les essais Chrome comme des tests sur appareils physiques. Communique en français et surveille le coût de tes prochaines étapes.

## Demande utilisateur et périmètre

L’utilisateur a fourni `/Users/sevenone./Downloads/Donkey Kong Country (USA) (Rev 2).zip` et demandé :

- Créer le projet dans `/Users/sevenone./Documents/git/`, en utilisant la même famille de technologies que `/Users/sevenone./Documents/git/tontie-re`.
- Remplacer Donkey Kong par la peluche rose et Diddy Kong par la peluche violette, appelées ici Rose et Violette.
- Utiliser REA pour l’analyse, puis poursuivre directement si REA ne suffit pas.
- Évaluer Phaser 3 et React Spring face à Three.js, puis retenir la technologie adaptée.
- Retrouver l’ambiance artistique du jeu original en vraie 3D ; améliorer les bananes et repenser les monstres à partir de leurs silhouettes d’origine.
- Donner la priorité au téléphone, aux deux orientations et aux commandes tactiles ou au clic.
- Préparer ce relais avant la fin du crédit disponible.

Le résultat actuel est **une adaptation avec sept étapes originales**, pas un port complet des niveaux SNES. Aucune commande utilisateur n’autorise à prétendre à une fidélité totale ou à un jeu intégralement reproduit.

## État, emplacement et précautions pratiques

**Dépôt faisant autorité :** `/Users/sevenone./Documents/git/goonk-country`, version `0.2.0`.

Le dépôt Git a été initialisé sur `main`, mais **aucun commit n’a été créé**. Au dernier contrôle, tous les fichiers du projet étaient non suivis. Un `git status` affichant beaucoup de `??` est donc attendu : ne pas supprimer ces fichiers ni exécuter de nettoyage destructeur. Aucun push, déploiement public ou PR n’a été effectué.

Le projet original `tontie-re` n’a pas été modifié. Le nouveau projet possède ses propres dépendances installées et son propre lockfile.

Un dossier de préparation existe dans `/Users/sevenone./Documents/Codex/2026-10-21/cre/work/goonk-country`. **Il n’est pas la copie de référence** et son `node_modules` peut pointer vers des dépendances de travail. Travailler dans le dépôt sous `Documents/git`.

Dans la session Codex d’origine, écrire sous `Documents/git` exigeait une élévation de la permission du terminal, bien que l’emplacement ait été explicitement demandé par l’utilisateur. Les copies et compilations nécessaires y ont été autorisées. Claude doit respecter les permissions de son propre environnement.

## Lancement et commandes

Vite 8 exige Node **22.12 minimum**. Le Node système observé était `22.11`, trop ancien. La version utilisée avec succès était Node **24.19**, disponible à :

```text
/Users/sevenone./.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin
```

La présence de ce runtime dépend de la machine ; avec un Node 24 déjà actif, l’export ci-dessous est inutile.

```sh
cd /Users/sevenone./Documents/git/goonk-country
export PATH="/Users/sevenone./.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH"
node --version
npm run dev
```

Le port de développement configuré est `5174` et l’écoute autorise le réseau local. Les dépendances sont déjà installées ; ne pas les réinstaller systématiquement.

```sh
npm test
npm run build
# Dans un autre terminal, pour servir le dernier build :
npm run preview -- --port 5174
# Avec un serveur actif :
npm run test:browser
npm run test:mobile
# Exemple pour vérifier la version servie sur le réseau local :
GAME_URL=http://192.168.1.164:5174/ npm run test:mobile
```

Lors du relais, un serveur de prévisualisation du build final avait été laissé actif :

- Local : <http://127.0.0.1:5174/?v=mobile-2>
- Téléphone sur le même Wi-Fi : <http://192.168.1.164:5174/>

L’adresse LAN et la disponibilité du serveur peuvent changer. Ne pas lancer un second serveur sur le même port sans vérifier le premier. `npm run preview` sert `dist/` ; après une modification, reconstruire pour voir celle-ci en prévisualisation.

Les scripts navigateur utilisent Playwright et Chrome sur macOS. `BROWSER_EXECUTABLE` permet de choisir un autre navigateur ; ailleurs, Chromium peut nécessiter une installation. `GAME_URL` permet de changer l’URL testée.

## Choix technique déjà argumenté

React 19, TypeScript 6, Vite 8, Three.js 0.186, React Three Fiber 9, MUI, i18next et react-i18next. La simulation est indépendante du rendu, à pas fixe de **60 Hz**.

Three.js/R3F ont été conservés pour les vrais volumes, les éclairages, les matières et les modèles Goonk réutilisés. Phaser 3 est principalement conçu pour la 2D et demanderait un rendu 3D supplémentaire pour ce besoin. React Spring anime des valeurs et peut accompagner R3F ; il ne remplace pas un moteur de rendu. Il n’a pas été ajouté, les animations présentes utilisant le temps de simulation, l’amortissement de caméra et du CSS.

Les sources et décisions détaillées sont dans `reference/mobile-design.md`, dont documentation Phaser, React Spring, R3F et recommandations Apple sur les commandes de jeu. Il n’est pas nécessaire de refaire cette recherche sans nouveau besoin.

## Fonctionnalités présentes

Sept étapes reliées par une carte et déverrouillées progressivement : jungle, canopée avec plateformes mobiles et canons, mine en wagon automatique, lagon sous-marin, neige glissante, temple et bateau du boss.

Deux personnages interchangeables et compagnon suiveur ; saut à hauteur variable ; course ; roulade ; tonneaux à porter et lancer ; tonneaux de secours ; checkpoints ; canons ; ennemis ; bananes ; ballons ; cinq lettres GOONK. Cent bananes ou cinq lettres donnent une vie supplémentaire. Déblocages et records sont enregistrés localement. Le son est synthétisé, original et désactivable.

Clavier : flèches ou Q/D et A/D, Espace pour sauter/nager, Maj pour courir, X pour action, C pour changer, Échap/P pour pause. Manette standard : A saut, X action, B changement, RB course.

### Mobile et clic

- En portrait, la scène et les commandes sont séparées : une zone inférieure d’environ 228 px est réservée aux pouces.
- En paysage, direction à gauche et actions à droite. Pas de verrouillage d’orientation.
- Joystick glissé : marche près du centre et course en périphérie ; axe vertical utilisé dans l’eau.
- Mode clic : une direction reste active après un clic ; nouveau clic ou bouton central pour arrêter. Le saut au clic est maintenu environ 350 ms.
- Pointer Events, capture de pointeur et sources d’entrée indépendantes permettent plusieurs actions simultanées. Annulation, perte de focus et changement de taille relâchent les entrées.
- Boutons principaux d’au moins 44 px CSS, saut plus large. HUD compact et caméra adaptée à la largeur disponible.
- `dvh`, marges de zone sûre et `viewport-fit=cover`. Manifeste autorisant le mode autonome et les deux orientations ; pas de service worker ni de promesse hors ligne.
- Le mode d’entrée est enregistré dans `localStorage` sous `goonk-input-mode`.

### Direction artistique et modèles

Jungle sombre olive, éclairage chaud, interface dorée d’aventure, végétation en plusieurs plans, feuilles courbées et nervurées, écorce, racines et rochers. Les autres étapes changent leur palette et leurs décors.

Les bananes sont de vrais volumes courbes, effilés, à cinq reliefs avec couleurs de sommets, tige et extrémité sombre. Leur oscillation évite de les rendre régulièrement invisibles de profil.

Cinq familles distinctes : castor inspiré de Gnawty avec incisives et queue plate ; crocodile Kritter avec longue mâchoire, dents et crête ; Klump rond avec casque et pantalon violet ; Zinger rayé avec antennes, six pattes, ailes translucides et dard ; boss K. Rool avec ventre doré, cape rouge et couronne. Les yeux restent visibles dans les deux directions. Les hauteurs de collision ont été adaptées aux modèles.

Les Goonk réutilisent les géométries, coutures, yeux et matières du projet source. Le titre utilise la police Anton stockée localement, sous SIL OFL dans `public/fonts/OFL.txt`. Les autres textes utilisent les polices système.

### Performances

Éléments répétitifs instanciés, visibilité par tronçons, ombres de contact simples instanciées, DPR plafonné à 1,35 et réduction adaptative à 1. Le rendu passe à la demande pour les écrans et pauses qui n’ont pas besoin d’animation continue. Le dernier échantillon Chrome donnait 109 appels de rendu et 64 192 triangles. Ce n’est pas une garantie de performances sur téléphone.

## Où intervenir dans le code

| Fichier | Responsabilité |
| --- | --- |
| `src/game/engine.ts` | Simulation, collisions, états, équipe, objets, dégâts, progression et boss |
| `src/game/levels.ts` | Tracés et placements des sept étapes |
| `src/game/enemies.ts` | Dimensions, échelles et paramètres communs des ennemis |
| `src/game/camera.ts` | Calcul du cadrage portrait/paysage |
| `src/game/input.ts` | Agrégation des sources d’entrée indépendantes |
| `src/game/audio.ts` | Audio synthétisé |
| `src/App.tsx` | Accueil, carte, HUD, menus, cycle de vie et sauvegarde |
| `src/components/GameControls.tsx` | Joystick, boutons, mode clic et pointeurs |
| `src/Scene.tsx` | Boucle à pas fixe, caméra, budget de rendu et scène R3F |
| `src/game3d/World.tsx` | Décors et végétation, matériaux procéduraux, instanciation |
| `src/game3d/Actors.tsx` | Rendu et animation des objets et acteurs |
| `src/game3d/Goonk.tsx`, `plushGoonk/` | Peluches et composants réutilisés |
| `src/game3d/BananaModel.tsx` | Géométrie de banane |
| `src/game3d/EnemyModels.tsx` | Les cinq modèles de monstres |
| `src/game3d/ContactShadows.tsx` | Ombres de contact instanciées |
| `src/mobile.css`, `src/style.css` | Présentation et adaptations de format |
| `scripts/`, `tests/`, `reference/` | Analyse reproductible, tests et preuves |

L’ordre d’import CSS est intentionnel : `mobile.css` après `style.css` dans `main.tsx`. Ne pas réintroduire de dépendance à une police distante.

Pour les essais contrôlés, `window.goonk` expose l’état mutable du jeu ; `window.goonkDiagnostics` fournit des mesures de rendu. Les scripts préparent parfois directement les états, ce qui permet des contrôles ciblés mais ne prouve pas une partie complète.

## Rétro-ingénierie : preuves et limites

REA a ouvert et inventorié l’archive. Il n’a pas fourni de désassemblage SNES 65C816 exploitable ; la suite a été faite par analyse directe des octets. Un désassemblage public USA 1.0 a servi de guide pour retrouver des signatures dans **la ROM Rev 2 effectivement fournie**, sans considérer les adresses de la version 1.0 comme valables telles quelles.

Source de navigation : <https://github.com/Yoshifanatic1/Donkey-Kong-Country-1-Disassembly>. Sa copie de travail est dans `work/dkc-disassembly` sous le dossier Codex de cette conversation ; elle n’est pas embarquée dans le projet livré.

Identité vérifiée :

```text
ZIP SHA256: 123f853708518bdb745990a37d90a1cc800a0f0911afcf3ce451d81c446f6b77
ROM SHA256: 628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527
Taille ROM: 4194304 octets
En-tête: 0xFFC0 ; HiROM/FastROM ; révision 2 ; région 1 ; SRAM 2 Ko
Checksum: 0x2BCC ; complément: 0xD433 ; calcul vérifié ; reset: 0x8000
```

Principales signatures, avec offsets de fichier :

| Offsets | Observation |
| --- | --- |
| `0x3FAF9C`, `0x3FB176` | Gravité brute -112, vitesse terminale -2048 |
| `0x3FB9AC` | Gravité de saut maintenu -72 / -90 selon personnage |
| `0x3FA7E7` | Impulsions de rebond +1824 / +2176 |
| `0x00A370` | Seuil de 100 bananes |
| `0x3F84A4` | Sélecteur de personnage 0 / 2 |

Le détail des octets, le décodage et les limites sont dans `reference/rom-analysis.json` et `reference/reverse-engineering.md`. `scripts/analyze_rom.py` permet de répéter l’analyse en lecture seule :

```sh
npm run analyze:rom -- '/Users/sevenone./Downloads/Donkey Kong Country (USA) (Rev 2).zip'
```

Les conversions physiques utilisent une interprétation 8.8 et 32 pixels SNES par unité 3D. Les impulsions initiales de saut, les tracés, l’IA, l’animation et la musique ont été créés pour cette adaptation. Il n’y a pas eu de validation par émulateur ni de comparaison image par image. La ROM, ses sprites, ses musiques et le code du désassemblage public ne sont pas inclus dans l’application.

## Vérifications déjà terminées

Sur le dépôt autonome et la version finale compilée :

- TypeScript et build Vite réussis.
- **29 tests dans trois fichiers**, tous réussis.
- Test navigateur : saut, changement de peluche, déplacement par boutons et rendu des six autres étapes ; aucune erreur JavaScript ou console.
- Test mobile contre l’URL réseau local : direction et saut simultanés, relâchement correct, clic seul, arrêt, pause/reprise, rotation pendant une partie et sept transitions de scène ; aucune erreur.
- Six formats émulés : 390×844, 844×390, 320×568, 430×932, 932×430 et 768×1024. Pas de débordement horizontal, boutons dans le viewport et zone de commandes distincte de la scène en portrait.
- Tests de physique : sauts maintenus/courts, absence de double saut, vitesses, eau, wagon, dégâts et invulnérabilité, checkpoints, secours, tonneaux et canons, collecte et vies, progression, vulnérabilité/victoire du boss, pause et sauvegardes malformées.
- Traversabilité des sauts testée par simulation pour plusieurs phases et personnages ; cadrage mobile, indépendance des entrées, géométrie volumique des bananes et dimensions des nouveaux ennemis vérifiés.

**Limites :** essais dans Chrome sur ordinateur avec émulation tactile, pas sur téléphone physique. iOS Safari, les encoches réelles et les performances de différents Android restent à tester. Aucun parcours humain complet des sept étapes n’est attesté. Les tests de traversabilité n’incluent pas toute la difficulté produite par l’IA.

Le bundle de production reste conséquent : environ 1,35 Mo de JavaScript non compressé, environ 384 Ko gzip, plus la police et les autres fichiers. Une séparation de chargement peut être étudiée si les mesures sur téléphone la justifient. Un avertissement de dépréciation `THREE.Clock` peut venir des bibliothèques ; il n’a pas bloqué les contrôles.

## Priorités utiles pour la suite

1. **Vraie session sur téléphone.** Tester Safari iOS et Android, les deux orientations, la rotation en jeu, le multi-touch, les marges sûres, le son après interaction, les interruptions et la reprise. Mesurer la fluidité et la chauffe sur les scènes chargées. En l’absence d’appareil, garder ces points explicitement non validés.
2. **Partie complète et équilibrage.** Jouer chaque étape sans téléporter l’état : lisibilité des atterrissages, placements des ennemis, maniement des canons, wagon, nage, dégâts, checkpoints et boss. Corriger les problèmes observés puis ajouter uniquement les tests de régression utiles.
3. **Polissage ciblé de la DA et du feedback.** Vérifier les silhouettes en mouvement, les contacts visuels au sol, les retours de collecte/dégâts et la lisibilité sur petit écran. Préserver les vraies géométries et les deux peluches demandées.
4. **Performance et chargement.** Profiler sur appareil avant d’augmenter les détails ; regarder textures, draw calls, DPR, initialisation WebGL et taille du premier chargement. Le code possède déjà instanciation et adaptation de résolution.
5. **Fidélité supplémentaire si demandée.** La reproduction intégrale du jeu original représente un autre niveau de travail. Toute nouvelle affirmation de parité doit s’appuyer sur des preuves supplémentaires, et pas seulement sur les signatures existantes.

Ne pas refaire tous les tests ou toute la recherche documentaire à chaque changement mineur. Utiliser les contrôles adaptés, puis terminer la tâche concrète. Ne pas lancer de nouvel outil payant ou publier le projet sans besoin dans la demande.

## Captures et documents à consulter

Dans le dépôt : `reference/bestiary-3d.png`, `reference/mobile-portrait.png`, `reference/mobile-landscape.png`, `reference/validation.md`, `reference/mobile-design.md` et `reference/reverse-engineering.md`.

Copies destinées à l’utilisateur dans `/Users/sevenone./Documents/Codex/2026-10-21/cre/outputs/` :

- `goonk-country-bestiaire.png` : les vrais modèles 3D, réunis dans une scène de contrôle.
- `goonk-country-portrait.png` et `goonk-country-paysage.png` : version mobile actuelle.
- `goonk-country-mobile-design.md` et `goonk-country-validation.md`.
- `CLAUDE_HANDOFF.md` : ce rapport, également copié à la racine du dépôt.

L’ancienne image `goonk-country.png` correspond à une version visuelle précédente ; ne pas l’utiliser pour juger la version 0.2.

## Quota au moment de la demande

La lecture des limites Codex indiquait **55 % utilisés sur la fenêtre de 5 heures**, donc **45 % restants**, et **27 % utilisés sur la fenêtre hebdomadaire**, donc **73 % restants**. Le solde de crédits supplémentaires était à zéro, mais l’usage inclus était encore autorisé et aucune limite de dépense n’était atteinte. Ces valeurs sont un instantané, pas une promesse de disponibilité future ni une mesure du quota Claude.

Aucun crédit de réinitialisation n’a été consommé. Aucune surveillance automatique en arrière-plan n’a été créée. Le rapport est sauvegardé dès maintenant pour que la reprise ne dépende pas du contexte de cette conversation.
