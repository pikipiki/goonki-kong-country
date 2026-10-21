# Correction des superpositions et des imports ROM

21 octobre 2026. Cette passe complète les corrections de collision et de carte.

Les anomalies provenaient à la fois de doublons de décor et d’erreurs d’import : un parcours de jungle était dessiné avec la carte de grotte, le parcours Minecart Madness recevait le terrain Carnage, et le lagon était lu avec le rangement et les attributs de la jungle puis comprimé verticalement.

Les environnements sont désormais choisis depuis les routines d’entrée réellement présentes dans la ROM Rev 2. Les tableaux `routeEnvironmentEvidence` et `environmentData` de `level-tables.json` conservent les pointeurs et signatures. L’extraction marine vérifie la signature à 0x018187, les rangées de 128 octets, les 197 attributs à 0x29C380 et la table de profils à 0x01844B. Script reproductible : `scripts/analyze_coral_terrain.py`.

Le lagon possède une échelle uniforme de 32 pixels par unité et une pose de nage adaptée. Les terrains, objets et personnages utilisent le même repère. La caméra suit la hauteur des parcours importés. Le parcours appelé Reverb Cave apparaît maintenant sous son nom réel, Barrel Cannon Canyon ; Mine Cart Carnage devient Mine Cart Madness, conformément aux entrées importées.

Côté rendu : végétation reculée derrière les personnages, pas de faux plan d’eau sous les niveaux terrestres, murs sans double façade, caches cachées avant révélation, disparition immédiate des murs cassés et suppression des rectangles de repérage des salles bonus. Le wagon ne s’affiche plus hors du parcours wagon. La jungle reçoit un soubassement en retrait et des appuis derrière les plateformes hautes. Les surfaces de collision jouables restent présentes.

Validation : 143 tests dans 26 fichiers, dont adresses d’environnements, échelle marine et existence d’un corridor de nage entrée–sortie ; rayons sur les sols 3D ; tests navigateur des étapes et du décor. Les tests navigateur contrôlent les couches à 9 positions, dans les 7 parcours, plus le portrait. Détails des commandes dans le handoff.

Les habillages 3D restent une adaptation, et les points d’entrée ne sont pas tous vérifiés par exécution native. Ces contrôles ne prouvent pas un parcours humain intégral ni la fidélité complète au jeu original.
