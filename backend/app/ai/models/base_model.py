from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple
import numpy as np
import pandas as pd
from datetime import datetime
import pickle
import os


class BaseModel(ABC):
    """Base class for all AI models"""
    
    def __init__(self, symbol: str, config: Dict[str, Any] = None):
        self.symbol = symbol
        self.config = config or {}
        self.model = None
        self.scaler = None
        self.feature_names = []
        self.model_type = self.__class__.__name__.lower().replace('model', '')
        
    @abstractmethod
    def build_model(self) -> None:
        """Build the model architecture"""
        pass
    
    @abstractmethod
    def train(self, X_train: np.ndarray, y_train: np.ndarray, 
              X_val: np.ndarray = None, y_val: np.ndarray = None) -> Dict[str, float]:
        """
        Train the model
        
        Returns:
            Dict with training metrics
        """
        pass
    
    @abstractmethod
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Make predictions"""
        pass
    
    def evaluate(self, X: np.ndarray, y: np.ndarray) -> Dict[str, float]:
        """
        Evaluate model performance
        
        Returns:
            Dict with evaluation metrics: r2_score, mae, mse, rmse, directional_accuracy
        """
        from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
        
        predictions = self.predict(X)
        
        # Basic metrics
        metrics = {
            'r2_score': float(r2_score(y, predictions)),
            'mae': float(mean_absolute_error(y, predictions)),
            'mse': float(mean_squared_error(y, predictions)),
            'rmse': float(np.sqrt(mean_squared_error(y, predictions)))
        }
        
        # Directional accuracy (for time series)
        if len(y) > 1:
            y_direction = np.diff(y) > 0
            pred_direction = np.diff(predictions) > 0
            metrics['directional_accuracy'] = float(np.mean(y_direction == pred_direction))
        else:
            metrics['directional_accuracy'] = 0.0
            
        return metrics
    
    def save(self, path: str) -> None:
        """Save model to disk"""
        os.makedirs(os.path.dirname(path), exist_ok=True)
        
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'config': self.config,
            'symbol': self.symbol,
            'model_type': self.model_type
        }
        
        with open(path, 'wb') as f:
            pickle.dump(model_data, f)
    
    def load(self, path: str) -> None:
        """Load model from disk"""
        with open(path, 'rb') as f:
            model_data = pickle.load(f)
            
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.feature_names = model_data['feature_names']
        self.config = model_data['config']
        self.symbol = model_data['symbol']
        self.model_type = model_data['model_type']
    
    def prepare_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """
        Prepare features and target from dataframe
        
        Args:
            df: DataFrame with features and target column
            
        Returns:
            Tuple of (X, y) numpy arrays
        """
        # Assume last column is target
        X = df.iloc[:, :-1].values
        y = df.iloc[:, -1].values
        
        self.feature_names = df.columns[:-1].tolist()
        
        return X, y
