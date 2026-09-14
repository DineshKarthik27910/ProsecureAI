"""Repeated co-bidder detection and similar bidding pattern analysis."""

from __future__ import annotations

from collections import Counter, defaultdict
from dataclasses import dataclass, field
from itertools import combinations
from typing import Dict, List, Optional, Set, Tuple

import numpy as np
import pandas as pd


def parse_bidders(bidder_ids: str) -> Set[str]:
    """Parse pipe-separated bidder IDs into a set of vendor strings."""
    if not isinstance(bidder_ids, str) or not bidder_ids.strip():
        return set()
    return {b.strip() for b in bidder_ids.split("|") if b.strip()}


def parse_bids(bids_str: str) -> Dict[str, float]:
    """Parse pipe-separated vendor:bid_amount pairs into a dict."""
    if not isinstance(bids_str, str) or not bids_str.strip():
        return {}
    out: Dict[str, float] = {}
    for part in bids_str.split("|"):
        part = part.strip()
        if ":" in part:
            vendor, amt = part.split(":", 1)
            try:
                out[vendor.strip()] = float(amt.strip())
            except ValueError:
                continue
    return out


def jaccard(a: Set[str], b: Set[str]) -> float:
    """Compute Jaccard similarity between two sets."""
    if not a and not b:
        return 1.0
    union = a | b
    if not union:
        return 0.0
    return len(a & b) / len(union)


def compute_pearson_corr(x: List[float], y: List[float]) -> float:
    """Compute Pearson correlation with robust handling of zero-variance cases."""
    if len(x) < 2 or len(x) != len(y):
        return 0.0
    arr_x = np.array(x, dtype=float)
    arr_y = np.array(y, dtype=float)
    std_x = float(np.std(arr_x))
    std_y = float(np.std(arr_y))

    # Constant bids or rigid markup indicates collusion
    if std_x < 1e-6 and std_y < 1e-6:
        return 1.0
    if std_x < 1e-6 or std_y < 1e-6:
        return 0.0

    corr = float(np.corrcoef(arr_x, arr_y)[0, 1])
    if np.isnan(corr):
        return 0.0
    return max(-1.0, min(1.0, corr))


@dataclass
class CoBidderResult:
    triggered: bool
    score: float
    reason: str
    repeated_groups: List[Tuple[str, ...]] = field(default_factory=list)
    pair_counts: Dict[Tuple[str, str], int] = field(default_factory=dict)


@dataclass
class SimilarityResult:
    triggered: bool
    score: float
    reason: str
    similar_pairs: List[Tuple[str, str, float]] = field(default_factory=list)


@dataclass
class PatternContext:
    """
    Precomputed structures to avoid repeated full-dataset scans and ensure
    strict zero-leakage historical evaluation on 10,000+ tenders.
    """

    bidder_sets: Dict[str, Set[str]] = field(default_factory=dict)
    cobidder_results: Dict[str, CoBidderResult] = field(default_factory=dict)
    similarity_results: Dict[str, SimilarityResult] = field(default_factory=dict)

    @classmethod
    def from_dataframe(
        cls,
        df: pd.DataFrame,
        *,
        lookback_months: int = 24,
        min_cobid_occurrences: int = 3,
        jaccard_threshold: float = 0.80,
        min_shared_similarity_tenders: int = 3,
        corr_threshold: float = 0.90,
    ) -> "PatternContext":
        ctx = cls()
        sorted_df = df.sort_values(["tender_date", "tender_id"]).copy().reset_index(drop=True)

        n = len(sorted_df)
        tids = sorted_df["tender_id"].tolist()
        cats = sorted_df["category"].tolist()
        tvs = sorted_df["tender_value"].tolist()
        bids_raw = (
            sorted_df["bids"].tolist()
            if "bids" in sorted_df.columns
            else [""] * n
        )
        vids = sorted_df["vendor_id"].tolist() if "vendor_id" in sorted_df.columns else [""] * n
        bid_amts = sorted_df["bid_amount"].tolist() if "bid_amount" in sorted_df.columns else [0.0] * n
        bidder_ids_list = sorted_df["bidder_ids"].tolist()

        parsed_bsets = [parse_bidders(s) for s in bidder_ids_list]
        for tid, bset in zip(tids, parsed_bsets):
            ctx.bidder_sets[tid] = bset

        # Fast inverted index for Rule 2: (category, vendor) -> list of (date, tid, bidder_set)
        vendor_cat_history: Dict[Tuple[str, str], List[Tuple[pd.Timestamp, str, Set[str]]]] = defaultdict(list)
        # Category list for fallback: cat -> list of (date, tid, bidder_set)
        cat_history: Dict[str, List[Tuple[pd.Timestamp, str, Set[str]]]] = defaultdict(list)

        # Pair co-bidding ratio history: (vendorA, vendorB) -> list of (ratioA, ratioB)
        pair_ratio_history: Dict[Tuple[str, str], List[Tuple[float, float]]] = defaultdict(list)
        pair_corr_cache: Dict[Tuple[str, str], Tuple[int, float]] = {}

        dates = pd.to_datetime(sorted_df["tender_date"]).values
        unique_dates = sorted(list(set(dates)))

        for d_val in unique_dates:
            d_ts = pd.Timestamp(d_val)
            cutoff_24m = d_ts - pd.DateOffset(months=lookback_months)
            idxs = np.where(dates == d_val)[0]

            # 1. Evaluate all tenders on date D using strictly prior tenders (tender_date < D)
            for idx in idxs:
                tid = tids[idx]
                cat = cats[idx]
                current_bidders = parsed_bsets[idx]
                n_curr = len(current_bidders)

                # --- Rule 2: Repeated Bidder Groups ---
                # To achieve Jaccard >= 0.80, candidate tender must overlap at least ceil(0.8 * n_curr)
                # For n_curr <= 4, must overlap all; for n_curr >= 5, can miss at most 1 bidder.
                # Thus, candidate MUST contain at least one of the 2 rarest bidders in current_bidders.
                if n_curr > 0:
                    sorted_by_freq = sorted(
                        current_bidders,
                        key=lambda v: len(vendor_cat_history.get((cat, v), [])),
                    )
                    rare_vendors = sorted_by_freq[: min(2, len(sorted_by_freq))]
                    candidate_dict: Dict[str, Tuple[pd.Timestamp, Set[str]]] = {}
                    for rv in rare_vendors:
                        for t_date, p_tid, p_bset in vendor_cat_history.get((cat, rv), []):
                            if cutoff_24m <= t_date < d_ts and p_tid != tid:
                                candidate_dict[p_tid] = (t_date, p_bset)
                    candidates = candidate_dict.values()
                else:
                    candidates = []

                similar_count = 0
                matched_groups: List[Tuple[str, ...]] = []
                pair_counter: Counter = Counter()

                for _, hset in candidates:
                    if jaccard(current_bidders, hset) >= jaccard_threshold:
                        similar_count += 1
                        matched = tuple(sorted(hset & current_bidders))
                        matched_groups.append(matched)
                        for pair in combinations(matched, 2):
                            pair_counter[pair] += 1

                cobid_triggered = similar_count >= min_cobid_occurrences
                top_pairs = pair_counter.most_common(3)
                pair_text = (
                    ", ".join([f"{a}-{b} ({c}x)" for (a, b), c in top_pairs])
                    if top_pairs
                    else "none"
                )
                cobid_reason = (
                    f"Tender {tid}: bidder set closely matched {similar_count} prior tenders "
                    f"in {cat} within 24 months (Jaccard >= {jaccard_threshold:.0%}). "
                    f"Repeated pairs: {pair_text}."
                    if cobid_triggered
                    else f"Tender {tid}: normal bidder relationship in {cat}."
                )
                cobid_score = min(20.0, similar_count * 5.0) if cobid_triggered else 0.0

                ctx.cobidder_results[tid] = CoBidderResult(
                    triggered=cobid_triggered,
                    score=cobid_score,
                    reason=cobid_reason,
                    repeated_groups=list(set(matched_groups)),
                    pair_counts=dict(pair_counter),
                )

                # --- Rule 6: Similar Bidding Patterns ---
                similar_pairs: List[Tuple[str, str, float]] = []
                bidders_list = sorted(list(current_bidders))
                for a, b in combinations(bidders_list, 2):
                    pair_key = (a, b) if a < b else (b, a)
                    history = pair_ratio_history.get(pair_key, [])
                    hist_len = len(history)
                    if hist_len < min_shared_similarity_tenders:
                        continue

                    # Check correlation cache
                    cached = pair_corr_cache.get(pair_key)
                    if cached is not None and cached[0] == hist_len:
                        corr = cached[1]
                    else:
                        r_a = [h[0] if a < b else h[1] for h in history]
                        r_b = [h[1] if a < b else h[0] for h in history]
                        corr = compute_pearson_corr(r_a, r_b)
                        pair_corr_cache[pair_key] = (hist_len, corr)

                    if corr >= corr_threshold:
                        similar_pairs.append((a, b, corr))

                sim_triggered = len(similar_pairs) > 0
                sim_score = 10.0 if sim_triggered else 0.0
                if sim_triggered:
                    desc = "; ".join([f"{a} & {b} (r={c:.2f})" for a, b, c in similar_pairs[:3]])
                    sim_reason = (
                        f"Tender {tid}: suspiciously similar normalized bidding patterns among "
                        f"vendor pairs: {desc}."
                    )
                else:
                    sim_reason = (
                        f"Tender {tid}: no highly correlated bidding patterns detected "
                        f"among participants."
                    )

                ctx.similarity_results[tid] = SimilarityResult(
                    triggered=sim_triggered,
                    score=sim_score,
                    reason=sim_reason,
                    similar_pairs=similar_pairs,
                )

            # 2. Update historical state with all tenders on date D
            for idx in idxs:
                tid = tids[idx]
                cat = cats[idx]
                current_bidders = parsed_bsets[idx]
                tv = float(tvs[idx])

                item = (d_ts, tid, current_bidders)
                cat_history[cat].append(item)
                for v in current_bidders:
                    vendor_cat_history[(cat, v)].append(item)

                bids_dict = parse_bids(str(bids_raw[idx]))
                if not bids_dict and vids[idx] and bid_amts[idx] > 0:
                    bids_dict[vids[idx]] = float(bid_amts[idx])

                if tv > 0 and bids_dict:
                    bidders_list = sorted(list(current_bidders))
                    for a, b in combinations(bidders_list, 2):
                        if a in bids_dict and b in bids_dict:
                            pair_key = (a, b) if a < b else (b, a)
                            r_a = bids_dict[pair_key[0]] / tv
                            r_b = bids_dict[pair_key[1]] / tv
                            pair_ratio_history[pair_key].append((r_a, r_b))

        return ctx


def detect_repeated_bidder_groups(
    df: pd.DataFrame,
    tender_id: str,
    *,
    lookback_months: int = 24,
    min_occurrences: int = 3,
    jaccard_threshold: float = 0.80,
    context: Optional[PatternContext] = None,
) -> CoBidderResult:
    """
    Detect repeated co-bidding patterns.
    Uses precomputed PatternContext if available, or computes directly on df
    strictly using prior tenders (tender_date < current_date).
    """
    if context is not None and tender_id in context.cobidder_results:
        return context.cobidder_results[tender_id]

    row = df.loc[df["tender_id"] == tender_id].iloc[0]
    current_date = pd.Timestamp(row["tender_date"])
    category = row["category"]
    current = parse_bidders(row["bidder_ids"])

    cutoff = current_date - pd.DateOffset(months=lookback_months)
    hist = df[
        (df["tender_date"] < current_date)
        & (df["tender_date"] >= cutoff)
        & (df["category"] == category)
        & (df["tender_id"] != tender_id)
    ]

    similar_count = 0
    pair_counter: Counter = Counter()
    matched_groups: List[Tuple[str, ...]] = []

    for _, h in hist.iterrows():
        hset = parse_bidders(h["bidder_ids"])
        if jaccard(current, hset) >= jaccard_threshold:
            similar_count += 1
            matched = tuple(sorted(hset & current))
            matched_groups.append(matched)
            for pair in combinations(matched, 2):
                pair_counter[pair] += 1

    triggered = similar_count >= min_occurrences
    top_pairs = pair_counter.most_common(3)
    pair_text = (
        ", ".join([f"{a}-{b} ({c}x)" for (a, b), c in top_pairs])
        if top_pairs
        else "none"
    )

    reason = (
        f"Tender {tender_id}: bidder set closely matched {similar_count} prior tenders "
        f"in {category} within 24 months (Jaccard >= {jaccard_threshold:.0%}). "
        f"Repeated pairs: {pair_text}."
        if triggered
        else f"Tender {tender_id}: normal bidder relationship in {category}."
    )

    score = min(20.0, similar_count * 5.0) if triggered else 0.0
    return CoBidderResult(
        triggered=triggered,
        score=score,
        reason=reason,
        repeated_groups=list(set(matched_groups)),
        pair_counts=dict(pair_counter),
    )


def find_similar_bidding_vendors(
    df: pd.DataFrame,
    tender_id: str,
    *,
    min_shared_tenders: int = 3,
    corr_threshold: float = 0.90,
    context: Optional[PatternContext] = None,
) -> Tuple[bool, float, str, List[Tuple[str, str, float]]]:
    """
    Detect vendor pairs with suspiciously correlated bidding behavior.
    Uses actual synthetic bids from dataset across strictly prior shared tenders.
    """
    if context is not None and tender_id in context.similarity_results:
        res = context.similarity_results[tender_id]
        return res.triggered, res.score, res.reason, res.similar_pairs

    row = df.loc[df["tender_id"] == tender_id].iloc[0]
    current_date = pd.Timestamp(row["tender_date"])
    participants = sorted(list(parse_bidders(row["bidder_ids"])))

    hist = df[(df["tender_date"] < current_date) & (df["tender_id"] != tender_id)]

    shared_ratios: Dict[Tuple[str, str], List[Tuple[float, float]]] = defaultdict(list)

    for _, h in hist.iterrows():
        tv = float(h["tender_value"])
        if tv <= 0:
            continue
        h_bids = parse_bids(str(h.get("bids", "")))
        if not h_bids and "vendor_id" in h and "bid_amount" in h:
            h_bids[h["vendor_id"]] = float(h["bid_amount"])

        h_bidders = parse_bidders(h["bidder_ids"])
        for a, b in combinations(participants, 2):
            if a in h_bidders and b in h_bidders:
                pair = (a, b) if a < b else (b, a)
                if a in h_bids and b in h_bids:
                    r_a = h_bids[a] / tv
                    r_b = h_bids[b] / tv
                    shared_ratios[pair].append((r_a, r_b))

    similar_pairs: List[Tuple[str, str, float]] = []
    for a, b in combinations(participants, 2):
        pair = (a, b) if a < b else (b, a)
        history = shared_ratios.get(pair, [])
        if len(history) < min_shared_tenders:
            continue
        r_a = [h[0] for h in history]
        r_b = [h[1] for h in history]
        corr = compute_pearson_corr(r_a, r_b)
        if corr >= corr_threshold:
            similar_pairs.append((a, b, corr))

    triggered = len(similar_pairs) > 0
    score = 10.0 if triggered else 0.0
    if triggered:
        desc = "; ".join([f"{a} & {b} (r={c:.2f})" for a, b, c in similar_pairs[:3]])
        reason = (
            f"Tender {tender_id}: suspiciously similar normalized bidding patterns among "
            f"vendor pairs: {desc}."
        )
    else:
        reason = (
            f"Tender {tender_id}: no highly correlated bidding patterns detected "
            f"among participants."
        )

    return triggered, score, reason, similar_pairs
