"""ProcureAI Live Surveillance Subsystem Routes (RT-6).

Serves live procurement records and risk assessments persisted in SQLite.
Completely decoupled from the existing CSV-backed audit pipeline.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from database.database import get_db
from database.models import LiveProcurementRecord, LiveRiskAssessment

router = APIRouter(prefix="/api/live", tags=["Live Surveillance"])


# =====================================================================
# 1. GET /api/live/tenders
# =====================================================================
@router.get("/tenders", summary="List live procurement records from SQLite")
def get_live_tenders(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    category: Optional[str] = Query(None, description="Optional sector filter"),
    region: Optional[str] = Query(None, description="Optional region filter"),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Return paginated live procurement notices stored in the SQLite database."""
    query = db.query(LiveProcurementRecord)

    if category and category.strip() and category.strip().lower() != "all":
        query = query.filter(LiveProcurementRecord.category.ilike(category.strip()))

    if region and region.strip() and region.strip().lower() != "all":
        query = query.filter(LiveProcurementRecord.region.ilike(region.strip()))

    total = query.count()
    offset = (page - 1) * limit
    records = query.order_by(LiveProcurementRecord.id.desc()).offset(offset).limit(limit).all()
    record_ids = [r.id for r in records]
    assessments_by_record = {
        a.live_record_id: a.to_dict()
        for a in db.query(LiveRiskAssessment).filter(LiveRiskAssessment.live_record_id.in_(record_ids)).all()
    } if record_ids else {}

    items = []
    for r in records:
        r_dict = r.to_dict()
        assess = assessments_by_record.get(r.id)
        r_dict["assessment"] = assess
        r_dict["processing_status"] = assess["processing_status"] if assess else "insufficient_data"
        items.append(r_dict)

    total_pages = max(1, (total + limit - 1) // limit)

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
    }


# =====================================================================
# 2. GET /api/live/tenders/{record_id}
# =====================================================================
@router.get("/tenders/{record_id}", summary="Get single live procurement record with assessment")
def get_live_tender_detail(
    record_id: str,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Retrieve a single live tender by integer ID, tender_id, or external_id."""
    clean_id = record_id.strip()

    record: Optional[LiveProcurementRecord] = None
    if clean_id.isdigit():
        record = db.query(LiveProcurementRecord).filter(LiveProcurementRecord.id == int(clean_id)).first()

    if not record:
        record = db.query(LiveProcurementRecord).filter(LiveProcurementRecord.tender_id == clean_id).first()

    if not record:
        record = db.query(LiveProcurementRecord).filter(LiveProcurementRecord.external_id == clean_id).first()

    if not record:
        raise HTTPException(
            status_code=404,
            detail=f"Live procurement record '{record_id}' not found in SQLite database.",
        )

    # Attach linked risk assessment if one exists
    assessment = (
        db.query(LiveRiskAssessment)
        .filter(LiveRiskAssessment.live_record_id == record.id)
        .first()
    )

    data = record.to_dict()
    data["assessment"] = assessment.to_dict() if assessment else None
    return data


# =====================================================================
# 3. GET /api/live/assessments
# =====================================================================
@router.get("/assessments", summary="List live risk assessments from SQLite")
def get_live_assessments(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by processing_status"),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Return live risk assessment rows with actual persisted values and linked tender info."""

    query = db.query(LiveRiskAssessment)

    # Ignore "All" from the frontend and filter only real statuses
    if status and status.strip() and status.strip().lower() != "all":
        query = query.filter(
            LiveRiskAssessment.processing_status == status.strip().lower()
        )

    total = query.count()
    offset = (page - 1) * limit
    assessments = query.order_by(LiveRiskAssessment.id.desc()).offset(offset).limit(limit).all()

    items: List[Dict[str, Any]] = []
    for a in assessments:
        item = a.to_dict()
        rec = (
            db.query(LiveProcurementRecord)
            .filter(LiveProcurementRecord.id == a.live_record_id)
            .first()
        )
        if rec:
            item["tender_id"] = rec.tender_id
            item["title"] = rec.title
            item["vendor_name"] = rec.vendor_name
            item["category"] = rec.category
            item["region"] = rec.region
            item["contract_value"] = rec.contract_value

        items.append(item)

    total_pages = max(1, (total + limit - 1) // limit)

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
    }


# =====================================================================
# 4. GET /api/live/dashboard
# =====================================================================
@router.get("/dashboard", summary="Live database summary metrics")
def get_live_dashboard(
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Return live SQLite system surveillance statistics."""
    total_records = db.query(func.count(LiveProcurementRecord.id)).scalar() or 0
    total_assessments = db.query(func.count(LiveRiskAssessment.id)).scalar() or 0

    insufficient_count = (
        db.query(func.count(LiveRiskAssessment.id))
        .filter(LiveRiskAssessment.processing_status == "insufficient_data")
        .scalar()
        or 0
    )

    pending_count = (
        db.query(func.count(LiveRiskAssessment.id))
        .filter(LiveRiskAssessment.processing_status == "pending")
        .scalar()
        or 0
    )

    compatible_count = (
        db.query(func.count(LiveRiskAssessment.id))
        .filter(LiveRiskAssessment.processing_status == "compatible")
        .scalar()
        or 0
    )

    processed_count = (
        db.query(func.count(LiveRiskAssessment.id))
        .filter(LiveRiskAssessment.processing_status == "processed")
        .scalar()
        or 0
    )

    # High-risk count must ONLY count records with actual persisted HIGH or CRITICAL risk
    high_risk_count = (
        db.query(func.count(LiveRiskAssessment.id))
        .filter(LiveRiskAssessment.risk_level.in_(["HIGH", "CRITICAL"]))
        .scalar()
        or 0
    )

    # Recent 5 live records for live feed previews
    recent_records = (
        db.query(LiveProcurementRecord)
        .order_by(LiveProcurementRecord.id.desc())
        .limit(5)
        .all()
    )

    return {
        "total_live_records": total_records,
        "total_live_assessments": total_assessments,
        "insufficient_data_count": insufficient_count,
        "pending_count": pending_count,
        "compatible_count": compatible_count,
        "processed_count": processed_count,
        "high_risk_count": high_risk_count,
        "database_backend": "SQLite (procureai.db)",
        "recent_live_records": [r.to_dict() for r in recent_records],
    }
