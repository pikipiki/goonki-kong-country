# Analyse directe de la ROM USA Rev 2

## Identité constatée

Archive fournie : `Donkey Kong Country (USA) (Rev 2).zip`, SHA-256 `123f853708518bdb745990a37d90a1cc800a0f0911afcf3ce451d81c446f6b77`.

ROM : 4 194 304 octets, SHA-256 `628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527`. Titre à l’offset `0xFFC0` : `DONKEY KONG COUNTRY`. Mode `0x31` (HiROM/FastROM), révision 2, région 1, SRAM 2 Ko. Somme calculée des octets `0x2BCC`, identique au checksum enregistré ; complément `0xD433`. Vecteur reset : `$8000`.

REA a inventorié l’archive, sans contradiction d’intégrité. Cette opération ne désassemble pas le processeur SNES 65C816. Pour aller plus loin, le script Python livré lit lui-même la ROM et relocalise des signatures exactes. Le [désassemblage public USA 1.0 de Yoshifanatic1](https://github.com/Yoshifanatic1/Donkey-Kong-Country-1-Disassembly) a servi de carte de navigation pour sélectionner les routines ; ses étiquettes ne sont pas prises pour des preuves de la révision 2. Aucun fichier de son code n’est utilisé par l’application.

## Octets et conclusions locales

Les adresses ci-dessous utilisent la fenêtre HiROM `$C0–FF`. La même ROM peut être exposée par des fenêtres miroirs `$80–BF` pour les adresses hautes ; un offset fichier reste l’identifiant sans ambiguïté.

| Routine | Offset dans la ROM Rev 2 | Observation |
| --- | --- | --- |
| Gravité | `0x3FAF9C`, également `0x3FB176` | Charge `$FF90` = −112, additionne la vitesse Y à `$0EF1,X`, limite à `$F800` = −2048. |
| Saut maintenu | `0x3FB9AC` | Choisit `$FFB8` = −72 pour le sélecteur 0, `$FFA6` = −90 sinon, écrit `$16F9,Y`. |
| Rebond ennemi | `0x3FA7E7` | Choisit `$0720` = 1824 ou `$0880` = 2176 et écrit `$0EF1,X`. |
| Compteur de bananes | `0x00A370` | Charge `$057B`, soustrait `$0064` = 100 et réécrit le compteur. |
| Entrée personnage | `0x3F84A4` | Place 2 ou 0 dans `$84` avant la logique partagée. |

Exemple décodé directement depuis la signature de gravité :

```asm
LDA #$FF90
CLC
ADC $0EF1,X
BPL +8
CMP #$F800
BCS +3
LDA #$F800
STA $0EF1,X
RTS
```

L’intégration des positions, examinée dans le désassemblage de navigation, utilise XBA, masque `$FF00`, accumulation dans une table de sous-pixels, puis report dans la position entière : cette lecture motive l’interprétation de la vitesse en virgule fixe 8.8. L’application convertit `raw / 256 × 60 / 32` pour une vitesse, et multiplie encore par 60 pour une accélération. Cette échelle 3D est un choix d’adaptation.

Le script vérifie la présence des signatures, conserve **toutes** leurs occurrences et échoue si elles ne sont pas trouvées. Il ne transforme pas les commentaires du désassemblage de navigation en faits vérifiés.

## Limites explicites

Pas d’exécution de la ROM dans un émulateur, pas de comparaison image par image. Ces preuves établissent le contenu de routines locales et ne démontrent pas tous les contextes d’appel. Ni extraction complète des niveaux, ni désassemblage exhaustif. Les ennemis, parcours, impulsions initiales de saut et animations de la version web sont propres à l’adaptation. Les deux vitesses horizontales et leur ratio ont été guidés par la lecture du désassemblage USA 1.0 ; ils ne font pas partie des signatures vérifiées du rapport actuel.

## Provenance visuelle

`src/game3d/plushGoonk/{profile,mesh,usePlushFabric,velour,FurPile,Stitching,FlatEye,YellowTuft}` et `src/game3d/theme.ts` sont copiés du projet local de l’utilisateur `tontie-re`. Les nouveaux bras, jambes animées et contrôles adaptent ces modèles à la plateforme. Les décors et les autres acteurs sont construits en géométrie Three.js dans ce projet.
