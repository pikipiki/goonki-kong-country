# Choix techniques, direction artistique et interaction mobile

## Décision : conserver Three.js + React Three Fiber

Le jeu demande de vrais volumes, des matières, un éclairage de jungle et des personnages 3D. Le moteur de simulation à pas fixe existe déjà séparément du rendu.

| Option étudiée | Décision pour ce projet |
| --- | --- |
| Three.js / React Three Fiber | Conservés : réutilisation des peluches, matériaux et scène 3D ; rendu regroupé pour le mobile. |
| Phaser 3 | Excellent candidat pour une reconstruction 2D avec sprites. Sa migration nécessiterait ici de réintroduire un rendu 3D tiers et de remplacer les systèmes déjà opérationnels. |
| React Spring | Bibliothèque d’animation pouvant compléter R3F. Elle ne remplace pas son moteur 3D. Les déplacements du jeu restent déterministes ; la caméra est amortie directement et les états d’appui utilisent des transitions CSS. |

Sources primaires consultées : [Phaser — documentation](https://docs.phaser.io/), [Phaser 3.89](https://phaser.io/v389), [React Spring et R3F](https://www.react-spring.dev/docs/guides/react-three-fiber), [performance R3F](https://r3f.docs.pmnd.rs/advanced/scaling-performance). Ce choix est une décision d’architecture pour ce jeu, pas un benchmark comparatif des trois bibliothèques.

## Interface mobile

Les [recommandations Apple sur les commandes de jeu](https://developer.apple.com/design/human-interface-guidelines/game-controls) ont guidé le placement sous les pouces, la réduction des recouvrements, les états d’appui, les zones système et les tailles de cible.

- **Portrait :** une zone réservée de 228 px pour la manette, sous la scène. Les doigts ne couvrent pas le terrain. Le cadrage expose au moins 12,8 unités du monde pour voir les réceptions de saut.
- **Paysage :** champ large, direction à gauche, actions à droite ; HUD compact en haut.
- **Tactile :** joystick glissé, marche près du centre, course vers les bords ; boutons maintenus pour contrôler la hauteur du saut. Déplacement vertical du joystick dans le lagon.
- **Clic seul :** un clic sur une flèche maintient la direction ; re-cliquer ou utiliser le bouton central l’arrête. Un clic de saut déclenche une impulsion maintenue 350 ms. L’action et le changement de personnage restent accessibles à la souris.
- Les actions principales disposent d’au moins 44 × 44 px CSS. Les boutons saut et action sont plus grands. Les commandes secondaires du HUD compact respectent un minimum de 28 px.
- Les contrôles utilisent Pointer Events, la capture de pointeur et plusieurs sources d’entrée indépendantes. Annulation, rotation et perte de focus libèrent les entrées. Le mode clic reste mémorisé entre les pauses.
- Pas de verrouillage d’orientation. `dvh`, `viewport-fit=cover` et `safe-area-inset-*` suivent les barres mobiles et les encoches. Un manifeste permet le lancement autonome avec orientation libre ; aucun mode hors ligne n’est revendiqué.

## Direction artistique

L’orientation visuelle reprend les contrastes du jeu SNES : jungle dense, sous-bois sombre, feuilles vert olive, terre ocre, bois vieilli et objets dorés lisibles. La référence est le jeu original, notamment les [captures de Donkey Kong Country](https://www.mobygames.com/game/5199/donkey-kong-country/screenshots/). Les objets restent des maillages 3D, sans sprites SNES utilisés comme modèles.

La végétation possède des feuilles courbées et nervurées, de l’écorce, plusieurs plans de profondeur, des racines et des falaises irrégulières. L’interface reprend une signalétique d’aventure dorée, plus proche du ton du jeu original que la typographie éditoriale précédente.

### Bananes et bestiaire

La banane est un maillage effilé à cinq arêtes, courbure asymétrique, faces colorées, tige et pointe sombre. Elle oscille légèrement plutôt que de disparaître de profil lors d’une rotation complète.

| Famille originale | Réinterprétation 3D |
| --- | --- |
| Gnawty | Rongeur brun, grandes incisives, museau, oreilles, pattes et queue plate. |
| Kritter | Crocodile bipède, long museau, ventre segmenté, dents, griffes et crête dorsale. |
| Klump | Silhouette plus massive, casque olive, uniforme violet et mâchoire reptilienne. |
| Zinger | Guêpe à bandes, antennes, dard, six pattes et ailes animées. |
| King K. Rool | Crocodile royal ventru, couronne, cape et ventre doré. |

Les échelles visuelles et les dimensions des corps de collision sont regroupées dans `src/game/enemies.ts`. Les queues, ailes et antennes sont des appendices visuels plutôt que des extensions de la zone de contact. Les yeux sont orientés vers l’extérieur des deux côtés pour rester visibles pendant les demi-tours.

## Coût du rendu

Feuilles, troncs, rochers, racines, planches, particules et ombres de contact utilisent des instances. Les portions de décor éloignées sont masquées. Le pixel ratio est plafonné à 1,35 et baisse à 1 si le budget de temps se dégrade. En pause et dans les menus, le canvas ne tourne plus continuellement.

Les mesures enregistrées par les tests Chrome sont des observations sur le poste de développement avec émulation mobile. Elles ne garantissent pas un nombre d’images par seconde sur un téléphone physique ; iOS Safari et du matériel Android doivent encore faire l’objet d’une validation sur appareil.
