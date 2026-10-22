# Stabilité des playthroughs — 23 octobre 2026

## Résultat vérifié

La matrice de répétition a terminé **9 parcours sur 9**, sans mort ni erreur
JavaScript/console. Les dégâts et tous les ennemis normaux restent actifs.
Les traces d’un même niveau sont identiques dans les trois profils.

| Parcours             | Répétitions | Fin atteinte                 | Frames de physique par passage | HP finaux |
| -------------------- | ----------- | ---------------------------- | ------------------------------ | --------- |
| Barrel Cannon Canyon | 3/3         | `clear`, x=331,116           | 1 958                          | 1         |
| Coral Capers         | 3/3         | `clear`, x=92,540 / y=73,010 | 4 038                          | 2         |
| Boss final           | 3/3         | `victory`, 10 coups          | 4 516                          | 2         |

Profils réellement exécutés : ordinateur 1100×700 sans délai ajouté, portrait
390×844 avec 25 ms de délai du pilote par commande, paysage 844×390 avec 50 ms.
Le boss a été testé deux fois en 2D et une fois en 3D. Au total : **31 536 frames
physiques et 2 190 séquences de commandes vérifiées**. Coral termine avec six
vies grâce à une vie gagnée normalement ; Canyon et le boss en conservent cinq.

Preuves locales :
`artifacts/browser/stability-2026-10-22T22-34-40.356Z/results.json`.
Ce chemin UTC correspond au 23 octobre à Paris. Chaque résultat pointe sur ses
logs complets, captures, état final et séquence d’entrées. Ces fichiers générés
sont ignorés par Git ; les scénarios maintenus sont sous
`tests/fixtures/playthrough/`.

## Causes corrigées

1. Les pilotes simulaient six ou huit frames dans une copie du moteur, mais
   laissaient le navigateur avancer pendant les échanges clavier et captures.
   Les vraies commandes ne correspondaient donc pas toujours aux prévisions.
2. Les mises en pause effaçaient les commandes de l’application, tandis que
   certains pilotes raisonnaient comme si les anciennes touches étaient encore
   maintenues. Relâcher/represser toutes les touches créait aussi des appuis
   supplémentaires absents des simulations.
3. L’activation physique des ennemis dépendait de `cameraBounds`, produit par
   une caméra lissée selon la cadence de rendu et le viewport. Elle dépend
   maintenant d’une région fixe autour du joueur. Le culling visuel utilise
   toujours le vrai cadrage de caméra.
4. Le pilote Canyon maintenait `action` après expiration d’une roulade. Le
   passage final pouvait être abordé sans nouvelle roulade, puis provoquer une
   mort. Il relâche désormais cette touche avant de demander un nouvel appui.
5. Un simple seuil de progression en X ne convient pas au labyrinthe de Coral,
   dont le chemin doit aussi revenir à gauche et monter. Ce faux blocage a été
   retiré du parcours marin.
6. Les anciens scripts écrasaient les preuves des passages précédents. Chaque
   nouvelle exécution a son propre dossier et renvoie un vrai code d’échec.

## Contrat des nouveaux pilotes

Les trois points d’entrée utilisent `scripts/lib/playthrough/` : transport des
commandes et ressources dans `driver.mjs`, pilotage exploratoire par niveau,
validation des scénarios et reporting commun. Les fichiers métier du jeu ne
contiennent pas de raccourci réservé à ces playthroughs.

**Par défaut, les scripts rejouent une séquence de commandes validée et versionnée.**
Ce sont des régressions reproductibles, pas une nouvelle recherche heuristique
à chaque lancement. Les séquences couvrent la traversée entière, depuis la
carte jusqu’à la fin. Le moteur rejoue aussi ces mêmes commandes dans les tests
unitaires, sans invincibilité ajoutée ni déplacement forcé.

Playwright contrôle explicitement l’horloge du navigateur et appelle ses vrais
callbacks d’animation. Cela empêche les temps de calcul, les captures ou les
latences du pilote d’ajouter des frames. **Le pilote n’écrit pas dans l’état du
jeu** : aucune modification de position, vie, HP, ennemi ou champ `game.time`.
Les entrées passent par les événements clavier réels. Le menu et la pause
initiale passent par les commandes de l’interface.

Après chaque groupe de commandes, une copie isolée du moteur et le vrai jeu
sont comparés : temps de simulation, phase, vie, position/vitesse du joueur,
monture, canon, phase du boss et état/position/HP des ennemis. Une dérive est un
échec explicite, avec capture et état de diagnostic. Il n’y a aucun retry caché
pour obtenir un passage vert.

Chaque lancement possède son navigateur et, sans `GAME_URL` explicite, son
serveur Vite sur un port éphémère. Le serveur habituel de l’utilisateur n’est
pas réutilisé implicitement ou arrêté. La copie du moteur et le serveur par
défaut viennent du même dépôt.

## Commandes

```sh
cd /Users/sevenone./Documents/git/goonk-country
npm run test:playthrough:stable
# Une seule famille, toujours trois profils/répétitions :
npm run test:playthrough:stable -- canyon
```

La commande de stabilité préserve les codes de sortie de chaque enfant et
compare les empreintes des traces. `PLAYTHROUGH_RUNS` change explicitement le
nombre de passages. `PLAYTHROUGH_VIEWPORT` et
`PLAYTHROUGH_CONTROL_DELAY_MS` configurent un lancement individuel.

Les points d’entrée individuels restent compatibles :

```sh
node scripts/playthrough-canyon.mjs
node scripts/playthrough-coral.mjs
node scripts/boss-battle-browser.mjs
```

Attention : dans un shell sans `pipefail`, `node ... | tail -1` renvoie le code
de `tail`, même si Node échoue. Le lanceur de stabilité évite ce piège. Pour
conserver une boucle shell avec pipeline, activer `set -o pipefail`.

## Mise à jour intentionnelle d’un scénario

Ne pas remplacer automatiquement un scénario qui échoue après une modification
physique. Diagnostiquer d’abord s’il s’agit d’une régression du jeu.

Si le changement est volontaire, le pilote exploratoire reste disponible :

```sh
PLAYTHROUGH_REPLAN=1 npm run test:playthrough:canyon
npm run test:playthrough:record -- canyon
```

Remplacer `canyon` par `coral` ou `boss` dans les commandes correspondantes.
L’enregistrement n’accepte qu’un parcours exploratoire terminé, sans mort ni
erreur navigateur, dont les séquences ont été vérifiées. Relire le diff du JSON,
puis rejouer les tests et la matrice. Le mode exploratoire sert à rechercher de
nouvelles commandes ; sa stratégie peut demander un ajustement après un nouveau
tracé. Il ne remplace jamais silencieusement un scénario qui échoue.

## Autres contrôles déjà passés

- Chaîne demandée : `npm run format && npx eslint . --max-warnings 0 &&
npx vitest run && npm run test:e2e` : **482 tests / 89 fichiers**, puis **3 E2E**.
- Couverture moteur : **100 %** lignes, branches, statements et fonctions,
  472 tests du projet moteur.
- Compilation TypeScript/Vite réussie. L’avertissement de taille du chunk 3D
  est encore présent ; il n’a pas été masqué pour ces corrections.
- Tests dédiés : activation identique selon le cadrage, évolution identique
  avec des fréquences de rafraîchissement caméra différentes, exactitude des
  transitions de touches, copies indépendantes et détection d’une divergence.
- Job CI dédié ajouté pour exécuter la matrice de stabilité. La CI distante
  n’a pas été lancée depuis cette session.

- Suite fonctionnelle navigateur complète : **12 scripts réussis**, dont les
  trois traversées complètes.
- Vérification de production : **6 cas mobiles réussis**, aucune violation CSP
  et aucune erreur navigateur.
- Contrôle d’architecture : 342 fichiers source analysés, aucun fichier
  inaccessible depuis les points d’entrée et aucun cycle à l’exécution.

Les journaux de ces validations sont conservés dans le sous-dossier
`validation/` du dossier de résultats de la matrice cité plus haut.

## Portée et limites

Cette vérification couvre les trois playthroughs existants (Canyon, Coral et le
boss), pas la traversée des sept niveaux. Les tests mobiles utilisent Chrome
sur ordinateur avec viewport émulé ; ce n’est pas une validation sur iPhone ou
Android physique. Le contrôle d’horloge rend les scénarios reproductibles ; il
ne mesure pas les FPS réels ou les performances d’un téléphone.

Les cinq modifications déjà présentes au début de cette passe — règles Canyon,
helper navigateur, tests de mécanique, typage AppSceneView et plugin Vite — ont
été préservées. Point de départ : `main`, HEAD `9c9a684`. Aucun commit, push ou
déploiement effectué dans cette passe.
