import numpy as np
from typing import Dict, Any
from app.ai.models.base_model import BaseModel


class LSTMModel(BaseModel):
    """LSTM model for cryptocurrency price prediction"""
    
    def __init__(self, symbol: str, config: Dict[str, Any] = None):
        super().__init__(symbol, config)
        
        # Default configuration
        self.config.setdefault('sequence_length', 60)
        self.config.setdefault('units', [128, 64])
        self.config.setdefault('dropout', 0.2)
        self.config.setdefault('epochs', 100)
        self.config.setdefault('batch_size', 32)
        self.config.setdefault('learning_rate', 0.001)
        
    def build_model(self) -> None:
        """Build LSTM model architecture"""
        import tensorflow as tf
        from tensorflow.keras.models import Sequential
        from tensorflow.keras.layers import LSTM, Dense, Dropout
        from tensorflow.keras.optimizers import Adam
        
        model = Sequential()
        
        # First LSTM layer
        model.add(LSTM(
            units=self.config['units'][0],
            return_sequences=len(self.config['units']) > 1,
            input_shape=(self.config['sequence_length'], len(self.feature_names))
        ))
        model.add(Dropout(self.config['dropout']))
        
        # Additional LSTM layers
        for i, units in enumerate(self.config['units'][1:]):
            return_seq = i < len(self.config['units']) - 2
            model.add(LSTM(units=units, return_sequences=return_seq))
            model.add(Dropout(self.config['dropout']))
        
        # Output layer
        model.add(Dense(units=1))
        
        # Compile model
        optimizer = Adam(learning_rate=self.config['learning_rate'])
        model.compile(optimizer=optimizer, loss='mse', metrics=['mae'])
        
        self.model = model
    
    def prepare_sequences(self, X: np.ndarray, y: np.ndarray = None):
        """
        Prepare sequences for LSTM
        
        Args:
            X: Features array
            y: Target array (optional)
            
        Returns:
            X_seq: Sequences of shape (samples, sequence_length, features)
            y_seq: Targets (if y provided)
        """
        seq_length = self.config['sequence_length']
        
        X_seq = []
        y_seq = [] if y is not None else None
        
        for i in range(seq_length, len(X)):
            X_seq.append(X[i-seq_length:i])
            if y is not None:
                y_seq.append(y[i])
        
        X_seq = np.array(X_seq)
        
        if y is not None:
            y_seq = np.array(y_seq)
            return X_seq, y_seq
        
        return X_seq
    
    def train(self, X_train: np.ndarray, y_train: np.ndarray,
              X_val: np.ndarray = None, y_val: np.ndarray = None) -> Dict[str, float]:
        """
        Train LSTM model
        
        Args:
            X_train: Training features
            y_train: Training targets
            X_val: Validation features (optional)
            y_val: Validation targets (optional)
            
        Returns:
            Dict with training metrics
        """
        from sklearn.preprocessing import StandardScaler
        import tensorflow as tf
        
        # Scale features
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        
        # Prepare sequences
        X_train_seq, y_train_seq = self.prepare_sequences(X_train_scaled, y_train)
        
        validation_data = None
        if X_val is not None and y_val is not None:
            X_val_scaled = self.scaler.transform(X_val)
            X_val_seq, y_val_seq = self.prepare_sequences(X_val_scaled, y_val)
            validation_data = (X_val_seq, y_val_seq)
        
        # Build model if not already built
        if self.model is None:
            self.build_model()
        
        # Early stopping
        early_stopping = tf.keras.callbacks.EarlyStopping(
            monitor='val_loss' if validation_data else 'loss',
            patience=10,
            restore_best_weights=True
        )
        
        # Train model
        history = self.model.fit(
            X_train_seq, y_train_seq,
            epochs=self.config['epochs'],
            batch_size=self.config['batch_size'],
            validation_data=validation_data,
            callbacks=[early_stopping],
            verbose=0
        )
        
        # Return final metrics
        metrics = {
            'loss': float(history.history['loss'][-1]),
            'mae': float(history.history['mae'][-1])
        }
        
        if validation_data:
            metrics['val_loss'] = float(history.history['val_loss'][-1])
            metrics['val_mae'] = float(history.history['val_mae'][-1])
        
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
        
        # Prepare sequences
        X_seq = self.prepare_sequences(X_scaled)
        
        # Predict
        predictions = self.model.predict(X_seq, verbose=0)
        
        return predictions.flatten()
