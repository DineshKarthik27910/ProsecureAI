"""SQLAlchemy ORM models for ProcureAI live data infrastructure."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)

from .database import Base


def _utc_now() -> datetime:
    """Return timezone-aware current UTC datetime."""
    return datetime.now(timezone.utc)


class LiveProcurementRecord(Base):
    """Stores incoming live procurement notices and tender records.
    
    Supports real-time ingestion, external feed caching, and forward auditability
    without touching the existing static CSV baseline.
    """

    __tablename__ = "live_procurement_records"

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)

    # Source & tracking identifiers
    source = Column(String(100), nullable=True, index=True)
    external_id = Column(String(255), nullable=True, index=True)
    tender_id = Column(String(100), nullable=True, index=True)
    vendor_id = Column(String(100), nullable=True, index=True)
    vendor_name = Column(String(255), nullable=True)

    # Core tender attributes
    title = Column(Text, nullable=True)
    category = Column(String(100), nullable=True, index=True)
    region = Column(String(100), nullable=True, index=True)

    # Dates & financial values
    publication_date = Column(DateTime, nullable=True)
    closing_date = Column(DateTime, nullable=True)
    contract_value = Column(Float, nullable=True)
    currency = Column(String(10), default="INR", nullable=True)

    # Payloads & source links
    raw_data = Column(Text, nullable=True)
    source_url = Column(Text, nullable=True)

    # Surveillance timestamps
    first_seen_at = Column(DateTime, default=_utc_now, nullable=False)
    last_seen_at = Column(DateTime, default=_utc_now, onupdate=_utc_now, nullable=False)
    created_at = Column(DateTime, default=_utc_now, nullable=False)
    updated_at = Column(DateTime, default=_utc_now, onupdate=_utc_now, nullable=False)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize model instance to a dictionary."""
        return {
            "id": self.id,
            "source": self.source,
            "external_id": self.external_id,
            "tender_id": self.tender_id,
            "vendor_id": self.vendor_id,
            "vendor_name": self.vendor_name,
            "title": self.title,
            "category": self.category,
            "region": self.region,
            "publication_date": self.publication_date.isoformat() if self.publication_date else None,
            "closing_date": self.closing_date.isoformat() if self.closing_date else None,
            "contract_value": self.contract_value,
            "currency": self.currency,
            "raw_data": self.raw_data,
            "source_url": self.source_url,
            "first_seen_at": self.first_seen_at.isoformat() if self.first_seen_at else None,
            "last_seen_at": self.last_seen_at.isoformat() if self.last_seen_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self) -> str:
        return (
            f"<LiveProcurementRecord(id={self.id}, tender_id='{self.tender_id}', "
            f"source='{self.source}', value={self.contract_value})>"
        )


class LiveRiskAssessment(Base):
    """Stores risk assessment outcomes, explainability factors, and compatibility states
    for live procurement records without modifying the historical CSV baseline.
    """

    __tablename__ = "live_risk_assessments"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    live_record_id = Column(
        Integer,
        ForeignKey("live_procurement_records.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    # Lifecycle & status: pending, insufficient_data, compatible, processed
    processing_status = Column(String(50), nullable=False, default="pending", index=True)

    # Scores & classifications (nullable for incomplete/insufficient tenders)
    composite_risk_score = Column(Float, nullable=True)
    risk_level = Column(String(50), nullable=True)
    rule_score = Column(Float, nullable=True)
    ml_score = Column(Float, nullable=True)

    # Active formula weights (standard ProcureAI 60/40)
    rule_weight = Column(Float, default=0.60, nullable=True)
    ml_weight = Column(Float, default=0.40, nullable=True)

    # Serialized JSON audit payloads
    triggered_factors = Column(Text, nullable=True)
    compatibility_details = Column(Text, nullable=True)

    # Timestamps
    processed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=_utc_now, nullable=False)
    updated_at = Column(DateTime, default=_utc_now, onupdate=_utc_now, nullable=False)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize assessment model instance to a dictionary."""
        return {
            "id": self.id,
            "live_record_id": self.live_record_id,
            "processing_status": self.processing_status,
            "composite_risk_score": self.composite_risk_score,
            "risk_level": self.risk_level,
            "rule_score": self.rule_score,
            "ml_score": self.ml_score,
            "rule_weight": self.rule_weight,
            "ml_weight": self.ml_weight,
            "triggered_factors": self.triggered_factors,
            "compatibility_details": self.compatibility_details,
            "processed_at": self.processed_at.isoformat() if self.processed_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self) -> str:
        return (
            f"<LiveRiskAssessment(id={self.id}, live_record_id={self.live_record_id}, "
            f"status='{self.processing_status}', score={self.composite_risk_score})>"
        )
