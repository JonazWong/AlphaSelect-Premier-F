from app.db.session import engine, Base
# Import via package so all models register with Base.metadata automatically
import app.models  # noqa: F401
import logging
import os
from sqlalchemy import create_engine, text

logger = logging.getLogger(__name__)


def _grant_schema_privileges():
    """
    Grant CREATE/USAGE on the public schema to the app DB user.
    On DigitalOcean managed PostgreSQL 15+, only the doadmin superuser
    can grant privileges on the public schema.  We therefore prefer
    ADMIN_DATABASE_URL (doadmin connection string) when available.
    Falls back to the regular engine if no admin URL is configured.
    """
    admin_url = os.getenv("ADMIN_DATABASE_URL")
    try:
        if admin_url:
            admin_engine = create_engine(admin_url, pool_pre_ping=True)
            logger.info("🔑 Using ADMIN_DATABASE_URL to grant schema privileges")
        else:
            admin_engine = engine
            logger.warning("⚠️ ADMIN_DATABASE_URL not set, trying with app user (may fail on DO PostgreSQL 15+)")

        app_user = os.getenv("DB_APP_USER", "")
        with admin_engine.connect() as conn:
            conn.execute(text("GRANT ALL ON SCHEMA public TO PUBLIC"))
            if app_user:
                conn.execute(text(f"GRANT ALL ON SCHEMA public TO {app_user}"))
                conn.execute(text(f"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO {app_user}"))
                conn.execute(text(f"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO {app_user}"))
            conn.commit()
        logger.info("✅ Schema privileges granted successfully")
        if admin_url and admin_url != str(engine.url):
            admin_engine.dispose()
    except Exception as e:
        logger.warning(f"⚠️ Could not grant schema privileges: {e}")


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
