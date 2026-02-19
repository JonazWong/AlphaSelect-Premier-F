'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Search, Filter } from 'lucide-react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function MarketScreenerPage() {
  const [tickers, setTickers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchAllTickers()
    const interval = setInterval(fetchAllTickers, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [])

  const fetchAllTickers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/contract/tickers`)
      if (response.data.success && response.data.data) {
        const tickersArray = Array.isArray(response.data.data) 
          ? response.data.data 
          : response.data.data.data || []
        setTickers(tickersArray.slice(0, 50)) // Show top 50
      }
    } catch (err) {
      console.error('Error fetching tickers:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredTickers = tickers.filter(ticker => 
    ticker.symbol?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-gradient-cyan-purple">Market Screener</span>
        </h1>
        <p className="text-gray-400">
          Real-time market overview for MEXC perpetual contracts
        </p>
      </div>

      {/* Search Bar */}
      <div className="glass-card p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search symbols (e.g., BTC, ETH)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:border-primary focus:outline-none"
              style={{ 
                backgroundColor: '#1F2937',
                color: '#FFFFFF',
                caretColor: '#FFFFFF'
              }}
            />
          </div>
        </div>
      </div>

      {/* Market Table */}
      <div className="glass-card p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading market data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4">Symbol</th>
                  <th className="text-right py-3 px-4">Last Price</th>
                  <th className="text-right py-3 px-4">24h Change</th>
                  <th className="text-right py-3 px-4">24h Volume</th>
                  <th className="text-right py-3 px-4">Funding Rate</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickers.length > 0 ? (
                  filteredTickers.map((ticker, index) => {
                    const priceChange = parseFloat(ticker.riseFallRate || 0)
                    const isPositive = priceChange >= 0
                    
                    return (
                      <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="py-3 px-4 font-medium">{ticker.symbol}</td>
                        <td className="text-right py-3 px-4">${parseFloat(ticker.lastPrice || 0).toFixed(2)}</td>
                        <td className={`text-right py-3 px-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                          <div className="flex items-center justify-end gap-1">
                            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            {(priceChange * 100).toFixed(2)}%
                          </div>
                        </td>
                        <td className="text-right py-3 px-4">
                          ${(parseFloat(ticker.volume24 || 0) / 1000000).toFixed(2)}M
                        </td>
                        <td className="text-right py-3 px-4">
                          {(parseFloat(ticker.fundingRate || 0) * 100).toFixed(4)}%
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">
                      {searchTerm ? 'No symbols found' : 'No data available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold mb-2">About Market Screeneр</h3>
        <p className="text-gray-400 text-sm">
          Real-time data from MEXC perpetual contract markets. Data refreshes automatically every 10 seconds.
          Use the search bar to filter specific trading pairs.
        </p>
      </div>
    </div>
  )
}
