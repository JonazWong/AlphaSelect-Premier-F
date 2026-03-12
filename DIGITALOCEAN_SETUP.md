# DigitalOcean Deployment Guide

> **Single App Spec:** The only supported DigitalOcean App Platform spec is **`.do/app.yaml`**.
> Do not use any other spec file (e.g. the old `alpha.yaml` has been removed).
> When configuring or updating the app on DigitalOcean, always point it at `.do/app.yaml`.

> **Backend API Docs:** `/docs` and `/redoc` are **not** publicly routed through the App Platform ingress.
> To access the interactive API documentation, use the backend component's direct URL
> (available under **Components → backend → Live URL** in the DigitalOcean dashboard),
> or temporarily port-forward to the container for local inspection.

---

# DigitalOcean Deployment – "No Components Detected" Fix

## Problem
When creating an app on DigitalOcean, you get: **"No components detected"**

## Solutions

### Solution 1: Use app.yaml (Recommended)

Your `app.yaml` is now updated and in the root directory. Use it when creating the app:

**Steps:**
1. Go to DigitalOcean Dashboard → Apps → Create App
2. Select "GitHub" as source
3. Connect your repository
4. **Important:** Look for "App Spec" or "Configuration" option
5. Choose "Use existing app spec" if available, or paste the `app.yaml` content
6. DigitalOcean will auto-detect all 3 services: backend, frontend, celery-worker

### Solution 2: Manual Component Detection

If DigitalOcean still doesn't detect components:

1. **Go to:** Apps → Create App → GitHub → Select Repository
2. **DO NOT let it auto-detect** – instead, manually add components:
   - Click "Add Component"
   - Select **Backend Service**
     - Source: Docker (GitHub repository)
     - Dockerfile path: `backend/Dockerfile`
     - HTTP Port: `8000`
     - Health check: `/api/v1/health`
   - Click "Add Component"
   - Select **Frontend Service**
     - Source: Docker (GitHub repository)
     - Dockerfile path: `frontend/Dockerfile`
     - HTTP Port: `3000`
     - Health check: `/health`
   - Click "Add Component"
   - Select **Worker Service**
     - Source: Docker (GitHub repository)
     - Dockerfile path: `backend/Dockerfile`
     - Run command: `celery -A app.tasks.celery_app worker --loglevel=info`

3. **Add Databases:**
   - Click "Add Database"
   - Redis, version 7, name: `redis-cache`
   - (PostgreSQL is external — do NOT add a managed PG database)

4. **Set Environment Variables:**
   - `DATABASE_URL` → Secret: `postgresql://doadmin:<password>@premier-do-user-32973725-0.l.db.ondigitalocean.com:25060/defaultdb?sslmode=require`
   - `REDIS_URL` → Secret (or auto-injected from managed Redis)
   - `SECRET_KEY` → Secret
   - `MEXC_API_KEY` → Secret (if using MEXC)
   - `MEXC_SECRET_KEY` → Secret (if using MEXC)
   - `NEXT_PUBLIC_API_URL` → `https://${backend.PUBLIC_URL}`

### Solution 3: Use DigitalOcean CLI

```bash
# Install doctl if you haven't
# https://docs.digitalocean.com/reference/doctl/how-to/install/

# Authenticate
doctl auth init

# Create app from spec
doctl apps create --spec app.yaml
```

---

## Key Points in Your app.yaml

**Services Configuration:**
- `source_dir`: Where the service code lives (backend/ or frontend/)
- `dockerfile_path`: Dockerfile location within that directory
- `http_port`: Port the service listens on
- `health_check.http_path`: Endpoint to check if service is healthy

**Database Variables:**
- Backend/Celery connect via `DATABASE_URL` (external DigitalOcean PostgreSQL — set as Secret in App Platform UI)
- Backend/Celery connect via `REDIS_URL` (managed Redis)

**Service-to-Service Communication:**
- Backend URL available as `${backend.PUBLIC_URL}` in frontend env vars
- Frontend URL available as `${frontend.PUBLIC_URL}` in backend env vars

---

## Common Issues & Fixes

### "No Dockerfile found"
- Ensure `dockerfile_path` matches your repo structure
- ✅ backend/Dockerfile exists
- ✅ frontend/Dockerfile exists

### "Port already in use"
- Each service gets its own container, different ports OK
- Backend: 3000 exposed internally, mapped to public port
- Frontend: 8000 exposed internally, mapped to public port
- Celery: No HTTP port (background worker)

### "Health check fails"
- Backend: Ensure `/api/v1/health` endpoint returns HTTP 200
- Frontend: Ensure `/health` endpoint returns HTTP 200
- Check Dockerfile EXPOSE directive matches `http_port`

### Services can't connect to each other
- Use service names: `backend.PUBLIC_URL` (not localhost)
- Environment variables auto-resolve to service URLs

### Database connections fail
- `DATABASE_URL` must be set as a Secret in App Platform UI pointing to the external DigitalOcean PostgreSQL
- Host: `premier-do-user-32973725-0.l.db.ondigitalocean.com` port `25060` with `sslmode=require`
- `REDIS_URL` is auto-set by DigitalOcean managed Redis
- Don't override them in app.yaml with hardcoded values
- Check that `source_dir` is correct (postgres/redis need backend connection)

---

## Deployment Flow

1. Push code to GitHub `main` branch
2. DigitalOcean detects new push (optional `deploy_on_push: true`)
3. Builds Dockerfiles for each service
4. Starts services with environment variables
5. Runs health checks
6. Routes traffic to frontend, backend

---

## Next Steps

1. **Test locally first:**
   ```bash
   docker compose up -d --build
   curl http://localhost:3000/health
   curl http://localhost:8000/api/v1/health
   ```

2. **Push the updated app.yaml to GitHub:**
   ```bash
   git add app.yaml
   git commit -m "Update app.yaml for DigitalOcean deployment"
   git push origin main
   ```

3. **Create app in DigitalOcean:**
   - Go to Apps → Create App
   - Select GitHub + your repo
   - Choose "Use existing app spec" (if available)
   - Or paste your app.yaml content
   - Or manually add components using Solution 2

4. **Monitor deployment:**
   - Check "Deployments" tab
   - View logs for each service
   - Verify health checks pass

---

## Files Created/Updated

- ✅ **app.yaml** – Updated with correct service definitions
- ✅ **backend/Dockerfile** – Already good (multi-stage, health check)
- ✅ **frontend/Dockerfile** – Already good (multi-stage, health check)
- ✅ **docker-compose.yml** – Already configured for local dev

---

## References

- [DigitalOcean App Spec Reference](https://docs.digitalocean.com/products/app-platform/references/app-spec-reference/)
- [DigitalOcean Dockerfile Guide](https://docs.digitalocean.com/products/app-platform/how-to/build-dockerfile/)
- [DigitalOcean Health Checks](https://docs.digitalocean.com/products/app-platform/concepts/health-checks/)

Feel free to ask if you hit any other issues during deployment!
