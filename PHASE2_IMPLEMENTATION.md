# Phase 2 AI/ML Implementation

This document describes the Phase 2 AI/ML features implemented for the AlphaSelect Premier F trading platform.

## Overview

Phase 2 implements the core AI/ML prediction capabilities for cryptocurrency contract trading, building on the Phase 1 infrastructure completed in PR #1.

## Features Implemented

### 1. AI Models

#### Base Model (`app/ai/models/base_model.py`)
- Abstract base class for all AI models
- Common interface: `train()`, `predict()`, `evaluate()`
- Built-in metrics: R² score, MAE, MSE, RMSE, directional accuracy
- Model persistence (save/load)

#### LSTM Model (`app/ai/models/lstm_model.py`)
- Deep learning model for time series prediction
- Configurable architecture (layers, units, dropout)
- Automatic sequence preparation
- Early stopping during training
- Best for: Long-term trend prediction

#### XGBoost Model (`app/ai/models/xgboost_model.py`)
- Gradient boosting model
- Feature importance analysis
- Fast training with excellent accuracy
- Best for: Short-term price prediction

#### Ensemble Model (`app/ai/models/ensemble_model.py`)
- Combines multiple models
- Weighted averaging based on validation performance
- Model contribution analysis
- Best for: Overall best accuracy

### 2. Feature Engineering

#### Contract Features (`app/ai/features/contract_features.py`)
- Price features: Returns, momentum, volatility
- Moving averages: SMA, EMA (5, 10, 20, 50 periods)
- Volume features: Volume changes and ratios
- Price range features: Daily range, position
- Basis features: Futures-spot spread

#### Funding Rate Features (`app/ai/features/funding_rate_features.py`)
- Funding rate statistics and moving averages
- Changes and momentum indicators
- Cumulative funding rates
- Position within recent range

#### Open Interest Features (`app/ai/features/oi_features.py`)
- Open interest changes and momentum
- Rate of change indicators
- Volatility measures
- Position indicators

### 3. Training Infrastructure

#### Data Preprocessor (`app/ai/training/data_preprocessor.py`)
- Automatic feature engineering
- Time-based train/validation/test split
- Feature selection
- Target creation with configurable prediction horizon

#### Model Trainer (`app/ai/training/trainer.py`)
- Single model training
- Batch training of multiple models
- Model persistence and loading
- Training metrics tracking

### 4. Prediction Infrastructure

#### Predictor (`app/ai/prediction/predictor.py`)
- Single model predictions
- Batch predictions for multiple horizons
- Confidence scoring
- Current vs predicted price comparison

#### Ensemble Predictor (`app/ai/prediction/ensemble_predictor.py`)
- Multi-model predictions with breakdown
- Model agreement analysis
- Individual model contributions
- Confidence scoring based on model consensus

### 5. API Endpoints

#### Training Endpoints (`/api/v1/ai/training`)
- `POST /train` - Start model training (async via background tasks)
- `GET /models/{symbol}` - List all trained models for a symbol
- `GET /model/{model_id}` - Get model details
- `DELETE /model/{model_id}` - Delete a trained model

#### Prediction Endpoints (`/api/v1/ai/predict`)
- `POST /predict` - Make price prediction (single model or ensemble)
- `GET /predictions/{symbol}` - Get prediction history
- `GET /prediction/{prediction_id}` - Get prediction details

### 6. Background Tasks (Celery)

#### AI Training Tasks (`app/tasks/ai_training_tasks.py`)
- `train_single_model_task` - Async single model training
- `train_ensemble_models_task` - Train multiple models in sequence
- `cleanup_old_models_task` - Remove old models to save storage

#### Celery Configuration (`app/tasks/celery_app.py`)
- Redis-backed task queue
- 1-hour task timeout
- Task progress tracking
- JSON serialization

## Usage Examples

### Training a Model via API

```bash
# Train an XGBoost model
curl -X POST http://localhost:8000/api/v1/ai/training/train \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTC_USDT",
    "model_type": "xgboost",
    "config": {
      "n_estimators": 100,
      "max_depth": 6
    }
  }'
```

### Making Predictions via API

```bash
# Make ensemble prediction
curl -X POST http://localhost:8000/api/v1/ai/predict/predict \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTC_USDT",
    "horizon": 1,
    "use_ensemble": true
  }'
```

### Programmatic Usage

```python
from app.ai.models import XGBoostModel
from app.ai.training import ModelTrainer, DataPreprocessor
import pandas as pd

# Prepare data
df = pd.read_csv('contract_data.csv')
preprocessor = DataPreprocessor()
data = preprocessor.prepare_for_training(df)

# Train model
model = XGBoostModel('BTC_USDT')
model.feature_names = data['feature_names']
metrics = model.train(data['X_train'], data['y_train'], 
                      data['X_val'], data['y_val'])

# Make predictions
from app.ai.prediction import Predictor
predictor = Predictor(model)
prediction = predictor.predict_next(df, horizon=1)
print(f"Predicted price: {prediction['predicted_value']}")
```

## File Structure

```
backend/app/ai/
├── models/
│   ├── __init__.py
│   ├── base_model.py        # Base class
│   ├── lstm_model.py        # LSTM implementation
│   ├── xgboost_model.py     # XGBoost implementation
│   └── ensemble_model.py    # Ensemble model
├── features/
│   ├── __init__.py
│   ├── contract_features.py   # Contract market features
│   ├── funding_rate_features.py  # Funding rate features
│   └── oi_features.py        # Open interest features
├── training/
│   ├── __init__.py
│   ├── data_preprocessor.py  # Data preparation
│   └── trainer.py           # Model training
└── prediction/
    ├── __init__.py
    ├── predictor.py         # Single model prediction
    └── ensemble_predictor.py # Ensemble prediction

backend/app/api/v1/endpoints/
├── ai_training.py          # Training API endpoints
└── ai_predict.py          # Prediction API endpoints

backend/app/tasks/
├── celery_app.py          # Celery configuration
└── ai_training_tasks.py   # Training background tasks
```

## Testing

Run the integration tests:

```bash
cd backend
PYTHONPATH=$PWD python3 app/tests/test_ai_integration.py
```

Expected output:
- ✓ Feature engineering (67+ features generated)
- ✓ Data preprocessing (train/val/test splits)
- ✓ XGBoost training (MAE, RMSE metrics)
- ✓ Ensemble predictions (weighted averaging)

## Performance Metrics

Models are evaluated using multiple metrics:
- **R² Score**: Coefficient of determination (-∞ to 1, higher is better)
- **MAE**: Mean Absolute Error (lower is better)
- **MSE**: Mean Squared Error (lower is better)
- **RMSE**: Root Mean Squared Error (lower is better)
- **Directional Accuracy**: Percentage of correct trend predictions (0 to 1)

## Next Steps

Phase 3 can include:
- Additional models (Random Forest, ARIMA, Linear Regression)
- Pattern detection service
- WebSocket real-time predictions
- Advanced backtesting
- UI improvements for AI Training Center

## Dependencies

Phase 2 requires these additional Python packages (already in requirements.txt):
- `tensorflow==2.15.0` - For LSTM models
- `xgboost==2.0.3` - For XGBoost models
- `scikit-learn==1.4.0` - For preprocessing and metrics
- `numpy==1.26.3` - Numerical computations
- `pandas==2.1.4` - Data manipulation
- `celery==5.3.6` - Background tasks

## Security

✅ All Phase 2 code passed CodeQL security scanning with 0 vulnerabilities.

## Notes

- LSTM models require TensorFlow, which has larger memory requirements
- XGBoost is recommended for production use due to faster training and lower resource requirements
- Ensemble models automatically handle different prediction lengths from various models
- All models use time-based splits to prevent data leakage
- Background tasks prevent API blocking during long training sessions
