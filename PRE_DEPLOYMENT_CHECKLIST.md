# ✅ PRE-DEPLOYMENT CHECKLIST

## 🔴 Before You Deploy - Check Everything!

### Folder Path
- [ ] You are using: `E:\AlphaSelect-Suite-Perimer\AlphaSelect-Premier-F`
- [ ] NOT using: `E:\AlphaSelect-Suite-Perimer-AlphaSelect-Premier-F` (old folder)
- [ ] You can verify by opening File Explorer and checking the address bar

### Files Exist
Open PowerShell and run:
```powershell
dir .do\app.yaml
dir backend\Dockerfile
dir frontend\Dockerfile
```
- [ ] All three commands show files exist

### doctl Installed
```powershell
doctl version
```
- [ ] Shows version number (e.g., 1.107.0)

### DigitalOcean Account
- [ ] You have a DigitalOcean account (free tier is fine)
- [ ] You have generated an API token
- [ ] Token is saved safely (you'll paste it once)

### doctl Authenticated
```powershell
doctl auth init
```
- [ ] You pasted your token
- [ ] It said: "Validating token... OK"

### GitHub Push
- [ ] Your code is pushed to GitHub main branch
- [ ] All workflows have run (check Actions tab)

---

## 🟢 Ready to Deploy?

If all boxes are checked ✓, you're ready!

```powershell
cd E:\AlphaSelect-Suite-Perimer\AlphaSelect-Premier-F
doctl apps create --spec .do/app.yaml
```

---

## 📋 Deployment Checklist

### During Deployment

Step 1: Run Deploy Command
```powershell
doctl apps create --spec .do/app.yaml
```
- [ ] Command runs without error
- [ ] You see output with an ID
- [ ] You copy and save the ID

Step 2: Watch Logs
```powershell
doctl apps logs YOUR_APP_ID --follow
```
- [ ] You see lots of text scrolling
- [ ] You see: "Status: ACTIVE"
- [ ] You press: Ctrl+C to stop

Step 3: Get Live URL
```powershell
doctl apps get YOUR_APP_ID
```
- [ ] You see: "Live URL: https://..."
- [ ] You copy the URL

Step 4: Test App
- [ ] URL opens in browser
- [ ] You see your frontend
- [ ] Backend health check works: {url}/api/v1/health

---

## ✅ Deployment Complete!

When all checks pass:
- [ ] Your app is LIVE
- [ ] You have a public URL
- [ ] Everything is working
- [ ] Celebrate! 🎉

---

## 🆘 Troubleshooting

### "Command not found" errors
- [ ] Are you in the correct folder? `E:\AlphaSelect-Suite-Perimer\AlphaSelect-Premier-F`
- [ ] Is doctl installed? `doctl version`
- [ ] Did you restart PowerShell after PATH change?

### "Token validation failed"
- [ ] Did you paste the correct token?
- [ ] Did you get a new token from DigitalOcean?
- [ ] Try: `doctl auth init` again

### "app.yaml not found"
- [ ] Are you in the correct folder?
- [ ] Run: `dir .do\app.yaml` to verify

### App won't start
- [ ] Check logs: `doctl apps logs YOUR_APP_ID --follow`
- [ ] Are all environment variables set?
- [ ] Did GitHub Actions workflows pass?

---

## 📞 Need Help?

Tell me:
1. **Which step you're on**
2. **What error you see (exact text)**
3. **Your current folder path** (from PowerShell)

---

## 🎯 Final Reminder

**CORRECT PATH:**
```
E:\AlphaSelect-Suite-Perimer\AlphaSelect-Premier-F
```

Use this for all commands!

---

**You've got this! 🚀**
