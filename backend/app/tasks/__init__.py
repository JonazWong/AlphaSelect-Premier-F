"""
Tasks package - register all Celery tasks
"""
from app.tasks.celery_app import celery_app
from app.tasks.extreme_signal_tasks import scan_extreme_reversals
from app.tasks.market_data_tasks import collect_market_data
from app.tasks.ai_training_tasks import (
    train_single_model_task,
    train_ensemble_models_task,
    cleanup_old_models_task,
)

__all__ = [
    "celery_app",
    "scan_extreme_reversals",
    "collect_market_data",
    "train_single_model_task",
    "train_ensemble_models_task",
    "cleanup_old_models_task",
]
