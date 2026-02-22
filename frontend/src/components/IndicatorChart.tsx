'use client'

import { useState, useMemo, ElementType } from 'react'
import { useTranslation } from 'react-i18next'
import '@/i18n/config'

// Recharts 2 has type incompatibilities with React 19's stricter component types.
// We import the values at runtime and cast them to allow usage as JSX components.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Recharts = require('recharts')
const ComposedChart = Recharts.ComposedChart as ElementType
const Line = Recharts.Line as ElementType
const Bar = Recharts.Bar as ElementType
const XAxis = Recharts.XAxis as ElementType
const YAxis = Recharts.YAxis as ElementType
const CartesianGrid = Recharts.CartesianGrid as ElementType
const Tooltip = Recharts.Tooltip as ElementType
const ResponsiveContainer = Recharts.ResponsiveContainer as ElementType
const ReferenceLine = Recharts.ReferenceLine as ElementType

export interface OHLCV {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface IndicatorChartProps {
  data: OHLCV[]
  symbol?: string
  className?: string
}

// Compute Simple Moving Average
function computeMA(data: OHLCV[], period: number): (number | null)[] {
  return data.map((_, i) => {
    if (i < period - 1) return null
    const slice = data.slice(i - period + 1, i + 1)
    return slice.reduce((sum, d) => sum + d.close, 0) / period
  })
}

// Compute Exponential Moving Average
function computeEMA(data: OHLCV[], period: number): (number | null)[] {
  const k = 2 / (period + 1)
  const result: (number | null)[] = []
  let prev: number | null = null
  data.forEach((d, i) => {
    if (i < period - 1) {
      result.push(null)
    } else if (i === period - 1) {
      const sma = data.slice(0, period).reduce((s, x) => s + x.close, 0) / period
      result.push(sma)
      prev = sma
    } else {
      const ema = d.close * k + (prev ?? d.close) * (1 - k)
      result.push(ema)
      prev = ema
    }
  })
  return result
}

// Compute RSI using Wilder's smoothing method
function computeRSI(data: OHLCV[], period = 14): (number | null)[] {
  const result: (number | null)[] = []
  let avgGain = 0
  let avgLoss = 0
  for (let i = 0; i < data.length; i++) {
    if (i === 0) { result.push(null); continue }
    const change = data[i].close - data[i - 1].close
    const gain = change > 0 ? change : 0
    const loss = change < 0 ? -change : 0
    if (i < period) {
      avgGain += gain / period
      avgLoss += loss / period
      result.push(null)
    } else if (i === period) {
      avgGain += gain / period
      avgLoss += loss / period
      const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss
      result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + rs))
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period
      avgLoss = (avgLoss * (period - 1) + loss) / period
      const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss
      result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + rs))
    }
  }
  return result
}

// Compute MACD
function computeMACD(data: OHLCV[]): { macd: (number | null)[]; signal: (number | null)[]; hist: (number | null)[] } {
  const ema12 = computeEMA(data, 12)
  const ema26 = computeEMA(data, 26)
  const macdLine = data.map((_, i) => {
    const a = ema12[i], b = ema26[i]
    return a != null && b != null ? a - b : null
  })
  const validMacd = macdLine.filter((v) => v != null) as number[]
  const signalRaw: (number | null)[] = []
  let prevSignal: number | null = null
  const k = 2 / 10
  macdLine.forEach((v, i) => {
    if (v == null) { signalRaw.push(null); return }
    const idx = macdLine.slice(0, i + 1).filter((x) => x != null).length - 1
    if (idx < 8) { signalRaw.push(null); return }
    if (idx === 8) {
      const sma = validMacd.slice(0, 9).reduce((s, x) => s + x, 0) / 9
      signalRaw.push(sma)
      prevSignal = sma
    } else {
      const sig = v * k + (prevSignal ?? v) * (1 - k)
      signalRaw.push(sig)
      prevSignal = sig
    }
  })
  const hist = macdLine.map((v, i) => {
    const s = signalRaw[i]
    return v != null && s != null ? v - s : null
  })
  return { macd: macdLine, signal: signalRaw, hist }
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card p-3 text-xs space-y-1 min-w-[160px]">
      <div className="font-semibold text-gray-300 mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex justify-between gap-4" style={{ color: p.color }}>
          <span>{p.name}</span>
          <span className="font-mono">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

// Sparkline for quick preview
export function SparklineChart({ data, color = '#00D9FF', className = '' }: { data: OHLCV[]; color?: string; className?: string }) {
  if (!data.length) return null
  return (
    <ResponsiveContainer width="100%" height={40} className={className}>
      <ComposedChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line type="monotone" dataKey="close" stroke={color} dot={false} strokeWidth={1.5} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

export default function IndicatorChart({ data, symbol, className = '' }: IndicatorChartProps) {
  const { t } = useTranslation('common')
  const [showMA, setShowMA] = useState(true)
  const [showEMA, setShowEMA] = useState(false)
  const [showVolume, setShowVolume] = useState(true)
  const [showRSI, setShowRSI] = useState(false)
  const [showMACD, setShowMACD] = useState(false)

  const enriched = useMemo(() => {
    const ma20 = computeMA(data, 20)
    const ema20 = computeEMA(data, 20)
    const rsi14 = computeRSI(data, 14)
    const { macd, signal: macdSig, hist } = computeMACD(data)
    return data.map((d, i) => ({
      ...d,
      ma20: ma20[i],
      ema20: ema20[i],
      rsi14: rsi14[i],
      macd: macd[i],
      macdSignal: macdSig[i],
      macdHist: hist[i],
    }))
  }, [data])

  const toggleBtn = (active: boolean, onClick: () => void, label: string) => (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`px-2 py-0.5 rounded text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-primary/50 ${
        active
          ? 'bg-primary/20 text-primary border border-primary/30'
          : 'text-gray-500 border border-gray-700 hover:text-gray-300'
      }`}
    >
      {label}
    </button>
  )

  if (!data.length) {
    return (
      <div className={`flex items-center justify-center h-48 text-gray-600 text-sm ${className}`}>
        {t('common.noData')}
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Indicator toggles */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-400">{t('chart.indicators')}:</span>
        {toggleBtn(showMA, () => setShowMA((v) => !v), t('chart.ma'))}
        {toggleBtn(showEMA, () => setShowEMA((v) => !v), t('chart.ema'))}
        {toggleBtn(showVolume, () => setShowVolume((v) => !v), t('chart.volume'))}
        {toggleBtn(showRSI, () => setShowRSI((v) => !v), t('chart.rsi'))}
        {toggleBtn(showMACD, () => setShowMACD((v) => !v), t('chart.macd'))}
      </div>

      {/* Main price chart */}
      <div>
        {symbol && <div className="text-xs text-gray-400 mb-1">{symbol} — {t('chart.price')}</div>}
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={enriched} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} />
            <YAxis
              yAxisId="price"
              orientation="right"
              tick={{ fill: '#6b7280', fontSize: 10 }}
              tickLine={false}
              domain={['auto', 'auto']}
              tickFormatter={(v: number) => v.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            />
            {showVolume && (
              <YAxis yAxisId="vol" orientation="left" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} domain={[0, 'auto']} />
            )}
            <Tooltip content={<CustomTooltip />} />
            {showVolume && (
              <Bar yAxisId="vol" dataKey="volume" name={t('chart.volume')} fill="#1e3a5f" opacity={0.5} />
            )}
            <Line yAxisId="price" type="monotone" dataKey="close" name={t('chart.price')} stroke="#00D9FF" dot={false} strokeWidth={2} />
            {showMA && (
              <Line yAxisId="price" type="monotone" dataKey="ma20" name={`${t('chart.ma')} 20`} stroke="#f59e0b" dot={false} strokeWidth={1.5} strokeDasharray="4 2" />
            )}
            {showEMA && (
              <Line yAxisId="price" type="monotone" dataKey="ema20" name={`${t('chart.ema')} 20`} stroke="#a855f7" dot={false} strokeWidth={1.5} strokeDasharray="4 2" />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* RSI sub-chart */}
      {showRSI && (
        <div>
          <div className="text-xs text-gray-400 mb-1">{t('chart.rsi')} (14)</div>
          <ResponsiveContainer width="100%" height={80}>
            <ComposedChart data={enriched} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={false} tickLine={false} height={0} />
              <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} orientation="right" />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label={{ value: t('chart.overbought'), position: 'insideTopRight', fill: '#ef4444', fontSize: 9 }} />
              <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" label={{ value: t('chart.oversold'), position: 'insideBottomRight', fill: '#22c55e', fontSize: 9 }} />
              <Line type="monotone" dataKey="rsi14" name="RSI" stroke="#f59e0b" dot={false} strokeWidth={1.5} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* MACD sub-chart */}
      {showMACD && (
        <div>
          <div className="text-xs text-gray-400 mb-1">{t('chart.macd')}</div>
          <ResponsiveContainer width="100%" height={80}>
            <ComposedChart data={enriched} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={false} tickLine={false} height={0} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} orientation="right" />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#374151" />
              <Bar dataKey="macdHist" name="Histogram" fill="#22c55e" opacity={0.6} />
              <Line type="monotone" dataKey="macd" name="MACD" stroke="#00D9FF" dot={false} strokeWidth={1.5} />
              <Line type="monotone" dataKey="macdSignal" name="Signal" stroke="#f43f5e" dot={false} strokeWidth={1.5} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
