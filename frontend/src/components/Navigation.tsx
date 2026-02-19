'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, Brain, TrendingUp, LineChart, Filter, Home, Globe } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'

export default function Navigation() {
  const pathname = usePathname()
  const { language, setLanguage, t } = useLanguage()
  
  const navItems = [
    { href: '/', label: t.nav.home, icon: Home },
    { href: '/crypto-radar', label: t.nav.cryptoRadar, icon: Activity },
    { href: '/ai-training', label: t.nav.aiTraining, icon: Brain },
    { href: '/ai-predictions', label: t.nav.aiPredictions, icon: TrendingUp },
    { href: '/pattern-detection', label: t.nav.patterns, icon: LineChart },
    { href: '/market-screener', label: t.nav.screener, icon: Filter },
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
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              )
            })}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-card/30 rounded-lg p-1">
              <button 
                onClick={() => setLanguage('zh')}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  language === 'zh' 
                    ? 'bg-primary text-white shadow-neon-cyan' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                中文
              </button>
              <button 
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  language === 'en' 
                    ? 'bg-primary text-white shadow-neon-cyan' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                EN
              </button>
            </div>
            <Globe className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>
    </nav>
  )
}
