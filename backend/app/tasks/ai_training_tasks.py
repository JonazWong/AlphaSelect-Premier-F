from app.tasks.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.ai_model import AIModel
from app.models.contract_market import ContractMarket
from app.services.ai_training_service import AITrainingService
from app.ai.models import (
    LSTMModel, XGBoostModel, RandomForestModel,
    ARIMAModel, LinearRegressionModel, EnsembleModel
)
from typing import Dict, Any
import pandas as pd
import os
import logging
import asyncio

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name='train_single_model')
def train_single_model_task(self, session_id: str, model_id: str, symbol: str, model_type: str, config: Dict[str, Any] = None):
    """
    Celery task to train a single AI model with WebSocket progress updates
    
    Args:
        session_id: Training session ID for WebSocket updates
        model_id: Database ID of the AIModel record
        symbol: Trading symbol
        model_type: Type of model (lstm, xgboost, random_forest, arima, linear_regression)
        config: Model configuration
    """
    db = SessionLocal()
    
    async def send_progress(status: str, progress: float = 0, **kwargs):
        """Send progress update via WebSocket"""
        from app.websocket import broadcast_training_progress
        await broadcast_training_progress(session_id, {
            'status': status,
            'progress': progress,
            'model_id': model_id,
            'model_type': model_type,
            **kwargs
        })
    
    def sync_send_progress(status: str, progress: float = 0, **kwargs):
        """Synchronous wrapper for progress updates"""
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(send_progress(status, progress, **kwargs))
            loop.close()
        except Exception as e:
            logger.warning(f"Failed to send progress update: {e}")
    
    try:
        # Update task progress
        self.update_state(state='PROGRESS', meta={'status': 'Loading data...', 'progress': 10})
        sync_send_progress('Loading data...', 10)
        
        # Fetch contract data
        contract_data = db.query(ContractMarket).filter(
            ContractMarket.symbol == symbol
        ).order_by(ContractMarket.created_at).all()
        
        logger.info(f"Loaded {len(contract_data)} data points for {symbol}")
        
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
        
        # Update progress
        self.update_state(state='PROGRESS', meta={'status': 'Training model...', 'progress': 30})
        sync_send_progress('Training model...', 30)
        
        # Train model using service
        training_service = AITrainingService()
        result = training_service.train_model(symbol, model_type, df, config)
        
        logger.info(f"Model training completed with metrics: {result['train_metrics']}")
        
        # Update progress
        self.update_state(state='PROGRESS', meta={'status': 'Saving model...', 'progress': 80})
        sync_send_progress('Saving model...', 80)
        
        # Save model
        model_dir = os.getenv('AI_MODEL_DIR', '/app/ai_models')
        file_path = training_service.save_model(
            result['model'],
            model_dir,
            symbol,
            model_type
        )
        
        # Update database record
        ai_model = db.query(AIModel).filter(AIModel.id == model_id).first()
        if ai_model:
            from datetime import datetime
            ai_model.status = 'trained'
            ai_model.metrics = result['test_metrics']
            ai_model.file_path = file_path
            ai_model.training_completed_at = datetime.utcnow()
            db.commit()
            
        logger.info(f"Model {model_id} saved to {file_path}")
        
        # Send completion
        self.update_state(state='SUCCESS', meta={'status': 'Training completed', 'progress': 100})
        sync_send_progress('Training completed', 100, metrics=result['test_metrics'])
        
        # Broadcast completion
        try:
            from app.websocket import broadcast_training_complete
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(broadcast_training_complete(session_id, {
                'model_id': model_id,
                'model_type': model_type,
                'metrics': result['test_metrics'],
                'file_path': file_path
            }))
            loop.close()
        except Exception as e:
            logger.warning(f"Failed to broadcast completion: {e}")
        
        return {
            'status': 'success',
            'model_id': model_id,
            'metrics': result['test_metrics'],
            'file_path': file_path
        }
        
    except Exception as e:
        logger.error(f"Error training model {model_id}: {e}", exc_info=True)
        
        # Update status to failed
        try:
            ai_model = db.query(AIModel).filter(AIModel.id == model_id).first()
            if ai_model:
                from datetime import datetime
                ai_model.status = 'failed'
                ai_model.training_completed_at = datetime.utcnow()
                db.commit()
        except Exception as db_error:
            logger.error(f"Error updating failed status: {db_error}")
        
        # Broadcast failure
        try:
            from app.websocket import broadcast_training_failed
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(broadcast_training_failed(session_id, str(e)))
            loop.close()
        except Exception as ws_error:
            logger.warning(f"Failed to broadcast failure: {ws_error}")
        
        raise
    
    finally:
        db.close()
@celery_app.task(bind=True, name='train_ensemble_models')
def train_ensemble_models_task(self, session_id: str, symbol: str, model_configs: Dict[str, Dict[str, Any]] = None, model_id: str = None):
    """
    Celery task to train multiple models for ensemble
    
    Args:
        session_id: Training session ID for WebSocket updates
        symbol: Trading symbol
        model_configs: Dict mapping model_type to config
        model_id: Pre-created AIModel record ID to update (optional)
    """
    db = SessionLocal()
    results = {}
    
    def sync_send_progress(status: str, progress: float = 0, **kwargs):
        """Synchronous wrapper for progress updates"""
        try:
            from app.websocket import broadcast_training_progress
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(broadcast_training_progress(session_id, {
                'status': status,
                'progress': progress,
                **kwargs
            }))
            loop.close()
        except Exception as e:
            logger.warning(f"Failed to send progress update: {e}")
    
    try:
        self.update_state(state='PROGRESS', meta={'status': 'Training ensemble models...'})
        sync_send_progress('Loading data...', 5)
        
        # Fetch contract data once
        contract_data = db.query(ContractMarket).filter(
            ContractMarket.symbol == symbol
        ).order_by(ContractMarket.created_at).all()
        
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
        
        # Use AITrainingService for ensemble training
        training_service = AITrainingService()
        
        # Set default configs if not provided
        if model_configs is None:
            model_configs = {
                'lstm': {'sequence_length': 60, 'epochs': 50},
                'xgboost': {'n_estimators': 100},
                'random_forest': {'n_estimators': 100},
                'arima': {},
                'linear_regression': {}
            }
        
        sync_send_progress('Training ensemble models...', 10)
        
        # Train ensemble
        ensemble_result = training_service.train_ensemble(symbol, df, model_configs)
        
        # Save ensemble model
        model_dir = os.getenv('AI_MODEL_DIR', '/app/ai_models')
        ensemble_path = training_service.save_model(
            ensemble_result['ensemble'],
            model_dir,
            symbol,
            'ensemble'
        )
        
        sync_send_progress('Saving models...', 90)
        
        # Create database records for individual models
        for model_type, result in ensemble_result['individual_results'].items():
            if result['status'] == 'success':
                from datetime import datetime
                ai_model_record = AIModel(
                    symbol=symbol,
                    model_type=model_type,
                    config=model_configs.get(model_type, {}),
                    status='trained',
                    metrics=result['test_metrics'],
                    training_started_at=datetime.utcnow(),
                    training_completed_at=datetime.utcnow()
                )
                db.add(ai_model_record)
        
        # Update pre-created ensemble AIModel record (or create new one if not provided)
        from datetime import datetime
        if model_id:
            ensemble_model = db.query(AIModel).filter(AIModel.id == model_id).first()
            if ensemble_model:
                ensemble_model.status = 'trained'
                ensemble_model.metrics = ensemble_result['ensemble_metrics']
                ensemble_model.config = {'weights': ensemble_result['weights']}
                ensemble_model.file_path = ensemble_path
                ensemble_model.training_completed_at = datetime.utcnow()
            else:
                # Fallback: create new record
                db.add(AIModel(
                    symbol=symbol, model_type='ensemble',
                    config={'weights': ensemble_result['weights']},
                    status='trained', metrics=ensemble_result['ensemble_metrics'],
                    file_path=ensemble_path,
                    training_started_at=datetime.utcnow(),
                    training_completed_at=datetime.utcnow()
                ))
        else:
            db.add(AIModel(
                symbol=symbol, model_type='ensemble',
                config={'weights': ensemble_result['weights']},
                status='trained', metrics=ensemble_result['ensemble_metrics'],
                file_path=ensemble_path,
                training_started_at=datetime.utcnow(),
                training_completed_at=datetime.utcnow()
            ))
        db.commit()
        
        logger.info(f"Ensemble training completed for {symbol}")
        
        sync_send_progress('Training completed', 100)
        
        # Broadcast completion
        try:
            from app.websocket import broadcast_training_complete
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(broadcast_training_complete(session_id, {
                'ensemble_metrics': ensemble_result['ensemble_metrics'],
                'weights': ensemble_result['weights'],
                'individual_results': ensemble_result['individual_results']
            }))
            loop.close()
        except Exception as e:
            logger.warning(f"Failed to broadcast completion: {e}")
        
        return {
            'status': 'completed',
            'symbol': symbol,
            'ensemble_metrics': ensemble_result['ensemble_metrics'],
            'weights': ensemble_result['weights'],
            'results': ensemble_result['individual_results']
        }
        
    except Exception as e:
        logger.error(f"Error in ensemble training: {e}", exc_info=True)
        
        # Broadcast failure
        try:
            from app.websocket import broadcast_training_failed
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(broadcast_training_failed(session_id, str(e)))
            loop.close()
        except Exception as ws_error:
            logger.warning(f"Failed to broadcast failure: {ws_error}")
        
        raise
    
    finally:
        db.close()


@celery_app.task(name='cleanup_old_models')
def cleanup_old_models_task(days: int = 30):
    """
    Clean up old model files and records
    
    Args:
        days: Remove models older than this many days
    """
    from datetime import datetime, timedelta
    db = SessionLocal()
    
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        old_models = db.query(AIModel).filter(
            AIModel.created_at < cutoff_date
        ).all()
        
        removed_count = 0
        for model in old_models:
            # Delete file if exists
            if model.file_path and os.path.exists(model.file_path):
                try:
                    os.remove(model.file_path)
                except Exception as e:
                    logger.warning(f"Failed to delete file {model.file_path}: {e}")
            
            # Delete record
            db.delete(model)
            removed_count += 1
        
        db.commit()
        
        logger.info(f"Cleaned up {removed_count} old models")
        return {'removed_count': removed_count}
        
    except Exception as e:
        logger.error(f"Error cleaning up models: {e}")
        raise
    
    finally:
        db.close()
