'use client'

import { useState, useRef, useEffect, useId } from 'react'
import { useTranslation } from 'react-i18next'
import { X, ChevronDown } from 'lucide-react'
import '@/i18n/config'

export const SYMBOL_OPTIONS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT',
  'ADAUSDT', 'AVAXUSDT', 'DOGEUSDT', 'DOTUSDT', 'MATICUSDT',
  'LINKUSDT', 'LTCUSDT', 'UNIUSDT', 'ATOMUSDT', 'NEARUSDT',
]

export const WATCHLIST_OPTIONS = [
  'Top 10 by Volume', 'DeFi Tokens', 'Layer 1s', 'Layer 2s', 'Meme Coins',
]

interface SymbolSelectorProps {
  /** If multi=true allows multiple selections, otherwise single selection */
  multi?: boolean
  value: string[]
  onChange: (symbols: string[]) => void
  options?: string[]
  placeholder?: string
  label?: string
  className?: string
}

export default function SymbolSelector({
  multi = true,
  value,
  onChange,
  options = SYMBOL_OPTIONS,
  placeholder,
  label,
  className = '',
}: SymbolSelectorProps) {
  const { t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const listboxId = useId()

  const ph = placeholder ?? (multi ? t('trade.selectSymbols') : t('trade.symbol'))
  const lbl = label ?? t('trade.symbols')

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (sym: string) => {
    if (multi) {
      if (value.includes(sym)) {
        onChange(value.filter((s) => s !== sym))
      } else {
        onChange([...value, sym])
      }
    } else {
      onChange([sym])
      setOpen(false)
    }
  }

  const removeSymbol = (sym: string) => {
    onChange(value.filter((s) => s !== sym))
  }

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className={`relative ${className}`} ref={ref}>
      {lbl && <label className="block text-xs text-gray-400 mb-1">{lbl}</label>}
      <div
        role="combobox"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((o) => !o) } }}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-expanded={open}
        aria-label={lbl}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-card border border-gray-700 text-sm text-white hover:border-gray-500 focus:outline-none focus:border-primary transition-colors cursor-pointer"
      >
        <span className="flex flex-wrap gap-1 flex-1 min-w-0">
          {value.length === 0 ? (
            <span className="text-gray-500">{ph}</span>
          ) : multi ? (
            value.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/20 text-primary text-xs border border-primary/30"
              >
                {s}
                <button
                  onClick={(e) => { e.stopPropagation(); removeSymbol(s) }}
                  aria-label={`${t('common.remove')} ${s}`}
                  className="hover:text-white focus:outline-none"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          ) : (
            <span>{value[0]}</span>
          )}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 ml-2 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div
          role="listbox"
          id={listboxId}
          aria-multiselectable={multi}
          className="absolute z-50 mt-1 w-full rounded-lg bg-card border border-gray-700 shadow-xl overflow-hidden"
        >
          <div className="p-2 border-b border-gray-700">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('common.search')}
              aria-label={t('common.search')}
              className="w-full px-2 py-1 rounded bg-background border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">{t('common.noData')}</div>
            ) : (
              filtered.map((opt) => {
                const selected = value.includes(opt)
                return (
                  <button
                    key={opt}
                    role="option"
                    aria-selected={selected}
                    onClick={() => toggle(opt)}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                      selected
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-300 hover:bg-card/80'
                    }`}
                  >
                    {multi && (
                      <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        selected ? 'bg-primary border-primary' : 'border-gray-500'
                      }`}>
                        {selected && <span className="text-background text-xs font-bold">✓</span>}
                      </span>
                    )}
                    {opt}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
