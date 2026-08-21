# ResistanceIQ — Core User Journeys & Workflow Specifications

## 1. Journey A: First Candidate Analysis & Resistance Forecasting

```text
[ Login to Platform ]
        │
        ▼
[ Dashboard (Overview & Pipeline KPIs) ]
        │
        ▼
[ Click '+ New Candidate' in Navigation Rail ]
        │
        ▼
[ Input Molecular SMILES & Select Target Pest / MoA Group ]
        │
        ▼
[ Live Inference Preview: Durability Score, Conformal Interval & OOD Check ]
        │
        ▼
[ Confirm & Save Forecast to Discovery Project ]
        │
        ▼
[ View Complete Dossier & Export PDF/CSV Report ]
```

- **Starting State**: User authenticated with empty or active project.
- **Success Criteria**: Candidate created, linear Ridge prediction executed, split conformal interval computed, results saved without UI freeze.
- **Failure Recovery**: If SMILES is malformed, inline validation highlights the specific chemical syntax error near the input field.

---

## 2. Journey B: Multi-Candidate Analog Comparison

```text
[ Navigate to 'Comparison' ]
        │
        ▼
[ Select 2 to 4 Candidate Molecules from Project ]
        │
        ▼
[ Inspect Multi-Curve 10-Year Resistance Trajectory Chart ]
        │
        ▼
[ Review Side-by-Side Durability, Conformal Bounds & Mutation Hotspots ]
```

- **Starting State**: User has $\ge 2$ scored candidate molecules.
- **Success Criteria**: Clear multi-line chart with distinctive candidate legends and tooltips.

---

## 3. Journey C: Model Validation & Backtest Inspection

```text
[ Navigate to 'Model Validation' / Backtest ]
        │
        ▼
[ Inspect Active Model Version: v1.0.0-ridge-ecfp4 ]
        │
        ▼
[ Review Cross-Validation Metrics: MAE (0.332), R2 (0.247), Conformal Coverage (89.5%) ]
        │
        ▼
[ Audit Historical Bioassay Cases (Predicted vs Observed Resistance Ratio) ]
```

- **Starting State**: Scientific Lead reviewing model audit trail.
- **Success Criteria**: Honest display of validation performance with explicit scientific limitations.

---

## 4. Journey D: Dossier & Compliance Report Generation

```text
[ Navigate to 'Reports' ]
        │
        ▼
[ Select Target Project & Output Format (PDF / CSV) ]
        │
        ▼
[ Click 'Generate Report' ]
        │
        ▼
[ Download Structured Dossier with Metadata & Method Limitations ]
```

---

## 5. Journey E: Organization & Access Management

```text
[ Navigate to 'Settings' ]
        │
        ▼
[ Review Organization Details & Plan Tier ]
        │
        ▼
[ Manage Team Roster (Invite Analyst / Assign Role) ]
        │
        ▼
[ Create Programmatic API Key (One-Time Secret Reveal) ]
```
