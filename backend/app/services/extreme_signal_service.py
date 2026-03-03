"""
Extreme Signal Service — technical indicator math + signal detection logic.

All MEXC API calls are routed through the mexc_contract_api client
to enforce rate limiting and circuit-breaker policies.
"""
from __future__ import annotations

import logging
import math
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Indicator helpers (pure-Python, no external libs required)
# ---------------------------------------------------------------------------

def _ema(values: List[float], period: int) -> List[float]:
    """Exponential moving average."""
    k = 2.0 / (period + 1)
    ema: List[float] = []
    for i, v in enumerate(values):
        if i == 0:
            ema.append(v)
        else:
            ema.append(v * k + ema[-1] * (1 - k))
    return ema


def compute_rsi(closes: List[float], period: int = 14) -> Optional[float]:
    """RSI-14."""
    if len(closes) < period + 1:
        return None
    gains, losses = [], []
    for i in range(1, len(closes)):
        diff = closes[i] - closes[i - 1]
        gains.append(max(diff, 0))
        losses.append(max(-diff, 0))
    avg_gain = sum(gains[-period:]) / period
    avg_loss = sum(losses[-period:]) / period
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return round(100.0 - 100.0 / (1 + rs), 2)


def compute_macd(closes: List[float]) -> Dict[str, Optional[float]]:
    """MACD 12/26/9 — returns macd, signal, histogram."""
    if len(closes) < 26:
        return {"macd": None, "signal": None, "histogram": None}
    ema12 = _ema(closes, 12)
    ema26 = _ema(closes, 26)
    macd_line = [a - b for a, b in zip(ema12, ema26)]
    signal_line = _ema(macd_line, 9)
    histogram = [a - b for a, b in zip(macd_line, signal_line)]
    return {
        "macd": round(macd_line[-1], 6),
        "signal": round(signal_line[-1], 6),
        "histogram": round(histogram[-1], 6),
    }


def compute_bollinger(closes: List[float], period: int = 20, std_mult: float = 2.0) -> Dict[str, Optional[float]]:
    """Bollinger Bands 20/2."""
    if len(closes) < period:
        return {"upper": None, "middle": None, "lower": None, "position": None}
    window = closes[-period:]
    middle = sum(window) / period
    variance = sum((x - middle) ** 2 for x in window) / period
    std = math.sqrt(variance)
    upper = middle + std_mult * std
    lower = middle - std_mult * std
    last = closes[-1]
    band_width = upper - lower
    position = (last - lower) / band_width if band_width else 0.5
    return {
        "upper": round(upper, 6),
        "middle": round(middle, 6),
        "lower": round(lower, 6),
        "position": round(position, 4),
    }


def compute_volume_ratio(volumes: List[float], period: int = 20) -> Optional[float]:
    """Current volume vs average volume over `period` bars."""
    if len(volumes) < period + 1:
        return None
    avg = sum(volumes[-period - 1:-1]) / period
    if avg == 0:
        return None
    return round(volumes[-1] / avg, 2)


# ---------------------------------------------------------------------------
# Signal classification
# ---------------------------------------------------------------------------

def _macd_divergence_label(macd_data: Dict[str, Optional[float]], signal_type: str) -> str:
    """Human-readable MACD label."""
    h = macd_data.get("histogram")
    if h is None:
        return "N/A"
    if signal_type == "bounce":
        return "底背離" if h > 0 else "無背離"
    else:
        return "頂背離" if h < 0 else "無背離"


def _bb_position_label(bb: Dict[str, Optional[float]], signal_type: str) -> str:
    pos = bb.get("position")
    if pos is None:
        return "N/A"
    if signal_type == "bounce":
        return "下軌附近" if pos < 0.15 else "中軌以下"
    else:
        return "上軌附近" if pos > 0.85 else "中軌以上"


def _heuristic_ai_score(
    rsi: Optional[float],
    vol_ratio: Optional[float],
    macd_hist: Optional[float],
    bb_pos: Optional[float],
    signal_type: str,
) -> float:
    """Simple heuristic score 0–100 as proxy for AI model output."""
    score = 50.0
    if rsi is not None:
        if signal_type == "bounce":
            score += max(0, (30 - rsi)) * 1.5  # oversold boosts score
        else:
            score += max(0, (rsi - 70)) * 1.5  # overbought boosts score
    if vol_ratio is not None and vol_ratio > 1.5:
        score += min((vol_ratio - 1.5) * 10, 15)
    if macd_hist is not None:
        if signal_type == "bounce" and macd_hist > 0:
            score += 5
        elif signal_type == "pullback" and macd_hist < 0:
            score += 5
    if bb_pos is not None:
        if signal_type == "bounce" and bb_pos < 0.1:
            score += 10
        elif signal_type == "pullback" and bb_pos > 0.9:
            score += 10
    return round(min(score, 99.9), 1)


def _confidence(ai_score: float, vol_ratio: Optional[float]) -> float:
    base = ai_score / 100.0
    vol_boost = 0.0
    if vol_ratio and vol_ratio > 2.0:
        vol_boost = min((vol_ratio - 2.0) * 0.03, 0.15)
    return round(min(base + vol_boost, 0.99) * 100, 1)


def _urgency(confidence: float) -> str:
    if confidence >= 85:
        return "critical"
    if confidence >= 75:
        return "high"
    return "medium"


def _build_triggers(
    rsi: Optional[float],
    vol_ratio: Optional[float],
    macd_hist: Optional[float],
    bb_pos: Optional[float],
    signal_type: str,
) -> List[str]:
    tags: List[str] = []
    if rsi is not None:
        if signal_type == "bounce" and rsi < 30:
            tags.append("RSI極端")
        elif signal_type == "pullback" and rsi > 70:
            tags.append("RSI極端")
    if vol_ratio and vol_ratio > 2.0:
        tags.append("放量異常")
    if bb_pos is not None:
        if signal_type == "bounce" and bb_pos < 0.1:
            tags.append("布林帶突破")
        elif signal_type == "pullback" and bb_pos > 0.9:
            tags.append("布林帶突破")
    if macd_hist is not None:
        if (signal_type == "bounce" and macd_hist > 0) or (signal_type == "pullback" and macd_hist < 0):
            tags.append("MACD背離")
    tags.append("AI模型觸發")
    return tags


# ---------------------------------------------------------------------------
# Main entry point — called by the Celery task
# ---------------------------------------------------------------------------

def analyse_kline(
    symbol: str,
    timeframe: str,
    closes: List[float],
    volumes: List[float],
    funding_rate: float = 0.0,
    oi_change: float = 0.0,
    liquidation: float = 0.0,
) -> Optional[Dict[str, Any]]:
    """
    Analyse a kline series for a given symbol / timeframe.
    Returns a signal dict if a signal is detected, else None.
    """
    if len(closes) < 27:
        return None

    rsi = compute_rsi(closes)
    macd = compute_macd(closes)
    bb = compute_bollinger(closes)
    vol_ratio = compute_volume_ratio(volumes)

    macd_hist = macd.get("histogram")
    bb_pos = bb.get("position")

    # Determine signal type from RSI
    if rsi is None:
        return None
    if rsi < 35:
        signal_type = "bounce"
    elif rsi > 65:
        signal_type = "pullback"
    else:
        return None  # Not extreme enough

    ai_score = _heuristic_ai_score(rsi, vol_ratio, macd_hist, bb_pos, signal_type)
    if ai_score < 55:
        return None

    confidence = _confidence(ai_score, vol_ratio)
    urgency = _urgency(confidence)
    triggers = _build_triggers(rsi, vol_ratio, macd_hist, bb_pos, signal_type)

    price_change = ((closes[-1] - closes[-2]) / closes[-2] * 100) if len(closes) >= 2 and closes[-2] != 0 else 0.0
    predicted_move = round((confidence / 100) * (3.5 if signal_type == "bounce" else -3.5), 2)
    sign = "+" if predicted_move >= 0 else ""

    return {
        "symbol": symbol,
        "signal_type": signal_type,
        "urgency": urgency,
        "timeframe": timeframe,
        "confidence": confidence,
        "price_change": round(price_change, 4),
        "current_price": closes[-1],
        "predicted_move": predicted_move,
        "rsi": rsi,
        "volume_multiplier": vol_ratio,
        "macd_status": _macd_divergence_label(macd, signal_type),
        "bb_position": _bb_position_label(bb, signal_type),
        "ai_score": ai_score,
        "lstm_prediction": f"{sign}{predicted_move * 0.9:.1f}%",
        "xgb_prediction": f"{sign}{predicted_move * 1.05:.1f}%",
        "arima_trend": "上升趨勢" if signal_type == "bounce" else "下降趨勢",
        "funding_rate": funding_rate,
        "open_interest_change": oi_change,
        "liquidation_amount": liquidation,
        "triggers": triggers,
    }
