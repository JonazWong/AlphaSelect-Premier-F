'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Zap, Target, Activity, AlertCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
}

interface MarketStats {
  strength: number;
  winRate: number;
  avgFundingRate: number;
  totalOI: string;
  currency?: string;
}

export default function CryptoRadar() {
  const [activeTab, setActiveTab] = useState<'long' | 'short'>('long');
  const [signals, setSignals] = useState<ContractSignal[]>([]);
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch market statistics
  const fetchMarketStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/contract/market-stats`);
      setMarketStats(response.data);
    } catch (err: unknown) {
      console.error('Failed to fetch market stats:', err);
      // Don't block main data loading, but inform the user that stats may be outdated/unavailable
      setError((prev) => prev ?? '市場統計無法載入，部分指標可能過期或不可用');
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
        setError(data?.detail || err.message || '無法載入數據');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('無法載入數據');
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
              <span className="text-gradient-cyan-purple">合約交易雷達</span>
            </h1>
            <p className="text-xl text-gray-400">
              AI 驅動的永續合約交易信號 (USD)
            </p>
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-6 py-3 rounded-lg bg-card hover:bg-card/70 border border-gray-700 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* Market Stats */}
      {marketStats && (
        <div className="grid md:grid-cols-4 gap-6">
          <div className="glass-card p-6 bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
            <div className="text-sm text-gray-400 mb-2">市場強度</div>
            <div className="text-4xl font-bold text-green-400">
              {marketStats.strength}/10
            </div>
          </div>
          <div className="glass-card p-6 bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/20">
            <div className="text-sm text-gray-400 mb-2">30 天勝率</div>
            <div className="text-4xl font-bold text-gradient-cyan-purple">
              {marketStats.winRate}%
            </div>
          </div>
          <div className="glass-card p-6 bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
            <div className="text-sm text-gray-400 mb-2">平均資金費率</div>
            <div className="text-4xl font-bold font-mono text-purple-400">
              {(marketStats.avgFundingRate * 100).toFixed(4)}%
            </div>
          </div>
          <div className="glass-card p-6 bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
            <div className="text-sm text-gray-400 mb-2">總持倉量</div>
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
          做多信號
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
          做空信號
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="glass-card p-6 bg-red-500/10 border-red-500/50">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-red-400" />
            <div>
              <div className="font-bold text-red-400">載入失敗</div>
              <div className="text-sm text-gray-400">{error}</div>
            </div>
          </div>
          <button
            onClick={() => fetchSignals()}
            className="px-6 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 transition-all"
          >
            重試
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="text-center py-12">
          <Activity className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-400">載入信號中...</p>
        </div>
      )}

      {/* Signals Grid */}
      {!loading && !error && signals.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          {signals.map((signal, idx) => (
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
                  <div className="text-sm text-gray-400">Current</div>
                </div>
              </div>

              {/* Trading Levels */}
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-xl bg-black/20 border border-gray-700/50">
                <div>
                  <div className="text-xs text-gray-400 mb-1">入場價 (USD)</div>
                  <div className="text-lg font-bold font-mono text-cyan-400">
                    ${signal.entryPrice.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">止損 (USD)</div>
                  <div className="text-lg font-bold font-mono text-red-400">
                    ${signal.stopLoss.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">目標 1 (USD)</div>
                  <div className="text-lg font-bold font-mono text-green-400">
                    ${signal.target1.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">目標 2 (USD)</div>
                  <div className="text-lg font-bold font-mono text-green-400">
                    ${signal.target2.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Confidence Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-400">AI 信心分數</span>
                  <span className="font-bold text-primary">{signal.confidence}%</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${signal.confidence}%` }}
                  />
                </div>
              </div>

              {/* Risk Level and OI */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-xs text-gray-400 mb-1">風險等級</div>
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
                  <div className="text-xs text-gray-400 mb-1">持倉量變化</div>
                  <div className="text-sm font-bold text-cyan-400">
                    {(signal.openInterestChange ?? 0) > 0 ? '+' : ''}
                    {(signal.openInterestChange ?? 0).toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Technical Signals */}
              <div>
                <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  技術信號
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
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && signals.length === 0 && (
        <div className="glass-card p-12 text-center">
          <Zap className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-xl text-gray-400">
            當前沒有符合條件的{activeTab === 'long' ? '做多' : '做空'}信號
          </p>
          <p className="text-sm text-gray-500 mt-2">請稍後再試或切換方向</p>
        </div>
      )}
    </div>
  );
}
