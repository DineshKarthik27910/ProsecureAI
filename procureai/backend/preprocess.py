"""Data preprocessing, validation, and derived feature calculation."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd


@dataclass
class PreprocessReport:
    rows_in: int = 0
    rows_out: int = 0
    duplicates_removed: int = 0
    invalid_rows_removed: int = 0
    missing_filled: Dict[str, int] = field(default_factory=dict)
    warnings: List[str] = field(default_factory=list)


def _parse_bidder_ids(series: pd.Series) -> pd.Series:
    return series.fillna("").astype(str).str.strip()


def _parse_bids_series(series: pd.Series) -> pd.Series:
    return series.fillna("").astype(str).str.strip()


def compute_derived_features(df: pd.DataFrame) -> pd.DataFrame:
    """Compute or validate derived features with strict temporal hygiene."""
    out = df.copy()

    # Backwards compatibility: map previous_tenders to previous_participations if needed
    if "previous_participations" not in out.columns and "previous_tenders" in out.columns:
        out["previous_participations"] = out["previous_tenders"]

    # If previous_participations is missing, compute chronologically without leakage (tender_date < D)
    if "previous_participations" not in out.columns or "previous_wins" not in out.columns:
        out = out.sort_values(["tender_date", "tender_id"]).reset_index(drop=True)
        participations_hist: Dict[str, int] = {}
        wins_hist: Dict[str, int] = {}

        prev_p_list: List[int] = [0] * len(out)
        prev_w_list: List[int] = [0] * len(out)

        dates = pd.to_datetime(out["tender_date"]).values
        unique_dates = sorted(list(set(dates)))

        for d in unique_dates:
            idxs = np.where(dates == d)[0]
            for idx in idxs:
                v = out.at[idx, "vendor_id"]
                prev_p_list[idx] = participations_hist.get(v, 0)
                prev_w_list[idx] = wins_hist.get(v, 0)

            for idx in idxs:
                bidders_str = str(out.at[idx, "bidder_ids"])
                bidders = [b.strip() for b in bidders_str.split("|") if b.strip()]
                for b in bidders:
                    participations_hist[b] = participations_hist.get(b, 0) + 1
                v = out.at[idx, "vendor_id"]
                wins_hist[v] = wins_hist.get(v, 0) + 1

        out["previous_participations"] = prev_p_list
        out["previous_wins"] = prev_w_list

    # Backwards compatibility mirror
    out["previous_tenders"] = out["previous_participations"]

    # Recompute / ensure correct win rate
    out["vendor_win_rate"] = np.where(
        out["previous_participations"] > 0,
        out["previous_wins"] / out["previous_participations"],
        np.nan,
    )
    out["post_award_change_pct"] = np.where(
        out["award_value"] > 0,
        (out["final_contract_value"] - out["award_value"]) / out["award_value"] * 100,
        np.nan,
    )
    out["bid_to_tender_ratio"] = np.where(
        out["tender_value"] > 0,
        out["bid_amount"] / out["tender_value"],
        np.nan,
    )
    out["bid_to_market_ratio"] = np.where(
        out["estimated_market_value"] > 0,
        out["bid_amount"] / out["estimated_market_value"],
        np.nan,
    )
    return out


def preprocess(df: pd.DataFrame) -> Tuple[pd.DataFrame, PreprocessReport]:
    report = PreprocessReport(rows_in=len(df))
    out = df.copy()

    out["tender_date"] = pd.to_datetime(out["tender_date"], errors="coerce")
    numeric_cols = [
        "num_bidders",
        "tender_value",
        "estimated_market_value",
        "bid_amount",
        "bid_rank",
        "award_value",
        "final_contract_value",
        "contract_duration_months",
        "previous_participations",
        "previous_tenders",
        "previous_wins",
    ]
    for col in numeric_cols:
        if col in out.columns:
            out[col] = pd.to_numeric(out[col], errors="coerce")

    out["bidder_ids"] = _parse_bidder_ids(out.get("bidder_ids", pd.Series(dtype=str)))
    if "bids" in out.columns:
        out["bids"] = _parse_bids_series(out["bids"])

    for col in ["category", "region", "procurement_method"]:
        if col in out.columns:
            n_miss = out[col].isna().sum()
            if n_miss:
                out[col] = out[col].fillna("Unknown")
                report.missing_filled[col] = int(n_miss)

    before = len(out)
    out = out.dropna(subset=["tender_id", "vendor_id", "tender_date", "award_value"])
    out = out[out["award_value"] > 0]
    out = out[out["tender_value"] > 0]
    report.invalid_rows_removed = before - len(out)

    dup_mask = out.duplicated(subset=["tender_id"], keep="first")
    report.duplicates_removed = int(dup_mask.sum())
    out = out[~dup_mask]

    def _count_bidders(s: str) -> int:
        if not s:
            return 0
        return len([x for x in s.split("|") if x.strip()])

    if "num_bidders" in out.columns:
        recomputed = out["bidder_ids"].map(_count_bidders)
        mismatch = (recomputed > 0) & (recomputed != out["num_bidders"])
        if mismatch.any():
            report.warnings.append(
                f"Fixed {mismatch.sum()} rows where num_bidders != len(bidder_ids)"
            )
            out.loc[mismatch, "num_bidders"] = recomputed[mismatch]

    out = compute_derived_features(out)
    out = out.sort_values(["tender_date", "tender_id"]).reset_index(drop=True)

    report.rows_out = len(out)
    return out, report
