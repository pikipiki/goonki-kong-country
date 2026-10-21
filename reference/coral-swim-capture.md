# Capture `coral-swim.state` (Rev 2)

1. ROM : `Donkey Kong Country (USA) (Rev 2).zip` (SHA-256 dans `rom-analysis.json`).
2. Core Snes9x : `work/snes9x/` (voir scripts `probe_player_motion.py`).
3. Entrer **Coral Capers**, plonger en **DK** (pas Enguarde).
4. Save state Snes9x →  
   `work/runtime-rom/coral/coral-swim.state`
5. Vérifier : `npm run probe:coral` doit afficher `stateNote` avec **coral-swim**, pas le proxy jungle.
6. `npm run generate:coral-parity` met à jour `underwater-motion.json` (`trustedUnderwater: true`, vitesses verticales si trace fiable).

Les traces proxy actuelles reflètent la marche jungle (`state 40`, vy de chute) — ne pas les utiliser pour régler la nage web.
