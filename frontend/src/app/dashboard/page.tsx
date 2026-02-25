'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard, TrendingUp, Activity, Brain,
  Bell, Settings, RefreshCw, ArrowUpRight, ArrowDownRight,
  Wallet, BarChart2, Clock, Star
} from 'lucide-react'
import '@/i18n/config'

const mockPortfolio = [
  { symbol: 'BTCUSDT', side: 'long', entry: 62400, current: 64850, pnl: 3.92, size: 0.5 },
  { symbol: 'ETHUSDT', side: 'long', entry: 3280, current: 3410, pnl: 3.96, size: 2.0 },
  { symbol: 'SOLUSDT', side: 'short', entry: 175, current: 168, pnl: 4.0, size: 10.0 },
  { symbol: 'BNBUSDT', side: 'long', entry: 590, current: 578, pnl: -2.03, size: 3.0 },
]

const mockSignals = [
  { symbol: 'BTCUSDT', side: 'long', confidence: 87, time: '2m ago' },
  { symbol: 'DOGEUSDT', side: 'short', confidence: 74, time: '8m ago' },
  { symbol: 'LINKUSDT', side: 'long', confidence: 81, time: '15m ago' },
]

const mockWatchlist = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'DOGEUSDT']

export default function DashboardPage() {
  const { t } = useTranslation('common')
  const [activeTab, setActiveTab] = useState<'overview' | 'positions' | 'signals' | 'watchlist'>('overview')

  const totalPnl = mockPortfolio.reduce((sum, p) => sum + p.pnl, 0)
  const winCount = mockPortfolio.filter((p) => p.pnl > 0).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <LayoutDashboard className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-1">
              <span className="text-gradient-cyan-purple">{t('dashboard.title')}</span>
              <span className="ml-3 text-2xl text-gray-500 font-normal">{t('dashboard.subtitle')}</span>
            </h1>
            <p className="text-gray-400 text-sm">{t('dashboard.description')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {}}
            aria-label={t('common.refresh')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            {t('common.refresh')}
          </button>
          <button className="p-2 rounded-lg bg-card border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-all">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg bg-card border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-all">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm">
            <Wallet className="w-4 h-4" />
            {t('dashboard.totalEquity')}
          </div>
          <div className="text-2xl font-bold text-white">$12,480.50</div>
          <div className="flex items-center gap-1 mt-1 text-green-400 text-xs font-medium">
            <ArrowUpRight className="w-3 h-3" />
            +5.24% {t('dashboard.today')}
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm">
            <TrendingUp className="w-4 h-4" />
            {t('dashboard.unrealizedPnl')}
          </div>
          <div className={`text-2xl font-bold ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">{mockPortfolio.length} {t('dashboard.openPositions')}</div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm">
            <BarChart2 className="w-4 h-4" />
            {t('dashboard.winRate')}
          </div>
          <div className="text-2xl font-bold text-primary">
            {((winCount / mockPortfolio.length) * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">{winCount}/{mockPortfolio.length} {t('dashboard.profitable')}</div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm">
            <Activity className="w-4 h-4" />
            {t('dashboard.activeSignals')}
          </div>
          <div className="text-2xl font-bold text-secondary">{mockSignals.length}</div>
          <div className="flex items-center gap-1 mt-1 text-cyan-400 text-xs font-medium">
            <Clock className="w-3 h-3" />
            {t('dashboard.lastUpdated')} 2m ago
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {(['overview', 'positions', 'signals', 'watchlist'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {t(`dashboard.tabs.${tab}`)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Positions */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              {t('dashboard.recentPositions')}
            </h3>
            <div className="space-y-3">
              {mockPortfolio.slice(0, 3).map((p) => (
                <div key={p.symbol} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
                  <div>
                    <span className="font-bold text-white text-sm">{p.symbol}</span>
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded font-medium ${
                      p.side === 'long' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>{p.side.toUpperCase()}</span>
                  </div>
                  <span className={`font-bold text-sm ${p.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {p.pnl >= 0 ? '+' : ''}{p.pnl.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Signals */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4 text-secondary" />
              {t('dashboard.latestSignals')}
            </h3>
            <div className="space-y-3">
              {mockSignals.map((s) => (
                <div key={s.symbol} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
                  <div>
                    <span className="font-bold text-white text-sm">{s.symbol}</span>
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded font-medium ${
                      s.side === 'long' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>{s.side.toUpperCase()}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-primary">{s.confidence}%</div>
                    <div className="text-xs text-gray-500">{s.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'positions' && (
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-700/50">
            <span className="text-sm text-gray-400">{mockPortfolio.length} {t('dashboard.openPositions')}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">{t('trade.symbol')}</th>
                  <th className="px-4 py-3 text-center text-xs text-gray-500 font-medium">{t('trade.side')}</th>
                  <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium">{t('dashboard.entryPrice')}</th>
                  <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium">{t('common.price')}</th>
                  <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium">PnL %</th>
                </tr>
              </thead>
              <tbody>
                {mockPortfolio.map((p) => (
                  <tr key={p.symbol} className="border-b border-gray-800/50 hover:bg-card/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-white">{p.symbol}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        p.side === 'long' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                      }`}>{p.side.toUpperCase()}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-300">${p.entry.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-white">${p.current.toLocaleString()}</td>
                    <td className={`px-4 py-3 text-right font-bold ${p.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      <span className="flex items-center justify-end gap-1">
                        {p.pnl >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {p.pnl >= 0 ? '+' : ''}{p.pnl.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'signals' && (
        <div className="space-y-3">
          {mockSignals.map((s) => (
            <div key={s.symbol} className="glass-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-8 rounded-full ${s.side === 'long' ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <div className="font-bold text-white">{s.symbol}</div>
                  <div className="text-xs text-gray-500">{s.time}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  s.side === 'long' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>{s.side.toUpperCase()}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-primary">{s.confidence}% {t('common.confidence')}</div>
                <div className="w-24 h-1.5 rounded-full bg-gray-800 mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                    style={{ width: `${s.confidence}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'watchlist' && (
        <div className="glass-card p-5">
          <h3 className="font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" />
            {t('dashboard.watchlist')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {mockWatchlist.map((sym) => (
              <div key={sym} className="p-3 rounded-lg border border-gray-700 hover:border-primary/40 transition-colors cursor-pointer text-center">
                <div className="font-bold text-white text-sm">{sym}</div>
                <div className="text-xs text-gray-500 mt-1">{t('trade.watchlist')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
