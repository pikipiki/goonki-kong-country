import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { readStoredLanguage, normalizeLanguage } from "./i18n/language";
import { en, fr } from "./i18n/resources";

void i18next.use(initReactI18next).init({
  lng: readStoredLanguage(),
  fallbackLng: "en",
  resources: {
    en: { translation: en },
    fr: { translation: fr },
  },
  interpolation: { escapeValue: false },
});

function syncDocumentLanguage(lng: string) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = normalizeLanguage(lng);
  }
}

syncDocumentLanguage(i18next.language);
i18next.on("languageChanged", syncDocumentLanguage);

export function tr(
  key: string,
  options?: Record<string, string | number>,
): string {
  return i18next.t(key, options);
}

export default i18next;
