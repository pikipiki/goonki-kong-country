# Tests fonctionnels — état de travail du 22 octobre 2026

Dépôt : `/Users/sevenone./Documents/git/goonk-country`. Base Git `5fe2c1f` ; une refactorisation importante et des tests de couverture étaient déjà non committés avant cette intervention. Aucun changement du code `src/` pour cette passe.

## Corrections

- `scripts/run-functional-tests.mjs` : serveur 5174 réutilisé ou serveur Vite temporaire démarré/fermé par le lanceur. Une `GAME_URL` explicite inaccessible provoque un échec clair. `FUNCTIONAL_PORT` permet un test isolé. Des noms de scripts peuvent être passés après `--` pour une relance ciblée ; les noms inconnus sont rejetés. Un script en échec remonte un code de sortie non nul. Documentation ajoutée au README.
- `reference/canyon-playthrough-rules.json` : règle de tir manquante pour le tonneau manuel 26 dirigé vers le bas. L'ancien pilote préférait rester à x217,4375 plutôt que descendre. Régression `tests/canyon-functional-driver.test.ts` : tir par la vraie règle puis atterrissage sur le terrain inférieur, sans supprimer les ennemis.
- `scripts/playthrough-canyon.mjs` et `scripts/playthrough-coral.mjs` : une erreur JavaScript fait maintenant échouer le parcours, même si la sortie est atteinte.
- Corail : le pilote original oscillait autour de points de virage avec une tolérance de 0,22 unité et des commandes maintenues sans tenir compte du temps de calcul. Parcours dense + visée en eau libre, anticipation sur copies complètes de Game, faisceau de courtes séquences, véritable touche P pendant la planification. Les touches de direction sont envoyées APRÈS la reprise car l'application ignore les keydown en pause. Les positions, ennemis, vies, horloge et invincibilité de la partie réelle ne sont jamais écrits.

## Vérifications acquises

- 414 tests moteur/composants passent, 79 fichiers ; test ajouté et ESLint du fichier passent.
- 3 tests E2E Playwright passent.
- Les 9 premiers scénarios fonctionnels passent : navigateur, mobile, montures, carte, ROM, stages, décors, mécanismes, sol.
- Canyon complet : clear, 0 mort, 5 vies, 1PV, 34,33 s simulées, 307 décisions clavier, aucune erreur JS. Journaux `reference/canyon-playthrough*`.
- Démarrage autonome : `FUNCTIONAL_PORT=5184 npm run test:functional -- test:browser` passe et ferme le serveur créé. Vérifications supplémentaires par sous-processus : échec navigateur → exit1 + serveur temporaire fermé ; GAME_URL inaccessible non remplacée ; nom inconnu refusé ; serveur utilisateur 5174 toujours ouvert.

## Validation du corail et relance globale

Le pilote corail révisé a terminé le parcours : **clear, aucune mort, 5 vies, 2PV, Enguarde conservé**, 65,97 s simulées, aucune erreur JS. Aucun état réel de jeu écrit. Le journal conserve les ensembles/maps et les instantanés complets du moteur. Les touches sont physiquement relâchées avant la pause, puis réappuyées après la reprise. Les attaques sont choisies dans le même modèle physique que la navigation.

**Commande globale réussie : `FUNCTIONAL_PORT=5186 npm run test:functional`**, code de sortie 0, les 11 scénarios passent. Le lanceur a créé son propre serveur et l'a fermé après la suite ; une requête indépendante confirme que 5186 est fermé et que le serveur utilisateur 5174 répond toujours.

Deuxième canyon : clear, aucune mort, 33,57 s simulées, 1PV (6 vies après gain de vie). Deuxième corail : clear, aucune mort, 107,68 s simulées, 1PV/5vies ; a continué à pied après la perte d'Enguarde. Le test reste strict sur la victoire, le nombre de morts et les erreurs JavaScript. La réussite n'exige pas d'éviter tous les dégâts.

Données résumées : `reference/functional-tests-run.json`. Sortie complète de la commande : `reference/functional-tests-run.log`. Journaux et captures de jeu : `reference/canyon-playthrough*` et `reference/coral-playthrough*`. Résultat isolé du premier corail avec monture conservée : `reference/functional-coral-validation.json`.

## Limite indépendante de cette correction

`npm run build` a été tenté et reste bloqué par 112 diagnostics TypeScript dans la refactorisation déjà présente, dont `pick`/JSX/mocks des tests. Aucun diagnostic ne vise le nouveau test. Ce problème est distinct des tests fonctionnels ; ne pas annoncer compilation réussie. Log `/tmp/goonk-functional-build.log`.
