import pandas as pd
import numpy as np
from typing import List, Dict, Any


class ContractFeatures:
    """Feature engineering for contract market data"""
    
    @staticmethod
    def add_price_features(df: pd.DataFrame) -> pd.DataFrame:
        """Add price-based technical features"""
        df = df.copy()
        
        # Returns
        df['returns'] = df['last_price'].pct_change()
        df['log_returns'] = np.log(df['last_price'] / df['last_price'].shift(1))
        
        # Moving averages
        for window in [5, 10, 20, 50, 100, 200]:
            df[f'sma_{window}'] = df['last_price'].rolling(window=window).mean()
            df[f'ema_{window}'] = df['last_price'].ewm(span=window, adjust=False).mean()
        
        # Price momentum
        df['momentum_5'] = df['last_price'] - df['last_price'].shift(5)
        df['momentum_10'] = df['last_price'] - df['last_price'].shift(10)
        df['momentum_20'] = df['last_price'] - df['last_price'].shift(20)
        
        # Rate of change
        df['roc_5'] = (df['last_price'] - df['last_price'].shift(5)) / df['last_price'].shift(5)
        df['roc_10'] = (df['last_price'] - df['last_price'].shift(10)) / df['last_price'].shift(10)
        
        # Volatility
        df['volatility_5'] = df['returns'].rolling(window=5).std()
        df['volatility_10'] = df['returns'].rolling(window=10).std()
        df['volatility_20'] = df['returns'].rolling(window=20).std()
        
        # High-Low Range and Body Ratio (if OHLC data available)
        if 'high_24h' in df.columns and 'low_24h' in df.columns:
            df['high_low_range'] = (df['high_24h'] - df['low_24h']) / df['last_price']
        
        return df
    
    @staticmethod
    def add_volume_features(df: pd.DataFrame) -> pd.DataFrame:
        """Add volume-based features"""
        df = df.copy()
        
        if 'volume_24h' in df.columns:
            # Volume moving averages
            df['volume_sma_5'] = df['volume_24h'].rolling(window=5).mean()
            df['volume_sma_10'] = df['volume_24h'].rolling(window=10).mean()
            
            # Volume change
            df['volume_change'] = df['volume_24h'].pct_change()
            
            # Volume ratio
            df['volume_ratio'] = df['volume_24h'] / df['volume_sma_10']
        
        return df
    
    @staticmethod
    def add_price_range_features(df: pd.DataFrame) -> pd.DataFrame:
        """Add price range features"""
        df = df.copy()
        
        if 'high_24h' in df.columns and 'low_24h' in df.columns:
            # Daily range
            df['daily_range'] = df['high_24h'] - df['low_24h']
            df['daily_range_pct'] = df['daily_range'] / df['last_price']
            
            # Position within range
            df['range_position'] = (df['last_price'] - df['low_24h']) / df['daily_range']
        
        return df
    
    @staticmethod
    def add_basis_features(df: pd.DataFrame) -> pd.DataFrame:
        """Add basis (futures-spot spread) features"""
        df = df.copy()
        
        if 'basis' in df.columns:
            df['basis_sma_5'] = df['basis'].rolling(window=5).mean()
            df['basis_sma_10'] = df['basis'].rolling(window=10).mean()
            df['basis_change'] = df['basis'].pct_change()
        
        if 'basis_rate' in df.columns:
            df['basis_rate_sma_5'] = df['basis_rate'].rolling(window=5).mean()
            df['basis_rate_change'] = df['basis_rate'].pct_change()
        
        return df
    
    @staticmethod
    def add_lag_features(df: pd.DataFrame, column: str = 'last_price', lags: List[int] = None) -> pd.DataFrame:
        """Add lagged features"""
        df = df.copy()
        
        if lags is None:
            lags = [1, 2, 3, 5, 10]
        
        for lag in lags:
            df[f'{column}_lag_{lag}'] = df[column].shift(lag)
        
        return df
    
    @staticmethod
    def add_all_features(df: pd.DataFrame) -> pd.DataFrame:
        """Add all contract features"""
        df = ContractFeatures.add_price_features(df)
        df = ContractFeatures.add_volume_features(df)
        df = ContractFeatures.add_price_range_features(df)
        df = ContractFeatures.add_basis_features(df)
        df = ContractFeatures.add_technical_indicators(df)
        
        return df
    
    @staticmethod
    def add_technical_indicators(df: pd.DataFrame) -> pd.DataFrame:
        """Add technical indicators (RSI, MACD, Bollinger Bands, Stochastic, ATR)"""
        df = df.copy()
        
        # RSI (14)
        df['rsi_14'] = ContractFeatures._calculate_rsi(df['last_price'], period=14)
        
        # MACD
        macd_line, signal_line, histogram = ContractFeatures._calculate_macd(df['last_price'])
        df['macd_line'] = macd_line
        df['macd_signal'] = signal_line
        df['macd_histogram'] = histogram
        
        # Bollinger Bands
        bb_upper, bb_middle, bb_lower = ContractFeatures._calculate_bollinger_bands(df['last_price'])
        df['bb_upper'] = bb_upper
        df['bb_middle'] = bb_middle
        df['bb_lower'] = bb_lower
        df['bb_width'] = (bb_upper - bb_lower) / bb_middle
        
        # Stochastic Oscillator (if high/low data available)
        if 'high_24h' in df.columns and 'low_24h' in df.columns:
            stoch_k, stoch_d = ContractFeatures._calculate_stochastic(
                df['last_price'], df['high_24h'], df['low_24h']
            )
            df['stoch_k'] = stoch_k
            df['stoch_d'] = stoch_d
        
        # ATR (Average True Range) - if high/low data available
        if 'high_24h' in df.columns and 'low_24h' in df.columns:
            df['atr_14'] = ContractFeatures._calculate_atr(
                df['high_24h'], df['low_24h'], df['last_price']
            )
        
        return df
    
    @staticmethod
    def _calculate_rsi(prices: pd.Series, period: int = 14) -> pd.Series:
        """Calculate RSI (Relative Strength Index)"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    @staticmethod
    def _calculate_macd(prices: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9):
        """Calculate MACD (Moving Average Convergence Divergence)"""
        ema_fast = prices.ewm(span=fast, adjust=False).mean()
        ema_slow = prices.ewm(span=slow, adjust=False).mean()
        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=signal, adjust=False).mean()
        histogram = macd_line - signal_line
        return macd_line, signal_line, histogram
    
    @staticmethod
    def _calculate_bollinger_bands(prices: pd.Series, period: int = 20, std_dev: float = 2.0):
        """Calculate Bollinger Bands"""
        middle_band = prices.rolling(window=period).mean()
        std = prices.rolling(window=period).std()
        upper_band = middle_band + (std * std_dev)
        lower_band = middle_band - (std * std_dev)
        return upper_band, middle_band, lower_band
    
    @staticmethod
    def _calculate_stochastic(close: pd.Series, high: pd.Series, low: pd.Series, 
                             k_period: int = 14, d_period: int = 3):
        """Calculate Stochastic Oscillator (%K and %D)"""
        lowest_low = low.rolling(window=k_period).min()
        highest_high = high.rolling(window=k_period).max()
        stoch_k = 100 * (close - lowest_low) / (highest_high - lowest_low)
        stoch_d = stoch_k.rolling(window=d_period).mean()
        return stoch_k, stoch_d
    
    @staticmethod
    def _calculate_atr(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14):
        """Calculate Average True Range (ATR)"""
        high_low = high - low
        high_close = np.abs(high - close.shift())
        low_close = np.abs(low - close.shift())
        true_range = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        atr = true_range.rolling(window=period).mean()
        return atr
