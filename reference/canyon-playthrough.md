# Barrel Cannon Canyon — parcours réel au clavier, 21 octobre 2026

**Terminé sans mourir**, en 49,28 secondes de simulation. Cinq vies conservées, deux HP à l’arrivée, phase `clear`. Les 35 ennemis initiaux et les dégâts sont restés actifs ; 18 ennemis étaient encore vivants à la fin. Toutes les valeurs de vies enregistrées sont égales à cinq. Le second personnage a été récupéré normalement dans un tonneau après une blessure ; le résultat ne signifie donc pas zéro contact ennemi.

Le parcours a été exécuté par les vraies commandes clavier du navigateur, depuis Explorer l’île et la carte. KeyP sert à préparer les commandes dans des copies isolées du moteur. Le jeu du navigateur ne reçoit aucune écriture de position, vie, invincibilité, ennemi ou horloge. Cette méthode comporte des pauses de préparation et ne prétend pas être une partie humaine en temps continu.

La réussite correspond à la version contenant **50 canons**, après import de six groupes auparavant omis : 14 canons et quatre Zingers. Les offsets et la provenance sont conservés dans `canyon-groups-evidence.json`. Les tentatives `attempt*-pre-groups` et les essais antérieurs concernent une version incomplète ; leurs chutes et blocages ne sont pas comptés comme des réussites.

Preuves : `canyon-playthrough.json`, `canyon-playthrough-final.png`, `canyon-playthrough-rules.json`. La capture finale est prise à l’instant de déclenchement de la sortie, avant le rafraîchissement de l’écran récapitulatif. Le serveur 5174 servait les sources canoniques via Vite en développement ; le build de production a été vérifié séparément.

Rejouer : `npm run test:playthrough:canyon` depuis le dépôt, avec le jeu sur 5174. `GAME_URL` et `BROWSER_EXECUTABLE` permettent de changer l’URL et Chrome. Ce test coûte quelques minutes de préparation et termine avec un code non nul s’il reste incomplet ou perd une vie.
