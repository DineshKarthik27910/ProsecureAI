"""Data normalization service for incoming live procurement records.

Maps heterogeneous source payloads into the canonical LiveProcurementRecord schema.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Dict, Optional


def _parse_datetime(val: Any) -> Optional[datetime]:
    """Safely convert various datetime representations into UTC datetimes."""
    if val is None:
        return None
    if isinstance(val, datetime):
        if val.tzinfo is None:
            return val.replace(tzinfo=timezone.utc)
        return val.astimezone(timezone.utc)
    if isinstance(val, (int, float)):
        try:
            return datetime.fromtimestamp(val, tzinfo=timezone.utc)
        except (ValueError, OverflowError, OSError):
            return None
    if isinstance(val, str):
        val_str = val.strip()
        if not val_str:
            return None
        # Try standard ISO format
        try:
            dt = datetime.fromisoformat(val_str.replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except ValueError:
            pass
        # Common alternative formats
        for fmt in (
            "%Y-%m-%d",
            "%Y/%m/%d",
            "%d-%m-%Y",
            "%d/%m/%Y",
            "%Y-%m-%d %H:%M:%S",
        ):
            try:
                dt = datetime.strptime(val_str, fmt)
                return dt.replace(tzinfo=timezone.utc)
            except ValueError:
                continue
    return None


def _parse_float(val: Any) -> Optional[float]:
    """Safely convert numeric or string values into float."""
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, str):
        cleaned = val.replace(",", "").replace("$", "").replace("₹", "").strip()
        try:
            return float(cleaned)
        except ValueError:
            return None
    return None


def _clean_str(val: Any, max_len: Optional[int] = None) -> Optional[str]:
    """Strip and normalize string values, returning None if empty."""
    if val is None:
        return None
    s = str(val).strip()
    if not s:
        return None
    return s[:max_len] if max_len else s


class DataNormalizer:
    """Normalizes raw ingestion dictionaries into canonical LiveProcurementRecord attributes."""

    @staticmethod
    def normalize(record: Dict[str, Any], default_source: str = "unknown") -> Dict[str, Any]:
        """Convert a raw record dictionary into validated canonical fields."""
        if not isinstance(record, dict):
            raise TypeError(f"Record must be a dict, got {type(record).__name__}")

        # Resolve primary identifiers
        source = _clean_str(record.get("source") or default_source, max_len=100) or default_source
        external_id = _clean_str(
            record.get("external_id")
            or record.get("id")
            or record.get("tender_reference")
            or record.get("notice_id"),
            max_len=255,
        )
        tender_id = _clean_str(
            record.get("tender_id")
            or external_id
            or record.get("reference_number"),
            max_len=100,
        )
        vendor_id = _clean_str(record.get("vendor_id"), max_len=100)
        vendor_name = _clean_str(record.get("vendor_name") or record.get("awarded_vendor"), max_len=255)

        # Core descriptive fields
        title = _clean_str(record.get("title") or record.get("procurement_title") or record.get("description"))
        category = _clean_str(record.get("category") or record.get("sector") or "General", max_len=100)
        region = _clean_str(record.get("region") or record.get("location") or "Central", max_len=100)

        # Dates
        publication_date = _parse_datetime(
            record.get("publication_date")
            or record.get("tender_date")
            or record.get("date_posted")
            or record.get("published_at")
        )
        closing_date = _parse_datetime(
            record.get("closing_date")
            or record.get("submission_deadline")
            or record.get("deadline")
        )

        # Values
        contract_value = _parse_float(
            record.get("contract_value")
            or record.get("award_value")
            or record.get("tender_value")
            or record.get("estimated_value")
        )
        currency = _clean_str(record.get("currency") or "INR", max_len=10) or "INR"

        # Source URL
        source_url = _clean_str(record.get("source_url") or record.get("url") or record.get("link"))

        # Raw payload serialization (store original dict or custom fields)
        raw_payload = record.get("raw_data") or record
        try:
            raw_data_str = json.dumps(raw_payload, default=str)
        except (TypeError, ValueError):
            raw_data_str = json.dumps({"unserializable_keys": str(raw_payload)})

        return {
            "source": source,
            "external_id": external_id,
            "tender_id": tender_id,
            "vendor_id": vendor_id,
            "vendor_name": vendor_name,
            "title": title,
            "category": category,
            "region": region,
            "publication_date": publication_date,
            "closing_date": closing_date,
            "contract_value": contract_value,
            "currency": currency,
            "raw_data": raw_data_str,
            "source_url": source_url,
        }
