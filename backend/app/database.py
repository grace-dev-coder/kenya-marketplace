from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./kenya_marketplace.db")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL, 
    connect_args=connect_args,
    pool_pre_ping=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Create all tables using SQLAlchemy ORM models"""
    from app import models
    Base.metadata.create_all(bind=engine)

# ─── Helper for raw SQL queries (used by some routers) ─────────────────
def execute_query(query: str, params: dict = None, fetch: bool = False):
    with engine.connect() as connection:
        result = connection.execute(text(query), params or {})
        if fetch:
            return [dict(row._mapping) for row in result]
        connection.commit()
        return result.rowcount