from celery import Celery
import os
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse


def get_redis_url_with_ssl():
    """Get Redis URL with proper SSL configuration for Celery.

    When the URL uses the ``rediss://`` scheme, ``ssl_cert_reqs`` is added
    automatically if it is not already present.  The value defaults to
    ``CERT_NONE`` (suitable for DigitalOcean / Upstash managed Redis) but can
    be overridden via the ``REDIS_SSL_CERT_REQS`` environment variable
    (accepted values: ``CERT_NONE``, ``CERT_OPTIONAL``, ``CERT_REQUIRED``).
    """
    redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')

    if redis_url.startswith('rediss://'):
        parsed = urlparse(redis_url)
        query_params = parse_qs(parsed.query)

        if 'ssl_cert_reqs' not in query_params:
            allowed_ssl_cert_reqs = {'CERT_NONE', 'CERT_OPTIONAL', 'CERT_REQUIRED'}
            raw_ssl_cert_reqs = os.getenv('REDIS_SSL_CERT_REQS', 'CERT_NONE')
            normalized_ssl_cert_reqs = raw_ssl_cert_reqs.upper()
            if normalized_ssl_cert_reqs not in allowed_ssl_cert_reqs:
                raise ValueError(
                    f"Invalid REDIS_SSL_CERT_REQS value: {raw_ssl_cert_reqs!r}. "
                    f"Allowed values are: {', '.join(sorted(allowed_ssl_cert_reqs))}."
                )
            query_params['ssl_cert_reqs'] = [normalized_ssl_cert_reqs]

        new_query = urlencode(query_params, doseq=True)
        redis_url = urlunparse((
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            new_query,
            parsed.fragment,
        ))

    return redis_url


_redis_url = get_redis_url_with_ssl()

# Create Celery app
celery_app = Celery(
    'alphaselect',
    broker=_redis_url,
    backend=_redis_url,
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
    
    # Memory management (critical for 512MB instances)
    worker_prefetch_multiplier=1,  # Only fetch 1 task at a time
    worker_max_tasks_per_child=50,  # Restart worker after 50 tasks (prevent memory leaks)
    worker_max_memory_per_child=400000,  # 400MB limit, restart worker if exceeded
    
    # Task execution settings
    task_acks_late=True,  # Acknowledge tasks after completion
    task_reject_on_worker_lost=True,  # Requeue tasks if worker dies
    
    # Result backend optimization
    result_expires=3600,  # Clean up results after 1 hour
    result_compression='gzip',  # Compress results to save memory
    
    beat_schedule={
        'scan-extreme-reversals-every-minute': {
            'task': 'scan_extreme_reversals',
            'schedule': 60.0,  # every 60 seconds
        },
        'collect-market-data-every-5-minutes': {
            'task': 'collect_market_data',
            'schedule': 300.0,  # every 5 minutes (300 seconds)
        },
    },
)