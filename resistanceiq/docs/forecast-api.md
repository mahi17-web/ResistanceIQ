# ResistanceIQ — Forecast & Model Inference API Specification

## 1. Endpoints

### 1.1 Direct Candidate Evaluation (`POST /api/v1/forecasts/evaluate`)

Provides synchronous model scoring with conformal uncertainty intervals and out-of-domain checks.

#### Request Payload:
```json
{
  "chemical_name": "Imidacloprid Analog BW-5520",
  "smiles": "C1CN(C(=N1)NC(=O)N)CC2=CN=C(C=C2)Cl",
  "irac_moa_group": "4A",
  "pest_name": "Myzus persicae",
  "pest_order": "Hemiptera",
  "assay_method": "Leaf-Dip",
  "model_version": "v1.0.0-ridge-ecfp4"
}
```

#### Response Payload (`200 OK`):
```json
{
  "status": "COMPLETED",
  "model_version": "v1.0.0-ridge-ecfp4",
  "model_type": "RIDGE",
  "predicted_log10_rr": 1.1614,
  "predicted_resistance_ratio": 14.5,
  "estimated_years_to_resistance": 6.6,
  "durability_score": 0.44,
  "risk_tier": "HIGH",
  "conformal_interval": {
    "alpha": 0.10,
    "q_hat": 0.4021,
    "rr_lower": 5.75,
    "rr_upper": 36.6
  },
  "domain_applicability": {
    "domain_status": "IN_DOMAIN",
    "confidence_level": "HIGH",
    "max_tanimoto_similarity": 1.0,
    "moa_represented": true,
    "pest_order_represented": true,
    "message": "Candidate chemistry and target biology are well-represented in the training corpus."
  },
  "features_used": {
    "chemical_name": "Imidacloprid Analog BW-5520",
    "smiles": "C1CN(C(=N1)NC(=O)N)CC2=CN=C(C=C2)Cl",
    "irac_moa_group": "4A",
    "pest_species": "Myzus persicae",
    "pest_order": "Hemiptera",
    "bioassay_method": "Leaf-Dip"
  },
  "generated_at": "2026-08-18T17:15:00Z"
}
```

---

### 1.2 Create Forecast Job (`POST /api/v1/forecasts`)

Persists forecast record, creates audit event, and returns stored database entity.

#### Request Payload:
```json
{
  "project_id": "proj_123",
  "molecule_id": "mol_456",
  "target_id": "tgt_789",
  "pest_id": "pest_012"
}
```

---

### 1.3 List Available Models (`GET /api/v1/forecasts/models`)

Returns catalog of registered model versions, algorithms, validation statuses, and SHA-256 hashes.
