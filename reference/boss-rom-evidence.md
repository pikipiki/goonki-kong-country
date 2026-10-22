# King K. Rool — ROM fournie, adaptation et scène 2D

Analyse du 22 octobre 2026. ROM USA Rev 2, SHA-256 `628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527`.

## Ce qui a été vérifié dans les octets

`scripts/extract_boss_2d.py` localise la table de contrôle par une signature numérique unique dans la ROM fournie : offset fichier **0x36EB7A**, correspondant au label de navigation V1 `DATA_B6EB45`. Le JSON `reference/boss-rom-evidence.json` conserve chaque affectation et chaque adresse relocalisée.

Le désassemblage communautaire sert à nommer les registres et animations, pas à présumer les offsets Rev 2 : https://github.com/Yoshifanatic1/Donkey-Kong-Country-1-Disassembly, commit `c2080f40469c716923f550706509a0d354229841`. Copie locale : `/Users/sevenone./Documents/Codex/2026-10-21/cre/work/dkc-disassembly/DKC1/Routine_Macros_DKC1.asm`, lignes 61384–62110 et 103770–104120. Les interfaces natives REA exposent 6502, mais pas le 65C816 de cette cartouche ; aucune décompilation native complète n'est revendiquée.

La table contient **10 affectations de l'état 3 (lancer de couronne)** aux offsets relatifs `0x28, 0x4C, 0x6C, 0x8C, 0xD8, 0x124, 0x170, 0x1EC, 0x220, 0x250`. Les trois tables de boulets contiennent **9, 17 et 25** positions. Les états de sauts consomment **2, puis 6, puis 12** entrées après le faux dénouement. Ce sont des constatations statiques sur les données ; le déroulé complet n'a pas été joué dans la ROM pour ce rapport.

| Après le coup | Suite reproduite par le moteur web |
|---|---|
| 1, 2, 3 | Respectivement 1, 2, 3 traversées en course, puis couronne |
| 4, 5, 6 | Trois sauts préparatoires, pluie de 9, 17, 25 boulets, puis couronne |
| 7 | Fausse mort, redressement, 2 sauts, puis couronne |
| 8 | 6 sauts, puis couronne |
| 9 | 12 sauts, puis couronne |
| 10 | Mort finale |

Les tables enregistrent aussi les vitesses brutes de couronne/course, les pauses et les impulsions originales. Les durées, vitesses en unités du monde, volumes de collision et largeur de l'arène web sont **adaptés** aux peluches et aux commandes mobiles. Les dégâts par tonneau sont un ajout demandé par l'utilisateur, pas une revendication de fidélité au combat original.

## Graphismes et palette

L'atlas `public/rom2d/boss-sprites.png` contient **55 images de la ROM**, avec leurs en-têtes vérifiés et leurs origines conservées dans `boss.json` : 7 course, 4 lancer, 4 attente sans couronne, 4 blessure, 12 chute, 6 saut, 4 repos, 12 couronne, 1 boulet et 1 île.

Les palettes de sprite sont lues selon le correctif partagé : index 0 transparent implicite, puis **15 mots BGR555**, aux offsets `0x3C8314` (K. Rool/couronne), `0x3C829E` (boulet), `0x3C8262` (île). Le redressement réutilise les images de chute en sens inverse ; la pose de pluie réutilise le repos. Le choix de la famille suit le même `game.bossBattle.phase` que la scène 3D ; aucun second moteur de boss n'est exécuté par le rendu 2D.

Le rendu garde une échelle constante entre les images du boss, centre les projectiles sur leurs coordonnées de collision, montre le tonneau porté et signale au sol les boulets pendant leur avertissement.

## Bateau réellement observé

`reference/boss-rom-reference.png` est une capture du boss dans l'émulateur Snes9x exécutant la ROM fournie : pont doré, canons latéraux, pile de tonneaux centrale, filets/cordages, nuages gris bleuté et île distante. L'entrée dans la salle a été forcée par WRAM `0x3E = 0x68` depuis une sauvegarde de carte ; c'est une observation contrôlée, pas une progression normale.

`public/rom2d/boss-background.png` est le même décor capturé après désactivation de la couche **OBJ seulement** par `Settings.BG_Forced |= 0x10`. **L'île étant un sprite OBJ, elle est absente de ce PNG et dessinée séparément depuis l'atlas. Il n'y a pas de doublon d'île.** Les objets de gameplay et le HUD de la ROM sont également absents.

La procédure reproductible est `scripts/capture_boss_background.py`. Elle refuse tout autre core que le digest consigné dans `reference/boss-background-capture.json` avant d'utiliser l'offset de structure 76. La cartouche et le core ne sont pas distribués avec le jeu.

Le décor central conserve ses proportions **256 × 224**. Le paysage prolonge les bandes latérales du pont ; le portrait prolonge les nuages, les cordages et le bas du pont. Ce prolongement est une adaptation du cadrage mobile. Les nuages répétés sont légèrement fondus dans un dégradé reprenant les couleurs de la ROM. Ni les personnages ni les éléments centraux du bateau ne sont étirés.

## Vérifications effectuées

- TypeScript `tsc --noEmit` : réussi après l'intégration de la scène.
- Atlas régénéré : manifeste identique et **pixels identiques** ; les octets PNG peuvent différer selon la version de Pillow/compression.
- 55 rectangles d'atlas à l'intérieur de l'image ; tous les indices de groupes sont valides.
- Capture du décor reproduite à l'identique : SHA-256 `e89e56de0c1f444d09a9d705dbc3351e31d8818d50571b9a827de0a97d08e741`.
- Navigateur réel Chrome : **390 × 844 portrait** et **844 × 390 paysage**, aucun message d'erreur JS/console, bonnes dimensions de canvas, niveau 6 et état du boss partagés. `reference/boss-2d-browser-proof.json` conserve les états ; captures `boss-2d-portrait.png` et `boss-2d-landscape.png`.
- Les captures de ce rapport montrent le début du combat avec dégâts actifs ; elles ne prouvent pas à elles seules une victoire. La validation complète au clavier du combat web est consignée séparément par la tâche principale.

## Reproduction

```sh
python3 scripts/extract_boss_2d.py --output /tmp/goonk-boss-assets --evidence /tmp/goonk-boss-evidence.json
python3 scripts/capture_boss_background.py --core /chemin/core-verifie.dylib --map-state /chemin/stage.state --output /tmp/goonk-boss-background
```

La première commande nécessite Pillow ; son chemin source peut être changé par `--source`. Le dossier de sortie peut être isolé pour comparer les actifs sans écraser ceux du jeu. Démo : `http://127.0.0.1:5174/?demo=2d&stage=boss`.
