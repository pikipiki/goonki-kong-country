---
name: handoff-before-commit
description: >-
  Met à jour CLAUDE_HANDOFF.md avant tout commit Git dans ce dépôt. À utiliser
  quand l'utilisateur demande un commit, un push, ou de préparer un commit, et
  systématiquement avant `git commit` sur goonk-country.
---

# Handoff avant commit

## Règle

**Ne pas lancer `git commit` tant que `CLAUDE_HANDOFF.md` n'a pas été relu et mis à jour** pour refléter l'état réel du dépôt après les changements qui vont être commités.

## Quand appliquer

- L'utilisateur demande explicitement un commit (ou amend, sauf cas couverts par les règles git de l'utilisateur).
- Tu termines une passe de travail ROM/moteur/audio et tu proposes de committer.
- Plusieurs fichiers ont changé et un commit est imminent.

Ne pas modifier le handoff pour des commits que l'utilisateur n'a pas demandés.

## Étapes (dans l'ordre)

1. **Lire** `CLAUDE_HANDOFF.md` (section du haut : « État prioritaire de reprise » — elle prévaut sur l'historique).
2. **Vérifier** `git status` et `git diff` (staged + unstaged) pour savoir ce qui entre dans le commit.
3. **Mettre à jour** uniquement la section prioritaire du haut (pas besoin de réécrire tout l'historique en bas) avec :
   - version `package.json` si elle a changé ;
   - compteur de tests (`npm test`) et scripts de validation pertinents ;
   - ce qui a été fait dans **cette** passe (fichiers/clés : moteur, générateurs, niveaux ROM, audio, 3D) ;
   - ce qui reste ouvert (1–5 puces, aligné sur `reference/rom-deep-analysis.md` si touché) ;
   - URLs ou commandes utiles seulement si elles ont changé.
4. **Inclure** `CLAUDE_HANDOFF.md` dans le commit **avec** le reste des changements liés (même commit, pas un commit handoff isolé sauf demande explicite).
5. **Ensuite** suivre le protocole git de l'utilisateur (message, hooks, pas de push sauf demande).

## Style du handoff

- Français, factuel, pas de marketing.
- Ne pas inventer de pourcentages de « port terminé ».
- Si les chiffres du handoff contredisent les tests ou `rom-deep-analysis.md`, **corriger le handoff** pour qu'ils correspondent aux sources vérifiables.

## Références rapides

| Fichier | Rôle |
|---------|------|
| `CLAUDE_HANDOFF.md` | État de reprise pour le prochain agent |
| `reference/rom-deep-analysis.md` | Priorités ROM et limites honnêtes |
| `reference/validation.md` | Résultats navigateur/mobile si mis à jour |

## Message de commit

Le message peut résumer le **pourquoi** du changement code ; le handoff porte le **contexte de reprise** (prochaine session). Les deux doivent être cohérents.
