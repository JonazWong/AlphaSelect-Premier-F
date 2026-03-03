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

    IMPORTANT: ADMIN_DATABASE_URL may point to 'defaultdb' by default.
    We force it to connect to the same database as DATABASE_URL so that
    the GRANT applies to the correct database.
    """
    admin_url = os.getenv("ADMIN_DATABASE_URL")
    app_db_url = os.getenv("DATABASE_URL", "")
    admin_engine = None
    try:
        if admin_url:
            # Replace the database name in admin URL with the one from DATABASE_URL
            # e.g. .../defaultdb?... -> .../premier?...
            from urllib.parse import urlparse, urlunparse
            parsed_app = urlparse(app_db_url)
            parsed_admin = urlparse(admin_url)
            # Use app DB's database name but admin credentials/host
            corrected_admin_url = urlunparse(parsed_admin._replace(path=parsed_app.path))
            logger.info(f"\U0001f511 Using ADMIN_DATABASE_URL targeting db: {parsed_app.path.lstrip('/')}")
            admin_engine = create_engine(corrected_admin_url, pool_pre_ping=True)
        else:
            admin_engine = engine
            logger.warning("\u26a0\ufe0f ADMIN_DATABASE_URL not set, trying with app user (may fail on DO PostgreSQL 15+)")

        app_user = os.getenv("DB_APP_USER", "")
        with admin_engine.connect() as conn:
            conn.execute(text("GRANT ALL ON SCHEMA public TO PUBLIC"))
            if app_user:
                conn.execute(text(f"GRANT ALL ON SCHEMA public TO {app_user}"))
                conn.execute(text(f"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO {app_user}"))
                conn.execute(text(f"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO {app_user}"))
            conn.commit()
        logger.info("\u2705 Schema privileges granted successfully")
    except Exception as e:
        logger.warning(f"\u26a0\ufe0f Could not grant schema privileges: {e}")
    finally:
        if admin_engine and admin_engine is not engine:
            admin_engine.dispose()


def init_db():
    """Initialize database tables"""
    logger.info("\U0001f504 Creating database tables...")
    _grant_schema_privileges()
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("\u2705 Database tables created successfully!")
        logger.info(f"   - contract_markets")
        logger.info(f"   - funding_rate_history")
        logger.info(f"   - open_interest_history")
        logger.info(f"   - ai_models")
        logger.info(f"   - predictions")
    except Exception as e:
        logger.error(f"\u274c Failed to create database tables: {e}")
        raise


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    init_db()
