import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { StorybookConfig } from '@storybook/react-vite'
import { mergeConfig } from 'vite'
const dirname = path.dirname(fileURLToPath(import.meta.url))
const srcRoot = path.resolve(dirname, '../src')
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
  ],
  framework: '@storybook/react-vite',
  viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: {
          '@game3d': path.resolve(srcRoot, 'game3d'),
        },
      },
    })
  },
}
export default config
