# 🎯 Custom Symbol Training - Quick Guide

## 完整工作流程（2 步驟）

### 步驟 1：收集數據 📊

```batch
collect_custom_symbols.bat
```

**操作流程：**
1. 輸入幣種（1-5 個，空格分隔）
   - 例如：`LYNUSDT ADAUSDT DOTUSDT`
   - 或簡寫：`LYN ADA DOT`
2. 確認收集參數（30 輪，約 2-5 分鐘）
3. 等待收集完成

**結果：**
- 每個幣種收集 30 條 K 線數據
- 數據存入 PostgreSQL

---

### 步驟 2：訓練模型 🤖

```batch
train_custom_symbols.bat
```

**操作流程：**
1. 輸入幣種（與步驟 1 相同）
   - 例如：`LYNUSDT ADAUSDT DOTUSDT`
2. 選擇訓練模式：
   - `1` = 快速訓練（XGBoost + RandomForest，推薦）
   - `2` = 完整訓練（5 種模型）
   - `3` = 僅 XGBoost（最快）
3. 確認數據充足（至少 100 條）
4. 等待訓練完成（5-25 分鐘）

**結果：**
- 訓練好的模型保存到 `ai_models/` 目錄
- AI Predictions 頁面自動顯示新幣種預測

---

## 📝 完整範例

### 訓練 LYN 幣種

```cmd
REM 第 1 步：收集數據
collect_custom_symbols.bat
  輸入: LYNUSDT
  等待: 2 分鐘

REM 第 2 步：訓練模型
train_custom_symbols.bat
  輸入: LYNUSDT
  模式: 1
  等待: 5-10 分鐘
```

### 批量訓練 3 個幣種

```cmd
REM 收集
collect_custom_symbols.bat
  輸入: LYN ADA DOT

REM 訓練
train_custom_symbols.bat
  輸入: LYN ADA DOT
  模式: 1
```

---

## ✅ 驗證結果

### 查看收集的數據量
```powershell
# 方法 1：在腳本結束時會自動顯示
# 方法 2：手動查詢
docker compose exec postgres psql -U postgres -d alphaselect -c "
  SELECT symbol, COUNT(*) 
  FROM contract_markets 
  WHERE symbol IN ('LYN_USDT', 'ADA_USDT', 'DOT_USDT') 
  GROUP BY symbol;
"
```

### 查看訓練進度
```powershell
# 查看 Celery Worker 日誌
docker logs alphaselect-premier-f-celery-worker-1 -f --tail 50

# 或使用 Web UI
# http://localhost:3000/ai-training
```

### 查看 AI 預測
```powershell
# 訓練完成後，訪問：
# http://localhost:3000/ai-predictions

# 或使用 API
curl "http://localhost:8000/api/v1/ai/predictions" -X POST -H "Content-Type: application/json" -d "{\"symbols\":[\"LYN_USDT\",\"ADA_USDT\",\"DOT_USDT\"]}"
```

---

## ⚠️ 常見問題

### Q1: 數據不足怎麼辦？
**A:** 腳本會顯示 `"missing": 99`，請先執行 `collect_custom_symbols.bat`

### Q2: 可以同時訓練多少個幣種？
**A:** 建議一次 3-5 個，避免 Celery Worker 負載過高

### Q3: 訓練失敗怎麼辦？
**A:** 檢查日誌：
```bash
docker compose logs celery-worker --tail 100
```
常見原因：數據量不足（需 ≥100 條）

### Q4: 如何更新已訓練的模型？
**A:** 重新執行 `train_custom_symbols.bat` 即可覆蓋舊模型

---

## 🚀 進階用法

### 只訓練特定模型類型
編輯 `train_custom_symbols.bat`，在模式選擇部分修改 `models` 變數：
```batch
REM 只訓練 XGBoost
set "models=xgboost"

REM 只訓練 XGBoost + RandomForest
set "models=xgboost random_forest"
```

### 調整數據收集輪數
編輯 `collect_custom_symbols.bat` 第 128 行：
```batch
REM 從 30 改為 50
for /L %%i in (1,1,50) do (
```

---

## 📚 相關文檔

- `HOW_TO_TRAIN_CUSTOM_COINS.md` - 詳細訓練指南
- `TRAINING_QUICK_REFERENCE.txt` - 快速參考命令
- `AI_TRAINING_GUIDE.md` - AI 訓練原理說明
