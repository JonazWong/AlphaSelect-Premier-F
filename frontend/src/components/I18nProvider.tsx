'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import '@/i18n/config'
import i18n from '@/i18n/config'

interface LanguageContextType {
  language: string
  toggleLanguage: () => void
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  toggleLanguage: () => {},
})

export function useLanguage() {
  return useContext(LanguageContext)
}

function getInitialLanguage(): string {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem('language')
    if (stored === 'en' || stored === 'zh') {
      // Sync i18n instance with the stored preference immediately
      i18n.changeLanguage(stored)
      return stored
    }
  }
  return 'en'
}

export default function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<string>(getInitialLanguage)

  const toggleLanguage = () => {
    const next = language === 'en' ? 'zh' : 'en'
    setLanguage(next)
    i18n.changeLanguage(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('language', next)
    }
  }

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}
