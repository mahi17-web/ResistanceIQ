# ResistanceIQ — Step 28 Production Rollback & Incident Mitigation Protocol

**Scope**: Render Web Service, Vercel Static Deployments, Supabase Database Migrations  

---

## 1. Fast Rollback Playbooks

### A. Backend Rollback (Render):
1. In Render Dashboard, navigate to **resistanceiq-api** $\to$ **Events / Deploys**.
2. Locate the last known good deployment commit.
3. Click the options menu $\to$ **Rollback to this deploy**.
4. Render immediately swaps active routing to the previous container image ($< 30$ seconds).

### B. Frontend Rollback (Vercel):
1. In Vercel Dashboard, navigate to the **Deployments** tab.
2. Locate the previous successful build.
3. Click **...** $\to$ **Promote to Production** / **Rollback**.
4. Edge CDN instantly routes traffic to the previous static bundle ($< 5$ seconds).

### C. Database Migration Rollback (Alembic):
```bash
# Rollback one migration revision
cd resistanceiq/backend
alembic downgrade -1

# Rollback to specific base revision
alembic downgrade 004_knowledge_graph_schema
```

---

## 2. Emergency Isolation

If unexpected security or data boundary issues arise:
1. In Render dashboard, toggle service to **Suspend** to stop API ingress.
2. In Vercel dashboard, enable maintenance password protection or redirect to status page.
3. In Supabase dashboard, terminate active sessions via Connection Management.
