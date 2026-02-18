import pandas as pd
import numpy as np
from typing import Tuple, List
from sklearn.model_selection import train_test_split
from app.ai.features.contract_features import ContractFeatures
from app.ai.features.funding_rate_features import FundingRateFeatures
from app.ai.features.oi_features import OpenInterestFeatures


class DataPreprocessor:
    """Preprocessor for cryptocurrency contract data"""
    
    def __init__(self, target_column: str = 'last_price', prediction_horizon: int = 1):
        """
        Args:
            target_column: Column to predict
            prediction_horizon: Number of periods ahead to predict
        """
        self.target_column = target_column
        self.prediction_horizon = prediction_horizon
        
    def prepare_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Prepare data with features and target
        
        Args:
            df: Raw contract market data
            
        Returns:
            DataFrame with engineered features and target
        """
        df = df.copy()
        
        # Sort by time
        if 'created_at' in df.columns:
            df = df.sort_values('created_at').reset_index(drop=True)
        
        # Add all features
        df = ContractFeatures.add_all_features(df)
        df = FundingRateFeatures.add_all_features(df)
        df = OpenInterestFeatures.add_all_features(df)
        
        # Create target (future price)
        df['target'] = df[self.target_column].shift(-self.prediction_horizon)
        
        # Drop rows with NaN (from rolling windows and target shift)
        df = df.dropna()
        
        return df
    
    def select_features(self, df: pd.DataFrame, feature_columns: List[str] = None) -> pd.DataFrame:
        """
        Select relevant features for modeling
        
        Args:
            df: DataFrame with all features
            feature_columns: List of columns to use (if None, auto-select)
            
        Returns:
            DataFrame with selected features and target
        """
        if feature_columns is None:
            # Auto-select numeric columns, excluding metadata
            exclude_cols = ['id', 'symbol', 'created_at', 'updated_at', 'metadata', 
                          'next_funding_time', self.target_column]
            feature_columns = [col for col in df.columns 
                             if col not in exclude_cols and col != 'target' 
                             and df[col].dtype in ['float64', 'int64']]
        
        # Include target column
        selected_cols = feature_columns + ['target']
        
        return df[selected_cols]
    
    def split_data(self, df: pd.DataFrame, test_size: float = 0.2, 
                   val_size: float = 0.1) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """
        Split data into train, validation, and test sets
        
        Args:
            df: DataFrame with features and target
            test_size: Fraction for test set
            val_size: Fraction of remaining data for validation
            
        Returns:
            Tuple of (train_df, val_df, test_df)
        """
        # Time-based split (important for time series)
        n = len(df)
        test_idx = int(n * (1 - test_size))
        
        train_val_df = df[:test_idx]
        test_df = df[test_idx:]
        
        # Split train into train and validation
        val_idx = int(len(train_val_df) * (1 - val_size))
        train_df = train_val_df[:val_idx]
        val_df = train_val_df[val_idx:]
        
        return train_df, val_df, test_df
    
    def get_xy(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """
        Extract X (features) and y (target) from DataFrame
        
        Args:
            df: DataFrame with features and target column
            
        Returns:
            Tuple of (X, y) as numpy arrays
        """
        X = df.drop('target', axis=1).values
        y = df['target'].values
        
        return X, y
    
    def prepare_for_training(self, df: pd.DataFrame, 
                           test_size: float = 0.2,
                           val_size: float = 0.1,
                           feature_columns: List[str] = None) -> dict:
        """
        Complete data preparation pipeline
        
        Args:
            df: Raw contract market data
            test_size: Fraction for test set
            val_size: Fraction for validation set
            feature_columns: List of feature columns (auto-select if None)
            
        Returns:
            Dict with train/val/test sets and metadata
        """
        # Prepare features
        df_features = self.prepare_data(df)
        
        # Select features
        df_selected = self.select_features(df_features, feature_columns)
        
        # Split data
        train_df, val_df, test_df = self.split_data(df_selected, test_size, val_size)
        
        # Extract X and y
        X_train, y_train = self.get_xy(train_df)
        X_val, y_val = self.get_xy(val_df)
        X_test, y_test = self.get_xy(test_df)
        
        return {
            'X_train': X_train,
            'y_train': y_train,
            'X_val': X_val,
            'y_val': y_val,
            'X_test': X_test,
            'y_test': y_test,
            'feature_names': train_df.drop('target', axis=1).columns.tolist(),
            'n_features': X_train.shape[1],
            'n_train': len(X_train),
            'n_val': len(X_val),
            'n_test': len(X_test)
        }
