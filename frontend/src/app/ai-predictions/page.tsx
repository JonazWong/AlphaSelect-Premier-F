'use client'

import { useState, useEffect, useMemo, KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Brain, TrendingUp, TrendingDown, Minus, AlertCircle, Loader2,
  Settings2, BarChart2, ListFilter, Plus, RefreshCw, X, Target,
} from 'lucide-react'
import '@/i18n/config'
import TimeframeSelector, { Timeframe } from '@/components/TimeframeSelector'
import SymbolSelector from '@/components/SymbolSelector'
import IndicatorChart, { SparklineChart } from '@/components/IndicatorChart'
import { generateMockOHLCV } from '@/lib/mockData'

const DEFAULT_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT']
const MODEL_TYPES = ['LSTM', 'XGBoost', 'RandomForest', 'ARIMA', 'LinearRegression'] as const
type ModelTypeName = typeof MODEL_TYPES[number]

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

const RATING_COLORS: Record<PredictionRating, string> = {
  strongBuy: 'text-green-400 bg-green-500/10 border-green-500/30',
  buy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  hold: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  sell: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  strongSell: 'text-red-400 bg-red-500/10 border-red-500/30',
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbols, use_ensemble: useEnsemble, horizon }),
    signal,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `Failed to fetch predictions: ${response.status}`)
  }

  return (await response.json()) as PredictionResult[]
}

// ── Section header sub-component ──────────────────────────────────────────
function SectionHeader({
  icon, title, subtitle, badge, count,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  badge?: string
  count?: number
}) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <h2 className="font-bold text-white text-sm uppercase tracking-wider">{title}</h2>
        {subtitle && <span className="text-xs text-gray-400 truncate">{subtitle}</span>}
        {badge && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-secondary border border-secondary/30 shrink-0">
            {badge}
          </span>
        )}
        {count !== undefined && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/30 shrink-0">
            {count}
          </span>
        )}
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function AIPredictionsPage() {
  const { t } = useTranslation('common')
  const [timeframe, setTimeframe] = useState<Timeframe>('1M')
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS)
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(DEFAULT_SYMBOLS[0])
  const [predictions, setPredictions] = useState<PredictionResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Configuration state
  const [useEnsemble, setUseEnsemble] = useState(false)
  const [horizon, setHorizon] = useState(1)
  const [modelTypeFilter, setModelTypeFilter] = useState<'All' | ModelTypeName>('All')
  const [customSymbolInput, setCustomSymbolInput] = useState('')

  // ── Filter / sort state
  const [ratingFilter, setRatingFilter] = useState<'All' | 'Buy' | 'Hold' | 'Sell'>('All')
  const [minConfidence, setMinConfidence] = useState(0)
  const [sortMode, setSortMode] = useState('confidence_desc')

  // Auto-fetch on config change
  useEffect(() => {
    if (symbols.length === 0) return
    const controller = new AbortController()
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchPredictions(symbols, useEnsemble, horizon, controller.signal)
      .then((data) => { if (!cancelled) setPredictions(data) })
      .catch((err: Error) => { if (!cancelled && err.name !== 'AbortError') setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true; controller.abort() }
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
        .filter((p) => modelTypeFilter === 'All' || p.model_type === modelTypeFilter)
        .sort((a, b) => {
          if (sortMode === 'upside_desc') return Math.abs(b.upsidePct ?? 0) - Math.abs(a.upsidePct ?? 0)
          if (sortMode === 'accuracy_desc') return (b.modelAccuracy ?? 0) - (a.modelAccuracy ?? 0)
          return (b.confidence ?? 0) - (a.confidence ?? 0)
        }),
    [predictions, ratingFilter, minConfidence, modelTypeFilter, sortMode]
  )

  const chartData = useMemo(
    () =>
      selectedSymbol
        ? generateMockOHLCV(selectedSymbol, timeframe === '1D' ? 1 : timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : 90)
        : [],
    [selectedSymbol, timeframe]
  )

  const selectedPred = useMemo(
    () => predictions.find((p) => p.symbol === selectedSymbol),
    [predictions, selectedSymbol]
  )

  const addCustomSymbol = () => {
    const sym = customSymbolInput.trim().toUpperCase().replace(/\s/g, '')
    if (sym && !symbols.includes(sym)) {
      setSymbols((prev) => [...prev, sym])
      setSelectedSymbol(sym)
    }
    setCustomSymbolInput('')
  }

  const handleCustomKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') addCustomSymbol()
  }

  const horizonOptions = [
    { label: '1h', value: 1 },
    { label: '4h', value: 4 },
    { label: '1d', value: 24 },
    { label: '3d', value: 72 },
  ] as const

  const handleRefresh = () => {
    if (symbols.length === 0) return
    setLoading(true)
    setError(null)
    fetchPredictions(symbols, useEnsemble, horizon)
      .then(setPredictions)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }

  return (
    <div className="space-y-6">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 shrink-0">
            <Brain className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-1">
              <span className="text-gradient-cyan-purple">{t('aiPredictions.title')}</span>
              <span className="ml-3 text-2xl text-gray-500 font-normal">{t('aiPredictions.subtitle')}</span>
            </h1>
            <p className="text-gray-400 text-sm">{t('aiPredictions.description')}</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading || symbols.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 text-primary rounded-lg hover:bg-primary/20 transition-all disabled:opacity-40 shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {t('common.refresh')}
        </button>
      </div>

      {/* ── SECTION A: Prediction Configuration ─────────────────────────── */}
      <section>
        <SectionHeader
          icon={<Settings2 className="w-4 h-4" />}
          title={t('aiPredictions.configSection', { defaultValue: 'Prediction Configuration' })}
          subtitle={t('aiPredictions.configDesc', { defaultValue: 'Select symbols, model type, and forecast parameters' })}
          badge="AI Config"
        />
        <div className="glass-card p-5 space-y-5">

          {/* Row 1: Symbols + custom free-type input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {t('trade.symbols', { defaultValue: 'Symbols' })}
            </label>
            <div className="flex flex-wrap gap-2 items-start">
              <div className="flex-1 min-w-[180px]">
                <SymbolSelector multi value={symbols} onChange={setSymbols} label="" />
              </div>
              {/* Custom symbol free-type input */}
              <div className="flex gap-1 items-center">
                <input
                  type="text"
                  value={customSymbolInput}
                  onChange={(e) => setCustomSymbolInput(e.target.value.toUpperCase())}
                  onKeyDown={handleCustomKeyDown}
                  placeholder={t('aiPredictions.customSymbolPlaceholder', { defaultValue: 'e.g. BNBUSDT' })}
                  maxLength={20}
                  className="w-36 bg-black/30 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 placeholder-gray-600 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 font-mono uppercase"
                  aria-label={t('aiPredictions.customSymbol', { defaultValue: 'Add custom symbol' })}
                />
                <button
                  onClick={addCustomSymbol}
                  disabled={!customSymbolInput.trim()}
                  className="flex items-center gap-1 px-3 py-2 bg-primary/15 border border-primary/40 text-primary text-sm rounded-lg hover:bg-primary/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t('aiPredictions.addSymbol', { defaultValue: 'Add' })}
                </button>
              </div>
            </div>
            {/* Active symbol chips */}
            {symbols.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {symbols.map((sym) => (
                  <div key={sym} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-card border border-gray-700 text-xs text-gray-300">
                    <span className="font-mono">{sym}</span>
                    <button
                      onClick={() => setSymbols(symbols.filter((s) => s !== sym))}
                      className="text-gray-600 hover:text-red-400 transition-colors ml-0.5"
                      aria-label={`Remove ${sym}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Row 2: Mode + Horizon */}
          <div className="flex flex-wrap items-start gap-6">
            {/* Single / Ensemble toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                {t('aiPredictions.predictionMode', { defaultValue: 'Mode' })}
              </label>
              <div className="flex rounded-lg overflow-hidden border border-gray-700">
                <button
                  onClick={() => setUseEnsemble(false)}
                  className={`px-4 py-2 text-sm transition-all ${
                    !useEnsemble
                      ? 'bg-gradient-to-r from-cyan-500/80 to-purple-500/80 text-white'
                      : 'bg-card text-gray-400 hover:text-white'
                  }`}
                >
                  {t('aiPredictions.singleModel', { defaultValue: 'Single Model' })}
                </button>
                <button
                  onClick={() => setUseEnsemble(true)}
                  className={`px-4 py-2 text-sm transition-all ${
                    useEnsemble
                      ? 'bg-gradient-to-r from-cyan-500/80 to-purple-500/80 text-white'
                      : 'bg-card text-gray-400 hover:text-white'
                  }`}
                >
                  ✦ {t('aiPredictions.ensemble', { defaultValue: 'Ensemble' })}
                </button>
              </div>
            </div>

            {/* Horizon pills */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                {t('aiPredictions.horizon', { defaultValue: 'Forecast Horizon' })}
              </label>
              <div className="flex gap-1">
                {horizonOptions.map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => setHorizon(value)}
                    className={`px-4 py-2 rounded-lg text-sm transition-all border font-mono ${
                      horizon === value
                        ? 'bg-primary/20 text-primary border-primary/50 shadow-sm shadow-primary/20'
                        : 'bg-black/20 text-gray-400 border-gray-700 hover:text-white hover:border-gray-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Model type selector (single model only) */}
          {!useEnsemble && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {t('aiPredictions.modelTypeSelect', { defaultValue: 'Model Type' })}
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setModelTypeFilter('All')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all border ${
                    modelTypeFilter === 'All'
                      ? 'bg-secondary/20 text-secondary border-secondary/50'
                      : 'bg-black/20 text-gray-400 border-gray-700 hover:text-white'
                  }`}
                >
                  {t('aiPredictions.allModels', { defaultValue: 'All Models' })}
                </button>
                {MODEL_TYPES.map((mt) => (
                  <button
                    key={mt}
                    onClick={() => setModelTypeFilter(mt)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all border font-mono ${
                      modelTypeFilter === mt
                        ? 'bg-secondary/20 text-secondary border-secondary/50'
                        : 'bg-black/20 text-gray-400 border-gray-700 hover:text-white'
                    }`}
                  >
                    {mt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {symbols.length === 0 && (
            <p className="text-xs text-yellow-400/80 flex items-center gap-1.5" role="alert">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {t('aiPredictions.symbolRequired', { defaultValue: 'Please add at least one symbol to run predictions.' })}
            </p>
          )}
        </div>
      </section>

      {/* ── Loading / Error inline states ───────────────────────────────── */}
      {loading && (
        <div className="glass-card p-8 text-center">
          <Loader2 className="w-10 h-10 mx-auto mb-4 text-cyan-400 animate-spin" />
          <p className="text-gray-400">{t('common.loading')}</p>
        </div>
      )}
      {!loading && error && (
        <div className="glass-card p-8 text-center border border-red-500/30">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-400" />
          <p className="text-red-400 font-medium mb-1">{t('common.error')}</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      )}

      {/* ── SECTION B: Chart + Selected Prediction Detail ───────────────── */}
      {!loading && !error && predictions.length > 0 && (
        <section>
          <SectionHeader
            icon={<BarChart2 className="w-4 h-4" />}
            title={t('aiPredictions.chartSection', { defaultValue: 'Price & Forecast Chart' })}
          />
          {/* 2-column on lg+: chart (2/3) + detail card (1/3) */}
          <div className="grid lg:grid-cols-3 gap-4">

            {/* Chart panel */}
            <div className="lg:col-span-2 glass-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex flex-wrap gap-1.5">
                  {symbols.map((sym) => (
                    <button
                      key={sym}
                      onClick={() => setSelectedSymbol(sym)}
                      aria-pressed={selectedSymbol === sym}
                      className={`px-3 py-1 rounded-lg text-sm transition-all font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                        selectedSymbol === sym
                          ? 'bg-primary/20 text-primary border border-primary/50'
                          : 'bg-card text-gray-400 border border-gray-700 hover:text-white'
                      }`}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
                <TimeframeSelector value={timeframe} onChange={setTimeframe} />
              </div>
              {selectedSymbol && <IndicatorChart data={chartData} symbol={selectedSymbol} />}
            </div>

            {/* Selected symbol detail card */}
            <div className="glass-card p-5 flex flex-col gap-4">
              {selectedPred ? (
                <>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-2xl font-bold font-mono">{selectedPred.symbol}</h3>
                      {selectedPred.model_type && (
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          {selectedPred.model_type}
                        </span>
                      )}
                    </div>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold border ${RATING_COLORS[selectedPred.rating]}`}>
                      {selectedPred.direction === 'bullish'
                        ? <TrendingUp className="w-4 h-4" />
                        : selectedPred.direction === 'bearish'
                        ? <TrendingDown className="w-4 h-4" />
                        : <Minus className="w-4 h-4" />}
                      {t(`aiPredictions.${selectedPred.rating}`)}
                    </div>
                  </div>

                  {/* Stats 2×2 grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: t('aiPredictions.currentPrice'), value: `$${(selectedPred.currentPrice ?? 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`, cls: 'text-white' },
                      { label: t('aiPredictions.targetPrice'), value: `$${(selectedPred.targetPrice ?? 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`, cls: 'text-primary' },
                      {
                        label: (selectedPred.upsidePct ?? 0) >= 0 ? t('aiPredictions.upside') : t('aiPredictions.downside'),
                        value: `${(selectedPred.upsidePct ?? 0) >= 0 ? '+' : ''}${selectedPred.upsidePct ?? 0}%`,
                        cls: (selectedPred.upsidePct ?? 0) >= 0 ? 'text-green-400' : 'text-red-400',
                      },
                      { label: t('aiPredictions.modelAccuracy'), value: `${selectedPred.modelAccuracy ?? 0}%`, cls: 'text-accent' },
                    ].map(({ label, value, cls }) => (
                      <div key={label} className="p-3 rounded-lg bg-black/30 border border-gray-700/40">
                        <div className="text-xs text-gray-500 mb-1">{label}</div>
                        <div className={`font-mono font-bold text-base ${cls}`}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Confidence bar */}
                  <div className="p-3 rounded-lg bg-black/30 border border-gray-700/40">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">{t('common.confidence')}</span>
                      <span className="text-primary font-bold">{selectedPred.confidence}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-gray-800 overflow-hidden" role="progressbar" aria-valuenow={selectedPred.confidence} aria-valuemin={0} aria-valuemax={100}>
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all"
                        style={{ width: `${selectedPred.confidence}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{t('aiPredictions.forecastPeriod')}: <span className="text-gray-300">{selectedPred.forecastPeriod ?? '-'}</span></span>
                    {selectedPred.timestamp && <span>{relativeTime(selectedPred.timestamp)}</span>}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <Target className="w-10 h-10 text-gray-600 mb-3" />
                  <p className="text-gray-500 text-sm">
                    {t('aiPredictions.selectSymbolHint', { defaultValue: 'Click a symbol above or a card below to see the detailed prediction.' })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION C: All Prediction Results ───────────────────────────── */}
      {!loading && !error && (
        <section>
          <SectionHeader
            icon={<ListFilter className="w-4 h-4" />}
            title={t('aiPredictions.resultsSection', { defaultValue: 'All Predictions' })}
            count={filteredPredictions.length}
          />

          {predictions.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Brain className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">
                {t('aiPredictions.noData', { defaultValue: 'No prediction data available. Please train an AI model first.' })}
              </p>
            </div>
          ) : (
            <>
              {/* Filter bar */}
              <div className="glass-card p-4 mb-4 flex flex-wrap items-center gap-4">
                {/* Rating filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 shrink-0">{t('aiPredictions.ratingFilter', { defaultValue: 'Rating:' })}</span>
                  <div className="flex gap-1">
                    {(['All', 'Buy', 'Hold', 'Sell'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setRatingFilter(r)}
                        className={`px-3 py-1 rounded-full text-xs transition-all border ${
                          ratingFilter === r
                            ? r === 'Buy' ? 'bg-green-500/20 text-green-400 border-green-500/50'
                              : r === 'Hold' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                              : r === 'Sell' ? 'bg-red-500/20 text-red-400 border-red-500/50'
                              : 'bg-primary/20 text-primary border-primary/50'
                            : 'bg-black/20 text-gray-400 border-gray-700 hover:text-white'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort + min confidence */}
                <div className="flex items-center gap-3 ml-auto flex-wrap">
                  <span className="text-xs text-gray-500">
                    {t('aiPredictions.minConfidence', { defaultValue: 'Min Conf' })}: <span className="text-primary font-mono">{minConfidence}%</span>
                  </span>
                  <input
                    type="range" min={0} max={100} step={5} value={minConfidence}
                    onChange={(e) => setMinConfidence(Number(e.target.value))}
                    className="w-28 accent-cyan-400"
                    aria-label="Minimum confidence"
                  />
                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value)}
                    className="bg-black/30 border border-gray-700 text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary/50"
                  >
                    <option value="confidence_desc">{t('aiPredictions.sortConfDesc', { defaultValue: 'Confidence ↓' })}</option>
                    <option value="upside_desc">{t('aiPredictions.sortUpsideDesc', { defaultValue: 'Upside % ↓' })}</option>
                    <option value="accuracy_desc">{t('aiPredictions.sortAccuracyDesc', { defaultValue: 'Accuracy ↓' })}</option>
                  </select>
                </div>
              </div>

              {/* Cards grid */}
              {filteredPredictions.length === 0 ? (
                <div className="glass-card p-12 text-center">
                  <ListFilter className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">{t('aiPredictions.noMatchFilters', { defaultValue: 'No predictions match the selected filters.' })}</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredPredictions.map((pred) => (
                    <div
                      key={pred.symbol}
                      className={`glass-card p-5 cursor-pointer hover:scale-[1.01] transition-all bg-gradient-to-br ${
                        pred.direction === 'bullish'
                          ? 'from-green-500/5 to-transparent border-green-500/20 hover:border-green-500/40'
                          : pred.direction === 'bearish'
                          ? 'from-red-500/5 to-transparent border-red-500/20 hover:border-red-500/40'
                          : 'from-gray-500/5 to-transparent border-gray-500/20 hover:border-gray-500/40'
                      }`}
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

                      {/* Symbol row */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold font-mono">{pred.symbol}</h3>
                            {pred.model_type && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                {pred.model_type}
                              </span>
                            )}
                          </div>
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${RATING_COLORS[pred.rating]}`}>
                            {pred.direction === 'bullish' ? <TrendingUp className="w-3 h-3" /> : pred.direction === 'bearish' ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                            {t(`aiPredictions.${pred.rating}`)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-primary text-lg">
                            ${(pred.currentPrice ?? 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                          </div>
                          <div className={`text-xs font-bold ${(pred.upsidePct ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {(pred.upsidePct ?? 0) >= 0 ? '+' : ''}{pred.upsidePct ?? 0}%
                          </div>
                        </div>
                      </div>

                      {/* Price / accuracy mini grid */}
                      <div className="grid grid-cols-2 gap-2 mb-3 p-2.5 rounded-lg bg-black/20 border border-gray-700/30">
                        <div>
                          <div className="text-xs text-gray-500">{t('aiPredictions.targetPrice')}</div>
                          <div className="font-mono font-bold text-sm text-white">
                            ${(pred.targetPrice ?? 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">{t('aiPredictions.modelAccuracy')}</div>
                          <div className="font-bold text-sm text-accent">{pred.modelAccuracy ?? 0}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">{t('aiPredictions.forecastPeriod')}</div>
                          <div className="font-bold text-sm text-gray-300">{pred.forecastPeriod ?? '-'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">{t('aiPredictions.direction')}</div>
                          <div className={`font-bold text-sm capitalize ${
                            pred.direction === 'bullish' ? 'text-green-400' : pred.direction === 'bearish' ? 'text-red-400' : 'text-gray-400'
                          }`}>{pred.direction ?? '-'}</div>
                        </div>
                      </div>

                      {/* Confidence bar */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">{t('common.confidence')}</span>
                          <span className="text-primary font-bold">{pred.confidence}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden" role="progressbar" aria-valuenow={pred.confidence} aria-valuemin={0} aria-valuemax={100}>
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all"
                            style={{ width: `${pred.confidence}%` }}
                          />
                        </div>
                      </div>

                      {pred.timestamp && (
                        <div className="text-xs text-gray-600 mt-2 text-right">{relativeTime(pred.timestamp)}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      )}

    </div>
  )
}

