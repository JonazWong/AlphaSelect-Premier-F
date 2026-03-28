'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AlertTriangle, RefreshCw, X, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { io, Socket } from 'socket.io-client'
import { useTranslation } from 'react-i18next'
import '@/i18n/config'

// ─── Types ──────────────────────────────────────────────────────────────────

type SignalType = 'bounce' | 'pullback'
type Urgency = 'critical' | 'high' | 'medium'
type Timeframe = 'all' | '5m' | '15m' | '30m' | '1h' | '4h'
type SortMode = 'confidence' | 'time' | 'volume' | 'change'
type AutoRefreshMode = 'off' | '30m' | 'realtime'

interface ExtremeSignal {
  id: string
  symbol: string
  signal_type: SignalType
  urgency: Urgency
  timeframe: string
  confidence: number
  current_price: number | null
  price_change: number | null
  predicted_move: number | null
  rsi: number | null
  volume_multiplier: number | null
  macd_status: string | null
  bb_position: string | null
  ai_score: number | null
  lstm_prediction: number | null
  xgb_prediction: number | null
  arima_trend: string | null
  funding_rate: number | null
  open_interest_change: number | null
  liquidation_amount: number | null
  triggers: string[]
  detected_at: string
  created_at: string
}

interface SignalStats {
  total: number
  bounce_count: number
  pullback_count: number
  critical_count: number
  avg_confidence: number
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PulsingDot({ type }: { type: SignalType }) {
  const color = type === 'bounce' ? 'bg-emerald-400' : 'bg-red-400'
  return (
    <span className="relative flex h-3 w-3">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
      <span className={`relative inline-flex rounded-full h-3 w-3 ${color}`} />
    </span>
  )
}

function ConfidenceBar({ value, urgency }: { value: number; urgency: Urgency }) {
  const color =
    urgency === 'critical'
      ? 'bg-red-500'
      : urgency === 'high'
      ? 'bg-orange-500'
      : 'bg-yellow-500'
  return (
    <div className="w-full bg-gray-800 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  )
}

function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  const { t } = useTranslation('common')
  const styles: Record<Urgency, string> = {
    critical: 'bg-red-500/20 text-red-400 border border-red-500/40',
    high: 'bg-orange-500/20 text-orange-400 border border-orange-500/40',
    medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40',
  }
  const labels: Record<Urgency, string> = {
    critical: t('extremeReversal.urgency.critical'),
    high: t('extremeReversal.urgency.high'),
    medium: t('extremeReversal.urgency.medium'),
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[urgency]}`}>
      {labels[urgency]}
    </span>
  )
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: string | number
  color: string
}) {
  return (
    <div className="glass-card p-4 flex flex-col gap-1">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  )
}

function TriggerTag({ label }: { label: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
      {label}
    </span>
  )
}

function SignalCard({
  signal,
  onClick,
}: {
  signal: ExtremeSignal
  onClick: () => void
}) {
  const isBounce = signal.signal_type === 'bounce'
  const { t } = useTranslation('common')
  const borderColor = isBounce ? 'border-emerald-500/40' : 'border-red-500/40'
  const gradientFrom = isBounce ? 'from-emerald-900/20' : 'from-red-900/20'

  return (
    <div
      onClick={onClick}
      className={`glass-card cursor-pointer hover:scale-[1.02] transition-all border ${borderColor} bg-gradient-to-b ${gradientFrom} to-transparent relative overflow-hidden`}
    >
      {/* Critical pulse line */}
      {signal.urgency === 'critical' && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse" />
      )}

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PulsingDot type={signal.signal_type} />
            <span className="font-bold text-white">{signal.symbol}</span>
          </div>
          <div className="flex items-center gap-2">
            <UrgencyBadge urgency={signal.urgency} />
            <span className="text-xs text-gray-500">{signal.timeframe}</span>
          </div>
        </div>

        {/* Signal type */}
        <div className="flex items-center gap-2">
          {isBounce ? (
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-400" />
          )}
          <span className={`text-sm font-semibold ${isBounce ? 'text-emerald-400' : 'text-red-400'}`}>
            {isBounce ? t('extremeReversal.bounce') : t('extremeReversal.pullback')}
          </span>
        </div>

        {/* Price info */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">
            ${signal.current_price != null ? signal.current_price.toLocaleString() : '—'}
          </span>
          <span className={signal.price_change != null && signal.price_change < 0 ? 'text-red-400' : 'text-emerald-400'}>
            {signal.price_change != null ? `${signal.price_change > 0 ? '+' : ''}${signal.price_change.toFixed(2)}%` : '—'}
          </span>
          {signal.predicted_move != null && (
            <span className="text-primary text-xs">
              {t('extremeReversal.predicted')} {isBounce ? '+' : '-'}{signal.predicted_move.toFixed(1)}%
            </span>
          )}
        </div>

        {/* Confidence bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>{ t('extremeReversal.aiConfidence') }</span>
            <span className="font-bold text-white">{signal.confidence.toFixed(1)}%</span>
          </div>
          <ConfidenceBar value={signal.confidence} urgency={signal.urgency} />
        </div>

        {/* Indicator grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-card/50 rounded p-1.5">
            <div className="text-xs text-gray-500">RSI(14)</div>
            <div className={`text-sm font-bold ${
              signal.rsi != null && signal.rsi < 30
                ? 'text-emerald-400'
                : signal.rsi != null && signal.rsi > 70
                ? 'text-red-400'
                : 'text-white'
            }`}>
              {signal.rsi != null ? signal.rsi.toFixed(1) : '—'}
            </div>
          </div>
          <div className="bg-card/50 rounded p-1.5">
            <div className="text-xs text-gray-500">{t('extremeReversal.volumeMultiplier')}</div>
            <div className={`text-sm font-bold ${signal.volume_multiplier != null && signal.volume_multiplier > 2 ? 'text-orange-400' : 'text-white'}`}>
              {signal.volume_multiplier != null ? `${signal.volume_multiplier.toFixed(1)}x` : '—'}
            </div>
          </div>
          <div className="bg-card/50 rounded p-1.5">
            <div className="text-xs text-gray-500">{t('extremeReversal.aiScore')}</div>
            <div className="text-sm font-bold text-secondary">
              {signal.ai_score != null ? signal.ai_score.toFixed(0) : '—'}
            </div>
          </div>
        </div>

        {/* AI model predictions */}
        <div className="grid grid-cols-3 gap-1 text-xs">
          <div className="bg-card/30 rounded p-1 text-center">
            <div className="text-gray-500 text-[10px]">LSTM</div>
            <div className="text-primary font-medium">
              {signal.lstm_prediction != null ? `${isBounce ? '+' : '-'}${Math.abs(signal.lstm_prediction).toFixed(1)}%` : '—'}
            </div>
          </div>
          <div className="bg-card/30 rounded p-1 text-center">
            <div className="text-gray-500 text-[10px]">XGBoost</div>
            <div className="text-secondary font-medium">
              {signal.xgb_prediction != null ? `${isBounce ? '+' : '-'}${Math.abs(signal.xgb_prediction).toFixed(1)}%` : '—'}
            </div>
          </div>
          <div className="bg-card/30 rounded p-1 text-center">
            <div className="text-gray-500 text-[10px]">ARIMA</div>
            <div className="text-accent font-medium">
              {signal.arima_trend ?? '—'}
            </div>
          </div>
        </div>

        {/* Triggers */}
        {signal.triggers.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {signal.triggers.slice(0, 4).map((t) => (
              <TriggerTag key={t} label={t} />
            ))}
          </div>
        )}

        {/* Contract data */}
        <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-gray-800">
          <div>
            <div className="text-gray-500">{t('extremeReversal.fundingRate')}</div>
            <div className={`font-medium ${signal.funding_rate != null && signal.funding_rate < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {signal.funding_rate != null ? `${(signal.funding_rate * 100).toFixed(4)}%` : '—'}
            </div>
          </div>
          <div>
            <div className="text-gray-500">{t('extremeReversal.oiChange')}</div>
            <div className="text-white font-medium">
              {signal.open_interest_change != null ? `${signal.open_interest_change > 0 ? '+' : ''}${signal.open_interest_change.toFixed(1)}%` : '—'}
            </div>
          </div>
          <div>
            <div className="text-gray-500">{t('extremeReversal.liquidation')}</div>
            <div className="text-white font-medium">
              {signal.liquidation_amount != null
                ? signal.liquidation_amount >= 1e6
                  ? `$${(signal.liquidation_amount / 1e6).toFixed(1)}M`
                  : `$${(signal.liquidation_amount / 1e3).toFixed(0)}K`
                : '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailModal({
  signal,
  onClose,
}: {
  signal: ExtremeSignal
  onClose: () => void
}) {
  const isBounce = signal.signal_type === 'bounce'
  const { t } = useTranslation('common')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <PulsingDot type={signal.signal_type} />
            <div>
              <h2 className="text-xl font-bold text-white">{signal.symbol}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-sm font-medium ${isBounce ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isBounce ? t('extremeReversal.bounceSignal') : t('extremeReversal.pullbackSignal')}
                </span>
                <UrgencyBadge urgency={signal.urgency} />
                <span className="text-xs text-gray-500">{signal.timeframe}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Confidence */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">{t('extremeReversal.aiConfidence')}</span>
              <span className="font-bold text-white">{signal.confidence.toFixed(1)}%</span>
            </div>
            <ConfidenceBar value={signal.confidence} urgency={signal.urgency} />
          </div>

          {/* Technical indicators */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">{t('extremeReversal.techIndicators')}</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'RSI (14)', value: signal.rsi != null ? signal.rsi.toFixed(2) : '—' },
                { label: t('extremeReversal.macdStatus'), value: signal.macd_status?.replace('_', ' ') ?? '—' },
                { label: t('extremeReversal.bbPosition'), value: signal.bb_position?.replace('_', ' ') ?? '—' },
                { label: t('extremeReversal.volumeMultiplier'), value: signal.volume_multiplier != null ? `${signal.volume_multiplier.toFixed(2)}x` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-card/40 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">{label}</div>
                  <div className="text-sm font-bold text-white">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI models */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">{t('extremeReversal.aiModels')}</h3>
            <div className="space-y-2">
              {[
                { name: t('extremeReversal.lstmDeep'), value: signal.lstm_prediction, color: 'text-primary' },
                { name: t('extremeReversal.xgbEnsemble'), value: signal.xgb_prediction, color: 'text-secondary' },
              ].map(({ name, value, color }) => (
                <div key={name} className="flex justify-between items-center bg-card/40 rounded-lg p-3">
                  <span className="text-sm text-gray-400">{name}</span>
                  <span className={`font-bold ${color}`}>
                    {value != null ? `${isBounce ? '+' : '-'}${Math.abs(value).toFixed(2)}%` : '—'}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center bg-card/40 rounded-lg p-3">
                <span className="text-sm text-gray-400">{t('extremeReversal.arimaTimeseries')}</span>
                <span className="font-bold text-accent">{signal.arima_trend ?? '—'}</span>
              </div>
              <div className="flex justify-between items-center bg-card/40 rounded-lg p-3">
                <span className="text-sm text-gray-400">{t('extremeReversal.overallConfidence')}</span>
                <span className="font-bold text-white">{signal.ai_score != null ? `${signal.ai_score.toFixed(1)}%` : '—'}</span>
              </div>
            </div>
          </div>

          {/* Contract data */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">{t('extremeReversal.contractData')}</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: t('extremeReversal.fundingRate'),
                  value: signal.funding_rate != null ? `${(signal.funding_rate * 100).toFixed(4)}%` : '—',
                },
                {
                  label: t('extremeReversal.oiChange'),
                  value: signal.open_interest_change != null
                    ? `${signal.open_interest_change > 0 ? '+' : ''}${signal.open_interest_change.toFixed(2)}%`
                    : '—',
                },
                {
                  label: t('extremeReversal.liquidation'),
                  value: signal.liquidation_amount != null
                    ? signal.liquidation_amount >= 1e6
                      ? `$${(signal.liquidation_amount / 1e6).toFixed(2)}M`
                      : `$${(signal.liquidation_amount / 1e3).toFixed(0)}K`
                    : '—',
                },
                {
                  label: t('extremeReversal.predictedMove'),
                  value: signal.predicted_move != null ? `${signal.predicted_move.toFixed(2)}%` : '—',
                },
              ].map(({ label, value }) => (
                <div key={label} className="bg-card/40 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">{label}</div>
                  <div className="text-sm font-bold text-white">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Triggers */}
          {signal.triggers.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">{t('extremeReversal.triggers')}</h3>
              <div className="flex flex-wrap gap-2">
                {signal.triggers.map((t) => (
                  <TriggerTag key={t} label={t} />
                ))}
              </div>
            </div>
          )}

          {/* Risk disclaimer */}
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-400">
            {t('extremeReversal.disclaimer')}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function ExtremeReversalPage() {
  const { t } = useTranslation('common')
  const [signals, setSignals] = useState<ExtremeSignal[]>([])
  const [stats, setStats] = useState<SignalStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSignal, setSelectedSignal] = useState<ExtremeSignal | null>(null)

  // Filters
  const [timeframe, setTimeframe] = useState<Timeframe>('all')
  const [signalType, setSignalType] = useState<'all' | SignalType>('all')
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | Urgency>('all')
  const [sortMode, setSortMode] = useState<SortMode>('confidence')
  const [autoRefresh, setAutoRefresh] = useState<AutoRefreshMode>('off')

  const socketRef = useRef<Socket | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000'

  // ── Fetch from API ────────────────────────────────────────────────────────

  const fetchSignals = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ sort: sortMode, limit: '100' })
      if (timeframe !== 'all') params.set('timeframe', timeframe)
      if (signalType !== 'all') params.set('type', signalType)
      if (urgencyFilter !== 'all') params.set('urgency', urgencyFilter)

      const res = await fetch(`${apiBase}/api/v1/extreme-signals?${params}`, {
        signal: AbortSignal.timeout(15000),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      setSignals(data.signals ?? [])
      setStats(data.stats ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('extremeReversal.loadError'))
      setSignals([])
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [apiBase, timeframe, signalType, urgencyFilter, sortMode])

  // ── Initial load + filter-change reload ──────────────────────────────────

  useEffect(() => {
    fetchSignals()
  }, [fetchSignals])

  // ── Auto-refresh interval ─────────────────────────────────────────────────

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (autoRefresh === '30m') {
      intervalRef.current = setInterval(fetchSignals, 30 * 60 * 1000)
    } else if (autoRefresh === 'realtime') {
      intervalRef.current = setInterval(fetchSignals, 10 * 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [autoRefresh, fetchSignals])

  // ── WebSocket subscription ────────────────────────────────────────────────

  useEffect(() => {
    const socket = io(wsUrl, {
      path: '/ws/socket.io',
      transports: ['websocket', 'polling'],
    })

    socket.on('connect', () => {
      socket.emit('subscribe', { channel: 'extreme-signals' })
    })

    socket.on('new_extreme_signal', (data: ExtremeSignal) => {
      setSignals((prev) => {
        const exists = prev.find((s) => s.id === data.id)
        if (exists) return prev
        return [data, ...prev].slice(0, 200)
      })
    })

    socketRef.current = socket
    return () => {
      socket.emit('unsubscribe', { channel: 'extreme-signals' })
      socket.disconnect()
    }
  }, [wsUrl])

  // ── Computed stats ────────────────────────────────────────────────────────

  const displayStats = stats ?? {
    total: signals.length,
    bounce_count: signals.filter((s) => s.signal_type === 'bounce').length,
    pullback_count: signals.filter((s) => s.signal_type === 'pullback').length,
    critical_count: signals.filter((s) => s.urgency === 'critical').length,
    avg_confidence:
      signals.length > 0
        ? signals.reduce((a, s) => a + s.confidence, 0) / signals.length
        : 0,
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30">
            <AlertTriangle className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-1">
              <span className="text-gradient-cyan-purple">{t('extremeReversal.title')}</span>
            </h1>
            <p className="text-gray-400 text-sm">
              {t('extremeReversal.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSignals}
            disabled={loading}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('extremeReversal.refresh')}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-2 text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label={t('extremeReversal.stats.activeSignals')} value={displayStats.total} color="text-white" />
        <StatCard label={t('extremeReversal.stats.bounceSignals')} value={displayStats.bounce_count} color="text-emerald-400" />
        <StatCard label={t('extremeReversal.stats.pullbackSignals')} value={displayStats.pullback_count} color="text-red-400" />
        <StatCard label={t('extremeReversal.stats.criticalUrgency')} value={displayStats.critical_count} color="text-orange-400" />
        <StatCard
          label={t('extremeReversal.stats.avgConfidence')}
          value={`${displayStats.avg_confidence.toFixed(1)}%`}
          color="text-secondary"
        />
      </div>

      {/* Filters */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Timeframe */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400 mr-1">{t('extremeReversal.filters.timeframe')}</span>
            {(['all', '5m', '15m', '30m', '1h', '4h'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                  timeframe === tf
                    ? 'bg-primary text-black font-semibold'
                    : 'bg-card/50 text-gray-400 hover:text-white'
                }`}
              >
                {tf === 'all' ? t('extremeReversal.filters.all') : tf}
              </button>
            ))}
          </div>

          {/* Signal type */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400 mr-1">{t('extremeReversal.filters.signalType')}</span>
            {[
              { value: 'all', label: t('extremeReversal.filters.all') },
              { value: 'bounce', label: t('extremeReversal.bounce') },
              { value: 'pullback', label: t('extremeReversal.pullback') },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setSignalType(value as typeof signalType)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                  signalType === value
                    ? 'bg-secondary text-black font-semibold'
                    : 'bg-card/50 text-gray-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Urgency */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400 mr-1">{t('extremeReversal.filters.urgency')}</span>
            {[
              { value: 'all', label: t('extremeReversal.filters.all') },
              { value: 'critical', label: t('extremeReversal.urgency.critical') },
              { value: 'high', label: t('extremeReversal.urgency.high') },
              { value: 'medium', label: t('extremeReversal.urgency.medium') },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setUrgencyFilter(value as typeof urgencyFilter)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                  urgencyFilter === value
                    ? 'bg-accent text-black font-semibold'
                    : 'bg-card/50 text-gray-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400 mr-1">{t('extremeReversal.filters.sort')}</span>
            {[
              { value: 'confidence', label: t('extremeReversal.filters.confidence') },
              { value: 'time', label: t('extremeReversal.filters.time') },
              { value: 'volume', label: t('extremeReversal.filters.volume') },
              { value: 'change', label: t('extremeReversal.filters.change') },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setSortMode(value as SortMode)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                  sortMode === value
                    ? 'bg-primary/80 text-black font-semibold'
                    : 'bg-card/50 text-gray-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Auto-refresh control */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400">{t('extremeReversal.filters.autoRefresh')}</span>
          {[
            { value: 'off', label: t('extremeReversal.filters.off') },
            { value: '30m', label: t('extremeReversal.filters.30m') },
            { value: 'realtime', label: t('extremeReversal.filters.realtime') },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setAutoRefresh(value as AutoRefreshMode)}
              className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                autoRefresh === value
                  ? 'bg-primary/20 text-primary border border-primary/40 font-semibold'
                  : 'bg-card/50 text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
          {autoRefresh !== 'off' && (
            <span className="text-xs text-primary flex items-center gap-1">
              <Activity className="w-3 h-3 animate-pulse" />
              {autoRefresh === 'realtime' ? t('extremeReversal.filters.realtime') : t('extremeReversal.filters.30m')}
            </span>
          )}
        </div>
      </div>

      {/* Signal grid */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
          {t('common.loading')}
        </div>
      ) : signals.length === 0 ? (
        <div className="text-center py-20 text-gray-400 glass-card">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">{t('extremeReversal.noSignals')}</p>
          <p className="text-sm text-gray-500 mt-1">{t('extremeReversal.noSignalsHint')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {signals.map((sig) => (
            <SignalCard
              key={sig.id}
              signal={sig}
              onClick={() => setSelectedSignal(sig)}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedSignal && (
        <DetailModal signal={selectedSignal} onClose={() => setSelectedSignal(null)} />
      )}
    </div>
  )
}
