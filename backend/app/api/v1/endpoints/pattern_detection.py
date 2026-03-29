"""
Pattern Detection API endpoints — Enhanced with indicator confirmations

GET /api/v1/patterns/scan         — scan multiple symbols for chart patterns
GET /api/v1/patterns/kline/{symbol} — get kline/OHLCV data for charting
GET /api/v1/patterns/{symbol}     — get patterns for a single symbol
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import logging
import numpy as np

from app.db.session import get_db
from app.models.contract_market import ContractMarket
from app.core.mexc.contract import MEXCContractAPI

logger = logging.getLogger(__name__)

router = APIRouter()

# Timeframe → MEXC kline interval
TIMEFRAME_MAP: Dict[str, str] = {
    "1H": "Min60",
    "4H": "Hour4",
    "1D": "Day1",
    "1W": "Week1",
}


# ── Symbol helpers ───────────────────────────────────────────────────────────

def normalize_symbol(symbol: str) -> str:
    """Convert frontend BTCUSDT format to backend BTC_USDT format."""
    if "_" not in symbol and len(symbol) > 4 and symbol.endswith("USDT"):
        return symbol[:-4] + "_USDT"
    return symbol


# ── Indicator calculators ────────────────────────────────────────────────────

def _calculate_rsi(prices: np.ndarray, period: int = 14) -> float:
    """Wilder-smoothed RSI."""
    if len(prices) < period + 1:
        return 50.0
    deltas = np.diff(prices.astype(float))
    gains = np.where(deltas > 0, deltas, 0.0)
    losses = np.where(deltas < 0, -deltas, 0.0)
    avg_gain = float(np.mean(gains[:period]))
    avg_loss = float(np.mean(losses[:period]))
    for i in range(period, len(deltas)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period
    if avg_loss == 0:
        return 100.0
    return float(100 - 100 / (1 + avg_gain / avg_loss))


def _calculate_macd(prices: np.ndarray) -> Dict[str, float]:
    """EMA-based MACD (12, 26, 9)."""
    if len(prices) < 27:
        return {"histogram": 0.0, "macd_line": 0.0, "signal_line": 0.0}

    def _ema(data: np.ndarray, span: int) -> float:
        k = 2.0 / (span + 1)
        val = float(data[0])
        for p in data[1:]:
            val = float(p) * k + val * (1 - k)
        return val

    p = prices[-26:]
    ema12 = _ema(p, 12)
    ema26 = _ema(p, 26)
    macd_line = ema12 - ema26
    signal = macd_line * 0.9  # simplified 9-period approximation
    return {
        "macd_line": round(macd_line, 8),
        "signal_line": round(signal, 8),
        "histogram": round(macd_line - signal, 8),
    }


def _volume_spike(volumes: Optional[List[float]], threshold: float = 1.5) -> bool:
    """True if the most-recent bar volume exceeds threshold × 20-period average."""
    if not volumes or len(volumes) < 3:
        return False
    arr = np.array(volumes, dtype=float)
    avg = float(np.mean(arr[:-1]))
    return avg > 0 and float(arr[-1]) > avg * threshold


# ── Pivot point detection ────────────────────────────────────────────────────

def _find_pivots(arr: np.ndarray, order: int = 3):
    """Zigzag-style pivot highs and lows (index, value) pairs."""
    n = len(arr)
    highs, lows = [], []
    for i in range(order, n - order):
        window = arr[i - order: i + order + 1]
        if arr[i] == window.max() and arr[i] > arr[i - 1] and arr[i] > arr[i + 1]:
            highs.append((i, float(arr[i])))
        if arr[i] == window.min() and arr[i] < arr[i - 1] and arr[i] < arr[i + 1]:
            lows.append((i, float(arr[i])))
    return highs, lows


# ── Confirmation builder ─────────────────────────────────────────────────────

def _build_confirmation(
    rsi: float,
    macd: Dict[str, float],
    vol_spike: bool,
    direction: str,
    base_reliability: str = "medium",
) -> Dict[str, Any]:
    rsi_confirmed = (direction == "bullish" and rsi < 45) or (
        direction == "bearish" and rsi > 55
    )
    macd_confirmed = (direction == "bullish" and macd["histogram"] > 0) or (
        direction == "bearish" and macd["histogram"] < 0
    )
    confirmed_by = (
        (["RSI"] if rsi_confirmed else [])
        + (["MACD"] if macd_confirmed else [])
        + (["Volume"] if vol_spike else [])
    )
    order = {"high": 3, "medium": 2, "low": 1}
    conf_rel = "high" if len(confirmed_by) >= 2 else ("medium" if confirmed_by else "low")
    final_rel = base_reliability if order[base_reliability] >= order[conf_rel] else conf_rel
    return {
        "rsi_confirmed": rsi_confirmed,
        "macd_confirmed": macd_confirmed,
        "volume_spike": vol_spike,
        "confirmed_by": confirmed_by,
        "reliability": final_rel,
    }


# ── Core pattern detector ────────────────────────────────────────────────────

def _detect_patterns(
    symbol: str,
    prices: List[float],
    volumes: Optional[List[float]] = None,
    timeframe: str = "1H",
) -> List[dict]:
    """
    Detect chart patterns from a chronological price list.

    Improvements over v1:
    - Zigzag pivot detection (more accurate extrema)
    - RSI / MACD / Volume confirmation for reliability scoring
    - Tighter tolerances (2.5 % instead of 3 %)
    - New patterns: Triple Top/Bottom, Symmetrical Triangle, Rising/Falling Wedge,
      Cup & Handle
    - Response includes indicator fields for frontend display
    """
    results: List[dict] = []
    n = len(prices)
    if n < 10:
        return results

    arr = np.array(prices, dtype=float)
    current_price = float(arr[-1])

    rsi = _calculate_rsi(arr)
    macd = _calculate_macd(arr)
    vol_spike = _volume_spike(volumes)

    order = max(3, n // 15)
    pivot_highs, pivot_lows = _find_pivots(arr, order)
    maxima = [v for _, v in pivot_highs]
    minima = [v for _, v in pivot_lows]

    def emit(base: dict, direction: str, base_rel: str = "medium") -> None:
        conf = _build_confirmation(rsi, macd, vol_spike, direction, base_rel)
        base.update(
            {
                "rsi_at_detection": round(rsi, 2),
                "macd_confirmed": conf["macd_confirmed"],
                "rsi_confirmed": conf["rsi_confirmed"],
                "volume_spike": conf["volume_spike"],
                "confirmed_by": conf["confirmed_by"],
                "reliability": conf["reliability"],
                "timeframe": timeframe,
            }
        )
        results.append(base)

    # ── Double Top ───────────────────────────────────────────────────
    if len(maxima) >= 2:
        t1, t2 = maxima[-2], maxima[-1]
        diff = abs(t1 - t2) / max(t1, t2)
        if diff < 0.025:
            neck = min(t1, t2) * 0.97
            emit(
                {
                    "symbol": symbol, "direction": "bearish", "pattern": "doubleTop",
                    "status": "detected" if current_price < neck else "pending",
                    "completion": min(100, int(80 + (1 - diff / 0.025) * 20)),
                    "breakoutLevel": round(neck, 6),
                    "targetPrice": round(float(max(neck - (max(t1, t2) - neck), neck * 0.8)), 6),
                },
                "bearish", "high" if diff < 0.01 else "medium",
            )

    # ── Double Bottom ────────────────────────────────────────────────
    if len(minima) >= 2:
        b1, b2 = minima[-2], minima[-1]
        diff = abs(b1 - b2) / max(b1, b2)
        if diff < 0.025:
            neck = max(b1, b2) * 1.03
            emit(
                {
                    "symbol": symbol, "direction": "bullish", "pattern": "doubleBottom",
                    "status": "detected" if current_price > neck else "pending",
                    "completion": min(100, int(80 + (1 - diff / 0.025) * 20)),
                    "breakoutLevel": round(neck, 6),
                    "targetPrice": round(float(neck + (neck - min(b1, b2))), 6),
                },
                "bullish", "high" if diff < 0.01 else "medium",
            )

    # ── Triple Top ───────────────────────────────────────────────────
    if len(maxima) >= 3:
        t1, t2, t3 = maxima[-3], maxima[-2], maxima[-1]
        top = max(t1, t2, t3)
        spread = (top - min(t1, t2, t3)) / top
        if spread < 0.03:
            neck = min(t1, t2, t3) * 0.97
            emit(
                {
                    "symbol": symbol, "direction": "bearish", "pattern": "tripleTop",
                    "status": "detected" if current_price < neck else "pending",
                    "completion": min(100, int(85 + (1 - spread / 0.03) * 15)),
                    "breakoutLevel": round(float(neck), 6),
                    "targetPrice": round(float(max(neck - (top - neck) * 1.2, neck * 0.78)), 6),
                },
                "bearish", "high",
            )

    # ── Triple Bottom ────────────────────────────────────────────────
    if len(minima) >= 3:
        b1, b2, b3 = minima[-3], minima[-2], minima[-1]
        bot = min(b1, b2, b3)
        spread = (max(b1, b2, b3) - bot) / max(b1, b2, b3)
        if spread < 0.03:
            neck = max(b1, b2, b3) * 1.03
            emit(
                {
                    "symbol": symbol, "direction": "bullish", "pattern": "tripleBottom",
                    "status": "detected" if current_price > neck else "pending",
                    "completion": min(100, int(85 + (1 - spread / 0.03) * 15)),
                    "breakoutLevel": round(float(neck), 6),
                    "targetPrice": round(float(neck + (neck - bot) * 1.2), 6),
                },
                "bullish", "high",
            )

    # ── Head & Shoulders ─────────────────────────────────────────────
    if len(maxima) >= 3:
        ls, head, rs = maxima[-3], maxima[-2], maxima[-1]
        if head > ls and head > rs and abs(ls - rs) / max(ls, rs) < 0.05:
            neck = min(ls, rs) * 0.97
            emit(
                {
                    "symbol": symbol, "direction": "bearish", "pattern": "headShoulders",
                    "status": "detected" if current_price < neck else "pending",
                    "completion": 90,
                    "breakoutLevel": round(float(neck), 6),
                    "targetPrice": round(float(max(neck - (head - neck), neck * 0.8)), 6),
                },
                "bearish", "high",
            )

    # ── Inverse Head & Shoulders ─────────────────────────────────────
    if len(minima) >= 3:
        ls, head, rs = minima[-3], minima[-2], minima[-1]
        if head < ls and head < rs and abs(ls - rs) / max(ls, rs) < 0.05:
            neck = max(ls, rs) * 1.03
            emit(
                {
                    "symbol": symbol, "direction": "bullish", "pattern": "inverseHeadShoulders",
                    "status": "detected" if current_price > neck else "pending",
                    "completion": 90,
                    "breakoutLevel": round(float(neck), 6),
                    "targetPrice": round(float(neck + (neck - head)), 6),
                },
                "bullish", "high",
            )

    # ── Triangle & Wedge patterns (rolling 20-bar window) ────────────
    if n >= 20:
        recent = arr[-20:]
        step = max(1, len(recent) // 10)
        highs = [float(recent[max(0, i - step): i + 1].max()) for i in range(step, len(recent))]
        lows = [float(recent[max(0, i - step): i + 1].min()) for i in range(step, len(recent))]

        if highs and lows:
            ha = np.array(highs)
            la = np.array(lows)
            x = np.arange(len(highs), dtype=float)
            hs = float(np.polyfit(x, ha, 1)[0])  # high slope
            ls_ = float(np.polyfit(x, la, 1)[0])  # low slope
            h_std = float(np.std(ha) / np.mean(ha)) if np.mean(ha) != 0 else 1.0
            l_std = float(np.std(la) / np.mean(la)) if np.mean(la) != 0 else 1.0

            # Ascending triangle
            if h_std < 0.02 and ls_ > 0:
                bo = float(ha.max()) * 1.02
                emit(
                    {
                        "symbol": symbol, "direction": "bullish", "pattern": "ascendingTriangle",
                        "status": "detected" if current_price > float(ha.max()) else "pending",
                        "completion": min(100, int(60 + (1 - h_std * 50) * 40)),
                        "breakoutLevel": round(bo, 6),
                        "targetPrice": round(bo + (float(ha.max()) - float(la.min())), 6),
                    },
                    "bullish", "medium",
                )

            # Descending triangle
            if l_std < 0.02 and hs < 0:
                bo = float(la.min()) * 0.98
                ph = float(ha.max()) - float(la.min())
                emit(
                    {
                        "symbol": symbol, "direction": "bearish", "pattern": "descendingTriangle",
                        "status": "detected" if current_price < float(la.min()) else "pending",
                        "completion": min(100, int(60 + (1 - l_std * 50) * 40)),
                        "breakoutLevel": round(bo, 6),
                        "targetPrice": round(max(bo - ph, bo * 0.8), 6),
                    },
                    "bearish", "medium",
                )

            # Symmetrical triangle
            if hs < -0.001 and ls_ > 0.001:
                apex = float((ha[0] + la[0]) / 2)
                dir_ = "bullish" if current_price > apex else "bearish"
                emit(
                    {
                        "symbol": symbol, "direction": dir_, "pattern": "symmetricalTriangle",
                        "status": "pending",
                        "completion": min(100, int(50 + abs(hs + ls_) * 1000)),
                        "breakoutLevel": round(apex, 6),
                        "targetPrice": round(apex * 1.05 if dir_ == "bullish" else apex * 0.95, 6),
                    },
                    dir_, "medium",
                )

            # Rising Wedge (bearish — convergence upward)
            if hs > 0 and ls_ > 0 and ls_ > hs * 1.3 and h_std < 0.03:
                bo = float(la[-1]) * 0.99
                ph = float(ha[0]) - float(la[0])
                emit(
                    {
                        "symbol": symbol, "direction": "bearish", "pattern": "wedge",
                        "status": "pending",
                        "completion": min(100, int(50 + ls_ * 800)),
                        "breakoutLevel": round(bo, 6),
                        "targetPrice": round(max(bo - ph * 0.8, bo * 0.85), 6),
                    },
                    "bearish", "medium",
                )

            # Falling Wedge (bullish — convergence downward)
            if hs < 0 and ls_ < 0 and hs < ls_ * 1.3 and l_std < 0.03:
                bo = float(ha[-1]) * 1.01
                ph = float(ha[0]) - float(la[0])
                emit(
                    {
                        "symbol": symbol, "direction": "bullish", "pattern": "wedge",
                        "status": "pending",
                        "completion": min(100, int(50 + abs(ls_) * 800)),
                        "breakoutLevel": round(bo, 6),
                        "targetPrice": round(bo + ph * 0.8, 6),
                    },
                    "bullish", "medium",
                )

    # ── Flag patterns ────────────────────────────────────────────────
    if n >= 15:
        impulse = arr[: n - 10]
        flag = arr[n - 10:]
        move = float(impulse[-1] - impulse[0])
        flag_range = float(flag.max() - flag.min())
        total_range = float(arr.max() - arr.min())

        if total_range > 0 and flag_range / total_range < 0.3 and abs(move) / float(arr.max()) > 0.02:
            if move > 0:
                bo = float(flag.max()) * 1.01
                emit(
                    {
                        "symbol": symbol, "direction": "bullish", "pattern": "bullishFlag",
                        "status": "detected" if current_price > float(flag.max()) else "pending",
                        "completion": min(100, int(50 + (1 - flag_range / total_range) * 60)),
                        "breakoutLevel": round(bo, 6),
                        "targetPrice": round(bo + abs(move) * 0.8, 6),
                    },
                    "bullish", "medium",
                )
            else:
                bo = float(flag.min()) * 0.99
                emit(
                    {
                        "symbol": symbol, "direction": "bearish", "pattern": "bearishFlag",
                        "status": "detected" if current_price < float(flag.min()) else "pending",
                        "completion": min(100, int(50 + (1 - flag_range / total_range) * 60)),
                        "breakoutLevel": round(bo, 6),
                        "targetPrice": round(max(bo - abs(move) * 0.8, bo * 0.8), 6),
                    },
                    "bearish", "medium",
                )

    # ── Cup & Handle ─────────────────────────────────────────────────
    if n >= 30:
        cup = arr[-30:-5]
        handle = arr[-5:]
        cup_min = float(cup.min())
        rim = max(float(cup[0]), float(cup[-1]))
        cup_depth = (rim - cup_min) / rim
        h_range = float(handle.max() - handle.min())

        if (
            0.1 < cup_depth < 0.5
            and abs(float(cup[0]) - float(cup[-1])) / rim < 0.05
            and h_range / rim < 0.1
            and float(handle.max()) <= rim * 1.02
        ):
            target = rim + (rim - cup_min)
            emit(
                {
                    "symbol": symbol, "direction": "bullish", "pattern": "cupHandle",
                    "status": "detected" if current_price > rim else "pending",
                    "completion": min(100, int(70 + (1 - h_range / rim) * 30)),
                    "breakoutLevel": round(float(rim), 6),
                    "targetPrice": round(float(target), 6),
                },
                "bullish", "high",
            )

    return results


# ── MEXC kline data helper ───────────────────────────────────────────────────

def _fetch_kline_data(symbol: str, timeframe: str = "1H") -> Dict[str, Any]:
    """
    Fetch OHLCV kline data from MEXC API.
    Returns dict with keys: prices, volumes, timestamps, ohlcv.
    Falls back gracefully on any error.
    """
    mexc_symbol = normalize_symbol(symbol).replace("_", "")
    interval = TIMEFRAME_MAP.get(timeframe, "Min60")

    try:
        client = MEXCContractAPI()
        raw = client.get_contract_klines(symbol=mexc_symbol, interval=interval, limit=100)

        prices, volumes, timestamps, ohlcv = [], [], [], []
        if raw and isinstance(raw, list):
            for candle in raw:
                if isinstance(candle, (list, tuple)) and len(candle) >= 5:
                    ts = candle[0]
                    o, c, h, l = float(candle[1]), float(candle[2]), float(candle[3]), float(candle[4])
                    v = float(candle[5]) if len(candle) > 5 else 0.0
                elif isinstance(candle, dict):
                    ts = candle.get("time", candle.get("t", candle.get("timestamp", 0)))
                    o = float(candle.get("open", candle.get("o", 0)))
                    c = float(candle.get("close", candle.get("c", 0)))
                    h = float(candle.get("high", candle.get("h", 0)))
                    l = float(candle.get("low", candle.get("l", 0)))
                    v = float(candle.get("volume", candle.get("v", 0)))
                else:
                    continue

                prices.append(c)
                volumes.append(v)
                timestamps.append(int(ts) if ts else 0)
                ohlcv.append({"t": int(ts) if ts else 0, "o": o, "h": h, "l": l, "c": c, "v": v})

        return {"prices": prices, "volumes": volumes, "timestamps": timestamps, "ohlcv": ohlcv}

    except Exception as e:
        logger.warning(f"MEXC kline fetch failed for {symbol} ({timeframe}): {e}")
        return {"prices": [], "volumes": [], "timestamps": [], "ohlcv": []}


def _get_patterns_for_symbol(
    symbol: str, db: Session, timeframe: str = "1H"
) -> List[dict]:
    """Fetch prices (MEXC kline preferred, DB fallback) and run detection."""
    kline = _fetch_kline_data(symbol, timeframe)
    prices = kline["prices"]
    volumes = kline["volumes"] or None

    if not prices:
        db_symbol = normalize_symbol(symbol)
        records = (
            db.query(ContractMarket)
            .filter(ContractMarket.symbol == db_symbol)
            .order_by(ContractMarket.created_at.asc())
            .limit(100)
            .all()
        )
        prices = [r.last_price for r in records if r.last_price is not None]
        volumes = None

    if not prices:
        return []

    return _detect_patterns(symbol, prices, volumes, timeframe)


# ── API endpoints ────────────────────────────────────────────────────────────

@router.get("/kline/{symbol}", tags=["Pattern Detection"])
def get_kline(
    symbol: str,
    timeframe: str = Query("1H", description="Timeframe: 1H, 4H, 1D, 1W"),
):
    """
    Get OHLCV kline data for a symbol — used by the frontend chart.

    - **symbol**: Trading pair (e.g. BTCUSDT)
    - **timeframe**: 1H, 4H, 1D, 1W
    """
    data = _fetch_kline_data(symbol, timeframe)
    return {
        "symbol": symbol,
        "timeframe": timeframe,
        "ohlcv": data["ohlcv"],
        "prices": data["prices"],
        "timestamps": data["timestamps"],
    }


@router.get("/scan", tags=["Pattern Detection"])
def scan_patterns(
    symbols: Optional[str] = Query(
        None,
        description="Comma-separated symbols (e.g. BTCUSDT,ETHUSDT). "
        "Defaults to all symbols in the database.",
    ),
    timeframe: str = Query("1H", description="Timeframe: 1H, 4H, 1D"),
    db: Session = Depends(get_db),
):
    """
    Scan multiple symbols for chart patterns with RSI / MACD / Volume confirmations.

    - **symbols**: Comma-separated trading pairs
    - **timeframe**: Kline timeframe for analysis (1H / 4H / 1D)

    Each pattern result includes `rsi_at_detection`, `macd_confirmed`,
    `rsi_confirmed`, `volume_spike`, and `confirmed_by` fields.
    """
    try:
        if symbols:
            symbol_list = [s.strip() for s in symbols.split(",") if s.strip()]
        else:
            rows = db.query(ContractMarket.symbol).distinct().all()
            if not rows:
                return {"patterns": [], "total": 0}
            symbol_list = [row[0].replace("_", "") for row in rows]

        if not symbol_list:
            return {"patterns": [], "total": 0}

        all_patterns: List[dict] = []
        for sym in symbol_list:
            try:
                pats = _get_patterns_for_symbol(sym, db, timeframe)
                all_patterns.extend(pats)
            except Exception as e:
                logger.warning(f"Pattern detection failed for {sym}: {e}")

        return {"patterns": all_patterns, "total": len(all_patterns)}

    except Exception as exc:
        logger.error(f"Error scanning patterns: {exc}")
        raise HTTPException(status_code=500, detail="Pattern scan failed")


@router.get("/{symbol}", tags=["Pattern Detection"])
def get_symbol_patterns(
    symbol: str,
    timeframe: str = Query("1H", description="Timeframe: 1H, 4H, 1D"),
    db: Session = Depends(get_db),
):
    """
    Get chart patterns for a single symbol with indicator confirmations.

    - **symbol**: Trading pair (e.g. BTCUSDT)
    - **timeframe**: Kline timeframe (1H / 4H / 1D)
    """
    try:
        patterns = _get_patterns_for_symbol(symbol, db, timeframe)
        return {"symbol": symbol, "patterns": patterns, "total": len(patterns)}
    except Exception as exc:
        logger.error(f"Error detecting patterns for {symbol}: {exc}")
        raise HTTPException(status_code=500, detail="Pattern detection failed")
