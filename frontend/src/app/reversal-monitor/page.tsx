'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle, Loader2, Activity } from 'lucide-react'
import '@/i18n/config'
import SymbolSelector from '@/components/SymbolSelector'

export type ReversalSignal = {
  id: string
  symbol: string
  direction: 'bullish' | 'bearish'
  urgency: 'critical' | 'high' | 'medium' | 'low'
  timestamp?: string
  signalType?: 'bounce' | 'pullback'
  description?: string
  rsi?: number
  bbPosition?: number
  bbUpper?: number
  bbLower?: number
  currentPrice?: number
  targetPrice?: number
  confidence?: number
  macdHistogram?: number
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.length > 0
    ? process.env.NEXT_PUBLIC_API_URL
    : 'http://localhost:8000'

async function fetchReversalSignals(symbols?: string[]): Promise<ReversalSignal[]> {
  const params = new URLSearchParams()

  if (symbols && symbols.length > 0) {
    params.set('symbols', symbols.join(','))
  }

  const query = params.toString()
  const url = `${API_BASE_URL}/api/v1/reversal/scan${query ? `?${query}` : ''}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch reversal signals (status ${response.status})`)
  }

  const data = await response.json()
  return (Array.isArray(data) ? data : (data.signals ?? [])) as ReversalSignal[]
}

const URGENCY_COLORS: Record<ReversalSignal['urgency'], string> = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/40',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/40',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/40',
  low: 'text-gray-400 bg-gray-500/10 border-gray-500/40',
}

export default function ReversalMonitorPage() {
  const { t } = useTranslation('common')
  const [symbols, setSymbols] = useState<string[]>([])
  const [signals, setSignals] = useState<ReversalSignal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [signalTypeFilter, setSignalTypeFilter] = useState<'All' | 'bounce' | 'pullback'>('All')
  const [urgencyFilter, setUrgencyFilter] = useState<'All' | 'critical' | 'high' | 'medium'>('All')
  const [directionFilter, setDirectionFilter] = useState<'All' | 'bullish' | 'bearish'>('All')
  const [minConfidence, setMinConfidence] = useState(0)
  const [sortMode, setSortMode] = useState('confidence_desc')

  const urgencyOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }

  const filteredSignals = signals
    .filter(s => signalTypeFilter === 'All' || s.signalType === signalTypeFilter)
    .filter(s => urgencyFilter === 'All' || s.urgency === urgencyFilter)
    .filter(s => directionFilter === 'All' || s.direction === directionFilter)
    .filter(s => (s.confidence ?? 0) >= minConfidence)
    .sort((a, b) => {
      if (sortMode === 'confidence_desc') return (b.confidence ?? 0) - (a.confidence ?? 0)
      if (sortMode === 'rsi_desc') return (b.rsi ?? 50) - (a.rsi ?? 50)
      if (sortMode === 'rsi_asc') return (a.rsi ?? 50) - (b.rsi ?? 50)
      return (urgencyOrder[b.urgency] ?? 0) - (urgencyOrder[a.urgency] ?? 0)
    })

  const loadSignals = useCallback((syms?: string[]) => {
    setLoading(true)
    setError(null)
    fetchReversalSignals(syms && syms.length > 0 ? syms : undefined)
      .then((data) => setSignals(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadSignals(symbols.length > 0 ? symbols : undefined)
  }, [symbols, loadSignals])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Activity className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-1">
              <span className="text-gradient-cyan-purple">{t('reversalMonitor.title', { defaultValue: 'Reversal Monitor' })}</span>
              <span className="ml-3 text-2xl text-gray-500 font-normal">{t('reversalMonitor.subtitle', { defaultValue: '反轉監控' })}</span>
            </h1>
            <p className="text-gray-400 text-sm">
              {t('reversalMonitor.description', { defaultValue: 'Real-time reversal signal detection using RSI, MACD, and Bollinger Bands' })}
            </p>
          </div>
        </div>
        <button
          onClick={() => loadSignals(symbols.length > 0 ? symbols : undefined)}
          aria-label={t('common.refresh')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </button>
      </div>

      {/* Controls */}
      <div className="glass-card p-4">
        <SymbolSelector
          multi
          value={symbols}
          onChange={setSymbols}
          label={t('reversalMonitor.filterSymbols', { defaultValue: 'Filter by Symbols (leave empty for all)' })}
        />
      </div>

      {/* Filter bar */}
      <div className="bg-card rounded-xl p-4 border border-gray-700/50 mb-6 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Signal type pills */}
          <span className="text-xs text-gray-500 font-medium">{t('reversalMonitor.signalTypeFilter', { defaultValue: 'Type:' })}</span>
          {(['All', 'bounce', 'pullback'] as const).map(v => (
            <button
              key={v}
              onClick={() => setSignalTypeFilter(v)}
              className={signalTypeFilter === v
                ? 'px-3 py-1 rounded-lg text-xs font-bold border bg-primary/20 text-primary border-primary/50 cursor-pointer transition-all'
                : 'px-3 py-1 rounded-lg text-xs font-bold border bg-black/20 text-gray-400 border-gray-700 cursor-pointer transition-all'}
            >
              {v === 'All' ? 'All' : v === 'bounce' ? 'Bounce ⬆' : 'Pullback ⬇'}
            </button>
          ))}

          <span className="text-xs text-gray-500 font-medium ml-2">{t('reversalMonitor.urgencyFilter', { defaultValue: 'Urgency:' })}</span>
          {(['All', 'critical', 'high', 'medium'] as const).map(v => (
            <button
              key={v}
              onClick={() => setUrgencyFilter(v)}
              className={urgencyFilter === v
                ? 'px-3 py-1 rounded-lg text-xs font-bold border bg-primary/20 text-primary border-primary/50 cursor-pointer transition-all'
                : 'px-3 py-1 rounded-lg text-xs font-bold border bg-black/20 text-gray-400 border-gray-700 cursor-pointer transition-all'}
            >
              {v === 'All' ? 'All' : v === 'critical' ? 'Critical 🔴' : v === 'high' ? 'High 🟠' : 'Medium 🟡'}
            </button>
          ))}

          <span className="text-xs text-gray-500 font-medium ml-2">{t('reversalMonitor.directionFilter', { defaultValue: 'Direction:' })}</span>
          {(['All', 'bullish', 'bearish'] as const).map(v => (
            <button
              key={v}
              onClick={() => setDirectionFilter(v)}
              className={directionFilter === v
                ? 'px-3 py-1 rounded-lg text-xs font-bold border bg-primary/20 text-primary border-primary/50 cursor-pointer transition-all'
                : 'px-3 py-1 rounded-lg text-xs font-bold border bg-black/20 text-gray-400 border-gray-700 cursor-pointer transition-all'}
            >
              {v === 'All' ? 'All' : v === 'bullish' ? 'Bullish ↑' : 'Bearish ↓'}
            </button>
          ))}

          {/* Sort dropdown */}
          <span className="text-xs text-gray-500 font-medium ml-2">{t('reversalMonitor.sortBy', { defaultValue: 'Sort:' })}</span>
          <select
            value={sortMode}
            onChange={e => setSortMode(e.target.value)}
            className="px-3 py-1 rounded-lg text-xs font-bold border bg-black/20 text-gray-300 border-gray-700 cursor-pointer transition-all focus:outline-none focus:border-primary/50"
          >
            <option value="confidence_desc">Confidence ↓</option>
            <option value="rsi_desc">RSI ↓</option>
            <option value="rsi_asc">RSI ↑</option>
            <option value="urgency">Urgency</option>
          </select>
        </div>

        {/* Confidence slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 font-medium">{t('reversalMonitor.minConfidence', { defaultValue: 'Min Confidence:' })}</span>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={minConfidence}
            onChange={e => setMinConfidence(Number(e.target.value))}
            className="w-40 accent-primary"
          />
          <span className="text-xs text-primary font-bold">Min: {minConfidence}%</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="glass-card p-4 border-red-500/30 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Stats bar */}
      {!loading && !error && signals.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(
            [
              { label: t('reversalMonitor.totalSignals', { defaultValue: 'Total Signals' }), value: signals.length, color: 'text-cyan-400' },
              { label: t('reversalMonitor.bullishSignals', { defaultValue: 'Bullish' }), value: signals.filter((s) => s.direction === 'bullish').length, color: 'text-green-400' },
              { label: t('reversalMonitor.bearishSignals', { defaultValue: 'Bearish' }), value: signals.filter((s) => s.direction === 'bearish').length, color: 'text-red-400' },
              { label: t('reversalMonitor.criticalSignals', { defaultValue: 'Critical' }), value: signals.filter((s) => s.urgency === 'critical').length, color: 'text-orange-400' },
            ] as const
          ).map((stat) => (
            <div key={stat.label} className="glass-card p-4 text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Signal cards */}
      {loading ? (
        <div className="glass-card p-12 text-center">
          <Loader2 className="w-10 h-10 mx-auto mb-4 text-orange-400 animate-spin" />
          <p className="text-gray-400">{t('common.loading')}</p>
        </div>
      ) : filteredSignals.length === 0 && !error ? (
        <div className="glass-card p-12 text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">
            {signals.length === 0
              ? t('reversalMonitor.noSignals', { defaultValue: 'No reversal signals detected. Collect more market data to enable analysis.' })
              : t('reversalMonitor.noMatchFilters', { defaultValue: 'No signals match the selected filters' })}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-4">
            {t('reversalMonitor.showing', { defaultValue: 'Showing {{count}} signals', count: filteredSignals.length })}
          </p>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredSignals.map((signal, idx) => {
              const rsiValue = signal.rsi ?? 0
              return (
              <div
                key={`${signal.symbol}-${idx}`}
                className={`glass-card p-5 bg-gradient-to-br ${
                  signal.direction === 'bullish'
                    ? 'from-green-500/5 to-transparent border-green-500/20'
                    : 'from-red-500/5 to-transparent border-red-500/20'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {signal.direction === 'bullish' ? (
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                    <span className="font-bold text-lg">{signal.symbol}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${URGENCY_COLORS[signal.urgency]}`}>
                    {t(`reversalMonitor.${signal.urgency}`, { defaultValue: signal.urgency })}
                  </span>
                </div>

                {/* Signal type badge */}
                <div className="mb-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    signal.signalType === 'bounce'
                      ? 'text-green-400 bg-green-500/10'
                      : 'text-red-400 bg-red-500/10'
                  }`}>
                    {t(`reversalMonitor.${signal.signalType}`, { defaultValue: signal.signalType === 'bounce' ? '⬆ Bounce' : '⬇ Pullback' })}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-400 mb-3">{signal.description}</p>

                {/* Metrics grid */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3 p-3 rounded-lg bg-black/20 border border-gray-700/30">
                  <div>
                    <span className="text-gray-500">RSI: </span>
                    <span className={`font-mono font-bold ${rsiValue < 35 ? 'text-green-400' : rsiValue > 65 ? 'text-red-400' : 'text-gray-300'}`}>
                      {rsiValue.toFixed(1)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">BB Pos: </span>
                    <span className="font-mono font-bold text-gray-300">{((signal.bbPosition ?? 0) * 100).toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('common.price')}: </span>
                    <span className="font-mono font-bold text-primary">${(signal.currentPrice ?? 0).toLocaleString('en-US', { maximumFractionDigits: 4 })}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('aiPredictions.targetPrice')}: </span>
                    <span className={`font-mono font-bold ${signal.direction === 'bullish' ? 'text-green-400' : 'text-red-400'}`}>
                      ${(signal.targetPrice ?? 0).toLocaleString('en-US', { maximumFractionDigits: 4 })}
                    </span>
                  </div>
                  {signal.macdHistogram !== undefined && (
                    <div className="col-span-2">
                      <span className="text-gray-500">{t('reversalMonitor.macd', { defaultValue: 'MACD' })}: </span>
                      <span className={`font-mono font-bold ${signal.macdHistogram >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {signal.macdHistogram > 0 ? '+' : ''}{signal.macdHistogram.toFixed(4)}
                        <span
                          className={`inline-block ml-1 h-2 rounded-sm align-middle ${signal.macdHistogram >= 0 ? 'bg-green-400' : 'bg-red-400'}`}
                          style={{ width: `${Math.min(Math.abs(signal.macdHistogram) * 200, 32)}px` }}
                        />
                      </span>
                    </div>
                  )}
                  {(signal.bbLower !== undefined || signal.bbUpper !== undefined) && (
                    <div className="col-span-2">
                      <span className="text-gray-500 text-xs">BB: </span>
                      <span className="font-mono text-xs text-gray-400">
                        {signal.bbLower !== undefined ? signal.bbLower.toLocaleString('en-US', { maximumFractionDigits: 4 }) : '—'}
                        {' – '}
                        {signal.bbUpper !== undefined ? signal.bbUpper.toLocaleString('en-US', { maximumFractionDigits: 4 }) : '—'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confidence bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">{t('common.confidence')}</span>
                    <span className="text-primary font-bold">{signal.confidence ?? 0}%</span>
                  </div>
                  <div
                    className="h-2 rounded-full bg-gray-800 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={signal.confidence ?? 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className={`h-full rounded-full transition-all ${
                        signal.direction === 'bullish'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                          : 'bg-gradient-to-r from-red-500 to-orange-400'
                      }`}
                      style={{ width: `${signal.confidence ?? 0}%` }}
                    />
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
