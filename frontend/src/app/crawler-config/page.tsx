'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Plus, Trash2, Save, CheckCircle, XCircle, Clock, Settings } from 'lucide-react'
import '@/i18n/config'

interface CrawlerSource {
  id: string
  name: string
  url: string
  interval: number
  enabled: boolean
  lastRun: string
  status: 'success' | 'error' | 'pending'
}

const initialSources: CrawlerSource[] = [
  { id: '1', name: 'MEXC Contract Tickers', url: 'https://contract.mexc.com/api/v1/contract/ticker', interval: 30, enabled: true, lastRun: '30s ago', status: 'success' },
  { id: '2', name: 'MEXC Funding Rates', url: 'https://contract.mexc.com/api/v1/contract/funding_rate', interval: 300, enabled: true, lastRun: '5m ago', status: 'success' },
  { id: '3', name: 'MEXC Open Interest', url: 'https://contract.mexc.com/api/v1/contract/open_interest', interval: 60, enabled: false, lastRun: '1h ago', status: 'error' },
  { id: '4', name: 'MEXC Kline Data', url: 'https://contract.mexc.com/api/v1/contract/kline', interval: 60, enabled: true, lastRun: '1m ago', status: 'pending' },
]

export default function CrawlerConfigPage() {
  const { t } = useTranslation('common')
  const [sources, setSources] = useState<CrawlerSource[]>(initialSources)
  const [showAddForm, setShowAddForm] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newSource, setNewSource] = useState({ name: '', url: '', interval: 60 })

  const toggleEnabled = (id: string) => {
    setSources((prev) => prev.map((s) => s.id === id ? { ...s, enabled: !s.enabled } : s))
  }

  const deleteSource = (id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id))
  }

  const addSource = () => {
    if (!newSource.name || !newSource.url) return
    setSources((prev) => [...prev, {
      id: Date.now().toString(),
      name: newSource.name,
      url: newSource.url,
      interval: newSource.interval,
      enabled: true,
      lastRun: t('crawlerConfig.neverRun'),
      status: 'pending',
    }])
    setNewSource({ name: '', url: '', interval: 60 })
    setShowAddForm(false)
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const statusIcon = {
    success: <CheckCircle className="w-4 h-4 text-green-400" />,
    error: <XCircle className="w-4 h-4 text-red-400" />,
    pending: <Clock className="w-4 h-4 text-yellow-400" />,
  }

  const statusColor = {
    success: 'text-green-400',
    error: 'text-red-400',
    pending: 'text-yellow-400',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Globe className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-1">
              <span className="text-gradient-cyan-purple">{t('crawlerConfig.title')}</span>
              <span className="ml-3 text-2xl text-gray-500 font-normal">{t('crawlerConfig.subtitle')}</span>
            </h1>
            <p className="text-gray-400 text-sm">{t('crawlerConfig.description')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            {t('crawlerConfig.addSource')}
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              saved
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-card border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
            }`}
          >
            <Save className="w-4 h-4" />
            {saved ? t('common.saved') : t('common.save')}
          </button>
        </div>
      </div>

      {/* Add Source Form */}
      {showAddForm && (
        <div className="glass-card p-5 border border-primary/20">
          <h3 className="font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            {t('crawlerConfig.addSource')}
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('crawlerConfig.sourceName')}</label>
              <input
                type="text"
                value={newSource.name}
                onChange={(e) => setNewSource((v) => ({ ...v, name: e.target.value }))}
                placeholder={t('crawlerConfig.sourceNamePlaceholder')}
                className="w-full px-3 py-2 rounded-lg bg-card border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('crawlerConfig.sourceUrl')}</label>
              <input
                type="text"
                value={newSource.url}
                onChange={(e) => setNewSource((v) => ({ ...v, url: e.target.value }))}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg bg-card border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('crawlerConfig.interval')} (s)</label>
              <input
                type="number"
                value={newSource.interval}
                onChange={(e) => setNewSource((v) => ({ ...v, interval: Number(e.target.value) }))}
                min={5}
                className="w-full px-3 py-2 rounded-lg bg-card border border-gray-700 text-white text-sm focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={addSource}
              className="px-4 py-2 rounded-lg bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 text-sm transition-all"
            >
              {t('common.add')}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-lg bg-card border border-gray-700 text-gray-400 hover:text-white text-sm transition-all"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Global Settings */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 text-secondary" />
          {t('crawlerConfig.globalSettings')}
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('crawlerConfig.maxRetries')}</label>
            <input
              type="number"
              defaultValue={3}
              min={1}
              max={10}
              className="w-full px-3 py-2 rounded-lg bg-card border border-gray-700 text-white text-sm focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('crawlerConfig.timeout')} (s)</label>
            <input
              type="number"
              defaultValue={10}
              min={5}
              max={60}
              className="w-full px-3 py-2 rounded-lg bg-card border border-gray-700 text-white text-sm focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('crawlerConfig.rateLimitDelay')} (ms)</label>
            <input
              type="number"
              defaultValue={200}
              min={50}
              step={50}
              className="w-full px-3 py-2 rounded-lg bg-card border border-gray-700 text-white text-sm focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>
      </div>

      {/* Sources Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-700/50 flex items-center justify-between">
          <span className="text-sm text-gray-400">{sources.length} {t('crawlerConfig.sources')}</span>
          <span className="text-xs text-gray-600">{sources.filter((s) => s.enabled).length} {t('crawlerConfig.active')}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">{t('crawlerConfig.sourceName')}</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">URL</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium">{t('crawlerConfig.interval')}</th>
                <th className="px-4 py-3 text-center text-xs text-gray-500 font-medium">{t('crawlerConfig.status')}</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium">{t('crawlerConfig.lastRun')}</th>
                <th className="px-4 py-3 text-center text-xs text-gray-500 font-medium">{t('crawlerConfig.enabled')}</th>
                <th className="px-4 py-3 text-center text-xs text-gray-500 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id} className="border-b border-gray-800/50 hover:bg-card/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{source.name}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs max-w-[200px] truncate">{source.url}</td>
                  <td className="px-4 py-3 text-right text-gray-300">{source.interval}s</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`flex items-center justify-center gap-1 ${statusColor[source.status]}`}>
                      {statusIcon[source.status]}
                      <span className="text-xs">{t(`crawlerConfig.statusValues.${source.status}`)}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">{source.lastRun}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleEnabled(source.id)}
                      aria-pressed={source.enabled}
                      className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                        source.enabled ? 'bg-primary' : 'bg-gray-700'
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        source.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => deleteSource(source.id)}
                      aria-label={t('common.remove')}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
