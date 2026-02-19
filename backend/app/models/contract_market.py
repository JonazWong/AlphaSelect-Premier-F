from sqlalchemy import Column, String, Float, DateTime, Integer, Index
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
import uuid
from app.db.session import Base


class ContractMarket(Base):
    """合約市場數據表"""
    __tablename__ = 'contract_markets'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    symbol = Column(String, nullable=False, index=True)
    last_price = Column(Float)
    fair_price = Column(Float)  # 標記價格 (Mark price)
    index_price = Column(Float)  # 指數價格
    funding_rate = Column(Float)
    next_funding_time = Column(DateTime)
    open_interest = Column(Float)  # 持倉量
    volume_24h = Column(Float)
    turnover_24h = Column(Float)  # 成交額（美元）
    price_change_24h = Column(Float)
    high_24h = Column(Float)
    low_24h = Column(Float)
    basis = Column(Float)  # 基差 (Contract price - Index price)
    basis_rate = Column(Float)  # 基差率
    long_short_ratio = Column(Float)  # 多空比
    extra_data = Column(JSONB)  # 額外數據 (renamed from metadata to avoid SQLAlchemy conflict)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_symbol_created', 'symbol', 'created_at'),
    )

    def __repr__(self):
        return f"<ContractMarket {self.symbol} at {self.last_price}>"
