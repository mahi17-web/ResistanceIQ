# ResistanceIQ — Support & Troubleshooting Runbook

## 1. Common User Issues & Resolution Playbooks

### Issue 1: "Cannot Login / Session Expired"
- **Symptom**: User receives `401 Unauthorized` or redirect loop back to `/login`.
- **Likely Cause**: JWT token expired ($> 8\text{ hours}$) or password altered.
- **Diagnosis**: Inspect `/api/v1/auth/me` network payload in browser DevTools.
- **Resolution**: Have user log in again with credentials or have Organization Administrator reset password.

---

### Issue 2: "Candidate Evaluation Failed / Invalid Chemical Structure"
- **Symptom**: User receives `400 Bad Request` with error message *"Invalid chemical SMILES string"*.
- **Likely Cause**: Malformed SMILES syntax (unbalanced parentheses, invalid valence, or illegal element symbol).
- **Diagnosis**: Verify SMILES string in RDKit or PubChem.
- **Resolution**: Advise user to paste canonical SMILES exported from ChemDraw or MarvinJS.

---

### Issue 3: "Out of Domain Warning Displayed"
- **Symptom**: Prediction displays yellow/orange badge *"OUT OF DOMAIN"* with widened conformal bounds.
- **Likely Cause**: The submitted molecule's maximum Tanimoto similarity to historical training scaffolds is $< 0.25$, or the IRAC MoA group is novel.
- **Resolution**: Explain to user that the platform is providing honest decision support without silent extrapolation.

---

### Issue 4: "Permission Denied When Inviting Users or Generating API Keys"
- **Symptom**: User receives `403 Forbidden` (*"Operation not permitted for current user role"*).
- **Likely Cause**: User possesses `ANALYST` or `VIEWER` role instead of `ADMIN`.
- **Resolution**: Organization Administrator must upgrade user role via Settings $\to$ Team Members.

---

### Issue 5: "PDF Report Download Returns Server Error"
- **Symptom**: Report generation returns 500 error.
- **Likely Cause**: Host storage directory `/app/storage/reports` missing write permissions.
- **Resolution**: Operator runs `chmod 755 storage/reports` on backend host.
