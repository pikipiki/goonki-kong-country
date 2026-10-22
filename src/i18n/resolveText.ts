import { tr } from '../i18n'
/** Resolve user-facing copy stored as an i18n key in level/enemy/decor data. */
export function resolveI18nKey(
  key: string,
  options?: Record<string, string | number>,
): string {
  return tr(key, options)
}
