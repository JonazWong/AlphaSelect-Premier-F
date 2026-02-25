import httpx
import time
import hmac
import hashlib
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging
from app.core.config import settings
from app.core.rate_limiter import rate_limit
from app.core.circuit_breaker import circuit_breaker

logger = logging.getLogger(__name__)


class MEXCContractAPI:
    """
    MEXC Contract API Client
    
    Implements complete MEXC Contract API with:
    - Rate Limiting: 100 requests per 10 seconds
    - Circuit Breaker: Fails after 5 consecutive errors, recovers after 60s
    - Error Handling: Comprehensive exception handling
    - Retry Logic: Exponential backoff retry
    """
    
    def __init__(
        self,
        api_key: str = None,
        secret_key: str = None,
        base_url: str = None
    ):
        self.api_key = api_key or settings.MEXC_API_KEY
        self.secret_key = secret_key or settings.MEXC_SECRET_KEY
        self.base_url = base_url or settings.MEXC_CONTRACT_BASE_URL
        self.client = httpx.Client(timeout=8.0)
        
    def _sign(self, params: Dict[str, Any]) -> str:
        """Generate signature for authenticated requests"""
        query_string = "&".join([f"{k}={v}" for k, v in sorted(params.items())])
        signature = hmac.new(
            self.secret_key.encode('utf-8'),
            query_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return signature
    
    def _request(
        self,
        method: str,
        endpoint: str,
        params: Dict = None,
        signed: bool = False,
        retry_count: int = 2
    ) -> Dict:
        """
        Make HTTP request with retry logic and error handling
        
        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint
            params: Query parameters
            signed: Whether request needs authentication
            retry_count: Number of retries on failure
            
        Returns:
            Response data as dictionary
        """
        params = params or {}
        url = f"{self.base_url}{endpoint}"
        
        if signed:
            params['timestamp'] = int(time.time() * 1000)
            params['signature'] = self._sign(params)
        
        for attempt in range(retry_count):
            try:
                if method.upper() == 'GET':
                    response = self.client.get(url, params=params)
                elif method.upper() == 'POST':
                    response = self.client.post(url, json=params)
                else:
                    raise ValueError(f"Unsupported HTTP method: {method}")
                
                response.raise_for_status()
                data = response.json()
                
                # Check for API-level errors
                if isinstance(data, dict) and data.get('code') != 0 and 'code' in data:
                    raise Exception(f"MEXC API Error: {data.get('msg', 'Unknown error')}")
                
                return data
                
            except httpx.HTTPStatusError as e:
                logger.error(f"HTTP error on attempt {attempt + 1}: {e}")
                if attempt == retry_count - 1:
                    raise
                time.sleep(2 ** attempt)  # Exponential backoff
                
            except Exception as e:
                logger.error(f"Request error on attempt {attempt + 1}: {e}")
                if attempt == retry_count - 1:
                    raise
                time.sleep(2 ** attempt)
        
        raise Exception("Max retries exceeded")
    
    @rate_limit(key_func=lambda self: "mexc_contract")
    @circuit_breaker("mexc_contract")
    def get_contract_ticker(self, symbol: str) -> Dict:
        """
        Get contract ticker for a specific symbol
        
        Args:
            symbol: Trading pair symbol (e.g., 'BTC_USDT')
            
        Returns:
            Ticker data including price, volume, funding rate, etc.
        """
        endpoint = "/api/v1/contract/ticker"
        params = {"symbol": symbol}
        return self._request("GET", endpoint, params)
    
    @rate_limit(key_func=lambda self: "mexc_contract")
    @circuit_breaker("mexc_contract")
    def get_all_contract_tickers(self) -> List[Dict]:
        """
        Get all contract tickers
        
        Returns:
            List of all contract ticker data
        """
        endpoint = "/api/v1/contract/ticker"
        data = self._request("GET", endpoint)
        
        # MEXC returns dict with 'data' key containing list
        if isinstance(data, dict) and 'data' in data:
            return data['data']
        return data if isinstance(data, list) else []
    
    @rate_limit(key_func=lambda self, symbol: f"mexc_contract_{symbol}")
    @circuit_breaker("mexc_contract")
    def get_contract_klines(
        self,
        symbol: str,
        interval: str = "Min60",
        limit: int = 100,
        start: int = None,
        end: int = None
    ) -> List[Dict]:
        """
        Get K-line (candlestick) data
        
        Args:
            symbol: Trading pair symbol
            interval: Timeframe (Min1, Min5, Min15, Min30, Min60, Hour4, Hour8, Day1, Week1, Month1)
            limit: Number of records (max 2000)
            start: Start timestamp (optional)
            end: End timestamp (optional)
            
        Returns:
            List of OHLCV data
        """
        endpoint = "/api/v1/contract/kline/" + symbol
        params = {
            "interval": interval,
            "limit": min(limit, 2000)
        }
        
        if start:
            params['start'] = start
        if end:
            params['end'] = end
        
        data = self._request("GET", endpoint, params)
        
        # MEXC returns dict with 'data' key
        if isinstance(data, dict) and 'data' in data:
            return data['data']
        return data if isinstance(data, list) else []
    
    @rate_limit(key_func=lambda self, symbol: f"mexc_contract_{symbol}")
    @circuit_breaker("mexc_contract")
    def get_funding_rate(self, symbol: str) -> Dict:
        """
        Get current funding rate
        
        Args:
            symbol: Trading pair symbol
            
        Returns:
            Current funding rate data
        """
        endpoint = "/api/v1/contract/funding_rate/" + symbol
        return self._request("GET", endpoint)
    
    @rate_limit(key_func=lambda self, symbol: f"mexc_contract_{symbol}")
    @circuit_breaker("mexc_contract")
    def get_funding_rate_history(
        self,
        symbol: str,
        page_num: int = 1,
        page_size: int = 20
    ) -> List[Dict]:
        """
        Get historical funding rates
        
        Args:
            symbol: Trading pair symbol
            page_num: Page number
            page_size: Records per page
            
        Returns:
            List of historical funding rate data
        """
        endpoint = "/api/v1/contract/funding_rate/history"
        params = {
            "symbol": symbol,
            "page_num": page_num,
            "page_size": min(page_size, 100)
        }
        
        data = self._request("GET", endpoint, params)
        
        # MEXC returns dict with 'data' key
        if isinstance(data, dict) and 'data' in data:
            return data['data']
        return data if isinstance(data, list) else []
    
    @rate_limit(key_func=lambda self, symbol: f"mexc_contract_{symbol}")
    @circuit_breaker("mexc_contract")
    def get_open_interest(self, symbol: str) -> Dict:
        """
        Get current open interest
        
        Args:
            symbol: Trading pair symbol
            
        Returns:
            Open interest data
        """
        endpoint = "/api/v1/contract/open_interest/" + symbol
        return self._request("GET", endpoint)
    
    @rate_limit(key_func=lambda self, symbol: f"mexc_contract_{symbol}")
    @circuit_breaker("mexc_contract")
    def get_depth(self, symbol: str, limit: int = 20) -> Dict:
        """
        Get order book depth
        
        Args:
            symbol: Trading pair symbol
            limit: Depth limit (5, 10, 20, 50, 100)
            
        Returns:
            Order book data with bids and asks
        """
        endpoint = "/api/v1/contract/depth/" + symbol
        params = {"limit": limit}
        return self._request("GET", endpoint, params)
    
    @rate_limit(key_func=lambda self, symbol: f"mexc_contract_{symbol}")
    @circuit_breaker("mexc_contract")
    def get_index_price(self, symbol: str) -> Dict:
        """
        Get index price
        
        Args:
            symbol: Trading pair symbol
            
        Returns:
            Index price data
        """
        endpoint = "/api/v1/contract/index_price/" + symbol
        return self._request("GET", endpoint)
    
    @rate_limit(key_func=lambda self, symbol: f"mexc_contract_{symbol}")
    @circuit_breaker("mexc_contract")
    def get_fair_price(self, symbol: str) -> Dict:
        """
        Get fair/mark price
        
        Args:
            symbol: Trading pair symbol
            
        Returns:
            Fair price data
        """
        endpoint = "/api/v1/contract/fair_price/" + symbol
        return self._request("GET", endpoint)
    
    def close(self):
        """Close HTTP client"""
        self.client.close()
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


# Singleton instance
mexc_contract_api = MEXCContractAPI()
