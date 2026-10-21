# Désassemblage Yoshifanatic1 vs notre ROM (USA Rev 2)

## Verdict

| | **Yoshifanatic1** | **Goonk Country (fourni)** |
|---|-------------------|----------------------------|
| Jeu | Donkey Kong Country (SNES) | Idem |
| Région / révision | **USA V1.0** uniquement (rebuild cible) | **USA Rev 2** (`header.revision` = 2) |
| MD5 | `30c5f292ff4cbbfcc00fd8fa96c2de3b` | `2e604bc12fb8f9467765c807c24877fa` |
| SHA-256 | *(non listé dans leur README)* | `628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527` |
| Taille | 4 194 304 octets | 4 194 304 octets |

**La ROM du dépôt n’est pas la ROM V1.0 du désassemblage.** On ne peut pas assembler Yoshifanatic1 et s’attendre à un fichier identique au ZIP Rev 2. En revanche, **c’est le même programme** avec des **différences de révision** (correctifs Nintendo, déplacements de code, tables audio, etc.).

Preuve locale (oct. 2026) : extraction de `Donkey Kong Country (USA) (Rev 2).sfc` depuis l’archive utilisateur → SHA-256 = valeur épinglée dans `rom-analysis.json` et `analyze_level_tables.py` (`EXPECTED`).

## Ce qui reste utilisable (accélération)

1. **Noms sémantiques** — sprites, musiques, environnements : déjà importés dans `scripts/analyze_level_tables.py` (`NAMES`, `MUSIC`, `ENVIRONMENTS`) et `reference/level-tables.json` (`navigationSource`).
2. **Logique et structures** — scripts de spawn, commandes, états joueur : lire les `.asm` / labels du repo pour comprendre *quoi* decoder ; **toujours** valider les octets sur la Rev 2.
3. **Relocalisation** — méthode du dépôt : signatures d’octets uniques dans la Rev 2 (`locate()` dans `analyze_level_tables.py`, `analyze_buddies.py`, `rom-analysis.json`). Les adresses HiROM du source V1.0 **ne sont pas fiables** telles quelles (ex. wrappers SFX : `0x3FFB62` en Rev 2 vs adresses source 1.0 — voir `audio-playback-notes.md`).

## Ce qu’il ne faut pas faire

- Supposer qu’un label `$8Fxxxx` / `CODE_Bxxxx` du désassemblage pointe au même offset fichier en Rev 2.
- Rebuilder la ROM Yoshifanatic avec notre cartouche et comparer byte à byte (échec garanti).
- Copier des tableaux entiers depuis les `.asm` sans passe `EXPECTED` SHA-256.

## Workflow recommandé pour une nouvelle feature ROM

1. Cloner le désassemblage (hors dépôt, ROM possédée) :  
   `git clone https://github.com/Yoshifanatic1/Donkey-Kong-Country-1-Disassembly.git`
2. Trouver le label / la routine (ex. Necky, bonus room loader, projectile).
3. Repérer une **séquence d’instructions courte et distinctive** (8–24 octets) dans le listing ou après build V1.0 **si** vous avez la V1.0.
4. Chercher cette séquence dans la Rev 2 (`rom.find(bytes)`), exiger **unicité** (comme `locate()`).
5. Décoder à la main ou étendre un script Python existant ; exporter vers JSON / générateur TS.
6. Ajouter un test oracle ou une fixture si c’est gameplay (comme `jungle-parity-walk.json`).

## Écart Rev 2 déjà documenté ici

- Audio CPU/SPC : `reference/audio-rom-analysis.json` (`revisionDifference`).
- Pilote ARAM handlers : décalage vs labels 1.0 (`audio-playback-notes.md`).
- Tables de niveaux : pointeurs et spawns relocalisés, pas les offsets du wiki 1.0 (`reference/level-tables.md`).

## Liens

- Dépôt : https://github.com/Yoshifanatic1/Donkey-Kong-Country-1-Disassembly  
- Cadre Asar : inclus dans leur téléchargement / sous-repo SNES-ROM-Framework  
- Port natif basé sur une autre base (USA **1.0**) : [DKC1Recomp](https://github.com/elliotttate/DKC1Recomp) — ne remplace pas ce document pour la Rev 2.
