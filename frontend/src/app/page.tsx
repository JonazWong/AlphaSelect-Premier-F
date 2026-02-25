'use client'

import Link from 'next/link'
import { Activity, TrendingUp, Brain, LineChart, ChevronRight, Zap, Globe, Lock, LayoutDashboard } from 'lucide-react'

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent rounded-3xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            AI-Powered Trading Intelligence
          </div>
          <h1 className="text-6xl font-bold mb-6">
            <span className="text-gradient-cyan-purple">AlphaSelect Premier F</span>
          </h1>
          <p className="text-2xl text-gray-300 mb-4">
            AI-Driven MEXC Contract Trading Analysis Platform
          </p>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-12">
            Integrate deep learning prediction models and professional technical analysis
            for MEXC perpetual contract trading pairs
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/crypto-radar" className="btn-primary flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Start Trading Radar
            </Link>
            <Link href="/dashboard" className="btn-secondary flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5" />
              Member Dashboard
            </Link>
            <Link
              href="/ai-training"
              className="px-6 py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white transition-all flex items-center gap-2"
            >
              <Brain className="w-5 h-5" />
              AI Training Center
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
              <h3 className="text-xl font-bold">Contract Radar</h3>
            </div>
            <p className="text-gray-400">
              Real-time trading signals with AI-powered long/short analysis
            </p>
            <div className="mt-4 flex items-center gap-1 text-primary text-sm font-medium">
              Explore <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </Link>

        <Link href="/ai-training">
          <div className="glass-card neon-glow p-6 cursor-pointer hover:scale-105 transition-transform">
            <div className="flex items-center gap-4 mb-4">
              <Brain className="w-10 h-10 text-secondary" />
              <h3 className="text-xl font-bold">AI Training</h3>
            </div>
            <p className="text-gray-400">
              Train LSTM, XGBoost, and ensemble models for price prediction
            </p>
            <div className="mt-4 flex items-center gap-1 text-secondary text-sm font-medium">
              Explore <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </Link>

        <Link href="/ai-predictions">
          <div className="glass-card neon-glow p-6 cursor-pointer hover:scale-105 transition-transform">
            <div className="flex items-center gap-4 mb-4">
              <TrendingUp className="w-10 h-10 text-accent" />
              <h3 className="text-xl font-bold">AI Predictions</h3>
            </div>
            <p className="text-gray-400">
              View price forecasts from trained AI models with confidence scores
            </p>
            <div className="mt-4 flex items-center gap-1 text-accent text-sm font-medium">
              Explore <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </Link>

        <Link href="/pattern-detection">
          <div className="glass-card neon-glow p-6 cursor-pointer hover:scale-105 transition-transform">
            <div className="flex items-center gap-4 mb-4">
              <LineChart className="w-10 h-10 text-primary" />
              <h3 className="text-xl font-bold">Pattern Detection</h3>
            </div>
            <p className="text-gray-400">
              Identify chart patterns and technical analysis signals
            </p>
            <div className="mt-4 flex items-center gap-1 text-primary text-sm font-medium">
              Explore <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </Link>
      </section>

      {/* New Modules Section */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-center">
          Platform <span className="text-gradient-cyan-purple">Modules</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Link href="/dashboard">
            <div className="glass-card p-6 cursor-pointer hover:scale-105 transition-transform border border-purple-500/20 hover:border-purple-500/40">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <LayoutDashboard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Member Dashboard</h3>
                  <span className="text-xs text-purple-400 font-medium">會員儀表板</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Personalized trading overview, portfolio summary, and performance metrics.
              </p>
            </div>
          </Link>

          <Link href="/crawler-config">
            <div className="glass-card p-6 cursor-pointer hover:scale-105 transition-transform border border-cyan-500/20 hover:border-cyan-500/40">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Crawler Config</h3>
                  <span className="text-xs text-cyan-400 font-medium">爬蟲配置</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Configure data crawler settings, schedules, and target sources.
              </p>
            </div>
          </Link>

          <Link href="/blacklist">
            <div className="glass-card p-6 cursor-pointer hover:scale-105 transition-transform border border-red-500/20 hover:border-red-500/40">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Blacklist</h3>
                  <span className="text-xs text-red-400 font-medium">黑名單管理</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Manage symbol and address blacklists to filter unwanted data.
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="glass-card p-8">
        <h2 className="text-3xl font-bold mb-8 text-center">
          Platform <span className="text-gradient-cyan-purple">Statistics</span>
        </h2>
        
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-5xl font-bold text-primary mb-2">6</div>
            <div className="text-gray-400">AI Models</div>
            <div className="text-sm text-gray-500 mt-2">
              LSTM, XGBoost, Random Forest, ARIMA, Linear Regression, Ensemble
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-5xl font-bold text-secondary mb-2">20+</div>
            <div className="text-gray-400">Technical Indicators</div>
            <div className="text-sm text-gray-500 mt-2">
              RSI, MACD, Bollinger Bands, EMA, SMA, and more
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-5xl font-bold text-accent mb-2">Real-time</div>
            <div className="text-gray-400">Market Data</div>
            <div className="text-sm text-gray-500 mt-2">
              Live prices, funding rates, and open interest
            </div>
          </div>

          <div className="text-center">
            <div className="text-5xl font-bold text-primary mb-2">24/7</div>
            <div className="text-gray-400">Monitoring</div>
            <div className="text-sm text-gray-500 mt-2">
              Continuous data crawling and signal generation
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section>
        <h2 className="text-3xl font-bold mb-8 text-center">
          Technology <span className="text-gradient-cyan-purple">Stack</span>
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4 text-primary">Backend</h3>
            <ul className="space-y-2 text-gray-400">
              <li>• FastAPI (Python 3.11)</li>
              <li>• PostgreSQL 16 + TimescaleDB</li>
              <li>• Redis 7</li>
              <li>• Celery + WebSocket</li>
            </ul>
          </div>
          
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4 text-secondary">Frontend</h3>
            <ul className="space-y-2 text-gray-400">
              <li>• Next.js 15.2.9 (App Router)</li>
              <li>• TypeScript</li>
              <li>• Tailwind CSS</li>
              <li>• TradingView Charts</li>
            </ul>
          </div>
          
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4 text-accent">AI/ML</h3>
            <ul className="space-y-2 text-gray-400">
              <li>• TensorFlow 2.x (LSTM)</li>
              <li>• XGBoost</li>
              <li>• scikit-learn</li>
              <li>• statsmodels (ARIMA)</li>
            </ul>
          </div>
          
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4 text-primary">Infrastructure</h3>
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
