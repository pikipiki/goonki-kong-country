# État prioritaire de reprise — 0.4.0

**Cette section prévaut sur tous les rapports historiques conservés plus bas.** Lire `reference/rom-deep-analysis.md`, puis `runtime-player-analysis.json`, `level-tables.md`, `audio-rom-analysis.md` et `audio-playback-notes.md`.

**Dépôt :** `Documents/git/goonk-country` (remote GitHub `pikipiki/goonki-kong-country`). Avant chaque commit : mettre à jour cette section et suivre `.cursor/skills/handoff-before-commit/SKILL.md` (règle `.cursor/rules/handoff-before-commit.mdc`).

**Route ROM :** Jungle Hijinxs (`ROM_JUNGLE`, étape 0) et Coral Capers (`ROM_CORAL`, étape 3, `levelId` 3). `App` active la route originale pour 0 et 3. Cinq autres étapes restent le prototype.

**Jungle (63/66 placements ROM) :** bonus rooms avec **`romRam1375`/`romRam13E9`** + **`entranceLevelId`** via table `entranceToLevelId` (`jungle-bonus-walls.json`, `npm run analyze:jungle-bonus`), Necky (`necky-ballistics.json`), `finishZone`. Parité : **120** frames vx, **241** échantillons sol, **155** frames position dynamique (`dynamicParity` dans `jungle-parity-walk.json`). Fosse SNES x≈454 documentée (`jungle-walk-pit.md`) — métatuiles plates, chute côté objet/état. Capture noix → `necky-runtime-capture.json` + `npm run probe:jungle --necky-state`.

**Coral (37 placements) :** terrain bandes 512 px, nage horizontale **vxRaw 512** (`underwater-motion.json`), collision swim corrigée (`blocksCoralHorizontal`), `finishZone` **UnderwaterExitDoor** @ x=2024, ennemis tagués `romSpriteId`/`patrolSpeed` (`coral-rom-notes.md`). Pas de textures chip.

**Audio :** 27 M4A + 119 WAV ; SFX `place`/`throw`/`pickup`/etc. mappés sur IDs Rev 2. **Écoute comparative** et **téléphones réels** non automatisées — voir `reference/audio-playback-notes.md`.

**Joueur / canons :** portage maintien Action, lancer/poser, projectile vers **896 raw**, échange d’équipe animé ; canons avec compteurs **gravité/contrôle** par pas de simu (test `bonus-cannon.test.ts`), rotation visuelle en vol (`launched`).

**83 tests, 11 fichiers** (`npm test`). `probe:jungle`, `analyze:jungle-bonus`, `generate:jungle-parity`, `generate:coral`.

**Limites honnêtes :** loot bonus **authored** (cibles `entranceLevelId` décodées, pas la géométrie ROM) ; rebord x≈454 non simulé (sol statique continu) ; Necky SNES = save state ; pas de textures ROM.

**Priorité suivante :** collision objet/cmd 5–8 au rebord, save state Necky, parité sur pentes après frame 155, audio/mobile.

**Désassemblage Yoshifanatic1 :** cible officielle **USA V1.0** (MD5 `30c5f292ff4cbbfcc00fd8fa96c2de3b`) — **pas** la Rev 2 (`revision` 2, SHA-256 dans `rom-analysis.json`). Utilisable pour **noms de routines / tables / logique**, avec relocalisation d’octets obligatoire (`analyze_level_tables.py`, `player-states.json`). Voir `reference/disassembly-rev2.md` après vérif MD5.

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
