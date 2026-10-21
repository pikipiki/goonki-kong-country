const LANG_STORAGE = "goonk-country-lang";

export type AppLanguage = "en" | "fr";

export function readStoredLanguage(): AppLanguage {
  try {
    const stored = localStorage.getItem(LANG_STORAGE);
    if (stored === "en" || stored === "fr") return stored;
  } catch {
    /* private mode / blocked storage */
  }
  return "en";
}

export function storeLanguage(lng: AppLanguage): void {
  try {
    localStorage.setItem(LANG_STORAGE, lng);
  } catch {
    /* ignore */
  }
}

export function normalizeLanguage(lng: string | undefined): AppLanguage {
  return lng?.startsWith("fr") ? "fr" : "en";
}
