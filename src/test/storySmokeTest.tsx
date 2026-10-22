import { composeStories, type Meta } from '@storybook/react-vite'
import { cleanup } from '@testing-library/react'
import type { ComponentType } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { renderWithI18n } from './renderWithI18n'

type StoriesModule = {
  default: Meta<ComponentType>
} & Record<string, unknown>
export function defineStorySmokeTests(
  suiteName: string,
  storiesModule: StoriesModule,
  storyNames: readonly string[],
): void {
  const composed = composeStories(storiesModule)
  describe(suiteName, () => {
    afterEach(() => {
      cleanup()
    })
    for (const storyName of storyNames) {
      it(`renders story ${storyName}`, () => {
        const Story = composed[
          storyName as keyof typeof composed
        ] as ComponentType
        expect(Story).toBeDefined()
        renderWithI18n(<Story />)
      })
    }
  })
}
