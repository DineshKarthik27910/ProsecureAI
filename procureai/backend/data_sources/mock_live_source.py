"""Deterministic mock live procurement data source for testing and local simulation."""

from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List

from .base import BaseDataSource


class MockLiveDataSource(BaseDataSource):
    """Generates a small deterministic batch of incoming procurement notices.
    
    Used to verify ingestion pipelines, schema validation, and deduplication
    without connecting to external live networks.
    """

    SOURCE_NAME = "mock_live_feed"

    def __init__(self, base_date: datetime | None = None) -> None:
        self.base_date = base_date or datetime(2026, 9, 14, 10, 0, 0, tzinfo=timezone.utc)

    def get_source_name(self) -> str:
        return self.SOURCE_NAME

    def fetch_records(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Return a deterministic list of 5 simulated live tender solicitations."""
        now = self.base_date
        records: List[Dict[str, Any]] = [
            {
                "source": self.SOURCE_NAME,
                "external_id": "LIVE-TND-2026-001",
                "tender_id": "T10001",
                "vendor_id": "V0009",
                "vendor_name": "Vertex Cloud Systems Inc",
                "title": "Central Region Public Cloud Hosting & Cyber Infrastructure Expansion",
                "category": "IT Services",
                "region": "Central",
                "publication_date": (now - timedelta(days=2)).isoformat(),
                "closing_date": (now + timedelta(days=28)).isoformat(),
                "contract_value": 4500000.00,
                "currency": "INR",
                "source_url": "https://mock.procureai.internal/tenders/LIVE-TND-2026-001",
                "bids": "V0009:4500000|V0001:4750000|V0008:4820000",
                "num_bidders": 3,
                "raw_data": {
                    "procurement_method": "open",
                    "solicitation_type": "RFP",
                    "department": "Federal Information Technology Directorate",
                    "security_clearance_required": True,
                },
            },
            {
                "source": self.SOURCE_NAME,
                "external_id": "LIVE-TND-2026-002",
                "tender_id": "T10002",
                "vendor_id": "V0006",
                "vendor_name": "Horizon Paving & Asphalt Corp",
                "title": "East Region Coastal Expressway Resurfacing & Highway Safety Works",
                "category": "Construction",
                "region": "East",
                "publication_date": (now - timedelta(days=3)).isoformat(),
                "closing_date": (now + timedelta(days=25)).isoformat(),
                "contract_value": 18200000.00,
                "currency": "INR",
                "source_url": "https://mock.procureai.internal/tenders/LIVE-TND-2026-002",
                "bids": "V0006:18200000|V0002:18900000|V0003:19100000|V0004:18750000",
                "num_bidders": 4,
                "raw_data": {
                    "procurement_method": "open",
                    "solicitation_type": "Competitive Tender",
                    "department": "Department of Transportation & Infrastructure",
                    "asphalt_spec_rating": "Superpave-A",
                },
            },
            {
                "source": self.SOURCE_NAME,
                "external_id": "LIVE-TND-2026-003",
                "tender_id": "T10003",
                "vendor_id": "V0005",
                "vendor_name": "BioMed Supply Alliance Ltd",
                "title": "South Region Diagnostic MRI & Clinical Radiotherapy Consumables",
                "category": "Medical Supplies",
                "region": "South",
                "publication_date": (now - timedelta(days=1)).isoformat(),
                "closing_date": (now + timedelta(days=14)).isoformat(),
                "contract_value": 1250000.00,
                "currency": "INR",
                "source_url": "https://mock.procureai.internal/tenders/LIVE-TND-2026-003",
                "bids": "V0005:1250000|V0007:1310000",
                "num_bidders": 2,
                "raw_data": {
                    "procurement_method": "open",
                    "solicitation_type": "Framework Agreement",
                    "department": "Ministry of Health & Social Care",
                    "fda_ce_certified": True,
                },
            },
            {
                "source": self.SOURCE_NAME,
                "external_id": "LIVE-TND-2026-004",
                "tender_id": "T10004",
                "vendor_id": "V0004",
                "vendor_name": "Metro Infrastructure Services",
                "title": "North Region Transit Fleet Automated Vehicle Location & Telematics",
                "category": "Transport",
                "region": "North",
                "publication_date": (now - timedelta(hours=18)).isoformat(),
                "closing_date": (now + timedelta(days=21)).isoformat(),
                "contract_value": 3800000.00,
                "currency": "INR",
                "source_url": "https://mock.procureai.internal/tenders/LIVE-TND-2026-004",
                "bids": "V0004:3800000|V0001:3950000|V0006:4100000",
                "num_bidders": 3,
                "raw_data": {
                    "procurement_method": "open",
                    "solicitation_type": "Invitation to Tender",
                    "department": "Department of Public Transport & Highways",
                    "can_bus_compatible": True,
                },
            },
            {
                "source": self.SOURCE_NAME,
                "external_id": "LIVE-TND-2026-005",
                "tender_id": "T10005",
                "vendor_id": "V0003",
                "vendor_name": "National Development Partners",
                "title": "Central Region Public Procurement Forensic Compliance & Governance Review",
                "category": "Consulting",
                "region": "Central",
                "publication_date": (now - timedelta(hours=6)).isoformat(),
                "closing_date": (now + timedelta(days=35)).isoformat(),
                "contract_value": 850000.00,
                "currency": "INR",
                "source_url": "https://mock.procureai.internal/tenders/LIVE-TND-2026-005",
                "bids": "V0003:850000|V0007:890000|V0008:920000|V0010:875000",
                "num_bidders": 4,
                "raw_data": {
                    "procurement_method": "open",
                    "solicitation_type": "Advisory Solicitation",
                    "department": "State Audit & Management Oversight Board",
                    "audit_standard": "ISO-37001",
                },
            },
        ]
        return records[:limit]
