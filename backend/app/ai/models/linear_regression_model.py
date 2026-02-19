import numpy as np
from typing import Dict, Any
from app.ai.models.base_model import BaseModel


class LinearRegressionModel(BaseModel):
    """Linear Regression baseline model for cryptocurrency price prediction"""
    
    def __init__(self, symbol: str, config: Dict[str, Any] = None):
        super().__init__(symbol, config)
        # Ensure model_type matches API/UI identifier
        self.model_type = 'linear_regression'
        
        # Default configuration
        self.config.setdefault('fit_intercept', True)
        
    def build_model(self) -> None:
        """Build Linear Regression model"""
        from sklearn.linear_model import LinearRegression
        
        self.model = LinearRegression(
            fit_intercept=self.config['fit_intercept']
        )
    
    def train(self, X_train: np.ndarray, y_train: np.ndarray,
              X_val: np.ndarray = None, y_val: np.ndarray = None) -> Dict[str, float]:
        """
        Train Linear Regression model
        
        Args:
            X_train: Training features
            y_train: Training targets
            X_val: Validation features (optional)
            y_val: Validation targets (optional)
            
        Returns:
            Dict with training metrics
        """
        from sklearn.preprocessing import StandardScaler
        from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
        
        # Scale features
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        
        # Build model if not already built
        if self.model is None:
            self.build_model()
        
        # Train model
        self.model.fit(X_train_scaled, y_train)
        
        # Calculate training metrics
        train_predictions = self.model.predict(X_train_scaled)
        
        metrics = {
            'mae': float(mean_absolute_error(y_train, train_predictions)),
            'mse': float(mean_squared_error(y_train, train_predictions)),
            'rmse': float(np.sqrt(mean_squared_error(y_train, train_predictions))),
            'r2_score': float(r2_score(y_train, train_predictions))
        }
        
        # Calculate validation metrics if provided
        if X_val is not None and y_val is not None:
            X_val_scaled = self.scaler.transform(X_val)
            val_predictions = self.model.predict(X_val_scaled)
            metrics['val_mae'] = float(mean_absolute_error(y_val, val_predictions))
            metrics['val_mse'] = float(mean_squared_error(y_val, val_predictions))
            metrics['val_rmse'] = float(np.sqrt(mean_squared_error(y_val, val_predictions)))
            metrics['val_r2_score'] = float(r2_score(y_val, val_predictions))
        
        return metrics
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Make predictions
        
        Args:
            X: Features array
            
        Returns:
            Predictions array
        """
        if self.scaler is None or self.model is None:
            raise ValueError("Model must be trained before prediction")
        
        # Scale features
        X_scaled = self.scaler.transform(X)
        
        # Predict
        predictions = self.model.predict(X_scaled)
        
        return predictions
    
    def get_coefficients(self) -> Dict[str, float]:
        """
        Get model coefficients
        
        Returns:
            Dict mapping feature names to coefficients
        """
        if self.model is None:
            raise ValueError("Model must be trained first")
        
        coefficients = {}
        for i, name in enumerate(self.feature_names):
            coefficients[name] = float(self.model.coef_[i])
        
        # Add intercept
        if self.config['fit_intercept']:
            coefficients['intercept'] = float(self.model.intercept_)
        
        return coefficients
