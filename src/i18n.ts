import i18next from "i18next";
import { initReactI18next } from "react-i18next";
void i18next.use(initReactI18next).init({
  lng: "fr",
  fallbackLng: "fr",
  resources: {
    fr: {
      translation: {
        play: "Commencer l’aventure",
        continue: "Continuer l’aventure",
        resume: "Reprendre",
        map: "Explorer l’île",
        pause: "Pause",
        next: "La suite de l’aventure",
        retry: "Réessayer",
        home: "Accueil",
      },
    },
  },
  interpolation: { escapeValue: false },
});
export default i18next;
