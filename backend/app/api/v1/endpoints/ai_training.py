from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel
import logging
import os

from app.db.session import get_db
from app.models.ai_model import AIModel
from app.models.contract_market import ContractMarket
from app.ai.training.trainer import ModelTrainer
import pandas as pd

logger = logging.getLogger(__name__)

router = APIRouter()


class TrainModelRequest(BaseModel):
    symbol: str
    model_type: str  # lstm, xgboost
    config: Optional[Dict[str, Any]] = None
    min_data_points: int = 100


class TrainModelResponse(BaseModel):
    status: str
    model_id: str
    message: str


@router.post("/train", response_model=TrainModelResponse)
async def train_model(
    request: TrainModelRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Train a new AI model
    
    Args:
        request: Training request parameters
    """
    try:
        # Validate model type
        valid_types = ['lstm', 'xgboost']
        if request.model_type not in valid_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid model type. Must be one of: {', '.join(valid_types)}"
            )
        
        # Check if we have enough data
        data_count = db.query(ContractMarket).filter(
            ContractMarket.symbol == request.symbol
        ).count()
        
        if data_count < request.min_data_points:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient data. Need at least {request.min_data_points} data points, found {data_count}"
            )
        
        # Create AI model record
        ai_model = AIModel(
            symbol=request.symbol,
            model_type=request.model_type,
            config=request.config or {},
            status='training',
            training_started_at=datetime.utcnow()
        )
        db.add(ai_model)
        db.commit()
        db.refresh(ai_model)
        
        # Schedule training in background
        background_tasks.add_task(
            train_model_task,
            model_id=ai_model.id,
            symbol=request.symbol,
            model_type=request.model_type,
            config=request.config
        )
        
        return TrainModelResponse(
            status='started',
            model_id=ai_model.id,
            message=f'Training started for {request.model_type} model on {request.symbol}'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting training: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def train_model_task(model_id: str, symbol: str, model_type: str, config: Dict[str, Any] = None):
    """Background task to train model"""
    from app.db.session import SessionLocal
    
    db = SessionLocal()
    
    try:
        # Fetch contract data
        contract_data = db.query(ContractMarket).filter(
            ContractMarket.symbol == symbol
        ).order_by(ContractMarket.created_at).all()
        
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
        } for record in contract_data])
        
        # Train model
        trainer = ModelTrainer(symbol)
        result = trainer.train_model(df, model_type, config)
        
        # Save model
        model_dir = os.getenv('AI_MODELS_PATH', 'ai_models')
        os.makedirs(model_dir, exist_ok=True)
        file_path = trainer.save_model(result['model'], model_dir)
        
        # Update database record
        ai_model = db.query(AIModel).filter(AIModel.id == model_id).first()
        if ai_model:
            ai_model.status = 'trained'
            ai_model.metrics = result['metrics']
            ai_model.file_path = file_path
            ai_model.training_completed_at = datetime.utcnow()
            db.commit()
            
        logger.info(f"Model {model_id} training completed successfully")
        
    except Exception as e:
        logger.error(f"Error training model {model_id}: {e}")
        
        # Update status to failed
        ai_model = db.query(AIModel).filter(AIModel.id == model_id).first()
        if ai_model:
            ai_model.status = 'failed'
            ai_model.training_completed_at = datetime.utcnow()
            db.commit()
    
    finally:
        db.close()


@router.get("/models/{symbol}")
async def get_models_for_symbol(
    symbol: str,
    db: Session = Depends(get_db)
):
    """Get all trained models for a symbol"""
    try:
        models = db.query(AIModel).filter(
            AIModel.symbol == symbol
        ).order_by(AIModel.created_at.desc()).all()
        
        return {
            'symbol': symbol,
            'models': [{
                'id': model.id,
                'model_type': model.model_type,
                'version': model.version,
                'status': model.status,
                'metrics': model.metrics,
                'training_started_at': model.training_started_at,
                'training_completed_at': model.training_completed_at,
                'created_at': model.created_at
            } for model in models]
        }
    except Exception as e:
        logger.error(f"Error fetching models: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/model/{model_id}")
async def get_model_details(
    model_id: str,
    db: Session = Depends(get_db)
):
    """Get details of a specific model"""
    try:
        model = db.query(AIModel).filter(AIModel.id == model_id).first()
        
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")
        
        return {
            'id': model.id,
            'symbol': model.symbol,
            'model_type': model.model_type,
            'version': model.version,
            'status': model.status,
            'metrics': model.metrics,
            'config': model.config,
            'file_path': model.file_path,
            'training_started_at': model.training_started_at,
            'training_completed_at': model.training_completed_at,
            'created_at': model.created_at
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching model details: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/model/{model_id}")
async def delete_model(
    model_id: str,
    db: Session = Depends(get_db)
):
    """Delete a model"""
    try:
        model = db.query(AIModel).filter(AIModel.id == model_id).first()
        
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")
        
        # Delete model file if exists
        if model.file_path and os.path.exists(model.file_path):
            os.remove(model.file_path)
        
        # Delete database record
        db.delete(model)
        db.commit()
        
        return {'status': 'success', 'message': f'Model {model_id} deleted'}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting model: {e}")
        raise HTTPException(status_code=500, detail=str(e))
