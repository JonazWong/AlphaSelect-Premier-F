# Deploy Your App – Step-by-Step Checklist

## Before You Start
- [ ] You have a DigitalOcean account (free tier ok)
- [ ] You have a GitHub account with this repo
- [ ] You downloaded doctl guides

---

## Step 1: Install doctl ✓

### Windows
```
□ Go to: https://github.com/digitalocean/doctl/releases
□ Download: doctl-1.107.0-windows-amd64.zip
□ Extract to: C:\doctl
□ Open Environment Variables:
  - Press: Win + X
  - Click: System
  - Click: Advanced system settings
  - Click: Environment Variables
  - New variable:
    * Name: PATH
    * Value: C:\doctl
  - Click OK three times
□ Restart PowerShell
□ Test: doctl version
  (Should show version number)
```

### macOS
```
□ brew install doctl
□ Test: doctl version
```

### Linux
```
□ Download: wget https://github.com/digitalocean/doctl/releases/download/v1.107.0/doctl-1.107.0-linux-amd64.tar.gz
□ Extract: tar xf doctl-1.107.0-linux-amd64.tar.gz
□ Move: sudo mv doctl /usr/local/bin
□ Test: doctl version
```

**✓ Completed:** doctl is installed and working

---

## Step 2: Get DigitalOcean API Token ✓

```
□ Go to: https://cloud.digitalocean.com/account/api/tokens
□ Log in to DigitalOcean (create account if needed)
□ Click: "Generate New Token"
□ Fill in:
  - Token name: doctl-cli (or any name)
  - Check: ☑ Write (Optional)
□ Click: "Generate Token"
□ COPY THE TOKEN (appears once only!)
□ Save somewhere safe (you'll need it next)
```

**Token looks like:** `dop_v1_abc123def456...`

**✓ Completed:** You have your API token

---

## Step 3: Authenticate doctl ✓

Open **PowerShell** (Windows) or **Terminal** (Mac/Linux):

```bash
doctl auth init
```

You'll see:
```
DigitalOcean access token:
```

```
□ Paste your token (from Step 2)
□ Press Enter
□ You should see: "Validating token... OK"
```

Test it:
```bash
doctl account get
```

You should see your account email and info.

**✓ Completed:** doctl is authenticated

---

## Step 4: Navigate to Your Project ✓

Open **PowerShell** (Windows) or **Terminal** (Mac/Linux):

```bash
cd C:\Users\YourName\AlphaSelect-Premier-F
```

(Replace with your actual path)

Verify files exist:
```bash
# Windows PowerShell
dir .do\app.yaml

# Mac/Linux
ls -la .do/app.yaml
```

Should see: `.do/app.yaml` exists

**✓ Completed:** You're in your project directory

---

## Step 5: Validate Configuration ✓

```bash
doctl apps spec validate .do/app.yaml
```

Should see:
```
✓ Spec is valid
```

If you see errors, the app.yaml has issues. Let me know!

**✓ Completed:** Your app.yaml is valid

---

## Step 6: Deploy Your App ✓

```bash
doctl apps create --spec .do/app.yaml
```

You'll see output like:
```
ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
Name: alphaselect-premier-f
Status: PENDING_BUILD
```

```
□ Copy the ID from above (e.g., a1b2c3d4-e5f6-7890-abcd-ef1234567890)
□ Save it somewhere (you'll need it for next step)
```

**✓ Completed:** Your app is being created

---

## Step 7: Watch Deployment ✓

Replace `YOUR_APP_ID` with your actual ID from Step 6:

```bash
doctl apps logs YOUR_APP_ID --follow
```

Example:
```bash
doctl apps logs a1b2c3d4-e5f6-7890-abcd-ef1234567890 --follow
```

You'll see live logs. Look for:
```
Status: PENDING_BUILD → BUILDING → ACTIVE
```

```
□ Wait for status to show: ACTIVE (usually 5-10 minutes)
□ When you see ACTIVE, press Ctrl+C to stop
```

**✓ Completed:** Your app is deployed

---

## Step 8: Get Your Live URL ✓

```bash
doctl apps get YOUR_APP_ID
```

Example:
```bash
doctl apps get a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

Look for the line:
```
Live URL: https://alphaselect-premier-f-abc123.ondigitalocean.app
```

```
□ Copy that URL
□ Open it in your browser
□ Your app is live! 🚀
```

**✓ Completed:** Your app is live!

---

## Step 9: Test Your App ✓

```
□ Visit the URL from Step 8
□ Click around, test features
□ Check backend: {url}/api/v1/health (should show {"status":"ok"})
□ Check frontend: {url}/health (should show 200 OK)
```

**✓ Completed:** Your app is working!

---

## Step 10: Monitor Your App ✓ (Ongoing)

```bash
# View app status anytime
doctl apps get YOUR_APP_ID

# View logs anytime
doctl apps logs YOUR_APP_ID --follow

# View specific service logs
doctl apps logs YOUR_APP_ID --service=backend --follow
doctl apps logs YOUR_APP_ID --service=frontend --follow
```

**✓ Completed:** You can monitor your app!

---

## 🎉 You're Done!

Your app is now:
- ✅ Live on DigitalOcean
- ✅ Running 24/7
- ✅ Auto-updates when you push to GitHub
- ✅ Monitored with health checks
- ✅ Backed by PostgreSQL + Redis

---

## Next Time You Make Changes

```bash
# 1. Make code changes locally
# 2. Test with: docker compose up -d --build
# 3. Push to GitHub: git push origin main
# 4. GitHub Actions runs automatically
# 5. When all pass, DigitalOcean auto-deploys
# 6. Your changes are live!
```

**No manual deployment needed!**

---

## If Something Goes Wrong

1. **Check logs:**
   ```bash
   doctl apps logs YOUR_APP_ID --follow
   ```

2. **Check status:**
   ```bash
   doctl apps get YOUR_APP_ID
   ```

3. **Read troubleshooting:**
   Open `DEPLOYMENT_CHECKLIST.md`

---

## Congratulations! 🎉

You just deployed a production app with:
- Backend (FastAPI + Python)
- Frontend (Next.js + React)
- Workers (Celery)
- Database (PostgreSQL)
- Cache (Redis)
- CI/CD (GitHub Actions)

Everything automated and monitored.

**You're awesome!** 🚀
