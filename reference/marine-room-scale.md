# Lagon agrandi sans réduire les peluches — 21 octobre 2026

Le décor marin utilise une adaptation uniforme **×1,5 en X et Y**. Les peluches, montures, ennemis et leurs vitesses en unités monde gardent leur taille/réglage. Les couloirs sont donc 50 % plus larges et plus hauts, les distances entre ennemis augmentent et le joueur dispose de plus de marge de manœuvre.

`src/game/marineScale.ts` est l'unique définition du facteur. Le niveau généré expose `ROM_CORAL_SOURCE`, coordonnées numériques brutes à 32 pixels ROM par unité ; `ROM_CORAL = scaleCoralLevel(ROM_CORAL_SOURCE)` transforme les positions, limites de patrouille, dimensions des décors de collision et porte de sortie. Il conserve les 21 ennemis importés et les 2 Enguarde. Les données ROM `coral-terrain-v2.json` et `level-tables.json` restent intactes.

La géométrie `OriginalCoralGround.tsx` et les requêtes `originalCoralTerrain.ts` utilisent toutes deux **32 / 1,5 = 21⅓ pixels ROM par unité monde**. La culling des morceaux de récif prend en compte leur nouvelle largeur. Les bornes marines jouables sont `[-1.35, 80.85]` en Y, largeur géométrique 96, longueur du niveau 97.875 ; le départ devient `(19.5, 1.125)`, porte de sortie `(94.875,72)` et volume de sortie `4.8×6.75`.

Le générateur `generate_original_coral.py` conserve le wrapper d'adaptation, évitant de réintroduire l'ancien espace étroit lors d'une régénération. Les valeurs historiques `reference/underwater-motion.json.depthBandWeb` décrivent l'espace source avant cette adaptation ; le runtime doit utiliser les constantes `marineScale.ts` exportées aussi par `originalCoral.ts`.

Validation ciblée : TypeScript passe ; 27 tests dans `marine-import`, `original-terrain` et `coral-motion` passent. Le contrôle BFS trouve un chemin jusqu'à la sortie pour le nageur et pour Enguarde, avec vérification des mouvements balayés. Une vérification Three.js par rayons contrôle l'accord entre récif rendu, intervalles solides et eau libre ; un couloir source vérifié de 320 pixels (10 unités) mesure maintenant 15 unités monde. Cette adaptation ne constitue pas une nouvelle preuve d'échelle ou de gameplay fidèle à la SNES.
