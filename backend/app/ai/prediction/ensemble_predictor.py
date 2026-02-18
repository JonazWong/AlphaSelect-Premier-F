import numpy as np
import pandas as pd
from typing import Dict, Any, List
from datetime import datetime
from app.ai.models.ensemble_model import EnsembleModel
from app.ai.prediction.predictor import Predictor


class EnsemblePredictor(Predictor):
    """Make predictions using ensemble of models"""
    
    def __init__(self, ensemble_model: EnsembleModel):
        super().__init__(ensemble_model)
        self.ensemble_model = ensemble_model
        
    def predict_with_breakdown(self, df: pd.DataFrame, horizon: int = 1) -> Dict[str, Any]:
        """
        Predict with breakdown of individual model contributions
        
        Args:
            df: Recent historical data
            horizon: Number of periods ahead to predict
            
        Returns:
            Dict with ensemble prediction and individual model predictions
        """
        # Get main ensemble prediction
        main_prediction = self.predict_next(df, horizon)
        
        # Get individual model predictions
        df_features = self.preprocessor.prepare_data(df)
        feature_cols = [col for col in df_features.columns 
                       if col in self.model.feature_names]
        X = df_features[feature_cols].values
        
        # Get contributions from each model
        contributions = self.ensemble_model.get_model_contributions(X)
        
        # Format individual predictions
        individual_predictions = {}
        for model_type, predictions in contributions.items():
            individual_predictions[model_type] = {
                'predicted_value': float(predictions[-1]),
                'weight': self.ensemble_model.model_weights.get(model_type, 0.0)
            }
        
        # Add breakdown to main prediction
        main_prediction['model_breakdown'] = individual_predictions
        main_prediction['model_weights'] = self.ensemble_model.model_weights
        
        return main_prediction
    
    def predict_batch_with_breakdown(self, df: pd.DataFrame, 
                                     horizons: List[int] = None) -> List[Dict[str, Any]]:
        """
        Make predictions for multiple horizons with model breakdown
        
        Args:
            df: Recent historical data
            horizons: List of horizons to predict
            
        Returns:
            List of prediction dicts with breakdowns
        """
        if horizons is None:
            horizons = [1, 3, 6, 12, 24]
        
        predictions = []
        for horizon in horizons:
            pred = self.predict_with_breakdown(df, horizon)
            predictions.append(pred)
        
        return predictions
    
    def get_model_agreement(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Analyze agreement between models
        
        Args:
            df: Recent historical data
            
        Returns:
            Dict with agreement metrics
        """
        # Prepare features
        df_features = self.preprocessor.prepare_data(df)
        feature_cols = [col for col in df_features.columns 
                       if col in self.model.feature_names]
        X = df_features[feature_cols].values
        
        # Get predictions from all models
        contributions = self.ensemble_model.get_model_contributions(X)
        
        if not contributions:
            return {'agreement_score': 0.0, 'models_count': 0}
        
        # Get last predictions from each model
        last_predictions = []
        for predictions in contributions.values():
            last_predictions.append(predictions[-1])
        
        # Calculate agreement metrics
        predictions_array = np.array(last_predictions)
        mean_pred = np.mean(predictions_array)
        std_pred = np.std(predictions_array)
        
        # Agreement score: 1.0 - normalized std
        agreement_score = 1.0 - min(1.0, std_pred / (abs(mean_pred) + 1e-10))
        
        # Direction agreement (all bullish or all bearish)
        if len(contributions) >= 2:
            model_types = list(contributions.keys())
            first_pred = contributions[model_types[0]][-1]
            second_pred = contributions[model_types[1]][-1]
            
            if len(contributions[model_types[0]]) > 1 and len(contributions[model_types[1]]) > 1:
                first_direction = first_pred > contributions[model_types[0]][-2]
                second_direction = second_pred > contributions[model_types[1]][-2]
                direction_agreement = first_direction == second_direction
            else:
                direction_agreement = None
        else:
            direction_agreement = None
        
        return {
            'agreement_score': float(agreement_score),
            'models_count': len(contributions),
            'mean_prediction': float(mean_pred),
            'std_prediction': float(std_pred),
            'direction_agreement': direction_agreement,
            'predictions': {k: float(v[-1]) for k, v in contributions.items()}
        }
