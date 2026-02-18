import pandas as pd
import numpy as np
from typing import List


class FundingRateFeatures:
    """Feature engineering for funding rate data"""
    
    @staticmethod
    def add_funding_rate_features(df: pd.DataFrame) -> pd.DataFrame:
        """Add funding rate based features"""
        df = df.copy()
        
        if 'funding_rate' not in df.columns:
            return df
        
        # Funding rate statistics
        df['funding_rate_sma_5'] = df['funding_rate'].rolling(window=5).mean()
        df['funding_rate_sma_10'] = df['funding_rate'].rolling(window=10).mean()
        df['funding_rate_sma_20'] = df['funding_rate'].rolling(window=20).mean()
        
        # Funding rate change
        df['funding_rate_change'] = df['funding_rate'].diff()
        df['funding_rate_pct_change'] = df['funding_rate'].pct_change()
        
        # Funding rate momentum
        df['funding_rate_momentum'] = df['funding_rate'] - df['funding_rate'].shift(5)
        
        # Funding rate volatility
        df['funding_rate_volatility'] = df['funding_rate'].rolling(window=10).std()
        
        # Cumulative funding rate
        df['funding_rate_cumsum_10'] = df['funding_rate'].rolling(window=10).sum()
        df['funding_rate_cumsum_20'] = df['funding_rate'].rolling(window=20).sum()
        
        # Funding rate extremes
        df['funding_rate_max_10'] = df['funding_rate'].rolling(window=10).max()
        df['funding_rate_min_10'] = df['funding_rate'].rolling(window=10).min()
        
        # Funding rate position (current vs recent range)
        fr_range = df['funding_rate_max_10'] - df['funding_rate_min_10']
        df['funding_rate_position'] = (df['funding_rate'] - df['funding_rate_min_10']) / (fr_range + 1e-10)
        
        return df
    
    @staticmethod
    def add_funding_rate_lag_features(df: pd.DataFrame, lags: List[int] = None) -> pd.DataFrame:
        """Add lagged funding rate features"""
        df = df.copy()
        
        if 'funding_rate' not in df.columns:
            return df
        
        if lags is None:
            lags = [1, 2, 3, 5, 8]
        
        for lag in lags:
            df[f'funding_rate_lag_{lag}'] = df['funding_rate'].shift(lag)
        
        return df
    
    @staticmethod
    def add_all_features(df: pd.DataFrame) -> pd.DataFrame:
        """Add all funding rate features"""
        df = FundingRateFeatures.add_funding_rate_features(df)
        df = FundingRateFeatures.add_funding_rate_lag_features(df)
        
        return df
