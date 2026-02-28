# How to Install & Use doctl – Complete Step-by-Step Guide

## What is doctl?

`doctl` is the **DigitalOcean Command Line Interface**. It lets you:
- Create, delete, manage apps
- View logs and deployments
- Configure databases
- All from your terminal (no clicking in web UI)

---

## Step 1: Download & Install doctl

### Option A: Windows (Easiest)

#### Method 1: Using Chocolatey (if you have it)
```bash
choco install doctl
```

#### Method 2: Download Installer (Recommended if no Chocolatey)
1. Go to: https://github.com/digitalocean/doctl/releases
2. Find the **latest version** (e.g., v1.107.0)
3. Download the file named: `doctl-1.107.0-windows-amd64.zip` (or latest version)
4. Extract the `.zip` file to a folder (e.g., `C:\doctl`)
5. Add to PATH:
   - Press `Win + X` → Click **"System"**
   - Click **"Advanced system settings"** → **"Environment Variables"**
   - Click **"New"** under "User variables"
   - Variable name: `PATH`
   - Variable value: `C:\doctl` (or wherever you extracted it)
   - Click OK → OK → OK
6. Open **new Command Prompt or PowerShell**
7. Test it:
   ```bash
   doctl version
   ```
   You should see a version number.

### Option B: macOS

```bash
# If you have Homebrew
brew install doctl

# Test it
doctl version
```

### Option C: Linux

```bash
# Download latest version
cd ~
wget https://github.com/digitalocean/doctl/releases/download/v1.107.0/doctl-1.107.0-linux-amd64.tar.gz

# Extract
tar xf ~/doctl-1.107.0-linux-amd64.tar.gz

# Move to PATH
sudo mv ~/doctl /usr/local/bin

# Test it
doctl version
```

---

## Step 2: Get Your DigitalOcean API Token

1. Go to: https://cloud.digitalocean.com/account/api/tokens
   - Log in if needed
2. Click **"Generate New Token"** (blue button)
3. Token name: `doctl-cli` (or anything you want)
4. Check the box: **"Write (Optional)"** ✓
5. Click **"Generate Token"**
6. **COPY THE TOKEN** (you'll only see it once!)
7. Save it somewhere safe (or keep the page open for Step 3)

Example token looks like:
```
dop_v1_abc123def456xyz789abc123def456xyz789abc123def456
```

---

## Step 3: Authenticate doctl

Open **Command Prompt** or **PowerShell** (or Terminal on Mac/Linux):

```bash
doctl auth init
```

You'll see:
```
DigitalOcean access token: 
```

Paste your token here (from Step 2), then press Enter.

Example:
```
DigitalOcean access token: dop_v1_abc123def456...
Validating token... OK
```

Done! You're authenticated.

---

## Step 4: Verify Authentication

```bash
doctl account get
```

You should see your account info:
```
Email           Droplet Limit    Floating IP Limit
your-email@... 10               3
```

If you see this, you're ready!

---

## Step 5: Deploy Your App

### 5a. Navigate to Your Project

```bash
# Go to your project folder
cd C:\Users\YourName\Documents\AlphaSelect-Premier-F
# or wherever you cloned the repo
```

Verify the `.do/app.yaml` file exists:
```bash
# Windows PowerShell
dir .do\app.yaml

# Mac/Linux
ls -la .do/app.yaml
```

### 5b. Validate Your app.yaml

```bash
doctl apps spec validate .do/app.yaml
```

You should see:
```
✓ Spec is valid
```

If you see errors, the app.yaml has issues. Let me know!

### 5c. Create Your App

```bash
doctl apps create --spec .do/app.yaml
```

DigitalOcean will start creating your app. You'll see output like:

```
ID: abc123def456xyz
Name: alphaselect-premier-f
Region: sgp
Status: PENDING_BUILD
```

**Copy the ID** (e.g., `abc123def456xyz`) – you'll need it next.

---

## Step 6: Watch Deployment Progress

```bash
# Replace abc123def456xyz with your APP_ID from above
doctl apps get abc123def456xyz

# You should see:
# Status: PENDING_BUILD → ACTIVE (when done)
```

Or watch the logs in real-time:

```bash
doctl apps logs abc123def456xyz --follow
```

This shows live logs from your app as it deploys (Ctrl+C to stop).

Wait for status to change to **ACTIVE** (usually 5-10 minutes).

---

## Step 7: Get Your Live App URL

```bash
doctl apps get abc123def456xyz
```

Look for the line:
```
Live URL: https://alphaselect-premier-f-abc123.ondigitalocean.app
```

**Click that URL** in your browser! Your app is live.

---

## Useful Commands After Deployment

### View all your apps
```bash
doctl apps list
```

### View app details
```bash
doctl apps get <app-id>
```

### View live logs
```bash
doctl apps logs <app-id> --follow
```

### View logs from specific service
```bash
doctl apps logs <app-id> --service=backend
doctl apps logs <app-id> --service=frontend
doctl apps logs <app-id> --service=celery-worker
```

### Restart your app
```bash
doctl apps update <app-id> --spec .do/app.yaml
```

### Delete your app
```bash
doctl apps delete <app-id>
```

---

## Troubleshooting

### "doctl: command not found"
- **Windows:** You didn't add it to PATH correctly. Restart PowerShell/CMD after adding to PATH.
- **Mac:** Try `brew install doctl` instead
- **Linux:** Make sure `/usr/local/bin` is in your PATH: `echo $PATH`

### "Validating token... FAILED"
- Your API token is wrong or invalid
- Go back to Step 2 and get a new token
- Make sure you don't have extra spaces when pasting

### "Spec is invalid"
- Your `.do/app.yaml` has syntax errors
- Make sure it's properly formatted (check indentation)
- Share the error message and I can fix it

### "Error creating app: something went wrong"
- Check you have a DigitalOcean account with credits
- Verify your API token has "Write" permission (Step 2)
- Try again after a few minutes

---

## Full Command Reference

| Command | What it does |
|---------|-------------|
| `doctl auth init` | Authenticate with API token |
| `doctl account get` | View your account info |
| `doctl apps spec validate .do/app.yaml` | Check if app.yaml is valid |
| `doctl apps create --spec .do/app.yaml` | Create your app |
| `doctl apps list` | List all your apps |
| `doctl apps get <app-id>` | View app details |
| `doctl apps logs <app-id>` | View app logs (latest 100 lines) |
| `doctl apps logs <app-id> --follow` | Watch logs live |
| `doctl apps update <app-id> --spec .do/app.yaml` | Update app configuration |
| `doctl apps delete <app-id>` | Delete app |
| `doctl database list` | List databases |

---

## Example: Complete Deploy from Start to Finish

```bash
# 1. Install (Windows with Chocolatey)
choco install doctl

# 2. Authenticate
doctl auth init
# Paste your token when prompted

# 3. Go to your project
cd C:\Users\YourName\AlphaSelect-Premier-F

# 4. Validate
doctl apps spec validate .do/app.yaml

# 5. Deploy
doctl apps create --spec .do/app.yaml
# Copy the APP_ID from output

# 6. Watch deployment (replace ABC123 with your app ID)
doctl apps logs ABC123 --follow

# 7. When status is ACTIVE, get URL
doctl apps get ABC123

# 8. Visit your app!
# https://alphaselect-premier-f-....ondigitalocean.app
```

---

## Common Issues & Fixes

### Issue: App deployment stuck at "PENDING_BUILD"
**Fix:** Check logs with `doctl apps logs <app-id>` to see error

### Issue: Containers crashing (CrashLoopBackOff)
**Fix:** Check logs and verify environment variables are set

### Issue: Can't connect to database
**Fix:** Verify DATABASE_URL and REDIS_URL are set in DigitalOcean secrets

### Issue: Frontend can't reach backend
**Fix:** Check NEXT_PUBLIC_API_URL is set correctly in app.yaml

---

## Next Steps After Deployment

1. **Test your app**
   - Visit the live URL
   - Click around, test features
   - Check the backend API: `https://{url}/api/v1/health`

2. **Monitor logs**
   ```bash
   doctl apps logs <app-id> --follow
   ```

3. **Set up auto-updates (optional)**
   - Edit `.do/app.yaml`: set `deploy_on_push: true`
   - Now every push to main auto-deploys!
   ```bash
   doctl apps update <app-id> --spec .do/app.yaml
   ```

---

## Questions?

If you get stuck:
1. Check the error message carefully
2. Run `doctl --help` for more info
3. Let me know the error and I'll help debug!

---

## Summary

✅ Install doctl  
✅ Get API token  
✅ Authenticate: `doctl auth init`  
✅ Deploy: `doctl apps create --spec .do/app.yaml`  
✅ Watch logs: `doctl apps logs <app-id> --follow`  
✅ Visit your live app!  

That's it!
