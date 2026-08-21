# ResistanceIQ — APRD Source Feasibility & Access Assessment

## 1. Database Overview

* **Full Name**: Arthropod Pesticide Resistance Database (APRD)
* **Host Institution**: Michigan State University (Department of Entomology)
* **Collaborating Organizations**: USDA National Institute of Food and Agriculture (NIFA), Insecticide Resistance Action Committee (IRAC)
* **Official URL**: [https://www.pesticideresistance.org/](https://www.pesticideresistance.org/)
* **Primary Maintainers**: Dr. David Mota-Sanchez, Dr. Mark Whalon (Founding), Dr. Larry Gut

---

## 2. Technical Access Mechanisms & Availability

### 2.1 Public Search Gateway
- **Availability**: Free, open public access without user login.
- **Search Criteria**: Searchable by Pest Species, Pesticide Active Ingredient, Chemical Class, Mode of Action, Country / US State, and Year range.
- **Returned Public Fields**:
  - `Genus` & `Species` (e.g. *Plutella xylostella*)
  - `Common Name` (e.g. Diamondback moth)
  - `Active Ingredient` (e.g. Permethrin, Spinosad)
  - `Class` & `IRAC Mode of Action`
  - `Country` & `State/Province`
  - `First Reported Year` & `Publication Year`
  - `Resistance Type` (e.g. Field Documented, Laboratory Selection)
  - `Literature Citation Reference`

### 2.2 Detailed Record Bioassay Data & Registration
- **User Accounts**: Registration is required for researchers submitting new resistance reports.
- **Granular Toxicological Data**: Certain detailed bioassay records (exact $LC_{50}$, slope of probit regression line, diagnostic concentration) are accessible via specialized research views or collaboration requests.
- **Bulk API Availability**: **No public REST API is advertised on the web gateway.** Bulk data analysis is performed through research data agreements, periodic archive releases on Mendeley Data, or structured ingestion from public search queries.

---

## 3. Legal & Ethical Ingestion Policy

1. **Permitted Use**: Academic research, computational toxicological evaluation, and non-commercial model validation are permitted under fair citation terms.
2. **Scraping Prohibition**: Automated, aggressive web scraping that burdens the university server infrastructure is strictly prohibited.
3. **Official Data Acquisition Workflow**:
   - Ingestion is conducted via structured research dataset imports (`data/raw/aprd_*.csv`).
   - Researchers requiring multi-thousand full-corpus database synchronization should submit a formal data sharing inquiry to the APRD administrative team at MSU.

---

## 4. Scientific Biases & Interpretation Warnings

The APRD explicitly states that records reflect **documented publications in scientific literature**, not an exhaustive real-time census of every agricultural field.

**Mandatory Interpretation Rules**:
1. **Absence of Record $\ne$ Absence of Resistance**: An active ingredient without an APRD record may simply be under-monitored in a specific geographic area.
2. **Record Count $\ne$ Resistance Probability**: Pests with massive economic research interest (e.g. *Tetranychus urticae*, *Myzus persicae*, *Helicoverpa armigera*) have hundreds of publications due to global research funding, whereas minor specialty crop pests have few publications regardless of resistance status.
