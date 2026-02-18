from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
import uuid
from app.db.session import Base


class AIModel(Base):
    __tablename__ = 'ai_models'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    symbol = Column(String, nullable=False, index=True)
    model_type = Column(String, nullable=False)  # lstm, xgboost, random_forest, arima, linear_regression, ensemble
    version = Column(Integer, default=1)
    metrics = Column(JSONB)  # {r2_score, mae, mse, rmse, directional_accuracy}
    config = Column(JSONB)  # Training configuration
    file_path = Column(String)
    status = Column(String, default='training')  # training, trained, failed
    training_started_at = Column(DateTime)
    training_completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<AIModel {self.symbol} {self.model_type} v{self.version}>"
