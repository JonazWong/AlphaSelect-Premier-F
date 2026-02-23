'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
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

export default function I18nProvider({ children }: { children: ReactNode }) {
  // Always start with 'en' to match SSR output, then sync from localStorage after hydration
  const [language, setLanguage] = useState<string>('en')

  useEffect(() => {
    const stored = window.localStorage.getItem('language')
    if (stored === 'en' || stored === 'zh') {
      setLanguage(stored)
      i18n.changeLanguage(stored)
    }
  }, [])

  const toggleLanguage = () => {
    const next = language === 'en' ? 'zh' : 'en'
    setLanguage(next)
    i18n.changeLanguage(next)
    window.localStorage.setItem('language', next)
  }

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}
