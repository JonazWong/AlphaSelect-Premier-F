export type ReversalSignal = {
  id: string
  symbol: string
  direction: 'bullish' | 'bearish'
  urgency: 'critical' | 'high' | 'medium' | 'low'
  signalType: string
  description: string
  rsi: number
  bbPosition: number
  currentPrice: number
  targetPrice: number
  confidence: number
  timestamp?: string
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.length > 0
    ? process.env.NEXT_PUBLIC_API_URL
    : 'http://localhost:8000'

export async function fetchReversalSignals(symbols?: string[]): Promise<ReversalSignal[]> {
  const params = new URLSearchParams()

  if (symbols && symbols.length > 0) {
    params.set('symbols', symbols.join(','))
  }

  const query = params.toString()
  const url = `${API_BASE_URL}/api/v1/reversal/scan${query ? `?${query}` : ''}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch reversal signals (status ${response.status})`)
  }

  const data = await response.json() as { signals: ReversalSignal[]; total: number }
  return data.signals ?? []
}
