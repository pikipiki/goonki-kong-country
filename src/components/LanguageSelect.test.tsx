import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import i18n from '../i18n'
import { defineStorySmokeTests } from '../test/storySmokeTest'
import { renderWithI18n } from '../test/renderWithI18n'
import * as stories from './LanguageSelect.stories'
import { LanguageSelect } from './LanguageSelect'
defineStorySmokeTests('LanguageSelect', stories, ['Default'])
describe('LanguageSelect interactions', () => {
  it('switches document language when French is selected', async () => {
    const user = userEvent.setup()
    await i18n.changeLanguage('en')
    renderWithI18n(<LanguageSelect />)
    await user.selectOptions(
      screen.getByRole('combobox', { name: /language/i }),
      'fr',
    )
    expect(document.documentElement.lang).toBe('fr')
    await i18n.changeLanguage('en')
  })
})
