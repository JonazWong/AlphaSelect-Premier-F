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
  // Allow additional backend-provided fields without breaking the UI
  [key: string]: unknown
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
    body: JSON.stringify({ symbols }),
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

  useEffect(() => {
  if (symbols.length === 0) return
  let isCancelled = false
  setLoading(true)
  setError(null)
  const controller = new AbortController(); // Add this line
  fetchPredictions(symbols, controller.signal)
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
    controller.abort(); // Optionally abort on cleanup
  }
}, [symbols])

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
            {predictions.map((pred) => (
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

                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold">{pred.symbol}</h3>
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border mt-1 ${RATING_COLORS[pred.rating]}`}>
                      {pred.direction === 'bullish' ? <TrendingUp className="w-3 h-3" /> : pred.direction === 'bearish' ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                      {t(`aiPredictions.${pred.rating}`)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold font-mono text-primary">
                      ${pred.currentPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-gray-500">{t('aiPredictions.currentPrice')}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3 p-3 rounded-lg bg-black/20 border border-gray-700/30">
                  <div>
                    <div className="text-xs text-gray-500">{t('aiPredictions.targetPrice')}</div>
                    <div className="font-mono font-bold text-sm text-white">
                      ${pred.targetPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{pred.upsidePct >= 0 ? t('aiPredictions.upside') : t('aiPredictions.downside')}</div>
                    <div className={`font-bold text-sm ${pred.upsidePct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {pred.upsidePct >= 0 ? '+' : ''}{pred.upsidePct}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{t('aiPredictions.modelAccuracy')}</div>
                    <div className="font-bold text-sm text-cyan-400">{pred.modelAccuracy}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{t('aiPredictions.forecastPeriod')}</div>
                    <div className="font-bold text-sm text-gray-300">{pred.forecastPeriod}</div>
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

