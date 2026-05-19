import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en'
import ru from './locales/ru'
import kk from './locales/kk'
import zh from './locales/zh'

function getSavedLanguage() {
  try {
    return window.localStorage.getItem('dn-lang') || 'ru'
  } catch {
    return 'ru'
  }
}

i18n.use(initReactI18next).init({
  resources: { en, ru, kk, zh },
  lng: getSavedLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
