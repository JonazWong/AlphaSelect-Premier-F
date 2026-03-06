# 多合約對訓練快速指南

## 🚀 快速開始

### 第一步：收集數據（3-4 分鐘）

```bash
quick_collect_100.bat
```

這會自動收集 5 個熱門合約對的數據：
- **BTC_USDT** (比特幣)
- **ETH_USDT** (以太坊)
- **SOL_USDT** (Solana)
- **BNB_USDT** (幣安幣)
- **DOGE_USDT** (狗狗幣)

每個合約收集 30 條數據（共 150 條），足夠訓練基礎模型。

### 第二步：批量訓練（2-3 小時）

```bash
train_all_symbols.bat
```

這會為每個合約對訓練 5 種 AI 模型：
1. **XGBoost** - 快速且準確（5-15分鐘/合約）
2. **Random Forest** - 穩定可靠（5-10分鐘/合約）
3. **Linear Regression** - 快速基線（<1分鐘/合約）
4. **ARIMA** - 統計模型（2-5分鐘/合約）
5. **LSTM** - 深度學習（30-60分鐘/合約）

總計：**25 個模型**（5 合約 × 5 模型）

### 第三步：查看結果

訪問 AI 訓練中心：
```
http://localhost:3000/ai-training
```

或通過 API 查詢：
```bash
curl http://localhost:8000/api/v1/ai/training/models
```

## 📊 推薦工作流程

### 方案 A：快速測試（適合新手）
1. 運行 `quick_collect_100.bat` 收集初始數據
2. 先只訓練快速模型（XGBoost、Random Forest）測試效果
3. 確認效果後再訓練 LSTM

### 方案 B：完整訓練（適合生產環境）
1. 運行 `docker-dev-tools/auto_collect_data.bat` 持續收集數據（建議 2-3 小時）
2. 運行 `train_all_symbols.bat` 批量訓練所有模型
3. 在 UI 中比較不同模型的準確度
4. 部署表現最好的模型

### 方案 C：持續改進
1. 保持 `auto_collect_data.bat` 在背景運行
2. 每天重新訓練模型以適應市場變化
3. 監控模型準確度並調整參數

## 🎯 數據量建議

| 模型類型 | 最少數據 | 推薦數據 | 效果 |
|---------|---------|---------|------|
| Linear Regression | 50 | 100+ | 基線 |
| ARIMA | 100 | 200+ | 良好 |
| Random Forest | 200 | 500+ | 很好 |
| XGBoost | 200 | 500+ | 優秀 |
| LSTM | 500 | 1000+ | 最佳 |

## 💡 常見問題

### Q: 訓練失敗怎麼辦？
**A:** 檢查數據量是否足夠：
```bash
docker compose exec -T postgres psql -U postgres -d premier -c "SELECT symbol, COUNT(*) as count FROM contract_markets GROUP BY symbol ORDER BY count DESC;"
```

### Q: 如何只訓練特定合約對？
**A:** 手動調用 API：
```bash
curl -X POST http://localhost:8000/api/v1/ai/training/train \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTC_USDT","model_type":"xgboost","min_data_points":50}'
```

### Q: 可以添加更多合約對嗎？
**A:** 可以！編輯 `quick_collect_100.bat` 和 `train_all_symbols.bat`，在 `symbols` 變量中添加新的合約對代碼。

### Q: 訓練進度在哪裡查看？
**A:** 
- UI: http://localhost:3000/ai-training
- API: `curl http://localhost:8000/api/v1/ai/training/models/{symbol}`
- 後端日誌: `docker compose logs -f backend`

## 🔧 進階配置

### 自定義訓練參數

編輯 API 請求添加自定義配置：

```json
{
  "symbol": "BTC_USDT",
  "model_type": "lstm",
  "min_data_points": 100,
  "config": {
    "epochs": 100,
    "batch_size": 32,
    "learning_rate": 0.001,
    "hidden_units": [128, 64, 32]
  }
}
```

### 添加新的合約對

在 `quick_collect_100.bat` 中修改：
```batch
set symbols=BTC_USDT ETH_USDT SOL_USDT BNB_USDT DOGE_USDT XRP_USDT ADA_USDT
```

在 `train_all_symbols.bat` 中同步修改相同的行。

## 📚 相關文檔

- [AI_TRAINING_GUIDE.md](AI_TRAINING_GUIDE.md) - 完整訓練指南
- [ARCHITECTURE.md](ARCHITECTURE.md) - 系統架構說明
- [README.md](README.md) - 主要使用說明

## 🎉 快速命令參考

```bash
# 數據收集
quick_collect_100.bat                    # 快速收集 5 個合約的數據
collect_training_data.bat                # 簡單收集 3 個合約
docker-dev-tools/auto_collect_data.bat   # 持續自動收集

# 批量訓練
train_all_symbols.bat                    # 訓練所有合約的所有模型

# 檢查數據
curl http://localhost:8000/api/v1/ai/training/data-status?symbol=BTC_USDT

# 查看模型
curl http://localhost:8000/api/v1/ai/training/models
curl http://localhost:8000/api/v1/ai/training/models/BTC_USDT

# 診斷工具
docker-dev-tools/diagnose_ai_training.bat
docker-dev-tools/diagnose_data_collection.bat
```
