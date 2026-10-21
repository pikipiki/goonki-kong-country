# Carte principale et navigation directe — 21 octobre 2026

L’écran titre donne maintenant la priorité à **Explorer l’île**, avec le grand bouton doré et le focus clavier initial. Commencer/Continuer reste accessible en second choix. Le gestionnaire global laisse l’activation native d’un bouton avec Entrée.

La carte contient les sept destinations nommées directement sur leurs îlots. Les labels sont des boutons HTML projetés depuis les positions Three.js : souris, clavier, lecteur d’écran et tactile utilisent les mêmes destinations. Une sélection reste une sélection ; le bouton unique **Entrer dans l’étape** valide. Le nom choisi et sa région sont annoncés dans une zone `aria-live`. La liste de grandes cartes sous la carte a été supprimée.

À l’ouverture, la carte reçoit le focus : flèches changent d’étape, Début/Fin atteignent la première/dernière, Entrée lance l’étape sélectionnée. Chaque destination reste accessible à la tabulation et offre une cible d’au moins 44 pixels de haut. Toutes les étapes sont accessibles avec une progression vierge.

En portrait, le chemin se déploie verticalement ; en paysage, les îlots alternent sur deux rangées. Les labels conservent leur taille de texte et leurs zones tactiles. Les coordonnées des labels sont recalculées par la même caméra au redimensionnement. Les deux peluches parcourent le chemin entre la destination précédente et la sélection.

Validation `GAME_URL=http://127.0.0.1:5182 npm run test:map` : entrée depuis le titre avec Entrée, choix avec flèches/Début/Fin, clic/tap, validation bouton et Entrée, accès aux sept stages, aucune liste résiduelle, aucun débordement ou chevauchement des labels. Formats : 1000×900, 390×844, 320×640 et 844×390. Aucun `pageerror` ou message console de niveau erreur. Captures `reference/island-map-{desktop,portrait,portrait-small,landscape}.png` et `reference/island-explorer-title.png`.

Les labels utilisent le DOM React normal plutôt que `drei/Html`, pour éviter les racines React indépendantes et leurs avertissements au démontage sous React 19. Aucun comportement moteur ou sauvegarde n’est modifié par cette interface.
