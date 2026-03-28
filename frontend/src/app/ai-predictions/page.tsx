'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Brain, TrendingUp, TrendingDown, Minus, AlertCircle, Loader2 } from 'lucide-react'
import '@/i18n/config'
import TimeframeSelector, { Timeframe } from '@/components/TimeframeSelector'
import SymbolSelector from '@/components/SymbolSelector'
import ComparisonSelector from '@/components/ComparisonSelector'
import IndicatorChart, { SparklineChart } from '@/components/IndicatorChart'
import { generateMockOHLCV } from '@/lib/mockData'

const DEFAULT_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT']

export type PredictionRating = 'strongBuy' | 'buy' | 'hold' | 'sell' | 'strongSell'

export interface PredictionResult {
  symbol: string
  rating: PredictionRating
  confidence: number
  priceTarget?: number
  timeframe?: string
  predicted_value?: number
  model_type?: string
  timestamp?: string
  // Computed fields from backend data
  currentPrice?: number
  targetPrice?: number
  upsidePct?: number
  direction?: 'bullish' | 'bearish' | 'neutral'
  modelAccuracy?: number
  forecastPeriod?: string
}

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const RATING_COLORS: Record<PredictionResult['rating'], string> = {
  strongBuy: 'text-green-400 bg-green-500/10 border-green-500/30',
  buy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  hold: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  sell: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  strongSell: 'text-red-400 bg-red-500/10 border-red-500/10',
}

async function fetchPredictions(
  symbols: string[],
  useEnsemble: boolean,
  horizon: number,
  signal?: AbortSignal
): Promise<PredictionResult[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.length > 0
      ? process.env.NEXT_PUBLIC_API_URL
      : 'http://localhost:8000'

  const response = await fetch(`${baseUrl}/api/v1/ai/predictions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ symbols, use_ensemble: useEnsemble, horizon }),
    signal,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `Failed to fetch predictions: ${response.status}`)
  }

  const data = (await response.json()) as PredictionResult[]
  return data
}

export default function AIPredictionsPage() {
  const { t } = useTranslation('common')
  const [timeframe, setTimeframe] = useState<Timeframe>('1M')
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS)
  const [comparison, setComparison] = useState<string[]>([])
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(DEFAULT_SYMBOLS[0])
  const [predictions, setPredictions] = useState<PredictionResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // New filter/sort state
  const [useEnsemble, setUseEnsemble] = useState(false)
  const [horizon, setHorizon] = useState(1)
  const [ratingFilter, setRatingFilter] = useState<'All' | 'Buy' | 'Hold' | 'Sell'>('All')
  const [minConfidence, setMinConfidence] = useState(0)
  const [sortMode, setSortMode] = useState('confidence_desc')

  useEffect(() => {
    if (symbols.length === 0) return
    const controller = new AbortController()
    let isCancelled = false
    setLoading(true)
    setError(null)
    fetchPredictions(symbols, useEnsemble, horizon, controller.signal)
      .then((data) => {
        if (!isCancelled) setPredictions(data)
      })
      .catch((err: Error) => {
        if (!isCancelled) setError(err.message)
      })
      .finally(() => {
        if (!isCancelled) setLoading(false)
      })
    return () => {
      isCancelled = true
      controller.abort()
    }
  }, [symbols, useEnsemble, horizon])

  const filteredPredictions = useMemo(
    () =>
      predictions
        .filter((p) => {
          if (ratingFilter === 'Buy') return ['strongBuy', 'buy'].includes(p.rating)
          if (ratingFilter === 'Sell') return ['strongSell', 'sell'].includes(p.rating)
          if (ratingFilter === 'Hold') return p.rating === 'hold'
          return true
        })
        .filter((p) => (p.confidence ?? 0) >= minConfidence)
        .sort((a, b) => {
          if (sortMode === 'confidence_desc') return (b.confidence ?? 0) - (a.confidence ?? 0)
          if (sortMode === 'upside_desc') return Math.abs(b.upsidePct ?? 0) - Math.abs(a.upsidePct ?? 0)
          return (b.modelAccuracy ?? 0) - (a.modelAccuracy ?? 0)
        }),
    [predictions, ratingFilter, minConfidence, sortMode]
  )

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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Brain className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-1">
              <span className="text-gradient-cyan-purple">{t('aiPredictions.title')}</span>
              <span className="ml-3 text-2xl text-gray-500 font-normal">{t('aiPredictions.subtitle')}</span>
            </h1>
            <p className="text-gray-400 text-sm">
              {t('aiPredictions.description')} &nbsp;/&nbsp; {t('aiPredictions.descriptionZh')}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="glass-card p-4 space-y-4">
        <TimeframeSelector value={timeframe} onChange={setTimeframe} />
        <div className="grid sm:grid-cols-2 gap-4">
          <SymbolSelector
            multi
            value={symbols}
            onChange={setSymbols}
            label={t('trade.symbols')}
          />
          <ComparisonSelector items={comparison} onChange={setComparison} />
        </div>
        {symbols.length === 0 && (
          <p className="text-xs text-yellow-400" role="alert">{t('trade.validation.symbolRequired')}</p>
        )}
      </div>

      {/* Advanced controls */}
      <div className="bg-card rounded-xl p-4 border border-gray-700/50 mb-6 space-y-3">
        {/* Row 1: Ensemble toggle + Horizon */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Ensemble toggle */}
          <div className="flex rounded-lg overflow-hidden border border-gray-700 shrink-0">
            <button
              onClick={() => setUseEnsemble(false)}
              className={`px-3 py-1.5 text-sm transition-all ${
                !useEnsemble
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-neon-cyan'
                  : 'bg-card text-gray-400 hover:text-white'
              }`}
            >
              {t('aiPredictions.singleModel', { defaultValue: 'Single Model' })}
            </button>
            <button
              onClick={() => setUseEnsemble(true)}
              className={`px-3 py-1.5 text-sm transition-all ${
                useEnsemble
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-neon-cyan'
                  : 'bg-card text-gray-400 hover:text-white'
              }`}
            >
              {t('aiPredictions.ensemble', { defaultValue: 'Ensemble' })}
            </button>
          </div>

          {/* Horizon pills */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 shrink-0">
              {t('aiPredictions.horizon', { defaultValue: 'Forecast Horizon' })}:
            </span>
            <div className="flex gap-1">
              {([{ label: '1h', value: 1 }, { label: '4h', value: 4 }, { label: '1d', value: 24 }, { label: '3d', value: 72 }] as const).map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setHorizon(value)}
                  className={`px-3 py-1 rounded-full text-xs transition-all border ${
                    horizon === value
                      ? 'bg-primary/20 text-primary border-primary/50'
                      : 'bg-black/20 text-gray-400 border-gray-700 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Rating filter + Sort */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Rating filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 shrink-0">
              {t('aiPredictions.ratingFilter', { defaultValue: 'Rating:' })}
            </span>
            <div className="flex gap-1">
              {(['All', 'Buy', 'Hold', 'Sell'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRatingFilter(r)}
                  className={`px-3 py-1 rounded-full text-xs transition-all border ${
                    ratingFilter === r
                      ? r === 'Buy'
                        ? 'bg-green-500/20 text-green-400 border-green-500/50'
                        : r === 'Hold'
                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                        : r === 'Sell'
                        ? 'bg-red-500/20 text-red-400 border-red-500/50'
                        : 'bg-primary/20 text-primary border-primary/50'
                      : 'bg-black/20 text-gray-400 border-gray-700 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-gray-500 shrink-0">
              {t('aiPredictions.sortBy', { defaultValue: 'Sort:' })}
            </span>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
              className="bg-black/30 border border-gray-700 text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary/50"
            >
              <option value="confidence_desc">Confidence ↓</option>
              <option value="upside_desc">Upside % ↓</option>
              <option value="accuracy_desc">Accuracy ↓</option>
            </select>
          </div>
        </div>

        {/* Row 3: Confidence threshold */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 shrink-0">
            {t('aiPredictions.minConfidence', { defaultValue: 'Min Confidence' })}: {minConfidence}%
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={minConfidence}
            onChange={(e) => setMinConfidence(Number(e.target.value))}
            className="flex-1 accent-cyan-400 max-w-xs"
            aria-label="Minimum confidence threshold"
          />
        </div>
      </div>

      {symbols.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">{t('aiPredictions.selectSymbolsHint')}</p>
        </div>
      ) : loading ? (
        <div className="glass-card p-12 text-center">
          <Loader2 className="w-10 h-10 mx-auto mb-4 text-cyan-400 animate-spin" />
          <p className="text-gray-400">{t('common.loading')}</p>
        </div>
      ) : error ? (
        <div className="glass-card p-8 text-center border-red-500/30">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-400" />
          <p className="text-red-400 font-medium mb-1">{t('common.error')}</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      ) : predictions.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">{t('aiPredictions.noData', { defaultValue: 'No prediction data available. Please train an AI model first.' })}</p>
        </div>
      ) : (
        <>
          {/* Chart panel */}
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

          {/* Prediction cards */}
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredPredictions.length === 0 ? (
              <div className="col-span-full glass-card p-12 text-center">
                <Brain className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">{t('aiPredictions.noData', { defaultValue: 'No predictions match the current filters.' })}</p>
              </div>
            ) : filteredPredictions.map((pred) => (
              <div
                key={pred.symbol}
                className={`glass-card p-5 bg-gradient-to-br ${
                  pred.direction === 'bullish'
                    ? 'from-green-500/5 to-transparent border-green-500/20'
                    : pred.direction === 'bearish'
                    ? 'from-red-500/5 to-transparent border-red-500/20'
                    : 'from-gray-500/5 to-transparent border-gray-500/20'
                } cursor-pointer hover:border-opacity-60 transition-all`}
                onClick={() => setSelectedSymbol(pred.symbol)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedSymbol(pred.symbol)}
                aria-label={`${pred.symbol} prediction`}
              >
                {/* Sparkline */}
                <div className="h-10 mb-3">
                  <SparklineChart
                    data={generateMockOHLCV(pred.symbol, 30)}
                    color={pred.direction === 'bullish' ? '#22c55e' : pred.direction === 'bearish' ? '#ef4444' : '#6b7280'}
                  />
                </div>

                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold">{pred.symbol}</h3>
                      {/* Model type badge */}
                      {pred.model_type && (
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          {pred.model_type}
                        </span>
                      )}
                    </div>
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${RATING_COLORS[pred.rating]}`}>
                      {pred.direction === 'bullish' ? <TrendingUp className="w-3 h-3" /> : pred.direction === 'bearish' ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                      {t(`aiPredictions.${pred.rating}`)}
                    </div>
                    {/* Direction badge */}
                    {pred.direction && (
                      <span className={`ml-1.5 text-xs px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                        pred.direction === 'bullish'
                          ? 'bg-green-500/10 text-green-400 border-green-500/30'
                          : pred.direction === 'bearish'
                          ? 'bg-red-500/10 text-red-400 border-red-500/30'
                          : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                      }`}>
                        {pred.direction === 'bullish' ? <TrendingUp className="w-3 h-3" /> : pred.direction === 'bearish' ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                        {pred.direction.charAt(0).toUpperCase() + pred.direction.slice(1)}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold font-mono text-primary">
                      ${(pred.currentPrice ?? 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-gray-500">{t('aiPredictions.currentPrice')}</div>
                    {pred.timestamp && (
                      <div className="text-xs text-gray-600 mt-0.5">{relativeTime(pred.timestamp)}</div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3 p-3 rounded-lg bg-black/20 border border-gray-700/30">
                  <div>
                    <div className="text-xs text-gray-500">{t('aiPredictions.targetPrice')}</div>
                    <div className="font-mono font-bold text-sm text-white">
                      ${(pred.targetPrice ?? 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{(pred.upsidePct ?? 0) >= 0 ? t('aiPredictions.upside') : t('aiPredictions.downside')}</div>
                    <div className={`font-bold text-sm ${(pred.upsidePct ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {(pred.upsidePct ?? 0) >= 0 ? '+' : ''}{pred.upsidePct ?? 0}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{t('aiPredictions.modelAccuracy')}</div>
                    <div className="font-bold text-sm text-cyan-400">{pred.modelAccuracy ?? 0}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{t('aiPredictions.forecastPeriod')}</div>
                    <div className="font-bold text-sm text-gray-300">{pred.forecastPeriod ?? '-'}</div>
                  </div>
                </div>

                {/* Confidence bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">{t('common.confidence')}</span>
                    <span className="text-primary font-bold">{pred.confidence}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-800 overflow-hidden" role="progressbar" aria-valuenow={pred.confidence} aria-valuemin={0} aria-valuemax={100}>
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all"
                      style={{ width: `${pred.confidence}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

