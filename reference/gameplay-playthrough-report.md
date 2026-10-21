# Vérification des parcours — Goonk Country, 21 octobre 2026

## Résultat établi

Coral Capers a été terminé au clavier dans le navigateur en 183,52 secondes de simulation, avec cinq vies conservées, zéro mort et un HP restant. Les 21 ennemis et les dégâts étaient actifs. Enguarde a été libéré puis chevauché ; après un contact ennemi, le parcours a continué à pied. Le second personnage a été récupéré normalement dans un tonneau.

Barrel Cannon Canyon a aussi été terminé sans mourir en **49,28 secondes**, avec cinq vies et deux HP à l’arrivée. La version testée comporte 50 canons et 35 ennemis initiaux, avec dégâts actifs ; 18 ennemis sont encore vivants à la fin. Les tentatives précédentes ont permis d’identifier les blocages puis ne sont pas comptées comme des réussites.

## Corrections vérifiées

- **Six groupes omis de la ROM rétablis** : 18 acteurs, dont 14 canons et quatre Zingers. Le nombre de canons passe de 36 directs à 50 au total. Les listes enfants sont décodées après leur en-tête nul, avec provenance des parents et sans réordonner les indices directs.
- Déplacement borné des canons mobiles, commun au rendu et à la physique. Les propriétés et signatures sont conservées dans `cannon-motion-evidence.json` ; il ne s’agit pas d’une reproduction de tous les états et timings SNES.
- Élan conservé lors d’un saut lancé depuis une roulade. Freiner ou inverser la direction reste possible ; l’élan est remis à zéro au sol, sur mur, dégât, entrée dans un canon, monture ou bonus. Les deux peluches franchissent le vrai trou entre les branches x90,7 et x99 dans un test physique ciblé. Les tailles 2,2 / 2,05, la course et les sauts normaux ne changent pas.
- Capture des canons avec une bande verticale couvrant le corps, au lieu d’une proximité des pieds seule.
- Libellé accessible de la jauge de charge rétabli en EN/FR. Les tests utilisant des textes français sélectionnent maintenant explicitement cette langue.

## Méthode du parcours réel

Les pilotes emploient les touches Playwright dans le navigateur et le bouton de pause normal KeyP. L’état de débogage est lu pour préparer les commandes ; des copies isolées du moteur comparent des trajectoires. Aucun déplacement, aucune vie, invincibilité, horloge ou suppression d’ennemi n’est écrit dans le jeu navigateur. La pause et les calculs externes rendent cette méthode différente d’une partie humaine en temps continu. Les essais ciblés qui préparent une scène dans des tests sont distingués de ces parcours réels.

Le pilote Canyon s’appuie sur des commandes de parcours pour la branche haute et peut revenir vers le canon vertical après avoir pris la branche basse. Le maintien de saut à travers des pauses demande de gérer les appuis : répéter une nouvelle pression sur chaque reprise peut relancer un saut à l’atterrissage. Cette difficulté du pilote n’est pas présentée comme un nouveau bug du jeu.

## Validation actuelle

- 191 tests, 32 fichiers : passent ; TypeScript et build Vite passent.
- Carte : 7 stages accessibles, noms sur la carte, clavier/souris/tactile et bouton de validation ; quatre formats dont 320×640, sans chevauchement de labels ni erreur console.
- Mobile : six formats, multitouch, mode clic, rotation, pause et sept transitions passent. Diagnostic de la dernière passe : environ 58 images/s, DPR 1,35.
- Mécaniques : 14 contrôles sur deux orientations, charges Rambi/Enguarde, nage verticale, flutter Expresso et bonus entrée/retour passent.
- Stages : sept stages × deux orientations, redémarrage et disparition des ennemis ordinaires morts passent. Le boss final reste un cas de fin de partie distinct.

## Preuves et reprise

`coral-playthrough.json`, `coral-playthrough-complete.png`, `coral-playthrough.md` ; `canyon-playthrough-attempt*.json` pour les essais intermédiaires. Le résultat final réel est `clear`, `deaths:0`, `lives:5`, `hp:2`, `cannonCount:50`. Le JSON et les règles du parcours permettent de contrôler cette affirmation. `CLAUDE_HANDOFF.md` précise l’état de reprise.

## Limites

Les deux parcours établissent une traversée entrée-sortie avec ennemis et collisions actifs, pas l’absence de tout bug sur tous les chemins. Les trajectoires des Zingers de groupes restent une adaptation locale ; le timing natif d’activation des groupes, les rotations et les automatismes des canons ne sont pas tous reproduits image par image. Les modèles et les bonus demeurent des adaptations 3D.
