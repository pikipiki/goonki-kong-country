#!/usr/bin/env python3
"""Remove unused imports from playingFrame step modules (post-split boilerplate)."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FRAME = ROOT / "src/game/engine/playingFrame"


def parse_import_blocks(header: str) -> list[tuple[str, list[str]]]:
    blocks: list[tuple[str, list[str]]] = []
    i = 0
    lines = header.splitlines()
    while i < len(lines):
        line = lines[i]
        if line.startswith("import type "):
            block = [line]
            i += 1
            while i < len(lines) and not lines[i].strip():
                block.append(lines[i])
                i += 1
            source = re.search(r"from ['\"]([^'\"]+)['\"]", block[0])
            if source:
                name = re.search(r"import type \{ (\w+) \}", block[0])
                if name:
                    blocks.append((source.group(1), [name.group(1)]))
            continue
        if line.startswith("import "):
            block = [line]
            i += 1
            while i < len(lines) and not re.search(r"from ['\"]", block[-1]):
                block.append(lines[i])
                i += 1
            joined = "\n".join(block)
            source = re.search(r"from ['\"]([^'\"]+)['\"]", joined)
            if not source:
                i += 1
                continue
            names = re.findall(r"\b([A-Za-z_][\w]*)\b", joined.split("from", 1)[0])
            names = [n for n in names if n not in ("import", "type", "as")]
            blocks.append((source.group(1), names))
            continue
        i += 1
    return blocks


def symbol_used(name: str, body: str) -> bool:
    return re.search(rf"\b{re.escape(name)}\b", body) is not None


def format_import(source: str, names: list[str]) -> str:
    if len(names) == 1:
        return f"import {{ {names[0]} }} from '{source}'"
    inner = ",\n  ".join(names)
    return f"import {{\n  {inner},\n}} from '{source}'"


def prune_file(path: Path) -> None:
    text = path.read_text()
    match = re.search(r"^export function", text, re.M)
    if not match:
        return
    header = text[: match.start()]
    body = text[match.start() :]
    by_source: dict[str, list[str]] = {}
    for source, names in parse_import_blocks(header):
        kept = [n for n in names if symbol_used(n, body)]
        if not kept:
            continue
        existing = by_source.setdefault(source, [])
        for n in kept:
            if n not in existing:
                existing.append(n)

    type_lines = [
        line
        for line in header.splitlines()
        if line.startswith("import type ")
        and symbol_used(re.search(r"\{ (\w+) \}", line).group(1), body)  # type: ignore[union-attr]
    ]
    value_lines = [format_import(src, names) for src, names in sorted(by_source.items())]
    new_header = "\n".join(value_lines + type_lines) + ("\n\n" if value_lines or type_lines else "")
    path.write_text(new_header + body)


def main() -> None:
    for path in sorted(FRAME.glob("step*.ts")):
        prune_file(path)
    print("pruned", len(list(FRAME.glob("step*.ts"))), "step files")


if __name__ == "__main__":
    main()
