<!-- architecture-review-2026-10-22:start -->
# Reprise prioritaire — architecture, 22 octobre 2026

Dépôt canonique : `/Users/sevenone./Documents/git/goonk-country`.
Branche **`main`**, poussée sur `origin`. Les anciens chemins des sections
historiques ci-dessous peuvent avoir été regroupés.

Lire `docs/architecture.md`, `docs/architecture-review.md`, `CONTRIBUTING.md`
et `SECURITY.md` pour l’organisation actuelle et les preuves de validation.

- `src/` passe de 397 à 340 fichiers ; modules regroupés par responsabilité.
- Configuration sous `src/config/`, terrain numérique sous `src/game/data/`.
- Catalogue partagé `src/game/stageCatalog.ts` ; API moteur publique conservée.
- `npm run check:architecture` : aucun orphelin, aucun cycle runtime.
- Chargement différé 2D/3D ; silhouette 2D générée depuis le même profil 3D.
- Cache marin borné/immuable : 100 000 requêtes, 484 → 14 ms, même résultat.
- Sauvegardes et paramètres URL validés, CSP et CI sécurisées ; audit npm : 0.
- 465 tests et 3 E2E passent ; les 11 fonctionnels passent, canyon/corail
  terminés sans mort avec dégâts actifs. Production mobile racine/Pages validée.
- Correction des indices d’atlas des objets du boss 2D et de l’échelle explicite.
- Les captures/journaux sont maintenant dans `artifacts/` (ignoré par Git).
- Couche React : `src/containers/`, `src/hooks/`, `src/lib/` (plus de `src/app/`) ;
  UI présentationnelle dans `src/components/` ; imports `@containers`, `@hooks`,
  `@lib`, `@components` (voir `docs/architecture.md`).
- **TypeScript `~5.9.3`** (stable, dans la plage `typescript-eslint` ; `baseUrl` +
  alias dans `tsconfig.app.json`).

Validation finale terminée : chaîne demandée, 465 tests / 85 fichiers,
3 E2E, build, architecture, 11 fonctionnels et 12 cas mobiles de production
(racine + préfixe GitHub Pages). Canyon et corail : zéro mort, dégâts actifs.
Les contrôles supplémentaires du boss, décor, parcours 2D et hot reload passent.
Le test HMR modifie temporairement le vrai module de classe
`src/game/engine/gameSession.ts` ; son contenu a été restauré et contrôlé.

Preuves : `artifacts/review/summary.json`, journaux voisins et
`artifacts/browser/` ; ces sorties sont ignorées par Git. Lire le rapport de
revue pour les réglages, corrections et limites de validation. Aucun problème
identifié ne reste à corriger dans le périmètre vérifié.
Déploiement Pages : via CI GitHub sur `main` si configuré.
<!-- architecture-review-2026-10-22:end -->

---

# État prioritaire de reprise — 0.4.0 (22 octobre 2026)

Pour la session courante, le bloc **« Reprise prioritaire — architecture »** en
tête de ce fichier prévaut sur les sections historiques ci-dessous.

---

## Dernière correction — défilement du décor du boss 2D (22 octobre 2026)

Priorité sur les historiques. **Commité** : `BossScene2D` ancre le décor boss au monde (salle ROM 12 u, même projection que la caméra/acteurs) ; script `boss-scenery-browser.mjs`, preuves `reference/boss-scenery-*`. Physique inchangée. **257 tests / 40 fichiers**.

Vérification : `scripts/boss-scenery-browser.mjs`, 390×844 et 844×390. Déplacement réel avec les boutons directionnels de x=3 à ~10,6, puis retour ~2,6 ; aucune écriture dans le jeu. Le bateau défile dans les deux sens exactement avec le déplacement de caméra ; échelle et hauteur du sol stables, 2PV/5vies conservés, aucune erreur JS. Captures `reference/boss-scenery-{portrait,landscape}-{left,right}.png`, mesures `reference/boss-scenery-browser.json`. Les 257 tests/40 fichiers et la compilation TypeScript/Vite passent. Les précédents tests de combat restent documentés ; pas de nouveau combat complet pour cette correction visuelle seule.

---

## Priorité de reprise — objets du boss, limites visibles, douleur et boulets (22 octobre 2026)

Cette section prévaut sur les historiques ci-dessous. Livré en commit : objets boss ROM 2D, `bossArena.ts`, SFX douleur/boulets, boulets 3D, preuves `boss-feedback-*`. **257 tests / 40 fichiers**.

- **Objets du boss 2D** : les anciens carrés fixes de 8 pixels sont remplacés par les sprites ROM des tonneaux normal, DK et checkpoint, avec lettres DK superposées. Échelle commune de 1,1 unité au sol, porté et lancé, adaptée à la caméra portrait/paysage. Ancre portée partagée avec le point de lancement ; un tonneau roulant repose à hauteur cohérente avec son dessin. Les tonneaux lancés infligent bien un dégât au boss, y compris dans le navigateur avec les vraies commandes tactiles.
- **Limites du bateau** : `bossArena.ts` fournit les mêmes extrémités aux deux rendus et au moteur. Mâts visibles à x=0/22 ; centre des peluches limité à 0,75/21,25, vitesse annulée au contact. Le pont entier se traverse sans obstacle intérieur, y compris en portant un tonneau (test moteur isolant la géométrie). Les objets lancés se brisent au bord. Suppression des bananes/5 lettres procédurales auparavant invisibles et superposées au centre de ce niveau ; les 3 tonneaux authored restent présents.
- **Douleur du boss 2D/3D** : événement partagé `boss-hurt`, SFX ROM `0x53` (83, intitulé KillKrusha dans le manifest), une seule fois par coup réussi après 6 images de simulation. Le dernier coup joue aussi le son ; une tête couronnée qui ne perd aucun PV ne grogne pas. SFX atterrissage boss `0x15`, impact boulet `0x1E`.
- **Boulets 3D et moteur partagé** : chute accélérée par poses tenues 2 ticks, impact marqué de 100 ms, écrasement visuel, rebond puis disparition au second contact. Rendu et collisions lisent les mêmes positions. **La cadence 30 Hz, l'écrasement et les vitesses sont une adaptation mobile ; ne pas les présenter comme des timings SNES vérifiés.** Le script ROM confirme l'impact et l'impulsion de rebond `$0600`.
- **Preuve ROM** : identité du ZIP vérifiée via REA, puis lecture des octets Rev2 exacts et navigation dans le désassemblage local (65816 natif non pris en charge par REA, session fermée). SHA ROM `628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527`. Animation douleur `$1A8`, pointeur PC `$3E88C2` → `$EBDA`, script PC `$3EEBDA` : `02 44 16 02 48 16 02 4C 16 8F 53 10 50 16`. Trois poses ×2 images puis commande sonore `8F53`. Voir `reference/boss-feedback-rom-evidence.json`.

**Validation : 257 tests / 40 fichiers, build TypeScript/Vite et diff-check passent.** `tests/boss-feedback.test.ts` ajoute 9 tests : traversée des limites avec/sans tonneau, pickup/lancer/sol/bord, dégât par tonneau, absence de ramassables invisibles, premier/dernier cri, couronne protégée, cadence/impact/rebond.

`node scripts/boss-feedback-browser.mjs` : Chrome tactile indépendant, 390×844 et 844×390, **8 sauts réels réussis** (2 peluches ×2 orientations ×2 rendus), chaque fois boss 9PV, joueur 2PV/5vies. Lecture effective du buffer83 avec PCM non nul et AudioContext running. En 2D : même facteur d'échelle des sprites au sol/en main/lancés, saut avec tonneau conservé, lancer infligeant 1PV, vraies touches vers les deux limites visibles. En 3D : poses tenues, impact écrasé et rebond mesurés dans les groupes Three. Aucune erreur JS. Ces reproductions contrôlent seulement les positions initiales et la phase de démonstration des boulets ; elles ne constituent pas un parcours complet. Données/captures `reference/boss-feedback-browser.json`, `boss-feedback-*`, `boss-barrel-*`, `boss-arena-*`, `boss-ball-impact-*`.

**Combat complet rejoué après les changements**, via `boss-battle-browser.mjs` : victoire 10 coups, **87,9 s**, **583 décisions clavier**, **0 mort**, fin 1PV/5vies ; aucune erreur JS. Partie réelle strictement lue, dégâts actifs, aucune écriture de position/PV/horloge/invincibilité. Le contrôleur planifie sur copies isolées pendant une pause commandée par P. Toutes les familles d'attaques et la fausse défaite sont traversées. Ce résultat remplace les anciennes mesures 77,75 s/515 décisions. Rendu du parcours complet : 2D, moteur partagé ; la 3D a reçu les vérifications ciblées ci-dessus.

Limites : pas d'appareil iOS physique, pas de nouvelle traversée complète jungle/mine, pas d'émulation exacte des timings SNES. Rapport détaillé : `reference/boss-objects-feedback-report.md`. Ne pas réintroduire les ramassables procéduraux sur le pont pour satisfaire l'ancien test GOONK : ce test exige toujours les lettres dans les 6 stages ordinaires, et aucun ramassable dans l'arène du boss.

---

## Dernière passe — portrait3D, tonneauDK, carte plein écran et grand boss (22 octobre 2026)

Priorité sur les sections historiques. Dernière livraison commitée : zoom 3D portrait, tonneau DK 2D, carte cover/pan, boss agrandi + contrôles tactiles, cadrage mobile (`mobile-framing-browser.mjs`). **248 tests / 39 fichiers**.

- **Zoom3D portrait** : champ8,2unités au lieu de12,8 (+56% en taille à l'écran), anticipation1,45 ; garde la peluche/compagne et une réception à5unités dans le cadre. Le boss3D portrait suit aussi la caméra rapprochée, avec suivi vertical des grands bonds. Paysage3D conserve le cadrage large du combat. Modèles des peluches inchangés.
- **TonneauDK2D** : le corps utilisait déjà la palette bois correcte`$3C872E`. Le logoDK utilisait cette même palette, d'où ses gris, et n'était pas superposé au corps dans Scene2D. Palette du logo corrigée en`$3C86F2` + overlay animé à la même ancre que le corps. SourceDKBarrelLetters_Main confirme qu'il suit les coordonnées du tonneau, et DATA_B58ABB utilise BC86F2. Atlas301images régénéré avec`--sprites-only`, décors conservés. Tests de palettes incluent maintenant corps et lettres.
- **Grandes commandes boss** : deux rectangles arrondis de96px de haut, largeur~75–108px selon écran, au lieu des petits disques64–72px. Modeclic/maintien/tactile et saut indépendant conservés. Les boutonsAction/Swap ont aussi été séparés en paysage pour supprimer leur ancien chevauchement2px. Styles `.boss-controls`.
- **Carte2D** : l'image ROM elle-même couvre toute largeur/hauteur (`cover`, ratio préservé), sans les bandes d'océan autour de l'ancienne île réduite. Caméra suit les voyageurs ; glisser permet d'explorer les parties hors cadre. La sélection d'une destination remet le pan manuel à zéro et les voyageurs s'y rendent. Sept boutons nommés toujours accessibles ; un clic sur un marqueur visible utilise la projection courante. Les voyageurs ont une échelle adaptée au zoom pour ne pas masquer la carte. `romMapLayout`, `IslandMap`. Certains points source sont normalement hors cadre en modecover ; ne pas remettre le test ancien exigeant tous les points source visibles simultanément.
- **Boss agrandi et atteignable** : tête physique2,8unités / largeur1,25. Sprite2D calibré sur l'ancre de la tête SANS couronne (65+5px), et non l'imageidle96px avec la couronne qui réduisait le corps. Modèle3D aligné sur cette hauteur. Sauts sur le bateau seulement : impulsion×1,15 et gravité de saut maintenu durant l'ascension même après appui bref. Rose monte à3,475 ; Violette3,951, donc les deux atteignent la tête après1frame comme après21/90frames d'appui. Autres stages et tailles des peluches inchangés. Caméra2D suit verticalement les sauts/rebonds pour éviter la découpe sous leHUD, surtout en paysage.

**Validation :248 tests /39fichiers passent**, buildTypeScript/Vite etdiff-checkOK ;7testsPython palettes passent. Les six tests moteur de saut vérifient perte1PVboss etaucun dégât joueur sur les deux peluches ×1/21/90frames.

`node scripts/mobile-framing-browser.mjs` :390×844,320×640,844×390 ; image de carte couvrant les4bords, pan tactile effectif, grandes touches dans le viewport sans chevauchement, **6stomps avec vraies touches tactiles**, deux peluches ×3formats, HP2 /5vies, couronne et dégâts actifs. Positions initiales de reproduction uniquement contrôlées ; aucun ennemi supprimé, aucune invincibilité injectée. Captures`reference/framing-{3d,dk,map,boss,jump}-*`, données`reference/mobile-framing-browser.json`.

`node scripts/map-2d-browser.mjs` passe :3formats,7accès3D /2accès2D, anglaispar défaut, aucune erreurJS.

**Combat complet boss agrandi revalidé** via`boss-battle-browser.mjs` : victoire10coups,77,75s de simulation,515décisions clavier,0mort, finHP1/vies6, toutes les phases traversées, aucune erreurJS. Partie jouée strictement lue, contrôleur sur copies isolées, vraies commandes. Rapport/capture/journal`reference/boss-playthrough*` actualisés. Ce parcours remplace la précédente mesure83,57s avant agrandissement.

Limites conservées : Chrome avec formats téléphone, pas de validation sur appareil iOS réel ; pas de nouvelle traversée complète de la jungle/mine ; les autres5stages n'ont toujours pas de rendu2D ; timings/échelles restent adaptés au mobile, pas une émulation exacte de la ROM.


---

## Dernière correction — zoom2D, jetons et son / fin de stage (22 octobre 2026)

Cette section prévaut sur les précédentes (inclus dans le même commit que la passe portrait/carte/boss ci-dessus).

- **Caméra jungle2D** : viewport192px de large en portrait,180px de haut en paysage (zoom ~25% supérieur). Rapport d'aspect conservé, peluches/physique/collisions inchangées. Ancre portrait recentrée pour garder la compagne visible. Dans le bonus, la caméra suit le joueur sur les écrans étroits au lieu de centrer la pièce et couper la peluche à l'entrée. `src/game2d/camera2D.ts`, `Scene2D.tsx`.
- **Boss2D** : caméra qui suit le joueur, champ9unités portrait /18paysage. Les peluches sont ~80% plus grandes à l'écran en portrait et~20% en paysage. Une flèche avec couronne indique le roi hors cadre. Les attaques du boss continuent hors cadre : exception explicite au culling de simulation (sinon le zoom aurait figé le premier lancer). Les alertes de boulets et les objets partagent la même projection ; pont et boutons restent séparés en paysage.
- **Animaux dorés** : les tokens étaient uniquement des `LevelDecor` dessinés. Ils sont désormais ramassés au contact, disparaissent en2D/3D, affichent le compteur et jouent les vrais effets0x60/61/62. `Game.collectedTokens` (positions stables), `animalTokens`, `isTokenCollected`, `collectAnimalTokens`. Source ROM conservée ; ancien décor sans espèce explicite =Expresso, déjà utilisé par son sprite2D. État conservé au retour du bonus, réinitialisé sur nouvelle partie. **Pas de nouveau mini-jeu animal aux trois jetons** : cette passe corrige la collecte et son feedback uniquement.
- **Audio** : sur Chrome avant correction, la disparition totale des SFX au retour du bonus n'a pas été reproduite. Corrections robustes vérifiées : `AudioSystem.wake()` reprend un contexte suspendu au vrai pointerdown/keydown et avant un effet ; manifeste/chargement SFX rejetés ne restent plus bloqués définitivement en cache. Musique bonus16 pendant la pièce, retour musique jungle0 à la sortie. `inspect()` expose état du contexte et voix actives. Mute respecté. App actualise aussi le prototype AudioSystem lors du Fast Refresh pour les onglets déjà ouverts.
- **Fin de stage** : fanfare26 BeatLevel puis retour automatique sur la carte plein écran après7,2s, départ du stage terminé et marche vers le suivant avec sons de pas/arrivée. Le bouton permet de rejoindre cette carte plus tôt. Ancienne petite carte de résultats supprimée ; le joueur choisit le prochain rendu via la confirmation habituelle. Boss final garde l'écran victoire. Les préférences/langues et les7stages accessibles restent conservés.

**Vérifications : 244 tests /39fichiers passent**, dont12 nouveaux tests de cadrage, jetons, boss hors cadre et audio. BuildTypeScript/Vite etdiff-check passent. `npm run test:mobile` :6tailles, rotation/multitouch/clic/pause et7transitions, aucune erreurJS,~59fps dans ce test.

`node scripts/2d-regressions-browser.mjs` passe en390×844 et844×390 : vraie collecte token après positionnement de reproduction, traversée réelle du bonus, musique16→0, suspension AudioContext injectée puis reprise par vraie touche, collecte de banane avec lecture PCM non silencieuse, vraie traversée ExitDoor après positionnement de reproduction, fanfare26, retour automatique sans clic,3pas+arrivée et déplacement dessiné>25px, carte au stage suivant, accès boss2D zoomé. **Tests ciblés, pas une traversée complète de la jungle.** Aucun dommage/ennemi supprimé ni invincibilité ajoutée. Données `reference/2d-regressions-browser.json`, captures `reference/2d-{zoom-jungle,zoom-boss,token-collected,bonus,clear-fanfare,clear-map}-{portrait,landscape}.png`. Le contrôle émule des formats téléphone dans Chrome ; ce n'est pas une validation sur appareil iOS réel.


---

## Priorité actuelle — livraison du 22 octobre 2026 : palettes, carte et boss

Cette section prévaut sur les états historiques ci-dessous. Dépôt canonique : `/Users/sevenone./Documents/git/goonk-country`. Passe livrée en commit (palettes rom2d, carte 2D plein écran, boss 2D/3D partagé, accueil démo). Préserver tailles peluches (Rose 2,2 ; Violette 2,05).

### Demande réalisée

- Wagon : correction existante revalidée, deux oiseaux x106,28125 / x404,34375 × deux peluches × deux orientations, dégâts actifs. Les 8 essais navigateur retrouvent le rail avec HP2 / 5 vies et les 30 ennemis présents, dont 14 abeilles. `tests/mine-bird-landing.test.ts` : 6 tests / 48 configurations internes. **La traversée intégrale de la mine n'est toujours pas prouvée** ; ne pas confondre avec les passages corrigés.
- Palettes 2D : l'extracteur lisait 16 couleurs alors que les sprites ROM stockent 15 couleurs visibles, la transparence étant implicite. Index0 ajouté avant les 15 mots, palettes décor séparées, trou/plate-forme de grotte associés à leurs vraies palettes. 301 images régénérées, arrière-plans existants conservés. Aucune correction artificielle de contraste. `scripts/extract_jungle_2d.py --sprites-only`, `scripts/test_rom2d_palette.py` (7 tests). Comparaison visuelle sur pixels/palettes extraits, pas capture émulateur jungle : `reference/rom2d-palette-comparison.png`, `rom2d-palette-report.md`.
- Carte 2D plein viewport : île ROM entière sans déformation, océan prolongé, 7 destinations nommées et accessibles, cibles tactiles >=44px sans chevauchement. Clavier/clic/tactile et validation. Choix explicite 2D/3D ; **seules jungle0 et boss6 disposent d'un rendu2D**, les 7 stages restent accessibles en3D. Pas de fuite du mode2D en changeant de stage. `src/mapLayout.ts`, `tests/map-layout.test.ts`, `scripts/map-2d-browser.mjs`. Formats390×844,320×640,844×390 vérifiés.
- Accueil : mention courte « 2D demo · Jungle + final boss » et deux boutons directs. Anglais par défaut sur stockage vierge ; préférence française explicite existante conservée. Le correctif tactile évite que l'anti-doubletap global annule des appuis rapprochés sur les boutons de menu.
- Boss commun2D/3D : nouvelle machine `src/game/bossBattle.ts`, intégrée au moteur. Arène22unités visible en entier sur mobile, tailles des peluches conservées. Couronne aller/retour et tête découverte ; après les coups1/2/3, 1/2/3 traversées ; après4/5/6, 3 bonds puis9/17/25 boulets ; après7, fausse défaite/KREDITS puis réveil et2bonds ; après8/9,6/12bonds ; défaite réelle après10. Couronne/boulets dangereux, annonces de chute. Tonneaux blessent encore le boss (adaptation demandée précédemment). Saut tête protégée rebondit sans dégât automatique. HUD10segments et astuce couronne.
- Rendu3D : `src/game3d/BossBattle3D.tsx` anime course, lancer, sauts, blessure, chute/réveil, cape et couronne. Pont doré, filets/cordages latéraux, canons, tonneaux empilés, nuages et île au loin. Suppression du double sol générique et du panneau de sortie pendant le combat. Caméra fixe adaptée aux deux orientations dans `Scene.tsx`.
- Rendu2D : `src/game2d/BossScene2D.tsx` partage strictement les commandes/horloge/physique du moteur ; aucun combat parallèle. Atlas ROM55images/10groupes, vraie capture du décor nu via Snes9x, zones de décor prolongées selon écran sans étirer l'île ni les tonneaux. En paysage, le plan de contact est remonté à65% de la hauteur pour que les commandes ne masquent pas les acteurs. `?demo=2d&stage=boss`. Musique du boss ROM déjà disponible (ID24) conservée.

### Preuves ROM et limites de fidélité

ROM fournie SHA256 `628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527`. REA a identifié le ZIP ; 65816 non décompilé nativement. Désassemblage source utilisé pour naviguer, puis signatures/valeurs vérifiées sur les octets exacts USA Rev2. Table du boss PC0x36EB7A (`DATA_B6EB45` source). **10 fenêtres de coup**, les effectifs des attaques sont sourcés. Durées, vitesses, amplitudes, arène et avertissements restent adaptés au mobile : ne pas promettre une émulation cycle par cycle. `reference/boss-rom-evidence.json`, `boss-background-capture.json`, `boss-rom-reference.png` et rapport boss. La capture du fond utilise entrée contrôlée0x68 et masqueOBJ ; ce protocole d'analyse est distinct du parcours normal. L'île est un spriteOBJ séparé, donc son ajout au rendu2D est nécessaire.

### Validation de cette passe

- **232 tests /37 fichiers passent**, dont19 nouveaux tests du combat et4 du placement carte. Sept tests Python de palettes passent (Python fourni par runtime Codex avec Pillow).
- Build TypeScript/Vite passe ; `git diff --check` passe. Avertissement existant sur taille du bundle, sans erreur.
- `npm run test:mobile` : 6 tailles, multitouch/clic, rotation/pause,7transitions, aucune erreurJS, ~59fps dans ce contrôle.
- `scripts/map-2d-browser.mjs` : plein écran3formats,7accès3D,2accès2D, choix clavier et anglais par défaut, aucune erreurJS. `npm run test:map` passe également.
- **Boss entièrement vaincu avec de vraies touches clavier en2D, dégâts actifs, zéro mort** : 10coups,83,57s de simulation,553décisions, finHP1/vies6. Un PV perdu, une vie supplémentaire ramassée. Toutes les phases traversées. `window.goonk` strictement lu pendant le run ; planification sur copies isolées du moteur, vraie toucheP pour pause. Aucun déplacement/HP/vie/invincibilité artificiel dans la partie jouée. Rapport `reference/boss-playthrough-report.md`, journal `boss-playthrough.json`, capture `boss-playthrough-final.png`, script `scripts/boss-battle-browser.mjs`.
- Captures boss2D/3D portrait390×844 et paysage844×390 sans erreurJS : `reference/boss-{2d,3d}-{390,844}.png`, script reproductible `scripts/boss-visual-browser.mjs` (copies initiales dans le workspace `outputs/`). Les captures de pluie seules utilisent un état de visualisation contrôlé, **pas une preuve de traversée**. Le parcours complet ci-dessus est séparé.

### Suite éventuelle

1. Tester la mine entière (zone x≈360 non résolue par l'ancien pilote), sans prétendre que les seuls huit essais prouvent toute la traversée.
2. Les autres5stages n'ont pas de renderer2D ; le menu l'indique. Ne pas lancer la jungle en2D sous un autre identifiant.
3. La direction artistique3D reste une reconstruction géométrique ; affiner les matériaux/modèles selon retours sans réduire les peluches ni modifier les collisions validées.
4. Mine cart traversée complète et renderer 2D des 5 autres stages restent ouverts. Les sections suivantes documentent des passes antérieures.


---

Cette section prévaut sur l’historique ci-dessous. Dépôt : `Documents/git/goonk-country`. Handoff avant commit : `.cursor/skills/handoff-before-commit/SKILL.md`.

**Dernier commit** : décor boss 2D défile avec la caméra (`BossScene2D`, `boss-scenery-browser.mjs`). Précédent `27884e0` : tonneaux/limites/SFX boss. **257 tests / 40 fichiers**.

## Reprise Gemini et rebonds du wagon — dernière passe

- Rapport demandé par l’utilisateur : **`GEMINI_HANDOFF.md`**. Lire ce fichier en priorité pour reprendre les corrections du wagon et les vérifications restantes.
- Deux enchaînements oiseau→abeille corrigés (x106→114 et x404→412) : abeilles déplacées en hauteur sur copies runtime, rebond forcé complet jusqu’au rail, cohérent sur les deux peluches et après un appui court. Tailles et vitesse du wagon conservées ; aucun ennemi supprimé. Migration du placement pour les parties déjà ouvertes.
- **208 tests / 35 fichiers**, build et diff-check OK. 48 configurations simulées, huit vérifications navigateur en portrait/paysage avec HP2, cinq vies et 30 ennemis actifs. Script `scripts/mine-bird-browser.mjs`, preuves `reference/mine-bird-*`.
- **Limite : pas de traversée complète du wagon validée.** Le planificateur expérimental bloque ses candidats vers x360 ; voir `GEMINI_HANDOFF.md`.

## Démo rendu 2D jungle (ROM) — 22 octobre 2026

- `src/game2d/Scene2D.tsx` + `plushSprite.ts` : canvas 2D, parallaxe calques extraits, sprites sheet `public/rom2d/manifest.json`.
- `App.tsx` : bascule `demo2D`, styles `demo-2d` / `mobile.css`, query `demo=2d|mode=2d|play=2d` (+ `x`/`y` optionnels).
- Extraction : `scripts/extract_jungle_2d.py` → PNG dans `public/rom2d/` (~2 Mo). Pas de remplacement du pipeline 3D existant.

## Enguarde : petites attaques répétables sur mobile — 22 octobre 2026

- Gros bouton droit **Attaque rapide** (flèche horizontale) distinct du bouton Charge. Chaque appui déclenche immédiatement une pointe courte de 0,32 s à vitesse 7,5, sans concentration. Bouton répétable aussi en mode clic : chaque appui recrée un front d’entrée, sans attendre l’ancienne impulsion de saut de 350 ms.
- Bouton Charge inchangé pour la préparation puis le déclenchement de la forte accélération à vitesse 18. L’attaque rapide annule le verrou écran de charge et remet la préparation/`mountCharged` à zéro avant le calcul des vitesses : aucune charge forte accidentelle sur ce relâchement. Fonctionne aussi en clavier via le saut d’Enguarde.
- Libellés et aide contextuelle EN/FR dans `GameControls.tsx` / `resources.ts`. Pas de quatrième bouton à ajouter sur petit écran. `repeatable` ne concerne que le bouton rapide d’Enguarde.
- Tests unitaires : huit attaques de suite sans concentration, vitesse immédiate dès la première frame, annulation d’une charge déjà prête. **202 tests / 34 fichiers**, build TypeScript/Vite et diff-check OK.
- `node scripts/enguarde-quick-browser.mjs` : huit vrais appuis = huit attaques courtes ; quatre cas portrait/paysage × tactile/clic. Preuves `reference/enguarde-quick-regression.json`, `enguarde-quick-*-*.png`.

## Entrée bonus condamnée après le retour — précision utilisateur, 22 octobre 2026

- L’entrée extérieure doit aussi être bouchée après avoir visité la salle. `Game.completedBonus` mémorise chaque bonus sorti, même sans trésor ramassé. `tryEnterBonus` refuse ensuite toute nouvelle entrée dans cette salle pendant ce parcours. Une perte de vie conserve cet état ; recommencer/changer le niveau le réinitialise avec les autres objets du parcours.
- `isBonusCompleted` reconnaît aussi les récompenses d’anciennes visites dans les parties déjà ouvertes avant cette mise à jour. Le marqueur est indépendant du nombre de trésors pour les nouvelles visites.
- `BonusRoom` affiche désormais des planches croisées (`completed-bonus-plug`) à la place du passage et retire la flèche BONUS. L’accès au bonus est désactivé ; le chemin principal reste praticable devant cette porte en profondeur. Les murs restent marqués cassés, donc roulade ou projectile ne réactivent pas la porte.
- Tests : retour sans récompense, tentative de réentrée, perte de vie, roulade/projection, autre salle toujours disponible et remise à zéro sur nouveau parcours. Vérification navigateur après une vraie traversée de salle et après expiration du délai : plug visible, flèche cachée, entrée refusée, en portrait et paysage.
- **Validation : 200 tests / 34 fichiers**, build TypeScript/Vite OK. `npm run test:mechanics` : 20 vérifications. Preuves `reference/mechanics-bonus-closed-*.png`, `mechanics-regression.json`.

## Bonus, commandes tactiles, animaux et direction des canons — 22 octobre 2026

- **Bonus :** à l’entrée dans la scène bonus, un obstacle solide pleine hauteur ferme le passage à gauche derrière les peluches. Planches et traverse visibles (`sealed-bonus-entrance`). La sortie à droite restitue toujours l’état du niveau et les récompenses. La fermeture concerne l’intérieur de la salle ; les murs cassés du niveau principal restent conservés.
- **Mobile, dans les deux modes de direction :** un appui enclenche la préparation de charge Rambi/Enguarde, le suivant la lance. Jauge et bouton pressé restent visibles ; les doigts sont disponibles pour sauter/diriger. Expresso : appui pour battre des ailes/planer, second appui pour replier. Indications EN/FR contextuelles et libellé du bouton changent avec l’état.
- **Tonneaux portés :** un appui écran prend le tonneau, relâcher le doigt le conserve, un second appui le lance, y compris en saut. `Input.tapAction` identifie l’action écran indépendamment du mode de direction. Clavier : maintien puis relâchement inchangés. `Controls.set` n’émet plus de faux relâchement lorsqu’une autre source tient encore la même touche.
- **Animations :** Rambi abaisse la tête, se tasse et gratte le sol pendant la préparation ; Enguarde recule/tremble et accélère queue/nageoires ; halo pulsant indique la charge. Expresso déploie davantage ses ailes avec un battement lisible de profil. Tailles des peluches conservées. Charges adaptées, pas mécanique native DKC1 revendiquée.
- **Canons :** suppression du sprite fixe ↗ qui restait orienté vers la caméra. Flèche en vraie géométrie 3D dans l’axe local +Y, bouche ouverte et cerclage de sortie distinct. `Game.cannonAngle` renvoie l’angle du vecteur discret réellement tiré : corps, flèche et tir concordent, y compris les canons oscillants. Centre du modèle canon aligné avec son ancre physique.
- **Validation : 198 tests / 34 fichiers**, TypeScript/Vite build OK. `npm run test:mechanics` : 18 vérifications en portrait/paysage (charge + saut, animations, nage, ailes, port/saut/lancer, bonus fermé et retour). `node scripts/cannon-directions-browser.mjs` : 50 canons × 2 formats, axe de chaque flèche aligné avec le tir (dot minimal 0,9999999999999998), aucun sprite directionnel. `npm run test:mobile` : six tailles, multitouch, clic, rotation, pause, sept transitions, ~59 fps, aucune erreur JS. Tests ciblés, aucune nouvelle traversée complète revendiquée.
- Preuves : `reference/mechanics-regression.json`, `mechanics-*-charging-*`, `cannon-direction-regression.json`, `cannon-direction-*.png`.

## Mur invisible dans la partie déjà ouverte — correction suivante

- Le bloc avait disparu du mesh mais React Fast Refresh conservait l'instance `Game` créée par `useState` et ses anciennes méthodes, pouvant conserver les anciennes fermetures de collisions.
- `App.tsx` synchronise maintenant le prototype de l'instance existante avec `Game.prototype` dans un effet. Aucun reset de la position, vie, progression ou objets de la partie.
- Régression `node scripts/engine-hot-update-browser.mjs` : ouvre une partie et place le joueur dans le canon 2 ; modification temporaire inoffensive du moteur, attend le vrai HMR, vérifie identité conservée + prototype renouvelé + position et canon inchangés, puis tire via Space. Résultat : x=29,0689, y=9,03125, HP2, cinq vies, aucune erreur JS. `engine.ts` restauré dans finally. Test ciblé, pas nouvelle traversée intégrale.
- Preuves : `reference/canyon-hmr-regression.json`, `canyon-live-collision-fixed.png`.

## Suppression ciblée du bloc après le tonneau — capture 23:41

- Demande utilisateur : retirer la plateforme suspendue qui bloque le tir après le premier canon horizontal du Canyon (canon index 2, x=18,75).
- `src/game/canyonTerrain.ts` retire uniquement la ligne 0 aux pixels ROM x=[26304,26368), soit monde x=[26,28), y=[9,53125,10,5]. Les données ROM brutes dans `originalCaveTerrain.ts` restent intactes. Sol en dessous conservé.
- Moteur, volumes solides, mesh et plateformes de présentation utilisent cette même adaptation. Générateur reverb modifié pour conserver son import après régénération.
- `tests/canyon-clearance.test.ts` contrôle les 64 bandes pixel, la conservation des autres cellules, l’absence de mesh/collision et le tir normal depuis le canon 2.
- Validation actuelle : **193 tests / 33 fichiers**, build TypeScript/Vite et diff-check OK. Reproduction navigateur séparée en portrait 700×963 : tir via Space, x=29,0689, y=9,03125, HP2, cinq vies, aucune erreur JS. Placement initial dans le canon pour ce test ciblé ; aucune nouvelle traversée intégrale revendiquée.
- Tests : `tests/canyon-clearance.test.ts`. Preuves traversée : `reference/canyon-playthrough.*`.

## Parcours réels au clavier — terminés (passe précédente)

- **Coral Capers : clear, zéro mort, cinq vies, HP final 1, 183,52 s.** Les 21 ennemis et les dégâts étaient actifs. Enguarde libéré puis monté ; suite à pied après perte de la monture sur contact, et seconde peluche récupérée normalement. Preuves : `reference/coral-playthrough.md`, JSON et capture.
- **Barrel Cannon Canyon : clear, zéro mort, cinq vies, HP final 2, 49,28 s.** 35 ennemis initiaux actifs, 18 encore vivants à l’arrivée. Toutes les vies du journal sont à cinq. Preuves : `reference/canyon-playthrough.md`, JSON, règles et capture. Les essais antérieurs sont conservés séparément et ne constituent pas des réussites.
- **Import critique : 50 canons, pas 36.** Les 120 enregistrements principaux contiennent six commandes5 vers des listes enfants après en-tête nul de huit octets. Ces listes ajoutent 18 acteurs : 14 canons + quatre Zingers. Décodage dans `analyze_level_tables.py`, génération dans `generate_original_reverb.py`, preuves Rev2 dans `canyon-groups-evidence.json`. Les indices directs restent stables, les enfants sont ajoutés en fin avec provenance parent/enfant. Le générateur conserve désormais les clés i18n du Canyon.
- **Physique corrigée :** déplacement des canons partagé entre rendu et collision ; capture couvrant le corps au-dessus des pieds ; `rollJumpMomentum` conserve l’élan du saut après roulade et permet le freinage. Remise à zéro au sol, mur, dégât, canon, monture et bonus. Les tailles des peluches restent **2,2 / 2,05** ; course et saut normaux inchangés.
- Le pilote lit `window.goonk`, simule des copies isolées et utilise les vraies touches, dont la pause KeyP. Aucune écriture de position, vie, invincibilité, ennemi ou horloge dans le jeu navigateur. Les pauses de préparation distinguent ce test d’une partie humaine continue. La pause remet les entrées à zéro : les touches sont envoyées après la reprise. Les règles pilotent uniquement des touches.
- **Validation : 191 tests / 32 fichiers**, TypeScript/build OK. Carte : quatre formats. Mobile : six formats, multitouch, clic, rotation, pause, sept transitions. Mécaniques : 14 contrôles dans deux orientations. Stages : sept × deux orientations, dont 35 modèles ennemis au Canyon après l’import des groupes. Les tests de charge ont rétabli le libellé accessible EN/FR de la jauge.
- Commandes : `npm run test:playthrough:canyon` et `npm run test:playthrough:coral` depuis le dépôt, serveur sur 5174. `GAME_URL`, `BROWSER_EXECUTABLE` possibles. Le serveur de la traversée était **Vite en développement** sur les sources canoniques ; build production vérifié séparément. La capture Canyon est prise à l’instant de fin avant le rafraîchissement du récapitulatif.
- **Limites :** activation native des groupes, rotations/automatismes de canons et trajectoires natives des Zingers encore partiellement adaptés ; il ne s’agit pas d’une émulation complète. Les deux traversées ne prouvent pas tous les chemins.

## i18n EN/FR

- **Langue par défaut** : `en` (`src/i18n.ts`). Catalogue **EN + FR** dans `src/i18n/resources.ts` ; clés stables dans `src/i18n/keys.ts` ; données niveau / ennemis / animaux / décor = clés, affichage via `tx()` / `t()`.
- **Sélecteur** : `LanguageSelect` dans la barre du haut ; persistance `localStorage` clé `goonk-country-lang` ; `document.documentElement.lang` synchronisé.
- **Audio** : messages d’erreur chargement via `tr(L.audio.*)`.
- **Générateurs** : labels salle bonus → clé `bonus.room` (jungle/reverb) ; regen reverb/jungle sans réintroduire du français en dur dans les TS générés Le générateur reverb conserve aussi `name`, `subtitle` et `tip` sous clés `L` (vérifié par régénération idempotente).
- **Intégration actuelle** : **191 / 32** (`npm test`), `npm run build` OK.

## Animaux, bonus, sols, carte (après `44dd570`)

- **Montures / contrôles** : charges tenues (~0,65 s) et relâchement boost (adaptation, pas DKC1 ROM — voir `buddy-controls-review.md`). Flutter Expresso maintenu ou basculé au clic ; jauge + mode clic. Taille peluches **2,2 / 2,05** conservée.
- **Bonus** : scène séparée, porte ouverte, sortie à droite ; restauration niveau, monture, pickups et murs cassés.
- **Roulade** : multiplicateurs **Rose 1,125 / Violette 1,0** (course/saut à pied inchangés).
- **Lagon** : échelle marine **×1,5** (`marineScale.ts`, `ROM_CORAL_SOURCE`, `marine-room-scale.md`) ; collision nage ~0,95 ; tests entrée→sortie.
- **Sols visibles** : canyon/wagon/jungle — culling corrigé (origine ROM), faces opaques = collision, faux socles jungle retirés ; `routeSafety.ts`, `cannonMotion.ts`, `test:ground` + captures `ground-fixed-*`.
- **Boss** : tonneaux blessent hors récupération ; sauts / phases testés.
- **Carte** : `IslandMap` / `App` revus (`map-ui-review.md`). `test:mechanics` (montures + bonus).

## Imports ROM (ne pas rétablir les anciennes approximations)

## Corrections critiques des imports : ne pas rétablir les anciennes approximations

- L’entrée **$17** était appelée « Reverb Cave », mais c’est **Barrel Cannon Canyon**, niveau $06. Ses 120 enregistrements principaux (36 canons directs, auxquels s’ajoutent désormais 14 canons de groupes) étaient superposés à la carte **Cave $DA0000**, étrangère au parcours. La routine Rev 2 sélectionne **l’environnement 0, Jungle $D90000**. L’étape 1 utilise désormais les colonnes Jungle à X=25472..36112, et porte le bon nom/biome. `ROM_REVERB`, `originalTerrain="cave"`, `originalCaveTerrain.ts` et `/?play=reverb` restent des **alias techniques de compatibilité**, pas des preuves que cette route est une grotte. `/?play=canyon` fonctionne aussi. Les données de grotte véritable sont conservées dans `level-tables.json`, mais ce parcours n’en est pas une.
- L’entrée **$27** correspond à **Minecart Madness**, pas Carnage. Elle sélectionne **Walkway $CB0000, environnement 2**, avec attributs **$F00000**. Les placements étaient confrontés au terrain Carnage $E60D88. Carte et nom corrigés ; départ du mode wagon sur le premier wagon importé **x=699, y=178** (coordonnées web x=12.6875, y=0.09375), au lieu d’un point sous les rails. `ROM_MINE_CART` et les noms de fichiers existants restent compatibles.
- Les attributs des environnements ne sont **pas des tranches concaténées après Jungle** : ils viennent de la table de pointeurs à `environmentPointers+0x70`. Ancien calcul cave/cart lisait notamment des données de sprites inutilisées. `analyze_level_tables.py` lit maintenant les vrais pointeurs.
- Coral : ancienne lecture **column-major 16 rangées avec attributs Jungle** incorrecte. Le code marin Rev 2 à **0x018187** calcule une carte **row-major, 64 tuiles / 128 octets par rangée** ; attributs **0x29C380**, 197 classes, profils marins **0x01844B** (distincts de la table horizontale). `scripts/analyze_coral_terrain.py` reproduit l’extraction en lecture seule, SHA-256 Rev 2 vérifié ; `reference/coral-terrain-v2.json` conserve les octets de preuve et les tables numériques.
- Coral conserve maintenant **32 pixels par unité sur les deux axes**, avec Y montant et origine **17952** : fini l’écrasement de ~52 unités en 5 et la superposition de trois bandes/ennemis. Sortie à y=48, limites web -0.9..53.9. Pose de nage horizontale et corps de collision de 0.95 unité pour les passages étroits. Un test explore un chemin de nage continu entrée → volume de sortie. Cela ne remplace pas une capture du vrai point d’entrée SNES, encore inféré dans cette adaptation.

Preuves : `reference/level-tables.json` → `routeEnvironmentEvidence`, `environmentData[].collisionAttributePointer`, `canyonMetatiles` et `mineCartMetatiles.environmentId`; `reference/coral-terrain-v2.json`. Le désassemblage USA 1.0 sert seulement de nomenclature ; les constantes et signatures ci-dessus sont vérifiées dans **la Rev 2 fournie**. REA ne fournit pas de désassemblage 65C816 adapté ici ; extraction ciblée Python, pas une nouvelle exécution de l’émulateur.

## Physique, visibilité et décor

- Toutes les 7 étapes accessibles depuis la carte avec sauvegarde neuve. `save.unlocked` conserve le rôle de progression pour Continuer, sans verrouiller la sélection.
- `terrainSolids.ts` : surfaces visibles, balayage murs/plafonds/sols, sol réel des tonneaux et animaux. Rebord Jungle artificiel « 44 frames puis chute » retiré : il faisait tomber dans un sol dessiné. Le rendu conserve les vrais sols de collision ; les plafonds et couches superposées ont une géométrie distincte.
- Ennemis terrestres : gravité, suivi des pentes, demi-tour aux rebords/murs. Mort prioritaire sur le clignotement. Culling sur les bornes réelles de caméra avec marge ; simulation avant affichage. `sceneRevision` remonte les acteurs à chaque chargement, même pour la même étape. Caméra verticale suit les quatre routes importées.
- Boss : rebond sûr sur la tête pendant une descente, même protégée. Perte de HP du boss seulement en récupération ; côtés/dessous restent dangereux. Saut normal depuis le pont testé.
- Décor : suppression des façades de murs en double et du plan d’eau dans les environnements terrestres. Végétation/coraux derrière le plan des personnages ; lianes moins étirées. Socle de falaise en retrait derrière la jungle et appuis des plateformes hautes. Les couches de sol jouables ne sont pas masquées pour cacher les défauts.
- Un seul propriétaire visuel des murs cassables ; disparition immédiate après destruction. Caches invisibles avant révélation ; salles bonus suivent les ensembles mutables en temps réel, sans ancien rectangle doré de repérage. Doublons de décor supprimés. Papillons avec ailes animées, au lieu de points roses statiques.
- Le wagon ne s’affiche que dans le parcours wagon. Commandes portrait en colonnes flexibles : bouton de saut dans le viewport à 320 px. Conseils de jeu débarrassés des coordonnées/adresses/notes d’extraction ROM.

## Validation et commandes

**191 tests / 32 fichiers** (`npm test`). Navigateur : `test:browser`, `test:map`, `test:mobile`, `test:stages`, `test:decor`, **`test:ground`**, **`test:mechanics`**. Docs : `bugfix-validation.md`, `decor-import-fixes.md`, `route-safety-fixes.md`.

Générateurs : `analyze:levels`, `analyze:coral-terrain`, `generate:coral-terrain`, puis `generate:jungle|canyon|mine-cart|coral` — ne pas réintroduire l’ancienne compression verticale du lagon ni les attributs cave/cart concaténés.

## Limites de reprise

- Modèles 3D adaptés ; pas de textures chip ROM. Charges montures = adaptation utilisateur, pas preuve DKC1.
- Ennemis aquatiques / oiseaux encore partiellement provisoires ; espacement abeilles wagon à affiner si signalé.
- Départs de routes et entrée SNES lagon encore partiellement inférés ; tests géométriques ≠ parcours humain complet.
- Audio : 27 M4A + 119 WAV ; écoute comparative dans `audio-playback-notes.md`.

**Priorité suivante :** captures SNES des spawns, hazards wagon omis, parité canons canyon si écart gameplay restant.


---

# Dernière extension utilisateur — version 0.3.1

Dernière lecture du quota pendant cette passe : **90 % utilisés sur 5 heures, 32 % sur la semaine**, usage inclus encore autorisé. Aucun reset consommé. Ce rapport est sauvegardé avant épuisement.

L’utilisateur exige aussi **tous les mécanismes de tonneaux** (porter, lancer, entrer dans les canons et leurs variantes), **tous les environnements**, **une carte où les deux protagonistes se déplacent**, et **les musiques et bruitages fidèles**. Lire en priorité `reference/world-barrels-audio.md` : cette demande complète le périmètre 0.3 ci-dessous et reste en partie à réaliser.

Ajouts concrets de cette passe : `src/IslandMap.tsx`, carte 3D avec les deux vrais Goonk qui parcourent un chemin vers l’étape sélectionnée ; sélection accessible et bouton Entrer dans `App.tsx`. C’est encore la carte des sept parcours créés, pas la carte originale intégralement reconstruite.

Tonneaux : vol canon préservé, exclusion du canon source permettant les chaînes, canon oscillant dont l’angle visible correspond au tir, support d’autoFire (non placé), tonneaux en bois lancés qui roulent sur les plateformes. Champs `Player.launched`, `cannonLock`, `cannonTime`, méthode `Game.cannonAngle`, variantes facultatives `BarrelSpec.rotationSpeed`/`autoFire`. Les valeurs temporelles et balistiques restent adaptées. Quatre nouveaux tests : **44 tests unitaires passent** dans cinq fichiers. `scripts/map-browser.mjs` et commande `npm run test:map` contrôlent la carte ; le résultat final figure dans la validation.

Audio : toujours synthèse provisoire, aucune musique originale livrée. `reference/audio-inventory.json` indexe 27 pistes et 119 étiquettes d’effets de la source USA 1.0, pas 119 sons uniques vérifiés en Rev 2. Driver SPC700, séquences, BRR et playback Rev 2 restent à analyser/restituer. **Ne pas remplacer cette demande par de nouvelles boucles génériques et prétendre à la fidélité.**

Continuer d’abord les preuves et lacunes de `world-barrels-audio.md` et `fidelity-roadmap.md`. Préserver la version jouable ; ne pas annoncer tous les mondes, tonneaux ou sons présents. Aucun commit Git n’a encore été créé ; tous les fichiers restent non suivis.

---

# Mise à jour prioritaire pour Claude — version 0.3.0

**Lire cette mise à jour avant le rapport 0.2 historique conservé plus bas.**

L’utilisateur a précisé après le premier relais : « La DA doit ressembler au jeu original », le gameplay et l’univers doivent être fidèles, notamment les peluches chevauchant les animaux terrestres/marins et les roulades. Il autorise une rétro-ingénierie complète si nécessaire. Cet objectif de fidélité est maintenant explicite : ne plus le présenter comme une extension facultative « si demandée ». La version 0.3 améliore ces éléments sans prétendre que le jeu complet est reproduit.

## Travail ajouté et conservé

- **Quatre montures** : Rambi, Enguarde, Winky, Expresso, avec modèles 3D animés distincts, caisses à libérer et montée en sautant sur le dos (proximité pour Enguarde sous l’eau). Changer descend même avec une seule peluche. Un choc fait fuir l’animal sans retirer immédiatement une peluche ; il est récupérable.
- Rambi attaque de la corne ; Winky saute plus haut et peut écraser les abeilles ; Expresso court vite, plane au saut maintenu et enjambe les petits ennemis ; Enguarde nage sur deux axes et attaque au rostre. Le lagon possède des flèches verticales pour le mode clic aussi.
- **Roulade et roue distinctes** : Rose se replie et Violette étend ses membres. Direction conservée, élan propre, accélération après un ennemi, saut après sortie du rebord tant que la roulade persiste. Les deux peuvent vaincre Klump en roulant, seule Rose peut le vaincre par saut à pied.
- **DA** : fougères et sous-bois plus denses en plans derrière l’action, racines élargies, rebords rocheux plus irréguliers, coraux ramifiés et lumière chaud/froid plus proche des références. Toujours géométrie stylisée ; pas d’équivalence exacte attestée.
- **14 nouvelles signatures Rev 2** : `reference/buddy-analysis.json`, `reference/buddy-analysis.md`, `scripts/analyze_buddies.py`. Cibles marche/course, impulsions de saut monté et gravité maintenue, impulsion d’attaque Enguarde, bases/chaîne/plafond de roulade et branche autorisant le saut hors rebord. Les nombres sont importés depuis le JSON dans `src/game/animals.ts`.

## Fichiers et commandes supplémentaires

`src/game/animals.ts` définit types, dimensions et paramètres sourcés. `Game.animals`, `Game.mount`, `releaseAnimal`, `dismount` et `updateAnimals` sont dans `src/game/engine.ts`. Les placements facultatifs `Level.animals` sont dans `levels.ts` : Rambi jungle, Winky canopée/temple, Expresso canopée/neige, Enguarde lagon. La simulation reste à 60 Hz.

`src/game3d/AnimalModels.tsx` construit les quatre silhouettes (+X vers l’avant, origine au sol) ; `Animals.tsx` gère caisses et placement ; `Goonk.tsx` gère pose assise et roulade/roue ; `Scene.tsx` monte les animaux. `GameControls.tsx` adapte les libellés Descendre/Rostre/Corne/Bondir/Planer et la nage verticale. `World.tsx` contient la passe DA.

```sh
npm run analyze:buddies -- '/Users/sevenone./Downloads/Donkey Kong Country (USA) (Rev 2).zip'
npm test
npm run build
# Avec le serveur actif :
npm run test:buddies
npm run test:mobile
```

**40 tests unitaires passent, dans quatre fichiers**, dont 11 nouveaux sur montures, dégâts, descente, capacités et roulade hors rebord. TypeScript et build Vite passent également dans le dépôt final. Les contrôles navigateur des quatre montures et la suite mobile passent contre le build final ; voir `reference/validation.md`. Ne pas confondre test navigateur préparant une scène et partie complète jouée.

## Fidélité restant à établir : priorité de reprise

Lire **`reference/fidelity-roadmap.md`** avant d’étendre le jeu. Les parcours sont encore sept créations originales ; la totalité des niveaux/objets/boss/régions, cordes/lianes, salles bonus et jetons animaux, services Kong et Squawks ne sont pas reconstruits. Les ennemis aquatiques actuels sont encore provisoires. Les timings exacts, accélérations, contacts des montures, fuite/récupération et flutter soutenu comportent des réglages d’adaptation. Les impulsions animales vérifiées sont appliquées immédiatement, alors que la ROM les déclenche après des poses d’animation. Le +24 pixels de l’entrée flutter de la ROM n’a pas été transposé aveuglément en téléportation 3D.

L’étape apportant le plus de preuves est une **exécution contrôlée de la ROM fournie dans un émulateur**, avec captures des positions/vitesses/états et des cadrages visuels, puis comparaison des mêmes entrées côté web. REA expose un mode 6502, qui ne suffit pas à désassembler correctement le 65C816 SNES ; cette analyse a donc continué directement sur les octets. Aucune exécution SNES n’est attestée à ce stade. Poursuivre l’analyse par questions concrètes avant de revendiquer une rétro-ingénierie exhaustive.

**Quota Codex :** au contrôle de la passe 0.3, 84 % de la fenêtre de 5 heures et 31 % de la fenêtre hebdomadaire étaient utilisés ; usage inclus autorisé, solde supplémentaire 0. Valeurs historiques à revérifier ; aucun reset consommé. Rapport sauvegardé avant la limite ; aucune surveillance automatique créée.

---

# Rapport historique 0.2 — conserver comme contexte, la mise à jour ci-dessus prévaut

# Relais pour Claude — Goonk Country 0.2.0

Rapport préparé le **21 octobre 2026**, à la demande de l’utilisateur, avant épuisement éventuel de son quota Codex. Ce document décrit un projet déjà réalisé et testé ; il faut le lire avant de modifier le code.

## Message de reprise à donner à Claude

> Continue le projet `/Users/sevenone./Documents/git/goonk-country`. Lis d’abord ce rapport, le README et les trois documents de `reference/` : `mobile-design.md`, `reverse-engineering.md`, `validation.md`. L’objectif est une adaptation 3D de Donkey Kong Country avec les peluches Goonk rose et violette issues de `tontie-re`, mobile first, jouable en portrait et paysage, au tactile, avec commandes virtuelles et au clic. Une version jouable de sept étapes existe. Préserve le travail présent et les éventuelles modifications de l’utilisateur. Commence par vérifier le fonctionnement actuel, puis traite les points réellement observés : ergonomie et performances sur téléphone, partie complète et équilibrage. Ne réécris pas le moteur sans raison mesurée. Ne présente pas la rétro-ingénierie comme complète, ni les essais Chrome comme des tests sur appareils physiques. Communique en français et surveille le coût de tes prochaines étapes.

## Demande utilisateur et périmètre

L’utilisateur a fourni `/Users/sevenone./Downloads/Donkey Kong Country (USA) (Rev 2).zip` et demandé :

- Créer le projet dans `/Users/sevenone./Documents/git/`, en utilisant la même famille de technologies que `/Users/sevenone./Documents/git/tontie-re`.
- Remplacer Donkey Kong par la peluche rose et Diddy Kong par la peluche violette, appelées ici Rose et Violette.
- Utiliser REA pour l’analyse, puis poursuivre directement si REA ne suffit pas.
- Évaluer Phaser 3 et React Spring face à Three.js, puis retenir la technologie adaptée.
- Retrouver l’ambiance artistique du jeu original en vraie 3D ; améliorer les bananes et repenser les monstres à partir de leurs silhouettes d’origine.
- Donner la priorité au téléphone, aux deux orientations et aux commandes tactiles ou au clic.
- Préparer ce relais avant la fin du crédit disponible.

Le résultat actuel est **une adaptation avec sept étapes originales**, pas un port complet des niveaux SNES. Aucune commande utilisateur n’autorise à prétendre à une fidélité totale ou à un jeu intégralement reproduit.

## État, emplacement et précautions pratiques

**Dépôt faisant autorité :** `/Users/sevenone./Documents/git/goonk-country`, version `0.2.0`.

Le dépôt Git a été initialisé sur `main`, mais **aucun commit n’a été créé**. Au dernier contrôle, tous les fichiers du projet étaient non suivis. Un `git status` affichant beaucoup de `??` est donc attendu : ne pas supprimer ces fichiers ni exécuter de nettoyage destructeur. Aucun push, déploiement public ou PR n’a été effectué.

Le projet original `tontie-re` n’a pas été modifié. Le nouveau projet possède ses propres dépendances installées et son propre lockfile.

Un dossier de préparation existe dans `/Users/sevenone./Documents/Codex/2026-10-21/cre/work/goonk-country`. **Il n’est pas la copie de référence** et son `node_modules` peut pointer vers des dépendances de travail. Travailler dans le dépôt sous `Documents/git`.

Dans la session Codex d’origine, écrire sous `Documents/git` exigeait une élévation de la permission du terminal, bien que l’emplacement ait été explicitement demandé par l’utilisateur. Les copies et compilations nécessaires y ont été autorisées. Claude doit respecter les permissions de son propre environnement.

## Lancement et commandes

Vite 8 exige Node **22.12 minimum**. Le Node système observé était `22.11`, trop ancien. La version utilisée avec succès était Node **24.19**, disponible à :

```text
/Users/sevenone./.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin
```

La présence de ce runtime dépend de la machine ; avec un Node 24 déjà actif, l’export ci-dessous est inutile.

```sh
cd /Users/sevenone./Documents/git/goonk-country
export PATH="/Users/sevenone./.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH"
node --version
npm run dev
```

Le port de développement configuré est `5174` et l’écoute autorise le réseau local. Les dépendances sont déjà installées ; ne pas les réinstaller systématiquement.

```sh
npm test
npm run build
# Dans un autre terminal, pour servir le dernier build :
npm run preview -- --port 5174
# Avec un serveur actif :
npm run test:browser
npm run test:mobile
# Exemple pour vérifier la version servie sur le réseau local :
GAME_URL=http://192.168.1.164:5174/ npm run test:mobile
```

Lors du relais, un serveur de prévisualisation du build final avait été laissé actif :

- Local : <http://127.0.0.1:5174/?v=mobile-2>
- Téléphone sur le même Wi-Fi : <http://192.168.1.164:5174/>

L’adresse LAN et la disponibilité du serveur peuvent changer. Ne pas lancer un second serveur sur le même port sans vérifier le premier. `npm run preview` sert `dist/` ; après une modification, reconstruire pour voir celle-ci en prévisualisation.

Les scripts navigateur utilisent Playwright et Chrome sur macOS. `BROWSER_EXECUTABLE` permet de choisir un autre navigateur ; ailleurs, Chromium peut nécessiter une installation. `GAME_URL` permet de changer l’URL testée.

## Choix technique déjà argumenté

React 19, TypeScript 5.9, Vite 8, Three.js 0.186, React Three Fiber 9, MUI, i18next et react-i18next. La simulation est indépendante du rendu, à pas fixe de **60 Hz**.

Three.js/R3F ont été conservés pour les vrais volumes, les éclairages, les matières et les modèles Goonk réutilisés. Phaser 3 est principalement conçu pour la 2D et demanderait un rendu 3D supplémentaire pour ce besoin. React Spring anime des valeurs et peut accompagner R3F ; il ne remplace pas un moteur de rendu. Il n’a pas été ajouté, les animations présentes utilisant le temps de simulation, l’amortissement de caméra et du CSS.

Les sources et décisions détaillées sont dans `reference/mobile-design.md`, dont documentation Phaser, React Spring, R3F et recommandations Apple sur les commandes de jeu. Il n’est pas nécessaire de refaire cette recherche sans nouveau besoin.

## Fonctionnalités présentes

Sept étapes reliées par une carte et déverrouillées progressivement : jungle, canopée avec plateformes mobiles et canons, mine en wagon automatique, lagon sous-marin, neige glissante, temple et bateau du boss.

Deux personnages interchangeables et compagnon suiveur ; saut à hauteur variable ; course ; roulade ; tonneaux à porter et lancer ; tonneaux de secours ; checkpoints ; canons ; ennemis ; bananes ; ballons ; cinq lettres GOONK. Cent bananes ou cinq lettres donnent une vie supplémentaire. Déblocages et records sont enregistrés localement. Le son est synthétisé, original et désactivable.

Clavier : flèches ou Q/D et A/D, Espace pour sauter/nager, Maj pour courir, X pour action, C pour changer, Échap/P pour pause. Manette standard : A saut, X action, B changement, RB course.

### Mobile et clic

- En portrait, la scène et les commandes sont séparées : une zone inférieure d’environ 228 px est réservée aux pouces.
- En paysage, direction à gauche et actions à droite. Pas de verrouillage d’orientation.
- Joystick glissé : marche près du centre et course en périphérie ; axe vertical utilisé dans l’eau.
- Mode clic : une direction reste active après un clic ; nouveau clic ou bouton central pour arrêter. Le saut au clic est maintenu environ 350 ms.
- Pointer Events, capture de pointeur et sources d’entrée indépendantes permettent plusieurs actions simultanées. Annulation, perte de focus et changement de taille relâchent les entrées.
- Boutons principaux d’au moins 44 px CSS, saut plus large. HUD compact et caméra adaptée à la largeur disponible.
- `dvh`, marges de zone sûre et `viewport-fit=cover`. Manifeste autorisant le mode autonome et les deux orientations ; pas de service worker ni de promesse hors ligne.
- Le mode d’entrée est enregistré dans `localStorage` sous `goonk-input-mode`.

### Direction artistique et modèles

Jungle sombre olive, éclairage chaud, interface dorée d’aventure, végétation en plusieurs plans, feuilles courbées et nervurées, écorce, racines et rochers. Les autres étapes changent leur palette et leurs décors.

Les bananes sont de vrais volumes courbes, effilés, à cinq reliefs avec couleurs de sommets, tige et extrémité sombre. Leur oscillation évite de les rendre régulièrement invisibles de profil.

Cinq familles distinctes : castor inspiré de Gnawty avec incisives et queue plate ; crocodile Kritter avec longue mâchoire, dents et crête ; Klump rond avec casque et pantalon violet ; Zinger rayé avec antennes, six pattes, ailes translucides et dard ; boss K. Rool avec ventre doré, cape rouge et couronne. Les yeux restent visibles dans les deux directions. Les hauteurs de collision ont été adaptées aux modèles.

Les Goonk réutilisent les géométries, coutures, yeux et matières du projet source. Le titre utilise la police Anton stockée localement, sous SIL OFL dans `public/fonts/OFL.txt`. Les autres textes utilisent les polices système.

### Performances

Éléments répétitifs instanciés, visibilité par tronçons, ombres de contact simples instanciées, DPR plafonné à 1,35 et réduction adaptative à 1. Le rendu passe à la demande pour les écrans et pauses qui n’ont pas besoin d’animation continue. Le dernier échantillon Chrome donnait 109 appels de rendu et 64 192 triangles. Ce n’est pas une garantie de performances sur téléphone.

## Où intervenir dans le code

| Fichier | Responsabilité |
| --- | --- |
| `src/game/engine.ts` | Simulation, collisions, états, équipe, objets, dégâts, progression et boss |
| `src/game/levels.ts` | Tracés et placements des sept étapes |
| `src/game/enemies.ts` | Dimensions, échelles et paramètres communs des ennemis |
| `src/game/camera.ts` | Calcul du cadrage portrait/paysage |
| `src/game/input.ts` | Agrégation des sources d’entrée indépendantes |
| `src/game/audio.ts` | Audio synthétisé |
| `src/App.tsx` | Accueil, carte, HUD, menus, cycle de vie et sauvegarde |
| `src/components/GameControls.tsx` | Joystick, boutons, mode clic et pointeurs |
| `src/Scene.tsx` | Boucle à pas fixe, caméra, budget de rendu et scène R3F |
| `src/game3d/World.tsx` | Décors et végétation, matériaux procéduraux, instanciation |
| `src/game3d/Actors.tsx` | Rendu et animation des objets et acteurs |
| `src/game3d/Goonk.tsx`, `plushGoonk/` | Peluches et composants réutilisés |
| `src/game3d/BananaModel.tsx` | Géométrie de banane |
| `src/game3d/EnemyModels.tsx` | Les cinq modèles de monstres |
| `src/game3d/ContactShadows.tsx` | Ombres de contact instanciées |
| `src/mobile.css`, `src/style.css` | Présentation et adaptations de format |
| `scripts/`, `tests/`, `reference/` | Analyse reproductible, tests et preuves |

L’ordre d’import CSS est intentionnel : `mobile.css` après `style.css` dans `main.tsx`. Ne pas réintroduire de dépendance à une police distante.

Pour les essais contrôlés, `window.goonk` expose l’état mutable du jeu ; `window.goonkDiagnostics` fournit des mesures de rendu. Les scripts préparent parfois directement les états, ce qui permet des contrôles ciblés mais ne prouve pas une partie complète.

## Rétro-ingénierie : preuves et limites

REA a ouvert et inventorié l’archive. Il n’a pas fourni de désassemblage SNES 65C816 exploitable ; la suite a été faite par analyse directe des octets. Un désassemblage public USA 1.0 a servi de guide pour retrouver des signatures dans **la ROM Rev 2 effectivement fournie**, sans considérer les adresses de la version 1.0 comme valables telles quelles.

Source de navigation : <https://github.com/Yoshifanatic1/Donkey-Kong-Country-1-Disassembly>. Sa copie de travail est dans `work/dkc-disassembly` sous le dossier Codex de cette conversation ; elle n’est pas embarquée dans le projet livré.

Identité vérifiée :

```text
ZIP SHA256: 123f853708518bdb745990a37d90a1cc800a0f0911afcf3ce451d81c446f6b77
ROM SHA256: 628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527
Taille ROM: 4194304 octets
En-tête: 0xFFC0 ; HiROM/FastROM ; révision 2 ; région 1 ; SRAM 2 Ko
Checksum: 0x2BCC ; complément: 0xD433 ; calcul vérifié ; reset: 0x8000
```

Principales signatures, avec offsets de fichier :

| Offsets | Observation |
| --- | --- |
| `0x3FAF9C`, `0x3FB176` | Gravité brute -112, vitesse terminale -2048 |
| `0x3FB9AC` | Gravité de saut maintenu -72 / -90 selon personnage |
| `0x3FA7E7` | Impulsions de rebond +1824 / +2176 |
| `0x00A370` | Seuil de 100 bananes |
| `0x3F84A4` | Sélecteur de personnage 0 / 2 |

Le détail des octets, le décodage et les limites sont dans `reference/rom-analysis.json` et `reference/reverse-engineering.md`. `scripts/analyze_rom.py` permet de répéter l’analyse en lecture seule :

```sh
npm run analyze:rom -- '/Users/sevenone./Downloads/Donkey Kong Country (USA) (Rev 2).zip'
```

Les conversions physiques utilisent une interprétation 8.8 et 32 pixels SNES par unité 3D. Les impulsions initiales de saut, les tracés, l’IA, l’animation et la musique ont été créés pour cette adaptation. Il n’y a pas eu de validation par émulateur ni de comparaison image par image. La ROM, ses sprites, ses musiques et le code du désassemblage public ne sont pas inclus dans l’application.

## Vérifications déjà terminées

Sur le dépôt autonome et la version finale compilée :

- TypeScript et build Vite réussis.
- **29 tests dans trois fichiers**, tous réussis.
- Test navigateur : saut, changement de peluche, déplacement par boutons et rendu des six autres étapes ; aucune erreur JavaScript ou console.
- Test mobile contre l’URL réseau local : direction et saut simultanés, relâchement correct, clic seul, arrêt, pause/reprise, rotation pendant une partie et sept transitions de scène ; aucune erreur.
- Six formats émulés : 390×844, 844×390, 320×568, 430×932, 932×430 et 768×1024. Pas de débordement horizontal, boutons dans le viewport et zone de commandes distincte de la scène en portrait.
- Tests de physique : sauts maintenus/courts, absence de double saut, vitesses, eau, wagon, dégâts et invulnérabilité, checkpoints, secours, tonneaux et canons, collecte et vies, progression, vulnérabilité/victoire du boss, pause et sauvegardes malformées.
- Traversabilité des sauts testée par simulation pour plusieurs phases et personnages ; cadrage mobile, indépendance des entrées, géométrie volumique des bananes et dimensions des nouveaux ennemis vérifiés.

**Limites :** essais dans Chrome sur ordinateur avec émulation tactile, pas sur téléphone physique. iOS Safari, les encoches réelles et les performances de différents Android restent à tester. Aucun parcours humain complet des sept étapes n’est attesté. Les tests de traversabilité n’incluent pas toute la difficulté produite par l’IA.

Le bundle de production reste conséquent : environ 1,35 Mo de JavaScript non compressé, environ 384 Ko gzip, plus la police et les autres fichiers. Une séparation de chargement peut être étudiée si les mesures sur téléphone la justifient. Un avertissement de dépréciation `THREE.Clock` peut venir des bibliothèques ; il n’a pas bloqué les contrôles.

## Priorités utiles pour la suite

1. **Vraie session sur téléphone.** Tester Safari iOS et Android, les deux orientations, la rotation en jeu, le multi-touch, les marges sûres, le son après interaction, les interruptions et la reprise. Mesurer la fluidité et la chauffe sur les scènes chargées. En l’absence d’appareil, garder ces points explicitement non validés.
2. **Partie complète et équilibrage.** Jouer chaque étape sans téléporter l’état : lisibilité des atterrissages, placements des ennemis, maniement des canons, wagon, nage, dégâts, checkpoints et boss. Corriger les problèmes observés puis ajouter uniquement les tests de régression utiles.
3. **Polissage ciblé de la DA et du feedback.** Vérifier les silhouettes en mouvement, les contacts visuels au sol, les retours de collecte/dégâts et la lisibilité sur petit écran. Préserver les vraies géométries et les deux peluches demandées.
4. **Performance et chargement.** Profiler sur appareil avant d’augmenter les détails ; regarder textures, draw calls, DPR, initialisation WebGL et taille du premier chargement. Le code possède déjà instanciation et adaptation de résolution.
5. **Fidélité supplémentaire si demandée.** La reproduction intégrale du jeu original représente un autre niveau de travail. Toute nouvelle affirmation de parité doit s’appuyer sur des preuves supplémentaires, et pas seulement sur les signatures existantes.

Ne pas refaire tous les tests ou toute la recherche documentaire à chaque changement mineur. Utiliser les contrôles adaptés, puis terminer la tâche concrète. Ne pas lancer de nouvel outil payant ou publier le projet sans besoin dans la demande.

## Captures et documents à consulter

Dans le dépôt : `reference/bestiary-3d.png`, `reference/mobile-portrait.png`, `reference/mobile-landscape.png`, `reference/validation.md`, `reference/mobile-design.md` et `reference/reverse-engineering.md`.

Copies destinées à l’utilisateur dans `/Users/sevenone./Documents/Codex/2026-10-21/cre/outputs/` :

- `goonk-country-bestiaire.png` : les vrais modèles 3D, réunis dans une scène de contrôle.
- `goonk-country-portrait.png` et `goonk-country-paysage.png` : version mobile actuelle.
- `goonk-country-mobile-design.md` et `goonk-country-validation.md`.
- `CLAUDE_HANDOFF.md` : ce rapport, également copié à la racine du dépôt.

L’ancienne image `goonk-country.png` correspond à une version visuelle précédente ; ne pas l’utiliser pour juger la version 0.2.

## Quota au moment de la demande

La lecture des limites Codex indiquait **55 % utilisés sur la fenêtre de 5 heures**, donc **45 % restants**, et **27 % utilisés sur la fenêtre hebdomadaire**, donc **73 % restants**. Le solde de crédits supplémentaires était à zéro, mais l’usage inclus était encore autorisé et aucune limite de dépense n’était atteinte. Ces valeurs sont un instantané, pas une promesse de disponibilité future ni une mesure du quota Claude.

Aucun crédit de réinitialisation n’a été consommé. Aucune surveillance automatique en arrière-plan n’a été créée. Le rapport est sauvegardé dès maintenant pour que la reprise ne dépende pas du contexte de cette conversation.
