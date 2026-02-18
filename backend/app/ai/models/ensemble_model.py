import numpy as np
from typing import Dict, Any, List
from app.ai.models.base_model import BaseModel


class EnsembleModel(BaseModel):
    """Ensemble model combining predictions from multiple AI models"""
    
    def __init__(self, symbol: str, models: List[BaseModel] = None, config: Dict[str, Any] = None):
        super().__init__(symbol, config)
        
        self.models = models or []
        self.model_weights = {}
        
        # Default configuration
        self.config.setdefault('weighting_method', 'performance')  # 'equal', 'performance'
        
    def add_model(self, model: BaseModel) -> None:
        """Add a model to the ensemble"""
        self.models.append(model)
    
    def build_model(self) -> None:
        """Ensemble doesn't need to build - it uses existing models"""
        pass
    
    def calculate_weights(self, X_val: np.ndarray, y_val: np.ndarray) -> None:
        """
        Calculate model weights based on validation performance
        
        Args:
            X_val: Validation features
            y_val: Validation targets
        """
        from sklearn.metrics import mean_squared_error
        
        if self.config['weighting_method'] == 'equal':
            # Equal weights for all models
            weight = 1.0 / len(self.models)
            for model in self.models:
                self.model_weights[model.model_type] = weight
        
        elif self.config['weighting_method'] == 'performance':
            # Weight by inverse MSE (better models get higher weight)
            mse_scores = []
            
            for model in self.models:
                try:
                    predictions = model.predict(X_val)
                    # Align lengths if needed (e.g., for LSTM with sequences)
                    min_len = min(len(predictions), len(y_val))
                    mse = mean_squared_error(y_val[-min_len:], predictions[-min_len:])
                    mse_scores.append(mse)
                except Exception as e:
                    print(f"Error evaluating {model.model_type}: {e}")
                    mse_scores.append(float('inf'))
            
            # Calculate inverse MSE weights
            inv_mse = [1.0 / (mse + 1e-10) for mse in mse_scores]
            total_inv_mse = sum(inv_mse)
            
            for i, model in enumerate(self.models):
                self.model_weights[model.model_type] = inv_mse[i] / total_inv_mse
    
    def train(self, X_train: np.ndarray, y_train: np.ndarray,
              X_val: np.ndarray = None, y_val: np.ndarray = None) -> Dict[str, float]:
        """
        Calculate ensemble weights
        
        Note: Individual models should be trained separately before creating ensemble
        
        Args:
            X_train: Training features (not used, for API consistency)
            y_train: Training targets (not used, for API consistency)
            X_val: Validation features for weight calculation
            y_val: Validation targets for weight calculation
            
        Returns:
            Dict with metrics
        """
        if X_val is None or y_val is None:
            raise ValueError("Ensemble requires validation data to calculate weights")
        
        # Calculate weights based on validation performance
        self.calculate_weights(X_val, y_val)
        
        # Evaluate ensemble on validation set
        predictions = self.predict(X_val)
        metrics = self.evaluate(X_val, y_val)
        
        # Add weight information to metrics
        metrics['weights'] = self.model_weights
        
        return metrics
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Make ensemble predictions
        
        Args:
            X: Features array
            
        Returns:
            Weighted average predictions
        """
        if not self.models:
            raise ValueError("No models in ensemble")
        
        if not self.model_weights:
            # Use equal weights if not calculated
            weight = 1.0 / len(self.models)
            for model in self.models:
                self.model_weights[model.model_type] = weight
        
        # Collect predictions from all models
        all_predictions = []
        weights = []
        
        for model in self.models:
            try:
                predictions = model.predict(X)
                all_predictions.append(predictions)
                weights.append(self.model_weights.get(model.model_type, 0.0))
            except Exception as e:
                print(f"Error predicting with {model.model_type}: {e}")
                continue
        
        if not all_predictions:
            raise ValueError("No valid predictions from ensemble models")
        
        # Find minimum length (for LSTM which may have shorter predictions)
        min_len = min(len(pred) for pred in all_predictions)
        
        # Truncate all predictions to minimum length
        all_predictions = [pred[-min_len:] for pred in all_predictions]
        
        # Normalize weights
        weights = np.array(weights)
        weights = weights / weights.sum()
        
        # Weighted average
        ensemble_predictions = np.zeros(min_len)
        for i, predictions in enumerate(all_predictions):
            ensemble_predictions += predictions * weights[i]
        
        return ensemble_predictions
    
    def get_model_contributions(self, X: np.ndarray) -> Dict[str, np.ndarray]:
        """
        Get individual model predictions for analysis
        
        Args:
            X: Features array
            
        Returns:
            Dict mapping model types to their predictions
        """
        contributions = {}
        
        for model in self.models:
            try:
                predictions = model.predict(X)
                contributions[model.model_type] = predictions
            except Exception as e:
                print(f"Error getting contribution from {model.model_type}: {e}")
        
        return contributions
