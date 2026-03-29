"""
Reversal Monitor API endpoints

GET /api/v1/reversal/scan  — scan all symbols for potential reversal signals
GET /api/v1/reversal/{symbol} — reversal signals for a single symbol

Timeframe controls the data window used for indicator calculation:
  Min15  →  50 rows  (~15-min granularity)
  Hour1  → 100 rows  (default, ~1-hour window)
  Hour4  → 200 rows  (~4-hour window)
  Day1   → 400 rows  (~daily window)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import logging
import uuid
import numpy as np

from app.db.session import get_db
from app.models.contract_market import ContractMarket

logger = logging.getLogger(__name__)

router = APIRouter()

# Timeframe → number of DB rows to pull per symbol
TIMEFRAME_LIMITS: dict[str, int] = {
    "Min15": 50,
    "Hour1": 100,
    "Hour4": 200,
    "Day1": 400,
}


def normalize_symbol(symbol: str) -> str:
    """Convert frontend BTCUSDT format to DB BTC_USDT format."""
    if "_" not in symbol and len(symbol) > 4 and symbol.endswith("USDT"):
        return symbol[:-4] + "_USDT"
    return symbol


def _compute_rsi_wilder(prices: np.ndarray, period: int = 14) -> float:
    """
    Compute RSI using Wilder's smoothed moving average (the standard used by
    TradingView, MetaTrader, and most brokers). This is more accurate than
    simple averaging, especially over long price series.
    """
    if len(prices) < period + 1:
        return 50.0

    deltas = np.diff(prices)
    gains = np.where(deltas > 0, deltas, 0.0)
    losses = np.where(deltas < 0, -deltas, 0.0)

    # Seed with simple average of first `period` bars
    avg_gain = float(np.mean(gains[:period]))
    avg_loss = float(np.mean(losses[:period]))

    # Apply Wilder smoothing for the remaining bars
    for i in range(period, len(deltas)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period

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


def _compute_atr(prices: np.ndarray, period: int = 14) -> float:
    """Compute Average True Range (simplified, using closing prices only)."""
    if len(prices) < period + 1:
        return float(np.std(prices)) if len(prices) > 1 else 0.0
    ranges = np.abs(np.diff(prices[-period - 1:]))
    return float(np.mean(ranges))


def _detect_rsi_divergence(prices: np.ndarray, rsi_series: List[float]) -> Optional[str]:
    """
    Detect simple price/RSI divergence over the last 5 bars.
    Returns 'bullish', 'bearish', or None.
    """
    if len(prices) < 5 or len(rsi_series) < 5:
        return None
    p = prices[-5:]
    r = rsi_series[-5:]
    price_fell = p[-1] < p[0]
    rsi_rose = r[-1] > r[0]
    price_rose = p[-1] > p[0]
    rsi_fell = r[-1] < r[0]
    if price_fell and rsi_rose:
        return "bullish"   # Hidden bullish divergence
    if price_rose and rsi_fell:
        return "bearish"   # Hidden bearish divergence
    return None


def _compute_rsi_series(prices: np.ndarray, period: int = 14) -> List[float]:
    """Compute RSI for all bars (Wilder method) for divergence detection."""
    if len(prices) < period + 2:
        return [50.0] * len(prices)
    deltas = np.diff(prices)
    gains = np.where(deltas > 0, deltas, 0.0)
    losses = np.where(deltas < 0, -deltas, 0.0)
    avg_gain = float(np.mean(gains[:period]))
    avg_loss = float(np.mean(losses[:period]))
    rsi_vals = [50.0] * (period + 1)
    for i in range(period, len(deltas)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period
        rs = avg_gain / avg_loss if avg_loss > 0 else 100.0
        rsi_vals.append(100.0 - 100.0 / (1.0 + rs))
    return rsi_vals


def _confidence_score(
    *,
    base: float,
    rsi_extreme: float,     # How extreme RSI is beyond threshold (0–25)
    bb_extreme: float,      # How far price is outside BB midpoint (0–0.5)
    macd_confirms: bool,    # MACD histogram confirms direction
    divergence: bool,       # RSI divergence detected
    funding_confirms: bool, # Funding rate confirms direction
) -> int:
    """Multi-factor confidence weighting."""
    score = base
    score += rsi_extreme * 1.2          # up to +30
    score += bb_extreme * 50            # up to +25
    score += 8 if macd_confirms else 0
    score += 12 if divergence else 0
    score += 6 if funding_confirms else 0
    return int(min(95, max(10, score)))


def _detect_reversals(
    symbol: str,
    prices: List[float],
    funding_rate: float = 0.0,
) -> List[dict]:
    """Detect potential reversal signals from price data."""
    if len(prices) < 10:
        return []

    arr = np.array(prices, dtype=float)
    current_price = float(arr[-1])

    rsi = _compute_rsi_wilder(arr)
    macd, macd_sig, macd_hist = _compute_macd(arr)
    bb_upper, bb_mid, bb_lower = _compute_bollinger(arr)

    bb_range = bb_upper - bb_lower
    bb_pos = (current_price - bb_lower) / bb_range if bb_range > 0 else 0.5

    atr = _compute_atr(arr)

    # RSI series for divergence check
    rsi_series = _compute_rsi_series(arr)
    divergence = _detect_rsi_divergence(arr, rsi_series)

    results: List[dict] = []

    def _signal(
        signal_type: str,
        direction: str,
        urgency: str,
        confidence: int,
        description: str,
    ) -> dict:
        return {
            "id": str(uuid.uuid4()),
            "symbol": symbol,
            "signalType": signal_type,
            "direction": direction,
            "confidence": confidence,
            "urgency": urgency,
            "rsi": round(rsi, 2),
            "macdHistogram": round(macd_hist, 6),
            "bbPosition": round(bb_pos, 4),
            "bbUpper": round(bb_upper, 6),
            "bbLower": round(bb_lower, 6),
            "bbMid": round(bb_mid, 6),
            "atr": round(atr, 6),
            "currentPrice": round(current_price, 6),
            "targetPrice": round(bb_mid, 6),
            "fundingRate": round(funding_rate, 6),
            "description": description,
        }

    # ── Oversold bounce ─────────────────────────────────────────────────────
    if rsi < 40 and bb_pos < 0.30:
        conf = _confidence_score(
            base=50.0,
            rsi_extreme=max(0.0, 40.0 - rsi),
            bb_extreme=max(0.0, 0.30 - bb_pos),
            macd_confirms=(macd_hist > 0),
            divergence=(divergence == "bullish"),
            funding_confirms=(funding_rate < -0.0003),
        )
        urgency = "critical" if rsi < 25 else "high" if rsi < 30 else "medium"
        results.append(_signal(
            "bounce", "bullish", urgency, conf,
            f"RSI oversold ({rsi:.1f}), price near lower BB ({bb_pos*100:.0f}% position)"
        ))

    # ── Overbought pullback ─────────────────────────────────────────────────
    if rsi > 60 and bb_pos > 0.70:
        conf = _confidence_score(
            base=50.0,
            rsi_extreme=max(0.0, rsi - 60.0),
            bb_extreme=max(0.0, bb_pos - 0.70),
            macd_confirms=(macd_hist < 0),
            divergence=(divergence == "bearish"),
            funding_confirms=(funding_rate > 0.0003),
        )
        urgency = "critical" if rsi > 75 else "high" if rsi > 70 else "medium"
        results.append(_signal(
            "pullback", "bearish", urgency, conf,
            f"RSI overbought ({rsi:.1f}), price near upper BB ({bb_pos*100:.0f}% position)"
        ))

    # ── MACD crossover ──────────────────────────────────────────────────────
    if len(arr) >= 28:
        _, _, prev_hist = _compute_macd(arr[:-1])
        if prev_hist < 0 < macd_hist and rsi < 60:
            conf = _confidence_score(
                base=55.0,
                rsi_extreme=max(0.0, 50.0 - rsi) * 0.4,
                bb_extreme=max(0.0, 0.40 - bb_pos),
                macd_confirms=True,
                divergence=(divergence == "bullish"),
                funding_confirms=(funding_rate < -0.0003),
            )
            results.append(_signal(
                "bounce", "bullish", "medium", conf,
                "MACD bullish crossover confirmed"
            ))
        elif prev_hist > 0 > macd_hist and rsi > 40:
            conf = _confidence_score(
                base=55.0,
                rsi_extreme=max(0.0, rsi - 50.0) * 0.4,
                bb_extreme=max(0.0, bb_pos - 0.60),
                macd_confirms=True,
                divergence=(divergence == "bearish"),
                funding_confirms=(funding_rate > 0.0003),
            )
            results.append(_signal(
                "pullback", "bearish", "medium", conf,
                "MACD bearish crossover confirmed"
            ))

    # ── RSI Divergence ──────────────────────────────────────────────────────
    if divergence == "bullish" and rsi < 55 and not any(r["signalType"] == "bounce" for r in results):
        conf = _confidence_score(
            base=52.0,
            rsi_extreme=max(0.0, 50.0 - rsi),
            bb_extreme=max(0.0, 0.40 - bb_pos),
            macd_confirms=(macd_hist > 0),
            divergence=True,
            funding_confirms=(funding_rate < -0.0003),
        )
        results.append(_signal(
            "bounce", "bullish", "medium", conf,
            "Bullish RSI divergence: price lower low, RSI higher low"
        ))
    elif divergence == "bearish" and rsi > 45 and not any(r["signalType"] == "pullback" for r in results):
        conf = _confidence_score(
            base=52.0,
            rsi_extreme=max(0.0, rsi - 50.0),
            bb_extreme=max(0.0, bb_pos - 0.60),
            macd_confirms=(macd_hist < 0),
            divergence=True,
            funding_confirms=(funding_rate > 0.0003),
        )
        results.append(_signal(
            "pullback", "bearish", "medium", conf,
            "Bearish RSI divergence: price higher high, RSI lower high"
        ))

    # ── Extreme funding rate ────────────────────────────────────────────────
    if abs(funding_rate) > 0.001:
        if funding_rate > 0.001:
            conf = _confidence_score(
                base=48.0,
                rsi_extreme=max(0.0, rsi - 50.0) * 0.5,
                bb_extreme=max(0.0, bb_pos - 0.50),
                macd_confirms=(macd_hist < 0),
                divergence=(divergence == "bearish"),
                funding_confirms=True,
            )
            urgency = "high" if funding_rate > 0.003 else "medium"
            s = _signal("pullback", "bearish", urgency, conf,
                        f"Extreme positive funding ({funding_rate*100:.3f}%) → bearish pressure")
            s["targetPrice"] = round(current_price * 0.97, 6)
            results.append(s)
        else:
            conf = _confidence_score(
                base=48.0,
                rsi_extreme=max(0.0, 50.0 - rsi) * 0.5,
                bb_extreme=max(0.0, 0.50 - bb_pos),
                macd_confirms=(macd_hist > 0),
                divergence=(divergence == "bullish"),
                funding_confirms=True,
            )
            urgency = "high" if funding_rate < -0.003 else "medium"
            s = _signal("bounce", "bullish", urgency, conf,
                        f"Extreme negative funding ({funding_rate*100:.3f}%) → bullish pressure")
            s["targetPrice"] = round(current_price * 1.03, 6)
            results.append(s)

    return results


def _get_reversals_for_symbol(symbol: str, db: Session, limit: int = 100) -> List[dict]:
    """Fetch price data and detect reversals for a given symbol."""
    db_symbol = normalize_symbol(symbol)
    records = (
        db.query(ContractMarket)
        .filter(ContractMarket.symbol == db_symbol)
        .order_by(ContractMarket.created_at.desc())
        .limit(limit)
        .all()
    )
    if not records:
        return []
    records = list(reversed(records))
    prices = [float(r.last_price) for r in records if r.last_price is not None]
    latest_funding = float(records[-1].funding_rate or 0.0)
    return _detect_reversals(symbol, prices, latest_funding)


def _get_reversals_for_symbols(
    symbols: List[str], db: Session, per_symbol_limit: int = 100
) -> List[dict]:
    """
    Fetch price data and detect reversals for multiple symbols in a single
    batched query using a window function (avoids N+1 pattern).
    """
    if not symbols:
        return []

    db_symbol_map: dict[str, str] = {}
    for s in symbols:
        db_sym = normalize_symbol(s)
        db_symbol_map[db_sym] = s

    db_symbols = list(db_symbol_map.keys())

    subq = (
        db.query(
            ContractMarket.id,
            ContractMarket.symbol,
            ContractMarket.last_price,
            ContractMarket.funding_rate,
            ContractMarket.created_at,
            func.row_number()
            .over(
                partition_by=ContractMarket.symbol,
                order_by=ContractMarket.created_at.desc(),
            )
            .label("rn"),
        )
        .filter(ContractMarket.symbol.in_(db_symbols))
        .subquery()
    )

    rows = (
        db.query(
            subq.c.symbol,
            subq.c.last_price,
            subq.c.funding_rate,
            subq.c.created_at,
        )
        .filter(subq.c.rn <= per_symbol_limit)
        .order_by(subq.c.symbol.asc(), subq.c.created_at.asc())
        .all()
    )

    prices_by_symbol: dict[str, List[float]] = {}
    funding_by_symbol: dict[str, float] = {}

    for sym, last_price, funding_rate, _ in rows:
        if last_price is None:
            continue
        prices_by_symbol.setdefault(sym, []).append(float(last_price))
        funding_by_symbol[sym] = float(funding_rate or 0.0)

    all_signals: List[dict] = []
    for db_symbol, prices in prices_by_symbol.items():
        if not prices:
            continue
        frontend_symbol = db_symbol_map.get(db_symbol, db_symbol.replace("_", ""))
        latest_funding = funding_by_symbol.get(db_symbol, 0.0)
        try:
            sigs = _detect_reversals(frontend_symbol, prices, latest_funding)
            all_signals.extend(sigs)
        except Exception as e:
            logger.warning(f"Reversal detection failed for {frontend_symbol}: {e}")

    return all_signals


@router.get("/scan")
def scan_reversals(
    symbols: Optional[str] = Query(
        None,
        description="Comma-separated list of symbols (e.g. BTCUSDT,ETHUSDT). "
        "Defaults to all symbols in the database.",
    ),
    timeframe: str = Query(
        "Hour1",
        description="Data window for indicator calculation: Min15 | Hour1 (default) | Hour4 | Day1",
    ),
    db: Session = Depends(get_db),
):
    """
    Scan for potential reversal signals across multiple symbols.

    - **symbols**: Optional comma-separated list; defaults to all DB symbols.
    - **timeframe**: Controls how many data points are used per symbol for indicator accuracy:
      - `Min15` → 50 rows (fast, less accurate)
      - `Hour1` → 100 rows (default, balanced)
      - `Hour4` → 200 rows (more accurate, slower)
      - `Day1` → 400 rows (most accurate, slowest)
    """
    per_symbol_limit = TIMEFRAME_LIMITS.get(timeframe, 100)

    try:
        if symbols:
            symbol_list = [s.strip() for s in symbols.split(",") if s.strip()]
        else:
            rows = db.query(ContractMarket.symbol).distinct().all()
            if not rows:
                return {"signals": [], "total": 0}
            symbol_list = [row[0].replace("_", "") for row in rows]

        all_signals = _get_reversals_for_symbols(symbol_list, db, per_symbol_limit)
        all_signals.sort(key=lambda s: s["confidence"], reverse=True)

        return {
            "signals": all_signals,
            "total": len(all_signals),
            "timeframe": timeframe,
            "data_points_per_symbol": per_symbol_limit,
        }

    except Exception as exc:
        logger.error(f"Error scanning reversals: {exc}")
        raise HTTPException(status_code=500, detail="Reversal scan failed")


@router.get("/{symbol}")
def get_symbol_reversals(
    symbol: str,
    timeframe: str = Query("Hour1", description="Data window: Min15 | Hour1 | Hour4 | Day1"),
    db: Session = Depends(get_db),
):
    """Get reversal signals for a single symbol."""
    per_symbol_limit = TIMEFRAME_LIMITS.get(timeframe, 100)
    try:
        sigs = _get_reversals_for_symbol(symbol, db, per_symbol_limit)
        return {
            "symbol": symbol,
            "signals": sigs,
            "total": len(sigs),
            "timeframe": timeframe,
        }
    except Exception as exc:
        logger.error(f"Error detecting reversals for {symbol}: {exc}")
        raise HTTPException(status_code=500, detail="Reversal detection failed")
