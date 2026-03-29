# DigitalOcean 環境變數設置指南

## ⚠️ 部署失敗原因

您的容器啟動失敗，錯誤訊息：
```
DeployContainerExitNonZero: Your container exited with a non-zero exit code.
```

**根本原因**：必需的 SECRET 環境變數未在 DigitalOcean 控制台設置。

---

## 🔧 必需的環境變數

以下環境變數**必須**在 DigitalOcean 控制台手動設置（不能從 .env 文件讀取）：

| 環境變數 | 必需性 | 值 | 說明 |
|---------|--------|---|------|
| `REDIS_URL` | ✅ 必需 | 見下方 Redis 設置 | Redis 連接字符串 |
| `SECRET_KEY` | ✅ 必需 | `PYevONZkTgY1hUqY3tuqSgiG_U2SiShnEsBNBedpiaL-uCXfzmxfo0a98Pzo5YZ8` | JWT 簽名密鑰 |
| `MEXC_API_KEY` | ⚪ 可選 | `mx0vglpiPCqWorPiUa` | MEXC API 金鑰（唯讀） |
| `MEXC_SECRET_KEY` | ⚪ 可選 | `a1fc3bbe2d8040879cd3de4dbf265899` | MEXC API 密鑰 |

---

## 📋 設置步驟

### 步驟 1: 創建 DigitalOcean Redis 數據庫

1. **前往**: [DigitalOcean Databases](https://cloud.digitalocean.com/databases)
2. **點擊**: "Create Database Cluster"
3. **選擇**:
   - **Database Engine**: Redis 7
   - **Region**: Singapore (sgp) - **必須與應用相同區域**
   - **Plan**: Basic, 1 GB RAM（最小規格，約 $15/月）
   - **Database Name**: 自訂，例如 `alphaselect-redis`
4. **創建**後，等待 3-5 分鐘初始化
5. **複製連接字符串**:
   - 前往數據庫詳情頁
   - 找到 "Connection Details"
   - 複製格式為 `rediss://default:<password>@<host>:<port>` 的字符串

**示例連接字符串**:
```
rediss://default:AVNS_abc123xyz@alphaselect-redis-do-user-12345678-0.l.db.ondigitalocean.com:25061
```

---

### 步驟 2: 在 DigitalOcean 控制台設置環境變數

1. **前往**: [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
2. **選擇**: alphaselect-premier 應用
3. **點擊**: Settings 標籤
4. **選擇**: "alphaselect-premier-f-backend" 組件
5. **滾動到**: Environment Variables 區域
6. **添加以下變數**:

#### REDIS_URL
- **Key**: `REDIS_URL`
- **Value**: 從步驟 1 複製的 Redis 連接字符串
- **Encrypt**: ✅ 勾選

#### SECRET_KEY
- **Key**: `SECRET_KEY`
- **Value**: `PYevONZkTgY1hUqY3tuqSgiG_U2SiShnEsBNBedpiaL-uCXfzmxfo0a98Pzo5YZ8`
- **Encrypt**: ✅ 勾選

#### MEXC_API_KEY（可選）
- **Key**: `MEXC_API_KEY`
- **Value**: `mx0vglpiPCqWorPiUa`
- **Encrypt**: ✅ 勾選

#### MEXC_SECRET_KEY（可選）
- **Key**: `MEXC_SECRET_KEY`
- **Value**: `a1fc3bbe2d8040879cd3de4dbf265899`
- **Encrypt**: ✅ 勾選

7. **保存設置**

---

### 步驟 3: 同樣為 Celery Workers 設置環境變數

**重複步驟 2**，但選擇以下組件：
- `celery-worker`
- `celery-beat`

**每個組件都需要設置**：
- `REDIS_URL`
- `SECRET_KEY`
- `MEXC_API_KEY`（可選）
- `MEXC_SECRET_KEY`（可選）

---

### 步驟 4: 觸發重新部署

#### 方法 A: Git Push（推薦）
```bash
# 已經移除了錯誤的 db_cluster_name 配置
git add .do/app.yaml
git commit -m "fix: remove db_cluster_name and setup env vars"
git push origin main
```

#### 方法 B: 手動觸發
在 DigitalOcean Apps 控制台點擊 "Deploy" 按鈕

---

### 步驟 5: 監控部署

1. **前往**: DigitalOcean Apps → alphaselect-premier → Runtime Logs
2. **選擇**: alphaselect-premier-f-backend
3. **等待**: 約 3-5 分鐘讓容器啟動
4. **檢查**: 健康檢查是否通過

**成功訊息示例**:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

---

## ✅ 驗證部署成功

### 測試健康檢查
部署完成後，訪問：
```
https://alphaselect-premier-<random-id>.ondigitalocean.app/health
```

**預期回應**:
```json
{"status": "ok"}
```

### 測試 API 文檔
```
https://alphaselect-premier-<random-id>.ondigitalocean.app/api/v1/docs
```

應該看到 Swagger UI 界面。

---

## 🐛 常見問題

### 1. 為什麼 .env 文件的值沒有被使用？

`.do/app.yaml` 中標記為 `type: SECRET` 的環境變數：
- ❌ **不會**從 `.env` 文件讀取
- ❌ **不會**從 Git 倉庫讀取  
- ✅ **必須**在 DigitalOcean 控制台手動設置

這是 DigitalOcean 的安全機制，防止敏感資訊被提交到 Git。

### 2. Redis 區域必須相同嗎？

✅ **是的**。Redis 和應用必須在相同區域（sgp），否則會有延遲和額外費用。

### 3. 可以使用外部 Redis 嗎？

✅ **可以**。只要 Redis 能被 DigitalOcean App Platform 訪問即可。例如：
- Redis Cloud
- AWS ElastiCache（需要公網訪問）
- Upstash Redis

### 4. MEXC API 金鑰是必需的嗎？

⚪ **不是必需**。如果不設置，系統會使用 MEXC 的公開 API（部分功能會受限）。

---

## 📞 需要幫助？

如果部署仍然失敗，請提供以下資訊：
1. Runtime logs 的錯誤訊息
2. 環境變數設置的截圖
3. Redis 數據庫狀態

---

**上次更新**: 2026-03-29  
**修復內容**: 移除了錯誤的 `db_cluster_name` 配置
