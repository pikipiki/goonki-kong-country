# Correction des palettes 2D — 22 octobre 2026

Les couleurs des monstres et panneaux étaient décalées d'un indice. Les palettes de sprites SNES ne contiennent que **15 couleurs visibles / 30 octets** : la transparence à l'indice 0 est implicite. L'extracteur lisait 16 mots, supprimait la première couleur et empruntait une couleur à la palette suivante. Cela éclaircissait les ombres et créait des pixels rouges/blancs parasites.

Correction dans `scripts/extract_jungle_2d.py` : ajouter la transparence avant de lire les 15 mots BGR555. Les palettes de décor restent des enregistrements de 16 mots. Le trou de grotte utilise sa palette dédiée et la plate-forme de grotte sa palette bois, au lieu de celle du tonneau. `public/rom2d/sprites.png` contient les 301 images régénérées. Aucun filtre de contraste ou saturation n'a été ajouté. `--sprites-only` conserve les décors/cartes déjà présents.

## Éléments vérifiés dans la ROM fournie

- ROM extraite : SHA-256 `628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527` (4 194 304 octets).
- ZIP : SHA-256 `123f853708518bdb745990a37d90a1cc800a0f0911afcf3ce451d81c446f6b77`, identité confirmée par REA `open_binary`.
- Routine Rev 2 à PC `$00A2DB` / SNES `$80A2DB`. À PC `$00A2FC`, octets `A9 1E 00 8D 05 43` = `LDA #$001E; STA $4305`, transfert DMA de 30 octets.
- La désassemblage source USA V1.0 nomme la routine correspondante `CODE_80A2CD` : ce nom est un repère de lecture, son adresse n'est pas reprise aveuglément pour Rev 2. Source Yoshifanatic1/Donkey-Kong-Country-1-Disassembly, commit `c2080f40469c716923f550706509a0d354229841`.
- Offsets directs des palettes Rev 2 : Kritter vert `$3C8512`, Klump `$3C85C6`, Gnawty `$3C8A1C`, Necky `$3C86D4`, panneaux `$3C8350`, Rambi `$3C8404`, tonneau `$3C872E`, objets globaux `$3C86F2`, trou de grotte `$3C81EA`, plate-forme de grotte `$3C88D2`.

## Validation

Sept vérifications Python passent : absence de lecture hors des 30 octets, conservation de l'indice de transparence en mode nuit, décodage 4bpp, identité ROM, octets DMA Rev 2, appartenance des pixels visibles de toutes les images des groupes contrôlés à leur palette ROM, conservation des ombres et hautes lumières. Commande : `python3 scripts/test_rom2d_palette.py` avec Pillow installé.

`rom2d-palette-comparison.png` montre les mêmes images avant/après (agrandissement nearest-neighbor). Le panneau retrouve son poteau brun et ses lettres rose pâle originales ; les ennemis retrouvent leurs ombres ; la plate-forme retrouve son sommet en bois. `rom2d-palette-browser.png` montre le résultat dans le véritable Canvas 2D du jeu, à x=12 dans Jungle Hijinxs. Navigateur de test indépendant : aucune erreur JavaScript.

## Limites

La comparaison visuelle est faite avec les pixels et palettes extraits de la ROM, pas une capture d'émulateur SNES. Le rendu global 2D contient encore des adaptations du cycle jour/nuit et de la disposition de l'interface ; ce correctif ne prétend pas reproduire toute la composition PPU de la console. La recherche est limitée aux palettes des sprites du niveau jungle déjà extraits. Les arrière-plans et cartes existants ont été conservés.
