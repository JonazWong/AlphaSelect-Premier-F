from sqlalchemy import Column, String, Float, DateTime
from datetime import datetime
import uuid
from app.db.session import Base


class OpenInterestHistory(Base):
    __tablename__ = 'open_interest_history'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    symbol = Column(String, nullable=False, index=True)
    open_interest = Column(Float, nullable=False)
    open_interest_value = Column(Float)  # OI in USD
    timestamp = Column(DateTime, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<OpenInterest {self.symbol} {self.open_interest} at {self.timestamp}>"
