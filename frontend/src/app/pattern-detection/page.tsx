'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LineChart, TrendingUp, TrendingDown, CheckCircle, Clock, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import '@/i18n/config'
import TimeframeSelector, { Timeframe } from '@/components/TimeframeSelector'
import SymbolSelector from '@/components/SymbolSelector'
import ComparisonSelector from '@/components/ComparisonSelector'
import IndicatorChart from '@/components/IndicatorChart'
import { SparklineChart } from '@/components/IndicatorChart'
import { PatternResult, generateMockOHLCV } from '@/lib/mockData'

async function fetchPatterns(symbols: string[]): Promise<PatternResult[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.length > 0
      ? process.env.NEXT_PUBLIC_API_URL
      : 'http://localhost:8000'

  const params = new URLSearchParams()
  if (symbols && symbols.length > 0) {
    params.set('symbols', symbols.join(','))
  }

  const url = `${baseUrl}/api/v1/patterns/scan${params.toString() ? `?${params}` : ''}`

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch patterns: ${response.status}`)
  }

  const data = await response.json()
  return data.patterns || []
}

const DEFAULT_SYMBOLS = ['BTCUSDT', 'ETHUSDT']

const RELIABILITY_COLORS: Record<PatternResult['reliability'], string> = {
  high: 'text-green-400 bg-green-500/10 border-green-500/30',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  low: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
}

const STATUS_ICONS: Record<PatternResult['status'], React.ReactNode> = {
  detected: <CheckCircle className="w-4 h-4 text-green-400" />,
  pending: <Clock className="w-4 h-4 text-yellow-400" />,
  failed: <XCircle className="w-4 h-4 text-red-400" />,
}

export default function PatternDetectionPage() {
  const { t } = useTranslation('common')
  const [timeframe, setTimeframe] = useState<Timeframe>('1W')
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS)
  const [comparison, setComparison] = useState<string[]>([])
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(DEFAULT_SYMBOLS[0])
  const [patterns, setPatterns] = useState<PatternResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [patternTypeFilter, setPatternTypeFilter] = useState('')
  const [reliabilityFilter, setReliabilityFilter] = useState<'All' | 'high' | 'medium' | 'low'>('All')
  const [directionFilter, setDirectionFilter] = useState<'All' | 'bullish' | 'bearish'>('All')
  const [statusFilter, setStatusFilter] = useState<'All' | 'detected' | 'pending'>('All')
  const [sortMode, setSortMode] = useState('completion_desc')

  useEffect(() => {
    if (symbols.length === 0) return
    let isCancelled = false
    setLoading(true)
    setError(null)
    fetchPatterns(symbols)
      .then((data) => {
        if (!isCancelled) setPatterns(data)
      })
      .catch((err: Error) => {
        if (!isCancelled) setError(err.message)
      })
      .finally(() => {
        if (!isCancelled) setLoading(false)
      })
    return () => {
      isCancelled = true
    }
  }, [symbols])

  const reliabilityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 }

  const filteredPatterns = patterns
    .filter((p) => {
      const name = p.pattern.toLowerCase()
      if (patternTypeFilter === 'double') return name.includes('double')
      if (patternTypeFilter === 'headshoulders') return name.includes('head') || name.includes('shoulder')
      if (patternTypeFilter === 'triangle') return name.includes('triangle')
      if (patternTypeFilter === 'flag') return name.includes('flag')
      if (patternTypeFilter === 'other')
        return !name.includes('double') && !name.includes('head') && !name.includes('shoulder') && !name.includes('triangle') && !name.includes('flag')
      return true
    })
    .filter((p) => reliabilityFilter === 'All' || p.reliability === reliabilityFilter)
    .filter((p) => directionFilter === 'All' || p.direction === directionFilter)
    .filter((p) => statusFilter === 'All' || p.status === statusFilter)
    .sort((a, b) => {
      if (sortMode === 'completion_desc') return (b.completion ?? 0) - (a.completion ?? 0)
      if (sortMode === 'reliability') return (reliabilityOrder[b.reliability] ?? 0) - (reliabilityOrder[a.reliability] ?? 0)
      return a.symbol.localeCompare(b.symbol)
    })

  const chartData = useMemo(
    () =>
      selectedSymbol
        ? generateMockOHLCV(
            selectedSymbol,
            timeframe === '1D' ? 1 : timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : 90
          )
        : [],
    [selectedSymbol, timeframe]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <LineChart className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-1">
              <span className="text-gradient-cyan-purple">{t('patternDetection.title')}</span>
              <span className="ml-3 text-2xl text-gray-500 font-normal">{t('patternDetection.subtitle')}</span>
            </h1>
            <p className="text-gray-400 text-sm">
              {t('patternDetection.description')} &nbsp;/&nbsp; {t('patternDetection.descriptionZh')}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="glass-card p-4 space-y-4">
        <TimeframeSelector value={timeframe} onChange={setTimeframe} />
        <div className="grid sm:grid-cols-2 gap-4">
          <SymbolSelector multi value={symbols} onChange={setSymbols} label={t('trade.symbols')} />
          <ComparisonSelector items={comparison} onChange={setComparison} />
        </div>
        {symbols.length === 0 && (
          <p className="text-xs text-yellow-400" role="alert">{t('trade.validation.symbolRequired')}</p>
        )}
      </div>

      {/* Filter bar */}
      <div className="bg-card rounded-xl p-4 border border-gray-700/50 mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Pattern type dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 whitespace-nowrap">{t('patternDetection.filterByType', { defaultValue: 'Pattern Type:' })}</span>
            <select
              value={patternTypeFilter}
              onChange={(e) => setPatternTypeFilter(e.target.value)}
              className="bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-primary focus:outline-none"
            >
              <option value="">{t('patternDetection.allPatterns', { defaultValue: 'All Patterns' })}</option>
              <option value="double">Double Top / Bottom</option>
              <option value="headshoulders">Head &amp; Shoulders</option>
              <option value="triangle">Triangle</option>
              <option value="flag">Flag</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Reliability pills */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400 whitespace-nowrap mr-1">{t('patternDetection.reliabilityFilter', { defaultValue: 'Reliability:' })}</span>
            {(['All', 'high', 'medium', 'low'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setReliabilityFilter(v)}
                className={reliabilityFilter === v
                  ? 'px-3 py-1 rounded-lg text-xs font-bold border bg-primary/20 text-primary border-primary/50 cursor-pointer'
                  : 'px-3 py-1 rounded-lg text-xs font-bold border bg-black/20 text-gray-400 border-gray-700 cursor-pointer'}
              >
                {v === 'All' ? 'All' : t(`common.levels.${v}`)}
              </button>
            ))}
          </div>

          {/* Direction pills */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400 whitespace-nowrap mr-1">{t('patternDetection.directionFilter', { defaultValue: 'Direction:' })}</span>
            {(['All', 'bullish', 'bearish'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setDirectionFilter(v)}
                className={directionFilter === v
                  ? 'px-3 py-1 rounded-lg text-xs font-bold border bg-primary/20 text-primary border-primary/50 cursor-pointer'
                  : 'px-3 py-1 rounded-lg text-xs font-bold border bg-black/20 text-gray-400 border-gray-700 cursor-pointer'}
              >
                {v === 'All' ? 'All' : v === 'bullish' ? t('patternDetection.bullish', { defaultValue: 'Bullish' }) : t('patternDetection.bearish', { defaultValue: 'Bearish' })}
              </button>
            ))}
          </div>

          {/* Status pills */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400 whitespace-nowrap mr-1">{t('patternDetection.statusFilter', { defaultValue: 'Status:' })}</span>
            {(['All', 'detected', 'pending'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setStatusFilter(v)}
                className={statusFilter === v
                  ? 'px-3 py-1 rounded-lg text-xs font-bold border bg-primary/20 text-primary border-primary/50 cursor-pointer'
                  : 'px-3 py-1 rounded-lg text-xs font-bold border bg-black/20 text-gray-400 border-gray-700 cursor-pointer'}
              >
                {v === 'All' ? 'All' : v === 'detected' ? t('patternDetection.detected') : t('patternDetection.pending')}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-gray-400 whitespace-nowrap">{t('patternDetection.sortBy', { defaultValue: 'Sort:' })}</span>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
              className="bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-primary focus:outline-none"
            >
              <option value="completion_desc">Completion ↓</option>
              <option value="reliability">Reliability</option>
              <option value="symbol_az">Symbol A→Z</option>
            </select>
          </div>
        </div>
      </div>

      {symbols.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <LineChart className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">{t('patternDetection.selectSymbolsHint')}</p>
        </div>
      ) : loading ? (
        <div className="glass-card p-12 text-center">
          <Loader2 className="w-10 h-10 mx-auto mb-4 text-purple-400 animate-spin" />
          <p className="text-gray-400">{t('common.loading')}</p>
        </div>
      ) : error ? (
        <div className="glass-card p-8 text-center border-red-500/30">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-400" />
          <p className="text-red-400 font-medium mb-1">{t('common.error')}</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      ) : (
        <div className="grid xl:grid-cols-3 gap-6">
          {/* Chart panel (left 2 columns) */}
          <div className="xl:col-span-2 space-y-4">
            <div className="glass-card p-5">
              <div className="flex flex-wrap gap-2 mb-4">
                {symbols.map((sym) => (
                  <button
                    key={sym}
                    onClick={() => setSelectedSymbol(sym)}
                    aria-pressed={selectedSymbol === sym}
                    className={`px-3 py-1 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                      selectedSymbol === sym
                        ? 'bg-primary/20 text-primary border border-primary/50'
                        : 'bg-card text-gray-400 border border-gray-700 hover:text-white'
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
              {selectedSymbol && <IndicatorChart data={chartData} symbol={selectedSymbol} />}
            </div>
          </div>

          {/* Pattern list (right column) */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {patterns.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <p className="text-gray-500 text-sm">{t('patternDetection.noPatterns')}</p>
              </div>
            ) : filteredPatterns.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <p className="text-gray-500 text-sm">{t('patternDetection.noMatchFilters', { defaultValue: 'No patterns match the selected filters' })}</p>
              </div>
            ) : (
              filteredPatterns.map((pat, idx) => (
                <div
                  key={idx}
                  className={`glass-card p-4 bg-gradient-to-r ${
                    pat.direction === 'bullish' ? 'from-green-500/5' : 'from-red-500/5'
                  } to-transparent border-l-2 ${pat.direction === 'bullish' ? 'border-l-green-500' : 'border-l-red-500'} cursor-pointer hover:bg-card/60 transition-all`}
                  onClick={() => setSelectedSymbol(pat.symbol)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedSymbol(pat.symbol)}
                  aria-label={`${pat.symbol} ${pat.pattern}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {pat.direction === 'bullish' ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      )}
                      <span className="font-bold text-sm">{pat.symbol}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {STATUS_ICONS[pat.status]}
                      <span className="text-xs text-gray-400">{t(`patternDetection.${pat.status}`)}</span>
                    </div>
                  </div>

                  {/* Mini sparkline */}
                  <div className="h-8 mb-2">
                    <SparklineChart
                      data={generateMockOHLCV(pat.symbol, 14)}
                      color={pat.direction === 'bullish' ? '#22c55e' : '#ef4444'}
                    />
                  </div>

                  <div className="text-xs font-semibold text-gray-200 mb-2">
                    {t(`patternDetection.${pat.pattern}`)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">{t('patternDetection.completion')}: </span>
                      <span className="font-mono text-gray-200">{pat.completion}%</span>
                    </div>
                    <div>
                      <span className={`px-1.5 py-0.5 rounded border text-xs font-medium ${RELIABILITY_COLORS[pat.reliability]}`}>
                        {t(`patternDetection.reliability`)}: {t(`common.levels.${pat.reliability}`)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('patternDetection.breakoutLevel')}: </span>
                      <span className="font-mono text-cyan-400">${pat.breakoutLevel.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('patternDetection.priceTarget')}: </span>
                      <span className={`font-mono font-bold ${pat.direction === 'bullish' ? 'text-green-400' : 'text-red-400'}`}>
                        ${pat.targetPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Completion bar */}
                  <div className="mt-2 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pat.direction === 'bullish' ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${pat.completion}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
