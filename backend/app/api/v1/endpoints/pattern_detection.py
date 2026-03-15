"""
Pattern Detection API endpoints

GET /api/v1/patterns/scan  — scan multiple symbols for chart patterns
GET /api/v1/patterns/{symbol} — get patterns for a single symbol
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import logging
import numpy as np

from app.db.session import get_db
from app.models.contract_market import ContractMarket

logger = logging.getLogger(__name__)

router = APIRouter()


def normalize_symbol(symbol: str) -> str:
    """Convert frontend BTCUSDT format to backend BTC_USDT format."""
    if "_" not in symbol and len(symbol) > 4 and symbol.endswith("USDT"):
        return symbol[:-4] + "_USDT"
    return symbol


def _detect_patterns(symbol: str, prices: List[float]) -> List[dict]:
    """Detect chart patterns from a list of prices (oldest first)."""
    results: List[dict] = []
    n = len(prices)
    if n < 10:
        return results

    arr = np.array(prices, dtype=float)
    current_price = arr[-1]

    # ── Local extrema detection ─────────────────────────────────────
    win = max(3, n // 10)
    max_idx: List[int] = []
    min_idx: List[int] = []
    for i in range(win, n - win):
        if arr[i] == arr[max(0, i - win) : i + win + 1].max():
            max_idx.append(i)
        if arr[i] == arr[max(0, i - win) : i + win + 1].min():
            min_idx.append(i)

    maxima = arr[max_idx] if max_idx else np.array([])
    minima = arr[min_idx] if min_idx else np.array([])

    # ── Double Top ──────────────────────────────────────────────────
    if len(maxima) >= 2:
        t1, t2 = maxima[-2], maxima[-1]
        diff_ratio = abs(t1 - t2) / max(t1, t2)
        if diff_ratio < 0.03:
            neckline = min(t1, t2) * 0.97
            target = neckline - (max(t1, t2) - neckline)
            reliability = "high" if diff_ratio < 0.01 else "medium"
            results.append(
                {
                    "symbol": symbol,
                    "direction": "bearish",
                    "pattern": "doubleTop",
                    "status": "detected" if current_price < neckline else "pending",
                    "completion": min(100, int(80 + (1 - diff_ratio / 0.03) * 20)),
                    "reliability": reliability,
                    "breakoutLevel": round(float(neckline), 6),
                    "targetPrice": round(float(max(target, neckline * 0.8)), 6),
                }
            )

    # ── Double Bottom ───────────────────────────────────────────────
    if len(minima) >= 2:
        b1, b2 = minima[-2], minima[-1]
        diff_ratio = abs(b1 - b2) / max(b1, b2)
        if diff_ratio < 0.03:
            neckline = max(b1, b2) * 1.03
            target = neckline + (neckline - min(b1, b2))
            reliability = "high" if diff_ratio < 0.01 else "medium"
            results.append(
                {
                    "symbol": symbol,
                    "direction": "bullish",
                    "pattern": "doubleBottom",
                    "status": "detected" if current_price > neckline else "pending",
                    "completion": min(100, int(80 + (1 - diff_ratio / 0.03) * 20)),
                    "reliability": reliability,
                    "breakoutLevel": round(float(neckline), 6),
                    "targetPrice": round(float(target), 6),
                }
            )

    # ── Head & Shoulders (bearish) ──────────────────────────────────
    if len(maxima) >= 3:
        ls, head, rs = maxima[-3], maxima[-2], maxima[-1]
        if (
            head > ls
            and head > rs
            and abs(ls - rs) / max(ls, rs) < 0.05
        ):
            neckline = min(ls, rs) * 0.97
            target = neckline - (head - neckline)
            results.append(
                {
                    "symbol": symbol,
                    "direction": "bearish",
                    "pattern": "headShoulders",
                    "status": "detected" if current_price < neckline else "pending",
                    "completion": 90,
                    "reliability": "high",
                    "breakoutLevel": round(float(neckline), 6),
                    "targetPrice": round(float(max(target, neckline * 0.8)), 6),
                }
            )

    # ── Inverse Head & Shoulders (bullish) ──────────────────────────
    if len(minima) >= 3:
        ls, head, rs = minima[-3], minima[-2], minima[-1]
        if (
            head < ls
            and head < rs
            and abs(ls - rs) / max(ls, rs) < 0.05
        ):
            neckline = max(ls, rs) * 1.03
            target = neckline + (neckline - head)
            results.append(
                {
                    "symbol": symbol,
                    "direction": "bullish",
                    "pattern": "inverseHeadShoulders",
                    "status": "detected" if current_price > neckline else "pending",
                    "completion": 90,
                    "reliability": "high",
                    "breakoutLevel": round(float(neckline), 6),
                    "targetPrice": round(float(target), 6),
                }
            )

    # ── Triangle patterns (use last 20 points) ──────────────────────
    if n >= 20:
        recent = arr[-20:]
        step = max(1, len(recent) // 10)
        highs = [float(recent[max(0, i - step) : i + 1].max()) for i in range(step, len(recent))]
        lows = [float(recent[max(0, i - step) : i + 1].min()) for i in range(step, len(recent))]

        if highs and lows:
            high_arr = np.array(highs)
            low_arr = np.array(lows)
            x = np.arange(len(highs), dtype=float)

            high_slope = float(np.polyfit(x, high_arr, 1)[0])
            low_slope = float(np.polyfit(x, low_arr, 1)[0])
            high_std = float(np.std(high_arr) / np.mean(high_arr)) if np.mean(high_arr) != 0 else 1.0

            # Ascending triangle
            if high_std < 0.02 and low_slope > 0:
                breakout = float(high_arr.max()) * 1.02
                pattern_height = float(high_arr.max()) - float(low_arr.min())
                results.append(
                    {
                        "symbol": symbol,
                        "direction": "bullish",
                        "pattern": "ascendingTriangle",
                        "status": "detected" if current_price > float(high_arr.max()) else "pending",
                        "completion": min(100, int(60 + (1 - high_std * 50) * 40)),
                        "reliability": "medium",
                        "breakoutLevel": round(breakout, 6),
                        "targetPrice": round(breakout + pattern_height, 6),
                    }
                )

            low_std = float(np.std(low_arr) / np.mean(low_arr)) if np.mean(low_arr) != 0 else 1.0

            # Descending triangle
            if low_std < 0.02 and high_slope < 0:
                breakout = float(low_arr.min()) * 0.98
                pattern_height = float(high_arr.max()) - float(low_arr.min())
                results.append(
                    {
                        "symbol": symbol,
                        "direction": "bearish",
                        "pattern": "descendingTriangle",
                        "status": "detected" if current_price < float(low_arr.min()) else "pending",
                        "completion": min(100, int(60 + (1 - low_std * 50) * 40)),
                        "reliability": "medium",
                        "breakoutLevel": round(breakout, 6),
                        "targetPrice": round(max(breakout - pattern_height, breakout * 0.8), 6),
                    }
                )

    # ── Flag patterns ────────────────────────────────────────────────
    if n >= 15:
        impulse = arr[: n - 10]
        flag = arr[n - 10 :]
        impulse_move = float(impulse[-1] - impulse[0])
        flag_range = float(flag.max() - flag.min())
        total_range = float(arr.max() - arr.min())

        if total_range > 0 and flag_range / total_range < 0.3 and abs(impulse_move) / float(arr.max()) > 0.02:
            if impulse_move > 0:
                breakout = float(flag.max()) * 1.01
                target = breakout + abs(impulse_move) * 0.8
                results.append(
                    {
                        "symbol": symbol,
                        "direction": "bullish",
                        "pattern": "bullishFlag",
                        "status": "detected" if current_price > float(flag.max()) else "pending",
                        "completion": min(100, int(50 + (1 - flag_range / total_range) * 60)),
                        "reliability": "medium",
                        "breakoutLevel": round(breakout, 6),
                        "targetPrice": round(target, 6),
                    }
                )
            else:
                breakout = float(flag.min()) * 0.99
                target = breakout - abs(impulse_move) * 0.8
                results.append(
                    {
                        "symbol": symbol,
                        "direction": "bearish",
                        "pattern": "bearishFlag",
                        "status": "detected" if current_price < float(flag.min()) else "pending",
                        "completion": min(100, int(50 + (1 - flag_range / total_range) * 60)),
                        "reliability": "medium",
                        "breakoutLevel": round(breakout, 6),
                        "targetPrice": round(max(target, breakout * 0.8), 6),
                    }
                )

    return results


def _get_patterns_for_symbol(symbol: str, db: Session) -> List[dict]:
    """Fetch price data and detect patterns for a given symbol."""
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

    prices = [r.last_price for r in records if r.last_price is not None]
    return _detect_patterns(symbol, prices)


@router.get("/scan")
def scan_patterns(
    symbols: Optional[str] = Query(
        None,
        description="Comma-separated list of symbols (e.g. BTCUSDT,ETHUSDT). "
        "Defaults to all symbols in the database.",
    ),
    db: Session = Depends(get_db),
):
    """Scan multiple symbols for chart patterns using real market data."""
    try:
        if symbols:
            symbol_list = [s.strip() for s in symbols.split(",") if s.strip()]
        else:
            # Use all symbols present in the DB
            rows = db.query(ContractMarket.symbol).distinct().all()
            if not rows:
                return {"patterns": [], "total": 0}
            # Convert DB symbols (BTC_USDT) back to frontend format (BTCUSDT)
            symbol_list = [row[0].replace("_", "") for row in rows]

        if not symbol_list:
            return {"patterns": [], "total": 0}

        # Normalize requested symbols to DB format (e.g. BTCUSDT -> BTC_USDT)
        db_symbol_map = {}
        for sym in symbol_list:
            db_sym = normalize_symbol(sym)
            db_symbol_map[db_sym] = sym

        db_symbols = list(db_symbol_map.keys())

        # Fetch all records for the requested symbols in a single query
        records = (
            db.query(ContractMarket)
            .filter(ContractMarket.symbol.in_(db_symbols))
            .order_by(ContractMarket.symbol.asc(), ContractMarket.created_at.asc())
            .all()
        )

        # Group records by DB symbol
        grouped_records = {}
        for r in records:
            grouped_records.setdefault(r.symbol, []).append(r)

        all_patterns: List[dict] = []
        for sym in symbol_list:
            try:
                db_sym = normalize_symbol(sym)
                sym_records = grouped_records.get(db_sym, [])
                if not sym_records:
                    continue
                prices = [
                    r.last_price for r in sym_records if r.last_price is not None
                ]
                if not prices:
                    continue
                patterns = _detect_patterns(sym, prices)
                all_patterns.extend(patterns)
            except Exception as e:
                logger.warning(f"Pattern detection failed for {sym}: {e}")

        return {"patterns": all_patterns, "total": len(all_patterns)}

    except Exception as exc:
        logger.error(f"Error scanning patterns: {exc}")
        raise HTTPException(status_code=500, detail="Pattern scan failed")


@router.get("/{symbol}")
def get_symbol_patterns(symbol: str, db: Session = Depends(get_db)):
    """Get chart patterns for a single symbol."""
    try:
        patterns = _get_patterns_for_symbol(symbol, db)
        return {"symbol": symbol, "patterns": patterns, "total": len(patterns)}
    except Exception as exc:
        logger.error(f"Error detecting patterns for {symbol}: {exc}")
        raise HTTPException(status_code=500, detail="Pattern detection failed")
