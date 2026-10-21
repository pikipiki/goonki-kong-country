# Analyse ROM et intégration 0.4 — 21 octobre 2026

## Résultats vérifiés

La référence reste exclusivement la ROM USA Rev 2 fournie, SHA-256 `628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527` (4 194 304 octets). La source communautaire USA 1.0 sert à naviguer ; les signatures et tables sont relocalisées dans les octets de la Rev 2.

Les cinq producteurs statiques ont été réexécutés avec succès. L’audit transversal revérifie 55 observations explicites `fileOffset+bytes` couvrant 962 octets distincts, sans rapport manquant. **Ce chiffre ne mesure pas la complétude de l’analyse** : les tables et flux décodés sont bien plus grands et possèdent leurs propres contrôles de taille, empreinte et cohérence. Aucune désassemblage complète n’est revendiquée.

## Exécution réelle de la ROM

Un frontend libretro Python a été construit dans `scripts/snes_probe.py`. Il exécute Snes9x compilé depuis la source officielle, commit `fae2fea08f74180759ef540ee94259213f503480`, avec le patch d’observation `scripts/snes_analysis_bridge.patch`. Le cœur reste dans l’espace de travail `work/snes9x/` ; ni lui ni la ROM ne sont nécessaires dans le navigateur livré.

Le bridge expose la RAM audio, les registres DSP et le protocole de ports ; il ne modifie pas le code du jeu. Les séquences de démarrage, menus et Jungle ont été effectivement exécutées. Captures, états et entrées sont conservés dans `work/runtime-rom/`. Les traces séparent les parties jouées par boutons des manipulations mémoire contrôlées utilisées pour sélectionner ou isoler les sons.

L’émulateur rapporte **60,0988118623 images/s** et un rendu sonore **32 040 Hz stéréo**. Les conventions du jeu web restent 60 ticks/s et 32 pixels par unité. Ce n’est pas une mesure sur une console physique.

## Physique : observations puis corrections

`reference/player-states.json` contient désormais **18 signatures** supplémentaires et le décodage borné des préparations d’animation. `reference/runtime-player-analysis.json` conserve les séquences d’entrées et les traces réelles, sans patch RAM, pour DK et Diddy ; Diddy a été libéré puis sélectionné par les contrôles normaux.

- Rose/DK : impulsion normale brute 1792, soit 13,125 unités/s.
- Violette/Diddy : 2138, soit 15,6591796875 unités/s ; le moteur utilisait auparavant 14,7.
- L’impulsion apparaît à la deuxième frame observée, avant le déplacement de la suivante. Le prototype applique encore le saut immédiatement : cette préparation n’est pas encore reproduite.
- Le saut maintenu utilise −72 pour DK et −90 pour Diddy **pendant la descente aussi**. Le moteur ne réduit plus cette gravité à la montée.
- Le lissage horizontal est quantifié dans le domaine 8.8 : un huitième de l’écart à la cible par tick. La marche au sol du moteur suit maintenant les premiers échantillons réellement mesurés, ainsi que le freinage progressif. La nage, les animaux et la glace gardent leur traitement spécifique encore à comparer.
- Six tests utilisent ces traces comme oracle numérique, et non seulement comme copie des formules du moteur.

Sont aussi prouvés statiquement : porter avec Y maintenu, lancer au relâchement ou poser avec Bas ; impulsions du tonneau lancé ; 16 directions du canon de base ; portion initiale sans gravité et sans contrôle. **Ces dernières corrections ne sont pas toutes intégrées** : le jeu conserve encore la commande de portage par bascule adaptée au clic et la balistique simplifiée des canons. Les données et délais sont prêts pour la suite.

## Terrain et objets originaux

`reference/level-tables.json` et son producteur contiennent notamment :

- Table de 14 environnements ; 230 correspondances entrée→niveau ; 230 pointeurs entrée→objets.
- 66 enregistrements d’objets pour Jungle Hijinxs et 41 pour Coral Capers.
- Jungle : grille de 169×16 métatuiles de 32 pixels, attributs et 63 profils de collision.
- 112 pointeurs de formations de bananes et décodage des bitmaps requis.

`originalTerrain.ts` reproduit le sondage borné dépendant de Y et de ses voisins ; il conserve les étages superposés. Les tests comprennent par exemple un sol à Y175 et une autre plateforme à Y351 au même X. Le rendu `OriginalGround.tsx` utilise l’union de tous les intervalles solides et ne réduit pas le décor au maximum de chaque colonne.

**Le premier parcours lancé depuis l’interface utilise désormais ces données originales** : départ X156/Y175 avec origine verticale175, quatre lettres KONG, 34 bananes issues des bitmaps, quatre régimes valant10, onze ennemis compatibles, quatre tonneaux, cinq ballons et la caisse Rambi. Les coordonnées et les omissions sont détaillées dans `ORIGINAL_JUNGLE_PROVENANCE`. Les générateurs peuvent reproduire les fichiers TypeScript.

Il reste **3 placements jungle non importés** (métadonnées porte de sortie / scripts partiels) et des comportements non reproduits. Le sondage est authentique, mais la résolution des collisions du joueur, les parois/plafonds, le rendu des façades, les animations et l’IA demeurent partiellement adaptés. Les six autres étapes sont encore des créations du prototype. Coral Capers expose **37 placements ROM** via `ROM_CORAL` (niveau 3, route originale), dont panneaux et jeton buddy en décor ; collision sous-marine utilise des bandes **512 px** sur l’axe Y ROM. La carte 3D conserve les sept étapes actuelles.

## Audio réellement issu de la ROM

`analyze_audio_rom.py` vérifie le bootstrap, le pilote SPC700 de 3451 octets, 70 échantillons BRR, 27 séquences musicales et 28 listes d’instruments. Des différences réelles avec la version1.0, dont l’adresse de synchronisation, sont documentées.

Le menu de test musical intégré au jeu a ensuite été activé par des changements WRAM enregistrés ; les **27 musiques ont été capturées en PCM via l’émulation du pilote réel**. Les effets ont été capturés en isolant les canaux par des changements ARAM documentés, sans modifier la ROM. Les banques BRR réellement chargées ont été comparées à la ROM ; trois effets aquatiques ont été recapturés avec leur banque correcte.

Livraison locale dans `public/audio/` : **27 fichiers M4A AAC et 119 fichiers WAV**, manifeste et provenance, total environ51,2 Mio. Les 27 M4A se décodent intégralement ; les 119 WAV correspondent au préfixe PCM de leurs captures avec suppression de queues entièrement nulles seulement ; les 146 empreintes d’assets correspondent au manifeste. La compression AAC est avec perte : ce n’est pas une restitution PCM identique des musiques.

`audio.ts` remplace la synthèse provisoire par ces captures : musique selon scène, titre et carte ; effets identifiés pour collecte, vies, lettres, changement, dégâts, canon et animaux. Les événements sans identifiant établi restent silencieux. Les musiques sont diffusées par HTMLAudio pour ne pas décoder plusieurs minutes de PCM dans la mémoire du téléphone ; les effets courts utilisent Web Audio. Pause, reprise et coupure sont gérées.

**Limites audio :** 19 boucles sont candidates par répétition d’état du séquenceur et ne sont pas validées à l’échantillon près ; huit n’ont pas de point de boucle identifié. Le retour à la boucle via HTMLAudio peut avoir une discontinuité. Les effets inconnus/inutilisés du catalogue ne sont pas tous associés à un événement du prototype. Priorités et mixage exacts du moteur original restent à reproduire. La validation navigateur prouve chargement, décodage, progression temporelle, changement de piste et pause/reprise ; une écoute comparative complète et le contrôle sur iOS restent à faire.

## Validation de cette passe

- TypeScript : réussi.
- **78 tests unitaires, onze fichiers : réussis**, dont `necky-ballistics.json`, bonus/canon/Necky, fixture `jungle-parity-walk.json` (**120** frames dk-walk recapturées).
- Nouveau contrôle navigateur `test:original` : sol original actif, quatre lettres KONG, déplacement, lecture de DK Island Swing et d’un bruitage, passage à Aquatic Ambience, pause/reprise, portrait/paysage ; aucune erreur.
- Tests navigateur et mobile historiques : réussis sur le build intégré, avec attente de l’arrêt après l’inertie mesurée. Six formats, sept transitions, multi-touch et clic ; aucune erreur.
- Le premier rendu original a été inspecté en capture ; aucune partie complète de Jungle Hijinxs n’est attestée.
- Aucun téléphone physique, aucune parité globale ni rétro-ingénierie exhaustive.

## Suite la plus utile

1. **Jungle Hijinxs** — bonus **authored**, **NutThrowingNecky** (noix), `finishZone` ExitDoor ; parité dk-walk **40 frames** ; pas de niveaux bonus ROM décodés.
2. **Portage / canons** — chemin maintien/relâchement/poser, projectile **896 raw**, compteurs canon par frame de simu, pose visuelle canon ; animations SNES de lancer non reproduites.
3. **Coral Capers** — collision bandes 512 px, sol corail, scatter + fog ; pas d’extraction graphique ROM.
4. **Audio** — mapping SFX étendu (`place`, etc.) ; validation oreille / mobile hors repo.
5. **DA** — façades procédurales jungle ROM + corail procédural ; **textures/façades chip SNES non extraites**.
