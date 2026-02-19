import numpy as np
import pandas as pd
from typing import Dict, Any
from app.ai.models.base_model import BaseModel


class ARIMAModel(BaseModel):
    """ARIMA model for time series cryptocurrency price prediction"""
    
    def __init__(self, symbol: str, config: Dict[str, Any] = None):
        super().__init__(symbol, config)
        
        # Default configuration
        self.config.setdefault('seasonal', True)
        self.config.setdefault('m', 12)  # Seasonal period
        self.config.setdefault('max_p', 5)
        self.config.setdefault('max_q', 5)
        self.config.setdefault('max_d', 2)
        self.config.setdefault('information_criterion', 'aic')
        
        self.target_scaler = None
        
    def build_model(self) -> None:
        """ARIMA model is built during training via auto_arima"""
        pass
    
    def train(self, X_train: np.ndarray, y_train: np.ndarray,
              X_val: np.ndarray = None, y_val: np.ndarray = None) -> Dict[str, float]:
        """
        Train ARIMA model
        
        Args:
            X_train: Training features (not used for ARIMA, only y_train)
            y_train: Training targets (time series)
            X_val: Validation features (optional, not used)
            y_val: Validation targets (optional)
            
        Returns:
            Dict with training metrics
        """
        from statsmodels.tsa.statespace.sarimax import SARIMAX
        from sklearn.preprocessing import StandardScaler
        from sklearn.metrics import mean_absolute_error, mean_squared_error
        
        # Scale target for better numerical stability
        self.target_scaler = StandardScaler()
        y_train_scaled = self.target_scaler.fit_transform(y_train.reshape(-1, 1)).flatten()
        
        # Use simple ARIMA(1,1,1) for stability and speed
        # Auto ARIMA can be very slow, so we use a reasonable default
        try:
            # Try to fit ARIMA(1,1,1) model
            self.model = SARIMAX(
                y_train_scaled,
                order=(1, 1, 1),
                seasonal_order=(0, 0, 0, 0),
                enforce_stationarity=False,
                enforce_invertibility=False
            )
            
            self.model = self.model.fit(disp=False)
            
        except Exception as e:
            # Fallback to even simpler model
            print(f"ARIMA(1,1,1) failed, using ARIMA(1,0,0): {e}")
            self.model = SARIMAX(
                y_train_scaled,
                order=(1, 0, 0),
                seasonal_order=(0, 0, 0, 0),
                enforce_stationarity=False,
                enforce_invertibility=False
            )
            self.model = self.model.fit(disp=False)
        
        # Calculate in-sample predictions for metrics
        predictions_scaled = self.model.fittedvalues
        predictions = self.target_scaler.inverse_transform(
            predictions_scaled.reshape(-1, 1)
        ).flatten()
        
        # Align predictions and actual (fittedvalues may have different length)
        min_len = min(len(predictions), len(y_train))
        predictions = predictions[-min_len:]
        y_actual = y_train[-min_len:]
        
        metrics = {
            'mae': float(mean_absolute_error(y_actual, predictions)),
            'mse': float(mean_squared_error(y_actual, predictions)),
            'rmse': float(np.sqrt(mean_squared_error(y_actual, predictions))),
            'aic': float(self.model.aic) if hasattr(self.model, 'aic') else 0.0
        }
        
        # Calculate validation metrics if provided
        if y_val is not None:
            try:
                # Forecast validation period
                forecast_steps = len(y_val)
                forecast_scaled = self.model.forecast(steps=forecast_steps)
                forecast = self.target_scaler.inverse_transform(
                    forecast_scaled.reshape(-1, 1)
                ).flatten()
                
                metrics['val_mae'] = float(mean_absolute_error(y_val, forecast))
                metrics['val_mse'] = float(mean_squared_error(y_val, forecast))
                metrics['val_rmse'] = float(np.sqrt(mean_squared_error(y_val, forecast)))
            except Exception as e:
                print(f"Warning: Could not calculate validation metrics: {e}")
        
        return metrics
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Make predictions
        
        Note: ARIMA is a time series model and doesn't use features X.
        The number of predictions is based on the length of X.
        
        Args:
            X: Features array (length determines forecast horizon)
            
        Returns:
            Predictions array
        """
        if self.model is None:
            raise ValueError("Model must be trained before prediction")
        
        # Forecast steps based on X length
        steps = len(X)
        
        # Get forecast
        forecast_scaled = self.model.forecast(steps=steps)
        
        # Inverse transform
        if self.target_scaler is not None:
            forecast = self.target_scaler.inverse_transform(
                forecast_scaled.reshape(-1, 1)
            ).flatten()
        else:
            forecast = forecast_scaled
        
        return forecast
