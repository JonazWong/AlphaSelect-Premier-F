'use client'

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import zh from './locales/zh.json'

// Use a module-level flag so the initialization survives HMR without
// re-running the .init() call (which would throw in development mode).
let initialized = false

function ensureI18n() {
  if (initialized) return
  initialized = true
  i18n.use(initReactI18next).init({
    resources: {
      en: { common: en },
      zh: { common: zh },
    },
    lng: 'en',
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
  })
}

ensureI18n()

export default i18n
