/** Angular frequency for the hurt-invincibility sprite blink (matches SNES cadence). */
export const HURT_FLASH_ANGULAR_RATE = 32

export function hurtFlashVisible(time: number) {
  return Math.sin(time * HURT_FLASH_ANGULAR_RATE) > -0.25
}
