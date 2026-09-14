"""Explainable deterministic procurement anomaly rules."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional

import numpy as np
import pandas as pd

import sys
from pathlib import Path

# Ensure backend root is in sys.path for direct script and standalone execution
_BACKEND_DIR = str(Path(__file__).resolve().parent)
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

try:
    from .bidder_patterns import (
        PatternContext,
        detect_repeated_bidder_groups,
        find_similar_bidding_vendors,
    )
except ImportError:
    from bidder_patterns import (
        PatternContext,
        detect_repeated_bidder_groups,
        find_similar_bidding_vendors,
    )


@dataclass
class RuleConfig:
    weight_high_win_rate: float = 20.0
    weight_repeated_bidders: float = 20.0
    weight_price_anomaly: float = 20.0
    weight_low_bids: float = 15.0
    weight_post_award: float = 15.0
    weight_similar_bids: float = 10.0

    anomaly_score_threshold: float = 20.0

    min_previous_participations: int = 5
    min_previous_tenders: int = 5  # Backwards compatibility alias
    win_rate_threshold: float = 0.65

    low_bidders_open: int = 2
    low_bidders_restricted: int = 1

    market_ratio_high: float = 1.35
    market_ratio_low: float = 0.55
    tender_ratio_high: float = 1.25

    post_award_pct_threshold: float = 20.0

    repeated_bidders_lookback_months: int = 24
    repeated_bidders_min_shared: int = 3
    repeated_bidders_jaccard: float = 0.80

    similar_bids_min_shared: int = 3
    similar_bids_corr: float = 0.90


@dataclass
class RuleResult:
    rule: str
    triggered: bool
    score: float
    reason: str


@dataclass
class TenderAssessment:
    tender_id: str
    rule_score: float
    anomaly_flag: bool
    triggered_rules: List[str] = field(default_factory=list)
    explanations: List[str] = field(default_factory=list)
    rule_details: List[RuleResult] = field(default_factory=list)


def _build_category_p10(df: pd.DataFrame, percentile: float = 0.10) -> dict:
    return {
        cat: float(grp.quantile(percentile))
        for cat, grp in df.groupby("category")["num_bidders"]
    }


def rule_high_win_rate(row: pd.Series, cfg: RuleConfig) -> RuleResult:
    """Detect vendors winning an unusually high percentage of participated tenders."""
    prev_p = int(row.get("previous_participations", row.get("previous_tenders", 0)))
    prev_w = int(row.get("previous_wins", 0))
    rate = row.get("vendor_win_rate")

    min_p = getattr(cfg, "min_previous_participations", getattr(cfg, "min_previous_tenders", 5))

    triggered = (
        prev_p >= min_p
        and pd.notna(rate)
        and rate >= cfg.win_rate_threshold
    )
    score = cfg.weight_high_win_rate if triggered else 0.0
    pct = f"{rate:.0%}" if pd.notna(rate) else "N/A"
    reason = (
        f"Vendor {row['vendor_id']} won {prev_w} of its previous {prev_p} participations "
        f"({pct} win rate) — suspicious pattern requiring investigation."
        if triggered
        else f"Vendor {row['vendor_id']} win rate within normal bounds ({prev_w} wins / {prev_p} participations)."
    )
    return RuleResult("high_vendor_win_rate", triggered, score, reason)


def rule_price_anomaly(row: pd.Series, cfg: RuleConfig) -> RuleResult:
    """Detect significant bid deviations from market or budget benchmarks."""
    btm = row.get("bid_to_market_ratio")
    btt = row.get("bid_to_tender_ratio")
    triggered = False
    parts = []

    if pd.notna(btm) and btm > cfg.market_ratio_high:
        triggered = True
        parts.append(f"bid is {btm:.0%} of estimated market value (high)")
    if pd.notna(btm) and btm < cfg.market_ratio_low:
        triggered = True
        parts.append(f"bid is {btm:.0%} of estimated market value (low)")
    if pd.notna(btt) and btt > cfg.tender_ratio_high:
        triggered = True
        parts.append(f"bid is {btt:.0%} of tender estimate (high)")

    score = cfg.weight_price_anomaly if triggered else 0.0
    reason = (
        "Price anomaly: " + "; ".join(parts) + " — requires investigation."
        if triggered
        else "Bid amount aligns with tender and market benchmarks."
    )
    return RuleResult("price_anomaly", triggered, score, reason)


def rule_low_bid_participation(
    row: pd.Series,
    cfg: RuleConfig,
    category_p10: dict,
) -> RuleResult:
    """Detect tenders receiving suspiciously few bids."""
    method = str(row.get("procurement_method", "open")).lower()
    n = int(row.get("num_bidders", 0))
    cat_thr = category_p10.get(row["category"], 2.0)

    method_thr = (
        cfg.low_bidders_restricted if method == "restricted" else cfg.low_bidders_open
    )
    triggered = n <= method_thr or n < cat_thr

    score = cfg.weight_low_bids if triggered else 0.0
    reason = (
        f"Only {n} vendor(s) participated in this {method} tender "
        f"(category 10th percentile = {cat_thr:.0f}) — requires investigation."
        if triggered
        else f"Bid participation ({n}) appears normal for this category/method."
    )
    return RuleResult("low_bid_participation", triggered, score, reason)


def rule_post_award_change(row: pd.Series, cfg: RuleConfig) -> RuleResult:
    """Detect large variance between award value and final contract settlement."""
    pct = row.get("post_award_change_pct")
    triggered = pd.notna(pct) and abs(pct) >= cfg.post_award_pct_threshold
    score = cfg.weight_post_award if triggered else 0.0

    if triggered:
        direction = "increased" if pct > 0 else "decreased"
        reason = (
            f"Final contract value {direction} by {abs(pct):.1f}% after award "
            f"(award={row['award_value']:.2f}, final={row['final_contract_value']:.2f}) "
            f"— requires investigation."
        )
    else:
        reason = "Post-award contract value change within expected range."

    return RuleResult("post_award_contract_change", triggered, score, reason)


def assess_tender(
    df: pd.DataFrame,
    tender_id: str,
    cfg: Optional[RuleConfig] = None,
    *,
    category_p10: Optional[dict] = None,
    context: Optional[PatternContext] = None,
) -> TenderAssessment:
    """Assess an individual tender across all six anomaly detection rules."""
    cfg = cfg or RuleConfig()
    row = df.loc[df["tender_id"] == tender_id].iloc[0]
    p10 = category_p10 if category_p10 is not None else _build_category_p10(df)

    results: List[RuleResult] = [
        rule_high_win_rate(row, cfg),
        rule_price_anomaly(row, cfg),
        rule_low_bid_participation(row, cfg, p10),
        rule_post_award_change(row, cfg),
    ]

    co = detect_repeated_bidder_groups(
        df,
        tender_id,
        lookback_months=cfg.repeated_bidders_lookback_months,
        min_occurrences=cfg.repeated_bidders_min_shared,
        jaccard_threshold=cfg.repeated_bidders_jaccard,
        context=context,
    )
    results.append(
        RuleResult(
            "repeated_bidder_relationship",
            co.triggered,
            cfg.weight_repeated_bidders if co.triggered else 0.0,
            co.reason,
        )
    )

    sim_triggered, _, sim_reason, _ = find_similar_bidding_vendors(
        df,
        tender_id,
        min_shared_tenders=cfg.similar_bids_min_shared,
        corr_threshold=cfg.similar_bids_corr,
        context=context,
    )
    results.append(
        RuleResult(
            "similar_bidding_pattern",
            sim_triggered,
            cfg.weight_similar_bids if sim_triggered else 0.0,
            sim_reason,
        )
    )

    total = min(100.0, sum(r.score for r in results))
    triggered = [r.rule for r in results if r.triggered]
    explanations = [r.reason for r in results if r.triggered]

    return TenderAssessment(
        tender_id=tender_id,
        rule_score=round(total, 1),
        anomaly_flag=total >= cfg.anomaly_score_threshold,
        triggered_rules=triggered,
        explanations=explanations,
        rule_details=results,
    )


def run_rules_on_dataset(
    df: pd.DataFrame, cfg: Optional[RuleConfig] = None
) -> pd.DataFrame:
    """
    Run complete rule evaluation pipeline over dataset with optimized indexing.
    Eliminates O(N^2) scans and guarantees zero temporal leakage.
    """
    cfg = cfg or RuleConfig()
    category_p10 = _build_category_p10(df)
    context = PatternContext.from_dataframe(
        df,
        lookback_months=cfg.repeated_bidders_lookback_months,
        min_cobid_occurrences=cfg.repeated_bidders_min_shared,
        jaccard_threshold=cfg.repeated_bidders_jaccard,
        min_shared_similarity_tenders=cfg.similar_bids_min_shared,
        corr_threshold=cfg.similar_bids_corr,
    )

    n = len(df)
    tids = df["tender_id"].tolist()
    vids = df["vendor_id"].tolist()
    cats = df["category"].tolist()
    methods = df["procurement_method"].tolist()
    num_bids = df["num_bidders"].tolist()
    btms = df["bid_to_market_ratio"].tolist()
    btts = df["bid_to_tender_ratio"].tolist()
    pcts = df["post_award_change_pct"].tolist()
    awards = df["award_value"].tolist()
    finals = df["final_contract_value"].tolist()
    prev_ps = (
        df["previous_participations"].tolist()
        if "previous_participations" in df.columns
        else (df["previous_tenders"].tolist() if "previous_tenders" in df.columns else [0] * n)
    )
    prev_ws = df["previous_wins"].tolist() if "previous_wins" in df.columns else [0] * n
    win_rates = df["vendor_win_rate"].tolist() if "vendor_win_rate" in df.columns else [np.nan] * n

    records = []
    min_p = getattr(cfg, "min_previous_participations", getattr(cfg, "min_previous_tenders", 5))

    for i in range(n):
        tid = tids[i]
        vid = vids[i]
        cat = cats[i]
        method = str(methods[i]).lower()
        nb = num_bids[i]
        btm = btms[i]
        btt = btts[i]
        pct = pcts[i]
        av = awards[i]
        fv = finals[i]
        pp = prev_ps[i]
        pw = prev_ws[i]
        wr = win_rates[i]

        results: List[RuleResult] = []

        # 1. High win rate
        r1_trig = pp >= min_p and pd.notna(wr) and wr >= cfg.win_rate_threshold
        r1_score = cfg.weight_high_win_rate if r1_trig else 0.0
        r1_pct = f"{wr:.0%}" if pd.notna(wr) else "N/A"
        r1_reason = (
            f"Vendor {vid} won {pw} of its previous {pp} participations "
            f"({r1_pct} win rate) — suspicious pattern requiring investigation."
            if r1_trig
            else f"Vendor {vid} win rate within normal bounds ({pw} wins / {pp} participations)."
        )
        results.append(RuleResult("high_vendor_win_rate", r1_trig, r1_score, r1_reason))

        # 2. Price anomaly
        r3_trig = False
        r3_parts = []
        if pd.notna(btm) and btm > cfg.market_ratio_high:
            r3_trig = True
            r3_parts.append(f"bid is {btm:.0%} of estimated market value (high)")
        if pd.notna(btm) and btm < cfg.market_ratio_low:
            r3_trig = True
            r3_parts.append(f"bid is {btm:.0%} of estimated market value (low)")
        if pd.notna(btt) and btt > cfg.tender_ratio_high:
            r3_trig = True
            r3_parts.append(f"bid is {btt:.0%} of tender estimate (high)")
        r3_score = cfg.weight_price_anomaly if r3_trig else 0.0
        r3_reason = (
            "Price anomaly: " + "; ".join(r3_parts) + " — requires investigation."
            if r3_trig
            else "Bid amount aligns with tender and market benchmarks."
        )
        results.append(RuleResult("price_anomaly", r3_trig, r3_score, r3_reason))

        # 3. Low bid count
        cat_thr = category_p10.get(cat, 2.0)
        method_thr = cfg.low_bidders_restricted if method == "restricted" else cfg.low_bidders_open
        r4_trig = nb <= method_thr or nb < cat_thr
        r4_score = cfg.weight_low_bids if r4_trig else 0.0
        r4_reason = (
            f"Only {nb} vendor(s) participated in this {method} tender "
            f"(category 10th percentile = {cat_thr:.0f}) — requires investigation."
            if r4_trig
            else f"Bid participation ({nb}) appears normal for this category/method."
        )
        results.append(RuleResult("low_bid_participation", r4_trig, r4_score, r4_reason))

        # 4. Post-award change
        r5_trig = pd.notna(pct) and abs(pct) >= cfg.post_award_pct_threshold
        r5_score = cfg.weight_post_award if r5_trig else 0.0
        if r5_trig:
            direction = "increased" if pct > 0 else "decreased"
            r5_reason = (
                f"Final contract value {direction} by {abs(pct):.1f}% after award "
                f"(award={av:.2f}, final={fv:.2f}) — requires investigation."
            )
        else:
            r5_reason = "Post-award contract value change within expected range."
        results.append(RuleResult("post_award_contract_change", r5_trig, r5_score, r5_reason))

        # 5. Repeated bidder relationship
        co = context.cobidder_results.get(tid)
        if co is not None:
            results.append(RuleResult("repeated_bidder_relationship", co.triggered, co.score, co.reason))
        else:
            co_calc = detect_repeated_bidder_groups(df, tid, context=context)
            results.append(RuleResult("repeated_bidder_relationship", co_calc.triggered, co_calc.score, co_calc.reason))

        # 6. Similar bidding pattern
        sim = context.similarity_results.get(tid)
        if sim is not None:
            results.append(RuleResult("similar_bidding_pattern", sim.triggered, sim.score, sim.reason))
        else:
            s_trig, s_score, s_reason, _ = find_similar_bidding_vendors(df, tid, context=context)
            results.append(RuleResult("similar_bidding_pattern", s_trig, s_score, s_reason))

        total = min(100.0, sum(r.score for r in results))
        triggered = [r.rule for r in results if r.triggered]
        explanations = [r.reason for r in results if r.triggered]

        records.append(
            {
                "tender_id": tid,
                "rule_score": round(total, 1),
                "anomaly_flag": total >= cfg.anomaly_score_threshold,
                "triggered_rules": "|".join(triggered),
                "explanations": " || ".join(explanations),
            }
        )

    return pd.DataFrame(records)
