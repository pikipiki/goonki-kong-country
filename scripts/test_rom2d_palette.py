#!/usr/bin/env python3
"""ROM sprite color regression. Run with Python + Pillow; local ROM checks skip if absent."""
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import unittest
import zipfile
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("extract_jungle_2d", ROOT / "scripts/extract_jungle_2d.py")
extractor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extractor)


class SpritePaletteDecoder(unittest.TestCase):
    def test_fifteen_words_do_not_read_into_next_record(self):
        words = [0x0421 + i * 0x0421 for i in range(15)]
        data = struct.pack("<15H", *words)  # Exactly thirty bytes, no 16th color.
        colors = extractor.read_palette(data, 0)
        self.assertEqual(len(colors), 16)
        self.assertEqual(colors[0], (0, 0, 0, 0))
        self.assertEqual(colors[1], extractor.bgr555_to_rgba(words[0]))
        self.assertEqual(colors[15], extractor.bgr555_to_rgba(words[14]))
        self.assertTrue(all(c[3] == 255 for c in colors[1:]))

    def test_night_conversion_preserves_index_alignment(self):
        data = struct.pack("<15H", *([0x7FFF] * 15))
        colors = extractor.read_palette(data, 0, night=True)
        self.assertEqual(colors[0], (0, 0, 0, 0))
        self.assertEqual(colors[1:], [extractor.bgr555_to_rgba(extractor.night_bgr555(0x7FFF))] * 15)

    def test_4bpp_color_one_is_first_stored_color(self):
        tile = bytearray(32)
        tile[0] = 0x80
        decoded = extractor.decode_4bpp_tile(tile, 0)
        palette = extractor.read_palette(struct.pack("<15H", 0x001F, *([0x7FFF] * 14)), 0)
        self.assertEqual(palette[decoded[0][0]], (255, 0, 0, 255))
        self.assertEqual(palette[decoded[0][1]], (0, 0, 0, 0))


class SuppliedRomAtlas(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not Path(extractor.ROM_ZIP).exists():
            raise unittest.SkipTest("Supplied local Rev 2 ROM unavailable")
        with zipfile.ZipFile(extractor.ROM_ZIP) as archive:
            cls.rom = archive.read(archive.namelist()[0])
        cls.manifest = json.loads((ROOT / "public/rom2d/manifest.json").read_text())
        cls.atlas = Image.open(ROOT / "public/rom2d/sprites.png").convert("RGBA")

    def test_exact_supplied_rom_identity(self):
        digest = hashlib.sha256(self.rom).hexdigest()
        self.assertEqual(digest, "628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527")
        self.assertEqual(self.manifest["source"]["romSha256"], digest)

    def test_rev2_sprite_palette_dma_upload_is_thirty_bytes(self):
        self.assertEqual(self.rom[0xA2DB:0xA2E4], bytes.fromhex("9C491EADCF1ACDD11A"))
        self.assertEqual(self.rom[0xA2FC:0xA302], bytes.fromhex("A91E008D0543"))

    def test_generated_visible_pixels_belong_to_each_rom_palette(self):
        # These are direct offsets in the supplied Rev 2 ROM, not adjusted color values.
        groups = {
            "kritter_walk": 0x3C8512, "klump_walk": 0x3C85C6,
            "gnawty_walk": 0x3C8A1C, "necky_throw": 0x3C86D4,
            "sign_exit": 0x3C8350, "sign_arrow": 0x3C8350,
            "rambi_idle": 0x3C8404, "barrel_idle": 0x3C872E,
            "dk_barrel": 0x3C872E, "dk_letters": 0x3C86F2,
            "letter_k": 0x3C86F2, "cave_hole": 0x3C81EA,
            "platform": 0x3C88D2,
        }
        for group, offset in groups.items():
            with self.subTest(group=group):
                expected = set(extractor.read_palette(self.rom, offset)[1:])
                self.assertTrue(self.manifest["groups"][group])
                for frame_index in self.manifest["groups"][group]:
                    f = self.manifest["frames"][frame_index]
                    pixels = self.atlas.crop((f["x"], f["y"], f["x"] + f["w"], f["y"] + f["h"]))
                    actual = {color for _, color in pixels.getcolors(pixels.width * pixels.height) if color[3]}
                    self.assertTrue(actual)
                    self.assertFalse(actual - expected, f"{group}: pixels from another palette: {actual - expected}")

    def test_kritter_and_sign_keep_original_shadow_and_highlight(self):
        for group, offset in [("kritter_walk", 0x3C8512), ("sign_exit", 0x3C8350)]:
            with self.subTest(group=group):
                f = self.manifest["frames"][self.manifest["groups"][group][0]]
                crop = self.atlas.crop((f["x"], f["y"], f["x"]+f["w"], f["y"]+f["h"]))
                colors = {color for _, color in crop.getcolors(crop.width * crop.height)}
                self.assertIn(extractor.bgr555_to_rgba(struct.unpack_from("<H", self.rom, offset)[0]), colors)
                highlight_index = 14 if group == "kritter_walk" else 13
                highlight = struct.unpack_from("<H", self.rom, offset + highlight_index * 2)[0]
                self.assertIn(extractor.bgr555_to_rgba(highlight), colors)


if __name__ == "__main__":
    unittest.main(verbosity=2)
