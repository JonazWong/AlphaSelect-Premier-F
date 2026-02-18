from sqlalchemy import Column, String, Float, DateTime, Integer
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
import uuid
from app.db.session import Base


class ContractMarket(Base):
    __tablename__ = 'contract_markets'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    symbol = Column(String, nullable=False, index=True)
    last_price = Column(Float)
    fair_price = Column(Float)  # Mark price
    index_price = Column(Float)
    funding_rate = Column(Float)
    next_funding_time = Column(DateTime)
    open_interest = Column(Float)
    volume_24h = Column(Float)
    price_change_24h = Column(Float)
    high_24h = Column(Float)
    low_24h = Column(Float)
    basis = Column(Float)  # Contract price - Index price
    basis_rate = Column(Float)
    metadata = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<ContractMarket {self.symbol} at {self.last_price}>"
