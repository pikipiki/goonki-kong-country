#!/usr/bin/env python3
"""Rename short test symbols to tickGame + game/controls."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "tests"


def migrate(path: Path) -> bool:
    text = path.read_text()
    if "helpers/simulation" in text and "function tick(" not in text:
        return False
    original = text
    if "tickGame" not in text and "from '../src/game/engine'" in text:
        text = text.replace(
            "from '../src/game/engine'",
            "from '../src/game/engine'\nimport { tickGame } from './helpers/simulation'",
            1,
        )
    text = re.sub(
        r"function tick\(game: Game, controls: Controls, frameCount = 1\)[^{]*\{[^}]*\}\n",
        "",
        text,
        flags=re.MULTILINE,
    )
    text = re.sub(
        r"function tick\([^)]+\)[^{]*\{[^}]*\}\n",
        "",
        text,
        flags=re.MULTILINE,
    )
    text = text.replace("tick(game,", "tickGame(game,")
    text = text.replace("tick(g,", "tickGame(game,")
    text = re.sub(r"\bconst g =", "const game =", text)
    text = re.sub(r"\bconst c =", "const controls =", text)
    text = re.sub(r"\bg\.player", "game.player", text)
    text = re.sub(r"\bg\.enemies", "game.enemies", text)
    text = re.sub(r"\bg\.animals", "game.animals", text)
    text = re.sub(r"\bg\.level", "game.level", text)
    text = re.sub(r"\bg\.phase", "game.phase", text)
    text = re.sub(r"\bg\.start", "game.start", text)
    text = re.sub(r"\bg\.load", "game.load", text)
    text = re.sub(r"\bg\.update", "game.update", text)
    text = re.sub(r"\bg\.thrown", "game.thrown", text)
    text = re.sub(r"\bg\.mount", "game.mount", text)
    text = re.sub(r"\bg\.player", "game.player", text)
    text = re.sub(r"\bc\.set", "controls.set", text)
    text = re.sub(r"\bc\.input", "controls.input", text)
    text = re.sub(r"\bc\.reset", "controls.reset", text)
    text = re.sub(r"\btick\(g,", "tickGame(game,", text)
    text = re.sub(r"\btick\(game, c", "tickGame(game, controls", text)
    text = re.sub(r"\btick\(game, controls, n\)", "tickGame(game, controls, frameCount)", text)
    text = re.sub(r"for \(let n = 0", "for (let frame = 0", text)
    text = re.sub(r"for \(let i = 0", "for (let frame = 0", text)
    if text != original:
        path.write_text(text)
        return True
    return False


def main() -> None:
    changed = 0
    for path in sorted(ROOT.glob("**/*.test.ts")):
        if migrate(path):
            changed += 1
            print("migrated", path.relative_to(ROOT.parent))
    print("done", changed, "files")


if __name__ == "__main__":
    main()
