# Audio : captures authentiques, effets et boucles

## État et provenance

La lecture de la ROM réelle est maintenant possible via le cœur officiel libretro/Snes9x et `scripts/snes_probe.py`. Le pont d'analyse ajouté par l'agent principal expose ARAM, registres DSP, PC SPC700 et ports APU. La capture musicale Aquatic Ambience a été effectuée par le test musical **du jeu** (WRAM `$0523 = 3` observée), pas par un synthétiseur de substitution.

`scripts/capture_fx.py` ajoute une procédure reproductible de capture des effets sonores avec ce même pilote SPC700 et ce même DSP. Il ne modifie pas la ROM, n'implémente pas le rendu audio et n'a pas touché `snes_probe.py`. Son interpréteur borné de séquences sert uniquement à identifier les instruments requis.

Les captures PCM sources et leurs traces restent dans le dossier de travail. Une version conditionnée pour le navigateur a ensuite été ajoutée à `public/audio/` (voir fin du rapport) :

- `work/runtime-rom/sfx/` : **119** commandes `$00–$76`, WAV stéréo de 240 images d'émulation chacune, `capture.json`, état silencieux et baseline.
- `work/runtime-rom/sfx-water/` : remplacements `$6A`, `$75`, `$76`, issus de la banque musicale aquatique avec l'instrument BRR `$0C` réellement chargé.
- ROM SHA256 : `628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527`.
- Cœur utilisé : `fcd68e24de690b15aec70d8f898b604717f1c4151cdf8426384c4d9ee742fb83`.
- État jungle initial : `baa8941681e78184cadea3627e76a5eb1a345a304ea96dd4e74b6b677ad8ff9a`.
- Fréquence : 32040.0 Hz, stéréo PCM16 ; cadence d'émulation 60.098811862348406 images/s.

## Ce que fait réellement la commande SFX

Il n'y a pas de file de commandes SFX WRAM identifiée sur ce chemin. Le code CPU conserve temporairement l'identifiant dans le mot de page directe `$F5`, lui applique un préfixe `$0400`, `$0500`, `$0600` ou `$0700`, puis appelle **`$8AB1AF`**. Le préfixe sélectionne la voix DSP ; le byte faible sélectionne l'effet. Les wrappers du source USA 1.0 ont changé d'adresse dans cette Rev 2 : le groupe vérifié commence à l'offset fichier **`0x3FFB62`**, pas à son adresse source d'origine.

Le protocole à `0x0AB1AF` attend que le port APU de sortie 0 égale le byte WRAM `$00`, écrit l'effet au port `$2141` et la voix au port `$2142`, bascule le compteur de commande par `(old ^ $80) | 1`, met à jour WRAM `$00`, puis écrit ce byte au port `$2140`. `send_command()` reproduit ce protocole et consigne l'intervention.

Le pilote SPC700 réel reçoit ces bytes via `$F5` et `$F6`, acquitte `$F4` et appelle son initialisation SFX à **ARAM `$1178`**. Il double l'ID pour lire un pointeur 16 bits à **`$2380 + 2*ID`**, sélectionne le flux logique `8 + voix`, remet ses paramètres à zéro et commence la séquence. La table de 119 pointeurs se termine exactement à **`$246E`**, adresse de la première séquence ; les cibles restent dans **`$246E–$31A5`**. Le premier pointeur (`None`) est `$2FB4` et ce byte contient l'opcode END `$00`.

Les commandes spéciales ont des effets distincts : `$00FF` quitte le pilote vers le bootstrap/réinitialisation ; ce n'est pas une commande pour garder le SFX actif en arrêtant seulement la musique. `$00FE` active l'ordonnanceur, `$xxFD` écrit le sélecteur de branches `$ED`, `$xxFC` règle le mode mono `$25`.

## Isolation des captures

L'état jungle déclenche du tonnerre même quand le joueur reste immobile. Arrêter seulement les flux musicaux n'était donc pas suffisant : une première baseline montrait encore du son sur les voix 4/6 et a été rejetée.

La procédure retenue attend 60 images pour laisser expirer le délai initial de pause, presse **Start réellement**, vérifie le bit `$0040` de WRAM `$0579`, puis redirige les 16 flux logiques vers l'opcode END existant à `$2FB4`. Les pointeurs, compteurs de durée et gate concernés sont consignés comme patches ARAM. Après 180 images de décroissance, les 8 flux musicaux et les 8 flux SFX sont inactifs. Le dernier intervalle d'une seconde de la baseline jungle a **peak 0 / RMS 0**. L'effet `None $00` capturé est également exactement nul.

Chaque effet repart de ce même état sauvegardé. La commande est envoyée par les vrais ports, le cœur produit son PCM et le script conserve des traces des positions, flags, durées, instrument SRCN/pitch de la voix 4, PC SPC et empreinte WAV. Aucun gain, filtre ou normalisation n'est appliqué.

Pour les trois effets nécessitant la banque aquatique, l'état du menu musical n'émet pas de SFX de gameplay. Après 900 images de décroissance, un résidu PCM de **peak 4 / RMS 3.37196** persiste (environ −78 dBFS en crête). La capture utilise explicitement `--silence-tolerance 4`, inscrit dans son rapport ; il ne faut pas le présenter comme une baseline mathématiquement nulle. L'origine exacte de ce faible plancher résiduel n'a pas été démontrée. Le PCM n'a pas été nettoyé.

Reproduction depuis les états locaux :

```sh
python3 -B scripts/capture_fx.py --core /chemin/snes9x_libretro.dylib \
  --state /chemin/runtime-rom/ground/ground.state --output /chemin/runtime-rom/sfx \
  --ids all --frames 240

python3 -B scripts/capture_fx.py --core /chemin/snes9x_libretro.dylib \
  --state /chemin/runtime-rom/music-test/music-test.state --output /chemin/runtime-rom/sfx-water \
  --ids 0x6a,0x75,0x76 --frames 240 --settle 900 --no-pause --silence-tolerance 4
```

## Vérification des banques d'instruments

Un numéro de mapping non nul à `$04E8 + ID_BRR` peut être périmé après un changement musical : ce n'est pas une preuve de disponibilité. La vérification compare donc les **octets complets BRR de la ROM** aux octets ARAM réellement pointés par le répertoire DSP `$3200 + 4*mapping`. Cette comparaison confirme **39** échantillons chargés dans l'état jungle. La séquence est parcourue par un interpréteur borné des 49 opcodes, avec appels répétés, sauts, durées implicites/explicites et branches `$ED`, pour obtenir les références d'instruments.

**116** des 119 effets de l'état jungle utilisent des instruments réellement présents. Les exceptions `$6A`, `$75`, `$76` demandent BRR `$0C` absent de cette banque. Les trois captures aquatiques de remplacement utilisent toutes un BRR `$0C` comparé à la ROM et ont zéro dépendance manquante. Il faut donc utiliser ces remplacements au lieu de leurs captures jungle. La conclusion porte sur les dépendances identifiées et les octets de banques ; elle ne remplace pas une écoute comparative de chaque effet dans sa scène originale.

L'interpréteur termine par END pour 115 IDs et détecte un état de contrôle répété pour `$23`, `$24`, `$25`, `$6D`. Des effets finis longs ont encore du son après quatre secondes (`$17`, `$1A`, `$4B`, `$4C`, `$6B`) : ne pas les couper comme de courts sons ni leur attribuer une boucle sur cette seule observation. `$00`, `$1F`, `$20` produisent du PCM nul dans ce test. La cartographie des noms provient du source de navigation et reste à confirmer perceptuellement.

## IDs utiles pour le jeu web

| ID | Nom de navigation | Capture validée par ses instruments |
|---|---|---|
| `$01` | TireBounce | `sfx/sfx-01.wav` |
| `$04` | ShootOutOfBarrelCannon | `sfx/sfx-04.wav` |
| `$07` | LostLife | `sfx/sfx-07.wav` |
| `$08` | StompEnemy | `sfx/sfx-08.wav` |
| `$0D` | RambiLand | `sfx/sfx-0d.wav` |
| `$0F` | ZingerDead | `sfx/sfx-0f.wav` |
| `$11` | OpenBox | `sfx/sfx-11.wav` |
| `$14` | BreakBarrel | `sfx/sfx-14.wav` |
| `$17` | MovingMinecart | `sfx/sfx-17.wav` |
| `$21` | CollectBanana | `sfx/sfx-21.wav` |
| `$22` | CollectBananaBunch | `sfx/sfx-22.wav` |
| `$26` | EnterBarrelCannon | `sfx/sfx-26.wav` |
| `$27` | RambiWalk1 | `sfx/sfx-27.wav` |
| `$28` | RambiWalk2 | `sfx/sfx-28.wav` |
| `$2F` | GainLife | `sfx/sfx-2f.wav` |
| `$34` | RambiHitEnemy | `sfx/sfx-34.wav` |
| `$43` | DiddyHurt | `sfx/sfx-43.wav` |
| `$46` | DKHurt | `sfx/sfx-46.wav` |
| `$4F` | CollectK | `sfx/sfx-4f.wav` |
| `$50` | CollectO | `sfx/sfx-50.wav` |
| `$51` | CollectN | `sfx/sfx-51.wav` |
| `$52` | CollectG | `sfx/sfx-52.wav` |
| `$56` | RambiStab | `sfx/sfx-56.wav` |
| `$57` | EnguardeStab | `sfx/sfx-57.wav` |
| `$58` | GetOnAnimalBuddy | `sfx/sfx-58.wav` |
| `$59` | WingFlap | `sfx/sfx-59.wav` |
| `$5F` | AnimalBuddyJump | `sfx/sfx-5f.wav` |
| `$65` | SwitchKongs | `sfx/sfx-65.wav` |
| `$73` | CollectLifeBalloon | `sfx/sfx-73.wav` |
| `$75` | DKSwim | `sfx-water/sfx-75.wav` |
| `$76` | DiddySwim | `sfx-water/sfx-76.wav` |

Aucun ID explicitement nommé « roulade normale » ou « saut normal des Kongs » n'a été identifié dans cette table. Ne pas utiliser le saut animal `$5F` pour chaque saut des peluches : déclencher les vrais sons de contact, d'atterrissage ou d'attaque selon les situations constatées. Certains événements sont composites : les deux sons de secret sont envoyés sur des voix différentes dans le code d'origine.

## Positions de séquence et détection des boucles musicales

Ces variables sont vérifiées par les instructions du pilote Rev 2 et corroborées par les lectures ARAM du cœur exécutant Aquatic Ambience :

| ARAM | Sens | Index |
|---|---|---|
| `$4C+i`, `$5C+i` | Pointeur séquence bas/haut | `i=0..7` musique, `i=8..15` SFX |
| `$3C+i` | Compteur de durée courant | 16 flux |
| `$2C+i` | Durée/gate complémentaire | 16 flux |
| `$0110+i` | Flux actif | 16 flux |
| `$0120+i`, `$0130+i` | Durée implicite, gate implicite | 16 flux |
| `$0190+i` | Mode à deux bytes de durée | 16 flux |
| `$DC+i` | Sommet de pile d'appels/répétitions | 16 flux |
| `$0334+k` | Pile : byte bas du pointeur d'appel | `k` est un slot de pile |
| `$03B4+k` | Pile : byte haut du pointeur d'appel | même slot |
| `$0434+k` | Pile : répétitions restantes | même slot |
| `$26`, `$27` | Accumulateur fractionnaire et incrément de tempo musical | global |
| `$29`, `$2A` | Accumulateur/incrément de l'ordonnanceur SFX | global |
| `$EC` | Diviseur de timer SPC | global |
| `$ED` | Sélecteur de branches de séquences | global |

Chaque flux possède initialement 8 slots de pile ; la base du flux `i` est `i*8`. La commande d'appel (opcode `$04`) place le nombre de répétitions et le pointeur de retour dans ces piles ; `$05` décrémente et reprend l'appel ou retourne. L'opcode `$03` remplace directement le pointeur de séquence. Un saut vers une adresse plus basse n'est donc pas une preuve suffisante d'un tour complet de morceau : il peut appartenir à une petite répétition interne.

Pour proposer des points de boucle en lecture seule, enregistrer à chaque image un tuple conjoint des **8** pointeurs musicaux, compteurs de durée/gate, flags actifs, durée implicite/mode, sélecteur `$ED`, tempo `$26/$27/$EC`, et seulement les slots de pile actuellement actifs pour chaque flux. Écarter les répétitions sur des images voisines (l'ordonnanceur n'avance pas forcément chaque image), demander une séparation minimale et au moins trois occurrences cohérentes du même état conjoint. Cela donne des **candidats de boucle de séquence**, pas des points PCM exacts.

Il faut ensuite affiner les limites sur les samples PCM et inspecter le raccord. Les enveloppes DSP, phases des oscillateurs, filtres de pitch/rééchantillonnage et mémoire d'écho peuvent différer malgré des pointeurs identiques. Une observation à 60,0988 images/s ne localise pas exactement un tick audio à 32040 Hz ; une coupe au seul numéro d'image peut cliquer. Ne pas remplacer ces limites par une durée arbitraire et appeler le résultat une boucle fidèle. Les musiques à intro doivent conserver une intro distincte du segment récurrent.

## Signatures de contrôle conservées

Les empreintes ci-dessous délimitent les régions de preuve dans la ROM fournie (offsets sans en-tête copieur) :

| Région | Offset fichier | Octets | SHA256 |
|---|---|---|---|
| Music/SFX port dispatcher | `0x0AA490` | 51 | `e6c4286489d6c1b97b2e551a5b110cb5f9fa2f0469f01f76a2aadccdd9be4f0f` |
| Channel sequence fetch | `0x0AA615` | 21 | `45c3bed893b71a10b9d6fa30180d08e3526f44d17e0bf175e4fd70d17ea5e0c2` |
| Absolute sequence jump | `0x0AA99E` | 21 | `189a42f88f23dc727343d971097e8b7fc9147f1c4d8ef14fb13776457667f9e5` |
| Repeated subroutine call | `0x0AA9B3` | 53 | `e35b06c29ddfcf82d0aca3c626c654577f107b7af6b8da821c7d688dd3968a87` |
| Repeat/return | `0x0AA9E8` | 63 | `bc046617ba16a058ed9937d0b6f6631e266bb5f3ef8145883a4ef743696aaace` |
| SFX initialization / pointer lookup | `0x0AB002` | 107 | `85d5a6ae9424f6b3d9084d755beeeeba81f09ae25b962dcf22afa2098da7f1ec` |
| CPU SFX wrappers | `0x3FFB62` | 76 | `1abbdbfcd24b5265ad61e1c306af7856817203606e1475ba6230d9c72d4c1f8d` |
| CPU APU command protocol | `0x0AB1AF` | 28 | `674cbb77c02088355d95742ae6468a3da132bd90de443dd4549725037a6d7d73` |
| 49 SPC sequence handlers | `0x0AAE9E` | 98 | `33ea89a0fbae993b577bd8cd184c7443eb19b7ab38fd60e99be018665ad1d02a` |

La table des 49 handlers à ARAM `$1014` a également été lue dans l'instance SPC700 réelle. Ses premières cibles sont `$0A6E` (END), `$0ABA` (instrument), `$0AE3` (volume), `$0B14` (saut), `$0B29` (appel), `$0B5E` (répétition/retour). Cela confirme les déplacements par rapport aux labels USA 1.0 `$0A69`, `$0AB5`, `$0ADE`, `$0B0F`, `$0B24`, `$0B59`.

## Limites restantes

Le catalogue est une capture contrôlée du pilote authentique dans Snes9x ; il ne prouve pas une égalité avec une sortie analogique de console. Les labels source, le choix de voix et le contexte d'écho doivent encore être vérifiés pour chaque événement réellement utilisé. Les fichiers de quatre secondes ne constituent pas des boucles finalisées. Le choix de formats compressés, points de coupe, voix simultanées et intégration mobile appartient à l'étape suivante. Cette passe ne modifie pas `audio.ts` ni `App.tsx` ; elle prépare les assets locaux et leur manifeste pour l'intégration par l'agent principal.


## Conditionnement navigateur réalisé

`scripts/package_rom_audio.py --captures-root /chemin/runtime-rom` vérifie la SHA256 de la ROM, les empreintes des WAV capturés, les identifiants musicaux réellement observés et les dépendances d'instruments avant de générer les fichiers suivants :

- `public/audio/manifest.json` : objets `music` et `effects` indexés par ID décimal sous forme de chaîne ; URLs, noms, IDs source, durées, empreintes et provenance.
- `music-00.m4a` à `music-26.m4a` : **27** captures réelles, AAC cible **96 kbit/s**, stéréo, rééchantillonnées de 32040 à **32000 Hz**, en conteneur M4A avec index au début (`faststart`). Ce format permet le streaming mobile ; il est explicitement **avec perte**.
- `sfx-00.wav` à `sfx-76.wav` : **119** effets PCM stéréo d'origine. Seules des trames exactement nulles à la fin sont retirées, avec une garde de 40 ms. Aucun échantillon restant n'est modifié. Les trois sons aquatiques utilisent leurs captures de remplacement.
- `reference/audio-runtime-capture.json` : manifeste, rapports des quatre groupes de captures et validation ; les gros WAV sources restent dans `work/runtime-rom/`.

Le manifeste et les assets pèsent **53 681 710 octets** (environ 51,2 Mio). Les musiques doivent être chargées à la demande par streaming, sans décoder les 27 morceaux en buffers WebAudio. Le catalogue entier n'a pas à être préchargé au démarrage.

Les **19** candidats de boucles conservent `samplePerfect: false` ; les huit autres morceaux portent `loop: null`. Aucune limite arbitraire n'a remplacé une boucle absente. Les durées et limites restent sur la même timeline, car l'encodage conserve toute la capture et son silence initial.

Validation effectuée après génération : les 27 M4A ont été ouverts par ffprobe (AAC, 32000 Hz, deux canaux, durée cohérente) puis entièrement décodés par FFmpeg sans erreur ; les 119 WAV ont été comparés octet pour octet au préfixe PCM source, et toutes les trames retirées étaient nulles ; les **146** empreintes SHA256 d'assets correspondent au manifeste. Les valeurs de crête et niveaux d'origine n'ont pas été normalisés.
