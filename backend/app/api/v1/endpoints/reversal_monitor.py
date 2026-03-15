"""
Reversal Monitor API endpoints

GET /api/v1/reversal/scan  — scan all symbols for potential reversal signals
GET /api/v1/reversal/{symbol} — reversal signals for a single symbol
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
import numpy as np

from app.db.session import get_db
from app.models.contract_market import ContractMarket

logger = logging.getLogger(__name__)

router = APIRouter()


def normalize_symbol(symbol: str) -> str:
    """Convert frontend BTCUSDT format to DB BTC_USDT format."""
    if "_" not in symbol and len(symbol) > 4 and symbol.endswith("USDT"):
        return symbol[:-4] + "_USDT"
    return symbol


def _compute_rsi(prices: np.ndarray, period: int = 14) -> float:
    """Compute the RSI for the last data point."""
    if len(prices) < period + 1:
        return 50.0

    deltas = np.diff(prices)
    gains = np.where(deltas > 0, deltas, 0.0)
    losses = np.where(deltas < 0, -deltas, 0.0)

    avg_gain = float(np.mean(gains[-period:]))
    avg_loss = float(np.mean(losses[-period:]))

    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100.0 - (100.0 / (1.0 + rs))


def _compute_macd(prices: np.ndarray, fast: int = 12, slow: int = 26, signal: int = 9):
    """Return (macd_line, signal_line, histogram) for the last data point."""
    if len(prices) < slow + signal:
        return 0.0, 0.0, 0.0

    def ema(arr: np.ndarray, span: int) -> np.ndarray:
        alpha = 2.0 / (span + 1)
        result = np.zeros(len(arr))
        result[0] = arr[0]
        for i in range(1, len(arr)):
            result[i] = alpha * arr[i] + (1 - alpha) * result[i - 1]
        return result

    ema_fast = ema(prices, fast)
    ema_slow = ema(prices, slow)
    macd_line = ema_fast - ema_slow
    signal_line = ema(macd_line, signal)
    histogram = macd_line - signal_line
    return float(macd_line[-1]), float(signal_line[-1]), float(histogram[-1])


def _compute_bollinger(prices: np.ndarray, period: int = 20) -> tuple:
    """Return (upper, middle, lower) Bollinger Bands for the last data point."""
    if len(prices) < period:
        mid = float(prices[-1])
        return mid, mid, mid
    window = prices[-period:]
    mid = float(np.mean(window))
    std = float(np.std(window))
    return mid + 2 * std, mid, mid - 2 * std


def _detect_reversals(symbol: str, prices: List[float], funding_rate: float = 0.0) -> List[dict]:
    """Detect potential reversal signals from price data."""
    if len(prices) < 15:
        return []

    arr = np.array(prices, dtype=float)
    current_price = float(arr[-1])

    rsi = _compute_rsi(arr)
    macd, macd_signal, macd_hist = _compute_macd(arr)
    bb_upper, bb_mid, bb_lower = _compute_bollinger(arr)

    results: List[dict] = []

    # ── Oversold bounce signal ────────────────────────────────────────
    # RSI < 30 + price near lower Bollinger Band + MACD histogram rising
    bb_range = bb_upper - bb_lower
    bb_pos = (current_price - bb_lower) / bb_range if bb_range > 0 else 0.5

    if rsi < 35 and bb_pos < 0.25:
        confidence = int(min(90, 50 + (35 - rsi) * 1.5 + (0.25 - bb_pos) * 60))
        macd_bonus = 10 if macd_hist > 0 else 0
        confidence = min(90, confidence + macd_bonus)

        results.append(
            {
                "symbol": symbol,
                "signalType": "bounce",
                "direction": "bullish",
                "confidence": confidence,
                "urgency": "critical" if rsi < 25 else "high" if rsi < 30 else "medium",
                "rsi": round(rsi, 2),
                "macdHistogram": round(macd_hist, 6),
                "bbPosition": round(bb_pos, 4),
                "currentPrice": round(current_price, 6),
                "targetPrice": round(float(bb_mid), 6),
                "description": f"RSI oversold ({rsi:.1f}), price near lower BB",
            }
        )

    # ── Overbought pullback signal ────────────────────────────────────
    if rsi > 65 and bb_pos > 0.75:
        confidence = int(min(90, 50 + (rsi - 65) * 1.5 + (bb_pos - 0.75) * 60))
        macd_bonus = 10 if macd_hist < 0 else 0
        confidence = min(90, confidence + macd_bonus)

        results.append(
            {
                "symbol": symbol,
                "signalType": "pullback",
                "direction": "bearish",
                "confidence": confidence,
                "urgency": "critical" if rsi > 75 else "high" if rsi > 70 else "medium",
                "rsi": round(rsi, 2),
                "macdHistogram": round(macd_hist, 6),
                "bbPosition": round(bb_pos, 4),
                "currentPrice": round(current_price, 6),
                "targetPrice": round(float(bb_mid), 6),
                "description": f"RSI overbought ({rsi:.1f}), price near upper BB",
            }
        )

    # ── MACD crossover signal ─────────────────────────────────────────
    if len(arr) >= 28:
        _, _, prev_hist = _compute_macd(arr[:-1])
        # Bullish crossover: histogram crosses from negative to positive
        if prev_hist < 0 < macd_hist and rsi < 60:
            confidence = int(min(85, 55 + abs(macd_hist) / (current_price + 1e-9) * 1000))
            results.append(
                {
                    "symbol": symbol,
                    "signalType": "bounce",
                    "direction": "bullish",
                    "confidence": confidence,
                    "urgency": "medium",
                    "rsi": round(rsi, 2),
                    "macdHistogram": round(macd_hist, 6),
                    "bbPosition": round(bb_pos, 4),
                    "currentPrice": round(current_price, 6),
                    "targetPrice": round(current_price * 1.03, 6),
                    "description": "MACD bullish crossover",
                }
            )
        # Bearish crossover
        elif prev_hist > 0 > macd_hist and rsi > 40:
            confidence = int(min(85, 55 + abs(macd_hist) / (current_price + 1e-9) * 1000))
            results.append(
                {
                    "symbol": symbol,
                    "signalType": "pullback",
                    "direction": "bearish",
                    "confidence": confidence,
                    "urgency": "medium",
                    "rsi": round(rsi, 2),
                    "macdHistogram": round(macd_hist, 6),
                    "bbPosition": round(bb_pos, 4),
                    "currentPrice": round(current_price, 6),
                    "targetPrice": round(current_price * 0.97, 6),
                    "description": "MACD bearish crossover",
                }
            )

    # ── Extreme funding rate signal ───────────────────────────────────
    if abs(funding_rate) > 0.001:  # > 0.1%
        if funding_rate > 0.001:
            # Extreme positive funding → shorts likely to profit, bearish reversal
            confidence = int(min(80, 50 + abs(funding_rate) * 5000))
            results.append(
                {
                    "symbol": symbol,
                    "signalType": "pullback",
                    "direction": "bearish",
                    "confidence": confidence,
                    "urgency": "high" if funding_rate > 0.003 else "medium",
                    "rsi": round(rsi, 2),
                    "macdHistogram": round(macd_hist, 6),
                    "bbPosition": round(bb_pos, 4),
                    "currentPrice": round(current_price, 6),
                    "targetPrice": round(current_price * 0.97, 6),
                    "description": f"Extreme positive funding rate ({funding_rate*100:.3f}%)",
                }
            )
        else:
            # Extreme negative funding → longs likely to profit, bullish reversal
            confidence = int(min(80, 50 + abs(funding_rate) * 5000))
            results.append(
                {
                    "symbol": symbol,
                    "signalType": "bounce",
                    "direction": "bullish",
                    "confidence": confidence,
                    "urgency": "high" if funding_rate < -0.003 else "medium",
                    "rsi": round(rsi, 2),
                    "macdHistogram": round(macd_hist, 6),
                    "bbPosition": round(bb_pos, 4),
                    "currentPrice": round(current_price, 6),
                    "targetPrice": round(current_price * 1.03, 6),
                    "description": f"Extreme negative funding rate ({funding_rate*100:.3f}%)",
                }
            )

    return results


def _get_reversals_for_symbol(symbol: str, db: Session) -> List[dict]:
    """Fetch price data and detect reversals for a given symbol."""
    db_symbol = normalize_symbol(symbol)
    records = (
        db.query(ContractMarket)
        .filter(ContractMarket.symbol == db_symbol)
        .order_by(ContractMarket.created_at.asc())
        .limit(100)
        .all()
    )
    if not records:
        return []

    prices = [float(r.last_price) for r in records if r.last_price is not None]
    latest_funding = float(records[-1].funding_rate or 0.0)
    return _detect_reversals(symbol, prices, latest_funding)


@router.get("/scan")
def scan_reversals(
    symbols: Optional[str] = Query(
        None,
        description="Comma-separated list of symbols (e.g. BTCUSDT,ETHUSDT). "
        "Defaults to all symbols in the database.",
    ),
    db: Session = Depends(get_db),
):
    """Scan for potential reversal signals across multiple symbols."""
    try:
        if symbols:
            symbol_list = [s.strip() for s in symbols.split(",") if s.strip()]
        else:
            rows = db.query(ContractMarket.symbol).distinct().all()
            if not rows:
                return {"signals": [], "total": 0}
            symbol_list = [row[0].replace("_", "") for row in rows]

        all_signals: List[dict] = []
        for sym in symbol_list:
            try:
                signals = _get_reversals_for_symbol(sym, db)
                all_signals.extend(signals)
            except Exception as e:
                logger.warning(f"Reversal detection failed for {sym}: {e}")

        # Sort by confidence descending
        all_signals.sort(key=lambda s: s["confidence"], reverse=True)

        return {"signals": all_signals, "total": len(all_signals)}

    except Exception as exc:
        logger.error(f"Error scanning reversals: {exc}")
        raise HTTPException(status_code=500, detail="Reversal scan failed")


@router.get("/{symbol}")
def get_symbol_reversals(symbol: str, db: Session = Depends(get_db)):
    """Get reversal signals for a single symbol."""
    try:
        signals = _get_reversals_for_symbol(symbol, db)
        return {"symbol": symbol, "signals": signals, "total": len(signals)}
    except Exception as exc:
        logger.error(f"Error detecting reversals for {symbol}: {exc}")
        raise HTTPException(status_code=500, detail="Reversal detection failed")
