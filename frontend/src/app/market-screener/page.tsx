'use client'

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, RefreshCw, TrendingUp, TrendingDown, ChevronUp, ChevronDown } from 'lucide-react'
import '@/i18n/config'
import SymbolSelector from '@/components/SymbolSelector'
import { SparklineChart } from '@/components/IndicatorChart'
import { generateMockScreenerData, generateMockOHLCV, ScreenerResult } from '@/lib/mockData'

type SortKey = 'confidence' | 'change24h'
type SortDir = 'asc' | 'desc'

const RISK_COLORS: Record<string, string> = {
  low: 'text-green-400 bg-green-500/10 border-green-500/30',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  high: 'text-red-400 bg-red-500/10 border-red-500/30',
}

export default function MarketScreenerPage() {
  const { t } = useTranslation('common')

  // Filters
  const [sideFilter, setSideFilter] = useState<'all' | 'long' | 'short'>('all')
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [minConfidence, setMinConfidence] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [watchlistOnly, setWatchlistOnly] = useState(false)
  const [watchedSymbols] = useState<string[]>(['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'])
  const [sortKey, setSortKey] = useState<SortKey>('confidence')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [refreshKey, setRefreshKey] = useState(0)

  const rawData = useMemo(() => generateMockScreenerData(), [refreshKey])

  const filteredData = useMemo(() => {
    let data = rawData
    if (sideFilter !== 'all') data = data.filter((r) => r.side === sideFilter)
    if (riskFilter !== 'all') data = data.filter((r) => r.risk === riskFilter)
    if (minConfidence > 0) data = data.filter((r) => r.confidence >= minConfidence)
    if (searchQuery.trim()) data = data.filter((r) => r.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
    if (watchlistOnly) data = data.filter((r) => watchedSymbols.includes(r.symbol))
    data = [...data].sort((a, b) => {
      const diff = a[sortKey] - b[sortKey]
      return sortDir === 'asc' ? diff : -diff
    })
    return data
  }, [rawData, sideFilter, riskFilter, minConfidence, searchQuery, watchlistOnly, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  const handleRefresh = () => setRefreshKey((k) => k + 1)

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3 ml-0.5 inline" /> : <ChevronDown className="w-3 h-3 ml-0.5 inline" />) : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center shadow-lg shadow-green-500/30">
            <Search className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-1">
              <span className="text-gradient-cyan-purple">{t('marketScreener.title')}</span>
              <span className="ml-3 text-2xl text-gray-500 font-normal">{t('marketScreener.subtitle')}</span>
            </h1>
            <p className="text-gray-400 text-sm">{t('marketScreener.description')}</p>
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
        {/* Sidebar filters */}
        <aside className="lg:col-span-1 space-y-5">
          <div className="glass-card p-5 space-y-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{t('marketScreener.filters')}</h2>

            {/* Search */}
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">{t('common.search')}</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="BTC..."
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-black/30 border border-gray-700 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>

            {/* Side */}
            <div>
              <label className="block text-xs text-gray-500 mb-2">{t('marketScreener.side.label')}</label>
              <div className="grid grid-cols-3 gap-1">
                {(['all', 'long', 'short'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSideFilter(s)}
                    aria-pressed={sideFilter === s}
                    className={`py-1.5 rounded text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                      sideFilter === s
                        ? s === 'long' ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                          : s === 'short' ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : 'bg-primary/20 text-primary border border-primary/40'
                        : 'bg-black/20 text-gray-500 border border-gray-700 hover:text-gray-300'
                    }`}
                  >
                    {t(`marketScreener.side.${s}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Risk */}
            <div>
              <label className="block text-xs text-gray-500 mb-2">{t('marketScreener.risk.label')}</label>
              <div className="space-y-1">
                {(['all', 'low', 'medium', 'high'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRiskFilter(r)}
                    aria-pressed={riskFilter === r}
                    className={`w-full text-left px-3 py-1.5 rounded text-xs transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                      riskFilter === r
                        ? 'bg-primary/20 text-primary border border-primary/40'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-black/20 border border-transparent'
                    }`}
                  >
                    {t(`marketScreener.risk.${r}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Min confidence slider */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-500">{t('marketScreener.minConfidence')}</span>
                <span className="text-primary font-bold">{minConfidence}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={90}
                step={5}
                value={minConfidence}
                onChange={(e) => setMinConfidence(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
                aria-label={t('marketScreener.minConfidence')}
              />
            </div>

            {/* Watchlist only */}
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={watchlistOnly}
                onChange={(e) => setWatchlistOnly(e.target.checked)}
                className="accent-cyan-400 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs text-gray-400 group-hover:text-white transition-colors">{t('marketScreener.watchlistOnly')}</span>
            </label>
          </div>

          {/* Summary stats */}
          <div className="glass-card p-4 grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{filteredData.length}</div>
              <div className="text-xs text-gray-500">{t('marketScreener.results')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {filteredData.filter((r) => r.side === 'long').length}
              </div>
              <div className="text-xs text-gray-500">{t('marketScreener.side.long')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {filteredData.filter((r) => r.side === 'short').length}
              </div>
              <div className="text-xs text-gray-500">{t('marketScreener.side.short')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">
                {filteredData.length > 0 ? Math.round(filteredData.reduce((a, r) => a + r.confidence, 0) / filteredData.length) : 0}%
              </div>
              <div className="text-xs text-gray-500">{t('common.avgConfidence')}</div>
            </div>
          </div>
        </aside>

        {/* Results table */}
        <main className="lg:col-span-3">
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700/50 text-xs text-gray-500 uppercase tracking-widest">
                    <th className="text-left py-3 px-4">{t('marketScreener.columns.symbol')}</th>
                    <th className="text-left py-3 px-4">{t('marketScreener.columns.side')}</th>
                    <th className="text-left py-3 px-4">{t('marketScreener.columns.risk')}</th>
                    <th
                      className="text-right py-3 px-4 cursor-pointer hover:text-primary select-none"
                      onClick={() => toggleSort('confidence')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && toggleSort('confidence')}
                      aria-label={t('marketScreener.columns.confidence')}
                    >
                      {t('marketScreener.columns.confidence')}<SortIcon k="confidence" />
                    </th>
                    <th
                      className="text-right py-3 px-4 cursor-pointer hover:text-primary select-none"
                      onClick={() => toggleSort('change24h')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && toggleSort('change24h')}
                      aria-label={t('marketScreener.columns.change24h')}
                    >
                      {t('marketScreener.columns.change24h')}<SortIcon k="change24h" />
                    </th>
                    <th className="text-right py-3 px-4">{t('marketScreener.columns.volume')}</th>
                    <th className="text-right py-3 px-4 w-24">{t('marketScreener.columns.sparkline')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-gray-600">
                        {t('common.noResults')}
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, idx) => (
                      <tr
                        key={row.symbol}
                        className={`border-b border-gray-800/40 hover:bg-white/2 transition-colors ${
                          idx % 2 === 0 ? 'bg-black/10' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-white">{row.symbol}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                            row.side === 'long' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {row.side === 'long' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            {t(`marketScreener.side.${row.side}`)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs font-semibold border px-1.5 py-0.5 rounded ${RISK_COLORS[row.risk]}`}>
                            {t(`marketScreener.risk.${row.risk}`)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-12 h-1.5 bg-gray-800 rounded-full overflow-hidden" role="progressbar" aria-valuenow={row.confidence} aria-valuemin={0} aria-valuemax={100}>
                              <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                                style={{ width: `${row.confidence}%` }}
                              />
                            </div>
                            <span className="font-bold text-primary min-w-[2.5rem]">{row.confidence}%</span>
                          </div>
                        </td>
                        <td className={`py-3 px-4 text-right font-mono font-bold ${
                          row.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {row.change24h >= 0 ? '+' : ''}{row.change24h.toFixed(2)}%
                        </td>
                        <td className="py-3 px-4 text-right text-gray-400 font-mono text-xs">
                          {row.volume >= 1e9
                            ? `$${(row.volume / 1e9).toFixed(2)}B`
                            : `$${(row.volume / 1e6).toFixed(1)}M`}
                        </td>
                        <td className="py-3 px-4">
                          <div className="w-24 h-8">
                            <SparklineChart
                              data={generateMockOHLCV(row.symbol, 14)}
                              color={row.change24h >= 0 ? '#22c55e' : '#ef4444'}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
