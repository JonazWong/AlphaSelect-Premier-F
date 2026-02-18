from app.tasks.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.ai_model import AIModel
from app.models.contract_market import ContractMarket
from app.ai.training.trainer import ModelTrainer
from app.ai.models.ensemble_model import EnsembleModel
from typing import Dict, Any
import pandas as pd
import os
import logging

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name='train_single_model')
def train_single_model_task(self, model_id: str, symbol: str, model_type: str, config: Dict[str, Any] = None):
    """
    Celery task to train a single AI model
    
    Args:
        model_id: Database ID of the AIModel record
        symbol: Trading symbol
        model_type: Type of model (lstm, xgboost, etc.)
        config: Model configuration
    """
    db = SessionLocal()
    
    try:
        # Update task progress
        self.update_state(state='PROGRESS', meta={'status': 'Loading data...'})
        
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
        self.update_state(state='PROGRESS', meta={'status': 'Training model...'})
        
        # Train model
        trainer = ModelTrainer(symbol)
        result = trainer.train_model(df, model_type, config)
        
        logger.info(f"Model training completed with metrics: {result['metrics']}")
        
        # Update progress
        self.update_state(state='PROGRESS', meta={'status': 'Saving model...'})
        
        # Save model
        model_dir = os.getenv('AI_MODELS_PATH', 'ai_models')
        os.makedirs(model_dir, exist_ok=True)
        file_path = trainer.save_model(result['model'], model_dir)
        
        # Update database record
        ai_model = db.query(AIModel).filter(AIModel.id == model_id).first()
        if ai_model:
            from datetime import datetime
            ai_model.status = 'trained'
            ai_model.metrics = result['metrics']
            ai_model.file_path = file_path
            ai_model.training_completed_at = datetime.utcnow()
            db.commit()
            
        logger.info(f"Model {model_id} saved to {file_path}")
        
        return {
            'status': 'success',
            'model_id': model_id,
            'metrics': result['metrics'],
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
        
        raise
    
    finally:
        db.close()


@celery_app.task(bind=True, name='train_ensemble_models')
def train_ensemble_models_task(self, symbol: str, model_configs: Dict[str, Dict[str, Any]]):
    """
    Celery task to train multiple models for ensemble
    
    Args:
        symbol: Trading symbol
        model_configs: Dict mapping model_type to config
    """
    db = SessionLocal()
    results = {}
    
    try:
        self.update_state(state='PROGRESS', meta={'status': 'Training ensemble models...'})
        
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
        
        # Train each model
        trainer = ModelTrainer(symbol)
        model_dir = os.getenv('AI_MODELS_PATH', 'ai_models')
        os.makedirs(model_dir, exist_ok=True)
        
        for model_type, config in model_configs.items():
            try:
                self.update_state(
                    state='PROGRESS',
                    meta={'status': f'Training {model_type}...', 'models_completed': len(results)}
                )
                
                # Create database record
                from datetime import datetime
                ai_model = AIModel(
                    symbol=symbol,
                    model_type=model_type,
                    config=config or {},
                    status='training',
                    training_started_at=datetime.utcnow()
                )
                db.add(ai_model)
                db.commit()
                db.refresh(ai_model)
                
                # Train
                result = trainer.train_model(df, model_type, config)
                file_path = trainer.save_model(result['model'], model_dir)
                
                # Update record
                ai_model.status = 'trained'
                ai_model.metrics = result['metrics']
                ai_model.file_path = file_path
                ai_model.training_completed_at = datetime.utcnow()
                db.commit()
                
                results[model_type] = {
                    'status': 'success',
                    'model_id': ai_model.id,
                    'metrics': result['metrics']
                }
                
                logger.info(f"✓ {model_type} completed")
                
            except Exception as e:
                logger.error(f"✗ {model_type} failed: {e}")
                results[model_type] = {
                    'status': 'failed',
                    'error': str(e)
                }
        
        return {
            'status': 'completed',
            'symbol': symbol,
            'results': results
        }
        
    except Exception as e:
        logger.error(f"Error in ensemble training: {e}", exc_info=True)
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
