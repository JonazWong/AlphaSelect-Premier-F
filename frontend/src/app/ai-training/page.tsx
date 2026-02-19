'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

interface AIModel {
  id: string
  symbol: string
  model_type: string
  version: number
  status: string
  metrics?: {
    r2_score: number
    mae: number
    mse: number
    rmse: number
    directional_accuracy: number
  }
  training_started_at?: string
  training_completed_at?: string
  created_at: string
}

const MODEL_TYPES = [
  { value: 'lstm', label: 'LSTM (Long Short-Term Memory)' },
  { value: 'xgboost', label: 'XGBoost' },
  { value: 'random_forest', label: 'Random Forest' },
  { value: 'ensemble', label: 'Ensemble Model' }
]

export default function AITrainingPage() {
  const [models, setModels] = useState<AIModel[]>([])
  const [loading, setLoading] = useState(true)
  const [training, setTraining] = useState(false)
  
  // Form state
  const [symbol, setSymbol] = useState('BTC_USDT')
  const [modelType, setModelType] = useState('lstm')
  const [epochs, setEpochs] = useState(100)
  const [lookbackDays, setLookbackDays] = useState(30)

  const fetchModels = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/ai-training/models')
      setModels(response.data)
    } catch (error) {
      console.error('Error fetching models:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchModels()
    const interval = setInterval(fetchModels, 5000) // Refresh every 5s
    return () => clearInterval(interval)
  }, [])

  const handleTrain = async () => {
    setTraining(true)
    try {
      await axios.post('http://localhost:8000/api/v1/ai-training/train', {
        symbol,
        model_type: modelType,
        epochs,
        lookback_days: lookbackDays,
        prediction_horizon: 24
      })
      await fetchModels()
      alert('Training started successfully!')
    } catch (error) {
      console.error('Error starting training:', error)
      alert('Failed to start training')
    } finally {
      setTraining(false)
    }
  }

  const handleDelete = async (modelId: string) => {
    if (!confirm('Are you sure you want to delete this model?')) return
    
    try {
      await axios.delete(`http://localhost:8000/api/v1/ai-training/models/${modelId}`)
      await fetchModels()
    } catch (error) {
      console.error('Error deleting model:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'trained': return 'text-green-500'
      case 'training': return 'text-yellow-500'
      case 'failed': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'trained': return 'bg-green-500/20 text-green-500'
      case 'training': return 'bg-yellow-500/20 text-yellow-500'
      case 'failed': return 'bg-red-500/20 text-red-500'
      default: return 'bg-gray-500/20 text-gray-500'
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-gradient-cyan-purple">AI Training Center</span>
        </h1>
        <p className="text-gray-400">
          Train AI models for cryptocurrency price prediction
        </p>
      </div>

      {/* Training Form */}
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold mb-6">Train New Model</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Trading Pair</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:border-primary focus:outline-none"
              placeholder="BTC_USDT"
              style={{ backgroundColor: '#1F2937', color: '#FFFFFF', caretColor: '#FFFFFF' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Model Type</label>
            <select
              value={modelType}
              onChange={(e) => setModelType(e.target.value)}
              className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:border-primary focus:outline-none"
              style={{ backgroundColor: '#1F2937', color: '#FFFFFF' }}
            >
              {MODEL_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Training Epochs</label>
            <input
              type="number"
              value={epochs}
              onChange={(e) => setEpochs(parseInt(e.target.value))}
              className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:border-primary focus:outline-none"
              style={{ backgroundColor: '#1F2937', color: '#FFFFFF', caretColor: '#FFFFFF' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Lookback Days</label>
            <input
              type="number"
              value={lookbackDays}
              onChange={(e) => setLookbackDays(parseInt(e.target.value))}
              className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:border-primary focus:outline-none"
              style={{ backgroundColor: '#1F2937', color: '#FFFFFF', caretColor: '#FFFFFF' }}
            />
          </div>
        </div>

        <button
          onClick={handleTrain}
          disabled={training}
          className="btn-primary mt-6"
        >
          {training ? 'Starting Training...' : 'Start Training'}
        </button>
      </div>

      {/* Models List */}
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold mb-6">Trained Models ({models.length})</h2>
        
        {loading ? (
          <p className="text-center text-gray-400 py-8">Loading models...</p>
        ) : models.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No models trained yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4">Symbol</th>
                  <th className="text-left py-3 px-4">Model Type</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">R² Score</th>
                  <th className="text-left py-3 px-4">Accuracy</th>
                  <th className="text-left py-3 px-4">Created</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {models.map((model) => (
                  <tr key={model.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4 font-bold">{model.symbol}</td>
                    <td className="py-3 px-4">{model.model_type}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 text-xs rounded ${getStatusBadge(model.status)}`}>
                        {model.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {model.metrics?.r2_score ? model.metrics.r2_score.toFixed(3) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {model.metrics?.directional_accuracy 
                        ? (model.metrics.directional_accuracy * 100).toFixed(1) + '%' 
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {new Date(model.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleDelete(model.id)}
                        className="text-red-500 hover:text-red-400 text-sm"
                      >
                        Delete
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
