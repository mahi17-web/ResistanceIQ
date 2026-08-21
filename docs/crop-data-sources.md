# Crop Data Sources & Agronomic Taxonomy

## 1. Overview
ResistanceIQ integrates authoritative global agricultural classifications to eliminate manual entry of crop names and ensure taxonomic consistency across all downstream resistance forecasting models.

```
FAO Indicative Crop Classification (ICC v1.1)
                 ↓
      NCBI Taxonomy Resolver
                 ↓
    PostgreSQL Canonical Crops Catalog
```

---

## 2. Primary Authoritative Source: FAO ICC v1.1
The **Food and Agriculture Organization (FAO)** of the United Nations publishes the **Indicative Crop Classification (ICC)** as part of the World Programme for the Census of Agriculture (WCA 2020).

- **Classification Standard**: FAO ICC Version 1.1
- **Source Authority**: Food and Agriculture Organization of the United Nations (FAO Statistics Division)
- **Official URL**: `https://www.fao.org/world-census-agriculture/wca2020/`
- **License / Access**: Open public access under FAO open data policy

### Key Canonical Crops Ingested:
| Crop Code | Common Name | Scientific Name | Botanical Family | Genus | Species |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `0121` | Tomato | *Solanum lycopersicum* | Solanaceae | *Solanum* | *S. lycopersicum* |
| `0151` | Potato | *Solanum tuberosum* | Solanaceae | *Solanum* | *S. tuberosum* |
| `0192` | Upland Cotton | *Gossypium hirsutum* | Malvaceae | *Gossypium* | *G. hirsutum* |
| `0122` | Cabbage / Brassica | *Brassica oleracea* | Brassicaceae | *Brassica* | *B. oleracea* |
| `0112` | Maize / Corn | *Zea mays* | Poaceae | *Zea* | *Z. mays* |
| `0111` | Bread Wheat | *Triticum aestivum* | Poaceae | *Triticum* | *T. aestivum* |
| `0113` | Asian Rice | *Oryza sativa* | Poaceae | *Oryza* | *O. sativa* |
| `0141` | Soybean | *Glycine max* | Fabaceae | *Glycine* | *G. max* |
| `0133` | Wine / Table Grape | *Vitis vinifera* | Vitaceae | *Vitis* | *V. vinifera* |
| `0134` | Domestic Apple | *Malus domestica* | Rosaceae | *Malus* | *M. domestica* |
| `0144` | Canola / Rapeseed | *Brassica napus* | Brassicaceae | *Brassica* | *B. napus* |
| `0125` | Chili / Bell Pepper | *Capsicum annuum* | Solanaceae | *Capsicum* | *C. annuum* |

---

## 3. NCBI Taxonomy Resolution
Every crop scientific name is resolved against the **National Center for Biotechnology Information (NCBI) Taxonomy Database** via programmatic Entrez E-utilities:

- **Resolver Service**: `app.ingestion.ncbi_resolver.NCBITaxonomyResolver`
- **Resolution Strategy**:
  1. Local verified memory cache hit
  2. Live NCBI Entrez REST query (`esearch` + `esummary`)
  3. Strict Fallback: If a taxon cannot be verified with confidence, it is explicitly flagged `UNRESOLVED` (`taxonomy_status: "UNRESOLVED"`).
  4. **Zero Fabrication Rule**: Under no circumstances does the system guess or fabricate a TaxID.

---

## 4. Provenance & Audit Fields
Each crop record stored in the `crops` table contains the following metadata:
- `crop_code`: Authoritative FAO ICC 4-digit code
- `ncbi_tax_id`: Verified NCBI Taxonomy ID
- `taxonomy_status`: `"RESOLVED"` or `"UNRESOLVED"`
- `taxonomy_lineage`: Array of phylogenetic clades (Kingdom to Genus)
- `source`: `"FAO Indicative Crop Classification (ICC) v1.1"`
- `source_version`: `"ICC-1.1-2020"`
- `evidence_level`: `"OFFICIAL_FAO_CLASSIFICATION"`
- `retrieved_at`: ISO 8601 UTC timestamp
