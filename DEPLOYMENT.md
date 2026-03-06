# Deployment Guide

## Overview

This guide covers deploying AlphaSelect Premier F to production using DigitalOcean App Platform.

## Prerequisites

1. **DigitalOcean Account**: Sign up at [digitalocean.com](https://www.digitalocean.com/)
2. **GitHub Repository**: Push your code to GitHub
3. **MEXC API Credentials**: Get from [MEXC](https://www.mexc.com/)

## Local Development

### Using Docker Compose (Recommended)

1. **Clone the repository**
```bash
git clone https://github.com/JonazWong/AlphaSelect-Premier-F.git
cd AlphaSelect-Premier-F
```

2. **Setup environment variables**
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Edit backend/.env with your settings
nano backend/.env
```

3. **Start all services**
```bash
docker compose up -d
```

4. **Check service status**
```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
```

5. **Access the application**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

6. **Stop services**
```bash
docker compose down
```

### Manual Setup

#### Backend

```bash
cd backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
nano .env

# Start PostgreSQL and Redis locally
# (or use Docker for just these services)

# Initialize database
python -m app.db.init_db

# Run server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
nano .env.local

# Run development server
npm run dev
```

## Production Deployment (DigitalOcean)

### Method 1: DigitalOcean App Platform (Recommended)

#### Step 1: Create Managed Databases

1. **PostgreSQL 16**
   - Go to Databases → Create Database
   - Choose PostgreSQL 16
   - Select plan (Basic $15/mo or higher)
   - Choose region (Singapore for Asia)
   - Enable Connection Pools
   - Copy connection string

2. **Redis 7**
   - Go to Databases → Create Database
   - Choose Redis 7
   - Select plan (Basic $15/mo or higher)
   - Choose same region as PostgreSQL
   - Copy connection string

#### Step 2: Create App Platform App

1. **Connect GitHub Repository**
   - Go to Apps → Create App
   - Connect your GitHub account
   - Select `AlphaSelect-Premier-F` repository
   - Choose branch: `main`

2. **Configure Services**

Create `app.yaml` in repository root:

```yaml
name: alphaselect-premier-f
region: sgp

databases:
  - name: postgres-db
    engine: PG
    version: "16"
    production: true
    size: basic-xs

  - name: redis-cache
    engine: REDIS
    version: "7"
    production: true
    size: basic-xs

services:
  - name: backend
    github:
      repo: JonazWong/AlphaSelect-Premier-F
      branch: main
    source_dir: /backend
    dockerfile_path: backend/Dockerfile
    http_port: 8000
    instance_count: 2
    instance_size_slug: basic-xs
    envs:
      - key: DATABASE_URL
        scope: RUN_TIME
        type: SECRET
        value: ${postgres-db.DATABASE_URL}
      - key: REDIS_URL
        scope: RUN_TIME
        type: SECRET
        value: ${redis-cache.REDIS_URL}
      - key: MEXC_API_KEY
        scope: RUN_TIME
        type: SECRET
      - key: MEXC_SECRET_KEY
        scope: RUN_TIME
        type: SECRET
      - key: SECRET_KEY
        scope: RUN_TIME
        type: SECRET
      - key: ALLOWED_ORIGINS
        scope: RUN_TIME
        value: https://your-app.ondigitalocean.app
    health_check:
      http_path: /api/v1/health
      initial_delay_seconds: 60
      period_seconds: 10
      timeout_seconds: 5
      success_threshold: 1
      failure_threshold: 3

  - name: celery-worker
    github:
      repo: JonazWong/AlphaSelect-Premier-F
      branch: main
    source_dir: /backend
    dockerfile_path: backend/Dockerfile
    instance_count: 1
    instance_size_slug: basic-xs
    run_command: celery -A app.tasks.celery_app worker --loglevel=info
    envs:
      - key: DATABASE_URL
        scope: RUN_TIME
        type: SECRET
        value: ${postgres-db.DATABASE_URL}
      - key: REDIS_URL
        scope: RUN_TIME
        type: SECRET
        value: ${redis-cache.REDIS_URL}
      - key: MEXC_API_KEY
        scope: RUN_TIME
        type: SECRET
      - key: MEXC_SECRET_KEY
        scope: RUN_TIME
        type: SECRET

  - name: frontend
    github:
      repo: JonazWong/AlphaSelect-Premier-F
      branch: main
    source_dir: /frontend
    dockerfile_path: frontend/Dockerfile
    http_port: 3000
    instance_count: 2
    instance_size_slug: basic-xs
    build_command: npm run build
    run_command: npm start
    envs:
      - key: NEXT_PUBLIC_API_URL
        scope: RUN_TIME
        value: https://your-backend-url.ondigitalocean.app
      - key: NEXT_PUBLIC_WS_URL
        scope: RUN_TIME
        value: wss://your-backend-url.ondigitalocean.app
    routes:
      - path: /
```

3. **Set Environment Variables**
   - Go to App Settings → Environment Variables
   - Add all required secrets:
     - `MEXC_API_KEY`
     - `MEXC_SECRET_KEY`
     - `SECRET_KEY` (generate strong random key)
     - `DATABASE_URL` (from managed PostgreSQL)
     - `REDIS_URL` (from managed Redis)

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (5-10 minutes)
   - Access your app at the provided URL

#### Step 3: Configure Domain (Optional)

1. **Add Custom Domain**
   - Go to Settings → Domains
   - Add your domain
   - Update DNS records as instructed

2. **Enable SSL**
   - Automatically enabled by DigitalOcean
   - Free Let's Encrypt certificate

### Method 2: DigitalOcean Droplet + Docker

#### Step 1: Create Droplet

1. **Create Droplet**
   - Go to Droplets → Create Droplet
   - Choose Ubuntu 22.04 LTS
   - Select plan ($12/mo or higher)
   - Choose region
   - Add SSH key

2. **Connect to Droplet**
```bash
ssh root@your-droplet-ip
```

#### Step 2: Install Docker

```bash
# Update packages
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

#### Step 3: Deploy Application

```bash
# Clone repository
git clone https://github.com/JonazWong/AlphaSelect-Premier-F.git
cd AlphaSelect-Premier-F

# Setup environment
cp backend/.env.example backend/.env
nano backend/.env
# Edit with your production settings

# Start services
docker compose -f docker-compose.yml up -d

# Check status
docker compose ps
docker compose logs -f
```

#### Step 4: Configure Nginx (Reverse Proxy)

```bash
# Install Nginx
apt install nginx -y

# Create Nginx configuration
nano /etc/nginx/sites-available/alphaselect
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/alphaselect /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### Step 5: Setup SSL with Let's Encrypt

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

## Monitoring

### DigitalOcean Monitoring

1. **Enable Monitoring**
   - App Platform has built-in monitoring
   - Check metrics in dashboard

2. **Setup Alerts**
   - Go to Monitoring → Alerts
   - Create alerts for:
     - High CPU usage
     - High memory usage
     - App crashes
     - Health check failures

### Application Logging

1. **View Logs**
```bash
# App Platform
# Go to your app → Runtime Logs

# Docker
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f celery-worker
```

2. **Log Aggregation (Optional)**
   - Setup Papertrail or Logtail
   - Configure in DigitalOcean App Platform

## Backup & Disaster Recovery

### Database Backups

1. **Automated Backups**
   - Managed PostgreSQL has daily backups
   - 7-day retention by default
   - Can restore from any backup point

2. **Manual Backups**
```bash
# Backup database
pg_dump -h your-db-host -U user -d alphaselect > backup.sql

# Restore database
psql -h your-db-host -U user -d alphaselect < backup.sql
```

### Application Backups

1. **Code**: Use Git tags for releases
2. **AI Models**: Store in DigitalOcean Spaces
3. **Configuration**: Keep `.env` backup securely

## Scaling

### Vertical Scaling
- Increase instance size in App Platform
- Upgrade database plan

### Horizontal Scaling
- Increase instance count for backend/frontend
- Add more Celery workers
- Use load balancer (automatic in App Platform)

## Cost Estimation

### DigitalOcean App Platform
- **Backend**: $12/mo (2 instances)
- **Frontend**: $12/mo (2 instances)
- **Celery Worker**: $6/mo (1 instance)
- **PostgreSQL**: $15/mo
- **Redis**: $15/mo
- **Total**: ~$60/mo

### DigitalOcean Droplet
- **Droplet**: $12-24/mo
- **Managed PostgreSQL**: $15/mo
- **Managed Redis**: $15/mo
- **Total**: ~$42-54/mo

## Troubleshooting

### Application Won't Start
1. Check environment variables
2. Review logs for errors
3. Verify database connection
4. Check Redis connection

### High Memory Usage
1. Reduce instance count
2. Optimize database queries
3. Implement caching
4. Review AI model memory usage

### Slow API Responses
1. Enable Redis caching
2. Add database indexes
3. Optimize queries
4. Increase instance size

### Database Connection Issues
1. Check connection string
2. Verify SSL mode
3. Check connection pool settings
4. Review database logs

## Security Checklist

- [ ] Use strong SECRET_KEY
- [ ] Enable HTTPS/SSL
- [ ] Set proper CORS origins
- [ ] Use managed databases with SSL
- [ ] Enable firewall rules
- [ ] Regular security updates
- [ ] Monitor for vulnerabilities
- [ ] Backup regularly
- [ ] Use read-only MEXC API keys
- [ ] Implement rate limiting
- [ ] Enable database connection pooling

## Support

For deployment issues:
1. Check DigitalOcean documentation
2. Review application logs
3. Open GitHub issue
4. Contact DigitalOcean support

---

**Good luck with your deployment!** 🚀
