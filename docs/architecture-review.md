# Revue d’architecture — 22 octobre 2026

La refonte est dans `/Users/sevenone./Documents/git/goonk-country`.
Le point de départ était le commit `8f9d97e`, avec un arbre de travail propre.
Les modifications sont locales et ne sont pas encore commitées.

## Résultat

- **397 → 340 fichiers dans `src/`**, soit 57 fichiers de moins, malgré les
  nouvelles configurations et données JSON.
- Regroupement des petits fragments par responsabilité : HUD, commandes,
  déplacements, contacts ennemis, chargement des niveaux et modèles 3D.
- Suppression de quatre implémentations inaccessibles, du helper `pick` et de
  six scripts de migration devenus obsolètes. Les conditions utilisent la
  syntaxe JavaScript native et bénéficient du rétrécissement des types.
- Catalogue unique pour le moteur et la carte, et requêtes communes pour les
  terrains horizontaux. Les neuf tables extraites correspondent exactement aux
  métadonnées de référence. Les générateurs reproduisent maintenant les JSON.
- Réglages partagés nommés : caméras, cadence, charge des animaux, vies, choix
  des stages, silhouettes et textures. Les coordonnées artistiques restent
  proches de leurs modèles.
- API publique conservée via `src/game/engine.ts` et `src/game/levels.ts`.
  Guide d’extension, contribution, sécurité et modèle de pull request ajoutés.

## Performance et robustesse

Les intervalles marins sont mis en cache par pixel source dans un tableau borné
par la largeur du niveau. Les résultats sont immuables. Le même lot de
**100 000 requêtes** passe de **484,3 ms à 13,7 ms** sur cette machine, avec le
même contrôle de résultat (`982630`). Cette mesure porte uniquement sur ces
requêtes de collision.

La recherche d’appui évite des tableaux intermédiaires, les particules expirent
par compactage et la caméra recalcule sa projection lors des changements de zoom.
Les matériaux des particules sont libérés à la fermeture de leur scène.

Le JavaScript d’entrée compilé pèse environ **665 Ko**. Les scènes, la carte et
les modules 3D sont chargés à la demande. Une entrée directe dans une scène 2D
ne charge plus Three.js pour dessiner sa silhouette de secours : les mêmes
21 points sont précalculés et contrôlés par un test de parité.

Les erreurs TypeScript préexistantes ont été corrigées, y compris dans les
fixtures de tests. Les types applicatifs stricts restent actifs. Le script
`format` s’arrête maintenant si ESLint échoue.

## Revue et corrections supplémentaires

Un second passage a supprimé trois cycles apparus pendant le regroupement :
commandes du stick, chargement des ennemis et sélection des modèles ennemis.
`npm run check:architecture` vérifie maintenant les fichiers orphelins et les
cycles d’imports au runtime ; il est intégré à la CI.

Les contrôles visuels ont aussi révélé deux défauts d’indexation/dimension du
boss 2D : l’échelle explicite pouvait être ignorée, et les objets utilisaient
un indice global au lieu des identifiants de leur groupe d’animation. Ces deux
cas ont des tests de régression. Le chargement de l’atlas partagé a également
été rétabli pour les peluches de la carte 2D.

## Sécurité

Les sauvegardes sont bornées en taille et reconstruisent uniquement les scores
valides des stages connus. Les clés de prototype et les champs supplémentaires
sont écartés. Les coordonnées d’URL doivent être finies et bornées ; les
identifiants de stages invalides sont normalisés.

Une CSP de production limite les scripts et ressources à la même origine.
Les actions GitHub sont épinglées à des commits vérifiés, les jetons ont des
permissions limitées et le déploiement dépend du contrôle qualité réutilisable.
L’audit npm du 22 octobre signale **0 vulnérabilité connue sur 571 dépendances**.
Le contrôle ciblé de secrets n’a trouvé aucun candidat ni fichier `.env` suivi.
Voir `SECURITY.md` pour la portée et les limites de cette revue.

## Validation

Les derniers passages ont validé 465 tests Vitest dans 85 fichiers, les trois
scénarios E2E, le build TypeScript/Vite et le contrôle d’architecture
(340 fichiers, aucun orphelin et aucun cycle runtime).

Les onze scénarios fonctionnels ont passé, dont les parcours complets canyon
et corail : **zéro mort**, dégâts actifs. Les six cas mobiles de production ont
passé à la racine et sous `/goonki-kong-country/`, sans violation CSP.
Les contrôles du boss en 2D/3D et de son décor passent dans les deux orientations.

La dernière chaîne demandée est terminée sans erreur :

```sh
npm run format && npx eslint . --max-warnings 0 && npx vitest run && npm run test:e2e
```

Le contrôle d’architecture et les builds TypeScript/Vite passent également.
Les **12 cas mobiles de production** (six à la racine, six sous le préfixe Pages)
passent sans violation CSP. Le build laissé dans `dist/` utilise la racine locale.
Les régressions supplémentaires du boss, de son décor, du parcours 2D et du
hot reload passent. L’instance `Game`, son état et le tir du canon survivent au
rechargement du module qui contient effectivement la classe.

La revue finale ne laisse aucun problème identifié non corrigé dans le périmètre
contrôlé. Les tests mobiles utilisent Chrome/Chromium sur cette machine ; la CI
GitHub configurée et un téléphone physique feront l’objet de leurs propres
exécutions. Les avertissements de dépréciation de Three.js dans l’outillage
n’entraînent aucun échec.

Le récapitulatif lisible par machine est dans `artifacts/review/summary.json`,
avec les journaux des contrôles et l’audit des dépendances.

Les captures et journaux récents sont sous `artifacts/`, ignoré par Git ; les
99 fichiers de référence régénérés pendant la première vérification y ont été
conservés avant restauration de leurs versions historiques. Les faits ROM et
les sources générées restent versionnés.
