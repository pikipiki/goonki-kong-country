# Données de niveaux originales — USA Rev 2

Extraction en lecture seule du ZIP fourni. Le script `scripts/analyze_level_tables.py` utilise uniquement Python standard. Il contrôle le SHA-256 du ROM et recherche des signatures uniques dans les octets Rev 2 (la table de formes de bananes, dupliquée, est résolue par le pointeur effectivement chargé par sa routine) ; il n'applique pas simplement les adresses de la désassemblage USA 1.0.

Commande : `python3 scripts/analyze_level_tables.py [chemin-du-zip-ou-ROM]`

Le résultat est `reference/level-tables.json`. Le ROM n'est jamais modifié. Les noms sémantiques viennent de la navigation dans [la désassemblage publique de Yoshifanatic1](https://github.com/Yoshifanatic1/Donkey-Kong-Country-1-Disassembly) ; les pointeurs, placements et affectations initiales sont lus dans le ROM réel. Aucun sprite, musique ou texture n'est extrait dans le jeu web.

## Résultats vérifiés dans les octets

| Élément | Offset fichier Rev 2 | Contenu |
|---|---:|---|
| Pointeurs d'environnement | `0x018B94` | 14 pointeurs longs : Jungle `$D90000`, grotte `$DA0000`, sous-marin `$E90000`, etc. |
| Entrée → identifiant de niveau | `0x38B549` | 230 entrées, dont Jungle principal `$16` → niveau `$00`, Coral Capers `$BF` → `$61`. |
| Pointeurs relatifs de formations de bananes | `0x38C20D` | 112 pointeurs ; Jungle 10 formations, Coral Capers 25. |
| Entrée → liste de placements | `0x3D8000` | 230 pointeurs 16 bits dans la banque `$BD`/miroir `$FD`. |
| Distributeur environnement/musique | `0x398000` | Trois tables de routines, dont musique à base + `$3B6`. |
| Table de fonctions de profil de collision | `0x0184C9` | 63 profils, évalués sur leurs 16 abscisses locales depuis les vraies instructions Rev 2. |
| Attributs de collision de jungle | `0x19ED00` | 234 paires de classes, une pour chaque demi-métatuile de 16 pixels. |
| Calcul de l'adresse de collision horizontale | `0x018026` | Métatuiles 32 × 32, 16 rangées par colonne, stockage par colonnes. |

Exemples de différences qui interdisent de reprendre aveuglément les adresses V1 : la table de formations passe de `$B8C0E1` à `$B8C20D`; les scripts d'initialisation de nombreux objets B5 sont décalés de -4 octets ; la liste de Coral Capers passe de `$BDE4AA` à `$BDE4CA` alors que Jungle reste `$BD95DC`.

## Jungle Hijinxs : données directement exploitables

L'entrée principale `$16` et le checkpoint `$25` pointent vers les mêmes **66 enregistrements de placement**, à l'offset `0x3D95DC`. Chaque enregistrement mesure 8 octets : commande, X, Y, pointeur de script. La liste est terminée par quatre mots nuls. Toutes les coordonnées ci-dessous sont en pixels du monde original, X vers la droite et Y vers le haut depuis le bas de l'espace horizontal de 512 pixels. Elles ne sont pas des coordonnées d'écran.

| Objet identifié par les affectations de son vrai script Rev 2 | X | Y |
|---|---:|---:|
| Première Gnawty | 533 | 175 |
| Premier tonneau DK | 629 | 159 |
| Premier Kritter | 837 | 239 |
| Lettre K — animation `$0105` | 963 | 336 |
| Checkpoint — entrée cible `$25` écrite dans `$1375` | 2060 | 216 |
| Lettre O — animation `$0106` | 2160 | 304 |
| Caisse AnimalBuddyBox — variante 0, animation `$010D` | 2952 | 144 |
| Lettre N — animation `$0107` | 3374 | 192 |
| Lettre G — animation `$0108` | 4240 | 296 |
| Sortie ExitDoor | 5296 | 63 |

La variante 0 de la caisse est la piste Rambi ; le fichier prouve directement l'identifiant d'objet `$18`, la variante zéro, l'animation et le placement. Le comportement de libération du compagnon est une routine distincte, à vérifier avant de prétendre que l'extraction reconstitue toute sa logique.

La musique de l'entrée `$16` est vérifiée par les octets `A9 00 00 5C 36 90 B9` à `0x398703` : chargement de l'identifiant 0 puis saut vers le sélecteur musical, nom public `DKIslandSwing`.

Les 169 premières colonnes de métatuiles, les 234 paires d'attributs et les 63 profils sont exportés dans le JSON. Le script calcule aussi **676 échantillons de sommets de collision, espacés de 8 pixels**, de X=0 à X=5400. Exemples : X=528 donne Y=175 ; X=1824 donne Y=208 ; X=2952 donne Y=143, cohérent avec la caisse posée à Y=144.

Attention : ces sommets sont calculés **par métatuile** et comprennent les cellules solides internes. Ce n'est pas encore une unique ligne de sol prête à importer. Le jeu d'origine sélectionne un voisinage à partir du Y du personnage, gère le renversement horizontal `$4000`, les deux demi-tuiles, les classes et les transitions entre cellules. Aplatir chaque colonne vers son maximum détruirait les passages sous les plateformes. Les données exportées permettent une vraie reconstruction de ce sondage, sans réinventer un niveau approximatif.

## Coral Capers : eau et compagnons

Entrée principale `$BF`, checkpoint `$C0`, identifiant de niveau `$61`. Liste à `0x3DE4CA`, **41 enregistrements**, 25 formations de bananes. Musique vérifiée `AquaticAmbience`, identifiant 3.

Le décor marin utilise un espace vertical/global partagé : les Y stockés sont autour de `$46xx`–`$4Cxx`. **Ne pas soustraire arbitrairement une base pour les importer** : le cadrage et les zones du niveau doivent encore être décodés. Les commandes `$000F` sont des placements sous-marins normaux ; `$0009` est un en-tête supplémentaire de zones, pas un ennemi à l'origine.

Deux caisses compagnons sont identifiées dans leurs scripts :

| Placement | X | Y brut | Variante de caisse | Animation |
|---|---:|---:|---:|---:|
| Première caisse marine | 1920 | 18111 (`$46BF`) | 3 | 272 (`$0110`) |
| Seconde caisse marine | 848 | 18431 (`$47FF`) | 3 | 272 (`$0110`) |

La variante 3 est la piste Enguarde. Les scripts écrivent réellement `$1029=3`, `$1375=3`, l'identifiant AnimalBuddyBox `$18` et l'animation `$0110`. Les placements contiennent également Bitesize, Chomps, Chomps Jr, Croctopus, Clambo, quatre lettres et le checkpoint. Le JSON conserve les affectations numériques et marque les scripts partiels ; aucun script des commandes 1/2/15 sélectionnées n'a rencontré d'opcode inconnu pendant cette passe.

## Ce que le décodeur fait exactement

- Relocalisation par signatures uniques et garde SHA-256 strict.
- Lecture des tableaux et listes jusqu'à leur sentinelle.
- Décodage borné des scripts d'initialisation B5 : affectations RAM, appels récursifs `$8200`, animations `$8100`, opcodes de longueur connue, arrêt `$8000`. Il ne simule pas les routines natives référencées par ces scripts.
- Évaluation des petits profils de hauteur par un interprète arithmétique 65C816 limité aux instructions réellement rencontrées. Il échoue immédiatement sur un opcode inconnu ; il n'est pas un émulateur SNES.
- Vérifications de cohérence des profils constants : classe 1 = 31, classe 2 = 27, classe 5 = 15 pour chaque abscisse locale.

## Suite prioritaire pour une fidélité réelle

1. Reproduire le sondage du sol Y-dépendant avec les métatuiles et profils exportés, plutôt qu'aplatir les sommets.
2. Décoder les paramètres d'entrée : positions initiales, limites caméra, zones sous-marines, portes/bonus. Les coordonnées X/Y des listes sont vérifiées ; la conversion des pièces marines ne l'est pas encore.
3. Vérifier les centres graphiques des bananes dans une exécution originale : les bitmaps sont maintenant développés, avec une convention de centre de 4 pixels et une possible différence graphique de 1 pixel due au décrément Y dans le renderer.
4. Relier la variante de caisse 0/3 aux routines Rambi/Enguarde et confirmer la trajectoire effective en exécution.
5. Comparer une exécution SNES du ROM fourni et la version web avec des points de contrôle identiques. Il n'existe encore aucune preuve de parité image par image ni de désassemblage complet.

Les modules séparés `originalJungle.ts` et `OriginalGround.tsx` préparent maintenant un mode original ; leur activation et les collisions du moteur sont intégrées séparément. L'extraction ne transforme pas les sept niveaux créés en reproductions originales.

## Helper TypeScript prêt pour l'intégration

`src/game/originalTerrain.ts` contient les tables numériques compactes et les fonctions pures :

- `probeSNES(px, py)` : coordonnées originales en pixels. Retourne `floorY`, `tileId`, `tileWord`, `attribute`, `correctedAttribute`, `profileFlags`, `profileId`, `localHeight`, `rowFromTop` et `referenceRowFromTop`, ou `null`.
- `query(xWorld, yWorld, {x, y})` : conversion par 32 pixels/unité. `{x, y}` est le pixel original correspondant au monde web `(0, 0)`. Un ancrage `{x:0, y:175}` place le sol initial à Y=0. Le champ `originalFloorY` conserve la valeur SNES.
- `nearestCandidateBelowSNES(px, py)` : outil de diagnostic, pas le sondage original, car il cherche toutes les rangées. Ne pas en faire le solveur principal.

Le sondage borné reproduit les voisins de la routine originale : cellule choisie par Y ; si vide, jusqu'à deux cellules en dessous ; si le profil vaut 31, une cellule au-dessus. Il peut donc proposer une correction au-dessus du Y fourni. Le contrôleur du personnage doit décider si cette correction est applicable à la trajectoire et à son état. `profileFlags` conserve seulement les bits hauts de la classe, il ne prétend pas reproduire la totalité des drapeaux de contact RAM `$9C`.

Reproduire le helper : `python3 scripts/generate_original_terrain.py` après l'extraction JSON. Cinq tests ciblés passent dans `tests/original-terrain.test.ts`, dont deux plateformes distinctes au même X, le terrain de Klump, le support de la caisse Rambi et la conversion explicite d'origine. Aucune modification du moteur n'a été faite : l'intégration et les comparaisons de trajectoires restent à réaliser.

## Mode original préparé et registre d'omissions

`src/game/originalJungle.ts` exporte `ROM_JUNGLE`, `ORIGINAL_JUNGLE_ORIGIN`, `ORIGINAL_JUNGLE_EXIT` et `ORIGINAL_JUNGLE_PROVENANCE`. Le générateur `scripts/generate_original_jungle.py` reproduit ce module depuis le JSON.

- Origine : X=0, Y=175, 32 pixels par unité. Départ original fourni par le contrôle d'exécution du ROM : X=156, pieds Y=175.
- 29 placements pris dans les 66 enregistrements : 11 ennemis dont le modèle existe, 4 lettres KONG, 4 tonneaux pris en charge, 5 ballons rouges, 4 régimes de 10 bananes et la caisse Rambi.
- 37 enregistrements sont conservés dans le registre d'omissions : caches cachées, murs/bonus, canons aux scripts inconnus, décor/effets, plateformes/pneus et comportements absents. Aucun canon aux paramètres inventés n'est ajouté. La porte de sortie est conservée comme coordonnée de déclenchement, pas comme nouvel ennemi.
- Les ennemis gardent leurs positions originales ; leur mouvement reste le comportement adapté du moteur web. Les limites de patrouille couvrent le niveau entier : aucune plage locale ne prétend être originale.
- Les quatre lettres sont K, O, N, G. Une cinquième lettre n'a pas été inventée pour remplir GOONK.
- Les régimes portent `amount:10` et les bananes isolées `amount:1`. Le moteur doit lire ce champ pour respecter la récompense.

`OriginalGround({game})` dessine l'union de **tous** les intervalles solides des métatuiles en conservant les plateformes superposées et passages dessous. Les silhouettes visuelles sont échantillonnées tous les 2 pixels, le sondage physique conserve les profils de 1 pixel. Onze chunks instanciés/cachés par distance limitent le coût : un mesh par chunk, matériau de terre procédural. Les rectangles `Level.platforms` sont seulement un support conservateur pour ombres/debug, jamais un remplacement du sondage original.

## Formes de bananes développées

La table active de formes se situe à `0x38D75D`. Sa signature existe deux fois dans le ROM ; la routine à `0x38B73F` charge explicitement le pointeur stocké à `$B8C20B`, qui résout cette table précise. Les formes possèdent largeur, hauteur et flux de bits par colonnes, LSB d'abord ; les bits sont injectés par `ROR` dans le masque vertical de 16 bits.

L'extraction développe **34 bananes isolées dans les 10 formations Jungle** et **96 dans les 25 formations Coral Capers**, sans compter régimes et caches. Les coordonnées des formations sont en espace de rendu Y vers le bas : plafond 512 pixels pour Jungle et `$7000` pour l'espace sous-marin vertical. Elles doivent être converties avant d'être mélangées aux coordonnées Y vers le haut des sprites.

Exemple : la première formation Jungle est une ligne de trois bananes, origines graphiques X=224/248/272, Y haut-bas=320. Le prototype place leurs centres à X=228/252/276, Y sprite=188, soit X=7.125/7.875/8.625 et Y=0.40625 dans le monde web ancré à 175. Ce centrage respecte la case de 8 pixels ; le décrément de dessin d'un pixel du renderer original reste à confirmer visuellement.

Sept tests ciblés passent actuellement : profils/sondage, plateformes superposées, coordonnées et caisse Rambi, géométrie 3D finie et conservation des deux surfaces. La compilation TypeScript passe. Aucun test ne remplace une comparaison avec la SNES.
