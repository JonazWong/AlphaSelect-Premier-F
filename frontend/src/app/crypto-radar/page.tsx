'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Zap, Target, Activity, AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import '@/i18n/config';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function formatVolume(v: number | undefined): string {
  if (!v) return '—'
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`
  return `$${v.toLocaleString()}`
}

interface ContractSignal {
  symbol: string;
  direction: 'Long' | 'Short';
  currentPrice: number;
  entryPrice: number;
  stopLoss: number;
  target1: number;
  target2: number;
  leverage: string;
  fundingRate: number;
  openInterest: string;
  openInterestChange: number;
  confidence: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  signals: string[];
  currency?: string;
  priceChange24h?: number;
  volume24h?: number;
}

interface MarketStats {
  strength: number;
  winRate: number;
  avgFundingRate: number;
  totalOI: string;
  currency?: string;
}

export default function CryptoRadar() {
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState<'long' | 'short'>('long');
  const [signals, setSignals] = useState<ContractSignal[]>([]);
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [symbolSearch, setSymbolSearch] = useState('');
  const [minConfidence, setMinConfidence] = useState(0);
  const [riskFilter, setRiskFilter] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');
  const [sortMode, setSortMode] = useState<'confidence_desc' | 'confidence_asc' | 'risk_asc' | 'change_desc'>('confidence_desc');

  const filteredSignals = signals
    .filter(s => symbolSearch === '' || s.symbol.toLowerCase().includes(symbolSearch.toLowerCase()))
    .filter(s => s.confidence >= minConfidence)
    .filter(s => riskFilter === 'All' || s.riskLevel === riskFilter)
    .sort((a, b) => {
      if (sortMode === 'confidence_desc') return b.confidence - a.confidence;
      if (sortMode === 'confidence_asc') return a.confidence - b.confidence;
      if (sortMode === 'risk_asc') {
        const order: Record<string, number> = { Low: 0, Medium: 1, High: 2 };
        return (order[a.riskLevel] ?? 1) - (order[b.riskLevel] ?? 1);
      }
      return (b.openInterestChange ?? 0) - (a.openInterestChange ?? 0);
    });

  // Fetch market statistics
  const fetchMarketStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/contract/market-stats`);
      setMarketStats(response.data);
    } catch (err: unknown) {
      console.error('Failed to fetch market stats:', err);
      // Don't block main data loading, but inform the user that stats may be outdated/unavailable
      setError((prev) => prev ?? t('cryptoRadar.statsUnavailable'));
    }
  };

  // Fetch trading signals
  const fetchSignals = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/api/v1/contract/signals`, {
        params: {
          direction: activeTab,
          limit: 10
        }
      });
      
      setSignals(response.data);
      
    } catch (err: unknown) {
      console.error('Failed to fetch signals:', err);
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { detail?: string } | undefined;
        setError(data?.detail || err.message || t('cryptoRadar.loadError'));
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('cryptoRadar.loadError'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMarketStats();
    fetchSignals();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchSignals(false);
      fetchMarketStats();
    }, 30000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleRefresh = () => {
    fetchSignals(false);
    fetchMarketStats();
  };

  return (
    <div className="min-h-screen p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/50">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-5xl font-bold mb-2">
              <span className="text-gradient-cyan-purple">{t('cryptoRadar.title')}</span>
            </h1>
            <p className="text-xl text-gray-400">
              {t('cryptoRadar.subtitle')}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-6 py-3 rounded-lg bg-card hover:bg-card/70 border border-gray-700 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          {t('cryptoRadar.refresh')}
        </button>
      </div>

      {/* Market Stats */}
      {marketStats && (
        <div className="grid md:grid-cols-4 gap-6">
          <div className="glass-card p-6 bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
            <div className="text-sm text-gray-400 mb-2">{t('cryptoRadar.marketStrength')}</div>
            <div className="text-4xl font-bold text-green-400">
              {marketStats.strength}/10
            </div>
          </div>
          <div className="glass-card p-6 bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/20">
            <div className="text-sm text-gray-400 mb-2">{t('cryptoRadar.winRate30d')}</div>
            <div className="text-4xl font-bold text-gradient-cyan-purple">
              {marketStats.winRate}%
            </div>
          </div>
          <div className="glass-card p-6 bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
            <div className="text-sm text-gray-400 mb-2">{t('cryptoRadar.avgFundingRate')}</div>
            <div className="text-4xl font-bold font-mono text-purple-400">
              {(marketStats.avgFundingRate * 100).toFixed(4)}%
            </div>
          </div>
          <div className="glass-card p-6 bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
            <div className="text-sm text-gray-400 mb-2">{t('cryptoRadar.totalOI')}</div>
            <div className="text-4xl font-bold font-mono text-blue-400">
              {marketStats.totalOI}
            </div>
          </div>
        </div>
      )}

      {/* Direction Tabs */}
      <div className="flex gap-4">
        <button
          onClick={() => setActiveTab('long')}
          className={`px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition-all ${
            activeTab === 'long'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/50'
              : 'bg-card hover:bg-card/70 text-gray-400 border border-gray-700'
          }`}
        >
          <TrendingUp className="w-6 h-6" />
          {t('cryptoRadar.longSignals')}
        </button>
        <button
          onClick={() => setActiveTab('short')}
          className={`px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition-all ${
            activeTab === 'short'
              ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/50'
              : 'bg-card hover:bg-card/70 text-gray-400 border border-gray-700'
          }`}
        >
          <TrendingDown className="w-6 h-6" />
          {t('cryptoRadar.shortSignals')}
        </button>
      </div>

      {/* Filter / Control Bar */}
      <div className="flex flex-wrap gap-3 items-center mb-6 p-4 bg-card rounded-xl border border-gray-700/50">
        {/* Symbol search */}
        <div className="relative">
          <input
            type="text"
            value={symbolSearch}
            onChange={e => setSymbolSearch(e.target.value)}
            placeholder={t('cryptoRadar.searchSymbol', { defaultValue: 'Search symbol...' })}
            className="bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:border-primary focus:outline-none w-48 pr-8"
          />
          {symbolSearch && (
            <button
              onClick={() => setSymbolSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-sm leading-none"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Confidence slider */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400 whitespace-nowrap">
            {t('cryptoRadar.minConfidence', { defaultValue: 'Min Confidence' })}: {minConfidence}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={minConfidence}
            onChange={e => setMinConfidence(Number(e.target.value))}
            className="w-28 accent-cyan-400"
          />
        </div>

        {/* Risk pills */}
        <div className="flex gap-1">
          {(['All', 'Low', 'Medium', 'High'] as const).map(level => (
            <button
              key={level}
              onClick={() => setRiskFilter(level)}
              className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all border ${
                riskFilter === level
                  ? 'bg-primary/20 text-primary border-primary/50'
                  : 'bg-black/20 text-gray-400 border-gray-700'
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-gray-400">{t('cryptoRadar.sortBy', { defaultValue: 'Sort:' })}</span>
          <select
            value={sortMode}
            onChange={e => setSortMode(e.target.value as typeof sortMode)}
            className="bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-primary focus:outline-none"
          >
            <option value="confidence_desc">{t('cryptoRadar.sortConfDesc', { defaultValue: 'Confidence ↓' })}</option>
            <option value="confidence_asc">{t('cryptoRadar.sortConfAsc', { defaultValue: 'Confidence ↑' })}</option>
            <option value="risk_asc">{t('cryptoRadar.sortRisk', { defaultValue: 'Risk ↑' })}</option>
            <option value="change_desc">{t('cryptoRadar.sortChange', { defaultValue: 'OI Change ↓' })}</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="glass-card p-6 bg-red-500/10 border-red-500/50">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-red-400" />
            <div>
              <div className="font-bold text-red-400">{t('cryptoRadar.loadFailed')}</div>
              <div className="text-sm text-gray-400">{error}</div>
            </div>
          </div>
          <button
            onClick={() => fetchSignals()}
            className="px-6 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 transition-all"
          >
            {t('common.retry')}
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="text-center py-12">
          <Activity className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-400">{t('cryptoRadar.loading')}</p>
        </div>
      )}

      {/* Signals Grid */}
      {!loading && !error && filteredSignals.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          {filteredSignals.map((signal, idx) => (
            <div
              key={idx}
              className={`glass-card p-6 bg-gradient-to-br ${
                signal.direction === 'Long'
                  ? 'from-green-500/5 to-transparent border-green-500/20'
                  : 'from-red-500/5 to-transparent border-red-500/20'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      signal.direction === 'Long'
                        ? 'bg-green-500/20 border-2 border-green-500/50'
                        : 'bg-red-500/20 border-2 border-red-500/50'
                    }`}
                  >
                    {signal.direction === 'Long' ? (
                      <TrendingUp className="h-7 w-7 text-green-400" />
                    ) : (
                      <TrendingDown className="h-7 w-7 text-red-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{signal.symbol}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-bold ${
                          signal.direction === 'Long'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                            : 'bg-red-500/20 text-red-400 border border-red-500/50'
                        }`}
                      >
                        {signal.direction}
                      </span>
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/50">
                        {signal.leverage}
                      </span>
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/50">
                        USD
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold font-mono text-primary">
                    ${signal.currentPrice.toLocaleString('en-US')}
                  </div>
                  {signal.priceChange24h !== undefined && (
                    <div className={`text-sm font-semibold mt-1 ${signal.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {signal.priceChange24h >= 0 ? '+' : ''}{signal.priceChange24h.toFixed(2)}%
                    </div>
                  )}
                  <div className="text-sm text-gray-400">Current</div>
                </div>
              </div>

              {/* Trading Levels */}
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-xl bg-black/20 border border-gray-700/50">
                <div>
                  <div className="text-xs text-gray-400 mb-1">{t('cryptoRadar.entryPrice')}</div>
                  <div className="text-lg font-bold font-mono text-cyan-400">
                    ${signal.entryPrice.toFixed(5)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">{t('cryptoRadar.stopLoss')}</div>
                  <div className="text-lg font-bold font-mono text-red-400">
                    ${signal.stopLoss.toFixed(5)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">{t('cryptoRadar.target1')}</div>
                  <div className="text-lg font-bold font-mono text-green-400">
                    ${signal.target1.toFixed(5)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">{t('cryptoRadar.target2')}</div>
                  <div className="text-lg font-bold font-mono text-green-400">
                    ${signal.target2.toFixed(5)}
                  </div>
                </div>
              </div>

              {/* Confidence Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-400">
                    {t('cryptoRadar.aiConfidence')}
                  </span>
                  <span className="font-bold text-primary">{signal.confidence}%</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${signal.confidence}%` }}
                  />
                </div>
              </div>

              {/* Risk Level, OI, and Volume */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <div className="text-xs text-gray-400 mb-1">{t('cryptoRadar.riskLevel')}</div>
                  <span
                    className={`px-3 py-1 rounded-lg text-sm font-bold inline-block ${
                      signal.riskLevel === 'Low'
                        ? 'bg-green-500/20 text-green-400'
                        : signal.riskLevel === 'Medium'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {signal.riskLevel}
                  </span>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">{t('cryptoRadar.oiChange')}</div>
                  <div className="text-sm font-bold text-cyan-400">
                    {(signal.openInterestChange ?? 0) > 0 ? '+' : ''}
                    {(signal.openInterestChange ?? 0).toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">{t('cryptoRadar.volume24h', { defaultValue: 'Vol 24h' })}</div>
                  <div className="text-sm font-bold text-purple-400">
                    {formatVolume(signal.volume24h)}
                  </div>
                </div>
              </div>

              {/* Technical Signals */}
              <div>
                <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  {t('cryptoRadar.techSignals')}
                </div>
                <div className="flex flex-wrap gap-2">
                  {signal.signals.map((sig, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700"
                    >
                      {sig}
                    </span>
                  ))}
                </div>
              </div>

              <span className="text-xs text-gray-600 mt-2 block">Live</span>
            </div>
          ))}
        </div>
      )}

      {/* Empty State — no signals from API */}
      {!loading && !error && signals.length === 0 && (
        <div className="glass-card p-12 text-center">
          <Zap className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-xl text-gray-400">
            {activeTab === 'long' ? t('cryptoRadar.noSignalsLong') : t('cryptoRadar.noSignalsShort')}
          </p>
          <p className="text-sm text-gray-500 mt-2">{t('cryptoRadar.tryLater')}</p>
        </div>
      )}

      {/* Empty State — signals exist but filters hide them all */}
      {!loading && !error && signals.length > 0 && filteredSignals.length === 0 && (
        <div className="glass-card p-12 text-center">
          <Activity className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-xl text-gray-400">
            {t('cryptoRadar.noSignalsFilter', { defaultValue: 'No signals match your filters' })}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {t('cryptoRadar.adjustFilters', { defaultValue: 'Try adjusting the search, confidence threshold, or risk level.' })}
          </p>
        </div>
      )}
    </div>
  );
}
