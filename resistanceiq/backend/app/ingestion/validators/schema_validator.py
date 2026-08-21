"""
ResistanceIQ — Scientific Schema & Value Validator
"""

from datetime import datetime, timezone
from typing import Dict, Any, List, Optional


class ValidationError:
    def __init__(self, error_code: str, message: str, field: Optional[str] = None):
        self.error_code = error_code
        self.message = message
        self.field = field

    def to_dict(self) -> Dict[str, Any]:
        return {
            "error_code": self.error_code,
            "message": self.message,
            "field": self.field,
        }


class ValidationResult:
    def __init__(self, is_valid: bool, errors: Optional[List[ValidationError]] = None):
        self.is_valid = is_valid
        self.errors = errors or []


class SchemaValidator:
    """
    Validates staged records against biological and physical sanity constraints.
    """

    CURRENT_YEAR = datetime.now(timezone.utc).year

    @classmethod
    def validate_resistance_record(cls, record: Dict[str, Any]) -> ValidationResult:
        errors: List[ValidationError] = []

        # 1. Source Record ID
        if not record.get("source_record_id"):
            errors.append(ValidationError("ERR_MISSING_SOURCE_ID", "Record is missing source identifier", "source_record_id"))

        # 2. Organism Identification
        sci_name = record.get("scientific_name", "").strip()
        common_name = record.get("common_name", "").strip()
        genus = record.get("genus", "").strip()

        if not sci_name and not common_name and not genus:
            errors.append(ValidationError("ERR_MISSING_ORGANISM", "No organism name, genus, or common name provided", "scientific_name"))
        elif sci_name and len(sci_name) < 3:
            errors.append(ValidationError("ERR_INVALID_TAXONOMY", "Scientific name is too short or malformed", "scientific_name"))

        # 3. Pesticide Active Ingredient
        active = record.get("active_ingredient", "").strip()
        if not active:
            errors.append(ValidationError("ERR_MISSING_ACTIVE_INGREDIENT", "Record is missing pesticide active ingredient", "active_ingredient"))

        # 4. Temporal Boundaries
        res_year = record.get("resistance_year")
        if res_year is not None:
            if res_year < 1900 or res_year > cls.CURRENT_YEAR + 1:
                errors.append(ValidationError("ERR_INVALID_RESISTANCE_YEAR", f"Resistance year {res_year} is outside valid window [1900, {cls.CURRENT_YEAR+1}]", "resistance_year"))

        pub_year = record.get("publication_year")
        if pub_year is not None:
            if pub_year < 1900 or pub_year > cls.CURRENT_YEAR + 1:
                errors.append(ValidationError("ERR_INVALID_PUB_YEAR", f"Publication year {pub_year} is outside valid window [1900, {cls.CURRENT_YEAR+1}]", "publication_year"))

        # 5. Resistance Ratio Numerical Sanity
        rr = record.get("resistance_ratio")
        if rr is not None:
            if rr <= 0.0:
                errors.append(ValidationError("ERR_IMPOSSIBLE_RATIO", f"Resistance ratio must be positive (> 0.0), found {rr}", "resistance_ratio"))
            elif rr > 1000000.0:
                errors.append(ValidationError("ERR_UNREALISTIC_OUTLIER_RATIO", f"Resistance ratio {rr} exceeds biological threshold without amplification proof", "resistance_ratio"))

        # 6. Country validation
        country = record.get("country", "").strip()
        if country and len(country) < 2:
            errors.append(ValidationError("ERR_MALFORMED_COUNTRY", f"Country string '{country}' is invalid", "country"))

        is_valid = len(errors) == 0
        return ValidationResult(is_valid, errors)
