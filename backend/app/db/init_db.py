from app.db.session import engine, Base
# Import via package so all models register with Base.metadata automatically
import app.models  # noqa: F401
import logging
import os
from sqlalchemy import create_engine, text


def _quote_ident(name: str) -> str:
    """Return a safely double-quoted PostgreSQL identifier."""
    return '"' + name.replace('"', '""') + '"'

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
        logger.warning("\u26a0\ufe0f ADMIN_DATABASE_URL not set - falling back to app user (may fail on DO PostgreSQL 15+)")
        return None
    try:
        from urllib.parse import urlparse, urlunparse
        parsed_app = urlparse(app_db_url)
        parsed_admin = urlparse(admin_url)
        # Force admin URL to target the same database as the app URL
        # (DO default ADMIN_DATABASE_URL points to 'defaultdb')
        corrected_url = urlunparse(parsed_admin._replace(path=parsed_app.path))
        db_name = parsed_app.path.lstrip("/")
        logger.info(f"\U0001f511 Admin engine targeting db: {db_name}")
        return create_engine(corrected_url, pool_pre_ping=True)
    except Exception as e:
        logger.warning(f"\u26a0\ufe0f Could not build admin engine: {e}")
        return None


def init_db():
    """Initialize database tables using admin credentials when available."""
    logger.info("\U0001f504 Creating database tables...")
    admin_engine = _get_admin_engine()
    target_engine = admin_engine if admin_engine is not None else engine
    app_user = os.getenv("DB_APP_USER", "")

    try:
        # Grant schema privileges first (doadmin only, no-op if no admin engine)
        if admin_engine is not None:
            with admin_engine.connect() as conn:
                # Log which user/db is actually executing these commands
                row = conn.execute(text("SELECT current_user, current_database()")).fetchone()
                current_user, current_db = row[0], row[1]
                logger.info(f"\U0001f511 Using ADMIN_DATABASE_URL targeting db: {current_db} as user: {current_user}")

                # Attempt to take ownership of the public schema so that
                # subsequent CREATE TABLE commands succeed on DO PG 15+
                # (public schema is owned by pg_database_owner there).
                try:
                    with conn.begin_nested():
                        conn.execute(text(
                            f"ALTER SCHEMA public OWNER TO {_quote_ident(current_user)}"
                        ))
                    logger.info(f"\u2705 Schema public ownership set to {current_user}")
                except Exception as owner_err:
                    logger.warning(f"\u26a0\ufe0f Could not change schema ownership (non-fatal): {owner_err}")

                # Belt-and-suspenders: GRANT ALL + explicit CREATE on PG 15+
                # (GRANT ALL may not include CREATE privilege on managed PG 15+)
                conn.execute(text("GRANT ALL ON SCHEMA public TO PUBLIC"))
                conn.execute(text("GRANT CREATE ON SCHEMA public TO PUBLIC"))
                if app_user:
                    conn.execute(text(f"GRANT ALL ON SCHEMA public TO {_quote_ident(app_user)}"))
                    conn.execute(text(f"GRANT CREATE ON SCHEMA public TO {_quote_ident(app_user)}"))
                    conn.execute(text(
                        f"ALTER DEFAULT PRIVILEGES IN SCHEMA public "
                        f"GRANT ALL ON TABLES TO {_quote_ident(app_user)}"
                    ))
                    conn.execute(text(
                        f"ALTER DEFAULT PRIVILEGES IN SCHEMA public "
                        f"GRANT ALL ON SEQUENCES TO {_quote_ident(app_user)}"
                    ))
                conn.commit()
            logger.info("\u2705 Schema privileges granted successfully")

        # Create all tables
        Base.metadata.create_all(bind=target_engine)
        logger.info("\u2705 Database tables created successfully!")
        logger.info("   - contract_markets")
        logger.info("   - funding_rate_history")
        logger.info("   - open_interest_history")
        logger.info("   - ai_models")
        logger.info("   - predictions")

        # Grant table-level access to app user after tables exist
        if admin_engine is not None and app_user:
            with admin_engine.connect() as conn:
                conn.execute(text(
                    f"GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO {_quote_ident(app_user)}"
                ))
                conn.execute(text(
                    f"GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO {_quote_ident(app_user)}"
                ))
                conn.commit()
            logger.info(f"\u2705 Table privileges granted to {app_user}")

    except Exception as e:
        logger.error(f"\u274c Failed to create database tables: {e}")
        raise
    finally:
        if admin_engine is not None and admin_engine is not engine:
            admin_engine.dispose()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    init_db()
