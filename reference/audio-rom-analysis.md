# Audio — investigation statique de la ROM USA Rev 2

Cette passe lit la ROM fournie, sans modifier le jeu web et sans redistribuer ses banques audio. Les noms de morceaux viennent du désassemblage public USA 1.0 ; les adresses, tailles, en-têtes, signatures et sommes SHA256 viennent des octets de la **Rev 2 réelle**. Les différences entre versions ont été conservées au lieu de supposer leurs adresses interchangeables.

## Reproduction

```sh
python3 scripts/analyze_audio_rom.py '/Users/sevenone./Downloads/Donkey Kong Country (USA) (Rev 2).zip'
```

Bibliothèque standard Python uniquement. Le script ouvre le ZIP en lecture seule, vérifie un unique membre ROM et la SHA256 exacte, recherche des signatures uniques puis reconstruit le rapport `reference/audio-rom-analysis.json`. Il refuse une autre révision. Aucune extraction de ROM ou de musique n'est écrite. Le JSON contient les SHA256 et offsets précis de chaque région identifiée.

ROM : `628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527`, 4194304 octets, révision 2.

## Chargeur et processeur sonore

| Élément | Offset fichier Rev 2 | Destination ARAM | Taille |
|---|---|---|---|
| Bootstrap SPC700 | `0x0AA342` | `$04B8` | 40 octets |
| Pilote principal | `0x0AA372` | `$04E8` | `$0D7B` = 3451 octets |
| Entrée du pilote | `0x0AA472` | `$05E8` | — |
| Chargeur CPU du bootstrap | `0x0AB0ED` | Ports APU `$2140–$2143` | Voir JSON |
| Configuration du chargement du pilote | `0x0AB133` | `$04E8` | Voir JSON |
| Effets sonores globaux | `0x092D95` | `$2380` | 3622 octets + 4 d'en-tête |

La zone zéro de 256 octets au début du pilote est conservée dans sa taille de transfert. Les adresses CPU `$8Axxxx` et `$CAxxxx` sont des miroirs HiROM de la même région ROM, pas deux pilotes.

Le bootstrap Rev 2 compare deux lectures successives de `$F4` avant de traiter une commande et deux lectures de `$F5` avant de prendre l'octet de données. Son octet d'acquittement est à `$04DE`. Ces boucles supplémentaires apparaissent directement dans les octets `E4 F4 64 F4 D0 FA` et `E4 F5 64 F5 D0 FA`. La version 1.0 de navigation utilisait `$04D6`, une destination pilote `$04E0`, une entrée `$05E0` et une taille `$0D7E` : reprendre ces valeurs sans contrôle donnerait une reconstruction incorrecte.

Le chargeur CPU attend la signature APU `$BBAA`, écrit `$04B8` au port d'adresse et `$01CC` aux ports de contrôle/données, puis envoie 40 octets du bootstrap. La routine principale de transfert ajoute 4 à l'adresse source : le pointeur `$8AA36E` dans sa configuration correspond donc au début réel `$8AA372`. La boucle de transfert envoie des octets à `$2141`, l'adresse destination à `$2142`, puis bascule le compteur/bit d'acquittement de `$2140`.

## Échantillons BRR

La table runtime à `0x09FF00` contient **70 pointeurs de 24 bits**. Chaque pointeur cible deux mots petits-boutistes : offset de boucle en octets puis taille transférée, suivis de données BRR. Le JSON conserve les 70 en-têtes et les 70 empreintes de payload : **73787 octets transférés au total**.

Chaque bloc BRR complet contient 9 octets et produit 16 trames mono. Les 70 flux ont leur bit END sur le dernier bloc complet et aucun bit END sur les blocs précédents. Les offsets de boucle sont alignés sur 9 et restent à l'intérieur des blocs complets. 32 échantillons ont le bit LOOP du dernier bloc positionné. **68** transferts contiennent un octet de plus que leurs blocs BRR complets ; les échantillons `$10` et `$1A` ont une taille multiple de 9. Le rôle sonore de cet octet supplémentaire n'est pas établi ; un décodeur doit s'arrêter au bloc END plutôt que d'inventer un bloc incomplet.

Le début de la table est `00 00 C7 39 0E C7 6D 24 C7 ...`, soit des conteneurs aux adresses `$C70000`, `$C70E39`, `$C7246D`, etc. Les premiers en-têtes effectifs sont `00 00 35 0E` et `00 00 30 16`. Il ne s'agit pas de simples identifiants recopiés du source.

Deux structures de sélection d'instruments ont également été validées : une liste globale terminée par `$FFFF` à `0x0AB24A` et une table de **28** pointeurs 16 bits à `0x0AB212`, chacun vers une liste de numéros BRR. Tous les numéros sont inférieurs à 70 et toutes les listes se terminent. Il existe 28 jeux d'instruments pour 27 identifiants musicaux : la relation exacte dépend des appelants et n'est pas démontrée par ce seul parsing.

## Musiques

La table runtime à **`0x0AB15E`** contient 27 pointeurs de 24 bits. Chaque conteneur commence par `LE16 taille du payload` puis `LE16 destination ARAM`. Les 27 destinations vérifiées sont **`$12A0`**. Le premier groupe de huit mots du payload est conservé comme pointeurs de canaux candidats ; leur exécution reste à tracer. Le pilote, les effets globaux et les banques BRR doivent être chargés aussi : les morceaux ne sont pas des fichiers audio autonomes.

| ID runtime | Nom annoté depuis le source | En-tête fichier | Payload, octets | ARAM |
|---|---|---|---|---|
| 0 | DKIslandSwing | 0x0A9361 | 4061 | 0x12A0 |
| 1 | CaveDwellerConcert | 0x090000 | 2100 | 0x12A0 |
| 2 | MistyMenace | 0x090838 | 1863 | 0x12A0 |
| 3 | AquaticAmbience | 0x0A8000 | 3169 | 0x12A0 |
| 4 | MineCartMadness | 0x093BBF | 4262 | 0x12A0 |
| 5 | NorthernHemispheres | 0x091CF8 | 4249 | 0x12A0 |
| 6 | VoicesOfTheTemple | 0x1F1650 | 3056 | 0x12A0 |
| 7 | FearFactory | 0x090F83 | 3441 | 0x12A0 |
| 8 | LifeInTheMines | 0x23CDA7 | 2560 | 0x12A0 |
| 9 | TitleTheme | 0x13D88C | 2595 | 0x12A0 |
| 10 | SplashScreenFanfare | 0x2A0000 | 519 | 0x12A0 |
| 11 | IceCaveChant | 0x3095BE | 3020 | 0x12A0 |
| 12 | SimianSegue | 0x016B84 | 2354 | 0x12A0 |
| 13 | ForestFrenzy | 0x050000 | 2318 | 0x12A0 |
| 14 | CreditsConcerto | 0x1FDBB4 | 1486 | 0x12A0 |
| 15 | GameOver | 0x340000 | 467 | 0x12A0 |
| 16 | BonusRoomBlitz | 0x1BF5D8 | 2141 | 0x12A0 |
| 17 | DeathMusic | 0x210000 | 481 | 0x12A0 |
| 18 | Victory | 0x2E1476 | 867 | 0x12A0 |
| 19 | TreetopRock | 0x05EBC6 | 2840 | 0x12A0 |
| 20 | FunkysFugue | 0x060000 | 2421 | 0x12A0 |
| 21 | BadBossBoogie | 0x29C6A4 | 4148 | 0x12A0 |
| 22 | CandysLoveSong | 0x31BB58 | 1899 | 0x12A0 |
| 23 | CrankysTheme | 0x0A8C65 | 1784 | 0x12A0 |
| 24 | GangplankGalleon | 0x022ECC | 3935 | 0x12A0 |
| 25 | Failure | 0x13E2B3 | 2595 | 0x12A0 |
| 26 | BeatLevel | 0x13E789 | 564 | 0x12A0 |

## Sélection utile à un émulateur

Le code Rev 2 à `0x3990CE` écrit le morceau dans **WRAM `$0523`**, appelle `$8AB1CB`, écrit `1` à **`$051D`** puis envoie la commande `$00FE` par `$8AB1AF`. La routine voisine remet ces champs à zéro et envoie `$00FF` pour arrêter. Une simple modification de `$0523` ne force donc pas le chargement d'une chanson.

Dans le menu de choix de fichier, le code à `0x00F94C` vérifie le bit **`$0008` de WRAM `$056B`** pour activer le test musical. Un appui Select (bit `$2000` des boutons nouvellement pressés à `$0504`) transmet le mot de page directe **`$007A`** à `$B99049`, puis l'incrémente modulo 27. Une capture runtime peut donc : attendre le menu adéquat, conserver les autres bits et activer le flag musical, choisir `$007A` entre 0 et 26, puis presser Select. Ce chemin est vérifié statiquement, mais le contexte de menu et l'effet sonore doivent être confirmés dans l'émulateur. Tous les octets de ces deux chemins figurent dans le JSON.

IDs utiles : `0` jungle/DKIslandSwing, `3` AquaticAmbience, `4` MineCartMadness, `24` GangplankGalleon. Les labels demeurent des annotations de navigation ; la capture sonore déterminera leur correspondance perceptuelle réelle.

## Lecture et suite recommandée

FFmpeg est installé localement, mais ses formats/décodeurs annoncés ne proposent ni SPC ni BRR. Aucun logiciel n'a été installé par cette passe. Le pipeline Snes9x/libretro compilé par l'agent principal peut exécuter la ROM réelle et collecter du PCM : c'est la prochaine preuve utile pour comparer les sons, le rythme et les transitions, plutôt que de prétendre que le synthétiseur générique actuel reproduit cette bande sonore.

Pour une reconstruction autonome fidèle : capturer au moins jungle, eau, wagonnet, bonus, boss et une transition ; obtenir des instantanés ARAM/DSP ; tracer la sélection des instruments ; décoder les commandes des séquences SPC700 ; reproduire enveloppes ADSR/gain, pitch, rééchantillonnage, echo FIR et timing. Un décodage BRR seul ne reconstitue ni une chanson ni son mixage.

## Limites

Cette passe démontre la structure des données et des chargeurs, **pas une fidélité sonore**. Elle n'a ni exécuté le SPC700, ni écouté une sortie, ni validé le DSP, ni décodé toutes les commandes de musique/effets. Les timings et correspondances entre événements de jeu et IDs SFX restent à établir. Le jeu web conserve pour l'instant son audio de synthèse original ; aucun asset sonore ROM n'a été ajouté à l'application.

Source de navigation : https://github.com/Yoshifanatic1/Donkey-Kong-Country-1-Disassembly — `DKC1/SPC700/InitializeSPC700.asm`, `SPC700_Engine_DKC1.asm`, `AsarScripts/AssetPointersAndFiles.asm`, `Routine_Macros_DKC1.asm`. Le script livré n'a pas besoin de ce dépôt pour reproduire les observations.
