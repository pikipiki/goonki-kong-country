# Fidélité demandée — état réel 0.3

L’utilisateur exige désormais une forte fidélité à la DA, au gameplay, à l’univers et aux mécanismes du Donkey Kong Country original, avec les deux Goonk en protagonistes. La fidélité complète est l’objectif de continuation, pas un résultat acquis.

| Domaine | Présent | À établir ou reconstruire |
| --- | --- | --- |
| Physique | Gravité, rebonds, saut maintenu issus de signatures ROM ; nouvelles valeurs montées/roulades | Impulsions de saut à pied, tous états, accélérations et chronologie exacte ; comparaison émulateur |
| Roulade/roue | Pose distincte, état et élan, chaîne accélérée, saut hors rebord ; Klump vaincu par les deux | Durées d’animation, interruption, exactitude de la chaîne en situation réelle |
| Rambi | Caisse, dos, course, corne, saut, fuite/récupération | Secrets ouverts par la corne, IA de fuite et collisions exactes |
| Enguarde | Dos, nage 4 axes, rostre, vitesse du rostre vérifiée | Nage normale et chronologie exacte, vrais poissons/requins/croctopus au lieu des ennemis provisoires |
| Winky | Saut et gravité montés vérifiés, écrasement des abeilles | Animations/timing et contacts exacts |
| Expresso | Course/saut vérifiés, flutter, petits ennemis enjambés | Flutter soutenu encore adapté ; confirmer enveloppe et réactivation |
| Autres mécanismes | Tonneaux, secours, checkpoints, canons, wagon, eau, glace | Cordes/lianes, pneus, tonneaux acier/TNT, portes bonus, jetons animaux, plateforme stop/go et autres gimmicks |
| Monde | Sept étapes et carte de déblocage | Tracés originaux, totalité des régions/niveaux et boss, services de Cranky/Candy/Funky, Squawks non montable à lanterne |
| DA | Vraie 3D, silhouettes, feuillages et fougères denses, rochers, coraux, lumière chaude/profondeur sombre | Captures ROM comparables, textures et proportions affinées par biome, comparaison systématique ; aucune parité exacte attestée |
| Son | Synthèse originale | Ambiance et structure sonore fidèles à étudier sans les présenter comme déjà identiques |
| Mobile | Deux orientations, tactile simultané, clic, nage verticale explicite | Appareils physiques iOS et Android, confort et cadence sur matériel réel |

## Méthode de continuation

1. Capturer la ROM fournie dans un émulateur avec des entrées reproductibles et lecture des positions/vitesses/états, si un runtime SNES adapté est disponible. Ne pas utiliser le mode 6502 de REA comme désassembleur 65C816.
2. Comparer la même séquence et la même échelle dans le moteur web, en commençant par la roulade, son saut hors rebord et les quatre montures.
3. Tracer les scripts d’animation et transitions concernés, puis relocaliser leurs signatures dans la Rev 2. La source USA 1.0 aide à naviguer, mais ne prouve pas les octets de la Rev 2.
4. Relever les parcours et les objets originaux avant de revendiquer leur reproduction. Remplacer progressivement les sept parcours actuels plutôt que les renommer comme s’ils étaient identiques.
5. Mesurer la DA avec des cadrages jumelés et retester le téléphone avant d’ajouter des détails coûteux.

## Sources et preuves

- [Manuel Nintendo : commandes et animaux](https://www.nintendo.com/es-es/games/oms/snes-classic/manuals/dk-country/manual.pdf).
- `buddy-analysis.json` et `buddy-analysis.md` : 14 signatures locales et limites.
- `rom-analysis.json` et `reverse-engineering.md` : premières signatures et provenance.
- `art-fidelity.md` : références visuelles réellement consultées et limites.

Ni rétro-ingénierie exhaustive, ni validation par exécution SNES, ni jeu intégralement fidèle ne sont revendiqués. La prochaine étape exige des preuves supplémentaires, pas une réécriture spéculative.
