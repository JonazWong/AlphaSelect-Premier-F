# Command Reference Card – Print This Out

## Installation (One Time)

### Windows
```bash
# Option 1: Chocolatey (if installed)
choco install doctl

# Option 2: Manual
# 1. Download: https://github.com/digitalocean/doctl/releases
# 2. Extract to: C:\doctl
# 3. Add to PATH (Environment Variables)
# 4. Restart PowerShell
```

### macOS
```bash
brew install doctl
```

### Linux
```bash
wget https://github.com/digitalocean/doctl/releases/download/v1.107.0/doctl-1.107.0-linux-amd64.tar.gz
tar xf doctl-1.107.0-linux-amd64.tar.gz
sudo mv doctl /usr/local/bin
```

---

## Authentication (One Time)

```bash
# Get token first from:
# https://cloud.digitalocean.com/account/api/tokens

# Then authenticate
doctl auth init
# Paste token when prompted

# Verify
doctl account get
```

---

## Deployment (Main Commands)

```bash
# Go to your project
cd AlphaSelect-Premier-F

# Validate configuration
doctl apps spec validate .do/app.yaml

# Create app (COPY THE APP_ID FROM OUTPUT!)
doctl apps create --spec .do/app.yaml

# Watch deployment (replace ABC123 with your APP_ID)
doctl apps logs ABC123 --follow

# Get your live URL
doctl apps get ABC123
```

---

## Daily Commands (After Deployment)

```bash
# View app status
doctl apps get <app-id>

# View logs (latest 100 lines)
doctl apps logs <app-id>

# Watch logs live (press Ctrl+C to stop)
doctl apps logs <app-id> --follow

# Watch backend logs only
doctl apps logs <app-id> --service=backend --follow

# Watch frontend logs only
doctl apps logs <app-id> --service=frontend --follow

# Watch celery logs only
doctl apps logs <app-id> --service=celery-worker --follow
```

---

## Update Commands (After Changing app.yaml)

```bash
# Update app configuration
doctl apps update <app-id> --spec .do/app.yaml

# View deployment history
doctl apps deployment-list <app-id>

# List all your apps
doctl apps list

# Delete an app
doctl apps delete <app-id>
```

---

## Full Command Reference

| Command | Purpose |
|---------|---------|
| `doctl version` | Show doctl version |
| `doctl auth init` | Authenticate with API token |
| `doctl account get` | View account info |
| `doctl apps list` | List all apps |
| `doctl apps get <id>` | View app details |
| `doctl apps create --spec .do/app.yaml` | Create new app |
| `doctl apps update <id> --spec .do/app.yaml` | Update app config |
| `doctl apps delete <id>` | Delete app |
| `doctl apps logs <id>` | View logs |
| `doctl apps logs <id> --follow` | Watch logs live |
| `doctl apps logs <id> --service=backend` | Backend logs only |
| `doctl apps logs <id> --service=frontend` | Frontend logs only |
| `doctl apps logs <id> --service=celery-worker` | Celery logs only |
| `doctl apps spec validate .do/app.yaml` | Validate app.yaml |
| `doctl apps deployment-list <id>` | View deployment history |
| `doctl database list` | List databases |

---

## Troubleshooting Commands

```bash
# "doctl: command not found"
# → Restart PowerShell or add to PATH

# "Validating token... FAILED"
# → doctl auth init (get new token first)

# App won't deploy
# → doctl apps logs <app-id> --follow (check for errors)

# Containers crashing
# → doctl apps logs <app-id> --follow (check error messages)

# Can't connect to database
# → Check app.yaml has DATABASE_URL and REDIS_URL secrets
```

---

## Variables to Replace

When you see: `<app-id>` or `ABC123`
Replace with: Your actual app ID (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

Example:
```bash
# Don't do this:
doctl apps logs <app-id>

# Do this:
doctl apps logs a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

## Quick Copy-Paste Deployment

```bash
# Step 1
doctl auth init

# Step 2
cd C:\Users\YourName\AlphaSelect-Premier-F

# Step 3
doctl apps create --spec .do/app.yaml

# Step 4: Copy APP_ID from step 3 output
# Step 5
doctl apps logs APP_ID --follow

# Wait 5-10 minutes for ACTIVE status
# Step 6
doctl apps get APP_ID
```

---

## Status Values

When you see a Status, it means:

| Status | Meaning | Action |
|--------|---------|--------|
| `PENDING_BUILD` | Building Docker images | Wait and watch logs |
| `BUILDING` | In progress | Wait and watch logs |
| `ACTIVE` | Live and running | ✅ App is ready! |
| `SUPERSEDED` | Old version (new one active) | No action needed |
| `ERROR` | Something failed | Check logs: `doctl apps logs <id>` |
| `CRASHED` | Service crashed | Check logs, redeploy |

---

## What to Do When Something Goes Wrong

1. **Check logs first:**
   ```bash
   doctl apps logs <app-id> --follow
   ```

2. **Check status:**
   ```bash
   doctl apps get <app-id>
   ```

3. **If stuck, rebuild:**
   ```bash
   doctl apps update <app-id> --spec .do/app.yaml
   ```

4. **If still broken:**
   - Read `DEPLOYMENT_CHECKLIST.md`
   - Check environment variables are set
   - Verify `.do/app.yaml` is valid
   - Share the error message

---

## Print This Card!

Save this as a bookmark or print it out and keep it nearby while deploying.

---

## Key Takeaways

✅ Install once: `choco install doctl` (Windows)  
✅ Authenticate once: `doctl auth init`  
✅ Deploy: `doctl apps create --spec .do/app.yaml`  
✅ Monitor: `doctl apps logs <app-id> --follow`  
✅ Update: `doctl apps update <app-id> --spec .do/app.yaml`  

That's all you need!
