"""
ProcureAI - Hybrid risk scoring engine.

Combines the teammate's explainable rule score with the ML anomaly score.
The final score is an investigation-priority indicator, not a probability
of fraud and not a legal/fraud verdict.
"""

from __future__ import annotations

import numpy as np
import pandas as pd


RULE_WEIGHT = 0.60
ML_WEIGHT = 0.40


def calculate_risk_score(rule_score: float, ml_score: float) -> float:
    """Combine rule and ML scores into a 0-100 final risk score."""
    rule_score = float(np.nan_to_num(rule_score, nan=0.0))
    ml_score = float(np.nan_to_num(ml_score, nan=0.0))

    score = (RULE_WEIGHT * rule_score) + (ML_WEIGHT * ml_score)

    return round(float(np.clip(score, 0, 100)), 2)


def classify_risk(score: float) -> str:
    """Convert a 0-100 investigation score into a risk category."""
    score = float(score)

    if score < 20:
        return "LOW"
    if score < 40:
        return "MODERATE"
    if score < 70:
        return "HIGH"
    return "CRITICAL"


def add_risk_scores(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add final hybrid score and risk level.

    Required columns:
      - rule_score
      - ml_anomaly_score

    Existing columns are preserved.
    """
    required = ["rule_score", "ml_anomaly_score"]
    missing = [col for col in required if col not in df.columns]

    if missing:
        raise ValueError(
            "Missing risk scoring columns: " + ", ".join(missing)
        )

    result = df.copy()

    result["rule_score"] = pd.to_numeric(
        result["rule_score"], errors="coerce"
    ).fillna(0)

    result["ml_anomaly_score"] = pd.to_numeric(
        result["ml_anomaly_score"], errors="coerce"
    ).fillna(0)

    result["final_risk_score"] = (
        RULE_WEIGHT * result["rule_score"]
        + ML_WEIGHT * result["ml_anomaly_score"]
    ).clip(0, 100).round(2)

    result["risk_level"] = result["final_risk_score"].apply(classify_risk)

    # Human-readable investigation status for the frontend/demo.
    result["investigation_status"] = np.where(
        result["final_risk_score"] >= 20,
        "REQUIRES INVESTIGATION",
        "LOW PRIORITY",
    )

    return result
