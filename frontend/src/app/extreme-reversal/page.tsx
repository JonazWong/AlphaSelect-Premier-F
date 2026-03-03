'use client'

import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, TrendingUp, TrendingDown, RefreshCw, Wifi, WifiOff, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import '@/i18n/config'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ExtremeSignal {
  id: number
  symbol: string
  signal_type: 'bounce' | 'pullback'
  urgency: 'critical' | 'high' | 'medium'
  timeframe: string
  confidence: number
  price_change: number
  current_price: number
  predicted_move: number
  rsi?: number
  volume_multiplier?: number
  macd_status?: string
  bb_position?: string
  ai_score?: number
  lstm_prediction?: string
  xgb_prediction?: string
  arima_trend?: string
  funding_rate?: number
  open_interest_change?: number
  liquidation_amount?: number
  triggers?: string[]
  detected_at: string
}

interface Stats {
  total: number
  bounce_count: number
  pullback_count: number
  critical_count: number
  avg_confidence: number
}

// ─── Mock fallback data ─────────────────────────────────────────────────────
const MOCK_SIGNALS: ExtremeSignal[] = [
  {
    id: 1, symbol: 'BTC_USDT', signal_type: 'bounce', urgency: 'critical',
    timeframe: '15m', confidence: 89.2, price_change: -4.8, current_price: 62450,
    predicted_move: 3.1, rsi: 22.4, volume_multiplier: 3.2, macd_status: '底背離',
    bb_position: '下軌附近', ai_score: 88.5, lstm_prediction: '+2.8%',
    xgb_prediction: '+3.2%', arima_trend: '上升趨勢', funding_rate: -0.05,
    open_interest_change: 1250000, liquidation_amount: 3200000,
    triggers: ['RSI極端', '布林帶突破', 'MACD背離', '放量異常', 'AI模型觸發'],
    detected_at: new Date().toISOString(),
  },
  {
    id: 2, symbol: 'ETH_USDT', signal_type: 'pullback', urgency: 'high',
    timeframe: '1h', confidence: 78.5, price_change: 5.2, current_price: 3420,
    predicted_move: -2.7, rsi: 74.8, volume_multiplier: 2.1, macd_status: '頂背離',
    bb_position: '上軌附近', ai_score: 76.3, lstm_prediction: '-2.4%',
    xgb_prediction: '-2.8%', arima_trend: '下降趨勢', funding_rate: 0.08,
    open_interest_change: -850000, liquidation_amount: 1800000,
    triggers: ['RSI極端', 'MACD背離', 'AI模型觸發'],
    detected_at: new Date().toISOString(),
  },
  {
    id: 3, symbol: 'SOL_USDT', signal_type: 'bounce', urgency: 'high',
    timeframe: '30m', confidence: 76.1, price_change: -3.2, current_price: 142.5,
    predicted_move: 2.7, rsi: 27.3, volume_multiplier: 1.9, macd_status: '底背離',
    bb_position: '下軌附近', ai_score: 74.8, lstm_prediction: '+2.4%',
    xgb_prediction: '+2.8%', arima_trend: '上升趨勢', funding_rate: -0.03,
    open_interest_change: 420000, liquidation_amount: 950000,
    triggers: ['RSI極端', '布林帶突破', 'AI模型觸發'],
    detected_at: new Date().toISOString(),
  },
]

// ─── Sub-components ────────────────────────────────────────────────────────

function PulsingDot({ type }: { type: 'bounce' | 'pullback' }) {
  const color = type === 'bounce' ? 'bg-emerald-400' : 'bg-red-400'
  return (
    <span className="relative flex h-3 w-3">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
      <span className={`relative inline-flex rounded-full h-3 w-3 ${color}`} />
    </span>
  )
}

function ConfidenceBar({ value, urgency }: { value: number; urgency: string }) {
  const color = urgency === 'critical' ? 'bg-red-500' : urgency === 'high' ? 'bg-orange-400' : 'bg-yellow-400'
  return (
    <div className="w-full bg-gray-700 rounded-full h-1.5">
      <div
        className={`h-1.5 rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  )
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const cfg: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400 border border-red-500/40',
    high: 'bg-orange-500/20 text-orange-400 border border-orange-500/40',
    medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40',
  }
  const labels: Record<string, string> = { critical: '極高', high: '高', medium: '中' }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${cfg[urgency] ?? cfg.medium}`}>
      {labels[urgency] ?? urgency}
    </span>
  )
}

function SignalCard({ signal, onClick }: { signal: ExtremeSignal; onClick: () => void }) {
  const isBounce = signal.signal_type === 'bounce'
  const borderColor = isBounce ? 'border-emerald-500/40' : 'border-red-500/40'
  const gradFrom = isBounce ? 'from-emerald-900/20' : 'from-red-900/20'

  return (
    <div
      onClick={onClick}
      className={`glass-card p-5 cursor-pointer hover:scale-[1.02] transition-transform border ${borderColor} bg-gradient-to-br ${gradFrom} to-transparent relative overflow-hidden`}
    >
      {signal.urgency === 'critical' && (
        <div className={`absolute top-0 left-0 right-0 h-0.5 ${isBounce ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PulsingDot type={signal.signal_type} />
          <span className="font-bold text-white">{signal.symbol}</span>
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${isBounce ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {isBounce ? '反彈' : '回調'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <UrgencyBadge urgency={signal.urgency} />
          <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-0.5 rounded">{signal.timeframe}</span>
        </div>
      </div>

      {/* Price row */}
      <div className="flex items-baseline gap-3 mb-3">
        <span className="text-lg font-semibold text-white">${signal.current_price?.toLocaleString()}</span>
        <span className={`text-sm font-medium ${signal.price_change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {signal.price_change >= 0 ? '+' : ''}{signal.price_change?.toFixed(2)}%
        </span>
        <span className={`text-sm ml-auto font-medium ${isBounce ? 'text-emerald-400' : 'text-red-400'}`}>
          預測: {signal.predicted_move >= 0 ? '+' : ''}{signal.predicted_move?.toFixed(1)}%
        </span>
      </div>

      {/* Confidence */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">AI 信心度</span>
          <span className="font-semibold text-white">{signal.confidence?.toFixed(1)}%</span>
        </div>
        <ConfidenceBar value={signal.confidence} urgency={signal.urgency} />
      </div>

      {/* Indicator grid */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div className="bg-gray-800/50 rounded p-2">
          <div className="text-xs text-gray-400">RSI(14)</div>
          <div className={`text-sm font-bold ${(signal.rsi ?? 50) < 30 ? 'text-emerald-400' : (signal.rsi ?? 50) > 70 ? 'text-red-400' : 'text-yellow-400'}`}>
            {signal.rsi?.toFixed(1) ?? 'N/A'}
          </div>
        </div>
        <div className="bg-gray-800/50 rounded p-2">
          <div className="text-xs text-gray-400">成交量</div>
          <div className="text-sm font-bold text-orange-400">{signal.volume_multiplier?.toFixed(1) ?? 'N/A'}x</div>
        </div>
        <div className="bg-gray-800/50 rounded p-2">
          <div className="text-xs text-gray-400">AI 分數</div>
          <div className="text-sm font-bold text-purple-400">{signal.ai_score?.toFixed(0) ?? 'N/A'}</div>
        </div>
      </div>

      {/* AI predictions */}
      <div className="grid grid-cols-3 gap-1 mb-3 text-center text-xs">
        <div className="bg-blue-900/20 rounded p-1.5">
          <div className="text-gray-400 mb-0.5">LSTM</div>
          <div className={`font-semibold ${isBounce ? 'text-emerald-400' : 'text-red-400'}`}>{signal.lstm_prediction}</div>
        </div>
        <div className="bg-purple-900/20 rounded p-1.5">
          <div className="text-gray-400 mb-0.5">XGBoost</div>
          <div className={`font-semibold ${isBounce ? 'text-emerald-400' : 'text-red-400'}`}>{signal.xgb_prediction}</div>
        </div>
        <div className="bg-pink-900/20 rounded p-1.5">
          <div className="text-gray-400 mb-0.5">ARIMA</div>
          <div className={`font-semibold ${isBounce ? 'text-emerald-400' : 'text-red-400'}`}>{signal.arima_trend}</div>
        </div>
      </div>

      {/* Trigger tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {(signal.triggers ?? []).map((t) => (
          <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-gray-700/60 text-gray-300 border border-gray-600/40">
            {t}
          </span>
        ))}
      </div>

      {/* Contract data */}
      <div className="flex justify-between text-xs text-gray-400 pt-2 border-t border-gray-700/40">
        <span>費率: <span className={`${(signal.funding_rate ?? 0) < 0 ? 'text-emerald-400' : 'text-red-400'} font-medium`}>{((signal.funding_rate ?? 0) * 100).toFixed(3)}%</span></span>
        <span>OI: <span className="text-blue-400 font-medium">{signal.open_interest_change ? (signal.open_interest_change / 1e6).toFixed(2) + 'M' : 'N/A'}</span></span>
        <span>清算: <span className="text-orange-400 font-medium">{signal.liquidation_amount ? '$' + (signal.liquidation_amount / 1e3).toFixed(0) + 'K' : 'N/A'}</span></span>
      </div>
    </div>
  )
}

function DetailModal({ signal, onClose }: { signal: ExtremeSignal; onClose: () => void }) {
  const isBounce = signal.signal_type === 'bounce'
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <PulsingDot type={signal.signal_type} />
          <h2 className="text-2xl font-bold text-white">{signal.symbol}</h2>
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${isBounce ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {isBounce ? '極端反彈信號' : '極端回調信號'}
          </span>
          <UrgencyBadge urgency={signal.urgency} />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Technical indicators */}
          <div className="bg-gray-800/40 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">技術指標</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">RSI(14)</span><span className={`font-bold ${(signal.rsi ?? 50) < 30 ? 'text-emerald-400' : 'text-red-400'}`}>{signal.rsi?.toFixed(1)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">MACD 背離</span><span className="text-purple-400">{signal.macd_status}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">布林帶位置</span><span className="text-blue-400">{signal.bb_position}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">成交量倍數</span><span className="text-orange-400">{signal.volume_multiplier?.toFixed(2)}x</span></div>
            </div>
          </div>

          {/* AI analysis */}
          <div className="bg-gray-800/40 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">AI 模型分析</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">LSTM 深度學習</span><span className={`font-bold ${isBounce ? 'text-emerald-400' : 'text-red-400'}`}>{signal.lstm_prediction}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">XGBoost 集成</span><span className={`font-bold ${isBounce ? 'text-emerald-400' : 'text-red-400'}`}>{signal.xgb_prediction}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">ARIMA 時序</span><span className="text-purple-400">{signal.arima_trend}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">綜合信心度</span><span className="text-white font-bold">{signal.confidence?.toFixed(1)}%</span></div>
            </div>
          </div>
        </div>

        {/* Contract data */}
        <div className="bg-gray-800/40 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">合約數據</h3>
          <div className="grid grid-cols-4 gap-3 text-sm text-center">
            <div><div className="text-gray-400 text-xs mb-1">資金費率</div><div className={`font-bold ${(signal.funding_rate ?? 0) < 0 ? 'text-emerald-400' : 'text-red-400'}`}>{((signal.funding_rate ?? 0) * 100).toFixed(4)}%</div></div>
            <div><div className="text-gray-400 text-xs mb-1">持倉量變化</div><div className="font-bold text-blue-400">{signal.open_interest_change ? (signal.open_interest_change / 1e6).toFixed(2) + 'M' : 'N/A'}</div></div>
            <div><div className="text-gray-400 text-xs mb-1">近期清算</div><div className="font-bold text-orange-400">{signal.liquidation_amount ? '$' + (signal.liquidation_amount / 1e3).toFixed(0) + 'K' : 'N/A'}</div></div>
            <div><div className="text-gray-400 text-xs mb-1">預測幅度</div><div className={`font-bold ${isBounce ? 'text-emerald-400' : 'text-red-400'}`}>{signal.predicted_move >= 0 ? '+' : ''}{signal.predicted_move?.toFixed(2)}%</div></div>
          </div>
        </div>

        {/* Triggers */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">觸發條件</h3>
          <div className="flex flex-wrap gap-2">
            {(signal.triggers ?? []).map((t) => (
              <span key={t} className="px-3 py-1 rounded-full text-sm bg-primary/10 text-primary border border-primary/30">{t}</span>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 text-xs text-yellow-300">
          ⚠️ 此預測僅供參考，不構成投資建議。加密貨幣市場具有高度波動性，投資有風險，請自行判斷並承擔相關風險。
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="glass-card p-4 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function ExtremeReversalPage() {
  const { t } = useTranslation('common')

  const [signals, setSignals] = useState<ExtremeSignal[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, bounce_count: 0, pullback_count: 0, critical_count: 0, avg_confidence: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wsConnected, setWsConnected] = useState(false)
  const [selected, setSelected] = useState<ExtremeSignal | null>(null)

  // Filters
  const [timeframe, setTimeframe] = useState('')
  const [signalType, setSignalType] = useState('')
  const [urgency, setUrgency] = useState('')
  const [sortBy, setSortBy] = useState('confidence')
  const [autoRefresh, setAutoRefresh] = useState<'off' | '30m' | 'realtime'>('off')

  const fetchSignals = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (timeframe) params.set('timeframe', timeframe)
      if (signalType) params.set('type', signalType)
      if (urgency) params.set('urgency', urgency)
      params.set('sort', sortBy)
      params.set('limit', '60')

      const res = await fetch(`${API_URL}/api/v1/extreme-signals?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setSignals(data.items ?? [])
      setStats(data.stats ?? stats)
      setError(null)
    } catch {
      // Graceful fallback to mock data
      setSignals(MOCK_SIGNALS)
      setStats({
        total: MOCK_SIGNALS.length,
        bounce_count: MOCK_SIGNALS.filter(s => s.signal_type === 'bounce').length,
        pullback_count: MOCK_SIGNALS.filter(s => s.signal_type === 'pullback').length,
        critical_count: MOCK_SIGNALS.filter(s => s.urgency === 'critical').length,
        avg_confidence: Math.round(MOCK_SIGNALS.reduce((a, s) => a + s.confidence, 0) / MOCK_SIGNALS.length),
      })
      setError('API 未連線，顯示模擬數據')
    } finally {
      setLoading(false)
    }
  }, [timeframe, signalType, urgency, sortBy])

  // Initial fetch + filter-change refetch
  useEffect(() => { fetchSignals() }, [fetchSignals])

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh === 'off') return
    const ms = autoRefresh === 'realtime' ? 10_000 : 30 * 60_000
    const id = setInterval(fetchSignals, ms)
    return () => clearInterval(id)
  }, [autoRefresh, fetchSignals])

  // WebSocket
  useEffect(() => {
    let sio: any = null
    const connect = async () => {
      try {
        const { io } = await import('socket.io-client')
        sio = io(WS_URL, { path: '/ws/socket.io', transports: ['websocket'] })
        sio.on('connect', () => {
          setWsConnected(true)
          sio.emit('subscribe', { channel: 'extreme-signals' })
        })
        sio.on('disconnect', () => setWsConnected(false))
        sio.on('extreme_signal', (data: ExtremeSignal) => {
          setSignals((prev) => [data, ...prev.slice(0, 99)])
        })
      } catch (_) { /* socket.io-client may not be installed */ }
    }
    if (autoRefresh === 'realtime') connect()
    return () => { sio?.disconnect() }
  }, [autoRefresh])

  const timeframeOptions = ['', '5m', '15m', '30m', '1h', '4h']
  const signalTypeOptions = [{ value: '', label: '全部' }, { value: 'bounce', label: '反彈' }, { value: 'pullback', label: '回調' }]
  const urgencyOptions = [{ value: '', label: '全部' }, { value: 'critical', label: '極高' }, { value: 'high', label: '高' }, { value: 'medium', label: '中' }]
  const sortOptions = [{ value: 'confidence', label: '信心度' }, { value: 'time', label: '最新' }, { value: 'volume', label: '成交量' }, { value: 'change', label: '變動幅度' }]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-orange-400" />
          <div>
            <h1 className="text-3xl font-bold text-gradient-cyan-purple">極端反轉監察</h1>
            <p className="text-gray-400 text-sm mt-0.5">RSI + MACD + Bollinger Bands + AI 多維信號偵測</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {wsConnected ? (
            <span className="flex items-center gap-1.5 text-emerald-400 text-sm"><Wifi className="w-4 h-4" /> 實時連線</span>
          ) : (
            <span className="flex items-center gap-1.5 text-gray-400 text-sm"><WifiOff className="w-4 h-4" /> 離線</span>
          )}
          <button
            onClick={fetchSignals}
            className="btn-primary flex items-center gap-2 px-4 py-2"
          >
            <RefreshCw className="w-4 h-4" /> 刷新
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg px-4 py-2 text-yellow-300 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="活躍信號" value={stats.total} color="text-primary" />
        <StatCard label="反彈信號" value={stats.bounce_count} color="text-emerald-400" />
        <StatCard label="回調信號" value={stats.pullback_count} color="text-red-400" />
        <StatCard label="極高緊急" value={stats.critical_count} color="text-orange-400" />
        <StatCard label="平均信心度" value={`${stats.avg_confidence?.toFixed(1)}%`} color="text-purple-400" />
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
        {/* Timeframe */}
        <div className="flex gap-1">
          {timeframeOptions.map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${timeframe === tf ? 'bg-primary text-black' : 'bg-gray-700/60 text-gray-300 hover:bg-gray-600'}`}
            >
              {tf || '全部'}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-gray-600" />

        {/* Signal type */}
        <div className="flex gap-1">
          {signalTypeOptions.map(o => (
            <button
              key={o.value}
              onClick={() => setSignalType(o.value)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${signalType === o.value ? 'bg-primary text-black' : 'bg-gray-700/60 text-gray-300 hover:bg-gray-600'}`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-gray-600" />

        {/* Urgency */}
        <div className="flex gap-1">
          {urgencyOptions.map(o => (
            <button
              key={o.value}
              onClick={() => setUrgency(o.value)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${urgency === o.value ? 'bg-primary text-black' : 'bg-gray-700/60 text-gray-300 hover:bg-gray-600'}`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-gray-600" />

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-gray-700/60 text-gray-300 text-xs rounded px-2 py-1 border border-gray-600 focus:outline-none"
        >
          {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-400">自動更新:</span>
          {(['off', '30m', 'realtime'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setAutoRefresh(mode)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${autoRefresh === mode ? 'bg-secondary text-white' : 'bg-gray-700/60 text-gray-300 hover:bg-gray-600'}`}
            >
              {mode === 'off' ? '關閉' : mode === '30m' ? '30分鐘' : '即時'}
            </button>
          ))}
        </div>
      </div>

      {/* Auto-refresh status banner */}
      {autoRefresh !== 'off' && (
        <div className="bg-secondary/10 border border-secondary/30 rounded px-4 py-2 text-xs text-secondary flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          {autoRefresh === 'realtime' ? '即時模式 — 每 10 秒自動更新' : '定時模式 — 每 30 分鐘自動更新'}
        </div>
      )}

      {/* Signal grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" /> 載入中...
        </div>
      ) : signals.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>暫無符合條件的信號</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {signals.map((s) => (
            <SignalCard key={s.id} signal={s} onClick={() => setSelected(s)} />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && <DetailModal signal={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
