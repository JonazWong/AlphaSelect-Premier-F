# 數據庫檢查報告 - 合約對數據狀態

**檢查時間：** 2026年3月7日

## 📊 數據記錄統計

| 合約對 | 記錄數 | 首條記錄 | 最後記錄 | 狀態 |
|--------|--------|---------|---------|------|
| BTC_USDT | 144 | 2026-03-06 16:05:42 | 2026-03-06 19:46:20 | ✅ 良好 |
| ETH_USDT | 31 | 2026-03-06 16:05:42 | 2026-03-06 19:46:21 | ⚠️ 需要更多數據 |
| SOL_USDT | 31 | 2026-03-06 16:05:42 | 2026-03-06 19:46:22 | ⚠️ 需要更多數據 |
| BNB_USDT | 31 | 2026-03-06 16:05:42 | 2026-03-06 19:46:23 | ⚠️ 需要更多數據 |
| DOGE_USDT | 31 | 2026-03-06 16:05:42 | 2026-03-06 19:46:24 | ⚠️ 需要更多數據 |

## 🤖 已訓練模型統計

### BTC_USDT（已訓練 6 個模型）
| 模型類型 | 狀態 | 完成時間 |
|---------|------|---------|
| XGBoost | ✅ Trained | 2026-03-06 19:29:45 |
| Random Forest | ✅ Trained | 2026-03-06 19:29:49 |
| Linear Regression | ✅ Trained | 2026-03-06 19:29:51 |
| ARIMA | ✅ Trained | 2026-03-06 19:29:57 |
| LSTM | ❌ Failed | 2026-03-06 19:30:20 |
| Ensemble | ⏳ Training | - |

### ETH_USDT、SOL_USDT、BNB_USDT、DOGE_USDT
❌ **尚無已訓練模型**

## 💡 建議操作

### 1. 收集更多數據（推薦）
```bash
# 運行自動收集腳本，持續收集 2-3 小時
cd docker-dev-tools
auto_collect_data.bat
```

### 2. 或使用快速收集（快速測試）
```bash
# 快速收集 5 個合約各 30 條數據
quick_collect_100.bat
```

### 3. 開始批量訓練
當數據量達到 50+ 條時：
```bash
# 一鍵訓練所有合約的所有模型
train_all_symbols.bat
```

## 📈 數據量建議

| 模型類型 | 最少數據 | 當前 BTC | 當前其他 | 建議 |
|---------|---------|---------|---------|------|
| Linear Regression | 50 | ✅ 144 | ❌ 31 | 再收集 20+ |
| ARIMA | 100 | ✅ 144 | ❌ 31 | 再收集 70+ |
| Random Forest | 200 | ❌ 144 | ❌ 31 | 再收集 170+ |
| XGBoost | 200 | ❌ 144 | ❌ 31 | 再收集 170+ |
| LSTM | 500 | ❌ 144 | ❌ 31 | 再收集 470+ |

## 🔧 診斷命令

```bash
# 檢查數據量
docker compose exec -T postgres psql -U postgres -d premier -c "SELECT symbol, COUNT(*) as count FROM contract_markets WHERE symbol IN ('BTC_USDT','ETH_USDT','SOL_USDT','BNB_USDT','DOGE_USDT') GROUP BY symbol ORDER BY symbol;"

# 檢查已訓練模型
docker compose exec -T postgres psql -U postgres -d premier -c "SELECT symbol, model_type, status, training_completed_at FROM ai_models WHERE symbol IN ('BTC_USDT','ETH_USDT','SOL_USDT','BNB_USDT','DOGE_USDT') ORDER BY symbol, model_type;"

# 通過 API 檢查
curl http://localhost:8000/api/v1/ai/training/data-status?symbol=BTC_USDT
curl http://localhost:8000/api/v1/ai/training/models/BTC_USDT
```

## ✅ 前端更新

已更新 AI Training 頁面下拉選單，添加以下合約對：
- ✅ BTC_USDT (Bitcoin)
- ✅ ETH_USDT (Ethereum)
- ✅ SOL_USDT (Solana) - **新增**
- ✅ BNB_USDT (Binance Coin)
- ✅ DOGE_USDT (Dogecoin) - **新增**

所有 5 個合約對的數據都已在數據庫中有記錄，可以在前端選擇並開始訓練。
