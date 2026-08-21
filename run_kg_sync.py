import os
import sys
from datetime import datetime, timezone

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

sys.path.insert(0, os.path.abspath("resistanceiq/backend"))

from app.core.database import SessionLocal
from app.ingestion.knowledge_graph_builder import KnowledgeGraphBuilder
from app.models import Crop, CropThreat, Target, ProteinRecord, ProteinStructure, KnowledgeSyncAudit

def test_sync():
    db = SessionLocal()
    try:
        builder = KnowledgeGraphBuilder(db=db)
        
        # 1. Dry Run Test
        print("=== 1. Testing Knowledge Graph Sync (Dry Run) ===")
        dry_res = builder.sync_all("ALL", dry_run=True)
        print(f"Dry Run Result: {dry_res}")
        
        # 2. Live Sync
        print("\n=== 2. Executing Knowledge Graph Live Sync ===")
        live_res = builder.sync_all("ALL", dry_run=False)
        print(f"Live Sync Result: {live_res}")
        
        # 3. Verify Database Contents
        total_crops = db.query(Crop).count()
        total_threats = db.query(CropThreat).count()
        total_targets = db.query(Target).count()
        total_prots = db.query(ProteinRecord).count()
        total_structures = db.query(ProteinStructure).count()
        total_audits = db.query(KnowledgeSyncAudit).count()
        
        print("\n=== Database Knowledge Graph Verification ===")
        print(f"  * Total Crops in DB:             {total_crops}")
        print(f"  * Total Crop Threats in DB:      {total_threats}")
        print(f"  * Total Targets in DB:           {total_targets}")
        print(f"  * Total Protein Records in DB:   {total_prots}")
        print(f"  * Total Protein Structures in DB:{total_structures}")
        print(f"  * Total Sync Audits in DB:       {total_audits}")
        
        # Detailed Breakdown of Targets
        print("\n=== Targets Breakdown by MoA Scheme & Resistance Mechanism ===")
        targets = db.query(Target).all()
        for t in targets:
            print(f"  [{t.moa_scheme}] {t.name} ({t.gene_name}) | Mechanism: {t.resistance_mechanism} | Class: {t.target_class} | UniProt: {t.uniprot_id} | Evidence: {t.evidence_level}")
            for s in t.structures:
                print(f"    -- Structure: PDB {s.pdb_id or 'N/A'} (Chain {s.chain_id}) | Type: {s.structure_type} | Method: {s.experimental_method} ({s.resolution or 'N/A'} A) | Mapping: {s.mapping_evidence}")

    finally:
        db.close()

if __name__ == "__main__":
    test_sync()
