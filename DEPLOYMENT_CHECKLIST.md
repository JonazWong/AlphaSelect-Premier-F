# AlphaSelect – Complete Deployment Guide

## Overview

Your project now has a **production-ready CI/CD pipeline** with:
- ✅ Code quality checks (linting, type checking, tests)
- ✅ Docker image vulnerability scanning
- ✅ Automated image builds and registry push
- ✅ Health checks and integration tests
- ✅ DigitalOcean deployment automation

---

## Step 1: Push Your Code

```bash
git push origin copilot/add-github-actions-ci-healthcheck
# Then create a Pull Request to main
# Once approved, merge to main
```

**GitHub will automatically:**
- Run CI quality checks (backend lint, frontend ESLint, Docker builds)
- Run health check tests (full docker-compose stack)
- If all pass, build and push images to GitHub Container Registry

---

## Step 2: Set Up DigitalOcean Deployment

### Via CLI (Recommended)

```bash
# 1. Install doctl
brew install doctl  # macOS
# OR: choco install doctl  # Windows
# OR: apt-get install doctl  # Linux

# 2. Authenticate
doctl auth init
# Paste your DigitalOcean API token from:
# https://cloud.digitalocean.com/account/api/tokens

# 3. Verify your app spec
doctl apps spec validate .do/app.yaml

# 4. Create your app
doctl apps create --spec .do/app.yaml

# 5. Check deployment status
doctl apps list
doctl apps get <app-id>
```

### Via Web UI

1. Go to **DigitalOcean Dashboard → Apps**
2. Click **"Create App"** → **GitHub**
3. Select your repository
4. Look for **"Edit configuration"** or **"Paste app spec"**
5. Paste the contents of `.do/app.yaml`
6. Click **"Next"** → **"Review"** → **"Create"**

---

## Step 3: Configure Environment Variables

In DigitalOcean, set these **secrets** in the App settings:

```
DATABASE_URL          secret
REDIS_URL             secret
SECRET_KEY            secret
MEXC_API_KEY          secret (if using MEXC)
MEXC_SECRET_KEY       secret (if using MEXC)
```

These are marked as `type: SECRET` in `.do/app.yaml`, so DigitalOcean will automatically create secret input fields.

---

## Workflow Pipeline Explained

### On Every Push to main or PR:

```
1. CI – Code Quality (5-10 min)
   ├─ Backend: flake8, black, isort, mypy, pytest
   ├─ Frontend: ESLint, build check
   └─ Docker: Build backend + frontend images (no push)

2. CI – Docker Compose Health Check (15-20 min)
   ├─ Start postgres, redis, backend, celery, frontend
   ├─ Poll /health endpoint until ready
   └─ Verify all services start correctly

3. Security – Docker Image Scan (10-15 min) [main branch only]
   ├─ Scan backend image with Trivy
   ├─ Scan frontend image with Trivy
   └─ Upload results to GitHub Security tab
```

### On Push to main + CI Passes:

```
4. Build & Push – Docker Images (10-15 min)
   ├─ Build backend image
   ├─ Push to ghcr.io/{owner}/alphaselect/backend:latest
   ├─ Build frontend image
   └─ Push to ghcr.io/{owner}/alphaselect/frontend:latest

5. CD – Deploy to DigitalOcean (5-10 min)
   ├─ Auto-triggers only if health checks passed
   └─ Updates your app on DigitalOcean
```

**Total time:** ~45-60 minutes for a full deploy cycle.

---

## Workflow Status

Check your workflows in GitHub:

1. Go to **Actions** tab
2. Click any workflow to see details
3. Green checkmarks = passed
4. Red X = failed (view logs to debug)
5. Yellow dot = running

---

## Key Files

| File | Purpose |
|------|---------|
| `.do/app.yaml` | DigitalOcean app configuration (3 services, 2 databases) |
| `.github/workflows/ci-quality.yml` | Code quality checks |
| `.github/workflows/ci-compose-healthcheck.yml` | Full stack integration tests |
| `.github/workflows/security-scan.yml` | Vulnerability scanning |
| `.github/workflows/docker-push.yml` | Build & push images |
| `.github/workflows/deploy-do.yml` | DigitalOcean deployment |
| `backend/Dockerfile` | Multi-stage Python/FastAPI build |
| `frontend/Dockerfile` | Multi-stage Next.js build |
| `docker-compose.yml` | Local development (docker compose up) |

---

## Local Testing Before Deployment

Always test locally first:

```bash
# 1. Copy environment variables
cp .env.example .env
# Edit .env with your MEXC credentials and secrets

# 2. Build and start locally
docker compose up -d --build

# 3. Wait 30-60 seconds for services to start

# 4. Test endpoints
curl http://localhost:3000/health          # Frontend
curl http://localhost:8000/api/v1/health   # Backend

# 5. View logs
docker compose logs -f backend
docker compose logs -f frontend

# 6. Stop when done
docker compose down -v
```

---

## Monitoring Deployments

### GitHub Actions
- **Actions tab** → See all workflow runs
- **Pull Requests** → See status checks for each PR
- **Branches** → See build status on commits

### DigitalOcean
```bash
# Check app status
doctl apps get <app-id>

# View deployment history
doctl apps deployment-list <app-id>

# View logs
doctl apps logs <app-id> --follow

# View specific service logs
doctl apps logs <app-id> --service=backend
```

---

## Troubleshooting

### GitHub Actions Failures

**CI Quality checks fail:**
- Run `flake8 backend/app` locally to see lint errors
- Run `black backend/app` to auto-fix formatting
- Run `npm run lint -- --fix` in frontend
- Commit fixes and push again

**Docker Compose health check fails:**
- Run `docker compose up -d --build` locally
- Check `docker logs alphaselect-backend`
- Check `docker logs alphaselect-frontend`
- Fix the issue, commit, push

**Image scan shows vulnerabilities:**
- Check `.github/workflows/security-scan.yml` for severity filter
- Update base image versions in Dockerfiles if needed
- Rebuild and push

### DigitalOcean Deployment

**"No components detected":**
- Use CLI: `doctl apps create --spec .do/app.yaml`
- Verify `.do/app.yaml` exists and is valid
- Check `dockerfile_path` values are correct

**Services failing to start:**
- Check environment variables are set
- Verify health check endpoints exist
- View logs: `doctl apps logs <app-id>`

**Database connection errors:**
- Ensure `DATABASE_URL` and `REDIS_URL` are set as secrets
- Check DigitalOcean created the databases
- Verify Dockerfiles can access `/var/run/secrets/` for DO secrets

---

## Security Best Practices

✅ **What's in place:**
- Multi-stage Dockerfiles (no build tools in runtime)
- Non-root user in containers
- Health checks for auto-recovery
- Vulnerability scanning on every push
- Secrets management via GitHub + DigitalOcean
- Image layer caching to reduce attack surface

✅ **What you should do:**
- Rotate `SECRET_KEY` on deployment
- Use strong database passwords
- Enable 2FA on GitHub and DigitalOcean
- Review security scan results regularly
- Keep base images updated (python:3.11, node:20)

---

## Scaling & Production

### Current Setup
- Backend: 1 instance (professional-xs)
- Frontend: 1 instance (basic-xs)
- Celery: 1 instance (professional-xs)
- PostgreSQL: Managed by DigitalOcean
- Redis: Managed by DigitalOcean

### To Scale Up
Edit `.do/app.yaml`:
```yaml
backend:
  instance_count: 2  # or more
  instance_size_slug: professional-s  # or larger
```

Then redeploy:
```bash
doctl apps update <app-id> --spec .do/app.yaml
```

---

## Next Steps

1. **Push your code:**
   ```bash
   git push origin copilot/add-github-actions-ci-healthcheck
   git push origin main  # after PR approval
   ```

2. **Watch GitHub Actions:**
   - Go to Actions tab
   - See workflows run
   - Verify all pass

3. **Deploy to DigitalOcean:**
   ```bash
   doctl auth init
   doctl apps create --spec .do/app.yaml
   ```

4. **Test your app:**
   - Get the live URL from DigitalOcean
   - Visit `https://{your-app}.ondigitalocean.app`
   - Test features

5. **Monitor:**
   - Check GitHub for issues
   - Check DigitalOcean for errors
   - Review security scan results

---

## References

- [DigitalOcean Apps Documentation](https://docs.digitalocean.com/products/app-platform/)
- [DigitalOcean App Spec Reference](https://docs.digitalocean.com/products/app-platform/references/app-spec-reference/)
- [GitHub Actions Documentation](https://docs.docker.com/build/ci/github-actions/)
- [doctl Documentation](https://docs.digitalocean.com/reference/doctl/)

---

## Summary

You now have:

✅ 5 automated GitHub Actions workflows  
✅ Code quality + security scanning  
✅ Docker image builds + registry push  
✅ Full stack health checks  
✅ DigitalOcean deployment ready  
✅ CI/CD pipeline that's production-grade  

Everything is configured. Ready to deploy!

**Next:** `git push` and then `doctl apps create --spec .do/app.yaml`
