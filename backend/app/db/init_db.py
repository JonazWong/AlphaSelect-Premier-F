from app.db.session import engine, Base
# Import via package so all models register with Base.metadata automatically
import app.models  # noqa: F401
import logging

logger = logging.getLogger(__name__)


def init_db():
    """Initialize database tables"""
    logger.info("🔄 Creating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created successfully!")
        logger.info(f"   - contract_markets")
        logger.info(f"   - funding_rate_history")
        logger.info(f"   - open_interest_history")
        logger.info(f"   - ai_models")
        logger.info(f"   - predictions")
    except Exception as e:
        logger.error(f"❌ Failed to create database tables: {e}")
        raise


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    init_db()
