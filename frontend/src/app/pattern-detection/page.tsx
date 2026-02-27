'use client'

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LineChart, TrendingUp, TrendingDown, RefreshCw, CheckCircle, Clock, XCircle } from 'lucide-react'
import '@/i18n/config'
import TimeframeSelector, { Timeframe } from '@/components/TimeframeSelector'
import SymbolSelector from '@/components/SymbolSelector'
import ComparisonSelector from '@/components/ComparisonSelector'
import IndicatorChart from '@/components/IndicatorChart'
import { SparklineChart } from '@/components/IndicatorChart'
import { generateMockPatterns, generateMockOHLCV, PatternResult } from '@/lib/mockData'

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
  const [refreshKey, setRefreshKey] = useState(0)


  const chartData = useMemo(() => {
    if (!selectedSymbol) return []
    const days =
      timeframe === '1D' ? 1 :
      timeframe === '1W' ? 7 :
      timeframe === '1M' ? 30 : 90
    return generateMockOHLCV(selectedSymbol, days)
}, [selectedSymbol, timeframe, refreshKey])
const patterns = useMemo(() => {
  return generateMockPatterns(symbols, timeframe)
}, [symbols, timeframe, refreshKey])

const handleRefresh = () => setRefreshKey((k) => k + 1)

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
        <div className="grid sm:grid-cols-2 gap-4">
          <SymbolSelector multi value={symbols} onChange={setSymbols} label={t('trade.symbols')} />
          <ComparisonSelector items={comparison} onChange={setComparison} />
        </div>
        {symbols.length === 0 && (
          <p className="text-xs text-yellow-400" role="alert">{t('trade.validation.symbolRequired')}</p>
        )}
      </div>

      {symbols.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <LineChart className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">{t('patternDetection.selectSymbolsHint')}</p>
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
            ) : (
              patterns.map((pat, idx) => (
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
