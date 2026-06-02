from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/kenya_marketplace")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency that provides a database session and closes it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Create all tables defined in models."""
    Base.metadata.create_all(bind=engine)

def execute_query(query: str, params: dict = None, fetch: bool = False):
    """
    Execute a raw SQL query. Used by auth.py and other routers.
    """
    with engine.connect() as connection:
        result = connection.execute(text(query), params or {})
        if fetch:
            return [dict(row._mapping) for row in result]
        connection.commit()
        return result.rowcount