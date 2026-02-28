from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel
import logging
import os

from app.db.session import get_db
from app.models.ai_model import AIModel
from app.models.contract_market import ContractMarket

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/data-status")
async def get_data_status(
    symbol: str = Query("BTC_USDT"),
    min_required: int = Query(100),
    db: Session = Depends(get_db)
):
    """Return current data count for a symbol and whether it meets the training threshold"""
    count = db.query(ContractMarket).filter(ContractMarket.symbol == symbol).count()
    return {
        "symbol": symbol,
        "count": count,
        "min_required": min_required,
        "ready": count >= min_required,
        "missing": max(0, min_required - count),
    }


class TrainModelRequest(BaseModel):
    symbol: str
    model_type: str  # lstm, xgboost
    config: Optional[Dict[str, Any]] = None
    min_data_points: int = 100


class TrainModelResponse(BaseModel):
    status: str
    model_id: str
    message: str
    session_id: Optional[str] = None


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
        import uuid
        from app.tasks.ai_training_tasks import train_single_model_task
        
        # Validate model type
        valid_types = ['lstm', 'xgboost', 'random_forest', 'arima', 'linear_regression', 'ensemble']
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
        
        # Generate session ID for WebSocket updates
        session_id = str(uuid.uuid4())
        
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
        
        # Schedule training as Celery task
        if request.model_type == 'ensemble':
            from app.tasks.ai_training_tasks import train_ensemble_models_task
            train_ensemble_models_task.delay(
                session_id=session_id,
                symbol=request.symbol,
                model_configs=request.config,
                model_id=ai_model.id
            )
        else:
            train_single_model_task.delay(
                session_id=session_id,
                model_id=ai_model.id,
                symbol=request.symbol,
                model_type=request.model_type,
                config=request.config
            )
        
        return TrainModelResponse(
            status='started',
            model_id=ai_model.id,
            message=f'Training started for {request.model_type} model on {request.symbol}',
            session_id=session_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting training: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models")
async def get_all_models(
    symbol: Optional[str] = Query(None, description="Filter by symbol"),
    status: Optional[str] = Query(None, description="Filter by status: training, trained, failed"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Get all AI models with optional filters — used by the monitor dashboard"""
    try:
        q = db.query(AIModel)
        if symbol:
            q = q.filter(AIModel.symbol == symbol)
        if status:
            q = q.filter(AIModel.status == status)
        models = q.order_by(AIModel.created_at.desc()).limit(limit).all()

        total = db.query(AIModel).count()
        trained = db.query(AIModel).filter(AIModel.status == 'trained').count()
        training = db.query(AIModel).filter(AIModel.status == 'training').count()
        failed = db.query(AIModel).filter(AIModel.status == 'failed').count()

        return {
            'summary': {
                'total': total,
                'trained': trained,
                'training': training,
                'failed': failed,
            },
            'models': [{
                'id': m.id,
                'symbol': m.symbol,
                'model_type': m.model_type,
                'version': m.version,
                'status': m.status,
                'metrics': m.metrics,
                'config': m.config,
                'file_path': m.file_path,
                'training_started_at': m.training_started_at,
                'training_completed_at': m.training_completed_at,
                'created_at': m.created_at,
                'updated_at': m.updated_at,
            } for m in models]
        }
    except Exception as e:
        logger.error(f"Error fetching all models: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
