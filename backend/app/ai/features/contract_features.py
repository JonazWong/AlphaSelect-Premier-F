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
        for window in [5, 10, 20, 50]:
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
        
        return df
