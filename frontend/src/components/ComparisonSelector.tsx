'use client'

import { useState, KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Plus } from 'lucide-react'
import '@/i18n/config'

const SUGGESTIONS = {
  tickers: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'AVAX', 'DOGE'],
  sectors: ['DeFi', 'Layer 1', 'Layer 2', 'NFT', 'AI Tokens', 'Meme'],
  benchmarks: ['S&P500', 'NASDAQ', 'BTC Dominance', 'Total Market Cap'],
}

interface ComparisonSelectorProps {
  items: string[]
  onChange: (items: string[]) => void
  className?: string
}

export default function ComparisonSelector({ items, onChange, className = '' }: ComparisonSelectorProps) {
  const { t } = useTranslation('common')
  const [input, setInput] = useState('')
  const [activeTab, setActiveTab] = useState<'tickers' | 'sectors' | 'benchmarks'>('tickers')

  const addItem = (val: string) => {
    const trimmed = val.trim().toUpperCase()
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed])
    }
    setInput('')
  }

  const removeItem = (item: string) => {
    onChange(items.filter((i) => i !== item))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addItem(input)
    }
  }

  const tabs: Array<'tickers' | 'sectors' | 'benchmarks'> = ['tickers', 'sectors', 'benchmarks']

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-400 shrink-0">{t('comparison.title')}:</label>
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('comparison.placeholder')}
            aria-label={t('comparison.addItem')}
            className="flex-1 px-3 py-1.5 rounded-lg bg-card border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
          />
          <button
            onClick={() => addItem(input)}
            disabled={!input.trim()}
            aria-label={t('common.add')}
            className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Suggestion tabs */}
      <div>
        <div className="flex gap-1 mb-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2 py-0.5 rounded text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-primary/50 ${
                activeTab === tab
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t(`comparison.${tab}`)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS[activeTab].map((s) => (
            <button
              key={s}
              onClick={() => addItem(s)}
              disabled={items.includes(s.toUpperCase())}
              aria-label={`${t('common.add')} ${s}`}
              className="px-2 py-0.5 rounded text-xs bg-card/50 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      </div>

      {/* Selected items */}
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/10 text-secondary text-xs border border-secondary/30"
            >
              {item}
              <button
                onClick={() => removeItem(item)}
                aria-label={`${t('common.remove')} ${item}`}
                className="hover:text-white focus:outline-none ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-600 italic">{t('comparison.noItems')}</p>
      )}
    </div>
  )
}
