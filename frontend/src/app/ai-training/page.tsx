'use client'

import { useState, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'

interface ModelMetrics {
  r2_score: number
  mae: number
  rmse: number
  directional_accuracy?: number
}

interface TrainingProgress {
  status: string
  progress: number
  model_type?: string
  epoch?: number
  loss?: number
  metrics?: ModelMetrics
}

interface TrainedModel {
  id: string
  model_type: string
  version: string
  status: string
  metrics: ModelMetrics
  training_completed_at: string
  created_at: string
}

const MODEL_TYPES = [
  { id: 'lstm', name: 'LSTM', description: 'Deep learning for long-term trends', color: 'cyan' },
  { id: 'xgboost', name: 'XGBoost', description: 'Gradient boosting for accuracy', color: 'purple' },
  { id: 'random_forest', name: 'Random Forest', description: 'Ensemble tree-based model', color: 'green' },
  { id: 'arima', name: 'ARIMA', description: 'Time series forecasting', color: 'blue' },
  { id: 'linear_regression', name: 'Linear Regression', description: 'Baseline linear model', color: 'yellow' },
  { id: 'ensemble', name: 'Ensemble', description: 'Combined model predictions', color: 'red' }
]

export default function AITrainingPage() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [selectedSymbol, setSelectedSymbol] = useState('BTC_USDT')
  const [selectedModel, setSelectedModel] = useState('lstm')
  const [isTraining, setIsTraining] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>(null)
  const [trainedModels, setTrainedModels] = useState<TrainedModel[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Check backend health
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/health`, { signal: AbortSignal.timeout(3000) })
        setBackendOnline(res.ok)
      } catch {
        setBackendOnline(false)
      }
    }
    checkHealth()
  }, [])

  // Initialize WebSocket connection
  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000', {
      path: '/ws/socket.io',  // Align with backend Socket.IO mount path
      transports: ['websocket', 'polling']
    })

    socketInstance.on('connect', () => {
      console.log('✅ WebSocket connected')
    })

    socketInstance.on('disconnect', () => {
      console.log('⚠️ WebSocket disconnected')
    })

    socketInstance.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  // Subscribe to training updates
  useEffect(() => {
    if (!socket || !sessionId) return

    const channel = `training:${sessionId}`
    socket.emit('subscribe', { channel })

    socket.on('training_progress', (data: TrainingProgress) => {
      setTrainingProgress(data)
    })

    socket.on('training_complete', (data: { metrics?: ModelMetrics }) => {
      setIsTraining(false)
      setTrainingProgress({ status: 'Completed', progress: 100, metrics: data.metrics })
      fetchTrainedModels()
    })

    socket.on('training_failed', (data: { error: string }) => {
      setIsTraining(false)
      setTrainingProgress({ status: `Failed: ${data.error}`, progress: 0 })
    })

    return () => {
      socket.emit('unsubscribe', { channel })
      socket.off('training_progress')
      socket.off('training_complete')
      socket.off('training_failed')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, sessionId])

  // Fetch trained models
  const fetchTrainedModels = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/ai/training/models/${selectedSymbol}`)
      const data = await response.json()
      setTrainedModels(data.models || [])
    } catch (error:unknown) {
      console.error('Failed to fetch trained models:', error)
    }
  }

  useEffect(() => {
    fetchTrainedModels()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSymbol])

  // Start training
  const startTraining = async () => {
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      console.log('🚀 Starting training...', { symbol: selectedSymbol, model: selectedModel })
      setIsTraining(true)
      setTrainingProgress({ status: 'Initializing...', progress: 0 })

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/ai/training/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedSymbol,
          model_type: selectedModel,
          min_data_points: 100,
          config: {}
        })
      })

      console.log('📡 Response status:', response.status)

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        console.error('❌ Training API error:', errData)
        throw new Error(errData.detail || `Server error ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Training started:', data)

      if (data.session_id) {
        setSessionId(data.session_id)
        setSuccessMsg(`Training started! Session: ${data.session_id.substring(0, 8)}...`)
      }
    } catch (error: unknown) {
      console.error('❌ Failed to start training:', error)
      setIsTraining(false)
      setTrainingProgress(null)
      setErrorMsg(error instanceof Error ? error.message : '無法連接後端，請確認 Docker 服務已啟動（localhost:8000）')
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-gradient-cyan-purple">AI Training Center</span>
        </h1>
        <p className="text-gray-400">
          Train AI models for cryptocurrency price prediction
        </p>
      </div>

      {/* Backend status banner */}
      {backendOnline === false && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 animate-pulse" />
          <span>
            <strong>後端離線</strong> — 無法連接 <code className="bg-black/30 px-1 rounded">localhost:8000</code>。
            請執行 <code className="bg-black/30 px-1 rounded">docker-compose up -d</code> 啟動後端服務後再試。
          </span>
        </div>
      )}
      {backendOnline === true && (
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
          後端已連線
        </div>
      )}

      {/* Success message */}
      {successMsg && (
        <div className="flex items-center justify-between gap-3 px-5 py-4 rounded-xl border border-green-500/40 bg-green-500/10 text-green-300 text-sm">
          <span>✅ {successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-gray-400 hover:text-white shrink-0">✕</button>
        </div>
      )}

      {/* Error message */}
      {errorMsg && (
        <div className="flex items-center justify-between gap-3 px-5 py-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 text-sm">
          <span><span className="font-bold mr-1">✕</span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-gray-400 hover:text-white shrink-0">✕</button>
        </div>
      )}

      {/* Training Configuration */}
      <div className="glass-card p-6 space-y-6">
        <h2 className="text-2xl font-bold">Training Configuration</h2>
        
        {/* Symbol Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Trading Symbol</label>
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="w-full bg-card text-white border border-gray-600 rounded-lg px-4 py-2"
            disabled={isTraining}
          >
            <option value="BTC_USDT">BTC/USDT</option>
            <option value="ETH_USDT">ETH/USDT</option>
            <option value="BNB_USDT">BNB/USDT</option>
          </select>
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium mb-4">Select Model</label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODEL_TYPES.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                disabled={isTraining}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedModel === model.id
                    ? model.color === 'cyan' ? 'border-cyan-500 bg-cyan-500/10' :
                      model.color === 'purple' ? 'border-purple-500 bg-purple-500/10' :
                      model.color === 'green' ? 'border-green-500 bg-green-500/10' :
                      model.color === 'blue' ? 'border-blue-500 bg-blue-500/10' :
                      model.color === 'yellow' ? 'border-yellow-500 bg-yellow-500/10' :
                      'border-red-500 bg-red-500/10'
                    : 'border-gray-600 hover:border-gray-500'
                } ${isTraining ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="font-bold text-lg mb-1">{model.name}</div>
                <div className="text-sm text-gray-400">{model.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Train Button */}
        <button
          onClick={startTraining}
          disabled={isTraining || backendOnline === false}
          className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
            isTraining || backendOnline === false
              ? 'bg-gray-600 cursor-not-allowed opacity-60'
              : 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600'
          }`}
        >
          {isTraining
            ? 'Training in Progress...'
            : backendOnline === false
            ? '後端離線，無法訓練'
            : `Train ${MODEL_TYPES.find(m => m.id === selectedModel)?.name} Model`}
        </button>
      </div>

      {/* Training Progress */}
      {trainingProgress && (
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-2xl font-bold">Training Progress</h2>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{trainingProgress.status}</span>
              <span>{trainingProgress.progress.toFixed(0)}%</span>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-purple-500 h-full transition-all duration-300"
                style={{ width: `${trainingProgress.progress}%` }}
              />
            </div>
          </div>

          {trainingProgress.metrics && trainingProgress.metrics.r2_score !== undefined && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-card p-4 rounded-lg">
                <div className="text-sm text-gray-400">R² Score</div>
                <div className="text-2xl font-bold">{trainingProgress.metrics.r2_score?.toFixed(4) || 'N/A'}</div>
              </div>
              <div className="bg-card p-4 rounded-lg">
                <div className="text-sm text-gray-400">MAE</div>
                <div className="text-2xl font-bold">{trainingProgress.metrics.mae?.toFixed(2) || 'N/A'}</div>
              </div>
              <div className="bg-card p-4 rounded-lg">
                <div className="text-sm text-gray-400">RMSE</div>
                <div className="text-2xl font-bold">{trainingProgress.metrics.rmse?.toFixed(2) || 'N/A'}</div>
              </div>
              {trainingProgress.metrics.directional_accuracy !== undefined && (
                <div className="bg-card p-4 rounded-lg">
                  <div className="text-sm text-gray-400">Dir. Accuracy</div>
                  <div className="text-2xl font-bold">{((trainingProgress.metrics.directional_accuracy || 0) * 100).toFixed(1)}%</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Trained Models */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-2xl font-bold">Trained Models</h2>
        
        {trainedModels.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No trained models yet</p>
        ) : (
          <div className="space-y-3">
            {trainedModels.map((model) => (
              <div key={model.id} className="bg-card p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-lg">{MODEL_TYPES.find(m => m.id === model.model_type)?.name || model.model_type}</div>
                    <div className="text-sm text-gray-400">Version {model.version}</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm ${
                    model.status === 'trained' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {model.status}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                  <div>
                    <div className="text-xs text-gray-400">R² Score</div>
                    <div className="font-bold">{model.metrics?.r2_score?.toFixed(4) || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">MAE</div>
                    <div className="font-bold">{model.metrics?.mae?.toFixed(2) || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">RMSE</div>
                    <div className="font-bold">{model.metrics?.rmse?.toFixed(2) || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Trained</div>
                    <div className="font-bold text-sm">{new Date(model.training_completed_at).toLocaleDateString()}</div>
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
