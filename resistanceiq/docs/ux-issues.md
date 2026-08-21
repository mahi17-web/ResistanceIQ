# ResistanceIQ — User Experience Issues & Remediation Tracker

## 1. Issue Log & Resolution Matrix

| ID | Page / Area | Severity | Description | Expected Behavior | Actual Behavior & Remediation | Status |
|---|---|:---:|---|---|---|:---:|
| **UX-001** | `NewCandidate.tsx` | **MEDIUM** | Submitting invalid SMILES showed generic server error | Display inline chemical syntax error near the SMILES input | **RESOLVED**: RDKit validation errors caught and rendered inline with actionable chemical feedback. | **CLOSED** |
| **UX-002** | `Comparison.tsx` | **LOW** | Selecting 1 candidate showed empty chart | Display helpful guidance: *"Select at least one additional candidate to compare"* | **RESOLVED**: Empty state guidance displayed when $< 2$ candidates are selected. | **CLOSED** |
| **UX-003** | `Reports.tsx` | **LOW** | PDF download button showed no download progress | Show downloading spinner state during artifact fetch | **RESOLVED**: Added download state feedback and toast confirmation. | **CLOSED** |
| **UX-004** | `Settings.tsx` | **MEDIUM** | Viewer role clicking invite user button failed silently | Clear tooltip / disabled state stating *"Admin permissions required"* | **RESOLVED**: Non-admin users see explicit permission indicator and disabled action buttons. | **CLOSED** |
| **UX-005** | `Dashboard.tsx` | **LOW** | Empty projects view had no direct creation action | Prominent "Create Project" button with modal trigger | **RESOLVED**: Added primary CTA in empty project container. | **CLOSED** |
