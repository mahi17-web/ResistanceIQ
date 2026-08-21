# ResistanceIQ — Production Domain & SSL/TLS Configuration

## 1. Domain Placeholders

For production deployment, the platform requires two dedicated subdomains:

| Target Subdomain Placeholder | Target Service | Purpose |
|---|---|---|
| `app.resistanceiq.example.com` | Frontend SPA | Web user interface for research analysts and discovery teams. |
| `api.resistanceiq.example.com` | FastAPI Backend | REST API endpoints and ML inference bridge. |

---

## 2. DNS Record Mapping

```text
Type    Host                          Value                       TTL
------------------------------------------------------------------------
A       app.resistanceiq.example.com  <LOAD_BALANCER_OR_CDN_IP>   300
A       api.resistanceiq.example.com  <LOAD_BALANCER_OR_API_IP>   300
CNAME   www.resistanceiq.example.com  app.resistanceiq.example.com 300
```

---

## 3. SSL / TLS Certificate Policy
- **TLS Version**: Strict TLS 1.3 preferred, TLS 1.2 minimum.
- **Certificate Authority**: Let's Encrypt automated certbot or AWS Certificate Manager (ACM).
- **HSTS Policy**: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`.
- **Automatic Redirect**: All plaintext port 80 requests must immediately redirect to HTTPS (301 Permanent Redirect).

---

## 4. CORS Whitelist Policy

Backend `BACKEND_CORS_ORIGINS` environment variable must be configured strictly as:

```json
["https://app.resistanceiq.example.com", "https://staging.resistanceiq.example.com"]
```

Unrestricted wildcards (`*`) are prohibited in production.
