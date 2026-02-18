'use client'

import Link from 'next/link'
import { Activity, TrendingUp, Brain, LineChart, Filter } from 'lucide-react'

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-20">
        <h1 className="text-6xl font-bold mb-6">
          <span className="text-gradient-cyan-purple">AlphaSelect Premier F</span>
        </h1>
        <p className="text-2xl text-gray-300 mb-8">
          AI-Driven MEXC Contract Trading Analysis Platform
        </p>
        <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-12">
          Integrate deep learning prediction models and professional technical analysis
          for MEXC perpetual contract trading pairs
        </p>
        
        <div className="flex gap-4 justify-center">
          <Link href="/crypto-radar">
            <button className="btn-primary">
              Start Trading Radar
            </button>
          </Link>
          <Link href="/ai-training">
            <button className="btn-secondary">
              AI Training Center
            </button>
          </Link>
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
          </div>
        </Link>
      </section>

      {/* Stats Section */}
      <section className="glass-card p-8">
        <h2 className="text-3xl font-bold mb-8 text-center">
          Platform <span className="text-gradient-cyan-purple">Features</span>
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
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
