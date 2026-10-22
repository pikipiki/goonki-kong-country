> Nouvelle validation après correction des objets et rebond des boulets : victoire 87,9 s / 583 décisions / 0 mort, 1PV et 5 vies. Les anciens ramassables invisibles ont été supprimés du pont. Voir `boss-objects-feedback-report.md` pour les sons et tests mobiles.

# Vérification indépendante du boss final — 22 octobre 2026

**Combat terminé au clavier réel : 10 coups, victoire, zéro mort.** Durée de simulation : 87,9 secondes. Fin avec 1 PV, 5 vies, aucune erreur JavaScript. La peluche rose puis la violette ont participé : le premier dégât a consommé un PV, pas une vie.

Le navigateur indépendant a démarré le niveau avec l'URL publique `?demo=2d&stage=boss`, puis a reçu uniquement de vraies touches Playwright. L'objet `window.goonk` a été lu, jamais modifié. Pendant les calculs du contrôleur, la vraie touche P mettait le jeu en pause ; des copies isolées du moteur testaient les touches candidates. Aucun changement de position, de PV, de vies, d'invincibilité, d'ennemis ou d'horloge dans la partie jouée. Les dégâts sont restés actifs.

Le journal contient 583 décisions et les phases intro, lancer de couronne, attente du retour, blessure, course, sauts, pluies de boulets, fausse défaite, réveil et défaite finale. La fausse défaite n'a pas terminé le niveau. La somme de toutes les diminutions du nombre de vies dans le journal vaut zéro.

Preuves : `boss-playthrough.json`, `boss-playthrough-final.png`. La capture a été prise immédiatement après la victoire du moteur, avant le rafraîchissement de l'écran récapitulatif ; elle montre le boss vaincu sur le bateau. Script reproductible : `scripts/boss-battle-browser.mjs`.

## Tests de règles et collisions

23 tests dans `tests/boss-battle.test.ts` vérifient :

- tête exposée pendant le vol de la couronne et protégée après son retour ;
- 1, 2, puis 3 traversées après les trois premiers coups ;
- 9, 17, puis 25 boulets, avec avertissement avant la chute ;
- fausse défaite après le septième coup, réveil puis 2 bonds ;
- 6 puis 12 bonds après les coups 8 et 9 ;
- 10 coups nécessaires, victoire uniquement après l'animation finale ;
- pause du boss et des projectiles, dégâts réels des couronnes et boulets ;
- saut ordinaire depuis le pont réussi avec chacune des deux peluches sans prendre de dégât ; rebond sûr sur la tête couronnée.

Les deux anciennes régressions de saut ont été mises à jour pour la véritable phase de couronne et les 10 PV. Le test d'approche déclenche maintenant le vrai lancer de couronne avant le saut. Les tests de combat et les 9 nouvelles régressions de feedback/objets passent.

Les tests unitaires utilisent des états initiaux contrôlés pour isoler les collisions ; ils sont distincts du parcours complet au clavier ci-dessus. Les effectifs des attaques viennent de l'analyse ROM, tandis que durées, vitesses, amplitudes et avertissements sont adaptés à ce jeu et aux grandes peluches. Cela ne constitue pas une émulation exacte des timings SNES.
