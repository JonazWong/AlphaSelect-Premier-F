# Fix: "choco is not recognized" - Manual doctl Download

## Don't worry! This is easy. Just follow these steps.

---

## STEP 1: Download doctl

1. **Open your browser**
2. Go to: `https://github.com/digitalocean/doctl/releases`
3. Look for the file: **`doctl-1.107.0-windows-amd64.zip`** (or latest version)
4. Click it to **download**
5. Wait for download to finish
6. You'll see a `.zip` file in your Downloads folder

---

## STEP 2: Extract (Unzip) the File

1. Go to: **Downloads folder** (in File Explorer)
2. Find: `doctl-1.107.0-windows-amd64.zip`
3. **Right-click** on it
4. Click: **"Extract All..."**
5. A popup appears
6. Click the browse button
7. Pick folder: `C:\` (C drive, root)
8. Click: **Select Folder**
9. Click: **Extract**
10. Wait for it to finish

**Result:** You now have `C:\doctl` folder with files inside

---

## STEP 3: Add to PATH

This tells Windows where to find `doctl`.

**Do this:**

1. Press: **Windows Key**
2. Type: **`environment variables`**
3. Click: **"Edit the system environment variables"**
4. A window opens
5. Click button: **"Environment Variables"** (bottom right)
6. Another window opens
7. Under **"User variables for..."** section:
   - Click: **"New"**
   - Variable name: `PATH`
   - Variable value: `C:\doctl`
   - Click: **"OK"**
8. Click: **"OK"** again
9. Click: **"OK"** one more time
10. **Close all windows**

---

## STEP 4: Restart PowerShell

**Important:** You MUST restart PowerShell for changes to take effect.

1. **Close** PowerShell completely (click X)
2. Wait 5 seconds
3. Press: **Windows Key + R**
4. Type: **`powershell`**
5. Press: **Enter**

**New PowerShell window opens**

---

## STEP 5: Test doctl

**In PowerShell, copy & paste this:**

```powershell
doctl version
```

Press: **Enter**

**Good result:** Shows version number like `1.107.0`

**Bad result:** Error "doctl: command not found" → Go back to STEP 3

---

## STEP 6: Continue with Deployment

Now you can follow the rest:

```powershell
# Authenticate
doctl auth init
# (paste your token when prompted)

# Go to your project
cd E:\AlphaSelect-Suite-Perimer\AlphaSelect-Premier-F

# Deploy
doctl apps create --spec .do/app.yaml
```

---

## ✅ You're Ready!

doctl is now installed and ready to use.

**Continue with:** `VIDEO_STYLE_GUIDE.md` or `SUPER_SIMPLE_GUIDE.md`

---

## 🆘 If Still Not Working

### "doctl: command not found" after restarting
- Did you restart PowerShell? (close and reopen)
- Is the PATH set correctly? (check STEP 3)
- Did you extract to C:\doctl? (check STEP 2)

### Can't find doctl-1.107.0-windows-amd64.zip
- Are you on the releases page? https://github.com/digitalocean/doctl/releases
- Scroll down to find it
- Might be named slightly different but should have "windows-amd64.zip"

### File won't extract
- Try right-click → Extract All again
- Or use 7-Zip (free tool)

---

## 📸 Visual Summary

```
1. Download: doctl-1.107.0-windows-amd64.zip
   ↓
2. Extract to: C:\doctl
   ↓
3. Add C:\doctl to PATH (Environment Variables)
   ↓
4. Restart PowerShell
   ↓
5. Test: doctl version
   ↓
6. Ready to deploy!
```

---

## Next Command

Once doctl is working:

```powershell
doctl auth init
```

Tell me when you get to this step!
