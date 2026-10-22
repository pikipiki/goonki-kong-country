import type { Preview } from '@storybook/react-vite'
import { withI18n } from './decorators'
const preview: Preview = {
  decorators: [withI18n],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
  },
}
export default preview
