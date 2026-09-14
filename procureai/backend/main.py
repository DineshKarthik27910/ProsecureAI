"""End-to-end procurement anomaly detection pipeline.

Pipeline:
1. Load/generate procurement dataset
2. Preprocess data
3. Run explainable rule engine
4. Run Isolation Forest ML anomaly detection
5. Combine rule + ML scores into final risk score
6. Save complete scored output
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from generate_dataset import GeneratorConfig, generate_dataset
from preprocess import preprocess
from anomaly_rules import RuleConfig, assess_tender, run_rules_on_dataset
from anomaly_model import detect_anomalies
from risk_engine import add_risk_scores


DATA_PATH = ROOT / "procurement_dataset.csv"
OUTPUT_PATH = ROOT / "procurement_scored.csv"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--regenerate",
        action="store_true",
        help="Force regenerate dataset",
    )
    parser.add_argument(
        "--n",
        type=int,
        default=10_000,
        help="Number of tenders to generate",
    )
    args = parser.parse_args()

    # ---------------------------------------------------------
    # 1. Generate dataset if needed
    # ---------------------------------------------------------
    needs_generation = args.regenerate or not DATA_PATH.exists()

    if not needs_generation:
        preview = pd.read_csv(DATA_PATH, nrows=5)

        if (
            "previous_participations" not in preview.columns
            or "bids" not in preview.columns
        ):
            needs_generation = True

    if needs_generation:
        print(f"Generating synthetic dataset ({args.n} tenders)...")
        gen_start = time.time()

        cfg = GeneratorConfig(
            n_tenders=args.n,
            output_path=DATA_PATH,
        )

        df_gen = generate_dataset(cfg)
        DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
        df_gen.to_csv(DATA_PATH, index=False)

        print(
            f"Generated {len(df_gen)} records at {DATA_PATH} "
            f"in {time.time() - gen_start:.2f}s"
        )

    # ---------------------------------------------------------
    # 2. Load dataset
    # ---------------------------------------------------------
    print(f"Loading dataset from {DATA_PATH}...")

    raw = pd.read_csv(
        DATA_PATH,
        parse_dates=["tender_date"],
    )

    print(f"Raw records: {len(raw)}")

    # ---------------------------------------------------------
    # 3. Preprocessing
    # ---------------------------------------------------------
    prep_start = time.time()

    clean, report = preprocess(raw)

    print(
        f"Preprocessing completed in "
        f"{time.time() - prep_start:.2f}s:"
    )
    print(f"  Rows in: {report.rows_in}")
    print(f"  Rows out: {report.rows_out}")
    print(f"  Duplicates removed: {report.duplicates_removed}")
    print(f"  Invalid removed: {report.invalid_rows_removed}")

    if report.warnings:
        for warning in report.warnings:
            print(f"  Warning: {warning}")

    # ---------------------------------------------------------
    # 4. Explainable rule engine
    # ---------------------------------------------------------
    rule_cfg = RuleConfig()

    print("\nRunning explainable rule engine over dataset...")

    rule_start = time.time()

    rule_scores = run_rules_on_dataset(
        clean,
        rule_cfg,
    )

    rule_duration = time.time() - rule_start

    print(
        f"Rule evaluation completed in "
        f"{rule_duration:.2f}s "
        f"({len(rule_scores) / max(0.001, rule_duration):.0f} tenders/sec)"
    )

    # Add rule results to cleaned dataset
    final = clean.merge(
        rule_scores,
        on="tender_id",
        how="left",
    )

    # ---------------------------------------------------------
    # 5. ML anomaly detection - Isolation Forest
    # ---------------------------------------------------------
    print("\nRunning ML anomaly detection (Isolation Forest)...")

    ml_start = time.time()

    ml_results = detect_anomalies(
        clean,
        contamination=0.12,
        n_estimators=200,
        random_state=42,
    )

    ml_duration = time.time() - ml_start

    print(
        f"ML anomaly detection completed in "
        f"{ml_duration:.2f}s"
    )

    # ML results are aligned to clean.index
    final = final.join(ml_results)

    # ---------------------------------------------------------
    # 6. Hybrid risk scoring
    # ---------------------------------------------------------
    print("\nCombining rule score + ML score...")

    final = add_risk_scores(final)

    # ---------------------------------------------------------
    # 7. Save complete scored output
    # ---------------------------------------------------------
    final.to_csv(
        OUTPUT_PATH,
        index=False,
    )

    print(f"\nFull scored output saved to {OUTPUT_PATH}")

    # ---------------------------------------------------------
    # 8. Results summary
    # ---------------------------------------------------------
    rule_flagged = final[final["anomaly_flag"] == True]  # noqa: E712
    investigation = final[
        final["investigation_status"] == "REQUIRES INVESTIGATION"
    ]

    print("\nResults Summary:")
    print(f"  Total tenders: {len(final)}")
    print(
        f"  Rule-based investigations: "
        f"{len(rule_flagged)} "
        f"({len(rule_flagged) / len(final):.2%})"
    )
    print(
        f"  Final investigations: "
        f"{len(investigation)} "
        f"({len(investigation) / len(final):.2%})"
    )

    # Risk-level breakdown
    print("\nRisk Level Breakdown:")

    risk_counts = final["risk_level"].value_counts()

    for level in ["LOW", "MODERATE", "HIGH", "CRITICAL"]:
        print(
            f"  {level}: "
            f"{int(risk_counts.get(level, 0))}"
        )

    # ---------------------------------------------------------
    # 9. Example tender assessment
    # ---------------------------------------------------------
    # Prefer a tender flagged by multiple rules for demonstration.
    multi_flagged = rule_flagged[
        rule_flagged["triggered_rules"]
        .fillna("")
        .str.contains(r"\|")
    ]

    if not multi_flagged.empty:
        sample_id = multi_flagged.iloc[0]["tender_id"]
    elif not rule_flagged.empty:
        sample_id = rule_flagged.iloc[0]["tender_id"]
    else:
        sample_id = final.iloc[0]["tender_id"]

    # Original explainable rule assessment
    assessment = assess_tender(
        clean,
        sample_id,
        rule_cfg,
    )

    # Get the complete hybrid result for the same tender
    sample_row = final[
        final["tender_id"] == sample_id
    ].iloc[0]

    example_output = {
        "tender_id": sample_id,
        "rule_score": assessment.rule_score,
        "ml_anomaly_score": float(
            sample_row["ml_anomaly_score"]
        ),
        "final_risk_score": float(
            sample_row["final_risk_score"]
        ),
        "risk_level": sample_row["risk_level"],
        "investigation_status": sample_row[
            "investigation_status"
        ],
        "anomaly_flag": bool(
            assessment.anomaly_flag
        ),
        "ml_anomaly": bool(
            sample_row["ml_anomaly"]
        ),
        "triggered_rules": assessment.triggered_rules,
        "explanations": assessment.explanations,
    }

    print("\nExample Tender Assessment Output:")

    print(
        json.dumps(
            example_output,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
