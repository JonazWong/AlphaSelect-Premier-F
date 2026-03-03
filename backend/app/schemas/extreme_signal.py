"""
Pydantic schemas for ExtremeSignal API responses.
"""
from __future__ import annotations
from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel


class ExtremeSignalResponse(BaseModel):
    id: int
    symbol: str
    signal_type: str
    urgency: str
    timeframe: str
    confidence: float
    price_change: float
    current_price: float
    predicted_move: float
    rsi: Optional[float]
    volume_multiplier: Optional[float]
    macd_status: Optional[str]
    bb_position: Optional[str]
    ai_score: Optional[float]
    lstm_prediction: Optional[str]
    xgb_prediction: Optional[str]
    arima_trend: Optional[str]
    funding_rate: Optional[float]
    open_interest_change: Optional[float]
    liquidation_amount: Optional[float]
    triggers: Optional[List[str]] = []
    detected_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class ExtremeSignalStats(BaseModel):
    total: int
    bounce_count: int
    pullback_count: int
    critical_count: int
    avg_confidence: float


class ExtremeSignalListResponse(BaseModel):
    items: List[ExtremeSignalResponse]
    total: int
    stats: ExtremeSignalStats
