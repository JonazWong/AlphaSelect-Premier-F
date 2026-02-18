import numpy as np
import pandas as pd
from typing import Dict, Any, List
from datetime import datetime, timedelta
from app.ai.models.base_model import BaseModel
from app.ai.training.data_preprocessor import DataPreprocessor


class Predictor:
    """Make predictions using trained models"""
    
    def __init__(self, model: BaseModel):
        self.model = model
        self.preprocessor = DataPreprocessor()
        
    def predict_next(self, df: pd.DataFrame, horizon: int = 1) -> Dict[str, Any]:
        """
        Predict future price
        
        Args:
            df: Recent historical data
            horizon: Number of periods ahead to predict
            
        Returns:
            Dict with prediction and metadata
        """
        # Prepare features (same as training)
        df_features = self.preprocessor.prepare_data(df)
        
        # Select same features used in training
        feature_cols = [col for col in df_features.columns 
                       if col in self.model.feature_names]
        
        X = df_features[feature_cols].values
        
        # Make prediction
        predictions = self.model.predict(X)
        
        # Get the last prediction (most recent)
        predicted_value = float(predictions[-1])
        
        # Calculate confidence based on recent prediction stability
        if len(predictions) > 5:
            recent_std = np.std(predictions[-5:])
            recent_mean = np.mean(predictions[-5:])
            confidence = max(0.0, min(1.0, 1.0 - (recent_std / (recent_mean + 1e-10))))
        else:
            confidence = 0.5
        
        # Determine prediction time and target time
        prediction_time = datetime.utcnow()
        
        # Calculate target time (assuming hourly data)
        if 'created_at' in df.columns and len(df) > 1:
            time_diff = (df['created_at'].iloc[-1] - df['created_at'].iloc[-2])
            target_time = prediction_time + (time_diff * horizon)
        else:
            # Default to 1 hour per horizon
            target_time = prediction_time + timedelta(hours=horizon)
        
        return {
            'symbol': self.model.symbol,
            'model_type': self.model.model_type,
            'predicted_value': predicted_value,
            'confidence_score': confidence,
            'prediction_horizon': horizon,
            'prediction_time': prediction_time,
            'target_time': target_time,
            'current_price': float(df['last_price'].iloc[-1]) if 'last_price' in df.columns else None
        }
    
    def predict_batch(self, df: pd.DataFrame, horizons: List[int] = None) -> List[Dict[str, Any]]:
        """
        Make predictions for multiple horizons
        
        Args:
            df: Recent historical data
            horizons: List of horizons to predict
            
        Returns:
            List of prediction dicts
        """
        if horizons is None:
            horizons = [1, 3, 6, 12, 24]  # Default: 1h, 3h, 6h, 12h, 24h
        
        predictions = []
        for horizon in horizons:
            pred = self.predict_next(df, horizon)
            predictions.append(pred)
        
        return predictions
    
    def predict_with_features(self, X: np.ndarray) -> Dict[str, Any]:
        """
        Make prediction from pre-prepared features
        
        Args:
            X: Feature array
            
        Returns:
            Dict with prediction
        """
        predictions = self.model.predict(X)
        predicted_value = float(predictions[-1])
        
        return {
            'symbol': self.model.symbol,
            'model_type': self.model.model_type,
            'predicted_value': predicted_value,
            'prediction_time': datetime.utcnow()
        }
