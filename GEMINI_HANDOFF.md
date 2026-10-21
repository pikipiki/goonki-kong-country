# Reprise Gemini — Goonk Country — 22 octobre 2026

## Demande utilisateur et priorité

L’utilisateur demande de corriger les bugs du jeu mobile, en gardant les peluches à leur taille actuelle. Dernier problème : dans **Mine Cart Madness**, le wagon rebondit sur un oiseau puis retombe directement sur une abeille, sans échappatoire. Il demande maintenant ce rapport pour que Gemini puisse continuer avant épuisement du crédit Codex.

**Les deux enchaînements identifiés sont corrigés et testés localement. La traversée intégrale du wagon jusqu’à l’écran de fin reste à vérifier. Ne pas annoncer que le niveau entier a été terminé.**

## Dépôt et état Git

- Dépôt canonique : `/Users/sevenone./Documents/git/goonk-country`.
- Dernier commit au début de cette correction : `c3abef3 Add optional 2D ROM jungle render mode alongside 3D.`
- Ce commit comprend les corrections des passes précédentes et une démo jungle 2D optionnelle. Préserver ces changements ; le jeu principal est toujours en Three.js / React Three Fiber.
- Modifications de cette passe **non commitées** : `src/game/engine.ts`, `src/game/routeSafety.ts`, `tests/route-safety.test.ts`, nouveau `tests/mine-bird-landing.test.ts`. Rapport, script navigateur et preuves ajoutés ensuite.
- Aucun commit/push effectué par Codex dans cette passe. Ne pas écraser les changements de l’utilisateur ou de Cursor.
- Serveur de développement habituel : `http://127.0.0.1:5174/`. Ne pas tuer le serveur de l’utilisateur ni démarrer un second serveur sur ce port.
- Dossier de travail Codex : `/Users/sevenone./Documents/Codex/2026-10-21/cre`. Son ancien sous-dossier `work/goonk-bugfix` est obsolète : **ne pas recopier son contenu sur le dépôt canonique**.

## Ce qui vient d’être corrigé dans le wagon

1. Deux formations de la source : oiseau x=106,28125 → abeille x=114,90625 ; oiseau x=404,34375 → abeille x=412,90625.
2. Le rebond normal pouvait croiser l’abeille, puis un appui court pouvait aussi manquer le prochain rail et tomber dans le trou. Déplacer seulement l’abeille ne suffisait pas.
3. `routeSafety.ts` : `mineBirdHasCloseBee` identifie les oiseaux suivis d’une vraie abeille à moins de 12 unités. `mineEncounterClearance` garde ces abeilles à leur X source mais les relève à au moins `bird.y + 5`, hors des solides, avec `hoverAmplitude=0`. Les 30 ennemis, dont 14 vraies abeilles, restent présents. Les données ROM de `originalMineCart.ts` ne sont pas modifiées.
4. `engine.ts` : dans ces deux enchaînements seulement, le rebond a une vitesse verticale minimale de 16 et `player.cartRebound=true`. Ce rebond conserve la gravité de saut tenu de Rose (`ROM.held[0]`) jusqu’au sol, pour une trajectoire cohérente avec les deux peluches même après un appui court. La vitesse du wagon reste 8,5. Les sauts normaux, tailles et ennemis des autres passages restent conservés.
5. `cartRebound` est remis à faux à l’initialisation, au retour de bonus, à la réapparition et à l’atterrissage ; hors wagon ou sur une monture il est désactivé.
6. `mineRecoveryLayout` migre les deux abeilles déjà instanciées dans une partie ouverte avant la correction. React Fast Refresh conservant l’instance `Game`, un simple correctif des coordonnées de spawn ne suffit pas. L’effet dans `App.tsx` qui actualise `Game.prototype` existait déjà : le préserver.

## Vérifications réellement faites

- **208 tests / 35 fichiers passent** après toutes les modifications ; `npm run build` passe ; `git diff --check` passe.
- `tests/mine-bird-landing.test.ts` : deux oiseaux × deux peluches × quatre phases de vol × trois durées de maintien (0, 21, 90 frames), soit 48 configurations de passage. Aucun dégât, cinq vies, rail retrouvé, drapeau de rebond effacé à l’arrivée.
- Autres régressions : les abeilles restent dangereuses au contact ; données source et X inchangés ; migration d’un ancien placement en mémoire.
- Navigateur réel : **8 cas**, portrait 390×844 / paysage 844×390, deux oiseaux et deux peluches. Placement de reproduction juste au-dessus de l’oiseau au départ ; ensuite runtime normal, aucun déplacement forcé, aucune invincibilité ni suppression d’ennemi. Tous les cas atterrissent : x≥124 pour le premier passage, x≥430 pour le second ; HP2, cinq vies, 30 ennemis et 14 abeilles encore présentes.
- Reproduction : `node scripts/mine-bird-browser.mjs` (Chrome installé sur macOS ; variables `GAME_URL` / `BROWSER_EXECUTABLE` possibles).
- Preuves : `reference/mine-bird-browser.json`, `reference/mine-bird-landing-106-portrait.png`, variantes paysage et x404. Copies dans le dossier `outputs/` du workspace Codex.
- Les captures sont prises après le rail retrouvé. Pour une preuve visuelle supplémentaire, capturer aussi le milieu du rebond près de x113 / x411.

## À faire ensuite, dans cet ordre

1. **Vérifier une traversée intégrale du wagon**, avec ennemis et dégâts actifs, en utilisant les vraies commandes. Les tests actuels prouvent les passages corrigés, pas la fin du niveau.
2. Une exploration automatique hors navigateur n’a pas trouvé de parcours complet et perd ses candidats près de **x≈360**. Cela peut venir du pilote ou de l’enchaînement local ; ce n’est pas une preuve d’impasse du jeu. Inspecter cette zone sans supprimer d’ennemi, sans invincibilité et sans modifier artificiellement la position pendant la traversée.
3. Le prototype de ce planificateur est sauvegardé dans `/Users/sevenone./Documents/Codex/2026-10-21/cre/outputs/mine-route-planner-experimental.mjs`. Il clone `Game` hors ligne, tente maintenir/relâcher le saut par blocs de six frames, avec une beam search. Son score/déduplication peuvent écarter les bons sauts. **Ce script ne constitue pas une preuve de traversée réussie.**
4. Contrôler les derniers enchaînements jusqu’à l’ennemi final vers x444 et au déclencheur de fin. Si un nouveau piège est prouvé, corriger localement les formations/trajectoires ; garder les tailles des peluches et les dégâts normaux.
5. Après toute modification, exécuter les tests pertinents et le build. Mettre à jour ce rapport et `CLAUDE_HANDOFF.md` avec les preuves et les limites. Ne pas annoncer une partie finie sans avoir vu son déclencheur de fin.

## Correctifs précédents à préserver

- Mobile : port d’un tonneau par appui puis second appui pour lancer, permettant de sauter avec les mains libres ; charges Rambi/Enguarde en deux appuis ; Expresso activable pour planer/battre des ailes.
- Enguarde : gros bouton **Attaque rapide** répétable à chaque appui, sans préparation (0,32 s, vitesse 7,5), distinct du bouton Charge (vitesse 18). L’attaque rapide annule une charge préparée. Test dédié `scripts/enguarde-quick-browser.mjs`.
- Bonus : scène séparée, entrée gauche bouchée à l’intérieur ; après sortie, `completedBonus` et `isBonusCompleted` condamnent aussi l’entrée extérieure, même sans récompense et après perte de vie. Le parcours principal reste praticable devant cette porte. Recommencer le niveau réinitialise les bonus.
- Canons : flèches en géométrie 3D, angle quantifié identique au tir, 50 canons importés au Canyon. Les sprites fixes ↗ ont été retirés. Test `scripts/cannon-directions-browser.mjs`.
- Canyon : bloc suspendu x=[26,28), y=[9,53125,10,5] retiré du rendu et des collisions via `canyonTerrain.ts`, sans altérer la référence ROM.
- Carte : sept niveaux accessibles librement, noms directement sur la carte, navigation clavier et un bouton de validation.
- Peluches : tailles **2,2 / 2,05 à conserver**. Roulade Rose plus rapide, Violette ancienne vitesse Rose ; élan du saut après roulade conservé.
- EN/FR persistants et démo 2D jungle optionnelle à préserver. Lire `CLAUDE_HANDOFF.md` pour l’historique et les limitations de fidélité ROM/audio. Ne pas présenter le jeu comme une émulation complète de toute la ROM.

## Commandes utiles

```sh
cd /Users/sevenone./Documents/git/goonk-country
export PATH="/Users/sevenone./.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH"
npm test
npm run build
node scripts/mine-bird-browser.mjs
npm run test:mechanics
npm run test:mobile
```

Les tests navigateur supposent le serveur de développement déjà lancé sur 5174. Les anciens pilotes Canyon/Coral et leurs preuves sont dans `scripts/playthrough-*.mjs` et `reference/*playthrough*`. Ils peuvent servir de base pour un pilote wagon, mais leur réussite ne prouve rien pour le wagon.
