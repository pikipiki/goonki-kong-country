# États joueur — observations supplémentaires USA Rev 2

Analyse statique ciblée, reproductible avec `python3 scripts/analyze_player_states.py`. Le script vérifie l'identité SHA-256 de la ROM fournie, ne la modifie pas et exporte les octets, offsets et décodages dans `reference/player-states.json`. Ce travail n'est pas une désassemblage complète ni une vérification image par image.

| Observation | Offset fichier Rev 2 | Constante |
| --- | --- | --- |
| Impulsion normale DK → Rose | `0x3EA7DA` | `$0700` = 1792 = 7 pixels/tick |
| Impulsion normale Diddy → Violette | `0x3EA7C5` | `$085A` = 2138 = 8,3515625 pixels/tick |
| Quantification d'angle du canon | `0x3FE907` | `(angle + 0x0AAA) & 0xF000`, puis échange des octets |

À 32 pixels par unité et 60 ticks par seconde, Rose reçoit 13,125 unités/s et Violette 15,6591796875 unités/s. Ces valeurs sont les impulsions initiales normales, distinctes des rebonds sur ennemis analysés précédemment. La hauteur totale dépend de la gravité et de la durée d'appui.

Le script normal DK appelle l'impulsion `$BEA7DA` depuis l'offset `0x3EA6B4` ; celui de Diddy appelle `$BEA7C5` depuis `0x3EB1CA`. Les signatures d'appel sont également vérifiées. Les animations comportent des poses préparatoires avant cette impulsion : l'appliquer immédiatement à l'appui reste une adaptation temporelle.

## Délais d'animation

Le producteur décode les séquences droites précédant les callbacks d'impulsion/libération, avec des bornes strictes et des assertions sur les durées. `animationPreparations` contient chaque pose, durée, offset et callback. Il n'exécute pas le code ROM.

| Action | Préparation décodée avant effet | Interprétation à vitesse d'animation normale |
| --- | --- | --- |
| Saut Rose | Une pose de durée 2 | 2 unités d'animation |
| Saut Violette | Deux poses de durée 1 | 2 unités d'animation |
| Lancer Rose | Onze poses de durée 2 | 22 unités d'animation |
| Lancer Violette | Durées 2 + 2 + 3 + 5 + 3 + 2 + 2 | 19 unités d'animation |

Le moteur d'animation initialise sa vitesse à `$0100` (`0x3E80B7`) puis la soustrait au compteur de pose à chaque mise à jour (`0x3E80E1`). Ces durées sont donc nominalement des nombres de mises à jour à vitesse normale. Elles ne sont pas des latences d'entrée mesurées : il reste à vérifier l'ordre des appels dans la frame, les changements de vitesse et les interruptions.

## Portage et lancer

Le contrôleur copie les boutons maintenus en `$7E`, les nouveaux appuis en `$80` (`0x3FB310`). Le test de Y maintenu (`$4000`, offset `0x3FB38C`) appelle la famille ramassage/roulade ; le chemin Y non maintenu appelle la libération d'objet. Avec un objet porté, ce second chemin lance l'animation de lancer ; au sol avec Bas maintenu, il demande la pose au sol (`0x3FBC4F`). L'animation de ramassage évite une pose prématurée.

L'original suit donc **maintenir pour porter, relâcher pour lancer**, avec Bas + relâchement pour poser. Un mode par clic peut conserver un portage verrouillé, mais c'est une adaptation d'accessibilité à distinguer du fonctionnement tactile ou clavier au maintien.

Le callback de lancer commun aux deux personnages, à `0x3E8EB8`, écrit :

- Vitesse horizontale initiale signée `$1000`, soit 4096 = 16 pixels/tick, ou 30 unités/s.
- Cible horizontale signée `$0380`, soit 896 = 3,5 pixels/tick, ou 6,5625 unités/s.
- Vitesse verticale `$FF00`, soit -256 = -1 pixel/tick, ou -1,875 unité/s.

L'initialisation très rapide et la cible plus basse sont deux valeurs distinctes. La trajectoire finale dépend encore de la décélération et des collisions spécifiques à l'objet. La Rev 2 appelle ensuite une routine de repositionnement de terrain `$B6FCFA` ; ce travail ne suppose pas que le tonneau soit un projectile générique avec trajectoire entièrement connue.

## Canons

| Observation | Offset Rev 2 | Valeurs |
| --- | --- | --- |
| Template de base | `0x35AAB7` | Multiplicateur `$0FF5=$0028` (40), compteurs de vol `$0FC1=$1010` |
| Quantification de direction | `0x3FE907` | `(angle + 0x0AAA) & 0xF000` |
| Lecture trigonométrique | `0x3CBD08` | Table `$BCBD20`, composante perpendiculaire à l'index +64 |
| Multiplication signée | `0x3FE938` | `signe(c) × ((abs(c) × multiplicateur) >> 2)` |
| Transfert des deux compteurs | `0x3FE646` | Octet haut vers `$1375` (gravité), bas vers `$13E9` (contrôle) |
| Temporisation du joueur projeté | `0x3F9675` | Tant que le compteur est non négatif : décrémenter ; gravité ou contrôle retardés |

La magnitude cardinale de la table est 255. Pour le template de base, cela donne `255 × 40 >> 2 = 2550` brut, soit 9,9609375 pixels/tick, ou **18,6767578125 unités/s**. Les seize vecteurs exacts sont exportés dans `cannonBaseTemplateVectors`. Les composantes diagonales proviennent des entiers de la table ; une normalisation trigonométrique flottante ne leur est pas strictement identique.

Les compteurs par défaut valent 16. La condition étant inclusive, ils restent non négatifs pendant **17 visites du gestionnaire**. Le joueur commence donc par une portion de vol sans gravité, tandis que les commandes sont temporairement retenues, puis la physique et les contrôles reprennent. L'ordre d'exécution et les collisions peuvent changer la durée visible depuis l'appui ; 17 visites ne constituent pas une mesure vidéo image par image.

Ces observations portent sur le **template de base**. Les scripts de placement et données de chaque canon peuvent remplacer le multiplicateur, les compteurs, l'angle, le mouvement ou d'autres propriétés. Les canons automatiques, rotatifs, mobiles et de transition ne sont pas tous validés par ces seules signatures.

## Limites de validation

Les signatures et séquences de préparation sont statiquement vérifiées dans la Rev 2 ; la suite exige une exécution contrôlée pour mesurer latence exacte, interruptions, collision des tonneaux et trajectoires des différents canons. Il n'y a pas de revendication de parité complète. Le producteur s'arrête si une signature attendue manque ou si le parseur rencontre une opération non prévue.

Navigation : [désassemblage communautaire DKC1](https://github.com/Yoshifanatic1/Donkey-Kong-Country-1-Disassembly), USA 1.0, utilisé comme carte et pour les noms. Toutes les signatures signalées comme vérifiées sont retrouvées dans la Rev 2 de l'utilisateur, sans supposer des adresses identiques entre versions.
