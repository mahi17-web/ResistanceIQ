# ResistanceIQ — Scientific Data Licensing & Terms of Use

This document establishes the formal legal, licensing, and attribution terms governing all external scientific datasets ingested into the ResistanceIQ platform.

---

## 1. Verified Source Licensing Terms

| Data Source | Governing Body | License / Terms | Commercial Use Allowed? | Bulk Redistribution Permitted? | Attribution Requirement |
|---|---|---|---|---|---|
| **APRD** | Michigan State University / USDA NIFA | Public Educational / Academic Citation | Research & Internal Evaluation Permitted | Prohibited from bulk third-party commercial re-licensing | Must cite: *"Arthropod Pesticide Resistance Database, Michigan State University, www.pesticideresistance.org"* |
| **IRAC MoA** | Insecticide Resistance Action Committee (CropLife International) | Open Access with Attribution | Permitted for educational & resistance management | Derived works require IRAC attribution | Must cite: *"IRAC Mode of Action Classification Scheme, Version 11, irac-online.org"* |
| **ChEMBL 33**| EMBL-EBI | CC BY-SA 3.0 | Permitted (ShareAlike condition applies to modified data) | Permitted under CC BY-SA 3.0 | Must cite: *"Gaulton A, et al. ChEMBL: a large-scale bioactivity database. Nucleic Acids Res. 2017"* |
| **PubChem** | NCBI / NIH / NLM | Public Domain (CC0 / US Gov) | Permitted with zero restrictions | Permitted with zero restrictions | Citation recommended: *"Kim S, et al. PubChem 2023 update. Nucleic Acids Res. 2023"* |
| **UniProtKB** | UniProt Consortium | Creative Commons Attribution (CC BY 4.0) | Permitted | Permitted with CC BY 4.0 attribution | Must cite: *"The UniProt Consortium. UniProt: the Universal Protein Resource in 2023. Nucleic Acids Res."* |
| **USGS NASS** | US Geological Survey / USDA | US Public Domain | Permitted | Permitted with zero restrictions | US Gov attribution recommended |

---

## 2. Platform Compliance Mandates

1. **No Proprietary Claim over Public Data**: ResistanceIQ does not claim copyright ownership over factual toxicological constants ($LC_{50}$, $K_i$) or raw public database citations.
2. **Provenance Retention**: Every record in the database maintains its `source_id`, `source_record_id`, and `reference` citation.
3. **Respect for Rate Limits & Robots.txt**: Programmatic ingestion must adhere to rate limits (maximum 1 request per 2 seconds for public search endpoints) and never execute unauthenticated scraping of restricted portals.
4. **Third-Party Commercial Derivative Notice**: In the event ResistanceIQ models are licensed commercially, training sets utilizing ChEMBL data will maintain open feature extraction pipelines in compliance with CC BY-SA 3.0.
