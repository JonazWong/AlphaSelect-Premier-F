import time
from functools import wraps
from enum import Enum
from typing import Callable
import redis
from app.core.config import settings


class CircuitState(Enum):
    CLOSED = "closed"  # Normal operation
    OPEN = "open"      # Circuit tripped, rejecting requests
    HALF_OPEN = "half_open"  # Testing if service recovered


class CircuitBreaker:
    """Circuit breaker pattern implementation"""
    
    def __init__(
        self,
        failure_threshold: int = None,
        timeout: int = None,
        redis_client: redis.Redis = None
    ):
        self.failure_threshold = failure_threshold or settings.CIRCUIT_BREAKER_FAILURES
        self.timeout = timeout or settings.CIRCUIT_BREAKER_TIMEOUT
        self.redis_client = redis_client or redis.from_url(settings.REDIS_URL)
        
    def get_state(self, key: str) -> CircuitState:
        """Get current circuit state"""
        state = self.redis_client.get(f"circuit:{key}:state")
        if state:
            return CircuitState(state.decode())
        return CircuitState.CLOSED
    
    def get_failure_count(self, key: str) -> int:
        """Get current failure count"""
        count = self.redis_client.get(f"circuit:{key}:failures")
        return int(count) if count else 0
    
    def record_success(self, key: str):
        """Record successful request"""
        self.redis_client.delete(f"circuit:{key}:failures")
        self.redis_client.set(f"circuit:{key}:state", CircuitState.CLOSED.value)
    
    def record_failure(self, key: str):
        """Record failed request"""
        failures = self.redis_client.incr(f"circuit:{key}:failures")
        
        if failures >= self.failure_threshold:
            # Trip the circuit
            self.redis_client.set(
                f"circuit:{key}:state",
                CircuitState.OPEN.value,
                ex=self.timeout
            )
            self.redis_client.set(
                f"circuit:{key}:open_at",
                time.time(),
                ex=self.timeout
            )
    
    def can_request(self, key: str) -> bool:
        """Check if request can proceed"""
        state = self.get_state(key)
        
        if state == CircuitState.CLOSED:
            return True
        
        if state == CircuitState.OPEN:
            # Check if timeout expired
            open_at = self.redis_client.get(f"circuit:{key}:open_at")
            if open_at:
                elapsed = time.time() - float(open_at)
                if elapsed >= self.timeout:
                    # Move to half-open state
                    self.redis_client.set(f"circuit:{key}:state", CircuitState.HALF_OPEN.value)
                    return True
            return False
        
        # HALF_OPEN state - allow one request to test
        return True


def circuit_breaker(key: str):
    """Decorator for circuit breaker pattern"""
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            cb = CircuitBreaker()
            
            if not cb.can_request(key):
                raise Exception(f"Circuit breaker is OPEN for {key}")
            
            try:
                result = func(*args, **kwargs)
                cb.record_success(key)
                return result
            except Exception as e:
                cb.record_failure(key)
                raise e
        
        return wrapper
    return decorator
