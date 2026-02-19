'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { TrendingUp, TrendingDown, Activity, Target } from 'lucide-react'

interface Pattern {
  id: string
  symbol: string
  pattern_type: string
  timeframe: string
  confidence: number
  detected_at: string
  price_at_detection: number
  status: string
  target_price?: number
  stop_loss?: number
}

interface PatternStats {
  pattern_type: string
  total_detected: number
  success_rate: number
  avg_profit: number
}

const TIMEFRAMES = ['15m', '1h', '4h', '1d']

export default function PatternDetectionPage() {
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [patternStats, setPatternStats] = useState<PatternStats[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const fetchPatterns = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/patterns/')
      setPatterns(response.data)
    } catch (error) {
      console.error('Error fetching patterns:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPatternStats = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/patterns/stats/summary')
      setPatternStats(response.data)
    } catch (error) {
      console.error('Error fetching pattern stats:', error)
    }
  }

  useEffect(() => {
    fetchPatterns()
    fetchPatternStats()
    const interval = setInterval(fetchPatterns, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [])

  const handleScan = async () => {
    const symbol = prompt('Enter symbol to scan (e.g., BTC_USDT):')
    if (!symbol) return

    const timeframe = prompt('Enter timeframe (15m, 1h, 4h, 1d):', '1h')
    if (!timeframe) return

    setScanning(true)
    try {
      const response = await axios.post(`http://localhost:8000/api/v1/patterns/scan/${symbol}?timeframe=${timeframe}`)
      await fetchPatterns()
      alert(`Scan complete! Found ${response.data.patterns_detected} patterns.`)
    } catch (error) {
      console.error('Error scanning for patterns:', error)
      alert('Failed to scan for patterns')
    } finally {
      setScanning(false)
    }
  }

  const handleDelete = async (patternId: string) => {
    if (!confirm('Are you sure you want to delete this pattern?')) return
    
    try {
      await axios.delete(`http://localhost:8000/api/v1/patterns/${patternId}`)
      await fetchPatterns()
    } catch (error) {
      console.error('Error deleting pattern:', error)
    }
  }

  const filteredPatterns = patterns.filter(p => {
    if (selectedTimeframe !== 'all' && p.timeframe !== selectedTimeframe) return false
    if (selectedStatus !== 'all' && p.status !== selectedStatus) return false
    return true
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500'
      case 'completed': return 'text-blue-500'
      case 'invalidated': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-500'
      case 'completed': return 'bg-blue-500/20 text-blue-500'
      case 'invalidated': return 'bg-red-500/20 text-red-500'
      default: return 'bg-gray-500/20 text-gray-500'
    }
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500/20 text-green-500'
    if (confidence >= 0.6) return 'bg-yellow-500/20 text-yellow-500'
    return 'bg-red-500/20 text-red-500'
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-gradient-cyan-purple">Pattern Detection</span>
        </h1>
        <p className="text-gray-400">
          Identify chart patterns and technical signals
        </p>
      </div>

      {/* Pattern Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        {patternStats.slice(0, 4).map((stat) => (
          <div key={stat.pattern_type} className="glass-card p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">{stat.pattern_type}</h3>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Total Detected</p>
                <p className="text-xl font-bold">{stat.total_detected}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Success Rate</p>
                <p className="text-lg font-bold text-green-500">{(stat.success_rate * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg Profit</p>
                <p className="text-lg font-bold text-blue-500">{stat.avg_profit.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Actions */}
      <div className="glass-card p-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Timeframe</label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:border-primary focus:outline-none"
                style={{ backgroundColor: '#1F2937', color: '#FFFFFF' }}
              >
                <option value="all">All Timeframes</option>
                {TIMEFRAMES.map(tf => (
                  <option key={tf} value={tf}>{tf}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:border-primary focus:outline-none"
                style={{ backgroundColor: '#1F2937', color: '#FFFFFF' }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="invalidated">Invalidated</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleScan}
            disabled={scanning}
            className="btn-primary"
          >
            {scanning ? 'Scanning...' : 'Scan for Patterns'}
          </button>
        </div>
      </div>

      {/* Patterns List */}
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold mb-6">Detected Patterns ({filteredPatterns.length})</h2>
        
        {loading ? (
          <p className="text-center text-gray-400 py-8">Loading patterns...</p>
        ) : filteredPatterns.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No patterns detected yet</p>
        ) : (
          <div className="space-y-4">
            {filteredPatterns.map((pattern) => (
              <div key={pattern.id} className="border border-gray-700 rounded-lg p-4 hover:border-primary transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-bold">{pattern.symbol}</h3>
                    <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-500 rounded">
                      {pattern.timeframe}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded ${getStatusBadge(pattern.status)}`}>
                      {pattern.status}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(pattern.id)}
                    className="text-red-500 hover:text-red-400 text-sm"
                  >
                    Delete
                  </button>
                </div>

                <div className="mb-3">
                  <h4 className="text-lg font-bold text-primary">{pattern.pattern_type}</h4>
                  <span className={`inline-block px-2 py-1 text-xs rounded mt-1 ${getConfidenceBadge(pattern.confidence)}`}>
                    {(pattern.confidence * 100).toFixed(0)}% Confidence
                  </span>
                </div>

                <div className="grid md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Detection Price</p>
                    <p className="text-lg font-bold">${pattern.price_at_detection.toLocaleString()}</p>
                  </div>

                  {pattern.target_price && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Target Price</p>
                      <p className="text-lg font-bold text-green-500">${pattern.target_price.toLocaleString()}</p>
                    </div>
                  )}

                  {pattern.stop_loss && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Stop Loss</p>
                      <p className="text-lg font-bold text-red-500">${pattern.stop_loss.toLocaleString()}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Detected At</p>
                    <p className="text-sm">{new Date(pattern.detected_at).toLocaleString()}</p>
                  </div>

                  {pattern.target_price && pattern.price_at_detection && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Potential Gain</p>
                      <p className={`text-lg font-bold ${pattern.target_price > pattern.price_at_detection ? 'text-green-500' : 'text-red-500'}`}>
                        {((pattern.target_price - pattern.price_at_detection) / pattern.price_at_detection * 100).toFixed(2)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Pattern Stats */}
      {patternStats.length > 4 && (
        <div className="glass-card p-6">
          <h2 className="text-2xl font-bold mb-6">All Pattern Statistics</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patternStats.map((stat) => (
              <div key={stat.pattern_type} className="border border-gray-700 rounded p-4">
                <h3 className="font-bold mb-2">{stat.pattern_type}</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-400">Detected: <span className="text-white font-bold">{stat.total_detected}</span></p>
                  <p className="text-gray-400">Success: <span className="text-green-500 font-bold">{(stat.success_rate * 100).toFixed(1)}%</span></p>
                  <p className="text-gray-400">Avg Profit: <span className="text-blue-500 font-bold">{stat.avg_profit.toFixed(1)}%</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
