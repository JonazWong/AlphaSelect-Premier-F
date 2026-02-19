from sqlalchemy import Column, String, Float, DateTime, Integer, Index
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
import uuid
from app.db.session import Base


class Prediction(Base):
    """AI 預測數據表"""
    __tablename__ = 'predictions'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    symbol = Column(String, nullable=False, index=True)
    model_id = Column(String, nullable=False)
    model_type = Column(String, nullable=False)
    prediction_type = Column(String, default='price')  # price, direction
    predicted_value = Column(Float)
    confidence_score = Column(Float)
    prediction_horizon = Column(Integer)  # Periods ahead (e.g., 24 hours)
    prediction_time = Column(DateTime, default=datetime.utcnow, index=True)
    target_time = Column(DateTime)  # When the prediction is for
    actual_value = Column(Float)  # Filled after target_time
    extra_data = Column(JSONB)  # 額外數據 (renamed from metadata to avoid SQLAlchemy conflict)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_symbol_prediction_time', 'symbol', 'prediction_time'),
    )

    def __repr__(self):
        return f"<Prediction {self.symbol} {self.predicted_value} by {self.model_type}>"
