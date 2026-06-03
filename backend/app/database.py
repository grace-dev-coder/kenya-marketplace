from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Use SQLite for now (no external database needed)
# For production, switch to PostgreSQL later
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./kenya_marketplace.db")

# For PostgreSQL on Render, they'll provide DATABASE_URL
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
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
    Base.metadata.create_all(bind=engine)

def execute_query(query: str, params: dict = None, fetch: bool = False):
    with engine.connect() as connection:
        result = connection.execute(text(query), params or {})
        if fetch:
            return [dict(row._mapping) for row in result]
        connection.commit()
        return result.rowcount
