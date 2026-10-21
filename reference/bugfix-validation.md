Lire aussi `decor-import-fixes.md` : il prévaut sur les anciennes mentions de compression marine ou de grotte dans ce rapport.

# Validation des correctifs de jouabilité

Date : 21 octobre 2026. Dépôt : `/Users/sevenone./Documents/git/goonk-country`.

Le handoff prioritaire Claude 0.4.0 a été lu avant les modifications. Les parcours ROM Jungle/Reverb/Mine Cart/Coral, imports et audio existants sont préservés. Aucun commit ni publication n’a été demandé ou effectué pendant cette passe.

## Corrections

- Carte : sélection et entrée dans chacune des sept étapes sans progression préalable.
- Sols ROM : collision avec les volumes visibles, balayage des murs et plafonds, suppression de la chute artificielle sur le rebord jungle rendu solide. Faces supérieures des grottes/wagon et faces avant du récif rendues correctement. Résolution visuelle identique aux profils par pixel.
- Ennemis : supports et pentes, gravité, demi-tour aux trous ; disparition définitive des modèles morts. Culling sur le vrai cadrage pour éviter les apparitions à l’intérieur de l’écran.
- Eau : déplacement horizontal/vertical, suppression des collisions répétées à des profondeurs sans récif, spawn/respawn dégagé, fond visible, accès à la gauche de l’entrée. Les positions marines compressées qui intersectent le décor sont ajustées à l’exécution.
- Boss : rebond sans dégât sur sa tête pendant une descente ; sa fenêtre de récupération détermine toujours la perte de ses points de vie. Contact latéral dangereux conservé.
- Redémarrage : tous les modèles suivent les nouveaux objets de simulation, même pour la même étape.
- Tonneaux et animaux libérés : supports réels ; les animaux continuent leur chute après la fuite. Dégagement de tête sous l’eau pour Enguarde.
- Petits téléphones : le groupe de boutons reste dans la largeur disponible.

## Contrôles reproductibles

Avec Node 24 et le serveur local actif :

```sh
npm test
npm run build
npm run test:browser
npm run test:map
npm run test:mobile
npm run test:stages
```

`GAME_URL` permet de changer l’adresse cible.

143 tests unitaires passent dans 26 fichiers. Ils couvrent les patrouilles dans les différents environnements, la nage aux différentes profondeurs et depuis l’entrée, les collisions avec les récifs visibles, les supports des tonneaux/animaux et le boss. Des rayons Three.js vérifient les surfaces réelles des maillages Jungle, Reverb et Mine Cart.

Le script `test:stages` vérifie les sept étapes depuis une sauvegarde neuve dans les deux orientations, les identités des modèles après rechargement et la disparition des modèles morts pendant plusieurs frames. Les morts et redémarrages y sont préparés pour isoler le rendu.

Les essais navigateur couvrent Chrome sur macOS, avec émulation tactile et six dimensions : 390×844, 844×390, 320×568, 430×932, 932×430 et 768×1024. Ils vérifient multi-touch, mode clic, arrêt, pause/reprise, rotation et transitions de scène. Ils ne remplacent pas une partie humaine complète ni des essais Safari iOS/Android sur appareils physiques.

## Limites de fidélité à préserver dans la reprise

La projection verticale des positions Coral reste comprimée et certains objets importés peuvent encore demander une adaptation de placement ou un vrai décodage de la carte marine. Le déplacement et les contacts sont testés sur le décor présent ; aucune nouvelle parité complète avec la ROM n’est revendiquée. Les niveaux prototype et la fin du port complet restent distincts de cette passe de correction. Voir `CLAUDE_HANDOFF.md` pour les priorités ROM conservées.
