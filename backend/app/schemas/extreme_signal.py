"""
Pydantic schemas for Extreme Reversal Signal API
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime


class ExtremeSignalResponse(BaseModel):
    """Single extreme reversal signal"""
    id: str
    symbol: str
    signal_type: str = Field(..., description="bounce or pullback")
    urgency: str = Field(..., description="critical / high / medium")
    timeframe: str
    confidence: float
    current_price: Optional[float] = None
    price_change: Optional[float] = None
    predicted_move: Optional[float] = None

    # Technical indicators
    rsi: Optional[float] = None
    volume_multiplier: Optional[float] = None
    macd_status: Optional[str] = None
    bb_position: Optional[str] = None

    # AI
    ai_score: Optional[float] = None
    lstm_prediction: Optional[float] = None
    xgb_prediction: Optional[float] = None
    arima_trend: Optional[str] = None

    # Contract data
    funding_rate: Optional[float] = None
    open_interest_change: Optional[float] = None
    liquidation_amount: Optional[float] = None

    triggers: List[str] = []

    detected_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ExtremeSignalStats(BaseModel):
    """Aggregate statistics for the signal list"""
    total: int
    bounce_count: int
    pullback_count: int
    critical_count: int
    avg_confidence: float


class ExtremeSignalListResponse(BaseModel):
    """Paginated list response"""
    signals: List[ExtremeSignalResponse]
    stats: ExtremeSignalStats
    total: int
    offset: int
    limit: int
