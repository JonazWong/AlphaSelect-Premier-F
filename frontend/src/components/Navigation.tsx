'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Activity, Brain, TrendingUp, LineChart, Filter, Home } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/components/I18nProvider'
import '@/i18n/config'

export default function Navigation() {
  const pathname = usePathname()
  const { t } = useTranslation('common')
  const { language, toggleLanguage } = useLanguage()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  
  const navItems = [
    { href: '/', labelKey: 'nav.home', icon: Home },
    { href: '/crypto-radar', labelKey: 'nav.cryptoRadar', icon: Activity },
    { href: '/ai-training', labelKey: 'nav.aiTraining', icon: Brain },
    { href: '/ai-predictions', labelKey: 'nav.aiPredictions', icon: TrendingUp },
    { href: '/pattern-detection', labelKey: 'nav.patternDetection', icon: LineChart },
    { href: '/market-screener', labelKey: 'nav.marketScreener', icon: Filter },
  ]
  
  return (
    <nav className="glass-card mx-4 mt-4 mb-8">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Activity className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold text-gradient-cyan-purple">
                AlphaSelect Premier F
              </span>
            </div>
          </Link>
          
          <div className="hidden md:flex gap-6">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link key={item.href} href={item.href}>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-primary/20 text-primary shadow-neon-cyan' 
                      : 'hover:bg-card/50 text-gray-400 hover:text-white'
                  }`}>
                    <Icon className="w-5 h-5" />
                    <span className="font-medium" suppressHydrationWarning>
                      {mounted ? t(item.labelKey) : item.labelKey.split('.')[1]}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              aria-label={language === 'en' ? t('nav.switchToChinese') : t('nav.switchToEnglish')}
              className="px-3 py-1 rounded-lg text-sm font-medium text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
              suppressHydrationWarning
            >
              {mounted ? (language === 'en' ? 'EN' : '中文') : 'EN'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
