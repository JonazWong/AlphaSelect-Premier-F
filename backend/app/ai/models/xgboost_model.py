import numpy as np
from typing import Dict, Any
from app.ai.models.base_model import BaseModel


class XGBoostModel(BaseModel):
    """XGBoost model for cryptocurrency price prediction"""
    
    def __init__(self, symbol: str, config: Dict[str, Any] = None):
        super().__init__(symbol, config)
        
        # Default configuration
        self.config.setdefault('n_estimators', 100)
        self.config.setdefault('max_depth', 6)
        self.config.setdefault('learning_rate', 0.1)
        self.config.setdefault('subsample', 0.8)
        self.config.setdefault('colsample_bytree', 0.8)
        self.config.setdefault('random_state', 42)
        
    def build_model(self) -> None:
        """Build XGBoost model"""
        import xgboost as xgb
        
        self.model = xgb.XGBRegressor(
            n_estimators=self.config['n_estimators'],
            max_depth=self.config['max_depth'],
            learning_rate=self.config['learning_rate'],
            subsample=self.config['subsample'],
            colsample_bytree=self.config['colsample_bytree'],
            random_state=self.config['random_state'],
            objective='reg:squarederror',
            n_jobs=-1
        )
    
    def train(self, X_train: np.ndarray, y_train: np.ndarray,
              X_val: np.ndarray = None, y_val: np.ndarray = None) -> Dict[str, float]:
        """
        Train XGBoost model
        
        Args:
            X_train: Training features
            y_train: Training targets
            X_val: Validation features (optional)
            y_val: Validation targets (optional)
            
        Returns:
            Dict with training metrics
        """
        from sklearn.preprocessing import StandardScaler
        
        # Scale features
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        
        # Build model if not already built
        if self.model is None:
            self.build_model()
        
        # Prepare validation data
        eval_set = None
        if X_val is not None and y_val is not None:
            X_val_scaled = self.scaler.transform(X_val)
            eval_set = [(X_val_scaled, y_val)]
        
        # Train model
        self.model.fit(
            X_train_scaled, y_train,
            eval_set=eval_set,
            verbose=False
        )
        
        # Calculate metrics
        train_predictions = self.model.predict(X_train_scaled)
        from sklearn.metrics import mean_absolute_error, mean_squared_error
        
        metrics = {
            'mae': float(mean_absolute_error(y_train, train_predictions)),
            'mse': float(mean_squared_error(y_train, train_predictions)),
            'rmse': float(np.sqrt(mean_squared_error(y_train, train_predictions)))
        }
        
        if X_val is not None and y_val is not None:
            val_predictions = self.model.predict(X_val_scaled)
            metrics['val_mae'] = float(mean_absolute_error(y_val, val_predictions))
            metrics['val_mse'] = float(mean_squared_error(y_val, val_predictions))
            metrics['val_rmse'] = float(np.sqrt(mean_squared_error(y_val, val_predictions)))
        
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
    
    def get_feature_importance(self) -> Dict[str, float]:
        """
        Get feature importance scores
        
        Returns:
            Dict mapping feature names to importance scores
        """
        if self.model is None:
            raise ValueError("Model must be trained first")
        
        importance = self.model.feature_importances_
        
        feature_importance = {}
        for i, name in enumerate(self.feature_names):
            feature_importance[name] = float(importance[i])
        
        # Sort by importance
        feature_importance = dict(sorted(
            feature_importance.items(),
            key=lambda x: x[1],
            reverse=True
        ))
        
        return feature_importance
