from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel
import logging
import pandas as pd
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
        
        # Convert to DataFrame with proper None handling
        df = pd.DataFrame([{
            'last_price': float(record.last_price) if record.last_price else None,
            'fair_price': float(record.fair_price) if record.fair_price else None,
            'index_price': float(record.index_price) if record.index_price else None,
            'funding_rate': float(record.funding_rate) if record.funding_rate else None,
            'open_interest': float(record.open_interest) if record.open_interest else None,
            'volume_24h': float(record.volume_24h) if record.volume_24h else None,
            'price_change_24h': float(record.price_change_24h) if record.price_change_24h else None,
            'high_24h': float(record.high_24h) if record.high_24h else None,
            'low_24h': float(record.low_24h) if record.low_24h else None,
            'basis': float(record.basis) if record.basis else None,
            'basis_rate': float(record.basis_rate) if record.basis_rate else None
        } for record in recent_data])
        
        # Set created_at as index
        df.index = [record.created_at for record in recent_data]
        
        # Forward fill then backward fill to handle None values
        df = df.fillna(method='ffill').fillna(method='bfill').fillna(0)
        
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
    """Request model for batch predictions"""
    model_config = {"protected_namespaces": ()}
    
    symbols: List[str]
    use_ensemble: bool = False  # Default to single model for reliability
    horizon: int = 1


class BatchPredictionResult(BaseModel):
    """Simplified prediction result for batch response"""
    model_config = {"protected_namespaces": ()}
    
    symbol: str
    rating: str  # strongBuy, buy, hold, sell, strongSell
    confidence: float
    priceTarget: Optional[float] = None
    timeframe: str = "1h"
    predicted_value: Optional[float] = None
    model_type: Optional[str] = None


def _determine_rating(predicted_value: float, current_price: float, confidence: float) -> str:
    """Determine buy/sell rating based on predicted price change and confidence"""
    if current_price == 0:
        return "hold"
    
    price_change_pct = ((predicted_value - current_price) / current_price) * 100
    
    # Adjust thresholds based on confidence
    strong_threshold = 3.0 if confidence > 80 else 5.0
    moderate_threshold = 1.5 if confidence > 70 else 2.5
    
    if price_change_pct >= strong_threshold:
        return "strongBuy"
    elif price_change_pct >= moderate_threshold:
        return "buy"
    elif price_change_pct <= -strong_threshold:
        return "strongSell"
    elif price_change_pct <= -moderate_threshold:
        return "sell"
    else:
        return "hold"


@router.post("/predictions", response_model=List[BatchPredictionResult])
async def make_batch_predictions(
    request: BatchPredictionRequest,
    db: Session = Depends(get_db)
):
    """
    Make predictions for multiple symbols at once
    
    Only returns predictions for symbols with valid trained models.
    Symbols without models are silently skipped.
    
    This endpoint is designed for the AI Predictions page frontend
    """
    results = []
    
    for symbol in request.symbols:
        try:
            # Normalize symbol format
            db_symbol = symbol if "_" in symbol else symbol[:-4] + "_USDT" if symbol.endswith("USDT") else symbol
            
            # Get recent contract data
            recent_data = db.query(ContractMarket).filter(
                ContractMarket.symbol == db_symbol
            ).order_by(ContractMarket.created_at.desc()).limit(200).all()
            
            if not recent_data or len(recent_data) < 20:
                # Not enough data - skip this symbol
                logger.info(f"Skipping {symbol}: insufficient data (only {len(recent_data)} records)")
                continue
            
            # Get current price
            current_price = float(recent_data[0].last_price) if recent_data[0].last_price else 0.0
            
            # Reverse to chronological order
            recent_data = list(reversed(recent_data))
            
            # Convert to DataFrame with proper None handling
            df = pd.DataFrame([{
                'last_price': float(record.last_price) if record.last_price else None,
                'fair_price': float(record.fair_price) if record.fair_price else None,
                'index_price': float(record.index_price) if record.index_price else None,
                'funding_rate': float(record.funding_rate) if record.funding_rate else None,
                'open_interest': float(record.open_interest) if record.open_interest else None,
                'volume_24h': float(record.volume_24h) if record.volume_24h else None,
                'price_change_24h': float(record.price_change_24h) if record.price_change_24h else None,
                'high_24h': float(record.high_24h) if record.high_24h else None,
                'low_24h': float(record.low_24h) if record.low_24h else None,
                'basis': float(record.basis) if record.basis else None,
                'basis_rate': float(record.basis_rate) if record.basis_rate else None
            } for record in recent_data])
            
            # Set created_at as index
            df.index = [record.created_at for record in recent_data]
            
            # Forward fill then backward fill to handle None values
            df = df.fillna(method='ffill').fillna(method='bfill').fillna(0)
            
            # Try to make prediction
            try:
                if request.use_ensemble:
                    prediction_result = await predict_with_ensemble(
                        db, db_symbol, df, request.horizon
                    )
                else:
                    # Get best trained model (lowest RMSE among valid models)
                    model_records = db.query(AIModel).filter(
                        AIModel.symbol == db_symbol,
                        AIModel.status == 'trained',
                        AIModel.model_type.in_(['xgboost', 'random_forest'])  # Prefer these model types
                    ).all()
                    
                    if not model_records:
                        # Fallback to any trained model
                        model_records = db.query(AIModel).filter(
                            AIModel.symbol == db_symbol,
                            AIModel.status == 'trained'
                        ).all()
                    
                    if model_records:
                        # Select model with lowest RMSE and valid file_path
                        valid_models = [m for m in model_records if m.file_path and os.path.exists(m.file_path)]
                        
                        if not valid_models:
                            logger.info(f"Skipping {symbol}: no valid model files found")
                            continue
                        
                        best_model = min(valid_models, 
                                       key=lambda m: m.metrics.get('rmse', float('inf')) 
                                       if m.metrics else float('inf'))
                        model_record = best_model
                    else:
                        logger.info(f"Skipping {symbol}: no trained models found")
                        continue
                    
                    if model_record:
                        prediction_result = await predict_with_model(
                            model_record, df, request.horizon
                        )
                    else:
                        continue
                
                predicted_value = prediction_result['predicted_value']
                confidence = prediction_result['confidence_score'] * 100
                rating = _determine_rating(predicted_value, current_price, confidence)
                
                results.append(BatchPredictionResult(
                    symbol=symbol,
                    rating=rating,
                    confidence=round(confidence, 2),
                    priceTarget=round(predicted_value, 6),
                    timeframe="1h",
                    predicted_value=round(predicted_value, 6),
                    model_type=prediction_result.get('model_type', 'unknown')
                ))
                
            except HTTPException:
                # Skip symbols with HTTP errors (e.g., no models found)
                logger.info(f"Skipping {symbol}: {str(HTTPException)}")
                continue
            except Exception as pred_err:
                # Skip symbols with prediction errors
                logger.info(f"Skipping {symbol}: prediction failed - {pred_err}")
                continue
        
        except Exception as e:
            # Skip symbols with data processing errors
            logger.info(f"Skipping {symbol}: data processing error - {e}")
            continue
    
    return results
