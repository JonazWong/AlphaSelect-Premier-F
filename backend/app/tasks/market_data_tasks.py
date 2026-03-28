"""
Celery task: collect_market_data

Periodically fetches all contract market data from MEXC API
and saves to PostgreSQL.
"""

import logging
from datetime import datetime

from app.tasks.celery_app import celery_app
from app.db.session import SessionLocal
from app.core.mexc.contract import mexc_contract_api
from app.models.contract_market import ContractMarket

logger = logging.getLogger(__name__)


def _safe_float(value, default: float = 0.0) -> float:
    """Convert value to float safely, return default on None/error"""
    try:
        return float(value) if value is not None else default
    except (TypeError, ValueError):
        return default


@celery_app.task(name="collect_market_data")
def collect_market_data():
    """
    Periodic task: fetch all contract tickers from MEXC and save to DB.
    
    1. Call mexc_contract_api.get_all_contract_tickers()
    2. Parse and save each ticker to contract_markets table
    3. Commit in batch
    """
    logger.info("[collect_market_data] Starting data collection...")
    db = SessionLocal()
    saved_count = 0
    error_count = 0
    
    try:
        # Fetch all tickers from MEXC
        tickers_data = mexc_contract_api.get_all_contract_tickers()
        
        if not isinstance(tickers_data, list):
            logger.error(f"[collect_market_data] Invalid response type: {type(tickers_data)}")
            return {"success": False, "error": "Invalid API response"}
        
        logger.info(f"[collect_market_data] Fetched {len(tickers_data)} tickers from MEXC")
        
        # Process each ticker
        for data in tickers_data:
            if not isinstance(data, dict):
                error_count += 1
                continue
            
            try:
                symbol = data.get('symbol')
                if not symbol:
                    error_count += 1
                    continue
                
                # Create ContractMarket record
                contract_market = ContractMarket(
                    symbol=symbol,
                    last_price=_safe_float(data.get('lastPrice')),
                    fair_price=_safe_float(data.get('fairPrice')),
                    index_price=_safe_float(data.get('indexPrice')),
                    funding_rate=_safe_float(data.get('fundingRate')),
                    open_interest=_safe_float(data.get('holdVol')),
                    volume_24h=_safe_float(data.get('volume24')),
                    price_change_24h=_safe_float(data.get('riseFallRate')),
                    high_24h=_safe_float(data.get('high24Price')),
                    low_24h=_safe_float(data.get('lower24Price')),
                    extra_data=data
                )
                
                # Calculate basis if both prices available
                if contract_market.last_price and contract_market.index_price:
                    contract_market.basis = contract_market.last_price - contract_market.index_price
                    contract_market.basis_rate = (contract_market.basis / contract_market.index_price) * 100
                
                db.add(contract_market)
                saved_count += 1
                
            except Exception as row_err:
                error_count += 1
                logger.warning(f"[collect_market_data] Skip ticker {data.get('symbol')}: {row_err}")
                continue
        
        # Commit all at once
        db.commit()
        logger.info(f"[collect_market_data] ✅ Saved {saved_count} tickers, {error_count} errors")
        
        return {
            "success": True,
            "saved": saved_count,
            "errors": error_count,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"[collect_market_data] ❌ Failed: {e}", exc_info=True)
        return {"success": False, "error": str(e)}
        
    finally:
        db.close()
