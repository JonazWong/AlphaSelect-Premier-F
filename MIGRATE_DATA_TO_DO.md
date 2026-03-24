# 📤 將本機資料庫遷移到 DigitalOcean

## 現況
- **本機資料庫**：762 筆記錄（包含歷史數據）
- **DO 資料庫**：0 筆記錄（全新）
- **DO App**: alphaselect-premier（已部署）
- **DO Database**: premier cluster，alphaselect 資料庫

---

## 方案 1：直接在 DO 調用 API 收集新數據（推薦 ⭐）

**優點**：
- 最簡單，無需資料庫憑證
- DO 後端直接調用 MEXC API
- 數據是最新的實時市場數據

**執行**：
```bash
.\collect_do_data.bat
```

腳本會向 DO 的 API 發送 150 次請求（5 個交易對 × 30 筆）：
```
https://alphaselect-premier-p5fuz.ondigitalocean.app/api/v1/contract/ticker/BTC_USDT
https://alphaselect-premier-p5fuz.ondigitalocean.app/api/v1/contract/ticker/ETH_USDT
...
```

每次調用會自動儲存到 DO 的 PostgreSQL 資料庫。

**DO App URL**: `https://alphaselect-premier-p5fuz.ondigitalocean.app`

---

## 方案 2：匯出本機資料庫並匯入 DO（保留歷史數據）

**優點**：
- 保留本機的歷史數據（762 筆）
- 包含從 00:33:29 開始的 BTC 歷史價格

**執行步驟**：

### 步驟 1：匯出本機資料庫
```powershell
# 匯出 contract_markets 表
docker compose exec -T postgres pg_dump -U postgres -d alphaselect -t contract_markets --data-only --column-inserts > contract_markets_backup.sql
```

### 步驟 2：連接到 DO 資料庫並匯入
```powershell
# DO 資料庫連線資訊
$DO_DB_HOST = "premier-do-user-32973725-0.l.db.ondigitalocean.com"
$DO_DB_PORT = "25060"
$DO_DB_USER = "doadmin"
$DO_DB_PASS = "AVNS_zSH4Wa_27EOrnFxBdRB"
$DO_DB_NAME = "alphaselect"

# 使用 psql 匯入（需安裝 PostgreSQL client）
$env:PGPASSWORD = $DO_DB_PASS
psql -h $DO_DB_HOST -p $DO_DB_PORT -U $DO_DB_USER -d $DO_DB_NAME -f contract_markets_backup.sql
```

**注意**：
- 需要在本機安裝 PostgreSQL client（psql 工具）
- DO 資料庫需先運行 migrations 創建表結構

---

## 方案 3：使用 GitHub Actions 定期自動收集（長期方案）

設置自動化 workflow 每小時在 DO 上收集數據。

創建 `.github/workflows/collect-data.yml`：
```yaml
name: Collect Market Data

on:
  schedule:
    - cron: '0 * * * *'  # 每小時
  workflow_dispatch:      # 手動觸發

jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - name: Collect data
        run: |
          symbols=(BTC_USDT ETH_USDT SOL_USDT BNB_USDT DOGE_USDT)
          for symbol in "${symbols[@]}"; do
            curl -X GET "https://alphaselect-premier-p5fuz.ondigitalocean.app/api/v1/contract/ticker/$symbol"
            sleep 2
          done
```

---

## 推薦方案

**立即使用**：方案 1（執行 `collect_do_data.bat`）
- 5 分鐘內完成 150 筆數據收集
- 無需資料庫憑證
- 數據是最新的

**如需歷史數據**：方案 2（pg_dump + psql）
- 保留本機 762 筆歷史記錄
- 需要 PostgreSQL client

**長期運維**：方案 3（GitHub Actions）
- 自動化定期收集
- 無需手動干預

---

## 快速開始

```bash
# 方案 1 - 最簡單
.\collect_do_data.bat

# 檢查 DO 資料庫數據量（執行後）
doctl databases connection 9457cb2a-0d86-40df-9a4c-de08b8e3a11e --format URI
# 使用返回的 URI 連接資料庫查詢
```
