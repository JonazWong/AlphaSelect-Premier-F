"""
Schemas for contract market endpoints
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class ContractMarketResponse(BaseModel):
    """Contract market ticker response"""
    symbol: str = Field(..., description="Trading pair symbol")
    last_price: float = Field(..., alias="lastPrice", description="Last traded price in USD")
    fair_price: Optional[float] = Field(None, alias="fairPrice", description="Mark price in USD")
    index_price: Optional[float] = Field(None, alias="indexPrice", description="Index price in USD")
    funding_rate: Optional[float] = Field(None, alias="fundingRate", description="Current funding rate")
    open_interest: Optional[float] = Field(None, alias="openInterest", description="Open interest")
    volume_24h: Optional[float] = Field(None, alias="volume24", description="24h volume")
    price_change_24h: Optional[float] = Field(None, alias="riseFallRate", description="24h price change %")
    high_24h: Optional[float] = Field(None, alias="high24Price", description="24h high in USD")
    low_24h: Optional[float] = Field(None, alias="low24Price", description="24h low in USD")
    currency: str = Field(default="USD", description="Currency unit")
    
    class Config:
        populate_by_name = True


class ContractSignalResponse(BaseModel):
    """Trading signal response for Crypto Radar"""
    symbol: str = Field(..., description="Trading pair symbol")
    direction: str = Field(..., description="Long or Short")
    current_price: float = Field(..., alias="currentPrice", description="Current price in USD")
    entry_price: float = Field(..., alias="entryPrice", description="Suggested entry price in USD")
    stop_loss: float = Field(..., alias="stopLoss", description="Stop loss price in USD")
    target1: float = Field(..., description="First target price in USD")
    target2: float = Field(..., description="Second target price in USD")
    leverage: str = Field(..., description="Suggested leverage")
    funding_rate: float = Field(..., alias="fundingRate", description="Current funding rate")
    open_interest: str = Field(..., alias="openInterest", description="Open interest value")
    open_interest_change: Optional[float] = Field(None, alias="openInterestChange", description="OI change %")
    confidence: float = Field(..., description="AI confidence score (0-100)")
    risk_level: str = Field(..., alias="riskLevel", description="Risk level (Low/Medium/High)")
    signals: List[str] = Field(..., description="Technical signals")
    currency: str = Field(default="USD", description="Currency unit")
    
    class Config:
        populate_by_name = True


class MarketStatsResponse(BaseModel):
    """Market statistics response"""
    strength: int = Field(..., description="Market strength (0-10)")
    win_rate: float = Field(..., alias="winRate", description="Historical win rate %")
    avg_funding_rate: float = Field(..., alias="avgFundingRate", description="Average funding rate")
    total_oi: str = Field(..., alias="totalOI", description="Total open interest")
    currency: str = Field(default="USD", description="Currency unit")
    
    class Config:
        populate_by_name = True
