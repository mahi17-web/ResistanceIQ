# ResistanceIQ — Horizontal & Vertical Scaling Plan

## 1. Current Capacity Baseline

- **Inference Latency**: $< 1.0\text{ ms}$ per candidate evaluation (single CPU core).
- **Throughput**: ~1,000 predictions/sec across 4 Uvicorn ASGI workers.
- **Database Load**: Low memory footprint; lightweight relational joins on indexed `organization_id` foreign keys.

---

## 2. Progressive Scaling Stages

### Phase 1: High-Concurrency Discovery Screening (10k+ Candidates/Day)
- Scale backend API horizontally across 2–4 container instances behind Application Load Balancer.
- Retain embedded in-memory inference (zero network roundtrips between API and ML layer).

### Phase 2: Multi-Corpus Batch Screening (100k+ In-Silico Libraries)
- Extract batch processing into asynchronous Celery/Redis worker queues.
- Asynchronous status polling via `GET /api/v1/forecasts/{id}`.

### Phase 3: Enterprise Multi-Region Deployment
- Deploy PostgreSQL read-replicas in regional clusters.
- Serve frontend static assets via worldwide Anycast CDN edge nodes.
