import { themeColors } from "@game3d/theme";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";

const plush = themeColors.plush;

/** Fine directional pile, with larger patches of brushed velour, generated locally. */
function velourTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  const pixels = ctx.createImageData(512, 512);
  let seed = 731;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let row = 0; row < 512; row++)
    for (let col = 0; col < 512; col++) {
      const index = (row * 512 + col) * 4;
      const mottle =
        Math.sin(col * 0.047 + Math.sin(row * 0.019) * 3) *
        Math.cos(row * 0.043) *
        17;
      const value = Math.min(255, 201 + mottle + random() * 47);
      pixels.data[index] =
        pixels.data[index + 1] =
        pixels.data[index + 2] =
          value;
      pixels.data[index + 3] = 255;
    }
  ctx.putImageData(pixels, 0, 0);
  for (let stroke = 0; stroke < 31000; stroke++) {
    const col = random() * 512,
      row = random() * 512;
    ctx.strokeStyle = random() > 0.5 ? plush.velourLight : plush.velourDark;
    ctx.lineWidth = 0.45 + random() * 0.55;
    ctx.beginPath();
    ctx.moveTo(col, row);
    ctx.lineTo(col + random() * 1.5, row + 1.5 + random() * 3);
    ctx.stroke();
  }
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  map.wrapS = map.wrapT = RepeatWrapping;
  map.repeat.set(2, 2);
  map.anisotropy = 8;
  return map;
}

let clothMap: CanvasTexture | undefined;
export function sharedVelourTexture() {
  clothMap ??= velourTexture();
  return clothMap;
}
