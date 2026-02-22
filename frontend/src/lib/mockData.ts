import { OHLCV } from '@/components/IndicatorChart'

// ─── Types ─────────────────────────────────────────────────────

export interface PredictionResult {
  symbol: string
  direction: 'bullish' | 'bearish' | 'neutral'
  rating: 'strongBuy' | 'buy' | 'hold' | 'sell' | 'strongSell'
  currentPrice: number
  targetPrice: number
  upsidePct: number
  modelAccuracy: number
  forecastPeriod: string
  confidence: number
}

export interface PatternResult {
  symbol: string
  direction: 'bullish' | 'bearish'
  pattern:
    | 'headShoulders'
    | 'inverseHeadShoulders'
    | 'doubleTop'
    | 'doubleBottom'
    | 'tripleTop'
    | 'tripleBottom'
    | 'ascendingTriangle'
    | 'descendingTriangle'
    | 'symmetricalTriangle'
    | 'bullishFlag'
    | 'bearishFlag'
    | 'cupHandle'
    | 'wedge'
    | 'channel'
  status: 'detected' | 'pending' | 'failed'
  completion: number
  reliability: 'high' | 'medium' | 'low'
  breakoutLevel: number
  targetPrice: number
}

export interface ScreenerResult {
  symbol: string
  price: number
  change24h: number
  confidence: number
  side: 'long' | 'short'
  riskLevel: 'low' | 'medium' | 'high'
  volume24h: number
  fundingRate: number
}

// ─── Base prices ────────────────────────────────────────────────

const BASE_PRICES: Record<string, number> = {
  BTCUSDT: 65000,
  ETHUSDT: 3400,
  SOLUSDT: 145,
  BNBUSDT: 580,
  XRPUSDT: 0.54,
  ADAUSDT: 0.45,
  AVAXUSDT: 35,
  DOGEUSDT: 0.12,
  DOTUSDT: 7.5,
  MATICUSDT: 0.88,
  LINKUSDT: 14,
  LTCUSDT: 82,
  UNIUSDT: 9.5,
  ATOMUSDT: 10,
  NEARUSDT: 5.2,
}

const ALL_SYMBOLS = Object.keys(BASE_PRICES)

function seededRand(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return ((s >>> 0) / 0xffffffff)
  }
}

function getBase(symbol: string): number {
  return BASE_PRICES[symbol] ?? 100
}

// ─── OHLCV generator ────────────────────────────────────────────────

export function generateMockOHLCV(symbol: string, days: number): OHLCV[] {
  const rand = seededRand(symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + days)
  const base = getBase(symbol)
  const result: OHLCV[] = []
  let price = base

  const now = new Date()
  for (let i = days; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const label = `${d.getMonth() + 1}/${d.getDate()}`

    const change = (rand() - 0.49) * 0.04 * price
    const open = price
    const close = Math.max(open + change, open * 0.85)
    const high = Math.max(open, close) * (1 + rand() * 0.015)
    const low = Math.min(open, close) * (1 - rand() * 0.015)
    const volume = base * (500 + rand() * 1500)

    result.push({ date: label, open, high, low, close, volume })
    price = close
  }
  return result
}

// ─── Prediction generator ────────────────────────────────────────────────

export function generateMockPredictions(symbols: string[]): PredictionResult[] {
  return symbols.map((symbol) => {
    const rand = seededRand(symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + Date.now() % 1000)
    const base = getBase(symbol)
    const currentPrice = base * (0.95 + rand() * 0.1)
    const bullishBias = rand() > 0.4
    const change = bullishBias
      ? 0.05 + rand() * 0.25
      : -(0.05 + rand() * 0.2)
    const targetPrice = currentPrice * (1 + change)
    const upsidePct = Math.round(change * 1000) / 10
    const confidence = Math.round(55 + rand() * 40)
    const modelAccuracy = Math.round(65 + rand() * 25)

    const ratings: PredictionResult['rating'][] = ['strongBuy', 'buy', 'hold', 'sell', 'strongSell']
    const ratingIdx = bullishBias
      ? Math.floor(rand() * 2)
      : 2 + Math.floor(rand() * 3)

    return {
      symbol,
      direction: change > 0.05 ? 'bullish' : change < -0.05 ? 'bearish' : 'neutral',
      rating: ratings[ratingIdx],
      currentPrice: Math.round(currentPrice * 100) / 100,
      targetPrice: Math.round(targetPrice * 100) / 100,
      upsidePct,
      modelAccuracy,
      forecastPeriod: ['7d', '14d', '30d'][Math.floor(rand() * 3)],
      confidence,
    }
  })
}

// ─── Pattern generator ──────────────────────────────────────────────────

const BULLISH_PATTERNS: PatternResult['pattern'][] = [
  'inverseHeadShoulders', 'doubleBottom', 'tripleBottom',
  'ascendingTriangle', 'bullishFlag', 'cupHandle',
]
const BEARISH_PATTERNS: PatternResult['pattern'][] = [
  'headShoulders', 'doubleTop', 'tripleTop',
  'descendingTriangle', 'bearishFlag', 'wedge',
]

export function generateMockPatterns(symbols: string[]): PatternResult[] {
  const results: PatternResult[] = []
  symbols.forEach((symbol) => {
    const count = 1 + Math.floor(Math.random() * 3)
    for (let j = 0; j < count; j++) {
      const rand = seededRand(symbol.charCodeAt(j % symbol.length) * (j + 1) + Date.now() % 500)
      const bullish = rand() > 0.45
      const patterns = bullish ? BULLISH_PATTERNS : BEARISH_PATTERNS
      const pattern = patterns[Math.floor(rand() * patterns.length)]
      const base = getBase(symbol)
      const breakoutLevel = base * (0.97 + rand() * 0.06)
      const targetPrice = bullish
        ? breakoutLevel * (1.05 + rand() * 0.2)
        : breakoutLevel * (0.75 + rand() * 0.15)
      const reliabilities: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low']
      const statuses: Array<'detected' | 'pending' | 'failed'> = ['detected', 'pending', 'failed']

      results.push({
        symbol,
        direction: bullish ? 'bullish' : 'bearish',
        pattern,
        status: statuses[Math.floor(rand() * 2.5)],
        completion: Math.round(40 + rand() * 60),
        reliability: reliabilities[Math.floor(rand() * 3)],
        breakoutLevel: Math.round(breakoutLevel * 100) / 100,
        targetPrice: Math.round(targetPrice * 100) / 100,
      })
    }
  })
  return results
}

// ─── Screener generator ─────────────────────────────────────────────────

export function generateMockScreenerData(count: number): ScreenerResult[] {
  const pool = [...ALL_SYMBOLS]
  return Array.from({ length: Math.min(count, pool.length) }, (_, i) => {
    const symbol = pool[i]
    const rand = seededRand(symbol.charCodeAt(0) * 17 + i + Date.now() % 300)
    const base = getBase(symbol)
    const price = base * (0.93 + rand() * 0.14)
    const change24h = Math.round((rand() * 20 - 8) * 100) / 100
    const confidence = Math.round(50 + rand() * 45)
    const sides: Array<'long' | 'short'> = ['long', 'short']
    const risks: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high']

    return {
      symbol,
      price: Math.round(price * 100) / 100,
      change24h,
      confidence,
      side: sides[Math.floor(rand() * 2)],
      riskLevel: risks[Math.floor(rand() * 3)],
      volume24h: Math.round(base * (1000 + rand() * 9000)),
      fundingRate: Math.round((rand() * 0.2 - 0.05) * 10000) / 10000,
    }
  })
}
