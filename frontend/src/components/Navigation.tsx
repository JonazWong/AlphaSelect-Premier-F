'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, Brain, TrendingUp, LineChart, Filter } from 'lucide-react'

export default function Navigation() {
  const pathname = usePathname()
  
  const navItems = [
    { href: '/', label: 'Home', icon: Activity },
    { href: '/crypto-radar', label: 'Crypto Radar', icon: Activity },
    { href: '/ai-training', label: 'AI Training', icon: Brain },
    { href: '/ai-predictions', label: 'AI Predictions', icon: TrendingUp },
    { href: '/pattern-detection', label: 'Patterns', icon: LineChart },
    { href: '/market-screener', label: 'Screener', icon: Filter },
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
            <button className="text-sm text-gray-400 hover:text-white transition-colors">
              EN
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
