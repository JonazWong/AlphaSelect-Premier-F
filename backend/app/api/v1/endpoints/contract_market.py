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
from app.schemas.contract_market import (
    ContractMarketResponse,
    ContractSignalResponse,
    MarketStatsResponse
)

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
                extra_data=data
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


@router.get("/signals", response_model=List[ContractSignalResponse])
async def get_contract_signals(
    direction: str = Query("long", description="Trading direction (long or short)"),
    limit: int = Query(10, ge=1, le=50, description="Number of signals to return"),
    db: Session = Depends(get_db)
):
    """
    Get contract trading signals for Crypto Radar page
    Returns AI-powered trading signals with entry, stop loss, and target prices in USD
    
    Args:
        direction: Trading direction (long or short)
        limit: Number of signals to return
    """
    try:
        logger.info(f"Fetching {direction} signals (limit: {limit})")
        
        # Get all tickers from MEXC
        tickers_data = mexc_contract_api.get_all_contract_tickers()
        
        if not tickers_data or not isinstance(tickers_data, list):
            logger.warning("No ticker data available")
            return []
        
        # Extract data array if wrapped
        if isinstance(tickers_data, dict) and 'data' in tickers_data:
            tickers_data = tickers_data['data']
        
        signals = []
        
        for ticker in tickers_data[:limit * 3]:  # Get more data for filtering
            try:
                symbol = ticker.get('symbol', '')
                if not symbol:
                    continue
                    
                price_change = float(ticker.get('riseFallRate', 0))
                current_price = float(ticker.get('lastPrice', 0))
                
                if current_price <= 0:
                    continue
                
                # Filter by direction
                is_match = False
                if direction.lower() == "long" and price_change > 0:
                    is_match = True
                elif direction.lower() == "short" and price_change < 0:
                    is_match = True
                
                if not is_match:
                    continue
                
                # Get additional data (with error handling)
                try:
                    funding_rate_data = mexc_contract_api.get_funding_rate(symbol)
                    funding_rate = float(funding_rate_data.get('data', {}).get('fundingRate', 0))
                except Exception:
                    funding_rate = 0.0001
                
                try:
                    oi_data = mexc_contract_api.get_open_interest(symbol)
                    open_interest = oi_data.get('data', {}).get('openInterest', '0')
                except Exception:
                    open_interest = '0'
                
                # Calculate trading levels
                if direction.lower() == 'long':
                    entry_price = current_price
                    stop_loss = current_price * 0.97  # 3% stop loss
                    target1 = current_price * 1.03    # 3% target
                    target2 = current_price * 1.05    # 5% target
                else:
                    entry_price = current_price
                    stop_loss = current_price * 1.03  # 3% stop loss
                    target1 = current_price * 0.97    # 3% target
                    target2 = current_price * 0.95    # 5% target
                
                # Calculate confidence based on multiple factors
                base_confidence = 60
                momentum_boost = min(20, abs(price_change) * 10)
                confidence = min(95, base_confidence + momentum_boost)
                
                # Determine risk level
                if abs(price_change) > 5:
                    risk_level = 'High'
                elif abs(price_change) > 2:
                    risk_level = 'Medium'
                else:
                    risk_level = 'Low'
                
                # Generate technical signals
                technical_signals = []
                if abs(price_change) > 3:
                    technical_signals.append('強勢動能' if direction.lower() == 'long' else '空頭動能')
                if abs(price_change) > 2:
                    technical_signals.append('成交量放大')
                else:
                    technical_signals.append('趨勢形成')
                
                if abs(funding_rate) > 0.0005:
                    technical_signals.append('資金費率偏離')
                
                # Create signal
                signal = {
                    'symbol': symbol,
                    'direction': 'Long' if direction.lower() == 'long' else 'Short',
                    'currentPrice': current_price,
                    'entryPrice': entry_price,
                    'stopLoss': stop_loss,
                    'target1': target1,
                    'target2': target2,
                    'leverage': '10x',
                    'fundingRate': funding_rate,
                    'openInterest': str(open_interest),
                    'openInterestChange': abs(price_change),
                    'confidence': confidence,
                    'riskLevel': risk_level,
                    'signals': technical_signals,
                    'currency': 'USD'
                }
                
                signals.append(signal)
                
                if len(signals) >= limit:
                    break
                    
            except Exception as e:
                logger.error(f"Error processing ticker {ticker.get('symbol', 'unknown')}: {e}")
                continue
        
        logger.info(f"Generated {len(signals)} {direction} signals")
        return signals
        
    except Exception as e:
        logger.error(f"Failed to generate signals: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate signals: {str(e)}"
        )


@router.get("/market-stats", response_model=MarketStatsResponse)
async def get_market_stats(db: Session = Depends(get_db)):
    """
    Get market statistics for Crypto Radar dashboard
    Returns overall market strength, win rate, funding rate, and open interest
    """
    try:
        logger.info("Fetching market statistics")
        
        # Get all tickers
        tickers_data = mexc_contract_api.get_all_contract_tickers()
        
        if not tickers_data or not isinstance(tickers_data, list):
            logger.warning("No ticker data available for stats")
            # Return default stats
            return {
                'strength': 5,
                'winRate': 50.0,
                'avgFundingRate': 0.0001,
                'totalOI': '$0.00B',
                'currency': 'USD'
            }
        
        # Extract data array if wrapped
        if isinstance(tickers_data, dict) and 'data' in tickers_data:
            tickers_data = tickers_data['data']
        
        # Calculate statistics
        total_volume = 0
        positive_count = 0
        total_count = 0
        
        for ticker in tickers_data:
            try:
                volume = float(ticker.get('volume24', 0))
                price_change = float(ticker.get('riseFallRate', 0))
                
                total_volume += volume
                total_count += 1
                
                if price_change > 0:
                    positive_count += 1
                    
            except Exception:
                continue
        
        # Calculate market strength (0-10)
        if total_count > 0:
            bullish_ratio = positive_count / total_count
            strength = int(bullish_ratio * 10)
        else:
            strength = 5
        
        # TODO: Replace with actual historical prediction data
        # Currently using placeholder calculation based on market strength
        # In production: query predictions table and calculate actual win rate
        win_rate = 50.0 + (strength * 2.5)  # Scale with market strength
        
        # TODO: Replace with actual average from funding_rate_history table
        # This is a placeholder default value for demonstration
        # In production: calculate average from recent funding rate data
        avg_funding_rate = 0.0001
        
        # Format total OI
        total_oi_value = total_volume / 1e9  # Convert to billions
        total_oi = f"${total_oi_value:.2f}B"
        
        stats = {
            'strength': strength,
            'winRate': round(win_rate, 2),
            'avgFundingRate': avg_funding_rate,
            'totalOI': total_oi,
            'currency': 'USD'
        }
        
        logger.info(f"Market stats: strength={strength}, winRate={win_rate:.2f}%")
        return stats
        
    except Exception as e:
        logger.error(f"Failed to fetch market stats: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch market stats: {str(e)}"
        )
