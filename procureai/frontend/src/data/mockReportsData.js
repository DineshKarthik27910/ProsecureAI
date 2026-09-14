/**
 * ProcureAI - Mock Investigation Reports Dataset
 * Enterprise & government audit case dossiers
 */

export const REPORTS_SUMMARY = {
  reportsGenerated: {
    value: 24,
    label: 'Reports Generated',
    subtext: 'Formal forensic audit files',
  },
  openInvestigations: {
    value: 8,
    label: 'Open Investigations',
    subtext: 'Active investigator queue',
  },
  criticalCases: {
    value: 5,
    label: 'Critical Cases',
    subtext: 'Escalated to OIG / Antitrust',
  },
  resolvedCases: {
    value: 16,
    label: 'Resolved Cases',
    subtext: 'Audits closed with findings',
  },
};

export const INITIAL_REPORTS = [
  {
    report_id: 'REP-2026-0088',
    tender_id: 'PRC-2026-1042',
    procurement_title: 'National Highway Expansion Project — Sector 9 Corridor',
    vendor_name: 'Apex Infrastructure Ltd.',
    category: 'Infrastructure',
    contract_value: '₹8.4 Cr',
    raw_value: 84000000,
    rule_score: 88,
    ml_anomaly_score: 95,
    final_risk_score: 92,
    risk_level: 'Critical',
    investigation_status: 'Escalated',
    investigator_name: 'Insp. S. Patel',
    created_at: '2026-03-02',
    triggered_rules: [
      'Unusual price variance (+31% above historical category benchmark)',
      'Low bidder competition (Only 2 proposals submitted for major solicitation)',
      'Repeated supplier contract wins (7 awards across 12 months)',
      'Suspicious bidding pattern (Cluster variance < 0.4% between proposals)',
    ],
    ai_summary:
      'Multi-signal collusion identified between winning prime contractor and secondary bidder, showing coordinated pricing intervals and interlocking registered office agents.',
    executive_summary:
      'This formal inquiry concerns procurement solicitation PRC-2026-1042 for the National Highway Expansion Project (₹8.4 Cr). Automated surveillance flagged acute anomalies in bid timing, unit pricing benchmarks, and sole-competitor relationship links.',
    investigation_findings:
      '1. Subpoenaed bank records confirm cross-subcontracting payments of ₹1.8 Cr made to losing bidder Vertex Construction Group within 18 days of contract award.\n2. Corporate registry disclosures show both competing entities utilize identical registered agent addresses in District 4.\n3. The pricing schedule exhibits artificial inflation across asphalt and civil grading line items.',
    recommended_actions:
      '1. Issue formal referral to Office of the Inspector General (OIG) and Department of Justice Antitrust Division.\n2. Immediate suspension of interim progress disbursements under Contract #PRC-2026-1042.\n3. Implement mandatory pre-award audit review on all pending solicitations involving Apex Infrastructure Ltd.',
    investigation_notes:
      'Cross-checked with State Corporate Commission database. Director names verified. Preliminary briefing forwarded to Deputy Inspector General.',
  },
  {
    report_id: 'REP-2026-0084',
    tender_id: 'PRC-2026-1047',
    procurement_title: 'Regional Hospital MRI & Medical Imaging Modernization',
    vendor_name: 'BioMed Supply Alliance Ltd',
    category: 'Medical Equipment',
    contract_value: '₹6.2 Cr',
    raw_value: 62000000,
    rule_score: 88,
    ml_anomaly_score: 94,
    final_risk_score: 92,
    risk_level: 'Critical',
    investigation_status: 'Under Review',
    investigator_name: 'Insp. S. Patel',
    created_at: '2026-03-04',
    triggered_rules: [
      'Sole-bidder award with proprietary technical hardware specifications',
      'MRI cooling component markup exceeding national baseline by 310%',
      'Shared beneficial owner with regional competitor SafeHealth Diagnostics',
    ],
    ai_summary:
      'Sole-source procurement structured to preclude competitive participation, coupled with extreme line-item component price markup.',
    executive_summary:
      'Investigation initiated following automated detection of zero competitive bidding on a ₹6.2 Cr high-field MRI diagnostic imaging RFP.',
    investigation_findings:
      'RFP technical criteria matched the exact manufacturer SKU catalog of BioMed Supply Alliance, effectively barring alternative certified biomedical hardware providers.',
    recommended_actions:
      '1. Conduct forensic re-evaluation of tender specifications with independent biomedical engineers.\n2. Mandate open vendor re-solicitation if non-proprietary alternatives are confirmed viable.',
    investigation_notes:
      'Requesting procurement drafting logs from the Hospital Purchasing Committee to determine who drafted the technical specifications.',
  },
  {
    report_id: 'REP-2026-0079',
    tender_id: 'PRC-2026-1051',
    procurement_title: 'Government Enterprise Cloud & Unified Data Migration',
    vendor_name: 'Vertex Cloud Systems Inc',
    category: 'IT Services',
    contract_value: '₹8.9 Cr',
    raw_value: 89000000,
    rule_score: 84,
    ml_anomaly_score: 89,
    final_risk_score: 87,
    risk_level: 'High',
    investigation_status: 'Open',
    investigator_name: 'Senior Auditor M. Vance',
    created_at: '2026-03-05',
    triggered_rules: [
      'Threshold evasion: Contract split into two sub-₹10 Cr packages within 7 days',
      'Immediate 85% subcontracting allocation to an affiliated holding entity',
      'Contract value significantly above IT category average (+34%)',
    ],
    ai_summary:
      'Evasion of open-tender statutory oversight thresholds through temporal contract splitting and unvetted offshore subcontracting.',
    executive_summary:
      'Review of federal enterprise cloud hosting solicitation PRC-2026-1051 awarded at ₹8.9 Cr.',
    investigation_findings:
      'Initial evidence indicates deliberate package fragmentation to avoid the ₹10 Cr threshold requiring Cabinet-level fiscal sign-off.',
    recommended_actions:
      '1. Request complete subcontractor roster and beneficial ownership filings.\n2. Verify software licensing fees against Federal GSA Schedule pricing.',
    investigation_notes:
      'Subcontractor agreements requested from vendor legal counsel. Deadline set for March 20, 2026.',
  },
  {
    report_id: 'REP-2026-0065',
    tender_id: 'PRC-2026-1065',
    procurement_title: 'Metropolitan Wastewater Treatment Filtration Retrofit',
    vendor_name: 'NovaTech Environmental Systems',
    category: 'Public Works',
    contract_value: '₹3.7 Cr',
    raw_value: 37500000,
    rule_score: 80,
    ml_anomaly_score: 86,
    final_risk_score: 84,
    risk_level: 'High',
    investigation_status: 'Under Review',
    investigator_name: 'Auditor T. Wright',
    created_at: '2026-02-26',
    triggered_rules: [
      '5th consecutive contract win to newly formed entity with < 6 months incorporation',
      'Winning proposal priced 0.5% below internal confidential government ceiling',
    ],
    ai_summary:
      'Consecutive contract award monopolization by newly registered entity exhibiting near-exact pricing matching internal government estimates.',
    executive_summary:
      'Investigation of repetitive awards issued to NovaTech Environmental Systems across regional municipal utilities.',
    investigation_findings:
      'Internal procurement budget leaked or shared prior to proposal submission; winning bid was within ₹1.8 Lakh of secret agency estimate.',
    recommended_actions:
      '1. Conduct internal integrity audit of Department of Public Works evaluation panel.\n2. Inspect communication logs between procurement officers and vendor executives.',
    investigation_notes:
      'IT logs retrieved for review to detect unauthorized access to sealed tender cost estimates.',
  },
  {
    report_id: 'REP-2026-0052',
    tender_id: 'PRC-2026-1078',
    procurement_title: 'Civic Center HVAC & Green Energy Rehabilitation',
    vendor_name: 'EcoThermal Engineering Corp',
    category: 'Construction',
    contract_value: '₹4.1 Cr',
    raw_value: 41000000,
    rule_score: 68,
    ml_anomaly_score: 74,
    final_risk_score: 72,
    risk_level: 'Moderate',
    investigation_status: 'Completed',
    investigator_name: 'Auditor C. Brooks',
    created_at: '2026-02-19',
    triggered_rules: [
      'Bids submitted from identical network IP range by competing contractors',
    ],
    ai_summary:
      'Coordinated IP bid submission verified as shared public library WiFi connection; minor bid adjustments required.',
    executive_summary:
      'Audit of energy retrofit solicitation PRC-2026-1078 flagged for IP co-location.',
    investigation_findings:
      'Investigators verified that two independent small sub-contractors used the municipal civic center public workstation network to upload bids.',
    recommended_actions:
      '1. File audit findings report with No Probable Collusion determination.\n2. Provide guidance on digital submission security protocols.',
    investigation_notes:
      'Case resolved. No intentional bid collusion identified. Cleared for contract execution.',
  },
  {
    report_id: 'REP-2026-0041',
    tender_id: 'PRC-2026-1090',
    procurement_title: 'Urban Transit Bus Fleet Preventive Maintenance',
    vendor_name: 'MetroFleet Fleet Logistics Inc',
    category: 'Public Works',
    contract_value: '₹5.2 Cr',
    raw_value: 52000000,
    rule_score: 58,
    ml_anomaly_score: 62,
    final_risk_score: 61,
    risk_level: 'Moderate',
    investigation_status: 'Completed',
    investigator_name: 'Insp. S. Patel',
    created_at: '2026-02-08',
    triggered_rules: [
      'Incumbent renewal price escalation exceeding national CPI inflation by 9%',
    ],
    ai_summary:
      'Moderate cost escalation during renewal period attributed to documented supply-chain lithium battery parts inflation.',
    executive_summary:
      'Inquiry into rate adjustments requested under urban transit multi-year maintenance contract.',
    investigation_findings:
      'Supplier provided verified invoices demonstrating 28% wholesale price hikes on specialized fleet battery replacements.',
    recommended_actions:
      '1. Approve contract extension with renegotiated index-linked price adjustments.',
    investigation_notes:
      'Audit concluded with favorable compliance rating.',
  },
];
