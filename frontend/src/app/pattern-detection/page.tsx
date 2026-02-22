'use client'

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Zap, RefreshCw, CheckCircle, Clock, XCircle } from 'lucide-react'
import '@/i18n/config'
import TimeframeSelector, { Timeframe } from '@/components/TimeframeSelector'
import SymbolSelector from '@/components/SymbolSelector'
import IndicatorChart, { SparklineChart } from '@/components/IndicatorChart'
import { generateMockPatterns, generateMockOHLCV, PatternResult } from '@/lib/mockData'

const DEFAULT_SYMBOLS = ['BTCUSDT', 'ETHUSDT']

const STATUS_ICONS: Record<PatternResult['status'], React.ElementType> = {
  confirmed: CheckCircle,
  forming: Clock,
  failed: XCircle,
}

const RELIABILITY_COLORS: Record<string, string> = {
  high: 'text-green-400 bg-green-500/10 border-green-500/30',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  low: 'text-red-400 bg-red-500/10 border-red-500/30',
}

const STATUS_COLORS: Record<PatternResult['status'], string> = {
  confirmed: 'text-green-400',
  forming: 'text-yellow-400',
  failed: 'text-red-400',
}

export default function PatternDetectionPage() {
  const { t } = useTranslation('common')
  const [timeframe, setTimeframe] = useState<Timeframe>('1M')
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS)
  const [selectedSymbol, setSelectedSymbol] = useState<string>(DEFAULT_SYMBOLS[0])
  const [refreshKey, setRefreshKey] = useState(0)

  const patterns = useMemo(() => generateMockPatterns(symbols), [symbols, refreshKey])
  const chartData = useMemo(
    () => generateMockOHLCV(selectedSymbol, timeframe === '1D' ? 1 : timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : 90),
    [selectedSymbol, timeframe, refreshKey]
  )

  const handleRefresh = () => setRefreshKey((k) => k + 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
            <Zap className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-1">
              <span className="text-gradient-cyan-purple">{t('patternDetection.title')}</span>
              <span className="ml-3 text-2xl text-gray-500 font-normal">{t('patternDetection.subtitle')}</span>
            </h1>
            <p className="text-gray-400 text-sm">{t('patternDetection.description')}</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          aria-label={t('common.refresh')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <RefreshCw className="w-4 h-4" />
          {t('common.refresh')}
        </button>
      </div>

      {/* Controls */}
      <div className="glass-card p-4 space-y-4">
        <TimeframeSelector value={timeframe} onChange={setTimeframe} />
        <SymbolSelector multi value={symbols} onChange={setSymbols} label={t('trade.symbols')} />
      </div>

      {symbols.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Zap className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">{t('patternDetection.selectSymbolsHint')}</p>
        </div>
      ) : (
        <div className="grid xl:grid-cols-3 gap-6">
          {/* Chart - 2 cols */}
          <div className="xl:col-span-2 space-y-4">
            {/* Symbol switcher */}
            <div className="flex gap-2">
              {symbols.map((sym) => (
                <button
                  key={sym}
                  onClick={() => setSelectedSymbol(sym)}
                  aria-pressed={selectedSymbol === sym}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    selectedSymbol === sym
                      ? 'bg-primary/20 text-primary border border-primary/50'
                      : 'bg-card text-gray-400 border border-gray-700 hover:text-white'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
            <div className="glass-card p-5">
              <IndicatorChart data={chartData} symbol={selectedSymbol} />
            </div>
          </div>

          {/* Pattern list - 1 col, scrollable */}
          <div className="xl:col-span-1">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
              {t('patternDetection.detectedPatterns')} ({patterns.length})
            </h2>
            <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
              {patterns.map((pat, idx) => {
                const StatusIcon = STATUS_ICONS[pat.status]
                return (
                  <div
                    key={idx}
                    className="glass-card p-4 hover:border-gray-600/60 transition-all cursor-pointer"
                    onClick={() => setSelectedSymbol(pat.symbol)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedSymbol(pat.symbol)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="text-xs font-mono text-gray-500">{pat.symbol}</span>
                          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold border px-1.5 py-0.5 rounded ml-1 ${RELIABILITY_COLORS[pat.reliability]}`}>
                            {t(`patternDetection.reliability.${pat.reliability}`)}
                          </span>
                        </div>
                        <div className="font-semibold text-sm text-white">{t(`patternDetection.patterns.${pat.pattern}`, { defaultValue: pat.pattern })}</div>
                      </div>
                      <StatusIcon className={`w-4 h-4 mt-0.5 ${STATUS_COLORS[pat.status]}`} />
                    </div>

                    {/* Mini sparkline */}
                    <div className="h-8 mb-2">
                      <SparklineChart
                        data={generateMockOHLCV(pat.symbol, 14)}
                        color={pat.status === 'confirmed' ? '#22c55e' : pat.status === 'failed' ? '#ef4444' : '#eab308'}
                      />
                    </div>

                    {/* Completion bar */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">{t('patternDetection.completion')}</span>
                        <span className="font-bold" style={{ color: pat.status === 'confirmed' ? '#22c55e' : pat.status === 'failed' ? '#ef4444' : '#eab308' }}>
                          {pat.completion}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden" role="progressbar" aria-valuenow={pat.completion} aria-valuemin={0} aria-valuemax={100}>
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${pat.completion}%`,
                            backgroundColor: pat.status === 'confirmed' ? '#22c55e' : pat.status === 'failed' ? '#ef4444' : '#eab308',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
