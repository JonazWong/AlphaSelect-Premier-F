'use client'

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Filter, TrendingUp, TrendingDown, RefreshCw, ArrowUpDown } from 'lucide-react'
import '@/i18n/config'
import TimeframeSelector, { Timeframe } from '@/components/TimeframeSelector'
import SymbolSelector from '@/components/SymbolSelector'
import ComparisonSelector from '@/components/ComparisonSelector'
import { SparklineChart } from '@/components/IndicatorChart'
import { generateMockScreenerData, generateMockOHLCV, ScreenerResult } from '@/lib/mockData'

type RiskFilter = 'all' | 'low' | 'medium' | 'high'
type SideFilter = 'both' | 'long' | 'short'
type SortField = 'confidence' | 'change24h' | 'volume24h' | 'fundingRate'

export default function MarketScreenerPage() {
  const { t } = useTranslation('common')
  const [timeframe, setTimeframe] = useState<Timeframe>('1D')
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([])
  const [comparison, setComparison] = useState<string[]>([])
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all')
  const [sideFilter, setSideFilter] = useState<SideFilter>('both')
  const [minConfidence, setMinConfidence] = useState(50)
  const [sortField, setSortField] = useState<SortField>('confidence')
  const [sortAsc, setSortAsc] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const allData = useMemo(() => generateMockScreenerData(20), [refreshKey])

  const filtered = useMemo(() => {
    let data = allData
    if (selectedSymbols.length > 0) {
      data = data.filter((r) => selectedSymbols.includes(r.symbol))
    }
    if (riskFilter !== 'all') {
      data = data.filter((r) => r.riskLevel === riskFilter)
    }
    if (sideFilter !== 'both') {
      data = data.filter((r) => r.side === sideFilter)
    }
    data = data.filter((r) => r.confidence >= minConfidence)
    data = [...data].sort((a, b) => {
      const diff = a[sortField] - b[sortField]
      return sortAsc ? diff : -diff
    })
    return data
  }, [allData, selectedSymbols, riskFilter, sideFilter, minConfidence, sortField, sortAsc])

  const handleRefresh = () => setRefreshKey((k) => k + 1)
  const handleClearFilters = () => {
    setSelectedSymbols([])
    setRiskFilter('all')
    setSideFilter('both')
    setMinConfidence(50)
  }
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc((v) => !v)
    } else {
      setSortField(field)
      setSortAsc(false)
    }
  }

  const riskColors: Record<ScreenerResult['riskLevel'], string> = {
    low: 'text-green-400 bg-green-500/10',
    medium: 'text-yellow-400 bg-yellow-500/10',
    high: 'text-red-400 bg-red-500/10',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Filter className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-1">
              <span className="text-gradient-cyan-purple">{t('marketScreener.title')}</span>
              <span className="ml-3 text-2xl text-gray-500 font-normal">{t('marketScreener.subtitle')}</span>
            </h1>
            <p className="text-gray-400 text-sm">
              {t('marketScreener.description')} &nbsp;/&nbsp; {t('marketScreener.descriptionZh')}
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

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Filter sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-4 space-y-4">
            <h2 className="font-semibold text-sm text-gray-300 flex items-center gap-2">
              <Filter className="w-4 h-4" /> {t('marketScreener.filters')}
            </h2>

            <TimeframeSelector value={timeframe} onChange={setTimeframe} className="flex-col !items-start" />

            <SymbolSelector multi value={selectedSymbols} onChange={setSelectedSymbols} label={t('trade.symbols')} />

            {/* Side filter */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('trade.side')}</label>
              <div className="flex gap-1">
                {(['both', 'long', 'short'] as SideFilter[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSideFilter(s)}
                    aria-pressed={sideFilter === s}
                    className={`flex-1 py-1 rounded text-xs font-medium transition-all focus:outline-none focus:ring-1 focus:ring-primary/50 ${
                      sideFilter === s
                        ? s === 'long' ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                          : s === 'short' ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                          : 'bg-primary/20 text-primary border border-primary/50'
                        : 'bg-card text-gray-500 border border-gray-700 hover:text-gray-300'
                    }`}
                  >
                    {t(`trade.${s}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Risk filter */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('marketScreener.riskLevel')}</label>
              <div className="flex flex-col gap-1">
                {(['all', 'low', 'medium', 'high'] as RiskFilter[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRiskFilter(r)}
                    aria-pressed={riskFilter === r}
                    className={`py-1 px-2 rounded text-xs text-left transition-all focus:outline-none focus:ring-1 focus:ring-primary/50 ${
                      riskFilter === r
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {r === 'all' ? t('marketScreener.allRisk') : t(`marketScreener.${r}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Min confidence */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {t('marketScreener.minConfidence')}: <span className="text-primary font-bold">{minConfidence}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={90}
                step={5}
                value={minConfidence}
                onChange={(e) => setMinConfidence(Number(e.target.value))}
                aria-label={t('marketScreener.minConfidence')}
                className="w-full accent-primary"
              />
            </div>

            <ComparisonSelector items={comparison} onChange={setComparison} />

            <button
              onClick={handleClearFilters}
              className="w-full py-1.5 rounded-lg text-xs text-gray-400 border border-gray-700 hover:text-white hover:border-gray-500 transition-all focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              {t('marketScreener.clearFilters')}
            </button>
          </div>
        </div>

        {/* Results table */}
        <div className="lg:col-span-3">
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-700/50 flex items-center justify-between">
              <span className="text-sm text-gray-400">
                {t('marketScreener.showing', { count: filtered.length })}
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="p-12 text-center">
                <Filter className="w-10 h-10 mx-auto mb-3 text-gray-600" />
                <p className="text-gray-500 text-sm">{t('marketScreener.noResults')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700/50">
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">{t('trade.symbol')}</th>
                      <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium">{t('common.price')}</th>
                      <th
                        className="px-4 py-3 text-right text-xs text-gray-500 font-medium cursor-pointer hover:text-gray-300"
                        onClick={() => toggleSort('change24h')}
                      >
                        <span className="flex items-center justify-end gap-1">
                          {t('common.change')} 24h <ArrowUpDown className="w-3 h-3" />
                        </span>
                      </th>
                      <th
                        className="px-4 py-3 text-right text-xs text-gray-500 font-medium cursor-pointer hover:text-gray-300"
                        onClick={() => toggleSort('confidence')}
                      >
                        <span className="flex items-center justify-end gap-1">
                          {t('common.confidence')} <ArrowUpDown className="w-3 h-3" />
                        </span>
                      </th>
                      <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium">{t('trade.side')}</th>
                      <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium">{t('marketScreener.riskLevel')}</th>
                      <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium w-24">{t('common.price')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row) => (
                      <tr
                        key={row.symbol}
                        className="border-b border-gray-800/50 hover:bg-card/40 transition-colors"
                      >
                        <td className="px-4 py-3 font-bold text-white">{row.symbol}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-200">
                          ${row.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono font-bold ${row.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          <span className="flex items-center justify-end gap-1">
                            {row.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {row.change24h >= 0 ? '+' : ''}{row.change24h.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                                style={{ width: `${row.confidence}%` }}
                              />
                            </div>
                            <span className="font-bold text-primary text-xs">{row.confidence}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            row.side === 'long' ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'
                          }`}>
                            {t(`trade.${row.side}`)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${riskColors[row.riskLevel]}`}>
                            {t(`marketScreener.${row.riskLevel}`)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-24 h-8">
                            <SparklineChart
                              data={generateMockOHLCV(row.symbol, 14)}
                              color={row.change24h >= 0 ? '#22c55e' : '#ef4444'}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
