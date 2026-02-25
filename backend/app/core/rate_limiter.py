import time
import logging
from functools import wraps
from collections import deque
from typing import Callable
import redis
from app.core.config import settings

logger = logging.getLogger(__name__)


class RateLimiter:
    """Rate limiter using sliding window algorithm with Redis"""
    
    def __init__(self, redis_client: redis.Redis = None):
        self.redis_client = redis_client or redis.from_url(settings.REDIS_URL)
        self.window = settings.RATE_LIMIT_WINDOW  # 10 seconds
        self.max_requests = settings.RATE_LIMIT_PER_MINUTE
        
    def is_allowed(self, key: str) -> bool:
        """Check if request is allowed under rate limit (fail open on Redis error)"""
        try:
            now = time.time()
            window_start = now - self.window

            # Use Redis sorted set for distributed rate limiting
            pipe = self.redis_client.pipeline()
            pipe.zremrangebyscore(f"ratelimit:{key}", 0, window_start)
            pipe.zcard(f"ratelimit:{key}")
            results = pipe.execute()
            request_count = results[1]
            allowed = request_count < self.max_requests

            if allowed:
                pipe = self.redis_client.pipeline()
                pipe.zadd(f"ratelimit:{key}", {str(now): now})
                pipe.expire(f"ratelimit:{key}", self.window + 1)
                pipe.execute()

            return allowed
        except Exception as e:
            logger.warning(f"Redis rate limiter unavailable, allowing request: {e}")
            return True
    
    def wait_if_needed(self, key: str):
        """Wait if rate limit is exceeded (fail open on Redis error)"""
        try:
            while not self.is_allowed(key):
                time.sleep(0.1)
        except Exception as e:
            logger.warning(f"Rate limiter error (allowing request): {e}")


def rate_limit(key_func: Callable = None):
    """Decorator for rate limiting"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            limiter = RateLimiter()
            key = key_func(*args, **kwargs) if key_func else "global"
            limiter.wait_if_needed(key)
            return func(*args, **kwargs)
        return wrapper
    return decorator
