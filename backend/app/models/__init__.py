"""
ORM Models package.

Importing all models here ensures SQLAlchemy's Base.metadata is fully populated
regardless of which module triggers the first import.
"""
from app.models.contract_market import ContractMarket
from app.models.funding_rate import FundingRateHistory
from app.models.open_interest import OpenInterestHistory
from app.models.ai_model import AIModel
from app.models.prediction import Prediction

__all__ = [
    'ContractMarket',
    'FundingRateHistory',
    'OpenInterestHistory',
    'AIModel',
    'Prediction',
]
