# Analyse ciblée des montures et roulades — ROM USA Rev 2

Ce document décrit des observations **locales et vérifiées dans les octets** de la ROM fournie. Il ne constitue pas une rétro-ingénierie complète ni une validation image par image. Les noms des états viennent de la désassemblage communautaire USA 1.0 utilisée comme carte de navigation ; ses adresses ne sont pas supposées identiques à la Rev 2.

Reproduction : `python3 scripts/analyze_buddies.py '/chemin/Donkey Kong Country (USA) (Rev 2).zip'`. Le script lit la ROM sans la modifier et écrit `reference/buddy-analysis.json`. SHA-256 attendue : `628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527`.

Les vitesses brutes sont des nombres signés 8.8 : diviser par 256 donne des pixels SNES par tick. Passer aux unités du jeu web et aux secondes exige un choix d'échelle explicite. Les valeurs de cible ci-dessous peuvent encore subir des modificateurs d'état et de personnage ; elles ne sont pas des maxima universels mesurés.

| Observation | Offset fichier Rev 2 | Valeurs décodées |
| --- | --- | --- |
| Cible de course selon monture | `0x3FB581` | Rambi/branchement par défaut : 896 = 3,5 px/tick ; Winky : 768 = 3 ; Expresso : 1024 = 4 |
| Cible de marche selon monture | `0x3FB5BC` | Rambi/branchement par défaut et Winky : 512 = 2 px/tick ; Expresso : 768 = 3 |
| Initialisation de roulade | `0x3FBDA1` | 256 = 1 px/tick ; avec direction maintenue : 768 = 3 |
| Bonus de départ récent de course | `0x3FBDB4` | Comparaison de compteur avec 16 ; vitesse 1024 = 4 quand la condition est remplie |
| Différence roulade/cartwheel | `0x3FBDDC` | Pour l'index de sprite différent de 2 : `v += v >> 3`, soit environ ×1,125, arrondi entier |
| Accélération de chaîne | `0x3FBE3F` | Ajout de 256 = 1 px/tick à l'accumulateur ; plafond 2048 = 8 |
| Saut après sortie de plateforme en roulade | `0x3FB977` | États 0x12/0x13/0x19 : saut vers la préparation de saut sans passer par les vérifications de sol ordinaires |
| Entrée de flutter Expresso | `0x3FBAA0` | Vitesse verticale +1024 = 4 et repositionnement vertical de 24 px avant animation |
| Gravité de saut avec monture terrestre | `0x3FBA54` | Paramètre -72 = -0,28125 px/tick² ; demande d'animation montée 0x2E |
| Entrée de coup d'épée Enguarde | `0x3F98DB` | Vérifie animation 0x3D, dispatch du groupe d'attaque 0x3A, annule vitesse verticale, état 0x4C |
| Impulsion de saut Rambi / Expresso | `0x3EA7EF` / `0x3EA7FD` | 1792 = 7 px/tick, après la préparation d'animation |
| Impulsion de saut Winky | `0x3EA80B` | 2048 = 8 px/tick, après la préparation d'animation |
| Impulsion d'attaque Enguarde | `0x3EBC17` | Vitesse et cible horizontales ±1024 = ±4 px/tick selon orientation ; état 0x4D |
| Sélection de gravité aérienne | `0x3FAF81` | Flag 0x0002 présent : paramètre `$16F9,Y` ; sinon -112 ; vitesse terminale -2048 |

Le JSON contient pour chaque observation la séquence exacte, les adresses HiROM correspondantes et le décodage manuel 65C816. Un désassembleur 6502 ne suffit pas pour justifier ces instructions à registres et opérandes 16 bits.

## Conséquences pour l'adaptation

- Une roulade doit porter un état et un élan propres. La fenêtre de saut après la plateforme dépend de cet état ; les octets vérifiés n'établissent pas une grâce générique arbitraire.
- Une chaîne de roulades augmente l'élan. La durée exacte et les événements de collision qui atteignent cette routine demandent encore une trace d'exécution.
- Les animaux ne sont pas des habillages du personnage : leurs vitesses et états diffèrent. La course d'Expresso est plus rapide et Winky ne partage pas la même cible de course que Rambi.
- Le +4 vertical de l'entrée du flutter ne doit pas être interprété comme une limite permanente de chute. Son continuation dépend du script d'animation et de la physique.
- L'entrée d'attaque d'Enguarde annule la vitesse verticale. Son animation appelle ensuite l'impulsion horizontale signée de 4 px/tick. La durée complète du coup reste à vérifier.
- Les appels d'animation des sauts ont été vérifiés directement : `81 ef a7 be` à `0x3EC139`/`0x3EC1B1` (Rambi), `81 fd a7 be` à `0x3EC9E5`/`0x3ECACF` (Expresso), `81 0b a8 be` à `0x3EC570`/`0x3EC698` (Winky). Ils exécutent les sous-routines d'impulsion ci-dessus après des poses préparatoires ; une application immédiate dès l'appui reste donc une simplification temporelle.
- À l'échelle choisie par le jeu web (32 px/unité, 60 ticks/s), ces impulsions correspondent à 13,125 unités/s pour Rambi et Expresso, 15 pour Winky, 7,5 pour le coup d'Enguarde. La hauteur totale dépend encore de la gravité, de l'appui maintenu et des collisions.
- Le paramètre de gravité -72 établi par le saut monté est utilisé par le sélecteur aérien tant que son flag persiste ; cela correspond à -31,640625 unités/s². Sans ce flag : -112, soit -49,21875 unités/s². Il n'est pas nécessaire d'inventer une gravité spéciale à Winky pour obtenir son saut plus haut : son impulsion 8 px/tick, contre 7 pour les deux autres montures terrestres, et cette gravité montée commune suffisent. Une trace reste nécessaire pour confirmer les durées exactes.

## Limites et suite

Les hauteurs et délais exacts des sauts montés, le flutter soutenu d'Expresso, la durée du coup d'Enguarde, les trajectoires après dommage/démontage, les collisions de monture et la totalité des niveaux originaux ne sont pas entièrement retracés ici. Ils doivent être annoncés comme adaptation tant qu'ils ne sont pas confirmés. Pour la suite : suivre les scripts d'animation montés, puis exécuter des séquences contrôlées dans un émulateur avec capture de position/vitesse/état, et comparer les mêmes séquences à la simulation web.

Source de navigation : [Donkey Kong Country 1 Disassembly](https://github.com/Yoshifanatic1/Donkey-Kong-Country-1-Disassembly). Le manuel original complète la description des gestes joueur, sans fournir les constantes de mouvement. Aucun contenu ROM graphique, sonore ou exécutable n'est incorporé par ce script à l'application.
