function viteBaseRoot(): string {
  const raw: unknown = import.meta.env.BASE_URL
  if (typeof raw !== 'string') {
    return '/'
  }
  // S2259 ignores the typeof narrow above.
  // eslint-disable-next-line sonarjs/null-dereference
  if (raw.length === 0) {
    return '/'
  }
  return raw.endsWith('/') ? raw : `${raw}/`
}

/** Join Vite `BASE_URL` with a site-relative asset path (no leading slash required). */
export function resolveViteAssetPath(relativePath: string): string {
  // S2259 treats a typed string parameter as possibly null.
  // eslint-disable-next-line sonarjs/null-dereference
  const leaf = relativePath.replace(/^\/*/, '')
  return `${viteBaseRoot()}${leaf}`
}
