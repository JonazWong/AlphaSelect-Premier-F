'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

interface Prediction {
  id: string
  symbol: string
  model_type: string
  prediction_type: string
  predicted_value: number
  confidence_score: number
  prediction_horizon: number
  prediction_time: string
  target_time: string
  actual_value?: number
}

interface ModelAccuracy {
  model_type: string
  total_predictions: number
  avg_confidence: number
  accuracy_rate: number
}

export default function AIPredictionsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [accuracyStats, setAccuracyStats] = useState<ModelAccuracy[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSymbol, setSelectedSymbol] = useState<string>('all')
  const [selectedModel, setSelectedModel] = useState<string>('all')
  const [generating, setGenerating] = useState(false)

  const fetchPredictions = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/predictions/')
      setPredictions(response.data)
    } catch (error) {
      console.error('Error fetching predictions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAccuracyStats = async () => {
    const modelTypes = ['lstm', 'xgboost', 'random_forest', 'ensemble']
    const stats = []
    
    for (const model of modelTypes) {
      try {
        const response = await axios.get(`http://localhost:8000/api/v1/predictions/accuracy/${model}`)
        stats.push(response.data)
      } catch (error) {
        console.error(`Error fetching accuracy for ${model}:`, error)
      }
    }
    
    setAccuracyStats(stats)
  }

  useEffect(() => {
    fetchPredictions()
    fetchAccuracyStats()
    const interval = setInterval(fetchPredictions, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [])

  const handleGeneratePrediction = async () => {
    const symbol = prompt('Enter symbol (e.g., BTC_USDT):')
    if (!symbol) return

    setGenerating(true)
    try {
      await axios.post(`http://localhost:8000/api/v1/predictions/generate/${symbol}?model_type=ensemble`)
      await fetchPredictions()
      alert('Prediction generated successfully!')
    } catch (error) {
      console.error('Error generating prediction:', error)
      alert('Failed to generate prediction')
    } finally {
      setGenerating(false)
    }
  }

  const filteredPredictions = predictions.filter(p => {
    if (selectedSymbol !== 'all' && p.symbol !== selectedSymbol) return false
    if (selectedModel !== 'all' && p.model_type !== selectedModel) return false
    return true
  })

  const uniqueSymbols = Array.from(new Set(predictions.map(p => p.symbol)))
  const uniqueModels = Array.from(new Set(predictions.map(p => p.model_type)))

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-500'
    if (confidence >= 0.6) return 'text-yellow-500'
    return 'text-red-500'
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
          <span className="text-gradient-cyan-purple">AI Predictions Panel</span>
        </h1>
        <p className="text-gray-400">
          View AI model predictions and forecasts
        </p>
      </div>

      {/* Model Accuracy Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        {accuracyStats.map((stat) => (
          <div key={stat.model_type} className="glass-card p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">{stat.model_type.toUpperCase()}</h3>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Total Predictions</p>
                <p className="text-xl font-bold">{stat.total_predictions}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Accuracy Rate</p>
                <p className="text-lg font-bold text-green-500">{(stat.accuracy_rate * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg Confidence</p>
                <p className="text-lg font-bold text-blue-500">{(stat.avg_confidence * 100).toFixed(1)}%</p>
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
              <label className="block text-sm font-medium mb-2">Symbol</label>
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:border-primary focus:outline-none"
                style={{ backgroundColor: '#1F2937', color: '#FFFFFF' }}
              >
                <option value="all">All Symbols</option>
                {uniqueSymbols.map(symbol => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:border-primary focus:outline-none"
                style={{ backgroundColor: '#1F2937', color: '#FFFFFF' }}
              >
                <option value="all">All Models</option>
                {uniqueModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleGeneratePrediction}
            disabled={generating}
            className="btn-primary"
          >
            {generating ? 'Generating...' : 'Generate Prediction'}
          </button>
        </div>
      </div>

      {/* Predictions List */}
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold mb-6">Recent Predictions ({filteredPredictions.length})</h2>
        
        {loading ? (
          <p className="text-center text-gray-400 py-8">Loading predictions...</p>
        ) : filteredPredictions.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No predictions found</p>
        ) : (
          <div className="space-y-4">
            {filteredPredictions.map((prediction) => (
              <div key={prediction.id} className="border border-gray-700 rounded-lg p-4 hover:border-primary transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-bold">{prediction.symbol}</h3>
                    <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-500 rounded">
                      {prediction.model_type}
                    </span>
                  </div>
                  <span className={`px-3 py-1 text-sm rounded ${getConfidenceBadge(prediction.confidence_score)}`}>
                    {(prediction.confidence_score * 100).toFixed(0)}% Confidence
                  </span>
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Predicted Price</p>
                    <p className="text-lg font-bold text-primary">${prediction.predicted_value.toLocaleString()}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Prediction Horizon</p>
                    <p className="text-lg font-bold">{prediction.prediction_horizon}h</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Prediction Time</p>
                    <p className="text-sm">{new Date(prediction.prediction_time).toLocaleString()}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Target Time</p>
                    <p className="text-sm">{new Date(prediction.target_time).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
