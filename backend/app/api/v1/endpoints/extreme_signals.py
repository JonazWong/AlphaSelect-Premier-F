"""
Extreme Signals API — GET /api/v1/extreme-signals
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc
from typing import Optional, List
import logging

from app.db.session import get_db
from app.models.extreme_signal import ExtremeSignal
from app.schemas.extreme_signal import (
    ExtremeSignalResponse,
    ExtremeSignalListResponse,
    ExtremeSignalStats,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=ExtremeSignalListResponse)
async def list_extreme_signals(
    timeframe: Optional[str] = Query(None, description="5m|15m|30m|1h|4h"),
    type: Optional[str] = Query(None, description="bounce|pullback"),
    urgency: Optional[str] = Query(None, description="critical|high|medium"),
    sort: Optional[str] = Query("confidence", description="confidence|time|volume|change"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Return filtered extreme reversal signals with aggregate stats."""
    q = db.query(ExtremeSignal)

    if timeframe:
        q = q.filter(ExtremeSignal.timeframe == timeframe)
    if type:
        q = q.filter(ExtremeSignal.signal_type == type)
    if urgency:
        q = q.filter(ExtremeSignal.urgency == urgency)

    # Sort
    sort_map = {
        "confidence": desc(ExtremeSignal.confidence),
        "time": desc(ExtremeSignal.detected_at),
        "volume": desc(ExtremeSignal.volume_multiplier),
        "change": desc(ExtremeSignal.price_change),
    }
    order_col = sort_map.get(sort, desc(ExtremeSignal.confidence))
    q = q.order_by(order_col)

    total = q.count()
    items = q.offset(offset).limit(limit).all()

    # Stats (full un-paginated query)
    stats_q = db.query(ExtremeSignal)
    if timeframe:
        stats_q = stats_q.filter(ExtremeSignal.timeframe == timeframe)
    if type:
        stats_q = stats_q.filter(ExtremeSignal.signal_type == type)
    if urgency:
        stats_q = stats_q.filter(ExtremeSignal.urgency == urgency)

    bounce = stats_q.filter(ExtremeSignal.signal_type == "bounce").count()
    pullback = stats_q.filter(ExtremeSignal.signal_type == "pullback").count()
    critical = stats_q.filter(ExtremeSignal.urgency == "critical").count()
    avg_conf = stats_q.with_entities(func.avg(ExtremeSignal.confidence)).scalar() or 0.0

    stats = ExtremeSignalStats(
        total=total,
        bounce_count=bounce,
        pullback_count=pullback,
        critical_count=critical,
        avg_confidence=round(float(avg_conf), 1),
    )

    return ExtremeSignalListResponse(items=items, total=total, stats=stats)


@router.get("/{signal_id}", response_model=ExtremeSignalResponse)
async def get_extreme_signal(signal_id: int, db: Session = Depends(get_db)):
    """Return a single extreme signal by ID."""
    signal = db.query(ExtremeSignal).filter(ExtremeSignal.id == signal_id).first()
    if not signal:
        raise HTTPException(status_code=404, detail=f"Signal {signal_id} not found")
    return signal
