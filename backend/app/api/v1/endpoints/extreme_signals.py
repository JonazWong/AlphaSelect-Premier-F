"""
Extreme Reversal Signals API endpoints

GET /api/v1/extreme-signals        — list with filter / sort / pagination
GET /api/v1/extreme-signals/{id}   — single signal detail
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, timedelta
import logging

from app.db.session import get_db
from app.models.extreme_signal import ExtremeSignal
from app.schemas.extreme_signal import (
    ExtremeSignalListResponse,
    ExtremeSignalResponse,
    ExtremeSignalStats,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("", response_model=ExtremeSignalListResponse)
def list_extreme_signals(
    timeframe: Optional[str] = Query(None, description="5m/15m/30m/1h/4h"),
    type: Optional[str] = Query(None, description="bounce/pullback"),
    urgency: Optional[str] = Query(None, description="critical/high/medium"),
    sort: str = Query("confidence", description="confidence/time/volume/change"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Return filtered + sorted list of extreme reversal signals with stats."""
    try:
        q = db.query(ExtremeSignal)

        if timeframe:
            q = q.filter(ExtremeSignal.timeframe == timeframe)
        if type:
            q = q.filter(ExtremeSignal.signal_type == type)
        if urgency:
            q = q.filter(ExtremeSignal.urgency == urgency)

        # Sort
        if sort == "confidence":
            q = q.order_by(ExtremeSignal.confidence.desc())
        elif sort == "time":
            q = q.order_by(ExtremeSignal.detected_at.desc())
        elif sort == "volume":
            q = q.order_by(ExtremeSignal.volume_multiplier.desc().nullslast())
        elif sort == "change":
            q = q.order_by(func.abs(ExtremeSignal.price_change).desc().nullslast())
            q = q.order_by(ExtremeSignal.price_change.desc().nullslast())
        else:
            q = q.order_by(ExtremeSignal.confidence.desc())

        total = q.count()
        signals = q.offset(offset).limit(limit).all()

        # Aggregate stats using SQL (efficient even with large tables)
        total_all = db.query(func.count(ExtremeSignal.id)).scalar() or 0
        bounce_count = (
            db.query(func.count(ExtremeSignal.id))
            .filter(ExtremeSignal.signal_type == "bounce")
            .scalar() or 0
        )
        pullback_count = (
            db.query(func.count(ExtremeSignal.id))
            .filter(ExtremeSignal.signal_type == "pullback")
            .scalar() or 0
        )
        critical_count = (
            db.query(func.count(ExtremeSignal.id))
            .filter(ExtremeSignal.urgency == "critical")
            .scalar() or 0
        )
        avg_conf_result = db.query(func.avg(ExtremeSignal.confidence)).scalar()
        avg_conf = float(avg_conf_result) if avg_conf_result is not None else 0.0

        stats = ExtremeSignalStats(
            total=total_all,
            bounce_count=bounce_count,
            pullback_count=pullback_count,
            critical_count=critical_count,
            avg_confidence=round(avg_conf, 1),
        )

        return ExtremeSignalListResponse(
            signals=[ExtremeSignalResponse.model_validate(s) for s in signals],
            stats=stats,
            total=total,
            offset=offset,
            limit=limit,
        )
    except Exception as exc:
        logger.error(f"Error listing extreme signals: {exc}")
        raise HTTPException(status_code=500, detail="Failed to retrieve signals")


@router.get("/{signal_id}", response_model=ExtremeSignalResponse)
def get_extreme_signal(signal_id: str, db: Session = Depends(get_db)):
    """Return detail for a single extreme reversal signal."""
    signal = db.query(ExtremeSignal).filter(ExtremeSignal.id == signal_id).first()
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")
    return ExtremeSignalResponse.model_validate(signal)
