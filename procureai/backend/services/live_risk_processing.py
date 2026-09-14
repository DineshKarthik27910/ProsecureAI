"""Live risk processing service for evaluating LiveProcurementRecord entries."""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional

from sqlalchemy.orm import Session

from database.database import SessionLocal
from database.models import LiveProcurementRecord, LiveRiskAssessment
from .risk_adapter import RiskAdapter, RiskCompatibilityReport


@dataclass
class RiskProcessingResult:
    """Structured response summarizing the live risk processing outcome."""

    live_record_id: int
    assessment_id: int
    tender_id: Optional[str]
    processing_status: str
    composite_risk_score: Optional[float]
    risk_level: Optional[str]
    rule_score: Optional[float]
    ml_score: Optional[float]
    can_run_ml: bool
    can_run_full_hybrid: bool
    reason: str
    processed_at: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "live_record_id": self.live_record_id,
            "assessment_id": self.assessment_id,
            "tender_id": self.tender_id,
            "processing_status": self.processing_status,
            "composite_risk_score": self.composite_risk_score,
            "risk_level": self.risk_level,
            "rule_score": self.rule_score,
            "ml_score": self.ml_score,
            "can_run_ml": self.can_run_ml,
            "can_run_full_hybrid": self.can_run_full_hybrid,
            "reason": self.reason,
            "processed_at": self.processed_at,
        }


class LiveRiskProcessingService:
    """Manages the risk assessment lifecycle for incoming live procurement records."""

    def __init__(self, session_factory: Callable[[], Session] = SessionLocal) -> None:
        self.session_factory = session_factory
        self.adapter = RiskAdapter()

    def process_record_by_id(self, live_record_id: int) -> RiskProcessingResult:
        """Process a single record by its primary key ID."""
        db: Session = self.session_factory()
        try:
            record = (
                db.query(LiveProcurementRecord)
                .filter(LiveProcurementRecord.id == live_record_id)
                .first()
            )
            if not record:
                raise ValueError(f"LiveProcurementRecord with ID {live_record_id} not found.")

            return self._process_record_internal(record, db)
        finally:
            db.close()

    def process_all_records(self) -> List[RiskProcessingResult]:
        """Process all records in live_procurement_records and persist assessments."""
        db: Session = self.session_factory()
        results: List[RiskProcessingResult] = []
        try:
            records = db.query(LiveProcurementRecord).order_by(LiveProcurementRecord.id.asc()).all()
            for record in records:
                res = self._process_record_internal(record, db)
                results.append(res)
        finally:
            db.close()

        return results

    def _process_record_internal(self, record: LiveProcurementRecord, db: Session) -> RiskProcessingResult:
        """Internal worker evaluating a record, generating compatibility reports, and persisting assessment."""
        now = datetime.now(timezone.utc)
        report: RiskCompatibilityReport = self.adapter.inspect_record(record)

        # Look up existing assessment for upsert safety (avoids uncontrolled duplicates)
        assessment: Optional[LiveRiskAssessment] = (
            db.query(LiveRiskAssessment)
            .filter(LiveRiskAssessment.live_record_id == record.id)
            .first()
        )

        # Handle incomplete / early stage live data strictly without fabrication
        if not report.can_run_full_hybrid:
            processing_status = report.status  # e.g. 'insufficient_data' or 'partial_rules_only'
            comp_score = None
            risk_lvl = None
            rule_sc = None
            ml_sc = None
            triggered = json.dumps([])
        else:
            # Future path for 100% complete records
            processing_status = "compatible"
            comp_score = None
            risk_lvl = None
            rule_sc = None
            ml_sc = None
            triggered = json.dumps([])

        compat_json = json.dumps(report.to_dict())

        if assessment:
            # Update existing row safely
            assessment.processing_status = processing_status
            assessment.composite_risk_score = comp_score
            assessment.risk_level = risk_lvl
            assessment.rule_score = rule_sc
            assessment.ml_score = ml_sc
            assessment.rule_weight = 0.60
            assessment.ml_weight = 0.40
            assessment.triggered_factors = triggered
            assessment.compatibility_details = compat_json
            assessment.processed_at = now
            assessment.updated_at = now
        else:
            # Insert new assessment row
            assessment = LiveRiskAssessment(
                live_record_id=record.id,
                processing_status=processing_status,
                composite_risk_score=comp_score,
                risk_level=risk_lvl,
                rule_score=rule_sc,
                ml_score=ml_sc,
                rule_weight=0.60,
                ml_weight=0.40,
                triggered_factors=triggered,
                compatibility_details=compat_json,
                processed_at=now,
                created_at=now,
                updated_at=now,
            )
            db.add(assessment)

        db.commit()
        db.refresh(assessment)

        return RiskProcessingResult(
            live_record_id=record.id,
            assessment_id=assessment.id,
            tender_id=record.tender_id,
            processing_status=assessment.processing_status,
            composite_risk_score=assessment.composite_risk_score,
            risk_level=assessment.risk_level,
            rule_score=assessment.rule_score,
            ml_score=assessment.ml_score,
            can_run_ml=report.can_run_ml,
            can_run_full_hybrid=report.can_run_full_hybrid,
            reason=report.reason,
            processed_at=assessment.processed_at.isoformat() if assessment.processed_at else now.isoformat(),
        )
