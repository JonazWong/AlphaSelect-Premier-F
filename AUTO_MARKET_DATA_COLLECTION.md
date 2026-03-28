# 自動市場數據收集任務配置指南

## 📋 問題背景

**用戶問題：現在AI訓練的資料庫是否和DO同步的，DO上面的數據是不是都是實時，AI能否正常運作分析的？**

### 發現的問題
1. ❌ **本地和 DigitalOcean 資料庫完全獨立**，沒有自動同步機制
2. ❌ **沒有自動數據收集任務** - Celery Beat 只有極端反轉掃描，沒有市場數據定期收集
3. ⚠️ **AI 模型訓練需要數據** - 目前 `ai_models` 和 `predictions` 表都是空的
4. ⚠️ **數據依賴手動收集** - 需要執行批次腳本 `quick_collect_100_v2.bat`

---

## ✅ 解決方案：添加自動市場數據收集任務

### 📁 新增文件

#### 1. `backend/app/tasks/market_data_tasks.py`
**功能**：Celery 任務 - 定期從 MEXC API 獲取所有合約市場數據並保存到資料庫

**實現細節**：
```python
@celery_app.task(name="collect_market_data")
def collect_market_data():
    """每5分鐘執行一次，收集所有合約ticker數據"""
    # 1. 調用 mexc_contract_api.get_all_contract_tickers()
    # 2. 解析每個ticker並保存到 contract_markets 表
    # 3. 批量提交（減少資料庫負載）
```

**特點**：
- ✅ 自動重試機制（Celery 內建）
- ✅ 批量提交，高效率
- ✅ 錯誤處理和日誌記錄
- ✅ 遵循 MEXC API 速率限制（通過 `mexc_contract_api` 的 rate limiter 和 circuit breaker）

---

### 🔧 修改文件

#### 2. `backend/app/tasks/celery_app.py`
**修改內容**：添加新的定時任務到 `beat_schedule`

```python
beat_schedule={
    'scan-extreme-reversals-every-minute': {
        'task': 'scan_extreme_reversals',
        'schedule': 60.0,  # 每 60 秒
    },
    'collect-market-data-every-5-minutes': {  # ← 新增
        'task': 'collect_market_data',
        'schedule': 300.0,  # 每 5 分鐘 (300 秒)
    },
}
```

**為什麼選擇 5 分鐘間隔？**
- ✅ 足夠頻繁以保持數據新鮮度
- ✅ 不會超過 MEXC API 速率限制
- ✅ 減少資料庫寫入負載
- ✅ 適合 AI 訓練和預測的時間粒度

#### 3. `backend/app/tasks/__init__.py`
**修改內容**：註冊新任務，確保 Celery 發現並加載

```python
from app.tasks.market_data_tasks import collect_market_data

__all__ = [
    "celery_app",
    "scan_extreme_reversals",
    "collect_market_data",  # ← 新增
    ...
]
```

---

## 🚀 使用方法

### 本地開發環境

#### 方法 A：使用批次腳本（推薦）
```batch
restart_celery.bat
```
此腳本會：
1. 停止 Celery Worker 和 Beat
2. 移除舊容器
3. 重新啟動服務（應用新配置）

#### 方法 B：手動重啟
```bash
# 停止並移除
docker compose stop celery-worker celery-beat
docker compose rm -f celery-worker celery-beat

# 重新啟動
docker compose up -d celery-worker celery-beat
```

#### 驗證任務是否運行
```bash
# 查看 Celery Beat 日誌
docker compose logs celery-beat --tail 50

# 應該看到類似輸出：
# celery-beat | [2026-03-28 15:30:00] Scheduler: Sending due task collect-market-data-every-5-minutes
# celery-beat | [2026-03-28 15:30:00] Task collect_market_data sent
```

```bash
# 查看 Celery Worker 日誌
docker compose logs celery-worker --tail 50

# 應該看到類似輸出：
# celery-worker | [collect_market_data] Starting data collection...
# celery-worker | [collect_market_data] Fetched 150 tickers from MEXC
# celery-worker | [collect_market_data] ✅ Saved 148 tickers, 2 errors
```

#### 檢查資料庫數據
```bash
docker compose exec -T postgres psql -U postgres -d defaultdb -c "
SELECT 
    COUNT(*) as total_records,
    MAX(created_at) as latest_data,
    COUNT(DISTINCT symbol) as unique_symbols
FROM contract_markets;
"
```

預期看到：
- `total_records` 每 5 分鐘增長 ~150 筆
- `latest_data` 在最近 5 分鐘內
- `unique_symbols` 約 150 個不同幣種

---

### DigitalOcean 生產環境

#### 步驟 1：推送代碼到 GitHub
```bash
git add .
git commit -m "feat: add automated market data collection task"
git push origin main
```

#### 步驟 2：DigitalOcean 自動部署
- DO App Platform 會自動檢測到新提交
- 觸發重新構建和部署
- 新的 Celery 任務會自動啟用

#### 步驟 3：驗證 DO 環境
1. 登入 [DigitalOcean 控制台](https://cloud.digitalocean.com/)
2. 進入 **Apps** → **alphaselect-premier-f**
3. 選擇 **celery-beat** 組件 → **Runtime Logs**
4. 確認看到 `collect-market-data-every-5-minutes` 任務正在執行

#### 步驟 4：檢查 DO 資料庫
```bash
# 使用 doctl 連接資料庫（需先安裝 doctl）
doctl databases connection premier --app alphaselect-premier-f

# 或使用 psql 直接連接
psql "postgresql://doadmin:xxxx@premier-do-user-xxxxx.db.ondigitalocean.com:25060/defaultdb?sslmode=require"

# 查詢數據
SELECT COUNT(*), MAX(created_at), COUNT(DISTINCT symbol)
FROM contract_markets;
```

---

## 📊 任務執行時間表

| 任務名稱 | 執行頻率 | 功能 | 數據量 |
|---------|---------|------|--------|
| `scan_extreme_reversals` | 每 60 秒 | 掃描極端反轉信號 | ~150 symbols 掃描 |
| `collect_market_data` | 每 300 秒 (5分鐘) | 收集市場ticker數據 | ~150 records/次 |

**每小時數據增長**：
- `contract_markets` 表：約 1,800 筆記錄 (12次 × 150筆)
- `extreme_signals` 表：視市場波動，通常 0-50 筆

**每日數據增長**：
- `contract_markets` 表：約 43,200 筆記錄
- 儲存空間需求：約 50-100 MB/天（取決於 `extra_data` 欄位大小）

---

## 🔍 故障排除

### 問題 1：任務沒有執行
**症狀**：日誌中看不到 `collect_market_data` 任務

**解決方案**：
```bash
# 檢查 Celery Beat 是否識別任務
docker compose exec celery-beat celery -A app.tasks.celery_app inspect scheduled

# 強制重啟
docker compose restart celery-beat celery-worker
```

### 問題 2：MEXC API 錯誤
**症狀**：日誌顯示 `mexc_contract_api` 錯誤

**可能原因**：
1. 速率限制（Circuit Breaker 開啟）
2. MEXC API 暫時不可用
3. 網路連接問題

**解決方案**：
- 檢查 Circuit Breaker 狀態：`docker compose logs backend | grep -i "circuit"`
- 等待 60 秒（Circuit Breaker 恢復時間）
- 手動測試 API：
```bash
docker compose exec backend python -c "
from app.core.mexc.contract import mexc_contract_api
print(mexc_contract_api.get_all_contract_tickers())
"
```

### 問題 3：資料庫寫入失敗
**症狀**：`DB write failed` 錯誤

**檢查步驟**：
```bash
# 1. 驗證資料庫連接
docker compose exec backend python -c "
from app.db.session import SessionLocal
db = SessionLocal()
print('✅ DB connected')
db.close()
"

# 2. 檢查磁碟空間
docker compose exec postgres df -h /var/lib/postgresql/data

# 3. 查看資料庫錯誤日誌
docker compose logs postgres --tail 100
```

---

## 📈 AI 訓練指南

### 前提條件
1. ✅ 資料庫有足夠的歷史數據（建議至少 1000 筆，涵蓋多個時間段）
2. ✅ 數據包含多個幣種和時間跨度
3. ✅ 後端服務正常運行

### 訓練步驟（通過 Web UI）
1. 打開瀏覽器訪問：http://localhost:3000/ai-training
2. 選擇幣種（例如：BTC_USDT, ETH_USDT）
3. 選擇模型類型（XGBoost, RandomForest, ARIMA）
4. 設定訓練參數（時間範圍、特徵工程選項）
5. 點擊「開始訓練」
6. 等待訓練完成（通常 2-10 分鐘，取決於數據量）

### 訓練步驟（通過 API）
```bash
curl -X POST http://localhost:8000/api/v1/ai_training/train \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTC_USDT",
    "model_type": "XGBoost",
    "lookback_days": 7,
    "features": ["price", "volume", "funding_rate", "open_interest"]
  }'
```

### 驗證訓練結果
```bash
# 查看已訓練模型
docker compose exec -T postgres psql -U postgres -d defaultdb -c "
SELECT id, name, model_type, symbol, accuracy, created_at 
FROM ai_models 
ORDER BY created_at DESC;
"

# 查看預測結果
docker compose exec -T postgres psql -U postgres -d defaultdb -c "
SELECT model_id, symbol, prediction_value, confidence, created_at 
FROM predictions 
ORDER BY created_at DESC 
LIMIT 10;
"
```

---

## 🎯 最佳實踐

### 1. 數據收集頻率調整
- **高頻交易策略**：改為每 1 分鐘 (`schedule': 60.0`)
- **長期分析**：保持 5 分鐘
- **節省資源**：改為每 15 分鐘 (`schedule': 900.0`)

### 2. 數據清理策略
建議添加定期清理任務（已有 `cleanup_tasks.py`）：
```python
# 保留 30 天數據，刪除舊數據
'cleanup-old-market-data': {
    'task': 'cleanup_old_data',
    'schedule': crontab(hour=3, minute=0),  # 每天凌晨 3:00
}
```

### 3. 監控和告警
- 監控 Celery 任務成功率
- 監控資料庫成長速度
- 監控 MEXC API 響應時間
- 設定 Circuit Breaker 警告通知

### 4. AI 訓練策略
- **每日重訓練**：確保模型使用最新數據
- **多幣種訓練**：對前 20 個交易量最大的幣種分別訓練
- **模型集成**：使用 Ensemble 模型結合多個預測結果
- **回測驗證**：訓練後進行歷史數據回測

---

## 📚 相關文檔

- [MEXC API 文檔](MEXC_API_GUIDE.md)
- [AI 訓練指南](AI_TRAINING_GUIDE.md)
- [部署檢查清單](DEPLOYMENT_CHECKLIST.md)
- [Celery 配置說明](backend/app/tasks/celery_app.py)

---

## 🔄 更新日誌

**2026-03-28**
- ✅ 新增 `market_data_tasks.py` - 自動市場數據收集任務
- ✅ 修改 `celery_app.py` - 添加 5 分鐘定時任務
- ✅ 修改 `__init__.py` - 註冊新任務
- ✅ 新增 `restart_celery.bat` - 便捷重啟腳本
- ✅ 新增本文檔 - 完整配置和使用指南

---

## ❓ 常見問題 FAQ

### Q1：為什麼選擇每 5 分鐘而不是每分鐘？
**A**：平衡數據新鮮度和系統負載。對於 AI 訓練和中長期預測，5 分鐘粒度已足夠。極端信號掃描仍保持每分鐘執行。

### Q2：本地數據會同步到 DO 嗎？
**A**：不會。本地和 DO 是完全獨立的資料庫環境。兩者都會各自運行自動收集任務。

### Q3：如何停止自動收集？
**A**：
```bash
# 方法 1：停止 Celery Beat（停止所有定時任務）
docker compose stop celery-beat

# 方法 2：從 beat_schedule 中移除任務並重啟
# 編輯 celery_app.py，刪除 'collect-market-data-every-5-minutes' 配置
```

### Q4：數據庫會爆滿嗎？
**A**：需要定期清理。建議：
- 保留最近 30 天的原始數據
- 將舊數據聚合為小時級或日級數據
- 啟用 `cleanup_old_data` 任務（在 `cleanup_tasks.py` 中配置）

### Q5：AI 訓練需要多少數據？
**A**：建議：
- **最少**：500 筆記錄（約 40 小時的 5 分鐘數據）
- **推薦**：2,000 筆記錄（約 7 天數據）
- **最佳**：10,000+ 筆記錄（約 35 天數據）

數據越多，訓練效果越好，但訓練時間也會增加。

---

## 📧 技術支持

如有問題，請查看：
1. Celery 日誌：`docker compose logs celery-worker celery-beat`
2. Backend 日誌：`docker compose logs backend`
3. PostgreSQL 日誌：`docker compose logs postgres`

或創建 GitHub Issue 報告問題。
