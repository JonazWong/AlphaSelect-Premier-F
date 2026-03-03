"""
Celery task: scan_extreme_reversals

Runs every minute, fetches market data via MEXC API, detects extreme reversal
signals, persists them to PostgreSQL, and broadcasts via Socket.IO.
"""

import logging
import asyncio
import os
from datetime import datetime

from app.tasks.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.extreme_signal import ExtremeSignal
from app.services.extreme_signal_service import ExtremeSignalService

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")


def _broadcast_signal(signal_data: dict):
    """Cross-process broadcast via Redis → Socket.IO."""
    try:
        import socketio as sio_module

        async def _emit():
            manager = sio_module.AsyncRedisManager(REDIS_URL, write_only=True)
            await manager.emit("new_extreme_signal", signal_data, room="extreme-signals")

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(_emit())
        loop.close()
    except Exception as exc:
        logger.warning(f"[extreme_signal_tasks] broadcast failed: {exc}")


@celery_app.task(name="scan_extreme_reversals")
def scan_extreme_reversals():
    """
    Periodic task: scan MEXC contract pairs for extreme reversal signals.

    1. Call ExtremeSignalService.scan_symbols() — uses mexc_contract_api
       (rate limiter + circuit breaker enforced inside the service).
    2. Persist new signals to PostgreSQL.
    3. Broadcast each signal to the 'extreme-signals' Socket.IO room.
    """
    logger.info("[scan_extreme_reversals] Starting scan...")
    db = SessionLocal()
    service = ExtremeSignalService()

    try:
        signals = service.scan_symbols()
        logger.info(f"[scan_extreme_reversals] Detected {len(signals)} signal(s)")

        for sig_dict in signals:
            try:
                signal = ExtremeSignal(
                    id=sig_dict["id"],
                    symbol=sig_dict["symbol"],
                    signal_type=sig_dict["signal_type"],
                    urgency=sig_dict["urgency"],
                    timeframe=sig_dict["timeframe"],
                    confidence=sig_dict["confidence"],
                    current_price=sig_dict.get("current_price"),
                    price_change=sig_dict.get("price_change"),
                    predicted_move=sig_dict.get("predicted_move"),
                    rsi=sig_dict.get("rsi"),
                    volume_multiplier=sig_dict.get("volume_multiplier"),
                    macd_status=sig_dict.get("macd_status"),
                    bb_position=sig_dict.get("bb_position"),
                    ai_score=sig_dict.get("ai_score"),
                    lstm_prediction=sig_dict.get("lstm_prediction"),
                    xgb_prediction=sig_dict.get("xgb_prediction"),
                    arima_trend=sig_dict.get("arima_trend"),
                    funding_rate=sig_dict.get("funding_rate"),
                    open_interest_change=sig_dict.get("open_interest_change"),
                    liquidation_amount=sig_dict.get("liquidation_amount"),
                    triggers=sig_dict.get("triggers", []),
                    detected_at=sig_dict.get("detected_at", datetime.utcnow()),
                    created_at=sig_dict.get("created_at", datetime.utcnow()),
                )
                db.add(signal)
                db.commit()

                # Broadcast (serialise datetimes to ISO strings)
                broadcast_payload = {
                    k: (v.isoformat() if isinstance(v, datetime) else v)
                    for k, v in sig_dict.items()
                }
                _broadcast_signal(broadcast_payload)

            except Exception as exc:
                db.rollback()
                logger.error(f"[scan_extreme_reversals] Error saving signal {sig_dict.get('id')}: {exc}")

        logger.info("[scan_extreme_reversals] Scan complete.")
        return {"scanned": len(signals)}

    except Exception as exc:
        logger.error(f"[scan_extreme_reversals] Fatal error: {exc}")
        raise
    finally:
        db.close()
