import sys
import os
import urllib.request
import urllib.error
import json
import time

def make_req(url, method="GET", data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req_body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=req_body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, json.loads(body) if body else None
    except urllib.error.HTTPError as err:
        body = err.read().decode("utf-8")
        try:
            return err.code, json.loads(body)
        except:
            return err.code, body
    except Exception as e:
        return 500, str(e)

# 1. Register a test user
test_email = f"bio.curator.{int(time.time())}@resistanceiq.org"
reg_payload = {
    "first_name": "Elena",
    "last_name": "Vance",
    "email": test_email,
    "password": "ResistanceIQ2026!",
    "organization_name": "Global Crop Protection",
    "role": "RESEARCHER"
}
status, data = make_req("http://localhost:8000/api/v1/auth/register", method="POST", data=reg_payload)
print("Registration status:", status)
if status not in [200, 201]:
    print("Registration failed:", data)
    sys.exit(1)

token = data["access_token"]
print("Authenticated successfully. Token length:", len(token))

# 2. Check Projects
status, projs = make_req("http://localhost:8000/api/v1/projects", token=token)
print("\nProjects status:", status, "Data:", projs)

# 3. Check Targets
status, tgts = make_req("http://localhost:8000/api/v1/targets", token=token)
print("\nTargets status:", status, "Count:", len(tgts) if isinstance(tgts, list) else tgts)

# 4. Check Threats for Tomato
status, threats = make_req("http://localhost:8000/api/v1/crops/crop_fao_0121_tomato/threats", token=token)
print("\nThreats status:", status, "Count:", len(threats) if isinstance(threats, list) else threats)
if isinstance(threats, list) and len(threats) > 0:
    print("Sample threat:", threats[0])

# 5. Direct evaluate candidate endpoint
eval_payload = {
    "chemical_name": "Chlorantraniliprole",
    "smiles": "CC1=CC(=NN1C2=CC(=CC=C2)Cl)C(=O)NC3=C(C=CC(=C3Cl)C(=O)NC)Br",
    "irac_moa_group": "28",
    "pest_name": "Helicoverpa armigera",
    "pest_order": "Lepidoptera",
    "assay_method": "Leaf-Dip",
    "model_version": "v2.0-gbrt-ecfp4"
}
print("\n--- Testing POST /api/v1/forecasts/evaluate ---")
status, eval_res = make_req("http://localhost:8000/api/v1/forecasts/evaluate", method="POST", data=eval_payload, token=token)
print("Evaluate Status:", status)
print("Evaluate Response:", json.dumps(eval_res, indent=2) if isinstance(eval_res, dict) else eval_res)

# 6. Test Molecule Creation
mol_payload = {
    "chemical_name": "Chlorantraniliprole",
    "smiles": "CC1=CC(=NN1C2=CC(=CC=C2)Cl)C(=O)NC3=C(C=CC(=C3Cl)C(=O)NC)Br",
    "irac_moa_group": "28"
}
status, mol_res = make_req("http://localhost:8000/api/v1/molecules", method="POST", data=mol_payload, token=token)
print("\nMolecule Creation Status:", status)
print("Molecule Response:", mol_res)
mol_id = mol_res.get("id") if isinstance(mol_res, dict) else None

# 7. Test POST /api/v1/forecasts
proj_id = projs[0]["id"] if isinstance(projs, list) and len(projs) > 0 else None
if not proj_id:
    # Create project if none exists
    status, new_proj = make_req("http://localhost:8000/api/v1/projects", method="POST", data={
        "name": "AChE1 Discovery Series",
        "description": "Research series for AChE1 candidates"
    }, token=token)
    print("Project creation status:", status, "Data:", new_proj)
    proj_id = new_proj.get("id") if isinstance(new_proj, dict) else "prj_default"

pest_id = threats[0].get("organism_id") or threats[0].get("id") if isinstance(threats, list) and len(threats) > 0 else "pst_aphid_01"

fcst_payload = {
    "project_id": proj_id,
    "molecule_id": mol_id,
    "target_id": tgts[0]["id"] if isinstance(tgts, list) and len(tgts) > 0 else "tgt_ache1_01",
    "pest_id": pest_id,
    "model_version": "v2.0-gbrt-ecfp4"
}
print("\n--- Testing POST /api/v1/forecasts ---")
print("Payload:", fcst_payload)
status, fcst_res = make_req("http://localhost:8000/api/v1/forecasts", method="POST", data=fcst_payload, token=token)
print("Forecast Status:", status)
print("Forecast Response:", json.dumps(fcst_res, indent=2) if isinstance(fcst_res, dict) else fcst_res)
