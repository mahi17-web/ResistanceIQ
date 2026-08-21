"""
ResistanceIQ — Step 4 Scientific Dataset Auditor & Readiness Inspector
"""

import os
import sys
import json
from collections import Counter
from typing import Dict, Any, List

# Ensure backend root on path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.core.database import SessionLocal
from app.models import (
    DataSource,
    DatasetVersion,
    IngestionRun,
    CanonicalOrganism,
    CanonicalPesticide,
    ResistanceCase,
    Molecule,
    Target,
    Pest,
    DataQualityRejection,
)


def run_full_audit(data_dir: str = "../data") -> Dict[str, Any]:
    db = SessionLocal()
    audit_dir = os.path.join(data_dir, "audit")
    os.makedirs(audit_dir, exist_ok=True)

    try:
        # 1. Dataset & Ingestion Run Inventory
        sources = db.query(DataSource).all()
        versions = db.query(DatasetVersion).all()
        runs = db.query(IngestionRun).all()
        cases = db.query(ResistanceCase).all()
        organisms = db.query(CanonicalOrganism).all()
        pesticides = db.query(CanonicalPesticide).all()
        molecules = db.query(Molecule).all()
        targets = db.query(Target).all()
        pests = db.query(Pest).all()
        rejections = db.query(DataQualityRejection).all()

        total_cases = len(cases)

        # 2. Independent Sample & Hierarchical Cluster Analysis
        unique_org_pest_pairs = set()
        unique_studies = set()
        unique_countries = set()
        unique_years = set()
        unique_locations = set()

        years_list = []
        org_counter = Counter()
        pest_counter = Counter()
        moa_counter = Counter()
        country_counter = Counter()
        type_counter = Counter()
        source_counter = Counter()

        # Missing field counters
        missing_counts = {
            "resistance_year": 0,
            "publication_year": 0,
            "country": 0,
            "location": 0,
            "resistance_ratio": 0,
            "susceptible_baseline": 0,
            "bioassay_method": 0,
            "reference": 0,
            "irac_moa_group": 0,
            "cas_number": 0,
            "ncbi_taxid": 0,
        }

        # Label quality counters
        label_quality = {
            "HIGH_QUALITY_DIRECT_RR": 0,      # Both RR and baseline LC50 with protocol
            "MEDIUM_QUALITY_RR_ONLY": 0,      # RR reported with reference
            "QUALITATIVE_PHENOTYPE_ONLY": 0,  # Field report without exact continuous RR
            "LOW_QUALITY_UNCONFIRMED": 0,
        }

        for c in cases:
            org_name = c.organism.canonical_name if c.organism else "Unknown"
            pest_name = c.pesticide.active_ingredient if c.pesticide else "Unknown"
            moa = c.pesticide.irac_moa_group if c.pesticide and c.pesticide.irac_moa_group else "Unclassified"

            unique_org_pest_pairs.add((org_name, pest_name))
            if c.reference:
                unique_studies.add(c.reference[:80])
            if c.country:
                unique_countries.add(c.country)
            if c.resistance_year:
                unique_years.add(c.resistance_year)
                years_list.append(c.resistance_year)
            if c.location:
                unique_locations.add(c.location)

            org_counter[org_name] += 1
            pest_counter[pest_name] += 1
            moa_counter[moa] += 1
            if c.country:
                country_counter[c.country] += 1
            if c.resistance_type:
                type_counter[c.resistance_type] += 1
            source_counter[c.source_id] += 1

            # Missingness checks
            if c.resistance_year is None: missing_counts["resistance_year"] += 1
            if c.publication_year is None: missing_counts["publication_year"] += 1
            if not c.country: missing_counts["country"] += 1
            if not c.location: missing_counts["location"] += 1
            if c.resistance_ratio is None: missing_counts["resistance_ratio"] += 1
            if c.susceptible_baseline is None: missing_counts["susceptible_baseline"] += 1
            if not c.bioassay_method: missing_counts["bioassay_method"] += 1
            if not c.reference: missing_counts["reference"] += 1
            if not c.pesticide.irac_moa_group: missing_counts["irac_moa_group"] += 1
            if not c.pesticide.cas_number: missing_counts["cas_number"] += 1
            if not c.organism.ncbi_taxid: missing_counts["ncbi_taxid"] += 1

            # Label Quality classification
            if c.resistance_ratio is not None and c.susceptible_baseline is not None and c.bioassay_method:
                label_quality["HIGH_QUALITY_DIRECT_RR"] += 1
            elif c.resistance_ratio is not None and c.reference:
                label_quality["MEDIUM_QUALITY_RR_ONLY"] += 1
            elif c.resistance_type:
                label_quality["QUALITATIVE_PHENOTYPE_ONLY"] += 1
            else:
                label_quality["LOW_QUALITY_UNCONFIRMED"] += 1

        # Chemical structure coverage
        total_pesticides = len(pesticides)
        pesticides_with_cas = sum(1 for p in pesticides if p.cas_number)
        pesticides_with_moa = sum(1 for p in pesticides if p.irac_moa_group)
        molecules_with_smiles = sum(1 for m in molecules if m.smiles and len(m.smiles) >= 3)

        # Genetic / mutation data coverage
        targets_with_residues = sum(1 for t in targets if t.binding_pocket_residues)

        audit_results = {
            "audit_timestamp": "2026-08-18T22:15:00Z",
            "inventory": {
                "total_observations": total_cases,
                "data_sources_count": len(sources),
                "dataset_versions_count": len(versions),
                "ingestion_runs_count": len(runs),
                "organisms_count": len(organisms),
                "pesticides_count": len(pesticides),
                "molecules_count": len(molecules),
                "targets_count": len(targets),
                "data_quality_rejections_count": len(rejections),
            },
            "sample_independence": {
                "total_rows": total_cases,
                "unique_org_pesticide_combinations": len(unique_org_pest_pairs),
                "unique_studies_citations": len(unique_studies),
                "unique_countries": len(unique_countries),
                "unique_years": len(unique_years),
                "unique_locations": len(unique_locations),
                "estimated_independent_observations": len(unique_org_pest_pairs),
            },
            "temporal_range": {
                "min_year": min(years_list) if years_list else None,
                "max_year": max(years_list) if years_list else None,
                "span_years": (max(years_list) - min(years_list)) if years_list else 0,
            },
            "missingness": {
                k: {
                    "missing_count": v,
                    "missing_pct": round((v / max(1, total_cases)) * 100, 1),
                    "completeness_pct": round((1.0 - (v / max(1, total_cases))) * 100, 1),
                }
                for k, v in missing_counts.items()
            },
            "label_quality": label_quality,
            "feature_feasibility": {
                "chemical_smiles_coverage_pct": round((molecules_with_smiles / max(1, len(molecules))) * 100, 1) if molecules else 0.0,
                "pesticide_cas_coverage_pct": round((pesticides_with_cas / max(1, total_pesticides)) * 100, 1),
                "pesticide_irac_moa_coverage_pct": round((pesticides_with_moa / max(1, total_pesticides)) * 100, 1),
                "target_residue_pocket_coverage_pct": round((targets_with_residues / max(1, len(targets))) * 100, 1) if targets else 0.0,
                "genotype_mutation_record_count": 0,
            },
            "distributions": {
                "organisms": dict(org_counter.most_common(10)),
                "pesticides": dict(pest_counter.most_common(10)),
                "irac_moa_groups": dict(moa_counter.most_common(10)),
                "countries": dict(country_counter.most_common(10)),
                "resistance_types": dict(type_counter.most_common(5)),
                "sources": dict(source_counter.most_common(5)),
                "years": dict(sorted(Counter(years_list).items())),
            },
        }

        # Save audit json
        audit_json_path = os.path.join(audit_dir, "audit_summary.json")
        with open(audit_json_path, "w", encoding="utf-8") as f:
            json.dump(audit_results, f, indent=2)

        return audit_results

    finally:
        db.close()


def generate_audit_charts(audit_data: Dict[str, Any], output_dir: str = "../data/audit"):
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        plt.style.use("dark_background")
        os.makedirs(output_dir, exist_ok=True)

        dist = audit_data["distributions"]

        # 1. Records by Year
        years = dist.get("years", {})
        if years:
            plt.figure(figsize=(10, 4.5), facecolor="#05070B")
            ax = plt.gca()
            ax.set_facecolor("#0B1017")
            plt.bar(list(map(str, years.keys())), list(years.values()), color="#0BDFA0", edgecolor="none", width=0.6)
            plt.title("Resistance Records by Year (Temporal Distribution)", fontsize=13, fontweight="bold", pad=12, color="#F1F5F9")
            plt.xlabel("Year", fontsize=11, color="#9AACBE")
            plt.ylabel("Record Count", fontsize=11, color="#9AACBE")
            plt.xticks(rotation=45, ha="right", fontsize=9, color="#7C8A9A")
            plt.yticks(color="#7C8A9A")
            plt.grid(axis="y", linestyle="--", alpha=0.15)
            plt.tight_layout()
            plt.savefig(os.path.join(output_dir, "records_by_year.png"), dpi=200)
            plt.close()

        # 2. Records by Organism
        orgs = dist.get("organisms", {})
        if orgs:
            plt.figure(figsize=(9, 4.5), facecolor="#05070B")
            ax = plt.gca()
            ax.set_facecolor("#0B1017")
            plt.barh(list(orgs.keys())[::-1], list(orgs.values())[::-1], color="#8B8CF8", height=0.55)
            plt.title("Records by Organism / Pest Species", fontsize=13, fontweight="bold", pad=12, color="#F1F5F9")
            plt.xlabel("Observation Count", fontsize=11, color="#9AACBE")
            plt.yticks(fontsize=9, color="#F1F5F9")
            plt.xticks(color="#7C8A9A")
            plt.grid(axis="x", linestyle="--", alpha=0.15)
            plt.tight_layout()
            plt.savefig(os.path.join(output_dir, "records_by_organism.png"), dpi=200)
            plt.close()

        # 3. Records by Pesticide Active Ingredient
        pests = dist.get("pesticides", {})
        if pests:
            plt.figure(figsize=(9, 4.5), facecolor="#05070B")
            ax = plt.gca()
            ax.set_facecolor("#0B1017")
            plt.barh(list(pests.keys())[::-1], list(pests.values())[::-1], color="#F3B14D", height=0.55)
            plt.title("Records by Pesticide Active Ingredient", fontsize=13, fontweight="bold", pad=12, color="#F1F5F9")
            plt.xlabel("Observation Count", fontsize=11, color="#9AACBE")
            plt.yticks(fontsize=9, color="#F1F5F9")
            plt.xticks(color="#7C8A9A")
            plt.grid(axis="x", linestyle="--", alpha=0.15)
            plt.tight_layout()
            plt.savefig(os.path.join(output_dir, "records_by_pesticide.png"), dpi=200)
            plt.close()

        # 4. Records by Country
        countries = dist.get("countries", {})
        if countries:
            plt.figure(figsize=(9, 4.5), facecolor="#05070B")
            ax = plt.gca()
            ax.set_facecolor("#0B1017")
            plt.bar(list(countries.keys()), list(countries.values()), color="#38BDF8", width=0.55)
            plt.title("Records by Geographic Region / Country", fontsize=13, fontweight="bold", pad=12, color="#F1F5F9")
            plt.xlabel("Country", fontsize=11, color="#9AACBE")
            plt.ylabel("Observation Count", fontsize=11, color="#9AACBE")
            plt.xticks(rotation=30, ha="right", fontsize=9, color="#7C8A9A")
            plt.yticks(color="#7C8A9A")
            plt.grid(axis="y", linestyle="--", alpha=0.15)
            plt.tight_layout()
            plt.savefig(os.path.join(output_dir, "records_by_country.png"), dpi=200)
            plt.close()

        # 5. Resistance Type Distribution
        types = dist.get("resistance_types", {})
        if types:
            plt.figure(figsize=(7, 4), facecolor="#05070B")
            ax = plt.gca()
            ax.set_facecolor("#0B1017")
            plt.bar(list(types.keys()), list(types.values()), color="#E85D7A", width=0.5)
            plt.title("Resistance Type Classification", fontsize=13, fontweight="bold", pad=12, color="#F1F5F9")
            plt.ylabel("Count", fontsize=11, color="#9AACBE")
            plt.xticks(rotation=15, ha="right", fontsize=9, color="#7C8A9A")
            plt.yticks(color="#7C8A9A")
            plt.grid(axis="y", linestyle="--", alpha=0.15)
            plt.tight_layout()
            plt.savefig(os.path.join(output_dir, "resistance_type_distribution.png"), dpi=200)
            plt.close()

        # 6. Missing Value Analysis Chart
        missingness = audit_data.get("missingness", {})
        if missingness:
            fields = list(missingness.keys())
            missing_pcts = [m["missing_pct"] for m in missingness.values()]
            plt.figure(figsize=(10, 5), facecolor="#05070B")
            ax = plt.gca()
            ax.set_facecolor("#0B1017")
            colors = ["#E85D7A" if p > 40 else "#F3B14D" if p > 10 else "#0BDFA0" for p in missing_pcts]
            plt.barh(fields[::-1], missing_pcts[::-1], color=colors[::-1], height=0.55)
            plt.title("Dataset Missingness Rate by Field (%)", fontsize=13, fontweight="bold", pad=12, color="#F1F5F9")
            plt.xlabel("Missing Percentage (%)", fontsize=11, color="#9AACBE")
            plt.xlim(0, 100)
            plt.yticks(fontsize=9, color="#F1F5F9")
            plt.xticks(color="#7C8A9A")
            plt.grid(axis="x", linestyle="--", alpha=0.15)
            plt.tight_layout()
            plt.savefig(os.path.join(output_dir, "missing_value_chart.png"), dpi=200)
            plt.close()

        # 7. Source Distribution
        sources = dist.get("sources", {})
        if sources:
            plt.figure(figsize=(6, 4), facecolor="#05070B")
            ax = plt.gca()
            ax.set_facecolor("#0B1017")
            plt.bar(list(sources.keys()), list(sources.values()), color="#8B8CF8", width=0.4)
            plt.title("Observations by Source Registry", fontsize=13, fontweight="bold", pad=12, color="#F1F5F9")
            plt.ylabel("Count", fontsize=11, color="#9AACBE")
            plt.xticks(fontsize=10, color="#F1F5F9")
            plt.yticks(color="#7C8A9A")
            plt.grid(axis="y", linestyle="--", alpha=0.15)
            plt.tight_layout()
            plt.savefig(os.path.join(output_dir, "source_distribution.png"), dpi=200)
            plt.close()

        print(f"Data audit charts successfully generated in {output_dir}")

    except Exception as e:
        print(f"Error generating audit charts: {e}")


if __name__ == "__main__":
    audit = run_full_audit(data_dir=os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data")))
    generate_audit_charts(audit, output_dir=os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/audit")))
