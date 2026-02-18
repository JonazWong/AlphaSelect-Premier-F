'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Activity, DollarSign, Percent, BarChart3 } from 'lucide-react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface TickerData {
  symbol: string
  lastPrice: number
  fairPrice: number
  indexPrice: number
  fundingRate: number
  openInterest: number
  volume24: number
  riseFallRate: number
  high24Price: number
  low24Price: number
}

export default function CryptoRadarPage() {
  const [direction, setDirection] = useState<'long' | 'short'>('long')
  const [selectedSymbol, setSelectedSymbol] = useState('BTC_USDT')
  const [tickerData, setTickerData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const popularSymbols = [
    'BTC_USDT',
    'ETH_USDT',
    'SOL_USDT',
    'BNB_USDT',
    'XRP_USDT',
    'ADA_USDT',
  ]

  const fetchTickerData = async (symbol: string) => {
    setLoading(true)
    setError('')
    try {
      const response = await axios.get(`${API_URL}/api/v1/contract/ticker/${symbol}`)
      if (response.data.success) {
        const data = response.data.data.data || response.data.data
        setTickerData(data)
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch ticker data'
      setError(errorMessage)
      console.error('Error fetching ticker:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickerData(selectedSymbol)
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchTickerData(selectedSymbol).catch(err => {
        console.error('Auto-refresh failed:', err)
      })
    }, 30000)
    
    return () => clearInterval(interval)
  }, [selectedSymbol])

  const formatNumber = (num: number, decimals: number = 2) => {
    return num?.toFixed(decimals) || '0.00'
  }

  const formatPercent = (num: number) => {
    return `${num > 0 ? '+' : ''}${(num * 100).toFixed(4)}%`
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-gradient-cyan-purple">Contract Trading Radar</span>
          </h1>
          <p className="text-gray-400">
            Real-time MEXC contract analysis with AI-powered signals
          </p>
        </div>
        
        {/* Direction Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setDirection('long')}
            className={`px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              direction === 'long'
                ? 'bg-accent text-black shadow-neon-green'
                : 'bg-card text-gray-400 hover:bg-card/70'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            LONG
          </button>
          <button
            onClick={() => setDirection('short')}
            className={`px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              direction === 'short'
                ? 'bg-red-500 text-white shadow-red-500/50'
                : 'bg-card text-gray-400 hover:bg-card/70'
            }`}
          >
            <TrendingDown className="w-5 h-5" />
            SHORT
          </button>
        </div>
      </div>

      {/* Symbol Selection */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">Select Trading Pair</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {popularSymbols.map((symbol) => (
            <button
              key={symbol}
              onClick={() => setSelectedSymbol(symbol)}
              className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                selectedSymbol === symbol
                  ? 'bg-primary text-black shadow-neon-cyan'
                  : 'bg-card hover:bg-card/70 text-gray-300'
              }`}
            >
              {symbol.replace('_USDT', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      {loading && (
        <div className="glass-card p-12 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading market data...</p>
        </div>
      )}

      {error && (
        <div className="glass-card p-6 bg-red-500/10 border-red-500/50">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {!loading && !error && tickerData && (
        <>
          {/* Price Overview */}
          <div className="grid md:grid-cols-4 gap-6">
            <div className="glass-card p-6 neon-glow">
              <div className="flex items-center gap-2 mb-2 text-gray-400">
                <DollarSign className="w-5 h-5" />
                <span className="text-sm">Last Price</span>
              </div>
              <div className="text-3xl font-bold font-mono text-primary">
                ${formatNumber(parseFloat(tickerData?.lastPrice || '0'), 4)}
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-2 text-gray-400">
                <Activity className="w-5 h-5" />
                <span className="text-sm">24h Change</span>
              </div>
              <div className={`text-3xl font-bold font-mono ${
                parseFloat(tickerData?.riseFallRate || '0') > 0 ? 'text-accent' : 'text-red-500'
              }`}>
                {formatPercent(parseFloat(tickerData?.riseFallRate || '0'))}
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-2 text-gray-400">
                <Percent className="w-5 h-5" />
                <span className="text-sm">Funding Rate</span>
              </div>
              <div className={`text-3xl font-bold font-mono ${
                parseFloat(tickerData?.fundingRate || '0') > 0 ? 'text-red-500' : 'text-accent'
              }`}>
                {formatPercent(parseFloat(tickerData?.fundingRate || '0'))}
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-2 text-gray-400">
                <BarChart3 className="w-5 h-5" />
                <span className="text-sm">Open Interest</span>
              </div>
              <div className="text-3xl font-bold font-mono text-secondary">
                ${(parseFloat(tickerData?.openInterest || '0') / 1000000).toFixed(2)}M
              </div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-6">Market Statistics</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-400 mb-1">Index Price</div>
                <div className="text-xl font-mono text-white">
                  ${formatNumber(parseFloat(tickerData?.indexPrice || '0'), 4)}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-400 mb-1">Fair Price (Mark)</div>
                <div className="text-xl font-mono text-white">
                  ${formatNumber(parseFloat(tickerData?.fairPrice || '0'), 4)}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-400 mb-1">24h Volume</div>
                <div className="text-xl font-mono text-white">
                  ${(parseFloat(tickerData?.volume24 || '0') / 1000000).toFixed(2)}M
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-400 mb-1">24h High</div>
                <div className="text-xl font-mono text-accent">
                  ${formatNumber(parseFloat(tickerData?.high24Price || '0'), 4)}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-400 mb-1">24h Low</div>
                <div className="text-xl font-mono text-red-500">
                  ${formatNumber(parseFloat(tickerData?.low24Price || '0'), 4)}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-400 mb-1">Basis</div>
                <div className="text-xl font-mono text-white">
                  ${formatNumber(parseFloat(tickerData?.lastPrice || '0') - parseFloat(tickerData?.indexPrice || '0'), 4)}
                </div>
              </div>
            </div>
          </div>

          {/* Trading Signal Card */}
          <div className={`glass-card p-8 ${
            direction === 'long' ? 'border-accent' : 'border-red-500'
          } border-2`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                {direction === 'long' ? (
                  <>
                    <TrendingUp className="w-8 h-8 text-accent" />
                    <span className="text-accent">LONG Signal</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-8 h-8 text-red-500" />
                    <span className="text-red-500">SHORT Signal</span>
                  </>
                )}
              </h3>
              
              <div className="text-right">
                <div className="text-sm text-gray-400">Confidence Score</div>
                <div className="text-3xl font-bold text-primary">75%*</div>
              </div>
            </div>
            
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
              <p className="text-sm text-yellow-500">
                ⚠️ <strong>Disclaimer:</strong> The values below are placeholder examples for UI demonstration purposes only. 
                They are NOT real AI-generated trading signals. Actual AI prediction features will be implemented in Phase 2.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-400 mb-2">Entry Price</div>
                <div className="text-2xl font-mono font-bold text-white">
                  ${formatNumber(parseFloat(tickerData?.lastPrice || '0'), 4)}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-400 mb-2">Stop Loss (Example)*</div>
                <div className="text-2xl font-mono font-bold text-red-500">
                  ${formatNumber(parseFloat(tickerData?.lastPrice || '0') * (direction === 'long' ? 0.97 : 1.03), 4)}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-400 mb-2">Take Profit (Example)*</div>
                <div className="text-2xl font-mono font-bold text-accent">
                  ${formatNumber(parseFloat(tickerData?.lastPrice || '0') * (direction === 'long' ? 1.05 : 0.95), 4)}
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">Suggested Leverage (Example)*</div>
                  <div className="text-xl font-bold text-secondary">5x - 10x</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-400">Risk Level (Example)*</div>
                  <div className="text-xl font-bold text-yellow-500">Medium</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-xs text-gray-500 text-center">
              * Placeholder values for demonstration only. Not financial advice.
            </div>
          </div>
        </>
      )}
    </div>
  )
}
