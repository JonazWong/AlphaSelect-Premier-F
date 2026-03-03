from app.db.session import engine, Base
# Import via package so all models register with Base.metadata automatically
import app.models  # noqa: F401
import logging
from sqlalchemy import text

logger = logging.getLogger(__name__)


def _grant_schema_privileges():
    """
    Grant CREATE/USAGE on the public schema to the current DB user.
    Required for PostgreSQL 15+ where the default public schema privileges
    were revoked from the PUBLIC role (affects DigitalOcean managed databases).
    Silently skips if the user lacks GRANT option (superuser will have done it).
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("GRANT ALL ON SCHEMA public TO CURRENT_USER"))
            conn.execute(text("GRANT ALL ON SCHEMA public TO PUBLIC"))
            conn.commit()
            logger.info("✅ Schema privileges granted successfully")
    except Exception as e:
        logger.warning(f"⚠️ Could not grant schema privileges (may already be set): {e}")


def init_db():
    """Initialize database tables"""
    logger.info("🔄 Creating database tables...")
    _grant_schema_privileges()
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
