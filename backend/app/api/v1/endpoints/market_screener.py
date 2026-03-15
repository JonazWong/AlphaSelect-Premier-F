"""
Market Screener API endpoints

GET /api/v1/screener/scan     — scan all symbols and return screener results
GET /api/v1/screener/{symbol} — screener data for a single symbol
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import logging
import numpy as np

from app.db.session import get_db
from app.models.contract_market import ContractMarket
from app.models.ai_model import AIModel

logger = logging.getLogger(__name__)

router = APIRouter()


def normalize_symbol(symbol: str) -> str:
    """Convert frontend BTCUSDT format to DB BTC_USDT format."""
    if "_" not in symbol and len(symbol) > 4 and symbol.endswith("USDT"):
        return symbol[:-4] + "_USDT"
    return symbol


def _compute_screener_row(db_symbol: str, display_symbol: str, db: Session) -> Optional[dict]:
    """Compute screener metrics for one symbol using the latest market records."""
    # Get latest record for spot metrics
    latest = (
        db.query(ContractMarket)
        .filter(ContractMarket.symbol == db_symbol)
        .order_by(ContractMarket.created_at.desc())
        .first()
    )
    if latest is None or latest.last_price is None:
        return None

    price = float(latest.last_price)
    change24h = float(latest.price_change_24h or 0.0)
    volume24h = float(latest.volume_24h or 0.0)
    funding_rate = float(latest.funding_rate or 0.0)
    long_short_ratio = float(latest.long_short_ratio or 1.0)

    # Get recent prices for trend analysis (last 20 records)
    recent = (
        db.query(ContractMarket.last_price, ContractMarket.price_change_24h)
        .filter(ContractMarket.symbol == db_symbol, ContractMarket.last_price.isnot(None))
        .order_by(ContractMarket.created_at.desc())
        .limit(20)
        .all()
    )

    prices = [float(r[0]) for r in recent if r[0] is not None]
    prices.reverse()  # oldest first

    # ── Trend direction (side) ────────────────────────────────────────
    if len(prices) >= 5:
        slope = float(np.polyfit(range(len(prices)), prices, 1)[0])
        side = "long" if slope > 0 else "short"
    elif change24h != 0:
        side = "long" if change24h > 0 else "short"
    else:
        side = "long" if long_short_ratio >= 1.0 else "short"

    # ── Confidence score ──────────────────────────────────────────────
    # Combine multiple signals:
    # 1. Trend strength (price momentum)
    # 2. Volume signal
    # 3. Funding rate alignment
    score = 50.0

    if len(prices) >= 5:
        price_range = max(prices) - min(prices)
        if price_range > 0:
            momentum = abs(prices[-1] - prices[0]) / price_range
            score += momentum * 20

    # Funding rate: positive → long bias; negative → short bias
    fr_signal = abs(funding_rate) * 1000  # scale ~0.01% to 10
    score += min(fr_signal, 15)

    # Long/short ratio signal
    lsr = max(0.5, min(long_short_ratio, 2.0))  # clamp
    lsr_dev = abs(lsr - 1.0)  # deviation from neutral
    score += lsr_dev * 10

    confidence = int(min(95, max(40, score)))

    # ── Risk level ────────────────────────────────────────────────────
    volatility = 0.0
    if len(prices) >= 5:
        pct_changes = [abs(prices[i] / prices[i - 1] - 1) for i in range(1, len(prices))]
        volatility = float(np.mean(pct_changes)) * 100  # in %

    if volatility < 1.0:
        risk_level = "low"
    elif volatility < 3.0:
        risk_level = "medium"
    else:
        risk_level = "high"

    # Also check if a trained AI model exists for extra confidence boost
    has_model = (
        db.query(AIModel.id)
        .filter(AIModel.symbol == db_symbol, AIModel.status == "trained")
        .first()
        is not None
    )
    if has_model:
        confidence = min(95, confidence + 5)

    return {
        "symbol": display_symbol,
        "price": round(price, 6),
        "change24h": round(change24h, 4),
        "confidence": confidence,
        "side": side,
        "riskLevel": risk_level,
        "volume24h": round(volume24h, 2),
        "fundingRate": round(funding_rate, 6),
    }


@router.get("/scan")
def scan_screener(
    symbols: Optional[str] = Query(
        None,
        description="Comma-separated list of symbols (e.g. BTCUSDT,ETHUSDT). "
        "Defaults to all symbols in the database.",
    ),
    db: Session = Depends(get_db),
):
    """Scan market symbols and return screener results with AI-enhanced confidence."""
    try:
        if symbols:
            symbol_list = [s.strip() for s in symbols.split(",") if s.strip()]
        else:
            rows = db.query(ContractMarket.symbol).distinct().all()
            if not rows:
                return {"results": [], "total": 0}
            # Convert DB symbols to display symbols
            symbol_list = [row[0].replace("_", "") for row in rows]

        results: List[dict] = []
        for sym in symbol_list:
            try:
                db_sym = normalize_symbol(sym)
                row = _compute_screener_row(db_sym, sym, db)
                if row:
                    results.append(row)
            except Exception as e:
                logger.warning(f"Screener failed for {sym}: {e}")

        # Sort by confidence descending
        results.sort(key=lambda r: r["confidence"], reverse=True)

        return {"results": results, "total": len(results)}

    except Exception as exc:
        logger.error(f"Error in screener scan: {exc}")
        raise HTTPException(status_code=500, detail="Screener scan failed")


@router.get("/{symbol}")
def get_symbol_screener(symbol: str, db: Session = Depends(get_db)):
    """Get screener data for a single symbol."""
    try:
        db_symbol = normalize_symbol(symbol)
        row = _compute_screener_row(db_symbol, symbol, db)
        if row is None:
            raise HTTPException(
                status_code=404,
                detail=f"No market data found for symbol {symbol}",
            )
        return row
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error in screener for {symbol}: {exc}")
        raise HTTPException(status_code=500, detail="Screener failed")
