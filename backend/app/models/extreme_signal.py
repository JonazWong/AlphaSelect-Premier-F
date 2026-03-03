"""
ExtremeSignal ORM Model — stores detected bounce/pullback signals.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.db.base import Base


class ExtremeSignal(Base):
    __tablename__ = "extreme_signals"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(50), nullable=False, index=True)
    signal_type = Column(String(20), nullable=False)       # bounce | pullback
    urgency = Column(String(20), nullable=False)           # critical | high | medium
    timeframe = Column(String(10), nullable=False)         # 5m | 15m | 30m | 1h | 4h

    # Confidence & price
    confidence = Column(Float, nullable=False)
    price_change = Column(Float, default=0.0)
    current_price = Column(Float, default=0.0)
    predicted_move = Column(Float, default=0.0)

    # Technical indicators
    rsi = Column(Float, nullable=True)
    volume_multiplier = Column(Float, nullable=True)
    macd_status = Column(String(50), nullable=True)
    bb_position = Column(String(50), nullable=True)
    ai_score = Column(Float, nullable=True)

    # AI model predictions
    lstm_prediction = Column(String(20), nullable=True)    # e.g. "+3.2%"
    xgb_prediction = Column(String(20), nullable=True)
    arima_trend = Column(String(20), nullable=True)

    # Contract data
    funding_rate = Column(Float, nullable=True)
    open_interest_change = Column(Float, nullable=True)
    liquidation_amount = Column(Float, nullable=True)

    # Trigger tags (JSONB list)
    triggers = Column(JSONB, default=list)

    # Timestamps
    detected_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_extreme_signals_symbol_timeframe", "symbol", "timeframe"),
        Index("ix_extreme_signals_urgency_detected", "urgency", "detected_at"),
    )

    def __repr__(self):
        return (
            f"<ExtremeSignal id={self.id} symbol={self.symbol} "
            f"type={self.signal_type} urgency={self.urgency} "
            f"confidence={self.confidence:.2f}>"
        )
