import type { JungleRenderContext } from './jungleRenderContext'
import { renderJungleDecorScene2d } from './renderJungleDecorScene2d'
import { renderJungleSkyScene2d } from './renderJungleSkyScene2d'

export type { JungleRenderContext } from './jungleRenderContext'

export function renderJungleBackdropScene2d(render: JungleRenderContext) {
  renderJungleSkyScene2d(render)
  renderJungleDecorScene2d(render)
}
