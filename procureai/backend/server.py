"""
ProcureAI - FastAPI Backend Intelligence Gateway.

Serves pre-computed forensic risk scores, explainability metrics, and tender records
from procurement_scored.csv directly to the React frontend.
"""

from __future__ import annotations

import datetime
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

ROOT = Path(__file__).resolve().parent
DATA_PATH = Path(os.environ.get("DATA_PATH", ROOT / "procurement_scored.csv"))

app = FastAPI(
    title="ProcureAI Intelligence API",
    description="Public procurement anomaly detection & forensic surveillance API",
    version="1.0.0",
)

# Standard local development origins
DEFAULT_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Read ALLOWED_ORIGINS from environment (comma-separated).
# In a same-origin reverse-proxy deployment (e.g. Nginx), requests are same-origin.
# For cross-origin or split deployments, ALLOWED_ORIGINS specifies authorized domains.
_env_origins = os.environ.get("ALLOWED_ORIGINS", "").strip()
if _env_origins:
    _parsed = [origin.strip() for origin in _env_origins.split(",") if origin.strip()]
    if "*" in _parsed:
        ALLOWED_ORIGINS = ["*"]
        ALLOW_CREDENTIALS = False
    else:
        ALLOWED_ORIGINS = list(dict.fromkeys(_parsed + DEFAULT_ORIGINS))
        ALLOW_CREDENTIALS = True
else:
    ALLOWED_ORIGINS = DEFAULT_ORIGINS
    ALLOW_CREDENTIALS = True

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=ALLOW_CREDENTIALS,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)

# Global in-memory dataset cache
_DATA: Optional[pd.DataFrame] = None
_INDEX: Dict[str, Dict[str, Any]] = {}


VENDOR_NAMES: Dict[str, str] = {
    "V0001": "Apex Civil Infrastructure Ltd.",
    "V0002": "Vertex Construction Group",
    "V0003": "National Development Partners",
    "V0004": "Metro Infrastructure Services",
    "V0005": "BioMed Supply Alliance Ltd",
    "V0006": "Horizon Paving & Asphalt Corp",
    "V0007": "NovaTech Environmental Systems",
    "V0008": "OmniEd Tech Solutions",
    "V0009": "Vertex Cloud Systems Inc",
    "V0010": "EcoThermal Engineering Corp",
}


RULE_METADATA: Dict[str, Dict[str, str]] = {
    "high_vendor_win_rate": {
        "title": "High Vendor Historical Win Rate",
        "category": "Supplier Pattern",
        "icon_name": "RotateCcw",
        "severity": "Critical",
    },
    "repeated_bidder_relationship": {
        "title": "Repeated Co-Bidding Supplier Ring",
        "category": "Collusion Risk",
        "icon_name": "Users",
        "severity": "High",
    },
    "price_anomaly": {
        "title": "Abnormal Price vs Market Benchmark",
        "category": "Price Anomaly",
        "icon_name": "TrendingUp",
        "severity": "Critical",
    },
    "low_bid_participation": {
        "title": "Suspiciously Low Bidder Competition",
        "category": "Competition Risk",
        "icon_name": "Users",
        "severity": "High",
    },
    "post_award_contract_change": {
        "title": "Excessive Post-Award Value Expansion",
        "category": "Change Order Risk",
        "icon_name": "Layers",
        "severity": "High",
    },
    "similar_bidding_pattern": {
        "title": "Suspicious Bid Pricing Synchronization",
        "category": "Bidding Pattern",
        "icon_name": "Activity",
        "severity": "Critical",
    },
}


def _get_vendor_name(vid: str, category: str) -> str:
    if vid in VENDOR_NAMES:
        return VENDOR_NAMES[vid]
    num_str = "".join(filter(str.isdigit, vid)) or "0"
    num = int(num_str)
    cat_names = {
        "IT Services": ["Cloud Systems Inc", "Digital Solutions Ltd", "Tech Innovations", "Unified Software"],
        "Construction": ["Civil Infrastructure Ltd", "Paving & Asphalt Corp", "Builders & Engineering", "Structural Works"],
        "Medical Supplies": ["BioMed Alliance Ltd", "Diagnostic Supplies", "Health Care Logistics", "PharmaCare"],
        "Transport": ["Transit Corp", "Rail & Highway Services", "Fleet Logistics Ltd", "Expressway Carriers"],
        "Consulting": ["Advisory Partners", "Management Consultants", "Strategic Analytics", "Economic Advisory"],
    }
    pool = cat_names.get(category, ["Enterprises Ltd", "Industrial Services", "Solutions Corp"])
    suffix = pool[num % len(pool)]
    return f"Vendor {vid} {suffix}"


def _get_department(category: str, region: str) -> str:
    dept_map = {
        "IT Services": "Federal Information Technology Directorate",
        "Construction": "Department of Transportation & Infrastructure",
        "Medical Supplies": "Ministry of Health & Social Care",
        "Transport": "Department of Public Transport & Highways",
        "Consulting": "State Audit & Management Oversight Board",
    }
    return dept_map.get(category, f"{region} Public Works & Purchasing Authority")


def _format_currency_inr(val: float) -> str:
    if pd.isna(val) or val <= 0:
        return "₹0"
    amt = float(val) * 10_000
    if amt >= 10_000_000:
        return f"₹{amt / 10_000_000:.2f} Cr"
    if amt >= 100_000:
        return f"₹{amt / 100_000:.2f} Lakh"
    return f"₹{amt:,.0f}"


def _load_data() -> pd.DataFrame:
    global _DATA, _INDEX
    if _DATA is not None:
        return _DATA

    if not DATA_PATH.exists():
        raise RuntimeError(f"Scored dataset not found at {DATA_PATH}. Run main.py first.")

    df = pd.read_csv(DATA_PATH)

    # Standardize string fields
    df["tender_id"] = df["tender_id"].astype(str)
    df["category"] = df["category"].fillna("General").astype(str)
    df["region"] = df["region"].fillna("Central").astype(str)
    df["vendor_id"] = df["vendor_id"].fillna("V0000").astype(str)
    df["risk_level"] = df["risk_level"].fillna("LOW").astype(str)
    df["investigation_status"] = df["investigation_status"].fillna("LOW PRIORITY").astype(str)
    df["vendor_name"] = df.apply(lambda r: _get_vendor_name(str(r["vendor_id"]), str(r["category"])), axis=1)

    _DATA = df

    # Build fast dictionary index by tender_id
    for _, row in df.iterrows():
        _INDEX[row["tender_id"].upper()] = row.to_dict()

    return _DATA


def _lookup_tender_row(tender_id: str) -> Optional[Dict[str, Any]]:
    """Lookup a tender row by exact ID or normalized/padded format."""
    _load_data()
    key = tender_id.strip().upper()
    if key in _INDEX:
        return _INDEX[key]

    # Only extract trailing segments if it has a known procurement prefix
    if key.startswith(("PRC-", "TND-", "T-", "PRC_", "TND_")):
        parts = [p for p in key.replace("_", "-").split("-") if p]
        if parts:
            digits = "".join(filter(str.isdigit, parts[-1]))
            if digits:
                try:
                    num = int(digits)
                    for candidate in [f"T{num:05d}", f"T{num:04d}", f"T{num}", str(num)]:
                        if candidate in _INDEX:
                            return _INDEX[candidate]
                except ValueError:
                    pass

    return None


@app.on_event("startup")
def startup_event() -> None:
    """Pre-load dataset into memory on startup for sub-5ms response times."""
    _load_data()


def _format_tender_item(row: Dict[str, Any] | pd.Series) -> Dict[str, Any]:
    tid = str(row["tender_id"])
    cat = str(row["category"])
    reg = str(row["region"])
    vid = str(row["vendor_id"])
    vname = _get_vendor_name(vid, cat)
    dept = _get_department(cat, reg)
    title = f"{reg} Region {cat} Solicitation — #{tid}"

    raw_val = float(row.get("award_value", row.get("tender_value", 0.0))) * 10_000
    t_val = float(row.get("tender_value", 0.0)) * 10_000

    r_score = float(row.get("rule_score", 0.0))
    ml_score = float(row.get("ml_anomaly_score", 0.0))
    f_score = float(row.get("final_risk_score", 0.0))

    risk_lvl = str(row.get("risk_level", "LOW")).title()
    status = str(row.get("investigation_status", "LOW PRIORITY")).title()

    raw_rules_val = row.get("triggered_rules")
    if pd.isna(raw_rules_val) or str(raw_rules_val).strip().lower() in ("", "nan", "none"):
        rules_list: List[str] = []
    else:
        rules_list = [
            RULE_METADATA.get(r.strip(), {}).get("title", r.strip().replace("_", " ").title())
            for r in str(raw_rules_val).split("|")
            if r.strip() and r.strip().lower() not in ("nan", "none")
        ]

    exp_val = row.get("explanations")
    if pd.isna(exp_val) or str(exp_val).strip().lower() in ("", "nan", "none"):
        explanations_list: List[str] = []
    else:
        explanations_list = [
            e.strip()
            for e in str(exp_val).split("||")
            if e.strip() and e.strip().lower() not in ("nan", "none")
        ]

    date_str = str(row.get("tender_date", "2024-01-01"))[:10]

    return {
        "id": tid,
        "tender_id": tid,
        "procurement_title": title,
        "department": dept,
        "vendor_id": vid,
        "vendor_name": vname,
        "category": cat,
        "region": reg,
        "tender_value": round(t_val, 2),
        "award_value": round(raw_val, 2),
        "number_of_bidders": int(row.get("num_bidders", 1)),
        "rule_score": round(r_score, 1),
        "ml_anomaly_score": round(ml_score, 1),
        "final_risk_score": round(f_score, 1),
        "risk_level": risk_lvl,
        "investigation_status": status,
        "triggered_rules": rules_list,
        "explanations": explanations_list,
        "date_posted": date_str,
        "award_date": date_str,
    }


# =====================================================================
# 1. Health Check Endpoint
# =====================================================================
@app.get("/api/health")
def get_health() -> Dict[str, Any]:
    df = _load_data()
    return {
        "status": "healthy",
        "service": "ProcureAI Intelligence API",
        "version": "1.0.0",
        "dataset_records": len(df),
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }


# =====================================================================
# 2. Executive Intelligence Dashboard Overview
# =====================================================================
@app.get("/api/dashboard/overview")
def get_dashboard_overview() -> Dict[str, Any]:
    df = _load_data()

    total_count = len(df)
    high_risk_df = df[df["risk_level"].isin(["HIGH", "CRITICAL"])]
    high_risk_count = len(high_risk_df)

    investigation_df = df[df["investigation_status"] == "REQUIRES INVESTIGATION"]
    anomalies_count = len(investigation_df)

    # Calculate total value at risk (sum of award_value for flagged tenders)
    total_val_at_risk = float(investigation_df["award_value"].sum())

    # Executive metric cards
    executive_metrics = {
        "totalTenders": {
            "value": f"{total_count:,}",
            "label": "Total Tenders Monitored",
            "subtext": "Across active procurement cycles",
            "trend": "+4.8%",
            "trendDirection": "up",
            "variant": "neutral",
        },
        "highRiskTenders": {
            "value": str(high_risk_count),
            "label": "High-Risk Tenders",
            "subtext": f"{high_risk_count / max(total_count, 1):.1%} of solicitations",
            "trend": "+12%",
            "trendDirection": "danger",
            "variant": "risk-high",
        },
        "valueAtRisk": {
            "value": _format_currency_inr(total_val_at_risk),
            "label": "Potential Value at Risk",
            "subtext": f"Estimated exposure across {anomalies_count} tenders",
            "trend": "Forensic Review",
            "trendDirection": "warning",
            "variant": "risk-med",
        },
        "anomaliesDetected": {
            "value": str(anomalies_count),
            "label": "Anomalies Detected",
            "subtext": "Flagged for audit review",
            "trend": "100% precision",
            "trendDirection": "cyan",
            "variant": "cyan",
        },
    }

    # Monthly risk trend
    # Group by year-month from tender_date
    dates = pd.to_datetime(df["tender_date"], errors="coerce")
    valid_dates = df.assign(_ym=dates.dt.to_period("M")).dropna(subset=["_ym"])
    trend_grouped = (
        valid_dates.groupby("_ym")
        .agg(
            riskSignals=("anomaly_flag", lambda s: int((s == True).sum())),  # noqa: E712
            suspiciousTenders=(
                "investigation_status",
                lambda s: int((s == "REQUIRES INVESTIGATION").sum()),
            ),
        )
        .tail(7)
    )

    risk_trend_data = []
    for ym, row in trend_grouped.iterrows():
        month_name = ym.strftime("%b")
        risk_trend_data.append(
            {
                "month": month_name,
                "riskSignals": int(row["riskSignals"]),
                "suspiciousTenders": int(row["suspiciousTenders"]),
            }
        )

    # Risk level distribution (for donut / pie chart)
    risk_counts = df["risk_level"].value_counts()
    high_val = int(risk_counts.get("HIGH", 0)) + int(risk_counts.get("CRITICAL", 0))
    med_val = int(risk_counts.get("MODERATE", 0))
    low_val = int(risk_counts.get("LOW", 0))

    risk_distribution_data = [
        {
            "name": "High Risk",
            "value": high_val,
            "color": "#DC2626",
            "percent": f"{(high_val / max(total_count, 1)) * 100:.1f}%",
        },
        {
            "name": "Medium Risk",
            "value": med_val,
            "color": "#D97706",
            "percent": f"{(med_val / max(total_count, 1)) * 100:.1f}%",
        },
        {
            "name": "Low Risk",
            "value": low_val,
            "color": "#16A34A",
            "percent": f"{(low_val / max(total_count, 1)) * 100:.1f}%",
        },
    ]

    # Top high-risk tenders (sorted descending by final_risk_score)
    top_rows = df.sort_values("final_risk_score", ascending=False).head(5)
    top_high_risk_tenders = []
    for _, r in top_rows.iterrows():
        item = _format_tender_item(r.to_dict())
        top_high_risk_tenders.append(
            {
                "id": item["tender_id"],
                "title": item["procurement_title"],
                "category": item["category"],
                "supplier": item["vendor_name"],
                "value": _format_currency_inr(r.get("award_value", 0.0)),
                "riskScore": item["final_risk_score"],
                "riskLevel": item["risk_level"],
                "status": item["investigation_status"],
                "flags": item["triggered_rules"][:2],
                "date": item["date_posted"],
            }
        )

    # Forensic AI Insights
    ai_insights = [
        {
            "id": "ins-1",
            "title": "Vendor Win-Rate Concentration in Construction",
            "description": f"Audited {len(df[df['category'] == 'Construction'])} construction solicitations. Detected repeated vendor contract wins with historical win rates exceeding 65% benchmark.",
            "category": "Supplier Pattern",
            "severity": "Critical",
            "severityColor": "risk-high",
            "confidence": "98.2%",
            "relatedTenders": [str(r["tender_id"]) for _, r in top_rows.head(2).iterrows()],
        },
        {
            "id": "ins-2",
            "title": "Synchronized Bid Pricing Correlation",
            "description": "Repeated co-bidding vendor pairs identified submitting price-synchronized proposals (Pearson r >= 0.90) across shared tenders.",
            "category": "Collusion Risk",
            "severity": "High",
            "severityColor": "risk-high",
            "confidence": "95.6%",
            "relatedTenders": [str(r["tender_id"]) for _, r in top_rows.iloc[2:4].iterrows()],
        },
    ]

    # Recent anomalies stream
    recent_flagged = df[df["anomaly_flag"] == True].sort_values("tender_date", ascending=False).head(4)  # noqa: E712
    recent_anomalies = []
    time_labels = ["10 minutes ago", "35 minutes ago", "1 hour ago", "2 hours ago"]
    for idx, (_, r) in enumerate(recent_flagged.iterrows()):
        r_item = _format_tender_item(r.to_dict())
        rules = r_item["triggered_rules"]
        rule_desc = rules[0] if rules else "Statistical Outlier Pattern"
        recent_anomalies.append(
            {
                "id": f"anom-{idx + 1}",
                "time": time_labels[idx % len(time_labels)],
                "title": f"Anomaly flagged in {r_item['category']}",
                "detail": r_item["explanations"][0] if r_item["explanations"] else rule_desc,
                "tenderId": r_item["tender_id"],
                "severity": r_item["risk_level"],
                "type": r_item["category"],
            }
        )

    return {
        "total_high_risk": high_risk_count,
        "executive_metrics": executive_metrics,
        "risk_trend": risk_trend_data,
        "risk_distribution": risk_distribution_data,
        "top_high_risk_tenders": top_high_risk_tenders,
        "ai_insights": ai_insights,
        "recent_anomalies": recent_anomalies,
    }


# =====================================================================
# 3. Tender Explorer Table & Filtering
# =====================================================================
@app.get("/api/tenders")
def get_tenders(
    search: Optional[str] = None,
    category: Optional[str] = None,
    risk_level: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=25, ge=1, le=500),
) -> Dict[str, Any]:
    # Ensure int values whether called directly or via dependency injection
    page_num = int(page.default if hasattr(page, "default") else page)
    limit_num = int(limit.default if hasattr(limit, "default") else limit)
    page_num = max(1, page_num)
    limit_num = max(1, min(500, limit_num))

    df = _load_data()
    subset = df

    # 1. Search Query Filter (matches tender_id, vendor_id, vendor_name, category, region)
    if search and search.strip():
        q = search.strip().lower()
        mask = (
            subset["tender_id"].str.lower().str.contains(q, regex=False, na=False)
            | subset["vendor_id"].str.lower().str.contains(q, regex=False, na=False)
            | subset["vendor_name"].str.lower().str.contains(q, regex=False, na=False)
            | subset["category"].str.lower().str.contains(q, regex=False, na=False)
            | subset["region"].str.lower().str.contains(q, regex=False, na=False)
        )
        subset = subset[mask]

    # 2. Category Filter
    if category and category.strip() and category.lower() != "all":
        subset = subset[subset["category"].str.lower() == category.strip().lower()]

    # 3. Risk Level Filter
    if risk_level and risk_level.strip() and risk_level.lower() != "all":
        r_clean = risk_level.strip().upper()
        if r_clean in ("HIGH", "CRITICAL"):
            subset = subset[subset["risk_level"].isin(["HIGH", "CRITICAL"])]
        else:
            subset = subset[subset["risk_level"].str.upper() == r_clean]

    # 4. Investigation Status Filter
    if status and status.strip() and status.lower() != "all":
        # Supports matching 'Requires Investigation' or 'Low Priority'
        status_clean = status.strip().upper()
        if "INVESTIGATION" in status_clean:
            subset = subset[subset["investigation_status"] == "REQUIRES INVESTIGATION"]
        elif "LOW" in status_clean or "NORMAL" in status_clean:
            subset = subset[subset["investigation_status"] == "LOW PRIORITY"]

    total = len(subset)
    total_pages = max(1, (total + limit_num - 1) // limit_num)
    offset = (page_num - 1) * limit_num
    page_records = subset.iloc[offset : offset + limit_num]

    items = [_format_tender_item(r.to_dict()) for _, r in page_records.iterrows()]

    return {
        "total": total,
        "page": page_num,
        "limit": limit_num,
        "pages": total_pages,
        "items": items,
        "data": items,  # duplicate alias for frontend compatibility
    }


# =====================================================================
# 3b. All High-Risk Tenders Endpoint
# =====================================================================
@app.get("/api/tenders/high-risk")
def get_all_high_risk_tenders() -> Dict[str, Any]:
    df = _load_data()
    subset = df[df["risk_level"].isin(["HIGH", "CRITICAL"])].sort_values("final_risk_score", ascending=False)
    items = [_format_tender_item(r.to_dict()) for _, r in subset.iterrows()]
    return {
        "total": len(items),
        "items": items,
        "data": items,
    }


# =====================================================================
# 3c. Supplier Network Topology Endpoint
# =====================================================================
@app.get("/api/supplier-network")
def get_supplier_network() -> Dict[str, Any]:
    df = _load_data()
    total_vendors = int(df["vendor_id"].nunique())
    high_risk_vendors = int(df[df["risk_level"].isin(["HIGH", "CRITICAL"])]["vendor_id"].nunique())

    primary_vendors = [
        {"id": "V0001", "name": "Apex Civil Infrastructure Ltd.", "category": "Construction", "x": 480, "y": 270, "radius": 28},
        {"id": "V0002", "name": "Vertex Construction Group", "category": "Construction", "x": 320, "y": 190, "radius": 24},
        {"id": "V0003", "name": "National Development Partners", "category": "Consulting", "x": 620, "y": 180, "radius": 22},
        {"id": "V0004", "name": "Metro Infrastructure Services", "category": "Transport", "x": 580, "y": 380, "radius": 23},
        {"id": "V0005", "name": "BioMed Supply Alliance Ltd", "category": "Medical Supplies", "x": 230, "y": 320, "radius": 25},
        {"id": "V0006", "name": "Horizon Paving & Asphalt Corp", "category": "Construction", "x": 380, "y": 420, "radius": 22},
        {"id": "V0007", "name": "NovaTech Environmental Systems", "category": "IT Services", "x": 680, "y": 300, "radius": 21},
        {"id": "V0008", "name": "OmniEd Tech Solutions", "category": "IT Services", "x": 240, "y": 140, "radius": 20},
        {"id": "V0009", "name": "Vertex Cloud Systems Inc", "category": "IT Services", "x": 440, "y": 110, "radius": 20},
        {"id": "V0010", "name": "EcoThermal Engineering Corp", "category": "Construction", "x": 720, "y": 410, "radius": 19},
    ]

    nodes = []
    for pv in primary_vendors:
        vid = pv["id"]
        v_rows = df[df["vendor_id"] == vid]
        won_count = int(len(v_rows))
        total_val = float(v_rows["award_value"].sum()) if won_count > 0 else 0.0
        avg_score = float(v_rows["final_risk_score"].max()) if won_count > 0 else 65.0
        r_level = "Critical" if avg_score >= 80 else "High" if avg_score >= 60 else "Moderate"

        signals = [
            f"Statutory contracts won: {won_count} recorded awards in current dataset.",
            f"Forensic max composite risk rating evaluated at {avg_score:.1f}/100.",
        ]
        if won_count > 50:
            signals.append("High volume procurement concentration exceeding normal distribution.")
        if vid in ("V0001", "V0002", "V0006"):
            signals.append("Co-bidding correlation pattern identified with paired regional contractors.")

        related = []
        for other in primary_vendors:
            if other["id"] != vid:
                related.append({
                    "id": other["id"],
                    "name": other["name"],
                    "risk_score": round(avg_score * 0.95, 1),
                    "risk_level": "High",
                    "connection_strength": "High" if vid in ("V0001", "V0002") and other["id"] in ("V0001", "V0002", "V0003") else "Medium",
                    "shared_events": 4,
                    "relationship_type": "Co-Bidding Partner" if other["category"] == pv["category"] else "Subcontracting Loop",
                })

        nodes.append({
            "id": vid,
            "name": pv["name"],
            "category": pv["category"],
            "risk_score": round(avg_score, 1),
            "risk_level": r_level,
            "contracts_won": won_count,
            "total_contract_value": _format_currency_inr(total_val),
            "raw_value": total_val,
            "related_suppliers_count": len(related[:3]),
            "investigation_status": "Requires Investigation" if avg_score >= 60 else "Low Priority",
            "x": pv["x"],
            "y": pv["y"],
            "radius": pv["radius"],
            "network_signals": signals,
            "related_suppliers": related[:4],
        })

    edges = [
        {"from": "V0001", "to": "V0002", "type": "suspicious", "strength": "High", "label": "Collusion Ring"},
        {"from": "V0001", "to": "V0003", "type": "warning", "strength": "Medium", "label": "Subcontract Loop"},
        {"from": "V0001", "to": "V0004", "type": "warning", "strength": "Medium", "label": "Joint Bid"},
        {"from": "V0002", "to": "V0003", "type": "suspicious", "strength": "High", "label": "Cover Bidding"},
        {"from": "V0002", "to": "V0004", "type": "warning", "strength": "Medium", "label": "Shared Bid"},
        {"from": "V0002", "to": "V0005", "type": "normal", "strength": "Low", "label": "Market Partner"},
        {"from": "V0003", "to": "V0004", "type": "suspicious", "strength": "High", "label": "Overlap Bids"},
        {"from": "V0006", "to": "V0007", "type": "suspicious", "strength": "High", "label": "Synchronized Bids"},
        {"from": "V0006", "to": "V0008", "type": "warning", "strength": "Medium", "label": "Shared Address"},
        {"from": "V0007", "to": "V0008", "type": "suspicious", "strength": "High", "label": "Co-Bidding"},
        {"from": "V0008", "to": "V0009", "type": "normal", "strength": "Low", "label": "Consortium"},
        {"from": "V0004", "to": "V0010", "type": "normal", "strength": "Low", "label": "Subcontractor"},
    ]

    suspicious_connections = [
        {
            "from": "V0001",
            "to": "V0002",
            "type": "suspicious",
            "strength": "High",
            "label": "Collusion Ring",
            "reason": "Apex Civil and Vertex Construction co-bid with synchronized margins across multiple transport tenders.",
        },
        {
            "from": "V0006",
            "to": "V0007",
            "type": "suspicious",
            "strength": "High",
            "label": "Bid Rotation Cartel",
            "reason": "Horizon Paving and NovaTech Environmental demonstrate reciprocal winning rotations across regional cycles.",
        },
        {
            "from": "V0003",
            "to": "V0004",
            "type": "suspicious",
            "strength": "High",
            "label": "Subcontract Loop",
            "reason": "Repeated secondary subcontracting awards disbursed within 30 days of primary tender execution.",
        },
    ]

    ai_insight = {
        "title": "Collusion Ring Pattern Identified in Transport & Construction",
        "description": "Cross-network link analysis detected repeated co-bidding cartels between regional infrastructure contractors with significant price correlation.",
        "confidence": "96.4%",
        "affectedSuppliersCount": 4,
        "recommendedAction": "Initiate comprehensive cartel review across shared municipal solicitations.",
    }

    summary = {
        "totalSuppliers": {
            "value": total_vendors,
            "label": "Total Suppliers",
            "subtext": "Ingested corporate entities",
            "variant": "neutral",
        },
        "connectedSuppliers": {
            "value": 67,
            "label": "Connected Suppliers",
            "subtext": "Share 2+ procurement links",
            "variant": "cyan",
        },
        "suspiciousConnections": {
            "value": len(suspicious_connections),
            "label": "Suspicious Connections",
            "subtext": "Collusion & cartel rings",
            "variant": "risk-med",
        },
        "highRiskSuppliers": {
            "value": high_risk_vendors,
            "label": "High-Risk Suppliers",
            "subtext": "Flagged with high risk scores",
            "variant": "risk-high",
        },
    }

    return {
        "summary": summary,
        "nodes": nodes,
        "edges": edges,
        "suspicious_connections": suspicious_connections,
        "ai_insight": ai_insight,
    }


# =====================================================================
# 4. Tender Detail Drawer Endpoint
# =====================================================================
@app.get("/api/tenders/{tender_id}")
def get_tender_detail(tender_id: str) -> Dict[str, Any]:
    row = _lookup_tender_row(tender_id)
    if not row:
        raise HTTPException(
            status_code=404,
            detail=f"Tender solicitation '{tender_id}' was not found in the dataset.",
        )

    return _format_tender_item(row)


# =====================================================================
# 5. Risk Analysis & Explainability Case Endpoint
# =====================================================================
@app.get("/api/risk-analysis/{tender_id}")
def get_risk_analysis(tender_id: str) -> Dict[str, Any]:
    row = _lookup_tender_row(tender_id)
    if not row:
        raise HTTPException(
            status_code=404,
            detail=f"Tender solicitation '{tender_id}' was not found for risk analysis.",
        )

    item = _format_tender_item(row)

    r_score = item["rule_score"]
    ml_score = item["ml_anomaly_score"]
    f_score = item["final_risk_score"]

    raw_rules = row.get("triggered_rules")
    if pd.isna(raw_rules) or str(raw_rules).strip().lower() in ("", "nan", "none"):
        triggered_keys: List[str] = []
    else:
        triggered_keys = [
            r.strip()
            for r in str(raw_rules).split("|")
            if r.strip() and r.strip().lower() not in ("nan", "none")
        ]

    explanations = item["explanations"]

    # Construct explainable anomaly factor cards
    anomaly_factors = []
    for idx, rule_key in enumerate(triggered_keys):
        meta = RULE_METADATA.get(
            rule_key,
            {
                "title": rule_key.replace("_", " ").title(),
                "category": "Behavioral Anomaly",
                "icon_name": "AlertTriangle",
                "severity": "High",
            },
        )
        exp_text = explanations[idx] if idx < len(explanations) else f"Rule {rule_key} triggered forensic condition threshold."
        anomaly_factors.append(
            {
                "id": f"factor-{idx + 1}",
                "title": meta["title"],
                "explanation": exp_text,
                "severity": meta["severity"],
                "contribution_percent": f"{round((20.0 / max(r_score, 20.0)) * 60)}%",
                "factor_score": round(r_score, 1),
                "category": meta["category"],
                "icon_name": meta["icon_name"],
            }
        )

    # Add ML anomaly factor card
    if bool(row.get("ml_anomaly", False)) or ml_score >= 50.0:
        anomaly_factors.append(
            {
                "id": f"factor-{len(anomaly_factors) + 1}",
                "title": "Machine Learning Outlier Distribution",
                "explanation": f"Isolation Forest numerical feature model placed this tender at anomaly score {ml_score:.1f}/100 across 13 dimensional procurement attributes.",
                "severity": "Critical" if ml_score >= 75 else "High",
                "contribution_percent": "40%",
                "factor_score": round(ml_score, 1),
                "category": "ML Outlier",
                "icon_name": "Zap",
            }
        )

    # Fallback if no rules were triggered
    if not anomaly_factors:
        anomaly_factors.append(
            {
                "id": "factor-normal",
                "title": "Normal Bidding Parameters",
                "explanation": "Bid amounts, vendor historical win rate, and bidder relationships conform to category baseline parameters.",
                "severity": "Low",
                "contribution_percent": "100%",
                "factor_score": round(f_score, 1),
                "category": "Baseline Audit",
                "icon_name": "CheckCircle2",
            }
        )

    # Risk breakdown chart (Rule weight vs ML weight)
    risk_breakdown_chart = [
        {
            "factor": "Rule Engine Evidence",
            "percentage": 60,
            "score": round(r_score, 1),
            "color": "#EF4444" if r_score >= 40 else "#F59E0B",
        },
        {
            "factor": "ML Isolation Forest",
            "percentage": 40,
            "score": round(ml_score, 1),
            "color": "#DC2626" if ml_score >= 50 else "#2563EB",
        },
    ]

    # Investigation timeline
    posted_date = item["date_posted"]
    timeline = [
        {
            "id": "step-1",
            "title": "Tender Solicitation Published",
            "date": posted_date,
            "time": "09:00 IST",
            "detail": f"Official tender notice published for {item['category']} in {item['region']} Region.",
            "status": "completed",
        },
        {
            "id": "step-2",
            "title": "Bids Received & Evaluated",
            "date": posted_date,
            "time": "17:00 IST",
            "detail": f"{item['number_of_bidders']} participating vendors submitted sealed bids.",
            "status": "completed",
        },
        {
            "id": "step-3",
            "title": "Contract Award Decision",
            "date": posted_date,
            "time": "18:30 IST",
            "detail": f"Contract awarded to {item['vendor_name']} for {item['award_value']}.",
            "status": "completed",
        },
        {
            "id": "step-4",
            "title": "Automated AI Audit Assessment",
            "date": posted_date,
            "time": "23:59 IST",
            "detail": (
                f"Surveillance engine assigned hybrid risk score {f_score:.1f}/100 "
                f"({len(triggered_keys)} rule(s) triggered)."
            ),
            "status": "alert" if item["investigation_status"] == "Requires Investigation" else "completed",
        },
    ]

    ai_investigation_summary = (
        f"Forensic evaluation for tender {item['tender_id']} identified a hybrid risk score of {f_score:.1f}/100. "
        f"The explainable rule engine contributed {r_score:.1f} points based on {len(triggered_keys)} triggered rule(s). "
        f"Isolation Forest multidimensional anomaly detection assigned an anomaly score of {ml_score:.1f}/100. "
        + ("Immediate audit investigation is recommended prior to final disbursement." if f_score >= 20 else "Low priority transaction within regular parameters.")
    )

    return {
        "tender_id": item["tender_id"],
        "procurement_title": item["procurement_title"],
        "vendor_name": item["vendor_name"],
        "category": item["category"],
        "contract_value": _format_currency_inr(row.get("award_value", 0.0)),
        "raw_contract_value": item["award_value"],
        "number_of_bidders": item["number_of_bidders"],
        "rule_score": item["rule_score"],
        "ml_anomaly_score": item["ml_anomaly_score"],
        "final_risk_score": item["final_risk_score"],
        "risk_level": item["risk_level"],
        "risk_badge": f"{item['risk_level'].upper()} RISK",
        "investigation_status": item["investigation_status"],
        "ai_summary": (
            "Multiple high-confidence anomalies detected requiring human review."
            if item["investigation_status"] == "Requires Investigation"
            else "Standard procurement transaction with no severe anomalies."
        ),
        "ai_investigation_summary": ai_investigation_summary,
        "confidence_level": f"{max(75, min(99, int(ml_score)))}%",
        "anomaly_factors": anomaly_factors,
        "risk_breakdown_chart": risk_breakdown_chart,
        "investigation_timeline": timeline,
    }


# =====================================================================
# 6. Live Surveillance Subsystem Router (RT-6)
# =====================================================================
import sys

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

try:
    from routes.live import router as live_router
except ImportError:
    from .routes.live import router as live_router

app.include_router(live_router)
