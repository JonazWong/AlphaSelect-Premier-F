from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel
import logging
import pandas as pd
import numpy as np
import os

from app.db.session import get_db
from app.models.ai_model import AIModel
from app.models.contract_market import ContractMarket
from app.models.prediction import Prediction
from app.ai.training.trainer import ModelTrainer
from app.ai.prediction.predictor import Predictor
from app.ai.prediction.ensemble_predictor import EnsemblePredictor
from app.ai.models.ensemble_model import EnsembleModel

logger = logging.getLogger(__name__)

router = APIRouter()


class PredictionRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    symbol: str
    model_id: Optional[str] = None  # If None, use ensemble
    horizon: int = 1
    use_ensemble: bool = True


class PredictionResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    symbol: str
    predicted_value: float
    confidence_score: float
    prediction_horizon: int
    prediction_time: datetime
    target_time: datetime
    model_type: str
    current_price: Optional[float] = None


@router.post("/predict", response_model=PredictionResponse)
async def make_prediction(
    request: PredictionRequest,
    db: Session = Depends(get_db)
):
    """
    Make a price prediction
    
    Args:
        request: Prediction request parameters
    """
    try:
        # Get recent contract data
        recent_data = db.query(ContractMarket).filter(
            ContractMarket.symbol == request.symbol
        ).order_by(ContractMarket.created_at.desc()).limit(200).all()
        
        if not recent_data:
            raise HTTPException(
                status_code=404,
                detail=f"No data found for symbol {request.symbol}"
            )
        
        # Reverse to chronological order
        recent_data = list(reversed(recent_data))
        
        # Convert to DataFrame
        df = pd.DataFrame([{
            'created_at': record.created_at,
            'last_price': record.last_price,
            'fair_price': record.fair_price,
            'index_price': record.index_price,
            'funding_rate': record.funding_rate,
            'open_interest': record.open_interest,
            'volume_24h': record.volume_24h,
            'price_change_24h': record.price_change_24h,
            'high_24h': record.high_24h,
            'low_24h': record.low_24h,
            'basis': record.basis,
            'basis_rate': record.basis_rate
        } for record in recent_data])
        
        # Make prediction
        if request.use_ensemble and not request.model_id:
            # Use ensemble prediction
            prediction_result = await predict_with_ensemble(
                db, request.symbol, df, request.horizon
            )
        else:
            # Use single model prediction
            if not request.model_id:
                # Get latest trained model
                model_record = db.query(AIModel).filter(
                    AIModel.symbol == request.symbol,
                    AIModel.status == 'trained'
                ).order_by(AIModel.created_at.desc()).first()
                
                if not model_record:
                    raise HTTPException(
                        status_code=404,
                        detail=f"No trained model found for {request.symbol}"
                    )
            else:
                model_record = db.query(AIModel).filter(
                    AIModel.id == request.model_id
                ).first()
                
                if not model_record:
                    raise HTTPException(status_code=404, detail="Model not found")
            
            prediction_result = await predict_with_model(
                model_record, df, request.horizon
            )
        
        # Store prediction in database
        prediction = Prediction(
            symbol=request.symbol,
            model_id=prediction_result.get('model_id', ''),
            model_type=prediction_result['model_type'],
            predicted_value=prediction_result['predicted_value'],
            confidence_score=prediction_result['confidence_score'],
            prediction_horizon=request.horizon,
            prediction_time=prediction_result['prediction_time'],
            target_time=prediction_result['target_time'],
            extra_data=prediction_result.get('metadata', {})
        )
        db.add(prediction)
        db.commit()
        
        return PredictionResponse(**prediction_result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error making prediction: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def predict_with_model(model_record: AIModel, df: pd.DataFrame, horizon: int) -> Dict[str, Any]:
    """Make prediction using a single model"""
    
    if model_record.status != 'trained':
        raise HTTPException(
            status_code=400,
            detail=f"Model is not trained (status: {model_record.status})"
        )
    
    if not model_record.file_path or not os.path.exists(model_record.file_path):
        raise HTTPException(
            status_code=404,
            detail="Model file not found"
        )
    
    # Load model
    trainer = ModelTrainer(model_record.symbol)
    model = trainer.load_model(model_record.model_type, model_record.file_path)
    
    # Make prediction
    predictor = Predictor(model)
    result = predictor.predict_next(df, horizon)
    
    # Add model_id to result
    result['model_id'] = model_record.id
    
    return result


async def predict_with_ensemble(db: Session, symbol: str, df: pd.DataFrame, horizon: int) -> Dict[str, Any]:
    """Make prediction using ensemble of models"""
    
    # Get all trained models for symbol
    model_records = db.query(AIModel).filter(
        AIModel.symbol == symbol,
        AIModel.status == 'trained'
    ).all()
    
    if not model_records:
        raise HTTPException(
            status_code=404,
            detail=f"No trained models found for {symbol}"
        )
    
    # Load all models
    models = []
    trainer = ModelTrainer(symbol)
    
    for model_record in model_records:
        if model_record.file_path and os.path.exists(model_record.file_path):
            try:
                model = trainer.load_model(model_record.model_type, model_record.file_path)
                models.append(model)
            except Exception as e:
                logger.warning(f"Failed to load model {model_record.id}: {e}")
    
    if not models:
        raise HTTPException(
            status_code=404,
            detail="No valid models available for ensemble"
        )
    
    # Create ensemble
    ensemble = EnsembleModel(symbol, models)
    
    # Prepare validation data for weight calculation (use last 20% of data)
    split_idx = int(len(df) * 0.8)
    from app.ai.training.data_preprocessor import DataPreprocessor
    preprocessor = DataPreprocessor()
    
    df_prep = preprocessor.prepare_data(df)
    feature_cols = [col for col in df_prep.columns if col != 'target']
    
    X_val = df_prep[feature_cols].iloc[split_idx:].values
    y_val = df_prep['target'].iloc[split_idx:].values
    
    # Calculate weights
    ensemble.calculate_weights(X_val, y_val)
    
    # Make prediction
    predictor = EnsemblePredictor(ensemble)
    result = predictor.predict_with_breakdown(df, horizon)
    
    return result


@router.get("/predictions/{symbol}")
async def get_predictions(
    symbol: str,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get prediction history for a symbol"""
    try:
        predictions = db.query(Prediction).filter(
            Prediction.symbol == symbol
        ).order_by(Prediction.prediction_time.desc()).limit(limit).all()
        
        return {
            'symbol': symbol,
            'predictions': [{
                'id': pred.id,
                'model_type': pred.model_type,
                'predicted_value': pred.predicted_value,
                'confidence_score': pred.confidence_score,
                'prediction_horizon': pred.prediction_horizon,
                'prediction_time': pred.prediction_time,
                'target_time': pred.target_time,
                'actual_value': pred.actual_value,
                'metadata': pred.extra_data
            } for pred in predictions]
        }
    except Exception as e:
        logger.error(f"Error fetching predictions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/prediction/{prediction_id}")
async def get_prediction_details(
    prediction_id: str,
    db: Session = Depends(get_db)
):
    """Get details of a specific prediction"""
    try:
        prediction = db.query(Prediction).filter(
            Prediction.id == prediction_id
        ).first()
        
        if not prediction:
            raise HTTPException(status_code=404, detail="Prediction not found")
        
        return {
            'id': prediction.id,
            'symbol': prediction.symbol,
            'model_id': prediction.model_id,
            'model_type': prediction.model_type,
            'predicted_value': prediction.predicted_value,
            'confidence_score': prediction.confidence_score,
            'prediction_horizon': prediction.prediction_horizon,
            'prediction_time': prediction.prediction_time,
            'target_time': prediction.target_time,
            'actual_value': prediction.actual_value,
            'metadata': prediction.extra_data
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching prediction: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class BatchPredictionRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    symbols: List[str]


def _compute_rsi(prices: np.ndarray, period: int = 14) -> float:
    """Compute RSI for the last data point."""
    if len(prices) < period + 1:
        return 50.0
    deltas = np.diff(prices)
    gains = np.where(deltas > 0, deltas, 0.0)
    losses = np.where(deltas < 0, -deltas, 0.0)
    avg_gain = float(np.mean(gains[-period:]))
    avg_loss = float(np.mean(losses[-period:]))
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100.0 - (100.0 / (1.0 + rs))


def _rating_from_indicators(rsi: float, trend_slope: float, funding_rate: float) -> str:
    """Map technical indicators to a prediction rating.

    Scoring:
      RSI < 30 (oversold) → +2; RSI 30-45 (below neutral) → +1
      RSI 55-70 (above neutral) → -1; RSI > 70 (overbought) → -2
      Positive price trend → +1; Negative → -1
      Funding rate < -0.1% (negative/bearish funding = longs rewarded) → +1
      Funding rate > +0.1% (positive/bullish funding = shorts rewarded) → -1
      Total ≥ 3 → strongBuy, ≥ 1 → buy, ≤ -3 → strongSell, ≤ -1 → sell, else hold
    """
    score = 0
    # RSI signal
    if rsi < 30:
        score += 2
    elif rsi < 45:
        score += 1
    elif rsi > 70:
        score -= 2
    elif rsi > 55:
        score -= 1

    # Trend signal
    if trend_slope > 0:
        score += 1
    else:
        score -= 1

    # Funding rate signal: extreme positive funding = bearish; extreme negative = bullish
    if funding_rate < -0.001:
        score += 1
    elif funding_rate > 0.001:
        score -= 1

    if score >= 3:
        return "strongBuy"
    elif score >= 1:
        return "buy"
    elif score <= -3:
        return "strongSell"
    elif score <= -1:
        return "sell"
    return "hold"


@router.post("/predictions")
async def batch_predictions(
    request: BatchPredictionRequest,
    db: Session = Depends(get_db),
):
    """Batch prediction for multiple symbols using real market data."""
    results = []

    for symbol in request.symbols:
        # Normalise symbol to DB format (BTCUSDT → BTC_USDT)
        db_symbol = symbol
        if "_" not in symbol and len(symbol) > 4 and symbol.endswith("USDT"):
            db_symbol = symbol[:-4] + "_USDT"

        try:
            records = (
                db.query(ContractMarket)
                .filter(ContractMarket.symbol == db_symbol)
                .order_by(ContractMarket.created_at.desc())
                .limit(50)
                .all()
            )

            if not records:
                continue

            records = list(reversed(records))
            prices = np.array(
                [float(r.last_price) for r in records if r.last_price is not None],
                dtype=float,
            )

            if len(prices) == 0:
                continue

            latest = records[-1]
            current_price = float(latest.last_price)
            funding_rate = float(latest.funding_rate or 0.0)
            change24h = float(latest.price_change_24h or 0.0)

            rsi = _compute_rsi(prices)

            # Simple linear trend slope
            if len(prices) >= 3:
                trend_slope = float(
                    np.polyfit(np.arange(len(prices)), prices, 1)[0]
                )
            else:
                trend_slope = change24h

            rating = _rating_from_indicators(rsi, trend_slope, funding_rate)

            # Confidence: distance from neutral (RSI 50) scaled to [50, 90]
            confidence = int(min(90, 50 + abs(rsi - 50) * 0.8))

            # Price target: simple projection based on trend direction
            target_pct = 0.03 if rating in ("strongBuy", "buy") else -0.03
            price_target = round(current_price * (1 + target_pct), 6)
            upside_pct = round((price_target / current_price - 1) * 100, 2)

            results.append(
                {
                    "symbol": symbol,
                    "rating": rating,
                    "confidence": confidence,
                    "currentPrice": current_price,
                    "priceTarget": price_target,
                    "upsidePct": upside_pct,
                    "forecastPeriod": "24h",
                    "timeframe": "1D",
                }
            )

        except Exception as e:
            logger.warning(f"Batch prediction failed for {symbol}: {e}")

    return results

