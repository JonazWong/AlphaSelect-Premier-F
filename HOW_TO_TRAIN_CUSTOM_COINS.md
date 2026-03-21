# 🤖 如何訓練其他幣種的 AI 模型

## 📋 快速開始

### 方法 1：使用互動式腳本 (推薦新手)

直接雙擊執行：
```
train_custom_symbols.bat
```

腳本會引導您：
1. ✏️ 輸入想要訓練的幣種
2. 🎯 選擇訓練模式（快速/完整/僅XGBoost）
3. 📊 檢查數據量是否充足
4. 🚀 自動提交訓練任務

**範例操作：**
```
請輸入幣種: ETHUSDT BNBUSDT ADAUSDT
選擇訓練模式: 1 (快速訓練)
```

---

### 方法 2：使用命令行 API

#### 步驟 1：訓練單個幣種

```powershell
# 訓練 ETH 的 XGBoost 模型
$body = @{
    symbol = "ETH_USDT"
    model_type = "xgboost"
    min_data_points = 100
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:8000/api/v1/ai/training/train" -Body $body -ContentType "application/json"
```

#### 步驟 2：批量訓練多個幣種

```powershell
# 批量訓練 ETH、BNB、ADA
$symbols = @("ETH_USDT", "BNB_USDT", "ADA_USDT")
$models = @("xgboost", "random_forest")

foreach ($symbol in $symbols) {
    foreach ($model in $models) {
        $body = @{
            symbol = $symbol
            model_type = $model
            min_data_points = 100
        } | ConvertTo-Json
        
        Write-Host "訓練 $symbol - $model ..."
        Invoke-RestMethod -Method Post -Uri "http://localhost:8000/api/v1/ai/training/train" -Body $body -ContentType "application/json"
        Start-Sleep -Seconds 2
    }
}
```

---

### 方法 3：使用 curl 命令

```bash
# Linux/Mac 或 Windows Git Bash
curl -X POST "http://localhost:8000/api/v1/ai/training/train" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "ETH_USDT",
    "model_type": "xgboost",
    "min_data_points": 100
  }'
```

---

## 📊 支援的幣種

任何在 MEXC 合約市場交易的幣種都可以訓練，包括但不限於：

### 🔥 主流幣種
- **BTC** (Bitcoin)
- **ETH** (Ethereum)  
- **SOL** (Solana)
- **BNB** (Binance Coin)
- **ADA** (Cardano)
- **XRP** (Ripple)
- **DOGE** (Dogecoin)

### 🌟 熱門 DeFi
- **UNI** (Uniswap)
- **AAVE** (Aave)
- **CRV** (Curve)
- **LDO** (Lido)
- **MKR** (Maker)

### 🚀 Layer 1/Layer 2
- **AVAX** (Avalanche)
- **MATIC** (Polygon)
- **DOT** (Polkadot)
- **ATOM** (Cosmos)
- **NEAR** (Near Protocol)
- **ARB** (Arbitrum)
- **OP** (Optimism)

### 💡 Meme/社群幣
- **PEPE** (Pepe)
- **SHIB** (Shiba Inu)
- **FLOKI** (Floki)

**完整列表請查看：** https://contract.mexc.com/

---

## 🎯 可用的模型類型

| 模型類型 | 訓練時間 | 準確度 | 適用場景 | 推薦指數 |
|---------|---------|--------|----------|---------|
| **xgboost** | 5-15 分鐘 | ⭐⭐⭐⭐⭐ | 短期預測 | ⭐⭐⭐⭐⭐ |
| **random_forest** | 5-10 分鐘 | ⭐⭐⭐⭐ | 中期預測 | ⭐⭐⭐⭐ |
| **lstm** | 30-60 分鐘 | ⭐⭐⭐⭐⭐ | 長期趨勢 | ⭐⭐⭐ |
| **arima** | 2-5 分鐘 | ⭐⭐⭐ | 統計分析 | ⭐⭐⭐ |
| **linear_regression** | <1 分鐘 | ⭐⭐ | 基準比較 | ⭐⭐ |

**建議組合：**
- 🚀 **快速開始**：僅 `xgboost`
- 💪 **平衡推薦**：`xgboost` + `random_forest`
- 🎯 **完整訓練**：全部 5 種模型

---

## ⚙️ 訓練前準備

### 1. 確保數據充足

```powershell
# 檢查特定幣種的數據量
curl "http://localhost:8000/api/v1/ai/training/data-status?symbol=ETH_USDT&min_required=100"
```

**最少數據要求：**
- XGBoost / Random Forest: 100+ 條數據
- LSTM: 500+ 條數據
- ARIMA: 200+ 條數據

### 2. 收集不足的數據

**選項 A - 自訂幣種收集（推薦）：**
```bash
collect_custom_symbols.bat  # 互動式輸入 1-5 個幣種，各收集 30 條數據
```
腳本會引導您輸入想要收集的幣種，例如：`LYNUSDT ADAUSDT DOTUSDT`

**選項 B - 快速收集（使用內建腳本）：**
```bash
quick_collect_100.bat  # 收集 5 個主流幣種（BTC/ETH/SOL/BNB/DOGE）各 30 條數據
```

**選項 C - 自動持續收集：**
```bash
cd docker-dev-tools
auto_collect_data.bat  # 每 60 秒自動收集
```

**選項 D - 手動收集特定幣種：**
```powershell
# 收集單個幣種
curl "http://localhost:8000/api/v1/contract/ticker/ETH_USDT"

# 批量收集
curl -X POST "http://localhost:8000/api/v1/contract/collect"
```

---

## 📈 查看訓練進度

### 方法 1：查看日誌
```powershell
# 查看 Celery Worker 日誌
docker logs alphaselect-premier-f-celery-worker-1 -f --tail 50
```

### 方法 2：查詢 API
```powershell
# 查看特定幣種的所有模型
curl "http://localhost:8000/api/v1/ai/training/models?symbol=ETH_USDT"
```

### 方法 3：查詢資料庫
```powershell
docker exec -it alphaselect-premier-f-postgres-1 psql -U postgres -d alphaselect -c "
  SELECT symbol, model_type, status, 
         metrics->>'rmse' as rmse,
         created_at 
  FROM ai_models 
  WHERE symbol = 'ETH_USDT' 
  ORDER BY created_at DESC 
  LIMIT 10;
"
```

---

## ✅ 訓練完成後

訓練完成後，AI Predictions 頁面會**自動顯示**新增的幣種預測：

1. 🌐 打開前端頁面：http://localhost:3000/ai-predictions
2. 📊 在幣種選擇器中添加新訓練的幣種
3. 🤖 系統自動調用已訓練的模型進行預測
4. ✨ 顯示預測評級（strongBuy/buy/hold/sell/strongSell）

**沒有可用模型的幣種會被系統自動跳過，不會顯示錯誤！**

---

## ⚠️ 常見問題

### Q1：為什麼訓練失敗？
**可能原因：**
- ❌ 數據不足（需要至少 100 條數據）
- ❌ 幣種名稱錯誤（應為 `XXX_USDT` 格式）
- ❌ Celery Worker 未運行

**解決方法：**
```powershell
# 1. 檢查數據量
curl "http://localhost:8000/api/v1/ai/training/data-status?symbol=YOUR_SYMBOL"

# 2. 檢查服務狀態
docker ps | Select-String "celery"

# 3. 重啟服務
docker-compose restart celery-worker celery-beat
```

### Q2：訓練需要多長時間？
- **XGBoost**：5-15 分鐘
- **Random Forest**：5-10 分鐘  
- **LSTM**：30-60 分鐘
- **ARIMA**：2-5 分鐘
- **Linear Regression**：<1 分鐘

### Q3：可以同時訓練多個幣種嗎？
✅ 可以！Celery Worker 會按順序處理任務隊列。

### Q4：如何刪除舊模型？
```powershell
# 查詢模型 ID
curl "http://localhost:8000/api/v1/ai/training/models?symbol=ETH_USDT"

# 刪除特定模型（需要實作刪除端點）
# 或直接在資料庫中操作
docker exec -it alphaselect-premier-f-postgres-1 psql -U postgres -d alphaselect -c "
  DELETE FROM ai_models WHERE id = 'YOUR_MODEL_ID';
"
```

### Q5：訓練失敗後可以重試嗎？
✅ 可以！直接重新提交訓練請求即可。

---

## 🎓 進階技巧

### 自訂訓練配置
```powershell
$body = @{
    symbol = "ETH_USDT"
    model_type = "xgboost"
    min_data_points = 200  # 使用更多數據
    config = @{
        n_estimators = 200
        max_depth = 8
        learning_rate = 0.05
    }
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Method Post -Uri "http://localhost:8000/api/v1/ai/training/train" -Body $body -ContentType "application/json"
```

### 批量訓練腳本範例
```powershell
# train_my_portfolio.ps1
$myCoins = @(
    "ETH_USDT", "BNB_USDT", "ADA_USDT", 
    "DOT_USDT", "LINK_USDT", "UNI_USDT"
)

$models = @("xgboost", "random_forest")

foreach ($coin in $myCoins) {
    Write-Host "🚀 訓練 $coin ..." -ForegroundColor Cyan
    
    foreach ($model in $models) {
        $body = @{
            symbol = $coin
            model_type = $model
            min_data_points = 100
        } | ConvertTo-Json
        
        try {
            $result = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/api/v1/ai/training/train" -Body $body -ContentType "application/json"
            Write-Host "  ✅ $model 訓練已提交" -ForegroundColor Green
        } catch {
            Write-Host "  ❌ $model 訓練失敗: $_" -ForegroundColor Red
        }
        
        Start-Sleep -Seconds 2
    }
    
    Write-Host ""
}

Write-Host "✨ 所有訓練任務已提交！" -ForegroundColor Green
```

保存為 `train_my_portfolio.ps1`，然後執行：
```powershell
powershell -ExecutionPolicy Bypass -File train_my_portfolio.ps1
```

---

## 📚 相關文檔

- 📖 [AI_TRAINING_GUIDE.md](./AI_TRAINING_GUIDE.md) - 完整訓練指南
- 📖 [MULTI_SYMBOL_TRAINING_GUIDE.md](./MULTI_SYMBOL_TRAINING_GUIDE.md) - 多幣種訓練詳解
- 🔧 [COMMAND_REFERENCE.md](./COMMAND_REFERENCE.md) - 常用命令參考

---

**需要幫助？** 查看後端日誌或 Swagger 文檔：
- 📊 Swagger UI: http://localhost:8000/docs
- 📝 日誌: `docker logs alphaselect-premier-f-celery-worker-1 -f`
