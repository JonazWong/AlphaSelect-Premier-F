from app.db.session import engine, Base
from app.models.contract_market import ContractMarket
from app.models.funding_rate import FundingRateHistory
from app.models.open_interest import OpenInterestHistory
from app.models.ai_model import AIModel
from app.models.prediction import Prediction


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("Database initialized successfully!")
