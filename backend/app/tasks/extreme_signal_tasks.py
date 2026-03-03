"""
Celery task: scan_extreme_reversals
Runs every 60 seconds; scans top symbols across timeframes,
persists signals to Postgres, and broadcasts via Socket.IO.
"""
from __future__ import annotations

import asyncio
import logging
from typing import List, Dict, Any

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)

# Timeframe label → MEXC kline interval string
TIMEFRAME_MAP = {
    "5m": "Min5",
    "15m": "Min15",
    "30m": "Min30",
    "1h": "Min60",
    "4h": "Hour4",
}

# How many top-volume symbols to scan
TOP_N_SYMBOLS = 30


def _get_top_symbols(api) -> List[str]:
    """Return top-N symbols by 24h volume from MEXC tickers."""
    try:
        tickers = api.get_all_contract_tickers()
        if not tickers:
            return ["BTC_USDT", "ETH_USDT", "SOL_USDT"]
        sorted_tickers = sorted(
            tickers,
            key=lambda t: float(t.get("volume24", 0) or 0),
            reverse=True,
        )
        symbols = [t["symbol"] for t in sorted_tickers[:TOP_N_SYMBOLS] if "symbol" in t]
        return symbols if symbols else ["BTC_USDT", "ETH_USDT", "SOL_USDT"]
    except Exception as exc:
        logger.warning(f"Failed to fetch tickers: {exc}")
        return ["BTC_USDT", "ETH_USDT", "SOL_USDT"]


def _fetch_klines(api, symbol: str, interval: str) -> Dict[str, List[float]]:
    """Return closes and volumes for a symbol/interval."""
    try:
        klines = api.get_contract_klines(symbol=symbol, interval=interval, limit=60)
        if not klines:
            return {"closes": [], "volumes": []}
        closes: List[float] = []
        volumes: List[float] = []
        for bar in klines:
            if isinstance(bar, dict):
                c = bar.get("close") or bar.get("c") or bar.get("closePrice")
                v = bar.get("vol") or bar.get("volume") or bar.get("v") or 0
            elif isinstance(bar, (list, tuple)):
                c = bar[4] if len(bar) > 4 else None
                v = bar[5] if len(bar) > 5 else 0
            else:
                continue
            if c is not None:
                closes.append(float(c))
                volumes.append(float(v))
        return {"closes": closes, "volumes": volumes}
    except Exception as exc:
        logger.debug(f"kline fetch {symbol}/{interval}: {exc}")
        return {"closes": [], "volumes": []}


def _fetch_extra(api, symbol: str) -> Dict[str, float]:
    """Fetch funding rate and open interest."""
    result: Dict[str, float] = {"funding_rate": 0.0, "oi_change": 0.0, "liquidation": 0.0}
    try:
        fr_data = api.get_funding_rate(symbol)
        if isinstance(fr_data, dict):
            result["funding_rate"] = float(fr_data.get("fundingRate") or 0.0)
    except Exception:
        pass
    try:
        oi_data = api.get_open_interest(symbol)
        if isinstance(oi_data, dict):
            result["oi_change"] = float(oi_data.get("openInterest") or 0.0)
    except Exception:
        pass
    return result


def _broadcast_signal(signal_dict: dict) -> None:
    """Fire-and-forget Socket.IO broadcast from sync context."""
    try:
        from app.websocket.manager import broadcast_extreme_signal
        loop = asyncio.new_event_loop()
        loop.run_until_complete(broadcast_extreme_signal(signal_dict))
        loop.close()
    except Exception as exc:
        logger.debug(f"broadcast_extreme_signal failed: {exc}")


@celery_app.task(name="scan_extreme_reversals", bind=True, max_retries=1)
def scan_extreme_reversals(self):
    """Scan top-30 symbols × 5 timeframes → persist + broadcast signals."""
    from app.core.mexc.contract import mexc_contract_api
    from app.services.extreme_signal_service import analyse_kline
    from app.db.session import SessionLocal
    from app.models.extreme_signal import ExtremeSignal

    db = SessionLocal()
    signals_created = 0
    try:
        symbols = _get_top_symbols(mexc_contract_api)
        logger.info(f"scan_extreme_reversals: scanning {len(symbols)} symbols")

        for symbol in symbols:
            for tf_label, mexc_interval in TIMEFRAME_MAP.items():
                klines = _fetch_klines(mexc_contract_api, symbol, mexc_interval)
                closes = klines["closes"]
                volumes = klines["volumes"]
                if len(closes) < 27:
                    continue

                extra = _fetch_extra(mexc_contract_api, symbol)
                result = analyse_kline(
                    symbol=symbol,
                    timeframe=tf_label,
                    closes=closes,
                    volumes=volumes,
                    funding_rate=extra["funding_rate"],
                    oi_change=extra["oi_change"],
                    liquidation=extra["liquidation"],
                )
                if result is None:
                    continue

                signal = ExtremeSignal(**result)
                db.add(signal)
                db.flush()
                db.refresh(signal)

                payload = {
                    "id": signal.id,
                    "symbol": signal.symbol,
                    "signal_type": signal.signal_type,
                    "urgency": signal.urgency,
                    "timeframe": signal.timeframe,
                    "confidence": signal.confidence,
                    "current_price": signal.current_price,
                    "price_change": signal.price_change,
                    "rsi": signal.rsi,
                    "ai_score": signal.ai_score,
                    "triggers": signal.triggers,
                }
                _broadcast_signal(payload)
                signals_created += 1

        db.commit()
        logger.info(f"scan_extreme_reversals: {signals_created} signals created")
        return {"signals_created": signals_created}

    except Exception as exc:
        db.rollback()
        logger.error(f"scan_extreme_reversals error: {exc}", exc_info=True)
        raise self.retry(exc=exc, countdown=30)
    finally:
        db.close()
