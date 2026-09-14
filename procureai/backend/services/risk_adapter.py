"""Adapter layer between LiveProcurementRecord and ProcureAI risk engine.

Inspects incoming live records, checks mathematical and contextual prerequisites,
and explicitly flags missing signals without fabricating or hallucinating data.
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional

from database.models import LiveProcurementRecord


# The 13 numerical dimensions required by Isolation Forest (anomaly_model.py)
ML_REQUIRED_FEATURES = [
    "num_bidders",
    "tender_value",
    "estimated_market_value",
    "bid_amount",
    "award_value",
    "final_contract_value",
    "contract_duration_months",
    "previous_participations",
    "previous_wins",
    "vendor_win_rate",
    "post_award_change_pct",
    "bid_to_tender_ratio",
    "bid_to_market_ratio",
]

# Required inputs for each of the 6 deterministic heuristic rules (anomaly_rules.py)
RULE_REQUIREMENTS: Dict[str, List[str]] = {
    "rule_high_win_rate": ["previous_participations", "previous_wins", "vendor_win_rate"],
    "rule_repeated_bidders": ["bidder_ids", "historical_co_bidding_graph"],
    "rule_price_anomaly": ["bid_amount", "tender_value", "estimated_market_value"],
    "rule_low_bid_count": ["num_bidders", "procurement_method"],
    "rule_post_award_change": ["award_value", "final_contract_value", "post_award_change_pct"],
    "rule_similar_bids": ["bids", "historical_price_correlation"],
}


@dataclass
class RiskCompatibilityReport:
    """Detailed audit of live record feature completeness against ProcureAI risk engine."""

    live_record_id: int
    tender_id: Optional[str]
    status: str  # 'insufficient_data', 'partial_rules_only', 'compatible'
    can_run_ml: bool
    can_run_full_hybrid: bool
    executable_rules: List[str] = field(default_factory=list)
    missing_ml_features: List[str] = field(default_factory=list)
    missing_rule_features: Dict[str, List[str]] = field(default_factory=dict)
    mapped_features: Dict[str, Any] = field(default_factory=dict)
    reason: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class RiskAdapter:
    """Evaluates LiveProcurementRecord against the strict feature contracts of ProcureAI."""

    @staticmethod
    def inspect_record(record: LiveProcurementRecord) -> RiskCompatibilityReport:
        """Inspect a live record, map available fields, and detect missing parameters."""
        raw_payload: Dict[str, Any] = {}
        if record.raw_data:
            try:
                raw_payload = json.loads(record.raw_data)
                if not isinstance(raw_payload, dict):
                    raw_payload = {}
            except (json.JSONDecodeError, TypeError):
                raw_payload = {}

        # 1. Map directly available attributes
        mapped: Dict[str, Any] = {
            "tender_id": record.tender_id,
            "vendor_id": record.vendor_id,
            "vendor_name": record.vendor_name,
            "category": record.category,
            "region": record.region,
            "currency": record.currency,
            "contract_value": record.contract_value,
        }

        # 2. Extract any stage parameters present in raw_data
        if "procurement_method" in raw_payload:
            mapped["procurement_method"] = raw_payload["procurement_method"]
        if "num_bidders" in raw_payload:
            mapped["num_bidders"] = raw_payload["num_bidders"]
        if "bids" in raw_payload:
            mapped["bids"] = raw_payload["bids"]
        if "tender_value" in raw_payload:
            mapped["tender_value"] = raw_payload["tender_value"]
        elif record.contract_value is not None:
            mapped["tender_value"] = record.contract_value

        # 3. Check ML feature completeness (Isolation Forest)
        missing_ml: List[str] = []
        for feature in ML_REQUIRED_FEATURES:
            if feature not in mapped or mapped[feature] is None:
                missing_ml.append(feature)

        can_run_ml = len(missing_ml) == 0

        # 4. Check Rule requirements
        executable_rules: List[str] = []
        missing_rule_features: Dict[str, List[str]] = {}

        for rule_name, reqs in RULE_REQUIREMENTS.items():
            missing_for_rule = [req for req in reqs if req not in mapped or mapped[req] is None]
            if missing_for_rule:
                missing_rule_features[rule_name] = missing_for_rule
            else:
                executable_rules.append(rule_name)

        # 5. Determine overall compatibility status
        can_run_full_hybrid = can_run_ml and len(executable_rules) == len(RULE_REQUIREMENTS)

        if can_run_full_hybrid:
            status = "compatible"
            reason = "Record contains all required dimensions for 60% rule + 40% Isolation Forest analysis."
        elif executable_rules and not can_run_ml:
            status = "partial_rules_only"
            reason = (
                f"Record has fields for {len(executable_rules)} heuristic rule(s), but lacks {len(missing_ml)} "
                "required dimensions for Isolation Forest ML. Missing dimensions must not be fabricated."
            )
        else:
            status = "insufficient_data"
            missing_summary = ", ".join(missing_ml[:4]) + ("..." if len(missing_ml) > 4 else "")
            reason = (
                f"Live record represents an early-stage notice lacking key forensic dimensions "
                f"(missing: {missing_summary}). Insufficient for certified risk scoring."
            )

        return RiskCompatibilityReport(
            live_record_id=record.id,
            tender_id=record.tender_id,
            status=status,
            can_run_ml=can_run_ml,
            can_run_full_hybrid=can_run_full_hybrid,
            executable_rules=executable_rules,
            missing_ml_features=missing_ml,
            missing_rule_features=missing_rule_features,
            mapped_features=mapped,
            reason=reason,
        )
