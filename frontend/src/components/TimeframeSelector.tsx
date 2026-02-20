'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import '@/i18n/config'

export type Timeframe = '1D' | '1W' | '1M' | '3M' | 'custom'

interface TimeframeSelectorProps {
  value: Timeframe
  onChange: (tf: Timeframe, startDate?: string, endDate?: string) => void
  className?: string
}

const PRESETS: Timeframe[] = ['1D', '1W', '1M', '3M', 'custom']

export default function TimeframeSelector({ value, onChange, className = '' }: TimeframeSelectorProps) {
  const { t } = useTranslation('common')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handlePreset = (tf: Timeframe) => {
    if (tf !== 'custom') {
      onChange(tf)
    } else {
      onChange(tf, startDate, endDate)
    }
  }

  const handleApply = () => {
    onChange('custom', startDate, endDate)
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-400 mr-1">{t('timeframe.label')}:</span>
      {PRESETS.map((tf) => (
        <button
          key={tf}
          onClick={() => handlePreset(tf)}
          aria-label={`${t('timeframe.label')} ${t(`timeframe.${tf}`)}`}
          aria-pressed={value === tf}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            value === tf
              ? 'bg-primary/20 text-primary border border-primary/50'
              : 'bg-card/50 text-gray-400 border border-gray-700 hover:text-white hover:border-gray-500'
          }`}
        >
          {t(`timeframe.${tf}`)}
        </button>
      ))}
      {value === 'custom' && (
        <div className="flex items-center gap-2 mt-2 w-full sm:w-auto sm:mt-0">
          <label className="text-xs text-gray-400">{t('timeframe.startDate')}:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            aria-label={t('timeframe.startDate')}
            className="px-2 py-1 rounded bg-card border border-gray-700 text-sm text-white focus:outline-none focus:border-primary"
          />
          <label className="text-xs text-gray-400">{t('timeframe.endDate')}:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            aria-label={t('timeframe.endDate')}
            className="px-2 py-1 rounded bg-card border border-gray-700 text-sm text-white focus:outline-none focus:border-primary"
          />
          <button
            onClick={handleApply}
            className="px-3 py-1 rounded bg-primary/20 text-primary border border-primary/50 text-sm hover:bg-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {t('common.apply')}
          </button>
        </div>
      )}
    </div>
  )
}
