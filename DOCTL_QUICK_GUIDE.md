# Quick Visual Guide: doctl Installation & Deployment

## Windows Installation (Easiest Way)

### Step 1: Download
```
1. Go to: https://github.com/digitalocean/doctl/releases
2. Find: doctl-1.107.0-windows-amd64.zip (or latest)
3. Click to download
4. Right-click the zip → Extract All
5. Pick a folder (e.g., C:\doctl)
```

### Step 2: Add to PATH
```
1. Press: Windows Key + X
2. Click: System
3. Click: Advanced system settings
4. Click: Environment Variables
5. Under "User variables", click: New
6. Variable name:  PATH
   Variable value: C:\doctl
7. Click OK three times
8. Close and reopen PowerShell
```

### Step 3: Test Installation
```powershell
doctl version
```
Output should show version number ✓

---

## macOS Installation

```bash
brew install doctl
doctl version
```

---

## Get API Token

```
1. Go to: https://cloud.digitalocean.com/account/api/tokens
2. Log in
3. Click: "Generate New Token"
4. Name: doctl-cli
5. Check: Write (Optional) ✓
6. Click: Generate Token
7. COPY THE TOKEN (appears once only!)
8. Keep it safe
```

**Token looks like:**
```
dop_v1_abc123def456xyz789...
```

---

## Authenticate doctl

Open PowerShell or Command Prompt:

```bash
doctl auth init
```

Paste your token when prompted, press Enter.

Test it:
```bash
doctl account get
```

Should show your account info ✓

---

## Deploy Your App (3 Commands)

### Command 1: Navigate to Project
```bash
cd C:\Users\YourName\Documents\AlphaSelect-Premier-F
```

### Command 2: Validate Configuration
```bash
doctl apps spec validate .do/app.yaml
```

Should say: ✓ Spec is valid

### Command 3: Create App
```bash
doctl apps create --spec .do/app.yaml
```

Output:
```
ID: abc123def456xyz
Name: alphaselect-premier-f
Status: PENDING_BUILD
```

**COPY THE ID** (you'll need it next)

---

## Watch Deployment

```bash
# Replace abc123 with your actual app ID
doctl apps logs abc123def456xyz --follow
```

This shows live logs. Wait for status: **ACTIVE** (usually 5-10 min)

Press Ctrl+C to stop watching.

---

## Get Your Live URL

```bash
doctl apps get abc123def456xyz
```

Look for:
```
Live URL: https://alphaselect-premier-f-abc123.ondigitalocean.app
```

**Click that link!** Your app is live 🚀

---

## After Deployment

### View Logs Anytime
```bash
doctl apps logs <app-id> --follow
```

### Check App Status
```bash
doctl apps get <app-id>
```

### Update App (if you change app.yaml)
```bash
doctl apps update <app-id> --spec .do/app.yaml
```

### Delete App
```bash
doctl apps delete <app-id>
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `doctl: command not found` | Restart PowerShell after adding to PATH |
| `Validating token... FAILED` | Get new token from DigitalOcean |
| `Spec is invalid` | Check `.do/app.yaml` formatting |
| App stuck in `PENDING_BUILD` | Check logs: `doctl apps logs <id>` |
| Containers crashing | Check logs for error messages |

---

## Summary

1. ✅ Download & install doctl
2. ✅ Get API token from DigitalOcean
3. ✅ Run: `doctl auth init` (paste token)
4. ✅ Run: `doctl apps create --spec .do/app.yaml`
5. ✅ Wait 5-10 minutes for deployment
6. ✅ Run: `doctl apps get <app-id>` (get live URL)
7. ✅ Visit your live app!

**Next:** Open DOCTL_INSTALLATION_GUIDE.md for detailed instructions
