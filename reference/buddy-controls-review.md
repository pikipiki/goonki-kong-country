# Contrôles des animaux et duo — vérification ciblée (21 octobre 2026)

Cible : ROM fournie **Donkey Kong Country USA Rev 2**, 4 MiB, SHA-256 `628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527`. Lecture ZIP sans modification de la ROM. Cette revue complète `buddy-analysis.json` ; elle ne remplace pas une trace SNES.

## Résultat utile

- **DKC1 : Rambi attaque avec Y, Enguarde avec Y ou B ; pas besoin de préparer une supercharge pour ouvrir une paroi attaquable.** Le gestionnaire Rambi vérifié reçoit un **nouvel appui Y**, puis déclenche l'animation de coup de corne ; il n'accumule pas de temps de charge dans ce chemin. Le contrôle général maintenu Y sert aussi à courir.
- **Expresso peut bien ralentir sa chute avec ses ailes.** Le manuel officiel demande de réappuyer sur B en l'air ; la ROM vérifiée utilise le nouvel appui B et autorise le flutter quand la vitesse verticale est inférieure à +2 px/tick. Le flutter ne constitue pas un vol ascendant infini.
- **La supercharge maintenue et le lancer du partenaire correspondent à DKC2**, selon le document Nintendo Gateway cité ci-dessous. Ce ne sont pas des comportements établis dans la ROM DKC1 fournie. L'absence de ces fonctions dans DKC1 est appuyée par le manuel complet des contrôles et les chemins ciblés, pas par une preuve exhaustive de tous les octets exécutables.

## Sources primaires

[Manuel officiel Nintendo DKC1, édition SNES Classic](https://www.nintendo.com/es-es/games/oms/snes-classic/manuals/dk-country/manual.pdf), PDF page 2 : A échange/démonte ; Y course/roulade ; page 3 : Rambi Y dash / B jump, Expresso B jump puis nouveaux appuis B pour flotter lentement, Enguarde Y dash. Le manuel original [hébergé chez Nintendo Japon](https://www.nintendo.co.jp/clvs/manuals/common/pdf/CLV-P-SAALE.pdf), page imprimée 11, précise Enguarde **Y ou B** pour accélérer et porter le coup de rostre. Son extraction directe est trop grosse pour le lecteur web ; son contenu était accessible via le résultat indexé, recoupé avec le manuel plus petit.

[Document Nintendo Gateway : DKC2 Executive Game Summary](https://snescentral.com/1/0/1/1019/pdf/dkc2.pdf), une page, document attribué à Nintendo et réhébergé par SNES Central : A permet le regroupement et le maintien pour charger la superattaque de l'animal ; Y lance le partenaire lorsque le duo est regroupé. Source primaire de contrôle DKC2, **aucune ROM DKC2 n'a été analysée ici**. Ne pas en déduire les délais/vitesses exacts de DKC2.

Le [désassemblage communautaire DKC1 USA 1.0](https://github.com/Yoshifanatic1/Donkey-Kong-Country-1-Disassembly), copie locale `work/dkc-disassembly/DKC1/Routine_Macros_DKC1.asm`, sert uniquement de carte de navigation et de noms. Chaque séquence ci-dessous a été retrouvée directement et une seule fois dans la Rev 2, avec décodage manuel 65C816.

## Preuves dans les octets Rev 2

Adresses ci-dessous : offsets fichier ; adresse CPU HiROM = offset + `$C00000`. Les banques sont parfois référencées par leur miroir `$BExxxx`/`$BFxxxx` dans le code. `$80` = nouveaux appuis, `$7E` = boutons maintenus : les noms RAM communautaires sont recoupés avec le contrôleur général et le manuel.

| Question | Offset | Observation locale |
| --- | --- | --- |
| Entrées nouvel appui / maintien | `0x3FB314` | `b9 04 05 85 80 b9 00 05 85 7e` : copie `$0504,Y` vers `$80`, puis `$0500,Y` vers `$7E`. |
| Coup de corne Rambi | `0x3FBE56` | `a5 80 29 00 40 d0 01 60 ... c9 09 00 ... c9 3a 00 ... c9 3f 00 ... a9 3a 00 22 92 80 be 60` : exige nouvel appui `$4000` (Y), animal sprite 9, refuse une attaque déjà en cours et demande animation `$3A`. Aucun compteur de charge dans cette routine. |
| Coup Enguarde par Y ou B | `0x3FBC9C` | `a5 80 29 00 c0 d0 01 60 45 80 85 80 a4 84 b9 12 05 d0 01 60` : teste les nouveaux appuis `$C000` (Y/B), les consomme, exige une monture avant le chemin d'attaque. L'entrée/impulsion exacte déjà établie à `0x3F98DB` / `0x3EBC17` donne un élan horizontal signé de 4 px/tick. |
| Condition flutter Expresso | `0x3FB9FB` | `a5 80 29 00 80 f0 21 bd a5 12 4a b0 1b b9 12 05 aa bd 45 0d a6 82 c9 0a 00 d0 0d bd f1 0e 30 05 c9 00 02 10 03 4c 83 ba` : nouvel appui B ; interdit si bit bas `$12A5` actif ; vérifie animal 10 ; autorise si vitesse Y négative ou < `$0200`, puis saute à `$BFBA83`. |
| Entrée flutter | `0x3FBAA0` | Déjà vérifié dans `buddy-analysis.json` : vitesse Y `$0400`, repositionnement +24 px, animation de flutter ; ce n'est pas une limite permanente de chute. |
| Continuation flutter | `0x3F97C8` | Teste compteur `$145D & $7FFF`. Tant que le compteur est >=8, le décrémente et remet la vitesse verticale négative à zéro. S'il atteint zéro, réinitialise à 12. Dans la partie descendante du cycle, ajoute -112 (8.8) et limite à -768, soit -3 px/tick. Ce chemin explique la suspension puis la chute ralentie. La durée réelle dépend des appels et de la mise à jour du flag. |
| Collision attaque / paroi | `0x3EBCC8` | `b9 45 0d c9 14 00 f0 08 a9 00 06 9d f1 0e 80 03 9e f1 0e a9 01 00 99 95 15` : si l'objet touché est une paroi sprite `$14`, annule le rebond Y et pose son indicateur de dommage `$1595=1`. Le callback `$BEBCA6` est référencé par opcode d'animation `84 a6 bc be` à `0x3EBB43` (animation d'attaque montée Rambi, correspondance de nom issue de la source de navigation). |
| Ouverture de la paroi | `0x36C51C` et `0x36C668` | Les deux variantes testent `$1595`, l'effacent, suppriment la zone de contact `$11A1`, passent à l'état ouvert 7 ou 4. Le chemin local ne teste pas une vitesse minimale ou une charge longue. L'entrée bonus ultérieure a ses propres détection/direction/transition ; il faut la tester séparément dans l'adaptation. |

Séquence complète reproductible du gestionnaire Rambi à `0x3FBE56` :

```text
a5 80 29 00 40 d0 01 60 a4 84 b9 12 05 aa bd 45 0d c9 09 00 d0 14 b9 ad 16 c9 3a 00 f0 0c c9 3f 00 f0 07 a9 3a 00 22 92 80 be 60
```

Continuation flutter à `0x3F97C8` :

```text
a6 82 bd 5d 14 f0 21 29 ff 7f f0 11 c9 08 00 30 14 de 5d 14 bd f1 0e 10 03 9e f1 0e 60 a9 0c 00 9d 5d 14 80 ef de 5d 14 a9 90 ff 18 7d f1 0e 10 08 c9 00 fd b0 03 a9 00 fd 9d f1 0e 60
```

## Recommandations d'implémentation

1. Corriger d'abord la possibilité de casser la planche par un coup de corne ordinaire de Rambi. Ne pas imposer une supercharge non établie à un accès bonus DKC1. La zone d'attaque doit atteindre la planche avant que la capsule de déplacement soit arrêtée contre elle.
2. Le maintien puis relâchement demandé pour Rambi/Enguarde peut être ajouté comme **adaptation inspirée de DKC2**, avec indicateur de progression, vitesse de départ distincte, durée finie et attaque prioritaire pendant le dash. Garder un appui bref utile ; aucun délai/vitesse de supercharge n'est justifié par cette ROM.
3. Expresso : permettre le flutter pendant la descente, aile animée et temps de suspension sensible ; les nouveaux appuis sont la commande originale. Un maintien tactile qui renouvelle les battements est une adaptation ergonomique valable, annoncée comme telle, avec chute finale et sans gain infini de hauteur.
4. Un lancer du partenaire vers le haut peut répondre à la demande du joueur, mais serait une mécanique ajoutée inspirée de DKC2. Le tag existant de DKC1 ne doit pas être renommé en preuve d'un lancer original. Nécessite deux personnages présents, un bouton dédié/contextuel et un saut plus haut contrôlé ; garder les conditions d'entrée bonus explicites.

## Limites

Analyse statique ciblée ; aucun émulateur SNES ni trace de touches/vitesses image par image. REA a été interrogé sur la session : aucun binaire ouvert, Ghidra non configuré ; le précédent relevé du projet établissait l'absence de désassembleur 65C816 adapté dans la route Hopper disponible. Le décodage est donc manuel à partir de séquences vérifiées, **pas une décompilation REA réussie**. Les données graphiques/sons et le binaire ROM n'ont pas été copiés dans le jeu. Les comportements non inspectés restent inconnus ; le rapport ne revendique aucune rétro-ingénierie complète.
