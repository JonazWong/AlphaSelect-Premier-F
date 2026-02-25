from pydantic_settings import BaseSettings
from typing import List
from pydantic import field_validator


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://admin:Ken202318@localhost:5432/alphaselect"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
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
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 100
    RATE_LIMIT_WINDOW: int = 10  # seconds
    
    # Circuit Breaker
    CIRCUIT_BREAKER_FAILURES: int = 5
    CIRCUIT_BREAKER_TIMEOUT: int = 60  # seconds
    
    # Database Pool
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    
    class Config:
        extra = "ignore"       # ← 加這行！允許 .env 有額外的 key（如 DB_PASSWORD）
        env_file = ".env"
        case_sensitive = False # ← 改成 False

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
