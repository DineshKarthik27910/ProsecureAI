"""Database engine, session factory, and declarative base.

Configures SQLite database connection for ProcureAI live monitoring.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# Absolute path to database file in backend/database/procureai.db
DB_DIR = Path(__file__).resolve().parent
DB_FILE = Path(os.environ.get("DATABASE_PATH", DB_DIR / "procureai.db"))

# SQLite connection URL
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_FILE.as_posix()}"

# Engine with check_same_thread=False for multi-threaded access in FastAPI/services
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)

# Thread-local session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# Declarative base model
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Provide a transactional database session scope."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
