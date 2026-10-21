import { useTranslation } from "react-i18next";
import {
  normalizeLanguage,
  storeLanguage,
  type AppLanguage,
} from "../i18n/language";

export function LanguageSelect() {
  const { i18n, t } = useTranslation();
  const value = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);

  return (
    <label className="lang-select">
      <span className="visually-hidden">{t("languageLabel")}</span>
      <select
        className="lang-select-input"
        aria-label={t("languageLabel")}
        value={value}
        onChange={(event) => {
          const lng = event.target.value as AppLanguage;
          storeLanguage(lng);
          void i18n.changeLanguage(lng);
        }}
      >
        <option value="en">{t("languageEn")}</option>
        <option value="fr">{t("languageFr")}</option>
      </select>
    </label>
  );
}
