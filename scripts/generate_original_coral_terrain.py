"""Regenerate marine numeric geometry using the Rev2 marine layout.
The TypeScript query module is maintained source; data is generated separately.
"""
import runpy
from pathlib import Path
runpy.run_path(str(Path(__file__).with_name("analyze_coral_terrain.py")),run_name="__main__")
