from app.db.session import engine, Base
# Import via package so all models register with Base.metadata automatically
import app.models  # noqa: F401
import logging
import os
from sqlalchemy import create_engine, text

logger = logging.getLogger(__name__)


def _get_admin_engine():
    """
    Build a SQLAlchemy engine using ADMIN_DATABASE_URL (doadmin), pointing
    at the same database as DATABASE_URL.  Returns None if not configured.

    Required for DigitalOcean managed PostgreSQL 15+ where the app user
    lacks CREATE privilege on the public schema by default.
    Only doadmin (superuser) can create tables and grant schema privileges.
    """
    admin_url = os.getenv("ADMIN_DATABASE_URL")
    app_db_url = os.getenv("DATABASE_URL", "")
    if not admin_url:
        logger.warning("⚠️ ADMIN_DATABASE_URL not set - falling back to app user (may fail on DO PostgreSQL 15+)")
        return None
    try:
        from urllib.parse import urlparse, urlunparse
        parsed_app = urlparse(app_db_url)
        parsed_admin = urlparse(admin_url)
        # Force admin URL to target the same database as the app URL
        # (DO default ADMIN_DATABASE_URL points to 'defaultdb')
        corrected_url = urlunparse(parsed_admin._replace(path=parsed_app.path))
        db_name = parsed_app.path.lstrip("/")
        logger.info(f"🔑 Admin engine targeting db: {db_name}")
        return create_engine(corrected_url, pool_pre_ping=True)
    except Exception as e:
        logger.warning(f"⚠️ Could not build admin engine: {e}")
        return None


def init_db():
    """Initialize database tables using admin credentials when available."""
    logger.info("🔄 Creating database tables...")
    admin_engine = _get_admin_engine()
    target_engine = admin_engine if admin_engine is not None else engine
    app_user = os.getenv("DB_APP_USER", "")

    try:
        # Grant schema privileges first (doadmin only, no-op if no admin engine)
        if admin_engine is not None:
            with admin_engine.connect() as conn:
                conn.execute(text("GRANT ALL ON SCHEMA public TO PUBLIC"))
                if app_user:
                    conn.execute(text(f"GRANT ALL ON SCHEMA public TO {app_user}"))
                    conn.execute(text(
                        f"ALTER DEFAULT PRIVILEGES IN SCHEMA public "
                        f"GRANT ALL ON TABLES TO {app_user}"
                    ))
                    conn.execute(text(
                        f"ALTER DEFAULT PRIVILEGES IN SCHEMA public "
                        f"GRANT ALL ON SEQUENCES TO {app_user}"
                    ))
                conn.commit()
            logger.info("✅ Schema privileges granted")

        # Create all tables
        Base.metadata.create_all(bind=target_engine)
        logger.info("✅ Database tables created successfully!")
        logger.info("   - contract_markets")
        logger.info("   - funding_rate_history")
        logger.info("   - open_interest_history")
        logger.info("   - ai_models")
        logger.info("   - predictions")

        # Grant table-level access to app user after tables exist
        if admin_engine is not None and app_user:
            with admin_engine.connect() as conn:
                conn.execute(text(
                    f"GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO {app_user}"
                ))
                conn.execute(text(
                    f"GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO {app_user}"
                ))
                conn.commit()
            logger.info(f"✅ Table privileges granted to {app_user}")

    except Exception as e:
        logger.error(f"❌ Failed to create database tables: {e}")
        raise
    finally:
        if admin_engine is not None and admin_engine is not engine:
            admin_engine.dispose()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    init_db()

