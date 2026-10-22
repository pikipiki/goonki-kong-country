#!/usr/bin/env python3
"""Rename g -> game and use advanceGame in test files (conservative)."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
TESTS = ROOT / "tests"
FILES = [
    "route-safety.test.ts",
    "roll-jump-route.test.ts",
    "reverb-cannons.test.ts",
    "mine-bird-landing.test.ts",
    "enguarde-route.test.ts",
    "charged-animals.test.ts",
    "canyon-clearance.test.ts",
    "cannon-motion.test.ts",
    "boss-feedback.test.ts",
    "bonus-cannon.test.ts",
    "animals.test.ts",
    "2d-regressions.test.ts",
]


def migrate(path: Path) -> None:
    text = path.read_text()
    if "const game = new Game()" in text and "const g = new Game()" not in text:
        return
    orig = text
    text = re.sub(r"\bconst g = new Game\(\)", "const game = new Game()", text)
    text = re.sub(r"\bg\.update\b", "game.update", text)
    text = re.sub(r"\breturn g\b", "return game", text)
    text = re.sub(r"\(g:", "(game:", text)
    text = re.sub(r"\(g,", "(game,", text)
    text = re.sub(r"function (\w+)\(g: Game", r"function \1(game: Game", text)
    text = re.sub(r"\bg\.start\b", "game.start", text)
    text = re.sub(r"\bg\.enemies\b", "game.enemies", text)
    text = re.sub(r"\bg\.animals\b", "game.animals", text)
    text = re.sub(r"\bg\.player\b", "game.player", text)
    text = re.sub(r"\bg\.level\b", "game.level", text)
    text = re.sub(r"\bg\.mount\b", "game.mount", text)
    text = re.sub(r"\bg\.thrown\b", "game.thrown", text)
    text = re.sub(r"\bg\.time\b", "game.time", text)
    text = re.sub(r"\bg\.phase\b", "game.phase", text)
    text = re.sub(r"\bg\.load\b", "game.load", text)
    text = re.sub(r"\bg\.bonus\b", "game.bonus", text)
    text = re.sub(r"\bg\.letters\b", "game.letters", text)
    text = re.sub(r"\bg\.cannonAngle\b", "game.cannonAngle", text)
    text = re.sub(r"\bg\.cannonPosition\b", "game.cannonPosition", text)
    text = re.sub(r"\bg\.finish\b", "game.finish", text)
    text = re.sub(r"\bg\.damage\b", "game.damage", text)
    text = re.sub(r"\bg\.save\b", "game.save", text)
    text = re.sub(r"\bg\.usedBarrels\b", "game.usedBarrels", text)
    text = re.sub(r"\bg\.collected\b", "game.collected", text)
    text = re.sub(r"\bg\.bossBattle\b", "game.bossBattle", text)
    text = re.sub(r"\bg\.enemyShots\b", "game.enemyShots", text)
    text = re.sub(r"\bg\.originalRoute\b", "game.originalRoute", text)
    text = re.sub(r"\bg\.levelId\b", "game.levelId", text)
    text = re.sub(r"\bg\.bananas\b", "game.bananas", text)
    text = re.sub(r"\bg\.lives\b", "game.lives", text)
    text = re.sub(r"\bg\.checkpoint\b", "game.checkpoint", text)
    text = re.sub(r"\bg\.brokenWalls\b", "game.brokenWalls", text)
    text = re.sub(r"\bg\.revealedCaches\b", "game.revealedCaches", text)
    text = re.sub(r"\bg\.collectedCaches\b", "game.collectedCaches", text)
    text = re.sub(r"\bg\.collectedBonus\b", "game.collectedBonus", text)
    text = re.sub(r"\bg\.completedBonus\b", "game.completedBonus", text)
    text = re.sub(r"\bg\.collectedTokens\b", "game.collectedTokens", text)
    text = re.sub(r"\bg\.animalTokens\b", "game.animalTokens", text)
    text = re.sub(r"\bg\.sceneRevision\b", "game.sceneRevision", text)
    text = re.sub(r"\bg\.cameraBounds\b", "game.cameraBounds", text)
    text = re.sub(r"\bg\.mineRecoveryLayout\b", "game.mineRecoveryLayout", text)
    text = re.sub(r"\bg\.bonusDoorCooldown\b", "game.bonusDoorCooldown", text)
    text = re.sub(r"\bg\.bossProjectiles\b", "game.bossProjectiles", text)
    text = re.sub(r"\bg\.trail\b", "game.trail", text)
    text = re.sub(r"\bg\.companion\b", "game.companion", text)
    text = re.sub(r"\bg\.swap\b", "game.swap", text)
    text = re.sub(r"\bg\.particles\b", "game.particles", text)
    text = re.sub(r"\bg\.cannonTimes\b", "game.cannonTimes", text)
    text = re.sub(r"\bg\.toastTimer\b", "game.toastTimer", text)
    text = re.sub(r"\bg\.toast\b", "game.toast", text)
    text = re.sub(r"\bg\.message\b", "game.message", text)
    text = re.sub(r"\bg\.onEvent\b", "game.onEvent", text)
    text = re.sub(r"\bg\.pop\b", "game.pop", text)
    text = re.sub(r"\bg\.isTokenCollected\b", "game.isTokenCollected", text)
    text = re.sub(r"\bg\.isBonusCompleted\b", "game.isBonusCompleted", text)
    text = re.sub(r"\bg\.leaveBonus\b", "game.leaveBonus", text)
    text = re.sub(r"\bg\.pause\b", "game.pause", text)
    text = re.sub(r"\bg\.dismount\b", "game.dismount", text)
    text = re.sub(r"\bg\.surface\b", "game.surface", text)
    text = re.sub(r"\bg\.floorAt\b", "game.floorAt", text)
    text = re.sub(r"\bg\.supportAt\b", "game.supportAt", text)
    text = re.sub(r"\bg\.letterWord\b", "game.letterWord", text)
    text = re.sub(r"\bg\.levelBananas\b", "game.levelBananas", text)
    text = re.sub(r"\bg\.total\b", "game.total", text)
    if text != orig and "advanceGame" not in text:
        if "from './helpers/simulation'" not in text and "helpers/simulation" not in text:
            text = text.replace(
                "from '../src/game/engine'",
                "from '../src/game/engine'\nimport { advanceGame } from './helpers/simulation'",
                1,
            )
        text = re.sub(
            r"for \(let (\w+) = 0; \1 < (\d+); \1\+\+\) game\.update\(emptyInput\(\)\)",
            r"advanceGame(game, emptyInput(), \2)",
            text,
        )
        text = re.sub(
            r"for \(let (\w+) = 0; \1 < (\w+); \1\+\+\) game\.update\(input\)",
            r"advanceGame(game, input, \2)",
            text,
        )
    if text != orig:
        path.write_text(text)
        print("updated", path.name)


def main() -> None:
    for name in FILES:
        migrate(TESTS / name)


if __name__ == "__main__":
    main()
