from sqlalchemy import Column, String, Float, DateTime, Integer, Index
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
import uuid
from app.db.session import Base


class ExtremeSignal(Base):
    """極端反轉信號表"""
    __tablename__ = 'extreme_signals'

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    symbol = Column(String, nullable=False, index=True)
    signal_type = Column(String, nullable=False)  # bounce / pullback
    urgency = Column(String, nullable=False)  # critical / high / medium
    timeframe = Column(String, nullable=False)  # 5m / 15m / 30m / 1h / 4h
    confidence = Column(Float, nullable=False)
    current_price = Column(Float)
    price_change = Column(Float)  # recent % change
    predicted_move = Column(Float)  # predicted move %

    # Technical indicators
    rsi = Column(Float)
    volume_multiplier = Column(Float)
    macd_status = Column(String)  # bullish_divergence / bearish_divergence / neutral
    bb_position = Column(String)  # above_upper / below_lower / inside

    # AI scores
    ai_score = Column(Float)
    lstm_prediction = Column(Float)
    xgb_prediction = Column(Float)
    arima_trend = Column(String)  # upward / downward / sideways

    # Contract data
    funding_rate = Column(Float)
    open_interest_change = Column(Float)
    liquidation_amount = Column(Float)

    # Trigger tags (array stored as JSONB list of strings)
    triggers = Column(JSONB, default=list)

    detected_at = Column(DateTime, default=datetime.utcnow, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index('idx_extreme_signal_symbol_detected', 'symbol', 'detected_at'),
        Index('idx_extreme_signal_urgency', 'urgency'),
        Index('idx_extreme_signal_type', 'signal_type'),
    )

    def __repr__(self):
        return f"<ExtremeSignal {self.symbol} {self.signal_type} {self.urgency} conf={self.confidence:.1f}>"
