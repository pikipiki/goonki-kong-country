import type { Meta, StoryObj } from '@storybook/react-vite'
import { GameControlsFixture } from '../test/gameControlsFixture'
const meta = {
  title: 'Components/GameControls',
  component: GameControlsFixture,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof GameControlsFixture>
export default meta
type Story = StoryObj<typeof meta>
export const JungleTouch: Story = {
  args: { levelId: 0 },
}

export const LagoonSwim: Story = {
  args: { levelId: 3 },
}

export const BossDeck: Story = {
  args: { levelId: 6 },
}
