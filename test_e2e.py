import httpx
import json

BASE = "http://127.0.0.1:8000/api/v1"

# 1. Real Login
login_res = httpx.post(f"{BASE}/auth/login", json={"email": "priya@bindwell.bio", "password": "ResistanceIQ2026!"})
assert login_res.status_code == 200, f"Login failed: {login_res.text}"
token = login_res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
print("1. Real Login: SUCCESS (User authenticated)")

# 2. Verify Session
me_res = httpx.get(f"{BASE}/auth/me", headers=headers)
assert me_res.status_code == 200
user_info = me_res.json()
print(f"2. User Profile: {user_info.get('full_name')} | Role: {user_info.get('role')}")

# 3. Create Molecule (RIQ-TEST-001, CCO)
mol_res = httpx.post(f"{BASE}/molecules", json={
    "chemical_name": "RIQ-TEST-001",
    "smiles": "CCO",
    "molecular_weight": 46.07,
    "logp": -0.3,
    "provenance_source": "ACCEPTANCE_TEST"
}, headers=headers)
assert mol_res.status_code == 201, f"Molecule creation failed: {mol_res.text}"
mol = mol_res.json()
print(f"3. Molecule Ingestion: SUCCESS | ID: {mol.get('id')} | SMILES: {mol.get('smiles')}")

# 4. Fetch Real Target & Pest
targets = httpx.get(f"{BASE}/targets", headers=headers).json()
target = next(t for t in targets if "AChE1" in t["name"] or t["id"] == "tgt_ache1_01")
pests = httpx.get(f"{BASE}/pests", headers=headers).json()
pest = next(p for p in pests if "persicae" in p["species_name"] or p["id"] == "pst_aphid_01")
print(f"4. Target: {target.get('name')} | Pest: {pest.get('common_name')}")

# 5. Execute Real Forecast
fc_res = httpx.post(f"{BASE}/forecasts", json={
    "project_id": "prj_ache1_series",
    "molecule_id": mol["id"],
    "target_id": target["id"],
    "pest_id": pest["id"],
}, headers=headers)
assert fc_res.status_code in [200, 201], f"Forecast failed: {fc_res.text}"
fc = fc_res.json()
fc_id = fc.get("id")
print(f"5. Forecast Execution: SUCCESS | ID: {fc_id} | Durability: {fc.get('durability_score')} | Horizon: {fc.get('estimated_years_to_resistance')} years | Risk: {fc.get('risk_tier')}")

# 6. Verify Forecast Persistence via GET /forecasts/{id}
get_fc = httpx.get(f"{BASE}/forecasts/{fc_id}", headers=headers)
assert get_fc.status_code == 200, f"Get forecast failed: {get_fc.text}"
assert get_fc.json()["id"] == fc_id
print(f"6. Forecast Persistence: SUCCESS | ID verified via GET /forecasts/{fc_id}")

# 7. Verify in Project Comparison List
proj_fcs = httpx.get(f"{BASE}/forecasts?project_id=prj_ache1_series", headers=headers).json()
assert any(f["id"] == fc_id for f in proj_fcs)
print(f"7. Comparison Integration: SUCCESS | Forecast present in project list ({len(proj_fcs)} total)")

print("\nALL ACCEPTANCE CRITERIA MET AND VERIFIED.")
