'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Brain, RefreshCw, CheckCircle2, Loader2, XCircle,
  Clock, Database, BarChart3, Zap, Activity, TrendingUp,
  LineChart, Filter, Home, ChevronRight, Trash2, AlertTriangle, FileDown
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const MODEL_LABELS: Record<string, string> = {
  lstm: 'LSTM',
  xgboost: 'XGBoost',
  random_forest: 'Random Forest',
  arima: 'ARIMA',
  linear_regression: 'Linear Regression',
  ensemble: 'Ensemble',
}

const MODEL_COLORS: Record<string, string> = {
  lstm: 'cyan',
  xgboost: 'purple',
  random_forest: 'green',
  arima: 'blue',
  linear_regression: 'yellow',
  ensemble: 'pink',
}

const STATUS_CONFIG = {
  trained: {
    label: '已完成',
    icon: CheckCircle2,
    cls: 'bg-green-500/20 text-green-400 border-green-500/40',
    dot: 'bg-green-400',
  },
  training: {
    label: '訓練中',
    icon: Loader2,
    cls: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
    dot: 'bg-cyan-400 animate-pulse',
  },
  failed: {
    label: '失敗',
    icon: XCircle,
    cls: 'bg-red-500/20 text-red-400 border-red-500/40',
    dot: 'bg-red-400',
  },
}

interface ModelRecord {
  id: string
  symbol: string
  model_type: string
  version: number
  status: 'trained' | 'training' | 'failed'
  metrics: {
    r2_score?: number
    mae?: number
    mse?: number
    rmse?: number
    directional_accuracy?: number
  } | null
  config: Record<string, unknown> | null
  file_path: string | null
  training_started_at: string | null
  training_completed_at: string | null
  created_at: string
  updated_at: string
}

interface Summary {
  total: number
  trained: number
  training: number
  failed: number
}

const navItems = [
  { href: '/', label: '首頁', icon: Home },
  { href: '/crypto-radar', label: '合約雷達', icon: Activity },
  { href: '/ai-training', label: 'AI 訓練', icon: Brain },
  { href: '/ai-training-monitor', label: '訓練記錄', icon: Database },
  { href: '/ai-predictions', label: 'AI 預測', icon: TrendingUp },
  { href: '/pattern-detection', label: '形態偵測', icon: LineChart },
  { href: '/market-screener', label: '市場篩選', icon: Filter },
]

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('zh-HK', { hour12: false })
}

function duration(start: string | null, end: string | null) {
  if (!start || !end) return '—'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return `${m}m ${s % 60}s`
}

function MetricBadge({ label, value, unit = '', color = 'cyan' }: {
  label: string; value?: number | null; unit?: string; color?: string
}) {
  const colorMap: Record<string, string> = {
    cyan: 'text-cyan-400', purple: 'text-purple-400', green: 'text-green-400',
    yellow: 'text-yellow-400', red: 'text-red-400', blue: 'text-blue-400', pink: 'text-pink-400',
  }
  return (
    <div className="bg-black/30 rounded-lg p-3 border border-gray-700/50">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`text-lg font-bold font-mono ${colorMap[color] || 'text-white'}`}>
        {value != null ? `${value.toFixed(4)}${unit}` : '—'}
      </div>
    </div>
  )
}

interface DataStatus {
  symbol: string
  count: number
  min_required: number
  ready: boolean
  missing: number
}

export default function AITrainingMonitorPage() {
  const [summary, setSummary] = useState<Summary>({ total: 0, trained: 0, training: 0, failed: 0 })
  const [models, setModels] = useState<ModelRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filterSymbol, setFilterSymbol] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [dataStatus, setDataStatus] = useState<DataStatus | null>(null)

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const params = new URLSearchParams()
      if (filterSymbol) params.set('symbol', filterSymbol)
      if (filterStatus) params.set('status', filterStatus)
      params.set('limit', '200')
      const res = await fetch(`${API_URL}/api/v1/ai/training/models?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setSummary(data.summary)
      setModels(data.models)
      setLastRefresh(new Date())

      // Fetch data readiness for the selected symbol (or BTC_USDT default)
      const sym = filterSymbol || 'BTC_USDT'
      const dsRes = await fetch(`${API_URL}/api/v1/ai/training/data-status?symbol=${sym}`)
      if (dsRes.ok) setDataStatus(await dsRes.json())
    } catch (e) {
      console.error('Failed to fetch models:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filterSymbol, filterStatus])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh every 15s if any model is still training
  useEffect(() => {
    if (summary.training === 0) return
    const t = setInterval(() => fetchData(true), 15000)
    return () => clearInterval(t)
  }, [summary.training, fetchData])

  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除此模型記錄？此操作無法復原。')) return
    try {
      const res = await fetch(`${API_URL}/api/v1/ai/training/model/${id}`, { method: 'DELETE' })
      if (res.ok) fetchData(true)
    } catch (e) {
      console.error('Delete failed:', e)
    }
  }

  // Unique symbols for filter dropdown
  const symbols = Array.from(new Set(models.map(m => m.symbol)))

  return (
    <div className="min-h-screen p-6 space-y-8">

      {/* ── Page nav ── */}
      <div className="glass-card px-5 py-3">
        <div className="flex flex-wrap items-center gap-1 text-sm">
          {navItems.map((item, i) => {
            const Icon = item.icon
            const isCurrent = item.href === '/ai-training-monitor'
            return (
              <div key={item.href} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3 h-3 text-gray-600" />}
                <Link href={item.href}>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}>
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Database className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">
              <span className="text-gradient-cyan-purple">AI 訓練記錄</span>
            </h1>
            <p className="text-gray-400 mt-1">
              監察所有 AI 模型的訓練狀態、效能指標及資料庫記錄
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-gray-500">
              最後更新：{lastRefresh.toLocaleTimeString('zh-HK', { hour12: false })}
            </span>
          )}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-card hover:bg-card/70 border border-gray-700 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            刷新
          </button>
          <Link href="/ai-training">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-500/40 text-cyan-400 transition-all">
              <Zap className="w-4 h-4" />
              開始訓練
            </button>
          </Link>
        </div>
      </div>

      {/* ── Data readiness banner ── */}
      {dataStatus && (
        <div className={`flex items-center gap-4 px-5 py-4 rounded-xl border ${
          dataStatus.ready
            ? 'border-green-500/30 bg-green-500/5'
            : 'border-yellow-500/30 bg-yellow-500/5'
        }`}>
          {dataStatus.ready
            ? <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
            : <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 animate-pulse" />}
          <div className="flex-1">
            <div className={`font-semibold text-sm ${dataStatus.ready ? 'text-green-400' : 'text-yellow-400'}`}>
              {dataStatus.symbol} 訓練數據：{dataStatus.count.toLocaleString()} 筆
              {dataStatus.ready
                ? '　✓ 已達到訓練門檻（100 筆）'
                : `　— 尚差 ${dataStatus.missing} 筆才能訓練`}
            </div>
            {!dataStatus.ready && (
              <div className="text-xs text-gray-400 mt-1">
                請先執行 <code className="bg-black/40 px-1.5 py-0.5 rounded text-yellow-300">quick_collect_100.bat</code> 收集數據，
                或重複呼叫 <code className="bg-black/40 px-1.5 py-0.5 rounded text-yellow-300">GET /api/v1/contract/ticker/{dataStatus.symbol}</code> 累積到 100 筆後再訓練。
              </div>
            )}
          </div>
          {/* Progress bar */}
          <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
            <div className="text-xs text-gray-400">{Math.min(100, Math.round(dataStatus.count / dataStatus.min_required * 100))}%</div>
            <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  dataStatus.ready ? 'bg-green-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${Math.min(100, dataStatus.count / dataStatus.min_required * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-6 bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/20">
          <div className="flex items-center gap-3 mb-3">
            <Database className="w-5 h-5 text-cyan-400" />
            <span className="text-sm text-gray-400">總模型數</span>
          </div>
          <div className="text-4xl font-bold text-cyan-400">{summary.total}</div>
        </div>
        <div className="glass-card p-6 bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="text-sm text-gray-400">已完成</span>
          </div>
          <div className="text-4xl font-bold text-green-400">{summary.trained}</div>
        </div>
        <div className="glass-card p-6 bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/20">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
            <span className="text-sm text-gray-400">訓練中</span>
          </div>
          <div className="text-4xl font-bold text-cyan-300">
            {summary.training}
            {summary.training > 0 && (
              <span className="ml-2 text-xs font-normal text-cyan-500 animate-pulse">● 進行中</span>
            )}
          </div>
        </div>
        <div className="glass-card p-6 bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
          <div className="flex items-center gap-3 mb-3">
            <XCircle className="w-5 h-5 text-red-400" />
            <span className="text-sm text-gray-400">失敗</span>
          </div>
          <div className="text-4xl font-bold text-red-400">{summary.failed}</div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="glass-card p-5 flex flex-wrap items-center gap-4">
        <BarChart3 className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="text-sm text-gray-400">篩選：</span>
        <select
          value={filterSymbol}
          onChange={e => setFilterSymbol(e.target.value)}
          className="bg-card text-white border border-gray-600 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">全部交易對</option>
          {symbols.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-card text-white border border-gray-600 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">全部狀態</option>
          <option value="trained">已完成</option>
          <option value="training">訓練中</option>
          <option value="failed">失敗</option>
        </select>
        {(filterSymbol || filterStatus) && (
          <button
            onClick={() => { setFilterSymbol(''); setFilterStatus('') }}
            className="text-xs text-gray-400 hover:text-white underline"
          >
            清除篩選
          </button>
        )}
        <span className="ml-auto text-sm text-gray-500">顯示 {models.length} 筆記錄</span>
      </div>

      {/* ── Model Cards ── */}
      {loading ? (
        <div className="text-center py-20">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-cyan-400" />
          <p className="text-gray-400">載入模型記錄中...</p>
        </div>
      ) : models.length === 0 ? (
        <div className="glass-card p-16 text-center space-y-4">
          <FileDown className="w-16 h-16 mx-auto text-gray-600" />
          <p className="text-xl text-gray-300 font-semibold">尚無訓練記錄</p>
          <div className="max-w-md mx-auto text-sm text-gray-400 space-y-2 text-left bg-black/30 rounded-xl p-5 border border-gray-700">
            <div className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold shrink-0">第一步</span>
              <span>收集至少 <strong className="text-white">100 筆</strong>市場數據：執行 <code className="bg-black/50 px-1 rounded text-yellow-300">quick_collect_100.bat</code>，或在瀏覽器重複呼叫 Crypto Radar 頁面刷新數據</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold shrink-0">第二步</span>
              <span>前往 AI Training 頁面，選擇交易對 & 模型，按下 <strong className="text-white">Train Model</strong></span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold shrink-0">第三步</span>
              <span>回到此頁查看訓練進度、指標與模型記錄</span>
            </div>
          </div>
          {dataStatus && !dataStatus.ready && (
            <p className="text-sm text-yellow-400">
              目前 BTC_USDT 只有 <strong>{dataStatus.count}</strong> 筆，再收集 <strong>{dataStatus.missing}</strong> 筆即可開始訓練
            </p>
          )}
          {dataStatus?.ready && (
            <Link href="/ai-training">
              <button className="mt-2 px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 font-bold transition-all">
                數據已就緒，立即訓練
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {models.map(model => {
            const sc = STATUS_CONFIG[model.status] || STATUS_CONFIG.failed
            const StatusIcon = sc.icon
            const color = MODEL_COLORS[model.model_type] || 'cyan'
            const colorBorder: Record<string, string> = {
              cyan: 'border-cyan-500/30 from-cyan-500/5',
              purple: 'border-purple-500/30 from-purple-500/5',
              green: 'border-green-500/30 from-green-500/5',
              blue: 'border-blue-500/30 from-blue-500/5',
              yellow: 'border-yellow-500/30 from-yellow-500/5',
              pink: 'border-pink-500/30 from-pink-500/5',
            }
            const colorText: Record<string, string> = {
              cyan: 'text-cyan-400', purple: 'text-purple-400', green: 'text-green-400',
              blue: 'text-blue-400', yellow: 'text-yellow-400', pink: 'text-pink-400',
            }
            return (
              <div key={model.id}
                className={`glass-card p-5 bg-gradient-to-br ${colorBorder[color] || colorBorder.cyan} to-transparent flex flex-col gap-4`}>

                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-black/40 border ${colorBorder[color]?.split(' ')[0]}`}>
                      <Brain className={`w-5 h-5 ${colorText[color]}`} />
                    </div>
                    <div>
                      <div className={`font-bold text-lg ${colorText[color]}`}>
                        {MODEL_LABELS[model.model_type] || model.model_type}
                      </div>
                      <div className="text-sm text-gray-400">{model.symbol} · v{model.version}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${sc.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      <StatusIcon className={`w-3 h-3 ${model.status === 'training' ? 'animate-spin' : ''}`} />
                      {sc.label}
                    </span>
                    <button
                      onClick={() => handleDelete(model.id)}
                      title="刪除記錄"
                      className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metrics Grid */}
                {model.metrics ? (
                  <div className="grid grid-cols-2 gap-2">
                    <MetricBadge label="R² Score" value={model.metrics.r2_score} color={color} />
                    <MetricBadge label="MAE" value={model.metrics.mae} color="yellow" />
                    <MetricBadge label="RMSE" value={model.metrics.rmse} color="purple" />
                    {model.metrics.directional_accuracy != null ? (
                      <MetricBadge
                        label="方向準確率"
                        value={model.metrics.directional_accuracy * 100}
                        unit="%"
                        color="green"
                      />
                    ) : (
                      <MetricBadge label="MSE" value={model.metrics.mse} color="blue" />
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic text-center py-2">
                    {model.status === 'training' ? '訓練中，指標尚未生成...' : '無可用指標'}
                  </div>
                )}

                {/* Training Timeline */}
                <div className="space-y-1.5 text-xs text-gray-400 border-t border-gray-700/50 pt-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>開始：{formatDate(model.training_started_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>完成：{formatDate(model.training_completed_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 shrink-0" />
                    <span>耗時：{duration(model.training_started_at, model.training_completed_at)}</span>
                  </div>
                </div>

                {/* Config & File */}
                {(model.config && Object.keys(model.config).length > 0) && (
                  <details className="text-xs">
                    <summary className="text-gray-500 cursor-pointer hover:text-gray-300 select-none">
                      訓練參數 ▸
                    </summary>
                    <pre className="mt-2 p-2 bg-black/40 rounded text-gray-400 overflow-auto max-h-28 text-[11px]">
                      {JSON.stringify(model.config, null, 2)}
                    </pre>
                  </details>
                )}
                {model.file_path && (
                  <div className="text-xs text-gray-600 truncate" title={model.file_path}>
                    📁 {model.file_path}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
