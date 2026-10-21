# Coral Capers — parcours réel au clavier, 21 octobre 2026

Le niveau a été terminé dans le navigateur avec cinq vies conservées, zéro mort et un point de santé restant, en 183,52 secondes de simulation. Les 21 ennemis sont restés actifs et les dégâts n’ont pas été désactivés. Le personnage est entré par Explorer l’île et la carte, a ouvert la caisse d’Enguarde par contact, a chevauché l’animal puis l’a perdu lors d’un contact ennemi. La suite a été achevée à pied, avec récupération légitime du deuxième personnage depuis un tonneau.

Le pilote utilise les vraies touches du navigateur et la pause KeyP pour préparer son trajet. Il lit l’état de débogage pour choisir les commandes ; il n’écrit ni position, ni vie, ni invincibilité, ni horloge dans le jeu exécuté. Les copies du moteur utilisées pour comparer des directions sont isolées hors du navigateur. Ce résultat prouve un parcours entrée-sortie possible avec les collisions et ennemis actifs, pas la jouabilité de tous les chemins ou de tous les appareils.

Preuves : `coral-playthrough.json`, `coral-playthrough-start.json`, `coral-playthrough-complete.png`. Script : `scripts/playthrough-coral.mjs`. Une première tentative avec un contrôleur trop simple a échoué ; la réussite correspond au journal final de 183,52 s.
