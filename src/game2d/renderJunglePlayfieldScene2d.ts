import type { JungleRenderContext } from './jungleRenderContext'
import { renderJungleCombatantsScene2d } from './renderJungleCombatantsScene2d'
import { renderJunglePickupsBarrelsScene2d } from './renderJunglePickupsBarrelsScene2d'
import { renderJungleWeatherScene2d } from './renderJungleWeatherScene2d'

export type { JungleRenderContext } from './jungleRenderContext'

export function renderJunglePlayfieldScene2d(render: JungleRenderContext) {
  renderJunglePickupsBarrelsScene2d(render)
  renderJungleCombatantsScene2d(render)
  renderJungleWeatherScene2d(render)
}
