from celery import Celery
import os

# Create Celery app
celery_app = Celery(
    'alphaselect',
    broker=os.getenv('REDIS_URL', 'rediss://default:AQ34AAImcDFhNjhiZWRkYjgzNzk0OGRmYTRhMzRhMzEzNzY5ZWRlZnAxMzU3Ng@dominant-serval-3576.upstash.io:6379'),
    backend=os.getenv('REDIS_URL', 'rediss://default:AQ34AAImcDFhNjhiZWRkYjgzNzk0OGRmYTRhMzRhMzEzNzY5ZWRlZnAxMzU3Ng@dominant-serval-3576.upstash.io:6379'),
    include=[
        'app.tasks.ai_training_tasks',
        'app.tasks.cleanup_tasks',
        'app.tasks.extreme_signal_tasks',
    ]
)

# Celery configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour max
    task_soft_time_limit=3000,  # 50 minutes soft limit
    broker_connection_retry_on_startup=True,
    beat_schedule={
        'scan-extreme-reversals-every-minute': {
            'task': 'scan_extreme_reversals',
            'schedule': 60.0,  # every 60 seconds
        },
    },
)