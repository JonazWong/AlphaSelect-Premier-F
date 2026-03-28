'use client'

import Link from 'next/link'
import { Activity, TrendingUp, Brain, LineChart, ChevronRight, Zap, AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import '@/i18n/config'

export default function Home() {
  const { t } = useTranslation('common')

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent rounded-3xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            {t('home.badge')}
          </div>
          <h1 className="text-6xl font-bold mb-6">
            <span className="text-gradient-cyan-purple">{t('home.title')}</span>
          </h1>
          <p className="text-2xl text-gray-300 mb-4">
            {t('home.subtitle')}
          </p>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-12">
            {t('home.description')}
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/crypto-radar" className="btn-primary flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {t('home.startTrading')}
            </Link>
            <Link
              href="/ai-training"
              className="px-6 py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white transition-all flex items-center gap-2"
            >
              <Brain className="w-5 h-5" />
              {t('home.aiTrainingCenter')}
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/crypto-radar">
          <div className="glass-card neon-glow p-6 cursor-pointer hover:scale-105 transition-transform">
            <div className="flex items-center gap-4 mb-4">
              <Activity className="w-10 h-10 text-primary" />
              <h3 className="text-xl font-bold">{t('home.features.contractRadar.title')}</h3>
            </div>
            <p className="text-gray-400">
              {t('home.features.contractRadar.desc')}
            </p>
            <div className="mt-4 flex items-center gap-1 text-primary text-sm font-medium">
              {t('home.explore')} <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </Link>

        <Link href="/ai-training">
          <div className="glass-card neon-glow p-6 cursor-pointer hover:scale-105 transition-transform">
            <div className="flex items-center gap-4 mb-4">
              <Brain className="w-10 h-10 text-secondary" />
              <h3 className="text-xl font-bold">{t('home.features.aiTraining.title')}</h3>
            </div>
            <p className="text-gray-400">
              {t('home.features.aiTraining.desc')}
            </p>
            <div className="mt-4 flex items-center gap-1 text-secondary text-sm font-medium">
              {t('home.explore')} <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </Link>

        <Link href="/ai-predictions">
          <div className="glass-card neon-glow p-6 cursor-pointer hover:scale-105 transition-transform">
            <div className="flex items-center gap-4 mb-4">
              <TrendingUp className="w-10 h-10 text-accent" />
              <h3 className="text-xl font-bold">{t('home.features.aiPredictions.title')}</h3>
            </div>
            <p className="text-gray-400">
              {t('home.features.aiPredictions.desc')}
            </p>
            <div className="mt-4 flex items-center gap-1 text-accent text-sm font-medium">
              {t('home.explore')} <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </Link>

        <Link href="/pattern-detection">
          <div className="glass-card neon-glow p-6 cursor-pointer hover:scale-105 transition-transform">
            <div className="flex items-center gap-4 mb-4">
              <LineChart className="w-10 h-10 text-primary" />
              <h3 className="text-xl font-bold">{t('home.features.patternDetection.title')}</h3>
            </div>
            <p className="text-gray-400">
              {t('home.features.patternDetection.desc')}
            </p>
            <div className="mt-4 flex items-center gap-1 text-primary text-sm font-medium">
              {t('home.explore')} <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </Link>

        <Link href="/extreme-reversal">
          <div className="glass-card neon-glow p-6 cursor-pointer hover:scale-105 transition-transform">
            <div className="flex items-center gap-4 mb-4">
              <AlertTriangle className="w-10 h-10 text-orange-400" />
              <h3 className="text-xl font-bold">{t('home.features.reversalMonitor.title')}</h3>
            </div>
            <p className="text-gray-400">
              {t('home.features.reversalMonitor.desc')}
            </p>
            <div className="mt-4 flex items-center gap-1 text-orange-400 text-sm font-medium">
              {t('home.explore')} <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </Link>
      </section>

      {/* Stats Section */}
      <section className="glass-card p-8">
        <h2 className="text-3xl font-bold mb-8 text-center">
          <span className="text-gradient-cyan-purple">{t('home.stats.title')}</span>
        </h2>
        
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-5xl font-bold text-primary mb-2">6</div>
            <div className="text-gray-400">{t('home.stats.aiModels')}</div>
            <div className="text-sm text-gray-500 mt-2">
              {t('home.stats.aiModelsDesc')}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-5xl font-bold text-secondary mb-2">20+</div>
            <div className="text-gray-400">{t('home.stats.indicators')}</div>
            <div className="text-sm text-gray-500 mt-2">
              {t('home.stats.indicatorsDesc')}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-5xl font-bold text-accent mb-2">Real-time</div>
            <div className="text-gray-400">{t('home.stats.marketData')}</div>
            <div className="text-sm text-gray-500 mt-2">
              {t('home.stats.marketDataDesc')}
            </div>
          </div>

          <div className="text-center">
            <div className="text-5xl font-bold text-primary mb-2">24/7</div>
            <div className="text-gray-400">{t('home.stats.monitoring')}</div>
            <div className="text-sm text-gray-500 mt-2">
              {t('home.stats.monitoringDesc')}
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section>
        <h2 className="text-3xl font-bold mb-8 text-center">
          <span className="text-gradient-cyan-purple">{t('home.techStack.title')}</span>
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4 text-primary">{t('home.techStack.backend')}</h3>
            <ul className="space-y-2 text-gray-400">
              <li>• FastAPI (Python 3.11)</li>
              <li>• PostgreSQL 16 + TimescaleDB</li>
              <li>• Redis 7</li>
              <li>• Celery + WebSocket</li>
            </ul>
          </div>
          
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4 text-secondary">{t('home.techStack.frontend')}</h3>
            <ul className="space-y-2 text-gray-400">
              <li>• Next.js 15.2.9 (App Router)</li>
              <li>• TypeScript</li>
              <li>• Tailwind CSS</li>
              <li>• TradingView Charts</li>
            </ul>
          </div>
          
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4 text-accent">{t('home.techStack.aiml')}</h3>
            <ul className="space-y-2 text-gray-400">
              <li>• TensorFlow 2.x (LSTM)</li>
              <li>• XGBoost</li>
              <li>• scikit-learn</li>
              <li>• statsmodels (ARIMA)</li>
            </ul>
          </div>
          
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4 text-primary">{t('home.techStack.infrastructure')}</h3>
            <ul className="space-y-2 text-gray-400">
              <li>• Docker + Docker Compose</li>
              <li>• DigitalOcean App Platform</li>
              <li>• Managed PostgreSQL & Redis</li>
              <li>• S3-compatible Storage</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
