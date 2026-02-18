# AI Training Guide

## Overview

This guide covers training AI models for cryptocurrency price prediction in AlphaSelect Premier F.

## Available Models

### 1. LSTM (Long Short-Term Memory)
- **Type**: Deep Learning
- **Best For**: Long-term trend prediction
- **Training Time**: 30-60 minutes
- **Accuracy**: High for trending markets
- **Framework**: TensorFlow 2.x

**Pros:**
- Captures long-term dependencies
- Excellent for sequential data
- Handles non-linear patterns well

**Cons:**
- Requires more training data
- Longer training time
- Higher computational requirements

### 2. XGBoost
- **Type**: Gradient Boosting
- **Best For**: Short-term price prediction
- **Training Time**: 5-15 minutes
- **Accuracy**: Very high
- **Framework**: XGBoost

**Pros:**
- Fast training
- High accuracy
- Feature importance insights
- Handles missing data

**Cons:**
- Can overfit with small datasets
- Less effective for very long sequences

### 3. Random Forest
- **Type**: Ensemble Learning
- **Best For**: Mid-term predictions
- **Training Time**: 5-10 minutes
- **Accuracy**: Good
- **Framework**: scikit-learn

**Pros:**
- Robust to outliers
- No feature scaling needed
- Provides feature importance

**Cons:**
- Can be memory intensive
- Less accurate than XGBoost

### 4. ARIMA
- **Type**: Statistical Time Series
- **Best For**: Stationary time series
- **Training Time**: 2-5 minutes
- **Accuracy**: Moderate
- **Framework**: statsmodels

**Pros:**
- Good for stationary data
- Fast training
- Interpretable

**Cons:**
- Requires stationary data
- Poor for non-linear patterns
- Limited feature engineering

### 5. Linear Regression
- **Type**: Classical ML
- **Best For**: Baseline comparison
- **Training Time**: < 1 minute
- **Accuracy**: Low-Moderate
- **Framework**: scikit-learn

**Pros:**
- Very fast
- Simple and interpretable
- Good baseline

**Cons:**
- Assumes linearity
- Poor for complex patterns

### 6. Ensemble Model
- **Type**: Meta-Model
- **Best For**: Best overall accuracy
- **Training Time**: N/A (uses pre-trained models)
- **Accuracy**: Highest
- **Method**: Weighted averaging

**Pros:**
- Combines strengths of all models
- Highest accuracy
- Adaptive weighting

**Cons:**
- Requires all models trained
- Slower predictions

## Training Prerequisites

### Data Requirements

**Minimum Data Points:**
- LSTM: 1000+ candles
- XGBoost: 500+ candles
- Random Forest: 500+ candles
- ARIMA: 200+ candles
- Linear Regression: 100+ candles

**Recommended Timeframes:**
- Min60 (1 hour): 2-3 months of data
- Hour4 (4 hours): 6-12 months of data
- Day1 (1 day): 1-2 years of data

### System Requirements

**For Training:**
- CPU: 4+ cores recommended
- RAM: 8GB+ recommended
- Storage: 5GB+ for models
- GPU: Optional but speeds up LSTM training

## Training Process

### Step 1: Data Collection

The system automatically collects data from MEXC:

```python
# Backend automatically fetches:
# - Historical K-line data
# - Funding rate history
# - Open interest history
# - Index price data
```

### Step 2: Feature Engineering

Features automatically extracted:

**Price Features:**
- OHLCV (Open, High, Low, Close, Volume)
- Returns and log returns
- High-Low range
- Body ratio (Close-Open / High-Low)

**Funding Rate Features:**
- Current funding rate
- 7-day moving average
- 7-day standard deviation
- Rate of change

**Open Interest Features:**
- Current OI
- OI change rate
- OI/Volume ratio
- OI trend vs 7-day MA

**Technical Indicators:**
- RSI (14)
- MACD (12, 26, 9)
- Bollinger Bands (20, 2)
- EMA (9, 21, 50)
- SMA (20, 50, 200)

**Contract-Specific:**
- Basis (Contract - Index)
- Basis rate
- Leverage risk indicator

### Step 3: Model Training

#### Using the UI (Recommended)

1. **Navigate to AI Training Center**
   - Go to http://localhost:3000/ai-training
   - Select trading pair (e.g., BTC_USDT)

2. **Choose Model Type**
   - Click on model card (LSTM, XGBoost, etc.)
   - Configure parameters

3. **Set Parameters**
   - **Epochs**: 50-200 (LSTM only)
   - **Batch Size**: 32-128 (LSTM only)
   - **Train/Test Split**: 80/20 recommended
   - **Timeframe**: Min60, Hour4, or Day1

4. **Start Training**
   - Click "Start Training"
   - Monitor progress in real-time
   - View loss curves

5. **Review Results**
   - Check metrics (R², MAE, MSE, RMSE)
   - Review directional accuracy
   - Compare with other models

#### Using the API

```bash
# Start training via API
curl -X POST "http://localhost:8000/api/v1/ai/training/start" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTC_USDT",
    "model_type": "lstm",
    "timeframe": "Min60",
    "config": {
      "epochs": 100,
      "batch_size": 32,
      "sequence_length": 60
    }
  }'

# Check training status
curl "http://localhost:8000/api/v1/ai/training/status/{session_id}"

# Get training history
curl "http://localhost:8000/api/v1/ai/training/history/BTC_USDT"
```

### Step 4: Model Evaluation

After training, models are evaluated on test data:

**Metrics:**
- **R² Score**: Goodness of fit (closer to 1 is better)
- **MAE**: Mean Absolute Error (lower is better)
- **MSE**: Mean Squared Error (lower is better)
- **RMSE**: Root Mean Squared Error (lower is better)
- **Directional Accuracy**: % of correct direction predictions

**Good Benchmarks:**
- R² Score: > 0.7
- Directional Accuracy: > 55%
- RMSE: < 5% of price range

## Model Configuration

### LSTM Configuration

```python
{
    "sequence_length": 60,      # Number of previous candles to use
    "hidden_layers": [128, 64, 32],  # LSTM layer sizes
    "dropout_rate": 0.2,        # Dropout for regularization
    "learning_rate": 0.001,     # Adam optimizer learning rate
    "epochs": 100,              # Training iterations
    "batch_size": 32,           # Samples per batch
    "validation_split": 0.2     # 20% for validation
}
```

**Tuning Tips:**
- Increase `sequence_length` for longer-term patterns
- Add more `hidden_layers` for complex patterns
- Increase `dropout_rate` if overfitting
- Reduce `learning_rate` if training is unstable
- Increase `epochs` if not converged

### XGBoost Configuration

```python
{
    "n_estimators": 100,        # Number of trees
    "max_depth": 7,             # Maximum tree depth
    "learning_rate": 0.1,       # Boosting learning rate
    "subsample": 0.8,           # Sample ratio per tree
    "colsample_bytree": 0.8,    # Feature ratio per tree
    "min_child_weight": 1       # Minimum sum of weights
}
```

**Tuning Tips:**
- Increase `n_estimators` for better accuracy
- Reduce `max_depth` if overfitting
- Adjust `learning_rate` for convergence speed
- Use `subsample` and `colsample_bytree` to prevent overfitting

### Random Forest Configuration

```python
{
    "n_estimators": 100,        # Number of trees
    "max_depth": None,          # No limit on depth
    "min_samples_split": 2,     # Min samples to split
    "min_samples_leaf": 1,      # Min samples per leaf
    "max_features": "sqrt"      # Features per split
}
```

### ARIMA Configuration

```python
{
    "p": 5,                     # AR order
    "d": 1,                     # Differencing order
    "q": 0                      # MA order
}
```

**Auto-selection:**
- Use AIC/BIC criteria for best (p, d, q)
- System can auto-select optimal parameters

## Best Practices

### 1. Data Preparation
- Ensure sufficient historical data
- Check for missing values
- Verify data quality
- Use consistent timeframes

### 2. Training Strategy
- Start with simple models (Linear Regression)
- Train XGBoost for baseline
- Train LSTM for deep learning
- Create ensemble for production

### 3. Hyperparameter Tuning
- Use grid search for optimal parameters
- Start with default values
- Tune one parameter at a time
- Use validation set to prevent overfitting

### 4. Model Validation
- Always use train/test split
- Use cross-validation for robust metrics
- Check directional accuracy
- Compare against baseline

### 5. Production Deployment
- Retrain models monthly
- Monitor prediction accuracy
- Use ensemble for final predictions
- Set confidence thresholds

## Training Schedule

**Recommended Retraining Frequency:**
- **High Volatility Markets**: Weekly
- **Normal Markets**: Bi-weekly
- **Stable Markets**: Monthly

**Automated Retraining (Future):**
- Celery task runs daily
- Checks model performance
- Triggers retraining if accuracy drops
- Automatically deploys new models

## Troubleshooting

### Training Fails
**Causes:**
- Insufficient data
- Memory issues
- Bad parameters

**Solutions:**
- Collect more historical data
- Reduce batch size
- Use default parameters

### Poor Accuracy
**Causes:**
- Not enough training data
- Wrong timeframe
- Market regime change

**Solutions:**
- Collect more data
- Try different timeframe
- Retrain more frequently
- Use ensemble model

### Overfitting
**Symptoms:**
- High train accuracy, low test accuracy
- R² > 0.95 on training set

**Solutions:**
- Increase dropout (LSTM)
- Reduce max_depth (XGBoost/RF)
- Add more training data
- Use regularization

### Slow Training
**Causes:**
- Large dataset
- Complex model
- CPU-only training

**Solutions:**
- Reduce data size
- Simplify model
- Use GPU (LSTM)
- Reduce epochs

## Advanced Topics

### Custom Features
- Add your own technical indicators
- Create market regime features
- Include sentiment data
- Use on-chain metrics

### Transfer Learning
- Pre-train on multiple pairs
- Fine-tune for specific pair
- Share knowledge across models

### Online Learning
- Update models with new data
- Incremental training
- Adapt to market changes

## Model Storage

**File Locations:**
```
ai_models/
├── BTC_USDT_lstm_v1_20260218.h5
├── BTC_USDT_xgboost_v1_20260218.pkl
├── BTC_USDT_random_forest_v1_20260218.pkl
├── BTC_USDT_arima_v1_20260218.pkl
└── BTC_USDT_ensemble_v1_20260218.pkl
```

**Database Records:**
- Model metadata in `ai_models` table
- Training history
- Performance metrics
- Configuration used

## Support

For training issues:
1. Check logs in backend
2. Verify data availability
3. Review parameter settings
4. Open GitHub issue

---

**Happy Training!** 🤖📈
