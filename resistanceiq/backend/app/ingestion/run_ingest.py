"""
ResistanceIQ — Command-Line Ingestion Pipeline Runner
"""

import sys
import os

# Put backend root on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.ingestion.pipeline import IngestionPipeline


def main():
    print("=" * 70)
    print("ResistanceIQ — Scientific Data Ingestion Execution")
    print("=" * 70)

    raw_file = os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "../../../data/raw/aprd_verified_benchmark_dataset.csv",
        )
    )

    if not os.path.exists(raw_file):
        print(f"Error: Raw file not found at {raw_file}")
        sys.exit(1)

    with open(raw_file, "r", encoding="utf-8") as f:
        content = f.read()

    pipeline = IngestionPipeline(data_dir=os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data")))
    result = pipeline.run_aprd_ingestion(
        raw_csv_content=content,
        version_tag="2026.1",
        dataset_name="APRD Arthropod Resistance Registry",
    )

    print(f"Ingestion Run Status:    {result['status']}")
    print(f"Run ID:                  {result['run_id']}")
    print(f"Dataset Version:         {result['version_id']}")
    print(f"Records Seen:            {result['records_seen']}")
    print(f"Records Accepted:        {result['records_accepted']}")
    print(f"Records Rejected:        {result['records_rejected']}")
    print(f"Duplicate Candidates:    {result['duplicate_candidates']}")
    print(f"Quality Report Saved to: {result['quality_report_path']}")
    print("=" * 70)


if __name__ == "__main__":
    main()
