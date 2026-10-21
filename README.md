# Version actuelle 0.4.0

Le premier niveau lancé par l’interface utilise désormais le terrain et une partie
des placements de Jungle Hijinxs extraits de la ROM fournie, avec les quatre
lettres KONG. Les six autres étapes restent des créations. **Le port complet
reste à réaliser.** Le rapport `reference/rom-deep-analysis.md` décrit les preuves,
les omissions et la validation en exécution.

Les musiques et bruitages du jeu sont maintenant des captures du pilote sonore
de la ROM : 27 musiques et119effets dans `public/audio/` (~51,2Mio), chargés selon
le besoin. La synthèse provisoire a été remplacée. Les boucles et le mixage ne
sont pas encore entièrement fidèles. Les paragraphes historiques ci-dessous
qui décrivent un son synthétisé ou l’absence de musique extraite sont dépassés
par cette version.

`npm run test:original` contrôle le terrain, les lettres et la lecture audio dans
Chrome. `npm run verify:rom` revérifie les observations binaires ; les commandes
`analyze:player`, `analyze:audio`, `analyze:levels` produisent les nouveaux rapports.

---

# Goonk Country

Une adaptation 3D jouable de l’aventure de plateforme Donkey Kong Country, avec **Rose à la place de Donkey Kong** et **Violette à la place de Diddy Kong**. Les géométries, coutures, yeux et matières des Goonk proviennent du projet local `tontie-re`.

## Lancer

Node.js **22.12+ ou 24+** recommandé.

```sh
npm install
npm run dev
```

Ouvrir <http://127.0.0.1:5174>. `npm run build` produit `dist/`, et `npm run preview` lance cette version compilée.

## Ce qui est jouable

Sept étapes reliées par une carte déverrouillable : jungle, canopée et plateformes mobiles, mine en wagon, lagon sous-marin, glacier, temple et boss final. Deux personnages interchangeables, compagnon suiveur, sauts de hauteur variable, roulades, tonneaux à porter/lancer, tonneaux de secours, canons, points de passage, ennemis, bananes, ballons et cinq lettres GOONK. Une vie supplémentaire à 100 bananes ou après les cinq lettres. Progression et records sauvegardés dans le navigateur.

Le jeu est conçu pour le téléphone en **portrait et paysage**, avec un cadrage adaptatif et une manette sous les pouces. En portrait, les commandes occupent une zone dédiée sous la scène. Le **mode clic** maintient la direction choisie et permet de jouer à la souris sans clavier.

Clavier : flèches ou Q/D (A/D également), Espace pour sauter/nager, Maj pour courir, X pour la roulade ou le tonneau, C pour changer de personnage, Échap/P pour la pause. Commandes tactiles et manette standard : A saut, X action, B changement, RB course. La simulation se suspend en arrière-plan. Le son synthétisé est original et peut être coupé.

## Technologies

Même famille que `tontie-re` : React 19, TypeScript 6, Vite 8, Three.js, React Three Fiber, MUI pour le thème de l’application, i18next / react-i18next pour les libellés. Moteur indépendant du rendu, simulation à 60 Hz, rendu WebGL 3D. Aucun émulateur Flash, aucune capture vidéo utilisée comme décor.

## Projets similaires (web vs recomp)

Il n’existe pas de port **DKC en Three.js** public abouti. Les voisins utiles :
[Donkey Kong Kiro](https://github.com/dkljajo/donkey-kong-kiro) (clone Canvas 2D),
anciens moteurs **Construct 2** (DKC Web Engine, abandonnés), et **[DKC1Recomp](https://github.com/elliotttate/DKC1Recomp)** (fidélité maximale, **PC natif + ROM possédée**, pas navigateur).
Goonk Country vise un hybride : jeu web avec Goonk, données prouvées depuis la ROM Rev 2.
Voir `reference/similar-projects.md` pour le tableau comparatif et la stratégie.

## Rétro-ingénierie

`reference/rom-analysis.json` contient l’identité de la ROM USA Rev 2 fournie, son en-tête vérifié, les adresses des routines relocalisées, leurs octets et leur décodage 65C816. L’analyse initiale de l’archive par REA a été complétée par une analyse directe des octets et une comparaison avec le désassemblage public de Yoshifanatic1 (USA 1.0). Les correspondances ont été recherchées dans **la ROM Rev 2 réelle**, sans supposer les adresses identiques.

```sh
npm run analyze:rom -- '/chemin/Donkey Kong Country (USA) (Rev 2).zip'
npm test
npm run build
# Avec le serveur lancé dans un autre terminal :
npm run test:browser
npm run test:mobile
```

La gravité, la gravité du saut maintenu, les deux impulsions de rebond et le seuil de 100 bananes utilisés par le moteur sont issus de ces signatures vérifiées. Les conversions utilisent 32 pixels SNES par unité 3D. Voir `reference/reverse-engineering.md` pour les preuves et les limites.

**Portée :** c’est une adaptation en sept étapes, pas le port intégral ni une reproduction image par image des niveaux SNES. Les tracés, ennemis 3D, animations, impulsions initiales de saut et musique sont créés pour cette version. La ROM, les sprites, la musique et le code du désassemblage public ne sont pas inclus dans le jeu livré. Le titre utilise Anton, intégrée localement sous licence SIL OFL ; les textes utilisent les polices système.

## Organisation

- `src/game/engine.ts` : collisions, simulation, personnages, objets et progression.
- `src/game/levels.ts` : sept parcours et placements.
- `src/game3d/` : décors et personnages 3D, modules Goonk réutilisés.
- `src/App.tsx` : accueil, carte, HUD, menus et commandes tactiles.
- `scripts/analyze_rom.py` : analyse reproductible de la ROM en lecture seule.
- `tests/engine.test.ts` : physique, équipe, objets, progression et boss.
- `reference/` : constatations, provenance et captures de vérification.

Le dépôt `tontie-re` d’origine n’est pas modifié.

Le test navigateur utilise Chrome sur macOS ; ailleurs, installer Chromium avec `npx playwright install chromium`. `BROWSER_EXECUTABLE` permet de choisir un autre exécutable, et `GAME_URL` de tester un autre serveur local.

## Version mobile et direction artistique (0.2)

Three.js / React Three Fiber restent le moteur de rendu 3D. La comparaison avec Phaser 3 et React Spring, les sources UX, les décisions de cadrage et le bestiaire sont détaillés dans `reference/mobile-design.md`.

Les bananes sont des volumes courbes et effilés. Les cinq familles de monstres ont chacune leur propre silhouette, leurs appendices et leurs animations, inspirées de Gnawty, Kritter, Klump, Zinger et King K. Rool. La jungle utilise des feuilles courbées et nervurées, de l’écorce, des rochers, des racines, une palette plus sombre et une interface d’aventure dorée.

`npm run dev` et `npm run preview` écoutent aussi sur le réseau local : sur un téléphone connecté au même Wi-Fi, utiliser l’URL « Network » affichée par Vite. Le manifeste autorise l’ouverture autonome sans verrouiller l’orientation. Il n’y a pas de cache hors ligne.

Les tests mobiles émulent plusieurs tailles dans Chrome ; une validation sur téléphone physique, notamment iOS Safari, reste à faire.

## Fidélité, montures et roulades (0.3)

Rambi, Enguarde, Winky et Expresso sont maintenant présents dans des caisses,
avec quatre modèles 3D distincts. Action ouvre une caisse ; sauter sur le dos
monte sur les animaux terrestres, approcher Enguarde permet de le monter sous
l’eau. Changer descend de la monture. Un choc fait fuir l’animal sans enlever
immédiatement une peluche ; il peut être rattrapé.

Rambi attaque de la corne, Winky saute plus haut et peut retomber sur les
abeilles, Expresso plane avec le saut maintenu et passe au-dessus des petits
castors, Enguarde nage dans quatre directions et attaque du rostre. En mode
clic, les flèches verticales du lagon maintiennent la direction choisie ; Stop
annule aussi la nage verticale. En tactile, elles se maintiennent normalement.

Rose roule en boule ; Violette fait une roue. La roulade garde sa direction,
accélère après les ennemis et permet de sauter après la sortie d’un rebord
tant que l’état de roulade persiste. Les deux roulades peuvent vaincre Klump ;
seule Rose peut l’écraser à pied.

`reference/buddy-analysis.json` ajoute **14 signatures vérifiées dans la Rev 2** :
cibles de vitesse, impulsions de saut monté, gravité maintenue, attaque
Enguarde et états/élan des roulades. `src/game/animals.ts` utilise directement
ces valeurs. Reproduire avec `npm run analyze:buddies -- '/chemin/ROM.zip'`.
`npm run test:buddies` contrôle les montures dans Chrome, avec un serveur lancé.

La jungle, les grottes et le lagon ont été densifiés et leur lumière rapprochée
des références SNES. Voir `reference/art-fidelity.md`.

**La fidélité complète reste à atteindre.** Les durées, accélérations,
collisions de monture, fuite après choc et flutter soutenu sont encore en
partie des adaptations. Les parcours restent originaux. Squawks, les cordes,
les salles bonus, les services Kong, les autres ennemis/boss et tous les
niveaux originaux ne sont pas encore reconstruits. La musique est originale.
Le nouveau souhait explicite de l’utilisateur est de poursuivre ces écarts,
pas de considérer cette adaptation comme une reproduction achevée.

## Carte et tonneaux (0.3.1)

L’île est maintenant une carte 3D avec déplacement des deux peluches entre les
étapes sélectionnées, puis entrée par un bouton dédié. La carte reprend encore
les sept parcours de l’adaptation, et non tous les parcours SNES. Les tirs de
canon conservent leur impulsion, peuvent enchaîner un autre canon, et le canon
de canopée oscille dans la direction visible. Les tonneaux lancés roulent sur
les plateformes. `npm run test:map` vérifie la carte dans le navigateur.

`reference/world-barrels-audio.md` détaille le périmètre demandé et les lacunes.
L’audio reste provisoire ; `reference/audio-inventory.json` catalogue les noms
source à analyser, sans contenir de musique extraite.
