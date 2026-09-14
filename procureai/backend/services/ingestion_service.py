"""Ingestion service for receiving, normalizing, deduplicating, and persisting live procurement records."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional

from sqlalchemy.orm import Session

from database.database import SessionLocal
from database.models import (
    LiveProcurementRecord,
    LiveRiskAssessment,
)
from data_sources.base import BaseDataSource
from .data_normalizer import DataNormalizer


@dataclass
class IngestionSummary:
    """Summary metrics of an ingestion run."""

    source: str
    total_received: int = 0
    inserted_count: int = 0
    duplicate_count: int = 0
    updated_count: int = 0
    errors: List[str] = field(default_factory=list)
    inserted_ids: List[int] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source": self.source,
            "total_received": self.total_received,
            "inserted_count": self.inserted_count,
            "duplicate_count": self.duplicate_count,
            "updated_count": self.updated_count,
            "errors": self.errors,
            "inserted_ids": self.inserted_ids,
        }


class IngestionService:
    """Coordinates the ingestion pipeline for live procurement data streams."""

    def __init__(self, session_factory: Callable[[], Session] = SessionLocal) -> None:
        self.session_factory = session_factory
        self.normalizer = DataNormalizer()

    def ingest_from_source(self, data_source: BaseDataSource, limit: int = 100) -> IngestionSummary:
        """Fetch records from a data source adapter and ingest them."""
        source_name = data_source.get_source_name()
        try:
            records = data_source.fetch_records(limit=limit)
        except Exception as e:
            summary = IngestionSummary(source=source_name, total_received=0)
            summary.errors.append(f"Failed to fetch records from source '{source_name}': {e}")
            return summary

        return self.ingest_records(records, source_name=source_name)

    def ingest_records(
        self,
        records: List[Dict[str, Any]],
        source_name: Optional[str] = None,
    ) -> IngestionSummary:
        """Normalize, deduplicate, and persist incoming procurement records."""
        effective_source = source_name or "batch_ingestion"
        summary = IngestionSummary(
            source=effective_source,
            total_received=len(records),
        )

        if not records:
            return summary

        now = datetime.now(timezone.utc)
        db: Session = self.session_factory()

        try:
            for idx, raw in enumerate(records):
                try:
                    norm = self.normalizer.normalize(raw, default_source=effective_source)
                except Exception as norm_err:
                    summary.errors.append(f"Record #{idx} normalization failed: {norm_err}")
                    continue

                rec_source = norm["source"]
                rec_ext_id = norm["external_id"]
                rec_tender_id = norm["tender_id"]

                # Safe duplicate identity:
                # Primary: (source, external_id)
                # Fallback: (source, tender_id)
                existing: Optional[LiveProcurementRecord] = None
                if rec_ext_id:
                    existing = (
                        db.query(LiveProcurementRecord)
                        .filter(
                            LiveProcurementRecord.source == rec_source,
                            LiveProcurementRecord.external_id == rec_ext_id,
                        )
                        .first()
                    )

                if not existing and rec_tender_id:
                    existing = (
                        db.query(LiveProcurementRecord)
                        .filter(
                            LiveProcurementRecord.source == rec_source,
                            LiveProcurementRecord.tender_id == rec_tender_id,
                        )
                        .first()
                    )

                if existing:
                    # Duplicate detected: update last_seen_at and updated_at
                    existing.last_seen_at = now
                    existing.updated_at = now
                    summary.duplicate_count += 1
                    summary.updated_count += 1
                else:
                    # New record: create model instance
                    new_item = LiveProcurementRecord(
                        source=rec_source,
                        external_id=rec_ext_id,
                        tender_id=rec_tender_id,
                        vendor_id=norm["vendor_id"],
                        vendor_name=norm["vendor_name"],
                        title=norm["title"],
                        category=norm["category"],
                        region=norm["region"],
                        publication_date=norm["publication_date"],
                        closing_date=norm["closing_date"],
                        contract_value=norm["contract_value"],
                        currency=norm["currency"],
                        raw_data=norm["raw_data"],
                        source_url=norm["source_url"],
                        first_seen_at=now,
                        last_seen_at=now,
                        created_at=now,
                        updated_at=now,
                    )

                    db.add(new_item)

                    # Save the record temporarily so SQLAlchemy
                    # generates new_item.id
                    db.flush()

                    # Create a risk assessment automatically
                    assessment = LiveRiskAssessment(
                        live_record_id=new_item.id,
                        processing_status="pending",
                        composite_risk_score=None,
                        risk_level=None,
                        rule_score=None,
                        ml_score=None,
                        rule_weight=0.6,
                        ml_weight=0.4,
                        triggered_factors="[]",
                        compatibility_details="{}",
                        created_at=now,
                        updated_at=now,
                    )

                    db.add(assessment)

                    summary.inserted_count += 1
                    summary.inserted_ids.append(new_item.id)
                    
                
            db.commit()

        except Exception as db_err:
            db.rollback()
            summary.errors.append(
                f"Database transaction error during ingestion: {db_err}"
            )

        finally:
            db.close()

        return summary
