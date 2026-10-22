import { readFile, writeFile } from 'node:fs/promises'
import { CatmullRomCurve3, Vector3 } from 'three'

const profile = JSON.parse(
  await readFile(
    new URL('../src/config/plush-profile.json', import.meta.url),
    'utf8',
  ),
)
const curve = new CatmullRomCurve3(
  profile.controlPoints.map(
    ([radius, height, depth]) => new Vector3(radius, height, depth),
  ),
)
const contour = Array.from(
  { length: profile.fallbackSegments + 1 },
  (_, index) => {
    const point = curve.getPoint(index / profile.fallbackSegments)
    return [point.x, point.y]
  },
)
await writeFile(
  new URL('../src/game2d/plush-contour.json', import.meta.url),
  JSON.stringify(contour, null, 2) + '\n',
)
console.log(`Generated ${contour.length} plush contour samples`)
