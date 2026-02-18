from sqlalchemy import Column, String, Float, DateTime
from datetime import datetime
import uuid
from app.db.session import Base


class FundingRateHistory(Base):
    __tablename__ = 'funding_rate_history'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    symbol = Column(String, nullable=False, index=True)
    funding_rate = Column(Float, nullable=False)
    settle_time = Column(DateTime, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<FundingRate {self.symbol} {self.funding_rate} at {self.settle_time}>"
