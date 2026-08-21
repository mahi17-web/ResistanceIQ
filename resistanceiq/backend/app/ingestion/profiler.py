"""
ResistanceIQ — Automated Data Profiler & Quality Report Generator
"""

import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from collections import Counter


class DataProfiler:
    """
    Generates machine-readable data profiles (data_profile.json) and
    comprehensive Markdown data quality reports from ingested batches.
    """

    @classmethod
    def generate_profile(
        cls,
        dataset_name: str,
        version: str,
        accepted_records: List[Dict[str, Any]],
        rejected_records: List[Dict[str, Any]],
        exact_duplicates: int,
        duplicate_candidates: int,
    ) -> Dict[str, Any]:
        total_seen = len(accepted_records) + len(rejected_records) + exact_duplicates
        total_accepted = len(accepted_records)
        total_rejected = len(rejected_records)

        # Null-rate tracking
        field_counts: Dict[str, int] = {}
        target_fields = [
            "scientific_name", "common_name", "active_ingredient", "irac_moa_group",
            "country", "location", "resistance_year", "publication_year",
            "resistance_type", "resistance_ratio", "bioassay_method", "reference"
        ]
        for f in target_fields:
            field_counts[f] = 0

        organisms = Counter()
        actives = Counter()
        moas = Counter()
        countries = Counter()
        types = Counter()
        years: List[int] = []

        for r in accepted_records:
            org = r.get("canonical_organism", {})
            pest = r.get("canonical_pesticide", {})

            sci = org.get("canonical_name") or r.get("scientific_name")
            if sci:
                field_counts["scientific_name"] += 1
                organisms[sci] += 1

            comm = org.get("common_name") or r.get("common_name")
            if comm: field_counts["common_name"] += 1

            act = pest.get("active_ingredient") or r.get("active_ingredient")
            if act:
                field_counts["active_ingredient"] += 1
                actives[act] += 1

            moa = pest.get("irac_moa_group") or r.get("mode_of_action")
            if moa:
                field_counts["irac_moa_group"] += 1
                moas[moa] += 1

            cntry = r.get("country")
            if cntry:
                field_counts["country"] += 1
                countries[cntry] += 1

            if r.get("location"): field_counts["location"] += 1

            ry = r.get("resistance_year")
            if ry:
                field_counts["resistance_year"] += 1
                years.append(ry)

            if r.get("publication_year"): field_counts["publication_year"] += 1

            rtype = r.get("resistance_type")
            if rtype:
                field_counts["resistance_type"] += 1
                types[rtype] += 1

            if r.get("resistance_ratio") is not None: field_counts["resistance_ratio"] += 1
            if r.get("bioassay_method"): field_counts["bioassay_method"] += 1
            if r.get("reference"): field_counts["reference"] += 1

        null_rates = {
            f: round(1.0 - (field_counts[f] / max(1, total_accepted)), 3)
            for f in target_fields
        }

        profile = {
            "dataset_name": dataset_name,
            "version": version,
            "profiled_at": datetime.now(timezone.utc).isoformat(),
            "summary": {
                "records_seen": total_seen,
                "records_accepted": total_accepted,
                "records_rejected": total_rejected,
                "acceptance_rate_pct": round((total_accepted / max(1, total_seen)) * 100, 2),
                "exact_duplicates_skipped": exact_duplicates,
                "duplicate_candidates_flagged": duplicate_candidates,
            },
            "temporal_coverage": {
                "min_year": min(years) if years else None,
                "max_year": max(years) if years else None,
                "span_years": (max(years) - min(years)) if years else 0,
            },
            "null_rates": null_rates,
            "distributions": {
                "top_organisms": dict(organisms.most_common(10)),
                "top_active_ingredients": dict(actives.most_common(10)),
                "irac_moa_groups": dict(moas.most_common(10)),
                "top_countries": dict(countries.most_common(10)),
                "resistance_types": dict(types.most_common(5)),
            },
            "rejections": [
                {
                    "source_record_id": rej.get("source_record_id"),
                    "error_code": rej.get("error_code"),
                    "reason": rej.get("rejection_reason"),
                }
                for rej in rejected_records[:50]
            ],
        }
        return profile

    @classmethod
    def format_markdown_report(cls, profile: Dict[str, Any]) -> str:
        s = profile["summary"]
        t = profile["temporal_coverage"]
        d = profile["distributions"]
        nr = profile["null_rates"]

        md = f"""# ResistanceIQ — Data Quality & Profile Report

**Dataset**: `{profile['dataset_name']}` (Version: `{profile['version']}`)  
**Generated At**: `{profile['profiled_at']}`

---

## 1. Ingestion Volume & Acceptance Summary

| Metric | Count | Percentage |
|---|---|---|
| **Total Records Seen** | {s['records_seen']} | 100.0% |
| **Records Accepted** | {s['records_accepted']} | {s['acceptance_rate_pct']}% |
| **Records Rejected** | {s['records_rejected']} | {round((s['records_rejected']/max(1, s['records_seen']))*100, 2)}% |
| **Exact Duplicates Skipped** | {s['exact_duplicates_skipped']} | — |
| **Duplicate Candidates Flagged** | {s['duplicate_candidates_flagged']} | — |

---

## 2. Temporal Coverage
- **Earliest Documented Resistance Year**: `{t['min_year'] or 'N/A'}`
- **Latest Documented Resistance Year**: `{t['max_year'] or 'N/A'}`
- **Total Historical Span**: `{t['span_years']}` years

---

## 3. Missing Value / Null Rate Analysis

| Field | Completeness (%) | Null Rate (%) |
|---|---|---|
"""
        for field, rate in nr.items():
            comp = round((1.0 - rate) * 100, 1)
            md += f"| `{field}` | {comp}% | {round(rate*100, 1)}% |\n"

        md += """
---

## 4. Top Entity Distributions

### Top Organisms
"""
        for org, count in d["top_organisms"].items():
            md += f"- **{org}**: {count} cases\n"

        md += "\n### Top Active Ingredients\n"
        for act, count in d["top_active_ingredients"].items():
            md += f"- **{act}**: {count} cases\n"

        md += "\n### Top IRAC Mode of Action Groups\n"
        for moa, count in d["irac_moa_groups"].items():
            md += f"- **Group {moa}**: {count} cases\n"

        return md
