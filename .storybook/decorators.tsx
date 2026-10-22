import type { Decorator } from '@storybook/react-vite'
import { I18nextProvider } from 'react-i18next'
import i18n from '../src/i18n'
import '../src/style.css'
import '../src/mobile.css'
export const withI18n: Decorator = (Story) => (
  <I18nextProvider i18n={i18n}>
    <Story />
  </I18nextProvider>
)
