from pydantic_settings import BaseSettings
from typing import List
from pydantic import field_validator


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://admin:YOUR_DB_PASSWORD@postgres:5432/alphaselect"

    # Redis
    REDIS_URL: str = "redis://redis:6379"

    # MEXC API
    MEXC_API_KEY: str = ""
    MEXC_SECRET_KEY: str = ""
    MEXC_CONTRACT_BASE_URL: str = "https://contract.mexc.com"
    MEXC_SPOT_BASE_URL: str = "https://api.mexc.com"

    # AI Settings
    AI_MODEL_DIR: str = "/app/ai_models"
    MAX_TRAINING_EPOCHS: int = 200
    DEFAULT_BATCH_SIZE: int = 32

    # Security
    SECRET_KEY: str = "change-this-in-production"
    ALGORITHM: str = "HS256"

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://frontend:3000"

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 400
    RATE_LIMIT_WINDOW: int = 10  # seconds

    # Circuit Breaker
    CIRCUIT_BREAKER_FAILURES: int = 5
    CIRCUIT_BREAKER_TIMEOUT: int = 60  # seconds

    # Database Pool
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    # App
    APP_NAME: str = "AlphaSelect Premier F"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = True

    class Config:
        extra = "ignore"        # Allow extra env vars (e.g. DB_PASSWORD from docker-compose)
        env_file = ".env"
        case_sensitive = False

    @field_validator('DATABASE_URL', 'REDIS_URL', 'SECRET_KEY')
    @classmethod
    def validate_required_fields(cls, v, info):
        if not v:
            raise ValueError(f'{info.field_name} is required but not set in environment')
        return v

    @property
    def allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]


settings = Settings()
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    # Database
    DATABASE_URL: str = "postgresql://admin:Ken202318@postgres:5432/alphaselect"
    
    # Redis
    REDIS_URL: str = "redis://redis:6379"
    
    # MEXC API
    MEXC_API_KEY: str = ""
    MEXC_SECRET_KEY: str = ""
    MEXC_CONTRACT_BASE_URL: str = "https://contract.mexc.com"
    MEXC_SPOT_BASE_URL: str = "https://api.mexc.com"
    
    # AI
    AI_MODEL_DIR: str = "/app/ai_models"
    
    # Rate Limiting (MEXC: 500权重/10秒)
    RATE_LIMIT_WINDOW: int = 10  # 速率限制时间窗口（秒）
    RATE_LIMIT_PER_MINUTE: int = 400  # 10秒内最大请求数（MEXC允许500，留100余量）
    MEXC_RECV_WINDOW: int = 5000  # MEXC API recvWindow（毫秒，推荐5秒以下）
    MEXC_REQUEST_TIMEOUT: int = 10  # MEXC API 请求超时（秒）
    
    # Circuit Breaker
    CIRCUIT_BREAKER_FAILURES: int = 5  # 触发断路器的失败次数阈值
    CIRCUIT_BREAKER_TIMEOUT: int = 60  # 断路器打开后的超时时间（秒）
    
    # Security
    SECRET_KEY: str  # required; must be provided via environment or .env
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://frontend:3000"
    
    # App
    APP_NAME: str = "AlphaSelect Premier F"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = True
    
    class Config:
        extra = "ignore"  # ✅ 允許額外環境變數
        env_file = ".env"
        case_sensitive = False

settings = Settings()
