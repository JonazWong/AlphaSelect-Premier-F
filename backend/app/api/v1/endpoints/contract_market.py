from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import logging

from app.db.session import get_db
from app.core.mexc.contract import mexc_contract_api
from app.models.contract_market import ContractMarket
from app.models.funding_rate import FundingRateHistory
from app.models.open_interest import OpenInterestHistory

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/ticker/{symbol}")
async def get_contract_ticker(
    symbol: str,
    db: Session = Depends(get_db)
):
    """
    Get contract ticker for a specific symbol
    
    Args:
        symbol: Trading pair symbol (e.g., 'BTC_USDT')
    """
    try:
        # Fetch from MEXC API
        ticker_data = mexc_contract_api.get_contract_ticker(symbol)
        
        # Store in database
        if ticker_data and isinstance(ticker_data, dict):
            data = ticker_data.get('data', ticker_data)
            
            # Check if record exists
            existing = db.query(ContractMarket).filter(
                ContractMarket.symbol == symbol
            ).order_by(ContractMarket.created_at.desc()).first()
            
            # Create new record
            contract_market = ContractMarket(
                symbol=symbol,
                last_price=float(data.get('lastPrice', 0)),
                fair_price=float(data.get('fairPrice', 0)),
                index_price=float(data.get('indexPrice', 0)),
                funding_rate=float(data.get('fundingRate', 0)),
                open_interest=float(data.get('openInterest', 0)),
                volume_24h=float(data.get('volume24', 0)),
                price_change_24h=float(data.get('riseFallRate', 0)),
                high_24h=float(data.get('high24Price', 0)),
                low_24h=float(data.get('low24Price', 0)),
                metadata=data
            )
            
            # Calculate basis
            if contract_market.last_price and contract_market.index_price:
                contract_market.basis = contract_market.last_price - contract_market.index_price
                contract_market.basis_rate = (contract_market.basis / contract_market.index_price) * 100
            
            db.add(contract_market)
            db.commit()
            db.refresh(contract_market)
        
        return {
            "success": True,
            "data": ticker_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error fetching ticker for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tickers")
async def get_all_tickers(
    db: Session = Depends(get_db)
):
    """
    Get all contract tickers
    """
    try:
        tickers_data = mexc_contract_api.get_all_contract_tickers()
        
        return {
            "success": True,
            "data": tickers_data,
            "count": len(tickers_data) if isinstance(tickers_data, list) else 0,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error fetching all tickers: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/klines/{symbol}")
async def get_klines(
    symbol: str,
    interval: str = Query("Min60", description="Timeframe (Min1, Min5, Min15, Min30, Min60, Hour4, Hour8, Day1, Week1, Month1)"),
    limit: int = Query(100, ge=1, le=2000, description="Number of records")
):
    """
    Get K-line (candlestick) data
    
    Args:
        symbol: Trading pair symbol
        interval: Timeframe
        limit: Number of records (max 2000)
    """
    try:
        klines_data = mexc_contract_api.get_contract_klines(
            symbol=symbol,
            interval=interval,
            limit=limit
        )
        
        return {
            "success": True,
            "data": klines_data,
            "symbol": symbol,
            "interval": interval,
            "count": len(klines_data) if isinstance(klines_data, list) else 0,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error fetching klines for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/funding-rate/{symbol}")
async def get_funding_rate(
    symbol: str,
    db: Session = Depends(get_db)
):
    """
    Get current funding rate
    
    Args:
        symbol: Trading pair symbol
    """
    try:
        funding_data = mexc_contract_api.get_funding_rate(symbol)
        
        # Store in database
        if funding_data and isinstance(funding_data, dict):
            data = funding_data.get('data', funding_data)
            
            funding_history = FundingRateHistory(
                symbol=symbol,
                funding_rate=float(data.get('fundingRate', 0)),
                settle_time=datetime.fromtimestamp(int(data.get('settleTime', 0)) / 1000)
            )
            
            db.add(funding_history)
            db.commit()
        
        return {
            "success": True,
            "data": funding_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error fetching funding rate for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/funding-rate/history/{symbol}")
async def get_funding_rate_history(
    symbol: str,
    page_num: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Get historical funding rates
    
    Args:
        symbol: Trading pair symbol
        page_num: Page number
        page_size: Records per page
    """
    try:
        history_data = mexc_contract_api.get_funding_rate_history(
            symbol=symbol,
            page_num=page_num,
            page_size=page_size
        )
        
        return {
            "success": True,
            "data": history_data,
            "page_num": page_num,
            "page_size": page_size,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error fetching funding rate history for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/open-interest/{symbol}")
async def get_open_interest(
    symbol: str,
    db: Session = Depends(get_db)
):
    """
    Get current open interest
    
    Args:
        symbol: Trading pair symbol
    """
    try:
        oi_data = mexc_contract_api.get_open_interest(symbol)
        
        # Store in database
        if oi_data and isinstance(oi_data, dict):
            data = oi_data.get('data', oi_data)
            
            oi_history = OpenInterestHistory(
                symbol=symbol,
                open_interest=float(data.get('openInterest', 0)),
                open_interest_value=float(data.get('openInterestValue', 0)),
                timestamp=datetime.utcnow()
            )
            
            db.add(oi_history)
            db.commit()
        
        return {
            "success": True,
            "data": oi_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error fetching open interest for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/depth/{symbol}")
async def get_depth(
    symbol: str,
    limit: int = Query(20, description="Depth limit (5, 10, 20, 50, 100)")
):
    """
    Get order book depth
    
    Args:
        symbol: Trading pair symbol
        limit: Depth limit
    """
    try:
        depth_data = mexc_contract_api.get_depth(symbol, limit)
        
        return {
            "success": True,
            "data": depth_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error fetching depth for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/index-price/{symbol}")
async def get_index_price(
    symbol: str
):
    """
    Get index price
    
    Args:
        symbol: Trading pair symbol
    """
    try:
        index_data = mexc_contract_api.get_index_price(symbol)
        
        return {
            "success": True,
            "data": index_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error fetching index price for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
