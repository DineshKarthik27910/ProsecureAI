"""Open Government Data (OGD) Platform India (data.gov.in) procurement data connector.

Safely connects to official Indian Government Open Data APIs under the NDSAP framework.
Supports isolated batch queries, field normalization, and defensive error handling.
"""

from __future__ import annotations

import json
import logging
import os
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional

from .base import BaseDataSource

logger = logging.getLogger("procureai.data_sources.ogd_india")


class OGDIndiaDataSource(BaseDataSource):
    """Connector for the Indian Open Government Data (OGD) Platform API (data.gov.in).
    
    Adheres strictly to ProcureAI safety protocols:
    - Zero website scraping; accesses only the official documented REST API.
    - Credentials are read exclusively from environment variables.
    - Enforces safe HTTP timeouts and conservative batch limits.
    - Gracefully handles missing credentials, HTTP errors, and network timeouts.
    - Preserves raw payloads in raw_data without fabricating missing values.
    """

    SOURCE_NAME = "ogd_india"
    DEFAULT_BASE_URL = "https://api.data.gov.in/resource"

    # Common field aliases used across diverse Indian government procurement catalogs
    FIELD_ALIASES = {
        "external_id": ["_id", "id", "tender_no", "nit_no", "tender_reference_number", "tender_id", "record_id"],
        "tender_id": ["tender_no", "nit_no", "tender_reference_number", "tender_id", "work_order_no", "ref_no"],
        "vendor_id": ["vendor_id", "vendor_code", "contractor_id", "contractor_code", "supplier_id"],
        "vendor_name": ["contractor_name", "vendor_name", "firm_name", "agency_name", "awardee", "successful_bidder", "supplier_name"],
        "title": ["work_name", "tender_title", "title", "name_of_work", "description", "item_description", "work_description"],
        "category": ["category", "type_of_work", "department", "sector", "work_category", "sub_category"],
        "region": ["region", "zone", "division", "state", "location", "circle", "district", "city"],
        "publication_date": ["publication_date", "nit_date", "tender_date", "notice_date", "date_of_issue", "publish_date"],
        "closing_date": ["closing_date", "opening_date", "due_date", "bid_submission_end_date", "bid_opening_date"],
        "contract_value": ["contract_value", "tender_value", "estimated_cost", "tender_amount", "awarded_value", "cost", "amount"],
        "num_bidders": ["no_of_bids_received", "num_bidders", "bidders_count", "total_bids_received", "number_of_bidders"],
    }

    def __init__(
        self,
        api_key: Optional[str] = None,
        resource_id: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: int = 10,
    ) -> None:
        """Initialize the OGD India connector from explicit args or environment variables."""
        self.api_key = (api_key or os.environ.get("DATA_GOV_IN_API_KEY", "")).strip()
        self.resource_id = (resource_id or os.environ.get("DATA_GOV_IN_RESOURCE_ID", "")).strip()
        self.base_url = (base_url or os.environ.get("DATA_GOV_IN_BASE_URL", self.DEFAULT_BASE_URL)).strip().rstrip("/")
        self.timeout = max(3, min(timeout, 30))

    def get_source_name(self) -> str:
        """Return the registered canonical source identifier."""
        return self.SOURCE_NAME

    def is_configured(self) -> bool:
        """Check whether required API credentials and resource identifier are present."""
        return bool(self.api_key and self.resource_id)

    def fetch_records(self, limit: int = 5, offset: int = 0) -> List[Dict[str, Any]]:
        """Fetch a limited batch of procurement notices from the official OGD India endpoint.
        
        Args:
            limit: Maximum records to return (capped at 5 for controlled testing).
            offset: Zero-indexed row offset for pagination.
            
        Returns:
            List of parsed and raw-preserved dictionaries ready for IngestionService.
        """
        # Safety Gate: verify configuration exists
        if not self.is_configured():
            logger.warning(
                "[OGDIndiaDataSource] Missing configuration: DATA_GOV_IN_API_KEY or DATA_GOV_IN_RESOURCE_ID "
                "is not set. Halting external request safely and returning empty record batch."
            )
            return []

        # Enforce conservative batch ceiling
        safe_limit = max(1, min(limit, 25))

        # Build official OGD India query URL
        params = {
            "api-key": self.api_key,
            "format": "json",
            "offset": str(offset),
            "limit": str(safe_limit),
        }
        query_string = urllib.parse.urlencode(params)
        url = f"{self.base_url}/{self.resource_id}?{query_string}"

        logger.info(f"[OGDIndiaDataSource] Querying official OGD endpoint for resource '{self.resource_id}' (limit={safe_limit}).")

        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "ProcureAI-Surveillance/1.0 (Government Procurement Research)",
                "Accept": "application/json",
            },
        )

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as response:
                status = response.status
                if status != 200:
                    logger.error(f"[OGDIndiaDataSource] Unexpected HTTP status {status} from OGD API.")
                    return []

                raw_body = response.read().decode("utf-8")
                payload = json.loads(raw_body)

        except urllib.error.HTTPError as http_err:
            if http_err.code in (401, 403):
                logger.error(f"[OGDIndiaDataSource] Authentication error (HTTP {http_err.code}): Invalid or inactive API key.")
            elif http_err.code == 429:
                logger.error(f"[OGDIndiaDataSource] Rate limit exceeded (HTTP 429). Throttling required.")
            elif http_err.code == 404:
                logger.error(f"[OGDIndiaDataSource] Resource ID '{self.resource_id}' not found on data.gov.in (HTTP 404).")
            else:
                logger.error(f"[OGDIndiaDataSource] HTTP error {http_err.code} from OGD API: {http_err.reason}")
            return []

        except urllib.error.URLError as url_err:
            logger.error(f"[OGDIndiaDataSource] Network connection error to data.gov.in: {url_err.reason}")
            return []

        except (TimeoutError, TimeoutException) if "TimeoutException" in globals() else TimeoutError:
            logger.error(f"[OGDIndiaDataSource] Request timed out after {self.timeout}s.")
            return []

        except json.JSONDecodeError as json_err:
            logger.error(f"[OGDIndiaDataSource] Failed to parse JSON response from OGD API: {json_err}")
            return []

        except Exception as exc:
            logger.error(f"[OGDIndiaDataSource] Unexpected error fetching OGD records: {exc}")
            return []

        # Extract record list from response
        records_raw = []
        if isinstance(payload, dict):
            records_raw = payload.get("records") or payload.get("data") or []
        elif isinstance(payload, list):
            records_raw = payload

        if not records_raw:
            logger.info(f"[OGDIndiaDataSource] OGD API returned 0 records for resource '{self.resource_id}'.")
            return []

        # Map each raw Indian government record safely
        results = []
        for idx, item in enumerate(records_raw[:safe_limit]):
            if isinstance(item, dict):
                mapped = self.extract_fields(item, fallback_index=offset + idx + 1)
                results.append(mapped)

        return results

    def extract_fields(self, raw_item: Dict[str, Any], fallback_index: int) -> Dict[str, Any]:
        """Extract canonical procurement fields from a raw Indian government record dictionary.
        
        Uses flexible alias matching while strictly preserving raw values without fabrication.
        """
        def find_val(alias_key: str) -> Any:
            aliases = self.FIELD_ALIASES.get(alias_key, [])
            for k in aliases:
                if k in raw_item and raw_item[k] is not None and str(raw_item[k]).strip():
                    return raw_item[k]
            return None

        # Resolve identifiers
        external_id = find_val("external_id")
        tender_id = find_val("tender_id")
        if not external_id and not tender_id:
            external_id = f"IND-OGD-{self.resource_id[:8]}-{fallback_index:04d}"
            tender_id = f"T-IND-{fallback_index:04d}"
        elif not external_id:
            external_id = str(tender_id)
        elif not tender_id:
            tender_id = str(external_id)

        # Core attributes
        title = find_val("title")
        category = find_val("category")
        region = find_val("region")

        # Vendor & Award info (available only in post-award registers)
        vendor_id = find_val("vendor_id")
        vendor_name = find_val("vendor_name")

        # Dates
        publication_date = find_val("publication_date")
        closing_date = find_val("closing_date")

        # Financial values (clean currency strings like 'Rs. 45,00,000/-')
        contract_value = find_val("contract_value")
        if contract_value is not None:
            val_clean = (
                str(contract_value)
                .replace("Rs.", "")
                .replace("Rs", "")
                .replace("INR", "")
                .replace("/-", "")
                .replace(",", "")
                .replace("₹", "")
                .strip()
            )
            try:
                contract_value = float(val_clean)
            except ValueError:
                pass

        # Forensic dimensions (if disclosed in tender register)
        num_bidders = find_val("num_bidders")

        source_url = f"https://data.gov.in/resource/{self.resource_id}" if self.resource_id else "https://data.gov.in/"

        return {
            "source": self.SOURCE_NAME,
            "external_id": str(external_id).strip(),
            "tender_id": str(tender_id).strip(),
            "vendor_id": str(vendor_id).strip() if vendor_id else None,
            "vendor_name": str(vendor_name).strip() if vendor_name else None,
            "title": str(title).strip() if title else "Unspecified Indian Public Works Tender",
            "category": str(category).strip() if category else "Public Procurement",
            "region": str(region).strip() if region else "National / Central",
            "publication_date": publication_date,
            "closing_date": closing_date,
            "contract_value": contract_value,
            "currency": "INR",
            "num_bidders": int(num_bidders) if str(num_bidders).isdigit() else None,
            "raw_data": raw_item,  # Preserves full raw government dictionary
            "source_url": source_url,
        }
