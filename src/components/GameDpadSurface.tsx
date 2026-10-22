import { cssPx } from '../utils/cssUnits'

export function GameDpadSurface({
  stick,
}: {
  stick: {
    x: number
    y: number
  }
}) {
  return (
    <>
      <span className="dpad-ring" />
      <span
        className="stick"
        style={{
          transform: `translate(${cssPx(stick.x)},${cssPx(stick.y)})`,
        }}
        aria-hidden="true"
      />
    </>
  )
}
