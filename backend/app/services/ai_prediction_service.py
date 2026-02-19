"""
AI Prediction Service

Handles predictions using trained AI models
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime, timedelta

from app.ai.features.contract_features import ContractFeatures
from app.ai.features.funding_rate_features import FundingRateFeatures
from app.ai.features.oi_features import OpenInterestFeatures

logger = logging.getLogger(__name__)


class AIPredictionService:
    """Service for making AI predictions"""
    
    def __init__(self):
        self.loaded_models = {}
    
    def prepare_prediction_data(
        self,
        df: pd.DataFrame
    ) -> Dict[str, Any]:
        """
        Prepare data for prediction with feature engineering
        
        Args:
            df: DataFrame with recent contract market data
            
        Returns:
            Dict with features array and feature names
        """
        # Add all features
        df_features = ContractFeatures.add_all_features(df)
        df_features = FundingRateFeatures.add_all_features(df_features)
        df_features = OpenInterestFeatures.add_all_features(df_features)
        
        # Drop rows with NaN values
        df_features = df_features.dropna()
        
        if len(df_features) == 0:
            raise ValueError("No valid data after feature engineering")
        
        # Get features (exclude timestamp and target columns)
        feature_columns = [
            col for col in df_features.columns 
            if col not in ['created_at', 'target']
        ]
        
        X = df_features[feature_columns].values
        
        return {
            'X': X,
            'feature_names': feature_columns,
            'n_features': len(feature_columns),
            'latest_price': df['last_price'].iloc[-1] if len(df) > 0 else None
        }
    
    async def predict(
        self,
        model,
        df: pd.DataFrame,
        periods: int = 24
    ) -> Dict[str, Any]:
        """
        Generate predictions using a trained model
        
        Args:
            model: Trained model instance
            df: DataFrame with recent contract market data
            periods: Number of periods to predict (for multi-step)
            
        Returns:
            Dict with predictions and metadata
        """
        logger.info(f"Generating prediction for {model.symbol} using {model.model_type}")
        
        # Prepare data
        data = self.prepare_prediction_data(df)
        
        # Make prediction
        try:
            predictions = model.predict(data['X'])
            
            # Get the last prediction (most recent forecast)
            if len(predictions) > 0:
                current_prediction = float(predictions[-1])
            else:
                raise ValueError("No predictions generated")
            
            # Calculate prediction metadata
            current_price = data['latest_price']
            price_change = current_prediction - current_price if current_price else 0
            price_change_pct = (price_change / current_price * 100) if current_price else 0
            
            result = {
                'symbol': model.symbol,
                'model_type': model.model_type,
                'prediction': current_prediction,
                'current_price': current_price,
                'price_change': price_change,
                'price_change_pct': price_change_pct,
                'timestamp': datetime.utcnow().isoformat(),
                'all_predictions': predictions.tolist()
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Prediction failed: {str(e)}")
            raise
    
    async def predict_ensemble(
        self,
        ensemble_model,
        df: pd.DataFrame,
        periods: int = 24
    ) -> Dict[str, Any]:
        """
        Generate ensemble predictions with model breakdown
        
        Args:
            ensemble_model: Trained ensemble model
            df: DataFrame with recent contract market data
            periods: Number of periods to predict
            
        Returns:
            Dict with ensemble prediction and individual model contributions
        """
        logger.info(f"Generating ensemble prediction for {ensemble_model.symbol}")
        
        # Prepare data
        data = self.prepare_prediction_data(df)
        
        # Get ensemble prediction
        predictions = ensemble_model.predict(data['X'])
        
        # Get individual model contributions
        contributions = ensemble_model.get_model_contributions(data['X'])
        
        # Process contributions
        individual_predictions = {}
        for model_type, preds in contributions.items():
            if len(preds) > 0:
                individual_predictions[model_type] = float(preds[-1])
        
        # Calculate ensemble prediction
        if len(predictions) > 0:
            ensemble_prediction = float(predictions[-1])
        else:
            raise ValueError("No predictions generated")
        
        # Calculate metadata
        current_price = data['latest_price']
        price_change = ensemble_prediction - current_price if current_price else 0
        price_change_pct = (price_change / current_price * 100) if current_price else 0
        
        # Calculate confidence based on model agreement
        confidence = self._calculate_confidence(individual_predictions, ensemble_prediction)
        
        result = {
            'symbol': ensemble_model.symbol,
            'model_type': 'ensemble',
            'prediction': ensemble_prediction,
            'current_price': current_price,
            'price_change': price_change,
            'price_change_pct': price_change_pct,
            'confidence': confidence,
            'individual_predictions': individual_predictions,
            'weights': ensemble_model.model_weights,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        return result
    
    def _calculate_confidence(
        self,
        individual_predictions: Dict[str, float],
        ensemble_prediction: float
    ) -> float:
        """
        Calculate prediction confidence based on model agreement
        
        Args:
            individual_predictions: Dict of individual model predictions
            ensemble_prediction: Final ensemble prediction
            
        Returns:
            Confidence score (0-1)
        """
        if not individual_predictions:
            return 0.0
        
        # Calculate standard deviation of predictions
        pred_values = list(individual_predictions.values())
        mean_pred = np.mean(pred_values)
        std_pred = np.std(pred_values)
        
        # Coefficient of variation
        cv = std_pred / abs(mean_pred) if mean_pred != 0 else 1.0
        
        # Convert to confidence (lower CV = higher confidence)
        confidence = max(0.0, min(1.0, 1.0 - cv))
        
        return float(confidence)
    
    async def batch_predict(
        self,
        models: List,
        df: pd.DataFrame
    ) -> List[Dict[str, Any]]:
        """
        Generate predictions from multiple models
        
        Args:
            models: List of trained model instances
            df: DataFrame with recent contract market data
            
        Returns:
            List of prediction results
        """
        results = []
        
        for model in models:
            try:
                result = await self.predict(model, df)
                results.append(result)
            except Exception as e:
                logger.error(f"Prediction failed for {model.model_type}: {str(e)}")
                results.append({
                    'symbol': model.symbol,
                    'model_type': model.model_type,
                    'status': 'failed',
                    'error': str(e)
                })
        
        return results
    
    def generate_forecast_timeline(
        self,
        predictions: np.ndarray,
        start_time: datetime,
        interval_minutes: int = 60
    ) -> List[Dict[str, Any]]:
        """
        Generate forecast timeline with timestamps
        
        Args:
            predictions: Array of predictions
            start_time: Starting timestamp
            interval_minutes: Interval between predictions in minutes
            
        Returns:
            List of forecast points with timestamps
        """
        forecast = []
        
        for i, pred in enumerate(predictions):
            timestamp = start_time + timedelta(minutes=interval_minutes * (i + 1))
            forecast.append({
                'timestamp': timestamp.isoformat(),
                'prediction': float(pred),
                'step': i + 1
            })
        
        return forecast
