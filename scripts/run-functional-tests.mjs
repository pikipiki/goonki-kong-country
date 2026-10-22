import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const port = Number(process.env.FUNCTIONAL_PORT || 5174)
const gameUrl = process.env.GAME_URL || `http://127.0.0.1:${port}/`
const scripts = [
  'test:browser',
  'test:mobile',
  'test:buddies',
  'test:map',
  'test:original',
  'test:stages',
  'test:decor',
  'test:mechanics',
  'test:ground',
  'test:playthrough:canyon',
  'test:playthrough:coral',
]

async function prepareServer() {
  try {
    const response = await fetch(gameUrl, { signal: AbortSignal.timeout(5000) })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    console.log(`Using existing game server: ${gameUrl}`)
    return undefined
  } catch (error) {
    if (process.env.GAME_URL) {
      throw new Error(`GAME_URL is unreachable: ${gameUrl}`, { cause: error })
    }
  }
  const { createServer } = await import('vite')
  const server = await createServer({
    root,
    server: { host: '127.0.0.1', port, strictPort: true, open: false },
  })
  try {
    await server.listen()
  } catch (error) {
    await server.close()
    throw error
  }
  console.log(`Started game server: ${gameUrl}`)
  return server
}

function runNpmScript(name) {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', name], {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, GAME_URL: gameUrl },
    })
    child.on('error', reject)
    child.on('exit', (code, signal) => {
      if (code === 0) resolve()
      else reject(new Error(`${name} failed (${signal || `exit ${code}`})`))
    })
  })
}

let ownedServer
try {
  const selected = process.argv.slice(2)
  for (const name of selected) {
    if (!scripts.includes(name))
      throw new Error(`Unknown functional script: ${name}`)
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('FUNCTIONAL_PORT must be an integer between 1 and 65535')
  }
  ownedServer = await prepareServer()
  for (const name of selected.length ? selected : scripts) {
    console.log(`\n=== ${name} ===\n`)
    await runNpmScript(name)
  }
  console.log('\nAll selected functional browser scripts passed.\n')
} catch (error) {
  console.error(error)
  process.exitCode = 1
} finally {
  await ownedServer?.close()
}
