# Tonneaux, carte, environnements et audio — demande explicite du 21 octobre 2026

Ce périmètre est obligatoire dans la demande de fidélité, et non une décoration facultative. La version 0.3.1 ne le couvre pas encore intégralement.

## Tonneaux

Présents : ramassage/port/lancer au bouton Action, projectile en bois qui roule maintenant sur le sol avant de casser sur un ennemi, tonneau de secours, checkpoint, canon dans lequel la peluche entre puis est masquée. Sauter ou Action déclenche le départ ; les libellés deviennent Décoller/Tirer.

Correction 0.3.1 : l’impulsion du canon n’est plus freinée par la marche dès la frame du tir. Une protection spécifique évite de réentrer aussitôt dans le canon de départ ; elle ne bloque pas l’entrée dans le suivant. Le canon de canopée oscille et son orientation visible utilise le même angle que le tir. La simulation sait aussi gérer `autoFire` avec délai de préparation ; cette variante n’est pas encore placée dans un parcours livré. Valeurs d’oscillation, vitesse de projection et délais restent des réglages d’adaptation, non des constantes ROM vérifiées.

À reconstruire/vérifier : port et lâcher selon personnage, maintien/relâchement natif du bouton vs bascule actuellement utilisée pour le clic, dépôt au sol, collisions du tonneau porté, tonneaux acier sur lesquels monter, TNT, pièges et tonneaux spéciaux, canons mobiles/rotatifs et automatiques placés fidèlement, chaînes/entrées de bonus, tonneaux sauvegarde/transport et objets des niveaux spécifiques. Des noms comme SteelKeg et TNTBarrel sont présents dans le désassemblage de navigation ; cela ne prouve pas tous leurs états dans la Rev 2.

## Carte et environnements

La carte 0.3.1 possède une île en vraie géométrie 3D, des zones et un chemin ; les deux modèles Goonk se déplacent de proche en proche vers l’étape sélectionnée. Les étapes verrouillées restent bloquées. Cliquer une carte sélectionne maintenant le lieu ; le bouton Entrer lance cette étape. Des boutons HTML rendent ce choix accessible sur téléphone, sans exiger de viser les petits marqueurs 3D.

**Limite importante :** cette carte relie les sept parcours actuels, pas les emplacements originaux. Les six régions d’origine sont Kongo Jungle, Monkey Mines, Vine Valley, Gorilla Glacier, Kremkroc Industries Inc. et Chimp Caverns, plus le bateau final. Une région n’est pas un seul biome ni un seul niveau. Le jeu livré contient jungle, canopée, mine en wagon, lagon, neige, temple et bateau ; les usines, plusieurs forêts/grottes, glaciers, ponts, villages arboricoles et tous les parcours/variations d’éclairage/climat ne sont pas reconstruits fidèlement. Les cartes de région, raccourcis et services de Cranky, Candy et Funky restent à ajouter.

## Musiques et bruitages : statut sans ambiguïté

L’audio livré est **toujours une synthèse originale provisoire**, avec une boucle commune et quelques sons d’événements. Ce ne sont ni les musiques ni les bruitages originaux. Ne pas les présenter comme fidèles.

`audio-inventory.json` conserve **27 noms de musiques et 119 étiquettes d’effets** trouvés dans `Misc_Defines_DKC1.asm` du désassemblage communautaire USA 1.0. Ce sont des identifiants de navigation : la liste contient aussi `None`, des inconnus et des étiquettes potentiellement inutilisées ou apparentées ; ce n’est pas un décompte vérifié de sons uniques. Aucun audio n’a été extrait ni aucun identifiant de playback validé dans la Rev 2 par cette opération.

Exemples de pistes à retrouver avec leurs contextes : DK Island Swing, Aquatic Ambience, Cave Dweller Concert, Mine Cart Madness, Life in the Mines, Northern Hemispheres, Ice Cave Chant, Voices of the Temple, Forest Frenzy, Treetop Rock, Fear Factory, Simian Segue, Gangplank Galleon ; aussi titre, bonus, boss, victoire, mort, game over, générique et services Kong. L’orthographe exacte des symboles source est conservée dans le JSON.

Suite technique : analyser le chargement SPC700 et les tables de morceaux/effets dans la ROM fournie ; relocaliser les pointeurs de la Rev 2 ; identifier flux de séquence, driver et échantillons BRR ; valider par exécution/capture SNES. Une restitution peut s’appuyer sur des données SPC ou sur des exports audio locaux vérifiés. Ne pas choisir de fichiers web vaguement similaires. Le code de navigation `SPC700/` et `AsarScripts/AssetPointersAndFiles.asm` existe dans la copie de travail du désassemblage, sans être inclus dans l’application.

Ensuite gérer boucles propres, transitions de zones/cartes/bonus/boss, jingle de collecte et de fin, priorité/interruption des effets, volume indépendant musique/effets, pause, reprise après interruption mobile et déverrouillage audio par interaction. La validation doit écouter et comparer, pas seulement compter des appels Web Audio. Aucun de ces points ne doit être marqué réalisé sans test.

Source de navigation : [Donkey Kong Country 1 Disassembly](https://github.com/Yoshifanatic1/Donkey-Kong-Country-1-Disassembly). La ROM de l’utilisateur reste la référence pour les preuves Rev 2.
