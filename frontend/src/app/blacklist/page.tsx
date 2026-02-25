'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Lock, Plus, Trash2, Save, Search, Tag, AlertTriangle } from 'lucide-react'
import '@/i18n/config'

interface BlacklistEntry {
  id: string
  value: string
  type: 'symbol' | 'address' | 'keyword'
  reason: string
  addedAt: string
}

const initialEntries: BlacklistEntry[] = [
  { id: '1', value: 'SCAMTOKEN', type: 'symbol', reason: 'Suspected scam token', addedAt: '2026-01-15' },
  { id: '2', value: '0xDEAD...BEEF', type: 'address', reason: 'Known phishing address', addedAt: '2026-01-20' },
  { id: '3', value: 'RUGPULL', type: 'keyword', reason: 'Filter spam signals', addedAt: '2026-02-01' },
  { id: '4', value: 'HONEYPOT', type: 'keyword', reason: 'Filter honeypot alerts', addedAt: '2026-02-05' },
  { id: '5', value: 'FAKEBTC', type: 'symbol', reason: 'Fake BTC derivative', addedAt: '2026-02-10' },
]

const typeColors: Record<BlacklistEntry['type'], string> = {
  symbol: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  address: 'bg-red-500/10 text-red-400 border-red-500/20',
  keyword: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

export default function BlacklistPage() {
  const { t } = useTranslation('common')
  const [entries, setEntries] = useState<BlacklistEntry[]>(initialEntries)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | BlacklistEntry['type']>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newEntry, setNewEntry] = useState<{ value: string; type: BlacklistEntry['type']; reason: string }>({
    value: '',
    type: 'symbol',
    reason: '',
  })

  const filtered = entries.filter((e) => {
    if (filterType !== 'all' && e.type !== filterType) return false
    if (search && !e.value.toLowerCase().includes(search.toLowerCase()) && !e.reason.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const addEntry = () => {
    if (!newEntry.value) return
    setEntries((prev) => [...prev, {
      id: Date.now().toString(),
      value: newEntry.value,
      type: newEntry.type,
      reason: newEntry.reason,
      addedAt: new Date().toISOString().split('T')[0],
    }])
    setNewEntry({ value: '', type: 'symbol', reason: '' })
    setShowAddForm(false)
  }

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const counts = {
    symbol: entries.filter((e) => e.type === 'symbol').length,
    address: entries.filter((e) => e.type === 'address').length,
    keyword: entries.filter((e) => e.type === 'keyword').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30">
            <Lock className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-1">
              <span className="text-gradient-cyan-purple">{t('blacklist.title')}</span>
              <span className="ml-3 text-2xl text-gray-500 font-normal">{t('blacklist.subtitle')}</span>
            </h1>
            <p className="text-gray-400 text-sm">{t('blacklist.description')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            {t('blacklist.addEntry')}
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-orange-400">{counts.symbol}</div>
          <div className="text-xs text-gray-500 mt-1">{t('blacklist.types.symbol')}</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{counts.address}</div>
          <div className="text-xs text-gray-500 mt-1">{t('blacklist.types.address')}</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{counts.keyword}</div>
          <div className="text-xs text-gray-500 mt-1">{t('blacklist.types.keyword')}</div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-yellow-300">{t('blacklist.warning')}</p>
      </div>

      {/* Add Entry Form */}
      {showAddForm && (
        <div className="glass-card p-5 border border-red-500/20">
          <h3 className="font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-red-400" />
            {t('blacklist.addEntry')}
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('blacklist.entryType')}</label>
              <select
                value={newEntry.type}
                onChange={(e) => setNewEntry((v) => ({ ...v, type: e.target.value as BlacklistEntry['type'] }))}
                className="w-full px-3 py-2 rounded-lg bg-card border border-gray-700 text-white text-sm focus:outline-none focus:border-primary/50"
              >
                <option value="symbol">{t('blacklist.types.symbol')}</option>
                <option value="address">{t('blacklist.types.address')}</option>
                <option value="keyword">{t('blacklist.types.keyword')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('blacklist.value')}</label>
              <input
                type="text"
                value={newEntry.value}
                onChange={(e) => setNewEntry((v) => ({ ...v, value: e.target.value }))}
                placeholder={t('blacklist.valuePlaceholder')}
                className="w-full px-3 py-2 rounded-lg bg-card border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('blacklist.reason')}</label>
              <input
                type="text"
                value={newEntry.reason}
                onChange={(e) => setNewEntry((v) => ({ ...v, reason: e.target.value }))}
                placeholder={t('blacklist.reasonPlaceholder')}
                className="w-full px-3 py-2 rounded-lg bg-card border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={addEntry}
              className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 text-sm transition-all"
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

      {/* Filters & Search */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('common.search')}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-card border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-primary/50"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'symbol', 'address', 'keyword'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              aria-pressed={filterType === type}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterType === type
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-card text-gray-500 border border-gray-700 hover:text-gray-300'
              }`}
            >
              {type === 'all' ? t('blacklist.allTypes') : t(`blacklist.types.${type}`)}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500 ml-auto">{filtered.length} {t('blacklist.entries')}</span>
      </div>

      {/* Entries Table */}
      <div className="glass-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Lock className="w-10 h-10 mx-auto mb-3 text-gray-600" />
            <p className="text-gray-500 text-sm">{t('blacklist.noEntries')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">{t('blacklist.value')}</th>
                  <th className="px-4 py-3 text-center text-xs text-gray-500 font-medium">
                    <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {t('blacklist.entryType')}</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">{t('blacklist.reason')}</th>
                  <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium">{t('blacklist.addedAt')}</th>
                  <th className="px-4 py-3 text-center text-xs text-gray-500 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-800/50 hover:bg-card/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-white">{entry.value}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${typeColors[entry.type]}`}>
                        {t(`blacklist.types.${entry.type}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{entry.reason}</td>
                    <td className="px-4 py-3 text-right text-gray-500 text-xs">{entry.addedAt}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => deleteEntry(entry.id)}
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
        )}
      </div>
    </div>
  )
}
