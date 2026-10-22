import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

/** Each test owns its headless browser; the user's browser is never reused. */
export function launchGameBrowser() {
  const macChrome =
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  const configured = process.env.BROWSER_EXECUTABLE?.trim()
  const executablePath =
    configured ||
    (process.platform === 'darwin' && existsSync(macChrome)
      ? macChrome
      : undefined)
  return chromium.launch({ headless: true, executablePath })
}

/** Runtime evidence belongs outside versioned ROM facts and authored fixtures. */
export function browserOutputDirectory() {
  const directory = path.resolve(
    process.env.BROWSER_ARTIFACTS_DIR ||
      fileURLToPath(new URL('../../artifacts/browser/', import.meta.url)),
  )
  mkdirSync(directory, { recursive: true })
  return directory + path.sep
}
