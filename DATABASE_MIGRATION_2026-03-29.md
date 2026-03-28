# 資料庫遷移記錄 - 2026-03-29

## 📋 變更概要

因原有資料庫發生問題，已創建新的 DigitalOcean PostgreSQL Managed Database cluster 並完成配置遷移。

---

## 🔄 資料庫變更

### 舊資料庫（已棄用）
- **Cluster 名稱**: `premier`
- **Cluster ID**: `9457cb2a-0d86-40df-9a4c-de08b8e3a11e`
- **主機**: `premier-do-user-32973725-0.l.db.ondigitalocean.com:25060`
- **狀態**: ⚠️ 已停用

### 新資料庫（現用）
- **Cluster 名稱**: `preimer`
- **Cluster ID**: `64ccfc93-3aaa-4a38-af50-9f5e809310a8`
- **主機**: `preimer-do-user-32973725-0.a.db.ondigitalocean.com:25060`
- **資料庫名**: `defaultdb`
- **使用者**: `doadmin`
- **區域**: `sgp1` (新加坡)
- **引擎**: PostgreSQL 16
- **狀態**: ✅ 運行中

### 變更摘要
| 項目 | 舊值 | 新值 |
|------|------|------|
| Cluster 名稱 | `premier` | `preimer` |
| 主機後綴 | `.l.db.ondigitalocean.com` | `.a.db.ondigitalocean.com` |
| 連接字串 | `postgresql://doadmin:XXXX@premier-do-user-32973725-0.l.db.ondigitalocean.com:25060/defaultdb?sslmode=require` | `postgresql://doadmin:XXXX@preimer-do-user-32973725-0.a.db.ondigitalocean.com:25060/defaultdb?sslmode=require` |

---

## 📝 已更新的文件

### 1. `.do/app.yaml` ✅
**變更內容**：
- 更新 `databases.cluster_name`: `premier` → `preimer`
- 更新 `databases.name`: `premier` → `preimer`
- 更新所有組件的 `DATABASE_URL` 引用: `${premier.DATABASE_URL}` → `${preimer.DATABASE_URL}`

**影響組件**：
- `alphaselect-premier-f-backend` (service)
- `celery-worker` (worker)
- `celery-beat` (worker)

### 2. `backend/.env` ✅
**變更內容**：
- 更新 DigitalOcean 生產環境註釋中的資料庫 URL
- 本地開發環境配置保持不變（使用 Docker Compose 的 postgres 容器）

### 3. `backend/.env.example` ✅
**變更內容**：
```diff
# DigitalOcean 生產環境：
-# DATABASE_URL=postgresql://doadmin:YOUR_PASSWORD@premier-do-user-32973725-0.l.db.ondigitalocean.com:25060/defaultdb?sslmode=require
+# DATABASE_URL=postgresql://doadmin:YOUR_PASSWORD@preimer-do-user-32973725-0.a.db.ondigitalocean.com:25060/defaultdb?sslmode=require
```

### 4. `.env.example` (根目錄) ✅
**變更內容**：
```diff
# Database Configuration
-DATABASE_URL=postgresql://doadmin:<password>@premier-do-user-32973725-0.l.db.ondigitalocean.com:25060/defaultdb?sslmode=require
-DB_NAME=premier
+DATABASE_URL=postgresql://doadmin:<password>@preimer-do-user-32973725-0.a.db.ondigitalocean.com:25060/defaultdb?sslmode=require
+DB_NAME=preimer
```

---

## 🚀 部署步驟

### 1. 推送配置變更到 GitHub
```bash
git add .
git commit -m "fix: migrate to new database cluster (preimer)"
git push origin main
```

### 2. DigitalOcean 自動部署
- DigitalOcean App Platform 會自動檢測到 `.do/app.yaml` 的變更
- 自動重新部署所有組件（backend, frontend, celery-worker, celery-beat）
- 自動連接到新的 `preimer` 資料庫 cluster

### 3. 驗證部署（約 10-15 分鐘後）
```bash
# 1. 檢查 App 部署狀態
doctl apps list

# 2. 查看 runtime logs
doctl apps logs <APP_ID> --type run --follow

# 3. 檢查資料庫連接
# 應該在日誌中看到成功連接到 preimer cluster
```

---

## ✅ 驗證清單

### DigitalOcean Console 驗證
- [ ] App Platform 顯示所有組件狀態為 "Active"
- [ ] Backend 服務健康檢查通過（/health 返回 200 OK）
- [ ] Runtime logs 顯示成功連接到資料庫
- [ ] Celery Beat 任務正常調度
- [ ] Celery Worker 任務正常執行

### 功能驗證
- [ ] API 端點正常響應
- [ ] WebSocket 連接正常
- [ ] 市場數據自動收集運行（每 5 分鐘）
- [ ] 極端反轉掃描運行（每 60 秒）
- [ ] 資料庫讀寫正常

### 資料庫驗證
```bash
# 連接到新資料庫（使用您的實際密碼）
psql "postgresql://doadmin:YOUR_PASSWORD@preimer-do-user-32973725-0.a.db.ondigitalocean.com:25060/defaultdb?sslmode=require"

# 檢查表結構
\dt

# 檢查數據
SELECT COUNT(*) FROM contract_markets;
SELECT COUNT(*) FROM ai_models;
SELECT COUNT(*) FROM extreme_signals;

# 檢查最新數據時間
SELECT MAX(created_at) FROM contract_markets;
```

---

## 🔧 故障排除

### 問題 1：部署失敗
**症狀**：App Platform 顯示 "Deployment Failed"

**解決方案**：
```bash
# 1. 檢查 build logs
doctl apps logs <APP_ID> --type build

# 2. 檢查 app spec 語法
doctl apps spec validate .do/app.yaml

# 3. 確認資料庫 cluster 名稱正確
doctl databases list
```

### 問題 2：資料庫連接失敗
**症狀**：Runtime logs 顯示 "could not connect to server"

**可能原因**：
1. 資料庫 cluster 名稱在 app.yaml 中拼寫錯誤
2. 資料庫 cluster 尚未完全啟動（需等待 2-5 分鐘）
3. App Platform 與資料庫網絡連接問題

**解決方案**：
```bash
# 1. 驗證資料庫狀態
doctl databases get <DATABASE_ID>

# 2. 檢查 app.yaml 中的 cluster_name
grep "cluster_name" .do/app.yaml

# 3. 強制重新部署
doctl apps create-deployment <APP_ID>
```

### 問題 3：環境變數未更新
**症狀**：應用仍嘗試連接舊資料庫

**解決方案**：
1. 確認 `.do/app.yaml` 中所有 `${premier.DATABASE_URL}` 都已改為 `${preimer.DATABASE_URL}`
2. 觸發新的部署（推送任意變更或手動觸發）
3. 等待部署完成（約 10-15 分鐘）

---

## 📊 資料遷移（如需要）

如果需要從舊資料庫遷移數據到新資料庫：

### 方法 1：使用 pg_dump 和 pg_restore
```bash
# 1. 從舊資料庫導出
pg_dump "postgresql://doadmin:PASSWORD@premier-do-user-32973725-0.l.db.ondigitalocean.com:25060/defaultdb?sslmode=require" \
  -F c -f backup.dump

# 2. 導入到新資料庫（使用您的實際密碼）
pg_restore -d "postgresql://doadmin:YOUR_PASSWORD@preimer-do-user-32973725-0.a.db.ondigitalocean.com:25060/defaultdb?sslmode=require" \
  -c backup.dump
```

### 方法 2：使用 DigitalOcean 控制台
1. 登入 [DigitalOcean 控制台](https://cloud.digitalocean.com/)
2. 進入 **Databases** → 舊資料庫 `premier`
3. 選擇 **Backups** 標籤
4. 創建手動備份
5. 在新資料庫 `preimer` 中選擇 **Restore from Backup**

⚠️ **注意**：如果是全新開始（不需要舊數據），則無需遷移。新資料庫會在應用啟動時自動創建所有表結構（由 Alembic migrations 處理）。

---

## 📚 相關文檔

- [DigitalOcean 部署指南](DEPLOYMENT_GUIDE.md)
- [資料庫配置文檔](CONFIG_UPDATED_2026-03-23.md)
- [App Spec 配置說明](.do/README.md)

---

## 🔍 變更歷史

| 日期 | 操作 | 執行者 | 說明 |
|------|------|--------|------|
| 2026-03-29 | 創建新資料庫 cluster | 用戶 | 創建 `preimer` cluster (ID: 64ccfc93-3aaa-4a38-af50-9f5e809310a8) |
| 2026-03-29 | 更新 backend/.env | 用戶 | 更新本地配置文件中的資料庫 URL 註釋 |
| 2026-03-29 | 更新 .do/app.yaml | Copilot | 更新所有組件引用新的 preimer cluster |
| 2026-03-29 | 更新 .env.example | Copilot | 更新示例配置文件 |
| 2026-03-29 | 創建本文檔 | Copilot | 記錄遷移過程和驗證步驟 |

---

## ⚠️ 重要提醒

1. **保留舊資料庫**：建議保留舊的 `premier` cluster 7-14 天，確認新資料庫運行穩定後再刪除
2. **數據備份**：定期備份新資料庫，建議啟用自動備份功能
3. **監控告警**：設置 DigitalOcean 資料庫告警（CPU、Memory、Disk 使用率）
4. **連接字串保密**：確保資料庫密碼不會提交到 Git 倉庫中

---

**遷移完成時間**: 2026-03-29  
**文檔版本**: 1.0  
**狀態**: ✅ 配置已更新，等待部署驗證
