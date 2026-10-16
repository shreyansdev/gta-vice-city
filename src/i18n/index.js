import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.js";
import es from "./locales/es.js";
import ptBR from "./locales/pt-BR.js";
import fr from "./locales/fr.js";
import de from "./locales/de.js";
import ru from "./locales/ru.js";
import hi from "./locales/hi.js";
import zhCN from "./locales/zh-CN.js";

// Order of the language picker. Labels are in their own language on purpose.
export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "pt-BR", label: "Português (Brasil)" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "ru", label: "Русский" },
  { code: "hi", label: "हिन्दी" },
  { code: "zh-CN", label: "简体中文" },
];

// Browsers report regional codes (es-MX, pt-PT, zh-TW…). Map them onto the
// languages we ship; anything else falls back to English.
function toSupported(code) {
  const lower = String(code || "").toLowerCase();
  if (lower.startsWith("pt")) return "pt-BR";
  if (lower.startsWith("zh")) return "zh-CN";
  return lower.split("-")[0];
}

i18next.use(LanguageDetector).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    "pt-BR": { translation: ptBR },
    fr: { translation: fr },
    de: { translation: de },
    ru: { translation: ru },
    hi: { translation: hi },
    "zh-CN": { translation: zhCN },
  },
  supportedLngs: LANGUAGES.map((l) => l.code),
  fallbackLng: "en",
  // Resources are bundled, so init can finish before the page renders.
  initAsync: false,
  // Strings are written with textContent; only the *-html keys use innerHTML,
  // and those never interpolate user input.
  interpolation: { escapeValue: false },
  detection: {
    // No querystring: game.js forwards location.search to the engine.
    order: ["localStorage", "navigator"],
    lookupLocalStorage: "vc-lang",
    caches: ["localStorage"],
    convertDetectedLanguage: toSupported,
  },
});

export const t = (key, options) => i18next.t(key, options);

export function currentLanguage() {
  return i18next.resolvedLanguage || "en";
}

// Sets a translated text and remembers the key, so a language switch can
// translate it again.
export function setText(el, key, options) {
  if (!el) return;
  el.dataset.i18n = key;
  if (options) el.dataset.i18nOptions = JSON.stringify(options);
  else delete el.dataset.i18nOptions;
  el.textContent = t(key, options);
}

// Sets text that is not translated (a file name, a percentage).
export function setRawText(el, text) {
  if (!el) return;
  delete el.dataset.i18n;
  delete el.dataset.i18nOptions;
  el.textContent = text;
}

export function applyTranslations(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const options = el.dataset.i18nOptions ? JSON.parse(el.dataset.i18nOptions) : undefined;
    el.textContent = t(el.dataset.i18n, options);
  });
  root.querySelectorAll("[data-i18n-html]").forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  root.querySelectorAll("[data-i18n-alt]").forEach((el) => {
    el.alt = t(el.dataset.i18nAlt);
  });
  root.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    el.setAttribute("aria-label", t(el.dataset.i18nAriaLabel));
  });
  document.documentElement.lang = currentLanguage();
  document.title = t("meta.title");
}

export function changeLanguage(code) {
  return i18next.changeLanguage(code);
}

// The legacy scripts in public/ are not modules; they reach i18n through
// these globals. They listen for "vc:languagechange" to redraw their lists.
i18next.on("languageChanged", () => {
  applyTranslations();
  window.dispatchEvent(new Event("vc:languagechange"));
});

window.t = t;
window.vcI18n = { t, setText, setRawText, currentLanguage };
