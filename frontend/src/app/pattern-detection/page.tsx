'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type TooltipItem,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import {
  LineChart,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  Activity,
  Target,
  Zap,
  RefreshCw,
} from 'lucide-react'
import '@/i18n/config'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// ── Types ────────────────────────────────────────────────────────────────────

interface PatternResult {
  symbol: string
  pattern: string
  direction: 'bullish' | 'bearish'
  status: 'detected' | 'pending' | 'failed'
  completion: number
  reliability: 'high' | 'medium' | 'low'
  breakoutLevel: number
  targetPrice: number
  rsi_at_detection?: number
  macd_confirmed?: boolean
  rsi_confirmed?: boolean
  volume_spike?: boolean
  confirmed_by?: string[]
  timeframe?: string
}

interface KlineBar {
  t: number
  o: number
  h: number
  l: number
  c: number
  v: number
}

type Timeframe = '1H' | '4H' | '1D'

// ── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_SYMBOLS = ['BTCUSDT', 'ETHUSDT']
const REL_ORDER: Record<string, number> = { high: 3, medium: 2, low: 1 }

const TIMEFRAME_OPTIONS: { value: Timeframe; label: string }[] = [
  { value: '1H', label: '1H' },
  { value: '4H', label: '4H' },
  { value: '1D', label: '1D' },
]

const RELIABILITY_CONFIG = {
  high: { text: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/30' },
  medium: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  low: { text: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30' },
}

// ── Indicator helpers ─────────────────────────────────────────────────────────

function calcRSI(prices: number[], period = 14): number[] {
  if (prices.length < period + 1) return []
  const out: number[] = []
  let ag = 0,
    al = 0
  for (let i = 1; i <= period; i++) {
    const d = prices[i] - prices[i - 1]
    if (d > 0) ag += d
    else al -= d
  }
  ag /= period
  al /= period
  for (let i = period; i < prices.length; i++) {
    if (i > period) {
      const d = prices[i] - prices[i - 1]
      ag = (ag * (period - 1) + Math.max(0, d)) / period
      al = (al * (period - 1) + Math.max(0, -d)) / period
    }
    const rs = al === 0 ? 100 : ag / al
    out.push(100 - 100 / (1 + rs))
  }
  return out
}

// ── API helpers ───────────────────────────────────────────────────────────────

const API_BASE =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : 'http://localhost:8000'

async function fetchPatterns(symbols: string[], timeframe: string): Promise<PatternResult[]> {
  const params = new URLSearchParams()
  if (symbols.length > 0) params.set('symbols', symbols.join(','))
  params.set('timeframe', timeframe)
  const res = await fetch(`${API_BASE}/api/v1/patterns/scan?${params}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data.patterns || []
}

async function fetchKline(symbol: string, timeframe: string): Promise<KlineBar[]> {
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/patterns/kline/${symbol}?timeframe=${timeframe}`,
      { cache: 'no-store' }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.ohlcv || []
  } catch {
    return []
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ConfirmationBadges({ confirmed_by }: { confirmed_by?: string[] }) {
  if (!confirmed_by || confirmed_by.length === 0) return null
  return (
    <div className="flex gap-1 flex-wrap mt-1">
      {confirmed_by.map((b) => (
        <span
          key={b}
          className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-primary/10 text-primary border border-primary/30"
        >
          {b} ✓
        </span>
      ))}
    </div>
  )
}

function PatternCard({
  pat,
  selected,
  onClick,
}: {
  pat: PatternResult
  selected: boolean
  onClick: () => void
}) {
  const { t } = useTranslation('common')
  const rel = RELIABILITY_CONFIG[pat.reliability] ?? RELIABILITY_CONFIG.low
  const bull = pat.direction === 'bullish'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-pressed={selected}
      className={`rounded-xl p-4 border cursor-pointer transition-all border-l-2 ${
        bull ? 'border-l-accent' : 'border-l-red-500'
      } ${
        selected
          ? bull
            ? 'border-accent/50 bg-accent/5 shadow-neon-green'
            : 'border-red-500/50 bg-red-500/5'
          : 'border-gray-700/50 bg-card hover:border-gray-600/70'
      }`}
    >
      {/* Row 1: symbol + direction + status */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {bull ? (
            <TrendingUp className="w-3.5 h-3.5 text-accent" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
          )}
          <span className="font-bold text-sm text-white">{pat.symbol}</span>
          <span
            className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
              bull ? 'bg-accent/15 text-accent' : 'bg-red-500/15 text-red-400'
            }`}
          >
            {bull
              ? `▲ ${t('patternDetection.bullish', { defaultValue: 'Bullish' })}`
              : `▼ ${t('patternDetection.bearish', { defaultValue: 'Bearish' })}`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {pat.status === 'detected' ? (
            <CheckCircle className="w-3.5 h-3.5 text-accent" />
          ) : pat.status === 'pending' ? (
            <Clock className="w-3.5 h-3.5 text-yellow-400" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-red-400" />
          )}
          <span className="text-[11px] text-gray-400">{t(`patternDetection.${pat.status}`)}</span>
        </div>
      </div>

      {/* Row 2: pattern name + reliability badge */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-white">
          {t(`patternDetection.${pat.pattern}`, { defaultValue: pat.pattern })}
        </span>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-medium border ${rel.text} ${rel.bg} ${rel.border}`}
        >
          {t(`common.levels.${pat.reliability}`)}
        </span>
      </div>

      {/* Completion bar */}
      <div className="mb-2">
        <div className="flex justify-between mb-0.5">
          <span className="text-[11px] text-gray-500">{t('patternDetection.completion')}</span>
          <span className="text-[11px] font-mono text-gray-300">{pat.completion}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${bull ? 'bg-accent' : 'bg-red-500'}`}
            style={{ width: `${pat.completion}%` }}
          />
        </div>
      </div>

      {/* Price levels */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] mb-1">
        <div>
          <span className="text-gray-500">{t('patternDetection.breakoutLevel')}:</span>
          <span className="ml-1 font-mono text-primary">${pat.breakoutLevel.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-gray-500">{t('patternDetection.priceTarget')}:</span>
          <span className={`ml-1 font-mono font-bold ${bull ? 'text-accent' : 'text-red-400'}`}>
            ${pat.targetPrice.toLocaleString()}
          </span>
        </div>
        {pat.rsi_at_detection !== undefined && (
          <div>
            <span className="text-gray-500">RSI:</span>
            <span
              className={`ml-1 font-mono ${
                pat.rsi_at_detection < 35
                  ? 'text-accent'
                  : pat.rsi_at_detection > 65
                  ? 'text-red-400'
                  : 'text-yellow-400'
              }`}
            >
              {pat.rsi_at_detection}
            </span>
          </div>
        )}
      </div>

      <ConfirmationBadges confirmed_by={pat.confirmed_by} />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PatternDetectionPage() {
  const { t } = useTranslation('common')

  const [timeframe, setTimeframe] = useState<Timeframe>('1H')
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS)
  const [symbolInput, setSymbolInput] = useState('')
  const [selectedSymbol, setSelectedSymbol] = useState<string>(DEFAULT_SYMBOLS[0])
  const [patterns, setPatterns] = useState<PatternResult[]>([])
  const [kline, setKline] = useState<KlineBar[]>([])
  const [loading, setLoading] = useState(false)
  const [klineLoading, setKlineLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState('')
  const [relFilter, setRelFilter] = useState<'All' | 'high' | 'medium' | 'low'>('All')
  const [dirFilter, setDirFilter] = useState<'All' | 'bullish' | 'bearish'>('All')
  const [sortMode, setSortMode] = useState('completion_desc')

  const doScan = useCallback(async () => {
    if (symbols.length === 0) return
    setLoading(true)
    setError(null)
    try {
      setPatterns(await fetchPatterns(symbols, timeframe))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed')
    } finally {
      setLoading(false)
    }
  }, [symbols, timeframe])

  const doKline = useCallback(async () => {
    if (!selectedSymbol) return
    setKlineLoading(true)
    try {
      setKline(await fetchKline(selectedSymbol, timeframe))
    } catch {
      setKline([])
    } finally {
      setKlineLoading(false)
    }
  }, [selectedSymbol, timeframe])

  useEffect(() => { doScan() }, [doScan])
  useEffect(() => { doKline() }, [doKline])

  // Symbol management
  const addSymbol = () => {
    const s = symbolInput.trim().toUpperCase()
    if (s && !symbols.includes(s)) {
      setSymbols((prev) => [...prev, s])
      setSymbolInput('')
    }
  }
  const removeSymbol = (s: string) => {
    setSymbols((prev) => prev.filter((x) => x !== s))
    if (selectedSymbol === s) {
      const next = symbols.find((x) => x !== s)
      if (next) setSelectedSymbol(next)
    }
  }

  // Stats
  const stats = useMemo(() => ({
    total: patterns.length,
    bullish: patterns.filter((p) => p.direction === 'bullish').length,
    bearish: patterns.filter((p) => p.direction === 'bearish').length,
    high: patterns.filter((p) => p.reliability === 'high').length,
  }), [patterns])

  // RSI from kline closes
  const rsiValues = useMemo(
    () => (kline.length >= 15 ? calcRSI(kline.map((k) => k.c)) : []),
    [kline]
  )

  // Chart labels
  const chartLabels = useMemo(
    () =>
      kline.map((k) =>
        k.t
          ? new Date(k.t < 1e12 ? k.t * 1000 : k.t).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : ''
      ),
    [kline]
  )

  // Price line chart data
  const priceChartData = useMemo(
    () => ({
      labels: chartLabels,
      datasets: [
        {
          label: selectedSymbol,
          data: kline.map((k) => k.c),
          borderColor: '#00D9FF',
          backgroundColor: 'rgba(0,217,255,0.06)',
          borderWidth: 1.5,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
      ],
    }),
    [kline, chartLabels, selectedSymbol]
  )

  const priceChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index' as const, intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(26,35,50,0.95)',
          titleColor: '#00D9FF',
          bodyColor: '#fff',
          borderColor: '#00D9FF',
          borderWidth: 1,
          callbacks: { label: (ctx: TooltipItem<'line'>) => `$${(ctx.parsed.y ?? 0).toLocaleString()}` },
        },
      },
      scales: {
        x: {
          ticks: { color: '#4B5563', font: { size: 10 }, maxTicksLimit: 8 },
          grid: { color: 'rgba(75,85,99,0.2)' },
        },
        y: {
          position: 'right' as const,
          ticks: {
            color: '#00FFB3',
            font: { size: 10 },
            callback: (v: number | string) => '$' + Number(v).toLocaleString(),
          },
          grid: { color: 'rgba(0,255,179,0.08)' },
        },
      },
    }),
    []
  )

  // RSI chart data
  const rsiChartData = useMemo(
    () => ({
      labels: chartLabels.slice(-rsiValues.length),
      datasets: [
        {
          label: 'RSI',
          data: rsiValues,
          borderColor: '#B24BF3',
          backgroundColor: 'rgba(178,75,243,0.08)',
          borderWidth: 1.5,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
        },
      ],
    }),
    [rsiValues, chartLabels]
  )

  const rsiChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(26,35,50,0.95)',
          titleColor: '#B24BF3',
          bodyColor: '#fff',
          callbacks: { label: (ctx: TooltipItem<'line'>) => `RSI: ${(ctx.parsed.y ?? 0).toFixed(2)}` },
        },
      },
      scales: {
        x: { ticks: { color: '#4B5563', font: { size: 9 }, maxTicksLimit: 6 }, grid: { display: false } },
        y: {
          position: 'right' as const,
          min: 0,
          max: 100,
          ticks: { color: '#B24BF3', font: { size: 9 } },
          grid: { color: 'rgba(178,75,243,0.1)' },
        },
      },
    }),
    []
  )

  // Filtered & sorted patterns
  const filteredPatterns = useMemo(
    () =>
      patterns
        .filter((p) => {
          const n = p.pattern.toLowerCase()
          if (typeFilter === 'double') return n.includes('double')
          if (typeFilter === 'triple') return n.includes('triple')
          if (typeFilter === 'headshoulders') return n.includes('head') || n.includes('shoulder')
          if (typeFilter === 'triangle') return n.includes('triangle')
          if (typeFilter === 'flag') return n.includes('flag')
          if (typeFilter === 'wedge') return n.includes('wedge')
          if (typeFilter === 'other')
            return (
              !n.includes('double') &&
              !n.includes('triple') &&
              !n.includes('head') &&
              !n.includes('triangle') &&
              !n.includes('flag') &&
              !n.includes('wedge')
            )
          return true
        })
        .filter((p) => relFilter === 'All' || p.reliability === relFilter)
        .filter((p) => dirFilter === 'All' || p.direction === dirFilter)
        .sort((a, b) => {
          if (sortMode === 'completion_desc') return (b.completion ?? 0) - (a.completion ?? 0)
          if (sortMode === 'reliability') return (REL_ORDER[b.reliability] ?? 0) - (REL_ORDER[a.reliability] ?? 0)
          return a.symbol.localeCompare(b.symbol)
        }),
    [patterns, typeFilter, relFilter, dirFilter, sortMode]
  )

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-neon-purple flex-shrink-0">
            <LineChart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">{t('patternDetection.title')}</h1>
            <p className="text-xs text-gray-400">{t('patternDetection.description')}</p>
          </div>
        </div>
        <button
          onClick={doScan}
          disabled={loading || symbols.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-all disabled:opacity-50 text-sm font-semibold"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {t('patternDetection.scanNow', { defaultValue: 'Scan Now' })}
        </button>
      </div>

      {/* ── Controls ───────────────────────────────── */}
      <div className="bg-card rounded-xl p-4 border border-gray-700/50 space-y-3">
        {/* Symbol tags */}
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">
            {t('patternDetection.symbols', { defaultValue: 'Symbols' })}
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {symbols.map((s) => (
              <div
                key={s}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary border border-primary/30 text-xs font-bold"
              >
                {s}
                <button
                  onClick={() => removeSymbol(s)}
                  className="hover:text-red-400 transition-colors ml-0.5"
                  aria-label={`Remove ${s}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={symbolInput}
              onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && addSymbol()}
              placeholder="SOLUSDT…"
              className="flex-1 bg-black/30 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:border-primary focus:outline-none"
            />
            <button
              onClick={addSymbol}
              className="px-3 py-1.5 rounded-lg bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 text-sm font-semibold transition-all"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Timeframe selector */}
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">
            {t('patternDetection.timeframe', { defaultValue: 'Timeframe' })}
          </label>
          <div className="flex gap-2">
            {TIMEFRAME_OPTIONS.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  timeframe === tf.value
                    ? 'bg-primary/20 text-primary border border-primary/50 shadow-neon-cyan'
                    : 'bg-black/20 text-gray-400 border border-gray-700 hover:text-white'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl p-4 border border-gray-700/50">
          <div className="text-xs text-gray-400 mb-1">
            {t('patternDetection.statsTotal', { defaultValue: 'Detected' })}
          </div>
          <div className="text-2xl font-bold text-primary">{stats.total}</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-accent/20">
          <div className="text-xs text-gray-400 mb-1">
            {t('patternDetection.statsBullish', { defaultValue: 'Bullish' })}
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            <span className="text-2xl font-bold text-accent">{stats.bullish}</span>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-red-500/20">
          <div className="text-xs text-gray-400 mb-1">
            {t('patternDetection.statsBearish', { defaultValue: 'Bearish' })}
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-2xl font-bold text-red-400">{stats.bearish}</span>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-yellow-500/20">
          <div className="text-xs text-gray-400 mb-1">
            {t('patternDetection.statsHighReliability', { defaultValue: 'High Reliability' })}
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-2xl font-bold text-yellow-400">{stats.high}</span>
          </div>
        </div>
      </div>

      {/* ── Main body ──────────────────────────────── */}
      {loading ? (
        <div className="bg-card rounded-xl p-16 text-center border border-gray-700/50">
          <Loader2 className="w-10 h-10 mx-auto mb-4 text-primary animate-spin" />
          <p className="text-gray-400">{t('common.loading')}</p>
        </div>
      ) : error ? (
        <div className="bg-card rounded-xl p-10 text-center border border-red-500/30">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-400" />
          <p className="text-red-400 font-medium mb-1">{t('common.error')}</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      ) : symbols.length === 0 ? (
        <div className="bg-card rounded-xl p-16 text-center border border-gray-700/50">
          <LineChart className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">{t('patternDetection.selectSymbolsHint')}</p>
        </div>
      ) : (
        <div className="grid xl:grid-cols-3 gap-5">

          {/* ── Left: charts ─────────────────────────── */}
          <div className="xl:col-span-2 space-y-4">

            {/* Price chart card */}
            <div className="bg-card rounded-xl p-4 border border-gray-700/50">
              {/* Symbol tabs */}
              <div className="flex flex-wrap gap-2 mb-4">
                {symbols.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSymbol(s)}
                    aria-pressed={selectedSymbol === s}
                    className={`px-3 py-1 rounded-lg text-sm transition-all focus:outline-none ${
                      selectedSymbol === s
                        ? 'bg-primary/20 text-primary border border-primary/50 shadow-neon-cyan'
                        : 'bg-black/20 text-gray-400 border border-gray-700 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Chart header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-400">
                  {selectedSymbol} · {timeframe} · Close Price
                </span>
                {klineLoading && <Loader2 className="w-3 h-3 text-gray-500 animate-spin" />}
              </div>

              {/* Main line chart */}
              <div className="h-[260px]">
                {kline.length > 0 ? (
                  <Line data={priceChartData} options={priceChartOptions} />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-600 text-sm">
                    {klineLoading ? t('common.loading') : 'No chart data — connect MEXC API'}
                  </div>
                )}
              </div>

              {/* RSI sub-chart */}
              {rsiValues.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-secondary font-semibold">RSI (14)</span>
                    <div className="flex gap-3 text-[10px]">
                      <span className="text-red-400/70">— 70 Overbought</span>
                      <span className="text-accent/70">— 30 Oversold</span>
                    </div>
                  </div>
                  <div className="h-[70px]">
                    <Line data={rsiChartData} options={rsiChartOptions} />
                  </div>
                </div>
              )}
            </div>

            {/* Active patterns for selected symbol */}
            {patterns.filter((p) => p.symbol === selectedSymbol).length > 0 && (
              <div className="bg-card rounded-xl p-4 border border-gray-700/50">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">
                  <Activity className="w-4 h-4 inline mr-1.5 text-primary" />
                  {selectedSymbol} — Active Patterns
                </h3>
                <div className="grid sm:grid-cols-2 gap-2">
                  {patterns
                    .filter((p) => p.symbol === selectedSymbol)
                    .slice(0, 4)
                    .map((p, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between p-2.5 rounded-lg border ${
                          p.direction === 'bullish'
                            ? 'border-accent/20 bg-accent/5'
                            : 'border-red-500/20 bg-red-500/5'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-semibold text-white">
                            {t(`patternDetection.${p.pattern}`, { defaultValue: p.pattern })}
                          </div>
                          <ConfirmationBadges confirmed_by={p.confirmed_by} />
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-gray-400">Target</div>
                          <div
                            className={`text-xs font-bold font-mono ${
                              p.direction === 'bullish' ? 'text-accent' : 'text-red-400'
                            }`}
                          >
                            ${p.targetPrice.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: filter + pattern list ─────────── */}
          <div className="space-y-3">

            {/* Filters */}
            <div className="bg-card rounded-xl p-3 border border-gray-700/50 space-y-2.5">
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">
                  {t('patternDetection.filterByType', { defaultValue: 'Pattern Type' })}
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full bg-black/30 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 focus:border-primary focus:outline-none"
                >
                  <option value="">{t('patternDetection.allPatterns', { defaultValue: 'All' })}</option>
                  <option value="double">Double Top / Bottom</option>
                  <option value="triple">Triple Top / Bottom</option>
                  <option value="headshoulders">Head &amp; Shoulders</option>
                  <option value="triangle">Triangle</option>
                  <option value="flag">Flag</option>
                  <option value="wedge">Wedge</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">
                  {t('patternDetection.reliabilityFilter', { defaultValue: 'Reliability' })}
                </label>
                <div className="flex gap-1">
                  {(['All', 'high', 'medium', 'low'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setRelFilter(v)}
                      className={`flex-1 py-1 rounded text-[11px] font-bold border transition-all ${
                        relFilter === v
                          ? 'bg-primary/20 text-primary border-primary/50'
                          : 'bg-black/20 text-gray-400 border-gray-700 hover:text-white'
                      }`}
                    >
                      {v === 'All' ? 'All' : t(`common.levels.${v}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-gray-500 mb-1 block">
                    {t('patternDetection.directionFilter', { defaultValue: 'Direction' })}
                  </label>
                  <select
                    value={dirFilter}
                    onChange={(e) => setDirFilter(e.target.value as 'All' | 'bullish' | 'bearish')}
                    className="w-full bg-black/30 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:border-primary focus:outline-none"
                  >
                    <option value="All">All</option>
                    <option value="bullish">{t('patternDetection.bullish', { defaultValue: 'Bullish' })}</option>
                    <option value="bearish">{t('patternDetection.bearish', { defaultValue: 'Bearish' })}</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 mb-1 block">
                    {t('patternDetection.sortBy', { defaultValue: 'Sort' })}
                  </label>
                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value)}
                    className="w-full bg-black/30 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:border-primary focus:outline-none"
                  >
                    <option value="completion_desc">Completion ↓</option>
                    <option value="reliability">Reliability</option>
                    <option value="symbol_az">Symbol A→Z</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Count + clear */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-gray-500">
                {filteredPatterns.length} {t('patternDetection.statsTotal', { defaultValue: 'patterns' })}
              </span>
              {(typeFilter || relFilter !== 'All' || dirFilter !== 'All') && (
                <button
                  onClick={() => { setTypeFilter(''); setRelFilter('All'); setDirFilter('All') }}
                  className="text-[11px] text-primary hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* Pattern cards */}
            <div className="space-y-3 max-h-[740px] overflow-y-auto pr-0.5">
              {filteredPatterns.length === 0 ? (
                <div className="bg-card rounded-xl p-8 text-center border border-gray-700/50">
                  <Target className="w-10 h-10 mx-auto mb-3 text-gray-600" />
                  <p className="text-gray-500 text-sm">
                    {patterns.length === 0
                      ? t('patternDetection.noPatterns')
                      : t('patternDetection.noMatchFilters', { defaultValue: 'No patterns match filters' })}
                  </p>
                </div>
              ) : (
                filteredPatterns.map((pat, i) => (
                  <PatternCard
                    key={i}
                    pat={pat}
                    selected={selectedSymbol === pat.symbol}
                    onClick={() => setSelectedSymbol(pat.symbol)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
