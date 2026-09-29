import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings, BASE_DIR

logger = logging.getLogger("mock_gst.database")

def get_engine():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

    connect_args = {}
    if db_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}

    try:
        eng = create_engine(
            db_url,
            connect_args=connect_args,
            pool_pre_ping=True
        )
        # Verify connection
        with eng.connect():
            pass
        logger.info(f"Connected successfully to primary database ({'SQLite' if 'sqlite' in db_url else 'PostgreSQL'}).")
        return eng
    except Exception as e:
        logger.warning(f"Could not connect to database ({db_url}): {e}. Falling back to local SQLite database.")
        sqlite_url = f"sqlite:///{BASE_DIR}/mock_gst.db"
        fallback_engine = create_engine(
            sqlite_url,
            connect_args={"check_same_thread": False},
            pool_pre_ping=True
        )
        return fallback_engine

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
