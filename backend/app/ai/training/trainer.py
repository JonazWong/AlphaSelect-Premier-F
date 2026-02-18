from typing import Dict, Any, Type
import pandas as pd
from datetime import datetime
from app.ai.models.base_model import BaseModel
from app.ai.models.lstm_model import LSTMModel
from app.ai.models.xgboost_model import XGBoostModel
from app.ai.training.data_preprocessor import DataPreprocessor


class ModelTrainer:
    """Trainer for AI models"""
    
    def __init__(self, symbol: str):
        self.symbol = symbol
        self.preprocessor = DataPreprocessor()
        
    def get_model_class(self, model_type: str) -> Type[BaseModel]:
        """Get model class by type name"""
        model_mapping = {
            'lstm': LSTMModel,
            'xgboost': XGBoostModel,
        }
        
        if model_type not in model_mapping:
            raise ValueError(f"Unknown model type: {model_type}")
        
        return model_mapping[model_type]
    
    def train_model(self, df: pd.DataFrame, model_type: str, 
                   config: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Train a single model
        
        Args:
            df: Raw contract market data
            model_type: Type of model to train (lstm, xgboost)
            config: Model configuration
            
        Returns:
            Dict with model, metrics, and metadata
        """
        # Prepare data
        data = self.preprocessor.prepare_for_training(df)
        
        # Create model
        model_class = self.get_model_class(model_type)
        model = model_class(self.symbol, config)
        model.feature_names = data['feature_names']
        
        # Train model
        training_start = datetime.utcnow()
        
        train_metrics = model.train(
            data['X_train'], data['y_train'],
            data['X_val'], data['y_val']
        )
        
        training_end = datetime.utcnow()
        training_duration = (training_end - training_start).total_seconds()
        
        # Evaluate on test set
        test_metrics = model.evaluate(data['X_test'], data['y_test'])
        
        # Combine metrics
        all_metrics = {
            **train_metrics,
            **{f'test_{k}': v for k, v in test_metrics.items()},
            'training_duration_seconds': training_duration
        }
        
        return {
            'model': model,
            'metrics': all_metrics,
            'data_info': {
                'n_train': data['n_train'],
                'n_val': data['n_val'],
                'n_test': data['n_test'],
                'n_features': data['n_features'],
                'feature_names': data['feature_names']
            },
            'training_start': training_start,
            'training_end': training_end
        }
    
    def train_multiple_models(self, df: pd.DataFrame, 
                            model_configs: Dict[str, Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        """
        Train multiple models
        
        Args:
            df: Raw contract market data
            model_configs: Dict mapping model_type to config
                Example: {'lstm': {...}, 'xgboost': {...}}
            
        Returns:
            Dict mapping model_type to training results
        """
        results = {}
        
        for model_type, config in model_configs.items():
            try:
                result = self.train_model(df, model_type, config)
                results[model_type] = result
                print(f"✓ {model_type} training completed")
            except Exception as e:
                print(f"✗ {model_type} training failed: {str(e)}")
                results[model_type] = {
                    'error': str(e),
                    'status': 'failed'
                }
        
        return results
    
    def save_model(self, model: BaseModel, base_path: str) -> str:
        """
        Save trained model
        
        Args:
            model: Trained model
            base_path: Base directory for saving models
            
        Returns:
            Path where model was saved
        """
        import os
        
        # Create filename with timestamp
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        filename = f"{self.symbol}_{model.model_type}_{timestamp}.pkl"
        filepath = os.path.join(base_path, filename)
        
        # Save model
        model.save(filepath)
        
        return filepath
    
    def load_model(self, model_type: str, filepath: str) -> BaseModel:
        """
        Load trained model
        
        Args:
            model_type: Type of model
            filepath: Path to model file
            
        Returns:
            Loaded model
        """
        model_class = self.get_model_class(model_type)
        model = model_class(self.symbol)
        model.load(filepath)
        
        return model
