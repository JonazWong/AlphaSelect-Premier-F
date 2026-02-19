"""
AI Training Service

Handles training of AI models with feature engineering and data preprocessing
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, Optional
import logging
from datetime import datetime

from app.ai.features.contract_features import ContractFeatures
from app.ai.features.funding_rate_features import FundingRateFeatures
from app.ai.features.oi_features import OpenInterestFeatures
from app.ai.models import (
    LSTMModel, XGBoostModel, RandomForestModel, 
    ARIMAModel, LinearRegressionModel, EnsembleModel
)

logger = logging.getLogger(__name__)


class AITrainingService:
    """Service for training AI models"""
    
    def __init__(self):
        self.model_registry = {}
    
    def prepare_training_data(
        self,
        df: pd.DataFrame,
        sequence_length: int = 60,
        test_size: float = 0.2,
        val_size: float = 0.1
    ) -> Dict[str, Any]:
        """
        Prepare data for training with feature engineering
        
        Args:
            df: DataFrame with raw contract market data
            sequence_length: Sequence length for LSTM
            test_size: Fraction for test set
            val_size: Fraction for validation set
            
        Returns:
            Dict with train/val/test splits
        """
        # Add all features
        df_features = ContractFeatures.add_all_features(df)
        df_features = FundingRateFeatures.add_all_features(df_features)
        df_features = OpenInterestFeatures.add_all_features(df_features)
        
        # Drop rows with NaN values
        df_features = df_features.dropna()
        
        if len(df_features) < 100:
            raise ValueError(f"Insufficient data after feature engineering: {len(df_features)} rows")
        
        # Create target (predict next price)
        df_features['target'] = df_features['last_price'].shift(-1)
        df_features = df_features.dropna()
        
        # Separate features and target
        feature_columns = [col for col in df_features.columns if col not in ['created_at', 'target']]
        X = df_features[feature_columns].values
        y = df_features['target'].values
        
        # Time-based split
        n_samples = len(X)
        test_idx = int(n_samples * (1 - test_size))
        val_idx = int(test_idx * (1 - val_size))
        
        X_train = X[:val_idx]
        y_train = y[:val_idx]
        
        X_val = X[val_idx:test_idx]
        y_val = y[val_idx:test_idx]
        
        X_test = X[test_idx:]
        y_test = y[test_idx:]
        
        logger.info(f"Data split: train={len(X_train)}, val={len(X_val)}, test={len(X_test)}")
        
        return {
            'X_train': X_train,
            'y_train': y_train,
            'X_val': X_val,
            'y_val': y_val,
            'X_test': X_test,
            'y_test': y_test,
            'feature_names': feature_columns,
            'n_features': len(feature_columns)
        }
    
    def train_model(
        self,
        symbol: str,
        model_type: str,
        df: pd.DataFrame,
        config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Train a single AI model
        
        Args:
            symbol: Trading symbol
            model_type: Type of model ('lstm', 'xgboost', 'random_forest', 'arima', 'linear_regression')
            df: DataFrame with contract market data
            config: Model configuration
            
        Returns:
            Dict with model and metrics
        """
        logger.info(f"Training {model_type} model for {symbol}")
        
        # Prepare data
        data = self.prepare_training_data(df)
        
        # Create model
        if model_type == 'lstm':
            model = LSTMModel(symbol, config)
        elif model_type == 'xgboost':
            model = XGBoostModel(symbol, config)
        elif model_type == 'random_forest':
            model = RandomForestModel(symbol, config)
        elif model_type == 'arima':
            model = ARIMAModel(symbol, config)
        elif model_type == 'linear_regression':
            model = LinearRegressionModel(symbol, config)
        else:
            raise ValueError(f"Unknown model type: {model_type}")
        
        # Set feature names
        model.feature_names = data['feature_names']
        
        # Train model
        metrics = model.train(
            data['X_train'],
            data['y_train'],
            data['X_val'],
            data['y_val']
        )
        
        # Evaluate on test set
        test_metrics = model.evaluate(data['X_test'], data['y_test'])
        
        logger.info(f"Model trained successfully. Test R² = {test_metrics['r2_score']:.4f}")
        
        return {
            'model': model,
            'train_metrics': metrics,
            'test_metrics': test_metrics,
            'n_features': data['n_features']
        }
    
    def train_ensemble(
        self,
        symbol: str,
        df: pd.DataFrame,
        model_configs: Optional[Dict[str, Dict]] = None
    ) -> Dict[str, Any]:
        """
        Train all models for ensemble
        
        Args:
            symbol: Trading symbol
            df: DataFrame with contract market data
            model_configs: Dict mapping model_type to config
            
        Returns:
            Dict with ensemble model and individual results
        """
        logger.info(f"Training ensemble for {symbol}")
        
        if model_configs is None:
            model_configs = {
                'lstm': {'sequence_length': 60, 'epochs': 50},
                'xgboost': {'n_estimators': 100},
                'random_forest': {'n_estimators': 100},
                'arima': {},
                'linear_regression': {}
            }
        
        # Prepare data once
        data = self.prepare_training_data(df)
        
        # Train each model
        trained_models = []
        results = {}
        
        for model_type, config in model_configs.items():
            try:
                logger.info(f"Training {model_type}...")
                
                # Create model
                if model_type == 'lstm':
                    model = LSTMModel(symbol, config)
                elif model_type == 'xgboost':
                    model = XGBoostModel(symbol, config)
                elif model_type == 'random_forest':
                    model = RandomForestModel(symbol, config)
                elif model_type == 'arima':
                    model = ARIMAModel(symbol, config)
                elif model_type == 'linear_regression':
                    model = LinearRegressionModel(symbol, config)
                else:
                    logger.warning(f"Unknown model type: {model_type}, skipping")
                    continue
                
                # Set feature names
                model.feature_names = data['feature_names']
                
                # Train
                metrics = model.train(
                    data['X_train'],
                    data['y_train'],
                    data['X_val'],
                    data['y_val']
                )
                
                # Evaluate
                test_metrics = model.evaluate(data['X_test'], data['y_test'])
                
                trained_models.append(model)
                results[model_type] = {
                    'status': 'success',
                    'train_metrics': metrics,
                    'test_metrics': test_metrics
                }
                
                logger.info(f"✓ {model_type} completed. R² = {test_metrics['r2_score']:.4f}")
                
            except Exception as e:
                logger.error(f"✗ {model_type} failed: {str(e)}")
                results[model_type] = {
                    'status': 'failed',
                    'error': str(e)
                }
        
        # Create ensemble
        ensemble = EnsembleModel(symbol, models=trained_models)
        
        # Calculate weights
        if data['X_val'] is not None:
            ensemble.calculate_weights(data['X_val'], data['y_val'])
        
        # Evaluate ensemble
        ensemble_metrics = ensemble.evaluate(data['X_test'], data['y_test'])
        
        logger.info(f"Ensemble completed. R² = {ensemble_metrics['r2_score']:.4f}")
        logger.info(f"Model weights: {ensemble.model_weights}")
        
        return {
            'ensemble': ensemble,
            'individual_results': results,
            'ensemble_metrics': ensemble_metrics,
            'weights': ensemble.model_weights
        }
    
    def save_model(
        self,
        model,
        model_dir: str,
        symbol: str,
        model_type: str,
        version: str = 'v1'
    ) -> str:
        """
        Save trained model to disk
        
        Args:
            model: Trained model instance
            model_dir: Directory to save models
            symbol: Trading symbol
            model_type: Type of model
            version: Model version
            
        Returns:
            Path to saved model file
        """
        import os
        
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        filename = f"{symbol}_{model_type}_{version}_{timestamp}.pkl"
        filepath = os.path.join(model_dir, model_type, filename)
        
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        model.save(filepath)
        
        logger.info(f"Model saved to {filepath}")
        
        return filepath
    
    def load_model(
        self,
        filepath: str,
        symbol: str,
        model_type: str
    ):
        """
        Load model from disk
        
        Args:
            filepath: Path to model file
            symbol: Trading symbol
            model_type: Type of model
            
        Returns:
            Loaded model instance
        """
        # Create model instance
        if model_type == 'lstm':
            model = LSTMModel(symbol)
        elif model_type == 'xgboost':
            model = XGBoostModel(symbol)
        elif model_type == 'random_forest':
            model = RandomForestModel(symbol)
        elif model_type == 'arima':
            model = ARIMAModel(symbol)
        elif model_type == 'linear_regression':
            model = LinearRegressionModel(symbol)
        elif model_type == 'ensemble':
            model = EnsembleModel(symbol)
        else:
            raise ValueError(f"Unknown model type: {model_type}")
        
        # Load weights
        model.load(filepath)
        
        logger.info(f"Model loaded from {filepath}")
        
        return model
