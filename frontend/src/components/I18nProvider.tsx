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
  const [language, setLanguage] = useState('en')

  const toggleLanguage = () => {
    const next = language === 'en' ? 'zh' : 'en'
    setLanguage(next)
    i18n.changeLanguage(next)
  }

  useEffect(() => {
    i18n.changeLanguage(language)
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}
