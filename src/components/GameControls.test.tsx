import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { defineStorySmokeTests } from '../test/storySmokeTest'
import { renderWithI18n } from '../test/renderWithI18n'
import { GameControlsFixture } from '../test/gameControlsFixture'
import * as stories from './GameControls.stories'
defineStorySmokeTests('GameControls', stories, [
  'JungleTouch',
  'LagoonSwim',
  'BossDeck',
])
describe('GameControls interactions', () => {
  it('toggles click mode from the toolbar', async () => {
    const user = userEvent.setup()
    renderWithI18n(<GameControlsFixture levelId={0} />)
    const modeButton = screen.getByRole('button', { name: /click|touch/i })
    const before = modeButton.getAttribute('aria-pressed')
    await user.click(modeButton)
    expect(modeButton.getAttribute('aria-pressed')).not.toBe(before)
    expect(screen.getByRole('button', { name: /jump/i })).toBeInTheDocument()
  })
})
