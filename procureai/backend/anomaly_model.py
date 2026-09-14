"""
ProcureAI - ML anomaly detection layer.

Uses Isolation Forest to identify procurement tenders whose numerical
feature combinations are unusual compared with the rest of the dataset.
This is an investigation signal, not a fraud verdict.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
try:
    from sklearn.ensemble import IsolationForest
    from sklearn.preprocessing import MinMaxScaler
    _BACKEND_MODEL = "scikit-learn"
except (ImportError, OSError) as err:
    print(
        f"[ProcureAI ML] Note: scikit-learn unavailable ({type(err).__name__}: {err}); "
        f"using pure-NumPy Isolation Forest fallback (Liu et al. 2008)."
    )
    from pure_isolation_forest import (
        PureIsolationForest as IsolationForest,
        PureMinMaxScaler as MinMaxScaler,
    )
    _BACKEND_MODEL = "pure-numpy-fallback"


FEATURES = [
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


def _prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    """Prepare only the numeric features used by the ML model."""
    missing = [col for col in FEATURES if col not in df.columns]
    if missing:
        raise ValueError(
            "Missing ML feature columns: " + ", ".join(missing)
        )

    X = df[FEATURES].copy()

    # Convert anything numeric-looking and safely handle bad/infinite values.
    for col in FEATURES:
        X[col] = pd.to_numeric(X[col], errors="coerce")

    X = X.replace([np.inf, -np.inf], np.nan)

    # Median imputation keeps the model from failing on occasional missing data.
    X = X.fillna(X.median(numeric_only=True))
    X = X.fillna(0)

    return X


def detect_anomalies(
    df: pd.DataFrame,
    contamination: float = 0.12,
    n_estimators: int = 200,
    random_state: int = 42,
) -> pd.DataFrame:
    """
    Detect unusual tenders using Isolation Forest.

    Returns a DataFrame aligned to df.index with:
      - ml_anomaly: True when Isolation Forest flags the tender
      - ml_anomaly_score: 0-100, where higher means more unusual
    """
    if df.empty:
        return pd.DataFrame(
            index=df.index,
            columns=["ml_anomaly", "ml_anomaly_score"],
        )

    if not 0 < contamination < 0.5:
        raise ValueError("contamination must be between 0 and 0.5")

    X = _prepare_features(df)
    print(f"[ProcureAI ML] Running Isolation Forest anomaly detection engine ({_BACKEND_MODEL})...")

    model = IsolationForest(
        n_estimators=n_estimators,
        contamination=contamination,
        random_state=random_state,
        n_jobs=-1,
    )
    model.fit(X)

    predictions = model.predict(X)
    raw_anomaly = -model.decision_function(X)

    # Convert the model's relative anomaly signal into a readable 0-100 score.
    scaler = MinMaxScaler(feature_range=(0, 100))
    scores = scaler.fit_transform(raw_anomaly.reshape(-1, 1)).ravel()

    result = pd.DataFrame(index=df.index)
    result["ml_anomaly"] = predictions == -1
    result["ml_anomaly_score"] = np.round(np.clip(scores, 0, 100), 2)

    return result


def evaluate_dataset(
    df: pd.DataFrame,
    contamination: float = 0.12,
) -> pd.DataFrame:
    """Convenience wrapper used by the end-to-end pipeline."""
    return detect_anomalies(
        df,
        contamination=contamination,
    )
