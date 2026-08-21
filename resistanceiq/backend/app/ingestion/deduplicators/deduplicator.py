"""
ResistanceIQ — Source-Aware Deduplicator
"""

from typing import Dict, Any, List, Set, Tuple


class DeduplicationResult:
    def __init__(
        self,
        unique_records: List[Dict[str, Any]],
        exact_duplicates_count: int,
        duplicate_candidates_count: int,
    ):
        self.unique_records = unique_records
        self.exact_duplicates_count = exact_duplicates_count
        self.duplicate_candidates_count = duplicate_candidates_count


class Deduplicator:
    """
    Source-aware deduplication that detects exact source key duplicates
    and flags fuzzy biological candidate duplicates without silent data loss.
    """

    @classmethod
    def process_batch(cls, records: List[Dict[str, Any]]) -> DeduplicationResult:
        seen_source_keys: Set[Tuple[str, str]] = set()
        seen_bio_keys: Set[Tuple[str, str, Optional[int], Optional[str]]] = set()

        unique_records: List[Dict[str, Any]] = []
        exact_dups = 0
        candidate_dups = 0

        for r in records:
            source = r.get("source", "")
            source_rec_id = r.get("source_record_id", "")
            source_key = (source, source_rec_id)

            # 1. Exact Source Duplicate Check
            if source_rec_id and source_key in seen_source_keys:
                exact_dups += 1
                continue  # Exact duplicate from same source ID: skip re-insertion
            seen_source_keys.add(source_key)

            # 2. Biological Duplicate Candidate Check
            organism = r.get("canonical_organism", {}).get("canonical_name", "")
            active = r.get("canonical_pesticide", {}).get("active_ingredient", "")
            year = r.get("resistance_year")
            country = r.get("country")
            bio_key = (organism, active, year, country)

            if bio_key in seen_bio_keys and organism and active:
                candidate_dups += 1
                r["is_duplicate_candidate"] = True
            else:
                r["is_duplicate_candidate"] = False
                seen_bio_keys.add(bio_key)

            unique_records.append(r)

        return DeduplicationResult(
            unique_records=unique_records,
            exact_duplicates_count=exact_dups,
            duplicate_candidates_count=candidate_dups,
        )
