# 配置更新記錄 - 2026年3月23日

## 更新內容

### 📌 關鍵變更
1. **數據庫名稱更正**：使用 DigitalOcean 預設的 `defaultdb`（`alphaselect` 數據庫已於一個月前刪除）
2. **SECRET_KEY 更新**：生成新的 64 字符安全密鑰（僅含字母和數字，避免特殊字符問題）
3. **配置文件統一**：更新所有配置文件以保持一致性

---

## 更新的文件清單

### ✅ 核心配置文件
- [x] `backend/.env` - 本機開發配置
- [x] `backend/.env.example` - 範例配置模板
- [x] `docker-compose.yml` - Docker 容器配置
- [x] `.do/app.yaml` - DigitalOcean App Platform 配置

### ✅ 文檔文件
- [x] `APP_CONFIG_UPDATE.md` - 應用配置更新記錄

---

## 當前配置信息

### 🗄️ DigitalOcean Database
根據您的 DigitalOcean 控制台截圖：

| 配置項 | 值 |
|--------|-----|
| **Cluster Name** | `premier` |
| **Database Name** | `defaultdb` |
| **Host** | `premier-do-user-32973725-0.l.db.ondigitalocean.com` |
| **Port** | `25060` |
| **Username** | `doadmin` |
| **SSL Mode** | `require` |

**連接字串格式：**
```
postgresql://doadmin:YOUR_PASSWORD@premier-do-user-32973725-0.l.db.ondigitalocean.com:25060/defaultdb?sslmode=require
```

### 🔐 新的 SECRET_KEY
```
IcGAogRFd1jluPVW46xuliLQfL2xeL2udPUwp8nbYFhm6RRpZ5mK7ERgynaiNgAE
```
- 長度：64 字符
- 字符集：字母 + 數字（無特殊符號，避免解析問題）

---

## 環境配置指南

### 本機開發（Docker）

**backend/.env** 當前配置：
```bash
# Database - 本機 PostgreSQL（透過 docker-compose）
DATABASE_URL=postgresql://postgres:Ken202318@postgres:5432/defaultdb
DB_PASSWORD=Ken202318

# Redis
REDIS_URL=redis://redis:6379

# MEXC API
MEXC_API_KEY=mx0vglpiPCqWorPiUa
MEXC_SECRET_KEY=a1fc3bbe2d8040879cd3de4dbf265899

# Security
SECRET_KEY=IcGAogRFd1jluPVW46xuliLQfL2xeL2udPUwp8nbYFhm6RRpZ5mK7ERgynaiNgAE

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://frontend:3000

# Debug
DEBUG=true
```

**啟動命令：**
```bash
docker-compose up -d
```

---

### 生產部署（DigitalOcean）

要連接 DigitalOcean 生產數據庫，修改 `backend/.env`：

```bash
# 使用 DO 數據庫（將 YOUR_PASSWORD 替換為實際密碼）
DATABASE_URL=postgresql://doadmin:YOUR_PASSWORD@premier-do-user-32973725-0.l.db.ondigitalocean.com:25060/defaultdb?sslmode=require
```

或直接在 DigitalOcean App Platform 控制台設置環境變數：
1. 進入您的 app：`alphaselect-premier`
2. Settings → Components → `alphaselect-premier-f-backend`
3. Environment Variables → Edit
4. 設置 `DATABASE_URL`

---

## 驗證步驟

### 1. 檢查本機配置
```bash
# 查看後端 .env 文件
cat backend/.env

# 驗證數據庫連接
docker-compose up postgres -d
docker-compose exec postgres psql -U postgres -d defaultdb -c "\dt"
```

### 2. 啟動服務
```bash
docker-compose up -d
```

### 3. 測試 API
```bash
# 健康檢查
curl http://localhost:8000/health

# API 文檔
# 瀏覽器打開：http://localhost:8000/docs
```

### 4. 檢查前端
```
瀏覽器打開：http://localhost:3000
```

---

## 常見問題排查

### 問題 1：數據庫連接失敗
**症狀：** Backend 啟動時報錯 "could not connect to database"

**解決方案：**
1. 確認 PostgreSQL 容器正在運行：
   ```bash
   docker-compose ps postgres
   ```
2. 檢查數據庫名稱是否正確（應為 `defaultdb`）
3. 檢查密碼是否正確

### 問題 2：SECRET_KEY 解析錯誤
**症狀：** Backend 啟動時 SECRET_KEY 相關錯誤

**解決方案：**
- 新的 SECRET_KEY 不含特殊字符，應該不會有解析問題
- 如仍有問題，確保 `.env` 文件中 SECRET_KEY 沒有被引號包圍

### 問題 3：CORS 錯誤
**症狀：** 前端無法調用 API

**解決方案：**
確認 `ALLOWED_ORIGINS` 包含前端地址：
```bash
ALLOWED_ORIGINS=http://localhost:3000,http://frontend:3000
```

---

## 下一步建議

### 選項 A：繼續使用本機開發
✅ **推薦用於開發和測試**

當前配置已完成，直接執行：
```bash
docker-compose up -d
```

### 選項 B：連接生產數據庫
⚠️ **用於生產環境或需要訪問線上數據**

1. 在 DigitalOcean 控制台獲取數據庫密碼
2. 更新 `backend/.env` 中的 `DATABASE_URL`
3. 重啟後端服務

### 選項 C：部署到 DigitalOcean
📤 **部署新版本到線上**

```bash
# 推送到 GitHub（會觸發自動部署）
git add .
git commit -m "Update database config to defaultdb"
git push origin main

# 或使用 doctl 直接更新
doctl apps update <APP_ID> --spec .do/app.yaml
```

---

## 配置文件對照

### 本機開發 vs 生產環境

| 配置項 | 本機開發 | 生產環境 (DO) |
|--------|----------|---------------|
| Database Host | `postgres` (容器) | `premier-do-user-32973725-0.l.db.ondigitalocean.com` |
| Database Port | `5432` | `25060` |
| Database Name | `defaultdb` | `defaultdb` |
| Database User | `postgres` | `doadmin` |
| SSL Mode | 無 | `require` |
| Redis | `redis://redis:6379` | 由 DO 自動注入 |
| Frontend URL | `http://localhost:3000` | `${APP_URL}` (DO 變數) |

---

## 總結

✅ **已完成：**
- 數據庫配置從 `alphaselect` 更新為 `defaultdb`
- 生成並應用新的 64 字符 SECRET_KEY
- 更新所有配置文件保持一致
- 更新相關文檔

🎯 **現在可以：**
- 使用 `docker-compose up -d` 啟動本機開發環境
- 或修改配置連接 DigitalOcean 生產數據庫
- 推送代碼自動部署到 DigitalOcean

---

**更新人員：** GitHub Copilot  
**更新日期：** 2026年3月23日  
**相關 Issue：** Database name correction
