#!/usr/bin/env python3
"""
Extracts ROM graphics, backgrounds, palettes, HUD tiles,
and sprite animations for Stage 1 (Jungle Hijinxs) directly from the
Donkey Kong Country (USA) (Rev 2) SNES ROM into public/rom2d/.
"""
import argparse
import hashlib
import json
import os
import re
import struct
import zipfile
from PIL import Image

ROM_ZIP = "/Users/sevenone./Downloads/Donkey Kong Country (USA) (Rev 2).zip"
MACROS_ASM = "/Users/sevenone./Documents/Codex/2026-10-21/cre/work/dkc-disassembly/DKC1/Routine_Macros_DKC1.asm"
OUT_DIR = "/Users/sevenone./Documents/git/goonk-country/public/rom2d"


def snes_to_pc(addr: int) -> int:
    return addr & 0x3FFFFF


def bgr555_to_rgba(c: int, transparent: bool = False):
    if transparent:
        return (0, 0, 0, 0)
    r = (c & 0x1F) << 3
    g = ((c >> 5) & 0x1F) << 3
    b = ((c >> 10) & 0x1F) << 3
    return (r | (r >> 5), g | (g >> 5), b | (b >> 5), 255)


def night_bgr555(c: int) -> int:
    """Exact ROM CODE_80AC8B night palette conversion."""
    r = c & 0x1F
    g = (c >> 5) & 0x1F
    rn = (r >> 2) + (r >> 4)
    gn = (g >> 1) + (g >> 3)
    bn = gn
    return (bn << 10) | (gn << 5) | rn


def decompress_dkc(rom: bytes, start: int) -> bytes:
    pos = start + 0x80
    out = bytearray()
    while pos < len(rom):
        cmd = rom[pos]
        pos += 1
        if cmd == 0:
            break
        mode = cmd & 0xC0
        count = cmd & 0x3F
        if mode == 0x00:
            out.extend(rom[pos : pos + count])
            pos += count
        elif mode == 0x40:
            b = rom[pos]
            pos += 1
            out.extend([b] * count)
        elif mode == 0x80:
            ref = rom[pos] | (rom[pos + 1] << 8)
            pos += 2
            for i in range(count):
                out.append(out[ref + i])
        elif mode == 0xC0:
            dict_off = start + (count << 1)
            out.append(rom[dict_off])
            out.append(rom[dict_off + 1])
    return bytes(out)


def decode_4bpp_tile(data: bytes, tile_idx: int):
    base = tile_idx * 32
    pixels = [[0] * 8 for _ in range(8)]
    if base + 32 > len(data):
        return pixels
    for y in range(8):
        bp0 = data[base + y * 2]
        bp1 = data[base + y * 2 + 1]
        bp2 = data[base + 16 + y * 2]
        bp3 = data[base + 16 + y * 2 + 1]
        for x in range(8):
            bit = 7 - x
            c = (
                ((bp0 >> bit) & 1)
                | (((bp1 >> bit) & 1) << 1)
                | (((bp2 >> bit) & 1) << 2)
                | (((bp3 >> bit) & 1) << 3)
            )
            pixels[y][x] = c
    return pixels


def decode_2bpp_tile(data: bytes, tile_idx: int):
    base = tile_idx * 16
    pixels = [[0] * 8 for _ in range(8)]
    if base + 16 > len(data):
        return pixels
    for y in range(8):
        bp0 = data[base + y * 2]
        bp1 = data[base + y * 2 + 1]
        for x in range(8):
            bit = 7 - x
            c = ((bp0 >> bit) & 1) | (((bp1 >> bit) & 1) << 1)
            pixels[y][x] = c
    return pixels


def read_palette(rom: bytes, snes_addr: int, night: bool = False):
    off = snes_to_pc(snes_addr)
    # Sprite palette records contain ONLY colors 1..15 (30 bytes). The ROM
    # CODE_80A2CD (Rev 2 PC $00A2DB) uploads $001E bytes to CGRAM starting at the nonzero slot.
    # Color zero is implicit transparent, unlike the 16-word background records.
    # Reading 16 words here shifts every visible color and borrows the next record.
    cols = [(0, 0, 0, 0)]
    for i in range(15):
        c = struct.unpack_from("<H", rom, off + i * 2)[0]
        if night:
            c = night_bgr555(c)
        cols.append(bgr555_to_rgba(c))
    return cols


def render_metatile_layer(
    rom: bytes,
    gfx: bytes,
    pals: list,
    lvl_off: int,
    m32_off: int,
    col_start: int,
    col_count: int,
    row_start: int,
    row_count: int,
    priority_filter=None,
    skip_wrapped_canopy: bool = False,
) -> Image.Image:
    num_tiles = len(gfx) // 32
    decoded = [decode_4bpp_tile(gfx, i) for i in range(num_tiles)]
    img = Image.new("RGBA", (col_count * 32, row_count * 32), (0, 0, 0, 0))
    pix = img.load()

    for col_idx in range(col_count):
        col = col_start + col_idx
        for row_idx in range(row_count):
            row = row_start + row_idx
            if skip_wrapped_canopy and row == 15 and col < 30:
                continue
            mw = struct.unpack_from("<H", rom, lvl_off + (col * 16 + row) * 2)[0]
            m_idx = mw & 0x3FFF
            m_hflip = (mw & 0x4000) != 0
            m_vflip = (mw & 0x8000) != 0
            m_base = m32_off + m_idx * 32
            for ty in range(4):
                for tx in range(4):
                    stx = (3 - tx) if m_hflip else tx
                    sty = (3 - ty) if m_vflip else ty
                    tw = struct.unpack_from("<H", rom, m_base + (sty * 4 + stx) * 2)[0]
                    prio = (tw >> 13) & 1
                    if priority_filter is not None and prio != priority_filter:
                        continue
                    t_idx = tw & 0x03FF
                    pal_idx = (tw >> 10) & 7
                    if pal_idx < 0 or pal_idx >= len(pals) or t_idx >= num_tiles:
                        continue
                    t_hflip = ((tw & 0x4000) != 0) ^ m_hflip
                    t_vflip = ((tw & 0x8000) != 0) ^ m_vflip
                    tile = decoded[t_idx]
                    pal = pals[pal_idx]
                    bx = col_idx * 32 + tx * 8
                    by = row_idx * 32 + ty * 8
                    for py in range(8):
                        sy = (7 - py) if t_vflip else py
                        for px in range(8):
                            sx = (7 - px) if t_hflip else px
                            c_idx = tile[sy][sx]
                            if c_idx != 0:
                                pix[bx + px, by + py] = pal[c_idx]
    return img


def decode_dynamic_sprite(rom: bytes, snes_addr: int, pal: list):
    off = snes_to_pc(snes_addr)
    n16, n8a, toffa, n8b, toffb, dma1, voff2, dma2_raw = rom[off : off + 8]
    dma2 = dma2_raw & 0x0F
    total_pos = n16 + n8a + n8b
    pos_off = off + 8
    coords = []
    for i in range(total_pos):
        dx = rom[pos_off + i * 2] - 0x80
        dy = rom[pos_off + i * 2 + 1] - 0x80
        coords.append((dx, dy))

    gfx_off = pos_off + total_pos * 2
    vram = [bytes(32) for _ in range(256)]
    for i in range(dma1):
        vram[i] = rom[gfx_off + i * 32 : gfx_off + (i + 1) * 32]
    gfx2_off = gfx_off + dma1 * 32
    for i in range(dma2):
        if voff2 + i < 256:
            vram[voff2 + i] = rom[gfx2_off + i * 32 : gfx2_off + (i + 1) * 32]

    subsprites = []
    t = 0
    idx = 0
    for _ in range(n16):
        dx, dy = coords[idx]
        idx += 1
        subsprites.append((dx, dy, 16, t))
        t += 2
        if t & 0x10:
            t += 0x10
    t = toffa
    for _ in range(n8a):
        dx, dy = coords[idx]
        idx += 1
        subsprites.append((dx, dy, 8, t))
        t += 1
    t = toffb
    for _ in range(n8b):
        dx, dy = coords[idx]
        idx += 1
        subsprites.append((dx, dy, 8, t))
        t += 1

    if not subsprites:
        return None

    min_x = min(s[0] for s in subsprites)
    min_y = min(s[1] for s in subsprites)
    max_x = max(s[0] + s[2] for s in subsprites)
    max_y = max(s[1] + s[2] for s in subsprites)
    w = max_x - min_x
    h = max_y - min_y
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    pix = img.load()

    def draw_tile(t_idx: int, bx: int, by: int):
        if t_idx >= 256:
            return
        tile = decode_4bpp_tile(vram[t_idx], 0)
        for py in range(8):
            for px in range(8):
                c = tile[py][px]
                if c != 0 and 0 <= bx + px < w and 0 <= by + py < h:
                    pix[bx + px, by + py] = pal[c]

    for dx, dy, size, tile_idx in reversed(subsprites):
        bx = dx - min_x
        by = dy - min_y
        if size == 8:
            draw_tile(tile_idx, bx, by)
        else:
            draw_tile(tile_idx, bx, by)
            draw_tile(tile_idx + 1, bx + 8, by)
            draw_tile(tile_idx + 16, bx, by + 8)
            draw_tile(tile_idx + 17, bx + 8, by + 8)

    return img, min_x, min_y


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sprites-only", action="store_true", help="Update sprite colors without regenerating existing background/map assets")
    args = parser.parse_args()
    os.makedirs(OUT_DIR, exist_ok=True)
    with zipfile.ZipFile(ROM_ZIP) as zf:
        rom = zf.read(zf.namelist()[0])

    with open(MACROS_ASM, "r") as f:
        macros_txt = f.read()

    sprite_Addrs = {}
    for m in re.finditer(
        r"DATA_([0-9A-Fa-f]{6}):((?:(?!DATA_).)*?)Graphics/DynamicSprites/GFX_([A-Za-z0-9_]+)\.bin",
        macros_txt,
        re.DOTALL,
    ):
        addr = int(m.group(1), 16)
        db_block = m.group(2)
        name = m.group(3)
        hdr_bytes = bytes(int(h, 16) for h in re.findall(r"\$([0-9A-Fa-f]{2})", db_block))
        pc = snes_to_pc(addr)
        if rom[pc : pc + len(hdr_bytes)] == hdr_bytes:
            sprite_Addrs[name] = pc
        else:
            found = rom.find(hdr_bytes)
            sprite_Addrs[name] = found if found != -1 else pc

    if args.sprites_only:
        with open(os.path.join(OUT_DIR, "manifest.json")) as f:
            existing = json.load(f)
        sky_day_hdma = existing["skyDay"]
        sky_night_hdma = existing["skyNight"]
    else:
        # 1. Layer 1 & Layer 2 (Day & Night)
        jungle_gfx = decompress_dkc(rom, 0x158FC0)
        pal_off = 0x39A1DC
        day_pals = []
        night_pals = []
        for p in range(8):
            dp = []
            np = []
            for c in range(16):
                val = struct.unpack_from("<H", rom, pal_off + (p * 16 + c) * 2)[0]
                dp.append(bgr555_to_rgba(val, c == 0))
                np.append(bgr555_to_rgba(night_bgr555(val), c == 0))
            day_pals.append(dp)
            night_pals.append(np)

        print("Rendering Layer 1 (Back & Front chunks <= 2048px for iOS/Android)...")
        l1_back = render_metatile_layer(
            rom, jungle_gfx, day_pals, 0x190000, 0x19A3C0, 0, 169, 0, 16,
            priority_filter=0, skip_wrapped_canopy=True
        )
        l1_front = render_metatile_layer(
            rom, jungle_gfx, day_pals, 0x190000, 0x19A3C0, 0, 169, 0, 16,
            priority_filter=1, skip_wrapped_canopy=True
        )
        chunk_w = 2048
        for idx, x0 in enumerate(range(0, l1_back.width, chunk_w)):
            x1 = min(l1_back.width, x0 + chunk_w)
            l1_back.crop((x0, 0, x1, 512)).save(
                os.path.join(OUT_DIR, f"layer1-back-{idx}.png"), optimize=True
            )
            l1_front.crop((x0, 0, x1, 512)).save(
                os.path.join(OUT_DIR, f"layer1-front-{idx}.png"), optimize=True
            )

        print("Rendering Layer 2...")
        l2_day = render_metatile_layer(
            rom, jungle_gfx, day_pals, 0x190000, 0x19A3C0, 168, 16, 0, 8
        )
        l2_day.save(os.path.join(OUT_DIR, "layer2.png"), optimize=True)

        # 2. Layer 3 distant canopy silhouette & Sky HDMA tables
        print("Rendering Layer 3 & Sky HDMA...")
        sky_day_hdma = []
        pos = 0x3996E6
        while pos < 0x3998E7:
            cnt = rom[pos]
            if cnt == 0:
                break
            c = struct.unpack_from("<H", rom, pos + 3)[0]
            r, g, b, _ = bgr555_to_rgba(c)
            for _ in range(cnt):
                sky_day_hdma.append([r, g, b])
            pos += 5
        # Only keep scanlines 0..74 (dawn gradient); scanlines >= 75 in ROM are grey filler behind BG2/BG3
        sky_day_hdma = sky_day_hdma[:75]

        sky_night_hdma = []
        for i in range(71):
            c = struct.unpack_from("<H", rom, 0x399658 + i * 2)[0]
            r, g, b, _ = bgr555_to_rgba(c)
            for _ in range(4):
                sky_night_hdma.append([r, g, b])
        sky_night_hdma = sky_night_hdma[:224]

        l3_hdma_day = []
        l3_hdma_night = []
        pos = 0x3998EA
        while pos < 0x399980:
            cnt = rom[pos]
            if cnt == 0:
                break
            c = struct.unpack_from("<H", rom, pos + 3)[0]
            nc = night_bgr555(c)
            for _ in range(cnt):
                l3_hdma_day.append(bgr555_to_rgba(c))
                l3_hdma_night.append(bgr555_to_rgba(nc))
            pos += 5

        l3_gfx = rom[0x0DF4B7 : 0x0DF4B7 + 0x0450]
        l3_tiles = [decode_2bpp_tile(l3_gfx, i) for i in range(len(l3_gfx) // 16)]
        l3_day_img = Image.new("RGBA", (256, 48), (0, 0, 0, 0))
        l3_night_img = Image.new("RGBA", (256, 48), (0, 0, 0, 0))
        l3_dpix = l3_day_img.load()
        l3_npix = l3_night_img.load()

        for ty in range(6):
            for tx in range(32):
                tw = struct.unpack_from("<H", rom, 0x0DF337 + (ty * 32 + tx) * 2)[0]
                t_idx = tw & 0x03FF
                hflip = (tw & 0x4000) != 0
                vflip = (tw & 0x8000) != 0
                if t_idx >= len(l3_tiles):
                    continue
                tile = l3_tiles[t_idx]
                for py in range(8):
                    sy = (7 - py) if vflip else py
                    screen_y = 64 + ty * 8 + py
                    dcol = l3_hdma_day[min(screen_y, len(l3_hdma_day) - 1)]
                    ncol = l3_hdma_night[min(screen_y, len(l3_hdma_night) - 1)]
                    sday = sky_day_hdma[min(screen_y, len(sky_day_hdma) - 1)]
                    for px in range(8):
                        sx = (7 - px) if hflip else px
                        c_idx = tile[sy][sx]
                        if c_idx != 0:
                            l3_dpix[tx * 8 + px, ty * 8 + py] = dcol
                            l3_npix[tx * 8 + px, ty * 8 + py] = ncol
                        elif (ty * 8 + py) >= 7:
                            l3_dpix[tx * 8 + px, ty * 8 + py] = (sday[0], sday[1], sday[2], 255)

        l3_day_img.save(os.path.join(OUT_DIR, "layer3.png"), optimize=True)

        # 2b. World Map & Kongo Jungle Map 2D backgrounds from ROM
        print("Rendering 2D Overworld Maps from ROM...")
        def render_raw_tilemap(tm_off: int, gfx_off: int, gfx_end: int, pal_off: int) -> Image.Image:
            mpals = []
            for p in range(8):
                mpals.append(
                    [
                        bgr555_to_rgba(
                            struct.unpack_from("<H", rom, pal_off + (p * 16 + c) * 2)[0],
                            False,
                        )
                        for c in range(16)
                    ]
                )
            mgfx = rom[gfx_off:gfx_end]
            mtiles = [decode_4bpp_tile(mgfx, i) for i in range(len(mgfx) // 32)]
            mim = Image.new("RGBA", (256, 224), (0, 0, 0, 255))
            mpix = mim.load()
            for ty in range(28):
                for tx in range(32):
                    tw = struct.unpack_from("<H", rom, tm_off + (ty * 32 + tx) * 2)[0]
                    t_idx = tw & 0x3FF
                    pal_idx = (tw >> 10) & 7
                    hf = (tw & 0x4000) != 0
                    vf = (tw & 0x8000) != 0
                    if t_idx >= len(mtiles):
                        continue
                    tile = mtiles[t_idx]
                    pal = mpals[pal_idx]
                    for py in range(8):
                        sy = (7 - py) if vf else py
                        for px in range(8):
                            sx = (7 - px) if hf else px
                            mpix[tx * 8 + px, ty * 8 + py] = pal[tile[sy][sx]]
            return mim

        render_raw_tilemap(0x050912, 0x051012, 0x056FB2, 0x39C103).save(
            os.path.join(OUT_DIR, "map-kongo.png"), optimize=True
        )
        render_raw_tilemap(0x010FF0, 0x0116F1, 0x016AD1, 0x39BE03).save(
            os.path.join(OUT_DIR, "map-island.png"), optimize=True
        )

        # 3. Cave Bonus Room
        print("Rendering Cave Bonus Room...")
        cave_gfx = decompress_dkc(rom, 0x1C0000)
        cave_pals = []
        for p in range(8):
            cp = []
            for c in range(16):
                val = struct.unpack_from("<H", rom, 0x39A01C + (p * 16 + c) * 2)[0]
                cp.append(bgr555_to_rgba(val, c == 0))
            cave_pals.append(cp)

        cave_back = render_metatile_layer(
            rom, cave_gfx, cave_pals, 0x1A0000, 0x1ABF00, 864, 8, 8, 8, priority_filter=0
        )
        cave_front = render_metatile_layer(
            rom, cave_gfx, cave_pals, 0x1A0000, 0x1ABF00, 864, 8, 8, 8, priority_filter=1
        )
        cave_back.save(os.path.join(OUT_DIR, "bonus-cave-back.png"), optimize=True)
        cave_front.save(os.path.join(OUT_DIR, "bonus-cave-front.png"), optimize=True)

    # 4. Dynamic & Static Sprites Atlas
    print("Extracting Stage 1 Sprites...")
    PAL = {
        "kritter": read_palette(rom, 0xFC8512),
        "klump": read_palette(rom, 0xFC85C6),
        "gnawty": read_palette(rom, 0xFC8A1C),
        "necky": read_palette(rom, 0xFC86D4),
        "rambi": read_palette(rom, 0xFC8404),
        "box": read_palette(rom, 0xFC8710),
        "barrel": read_palette(rom, 0xFC872E),
        "stars": read_palette(rom, 0xFC8F62),
        "global": read_palette(rom, 0xFC86F2),
        "dark_letter": read_palette(rom, 0xFC8E72),
        "balloon_red": read_palette(rom, 0xFC8878),
        "balloon_green": read_palette(rom, 0xFC8896),
        "balloon_blue": read_palette(rom, 0xFC88B4),
        "tire": read_palette(rom, 0xFC881E),
        "sign": read_palette(rom, 0xFC8350),
        "cover": read_palette(rom, 0xFC8226),
        "cave_hole": read_palette(rom, 0xFC81EA),
        "butterfly_red": read_palette(rom, 0xFC894A),
        "butterfly_blue": read_palette(rom, 0xFC892C),
        "token": read_palette(rom, 0xFC89A4),
        "platform": read_palette(rom, 0xFC88D2),
    }

    groups = {
        "kritter_walk": (["Kritter_Walk" + str(i) for i in range(1, 9)], "kritter"),
        "kritter_jump": (["Kritter_Jump" + str(i) for i in [1, 3, 5, 6, 8, 9]], "kritter"),
        "kritter_hurt": (["Kritter_Dead" + str(i) for i in range(1, 9)], "kritter"),
        "klump_walk": (["Klump_Walk" + str(i) for i in range(1, 9)], "klump"),
        "klump_recoil": (["Klump_Recoil", "Klump_Turn"], "klump"),
        "klump_hurt": (["Klump_Dead" + str(i) for i in range(1, 8)], "klump"),
        "gnawty_walk": (["Gnawty_Walk" + str(i) for i in range(1, 9)], "gnawty"),
        "gnawty_hurt": (["Gnawty_Dead" + str(i) for i in range(1, 6)], "gnawty"),
        "necky_throw": (["Necky_ThrowNut" + str(i) for i in range(1, 11)], "necky"),
        "necky_fly": (["Necky_Fly" + str(i) for i in range(1, 12)], "necky"),
        "necky_hurt": (["Necky_Dead"], "necky"),
        "necky_nut": (["NeckyNut_Pose1", "NeckyNut_Pose2", "NeckyNut_Pose3"], "necky"),
        "rambi_idle": (["Rambi_Idle" + str(i) for i in range(1, 7)], "rambi"),
        "rambi_walk": (["Rambi_Walk" + str(i) for i in range(1, 16)], "rambi"),
        "rambi_run": (["Rambi_Jump1", "Rambi_Jump2", "Rambi_Jump3", "Rambi_Jump4"], "rambi"),
        "rambi_jump": (["Rambi_Jump" + str(i) for i in range(1, 8)], "rambi"),
        "rambi_attack": (["Rambi_Stab" + str(i) for i in range(1, 9)], "rambi"),
        "rambi_box": (["AnimalBuddyBox_Rambi", "AnimalBuddyBox_Open1", "AnimalBuddyBox_Open2"], "box"),
        "barrel_idle": (["Barrel_Idle"], "barrel"),
        "barrel_roll": (["Barrel_Thrown" + str(i) for i in range(1, 9)], "barrel"),
        "barrel_break": (["Barrel_FallsApart" + str(i) for i in range(1, 9)], "barrel"),
        "dk_barrel": (["DKBarrel_Barrel" + str(i) for i in range(1, 7)], "barrel"),
        "dk_letters": (["DKBarrel_Letters" + str(i) for i in range(1, 8)], "barrel"),
        "checkpoint_barrel": (["CheckpointBarrel_Pose" + str(i) for i in range(1, 9)], "barrel"),
        "checkpoint_stars": (["CheckpointStars_Pose" + str(i) for i in range(1, 16)], "stars"),
        "cannon_normal": (["BarrelCannon_Base" + str(i) for i in range(1, 17)], "barrel"),
        "cannon_auto": (["BarrelCannon_AutoFire" + str(i) for i in range(1, 17)], "barrel"),
        "banana_bunch": (["BananaBunch_Pose" + str(i) for i in range(1, 7)], "global"),
        "letter_k": (["GoldenLetters_K"], "global"),
        "letter_o": (["GoldenLetters_O"], "global"),
        "letter_n": (["GoldenLetters_N"], "global"),
        "letter_g": (["GoldenLetters_G"], "global"),
        "balloon": (["LifeBalloon_Idle" + str(i) for i in range(1, 9)], "balloon_red"),
        "hud_balloon": (["LifeBalloon_Idle1", "LifeBalloon_Idle2", "LifeBalloon_Idle3"], "balloon_red"),
        "half_tire": (["HalfTire_Idle"] + ["HalfTire_Bounce" + str(i) for i in range(1, 7)], "tire"),
        "sign_exit": (["Sign_Exit"], "sign"),
        "sign_arrow": (["Sign_Arrow"], "sign"),
        "token_expresso": (["AnimalBuddyToken_Expresso"], "token"),
        "butterfly": (["Butterfly_Fly" + str(i) for i in range(1, 7)], "butterfly_red"),
        "ground_cover": (["GroundCover_JungleLevel"], "cover"),
        "breakable_wall": (["BreakableWall_RightJungleWall", "BreakableWall_LeftJungleWall"], "cover"),
        "cave_hole": (["CaveWallHole_RightWall"], "cave_hole"),
        "smoke_puff": (["SmokePuff_Pose" + str(i) for i in range(1, 9)], "global"),
        "burst_effect": (["BurstEffect_Pose" + str(i) for i in range(1, 13)], "global"),
        "sparkle": (["Sparkle_Pose" + str(i) for i in range(1, 9)], "global"),
        "platform": (["CavePlatform_Pose"], "platform"),
    }

    frames = []
    group_map = {}

    for gname, (snames, pal_key) in groups.items():
        gframes = []
        pal = PAL[pal_key]
        for sname in snames:
            if sname not in sprite_Addrs:
                continue
            res = decode_dynamic_sprite(rom, sprite_Addrs[sname], pal)
            if res is None:
                continue
            img, ox, oy = res
            idx = len(frames)
            frames.append({"img": img, "ox": ox, "oy": oy, "w": img.width, "h": img.height})
            gframes.append(idx)
        group_map[gname] = gframes

    # Static sprites:
    # 1. Single spinning banana (8 frames of 16x16 in GFX_Sprite_Bananas at 0x39EB65, row 2 & 3)
    bananas_raw = rom[0x39EB65 : 0x39EB65 + 0x400]
    banana_frames = []
    for f in range(8):
        img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
        pix = img.load()
        base_t = 0x10 + f * 2
        for ty in range(2):
            for tx in range(2):
                tile = decode_4bpp_tile(bananas_raw, base_t + ty * 16 + tx)
                for py in range(8):
                    for px in range(8):
                        c = tile[py][px]
                        if c != 0:
                            pix[tx * 8 + px, ty * 8 + py] = PAL["global"][c]
        idx = len(frames)
        frames.append({"img": img, "ox": -8, "oy": -8, "w": 16, "h": 16})
        banana_frames.append(idx)
    group_map["banana_spin"] = banana_frames

    # 2. HUD Banana icon (top-left of GFX_Sprite_Bananas: tiles 4,5 & 20,21 orbanana_spin[0])
    # 3. HUD Golden Digits 0..9 (tiles 6..15 top and 22..31 bottom in GFX_Sprite_HUDNumbers at 0x39E765, 8x16 each)
    hud_numbers_raw = rom[0x39E765 : 0x39E765 + 0x400]
    hud_digits = []
    for d in range(10):
        img = Image.new("RGBA", (8, 16), (0, 0, 0, 0))
        pix = img.load()
        for ty in range(2):
            tile = decode_4bpp_tile(hud_numbers_raw, (6 + d) + ty * 16)
            for py in range(8):
                for px in range(8):
                    c = tile[py][px]
                    if c != 0:
                        pix[px, ty * 8 + py] = PAL["global"][c]
        idx = len(frames)
        frames.append({"img": img, "ox": 0, "oy": 0, "w": 8, "h": 16})
        hud_digits.append(idx)
    group_map["hud_digits"] = hud_digits

    # 4. HUD KONG letters (active = PAL['global'], dark = PAL['dark_letter']) from GFX_Sprite_GlobalSprites (0x39E365)
    global_raw = rom[0x39E365 : 0x39E365 + 0x400]
    hud_kong_lit = []
    hud_kong_dark = []
    for k in range(4):
        for is_dark, target_list, pal in [
            (False, hud_kong_lit, PAL["global"]),
            (True, hud_kong_dark, PAL["dark_letter"]),
        ]:
            img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
            pix = img.load()
            base_t = 8 + k * 2
            for ty in range(2):
                for tx in range(2):
                    tile = decode_4bpp_tile(global_raw, base_t + ty * 16 + tx)
                    for py in range(8):
                        for px in range(8):
                            c = tile[py][px]
                            if c != 0:
                                pix[tx * 8 + px, ty * 8 + py] = pal[c]
            idx = len(frames)
            frames.append({"img": img, "ox": -8, "oy": -8, "w": 16, "h": 16})
            target_list.append(idx)
    group_map["hud_kong_lit"] = hud_kong_lit
    group_map["hud_kong_dark"] = hud_kong_dark

    # Pack all frames into sprites.png (shelf packing)
    atlas_w = 1024
    cx, cy, row_h = 0, 0, 0
    for f in frames:
        if cx + f["w"] + 2 > atlas_w:
            cx = 0
            cy += row_h + 2
            row_h = 0
        f["x"] = cx
        f["y"] = cy
        cx += f["w"] + 2
        row_h = max(row_h, f["h"])
    atlas_h = cy + row_h + 2

    atlas = Image.new("RGBA", (atlas_w, atlas_h), (0, 0, 0, 0))
    for f in frames:
        atlas.paste(f["img"], (f["x"], f["y"]))
    atlas.save(os.path.join(OUT_DIR, "sprites.png"), optimize=True)

    manifest = {
        "source": {
            "romSha256": hashlib.sha256(rom).hexdigest(),
            "spritePaletteLayout": "transparent index 0, then 15 BGR555 words",
            "paletteUploadRoutine": "Rev 2 $80A2DB: DMA size $001E at PC $00A2FC",
        },
        "skyDay": sky_day_hdma,
        "skyNight": sky_night_hdma,
        "frames": [
            {"x": f["x"], "y": f["y"], "w": f["w"], "h": f["h"], "ox": f["ox"], "oy": f["oy"]}
            for f in frames
        ],
        "groups": group_map,
    }
    with open(os.path.join(OUT_DIR, "manifest.json"), "w") as f:
        json.dump(manifest, f, separators=(",", ":"))

    print(f"Done! Packed {len(frames)} sprite frames into {atlas_w}x{atlas_h} atlas.")


if __name__ == "__main__":
    main()
