"""Database initialization script for ProcureAI live monitoring schema.

Creates SQLite database and registers initial ORM tables.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Ensure backend root is on sys.path and takes precedence over database directory
_DB_DIR = Path(__file__).resolve().parent
_BACKEND_DIR = _DB_DIR.parent

if sys.path and Path(sys.path[0]).resolve() == _DB_DIR:
    sys.path.pop(0)

if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from sqlalchemy import inspect

try:
    from database.database import DB_FILE, Base, engine, SessionLocal
    from database.models import LiveProcurementRecord, LiveRiskAssessment
except ImportError:
    from .database import DB_FILE, Base, engine, SessionLocal
    from .models import LiveProcurementRecord, LiveRiskAssessment


def init_database() -> None:
    """Initialize database tables and verify schema integrity."""
    print("=" * 60)
    print("PROCUREAI DATABASE INITIALIZATION")
    print("=" * 60)
    print(f"Target Database File: {DB_FILE}")

    # Ensure parent directory exists
    DB_FILE.parent.mkdir(parents=True, exist_ok=True)

    # Create all defined tables without dropping existing ones
    Base.metadata.create_all(bind=engine)
    print("Schema creation completed.")

    # Inspect created database
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Tables in database: {tables}")

    for expected in ["live_procurement_records", "live_risk_assessments"]:
        if expected not in tables:
            raise RuntimeError(f"Verification failed: Table '{expected}' was not found.")

    columns_records = inspector.get_columns("live_procurement_records")
    print(f"\nTable 'live_procurement_records' verified with {len(columns_records)} columns.")

    columns_assessments = inspector.get_columns("live_risk_assessments")
    print(f"Table 'live_risk_assessments' verified with {len(columns_assessments)} columns:")
    for col in columns_assessments:
        pk_marker = " [PRIMARY KEY]" if col.get("primary_key") else ""
        nullable_marker = " NULL" if col.get("nullable") else " NOT NULL"
        print(f"  - {col['name']} ({col['type']}){pk_marker}{nullable_marker}")

    # Verify queryability and check record counts
    db = SessionLocal()
    try:
        count_rec = db.query(LiveProcurementRecord).count()
        count_ass = db.query(LiveRiskAssessment).count()
        print(f"\nCurrent records in 'live_procurement_records': {count_rec}")
        print(f"Current records in 'live_risk_assessments':    {count_ass}")
    finally:
        db.close()

    print("=" * 60)
    print("DATABASE INITIALIZATION SUCCESSFUL")
    print("=" * 60)


if __name__ == "__main__":
    init_database()
