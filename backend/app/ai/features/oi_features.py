import pandas as pd
import numpy as np
from typing import List


class OpenInterestFeatures:
    """Feature engineering for open interest data"""
    
    @staticmethod
    def add_oi_features(df: pd.DataFrame) -> pd.DataFrame:
        """Add open interest based features"""
        df = df.copy()
        
        if 'open_interest' not in df.columns:
            return df
        
        # Open interest moving averages
        df['oi_sma_5'] = df['open_interest'].rolling(window=5, min_periods=1).mean()
        df['oi_sma_10'] = df['open_interest'].rolling(window=10, min_periods=1).mean()
        df['oi_sma_20'] = df['open_interest'].rolling(window=20, min_periods=1).mean()
        
        # Open interest change
        df['oi_change'] = df['open_interest'].diff().fillna(0)
        df['oi_pct_change'] = df['open_interest'].pct_change().fillna(0)
        
        # Open interest momentum
        df['oi_momentum_5'] = df['open_interest'].diff(5).fillna(0)
        df['oi_momentum_10'] = df['open_interest'].diff(10).fillna(0)
        
        # Open interest rate of change
        df['oi_roc_5'] = (df['open_interest'].diff(5) / (df['open_interest'].shift(5) + 1e-10)).fillna(0)
        df['oi_roc_10'] = (df['open_interest'].diff(10) / (df['open_interest'].shift(10) + 1e-10)).fillna(0)
        
        # Open interest volatility
        df['oi_volatility_10'] = df['oi_pct_change'].rolling(window=10, min_periods=1).std().fillna(0)
        
        # Open interest extremes
        df['oi_max_10'] = df['open_interest'].rolling(window=10, min_periods=1).max()
        df['oi_min_10'] = df['open_interest'].rolling(window=10, min_periods=1).min()
        
        # Open interest position
        oi_range = df['oi_max_10'] - df['oi_min_10']
        df['oi_position'] = (df['open_interest'] - df['oi_min_10']) / (oi_range + 1e-10)
        
        return df
    
    @staticmethod
    def add_oi_lag_features(df: pd.DataFrame, lags: List[int] = None) -> pd.DataFrame:
        """Add lagged open interest features"""
        df = df.copy()
        
        if 'open_interest' not in df.columns:
            return df
        
        if lags is None:
            lags = [1, 2, 3, 5, 10]
        
        for lag in lags:
            df[f'oi_lag_{lag}'] = df['open_interest'].shift(lag)
        
        return df
    
    @staticmethod
    def add_all_features(df: pd.DataFrame) -> pd.DataFrame:
        """Add all open interest features"""
        df = OpenInterestFeatures.add_oi_features(df)
        df = OpenInterestFeatures.add_oi_lag_features(df)
        
        return df
