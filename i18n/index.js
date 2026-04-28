import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import es from './locales/es.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import pt from './locales/pt.json';
import de from './locales/de.json';
import it from './locales/it.json';

const LANG_STORAGE_KEY = 'app_language';
const SUPPORTED = ['es', 'en', 'fr', 'pt', 'de', 'it'];

export const LANGUAGES = [
  { code: 'es', label: 'Español',   flag: '🇪🇸' },
  { code: 'en', label: 'English',   flag: '🇬🇧' },
  { code: 'fr', label: 'Français',  flag: '🇫🇷' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'de', label: 'Deutsch',   flag: '🇩🇪' },
  { code: 'it', label: 'Italiano',  flag: '🇮🇹' },
];

/** Detect language: localStorage (web) / AsyncStorage → browser locale → 'es' */
async function detectLanguage() {
  // On web, prefer localStorage — it survives hard reloads reliably
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
      if (saved && SUPPORTED.includes(saved)) return saved;
    } catch {}
  }

  try {
    const saved = await AsyncStorage.getItem(LANG_STORAGE_KEY);
    if (saved && SUPPORTED.includes(saved)) return saved;
  } catch {}

  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    // navigator.languages es un array ordenado por preferencia (ej: ['fr-CH', 'fr', 'en'])
    const langs = navigator.languages?.length ? navigator.languages : [navigator.language || navigator.userLanguage || ''];
    for (const raw of langs) {
      const code = raw.split('-')[0].toLowerCase();
      if (SUPPORTED.includes(code)) return code;
    }
  }

  // Fallback: inglés como lengua franca universal
  return 'en';
}

/** Initialise i18n — call once at app startup, await before rendering */
export async function initI18n() {
  const lng = await detectLanguage();

  await i18n.use(initReactI18next).init({
    resources: {
      es: { translation: es },
      en: { translation: en },
      fr: { translation: fr },
      pt: { translation: pt },
      de: { translation: de },
      it: { translation: it },
    },
    lng,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    // avoid warnings for missing keys — fall back to key name
    saveMissing: false,
  });

  return i18n;
}

/** Change language, persist to storage, trigger re-render via i18next */
export async function changeLanguage(code) {
  if (!SUPPORTED.includes(code)) return;
  // Persist in both storages so web page reloads pick it up
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try { window.localStorage.setItem(LANG_STORAGE_KEY, code); } catch {}
  }
  try {
    await AsyncStorage.setItem(LANG_STORAGE_KEY, code);
  } catch {}
  await i18n.changeLanguage(code);
}

export default i18n;
