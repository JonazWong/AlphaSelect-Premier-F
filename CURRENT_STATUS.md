# AlphaSelect Premier F - 當前功能狀態說明

**更新時間：** 2026-02-19  
**版本：** Phase 1 - Core Infrastructure

---

## 📊 功能頁面對照表

| 頁面名稱 | 路徑 | 狀態 | 說明 |
|---------|------|------|------|
| **首頁** | `/` | ✅ 可用 | 平台介紹和導航 |
| **合約雷達** | `/crypto-radar` | ✅ 可用 | 查看特定交易對實時行情 |
| **市場篩選器** | `/market-screener` | ✅ 可用 | 顯示所有合約市場概覽 |
| **AI 訓練** | `/ai-training` | ⚠️ Coming Soon | 顯示 "Coming Soon" 頁面 |
| **AI 預測** | `/ai-predictions` | ⚠️ Coming Soon | 顯示 "Coming Soon" 頁面 |
| **型態檢測** | `/pattern-detection` | ⚠️ Coming Soon | 顯示 "Coming Soon" 頁面 |

---

## ✅ **可用功能詳解**

### 1. 首頁 (Home Page)
**訪問路徑:** http://localhost:3000

**內容:**
- 平台介紹橫幅
- 功能卡片導航（已標示可用/開發中狀態）
- 平台統計數據
- 技術堆疊說明

**視覺標示:**
- 綠色標籤 "✓ Available" = 可用功能
- 黃色標籤 "Phase 2" = 開發中功能

---

### 2. 合約雷達 (Contract Radar / Crypto Radar)
**訪問路徑:** http://localhost:3000/crypto-radar

**主要功能:**
- 🔍 選擇交易對查看行情
- 💰 顯示最新價格、標記價格、指數價格
- 📊 24小時交易數據（漲跌、成交量、最高/最低價）
- 💵 資金費率和下次結算時間
- 📈 持倉量數據
- 🧮 基差和基差率計算

**支持的交易對:**
- BTC_USDT
- ETH_USDT
- SOL_USDT
- BNB_USDT
- XRP_USDT
- ADA_USDT

**數據來源:** MEXC 官方 API（實時數據）

**已知問題解決:**
- ~~如遇到 "Request failed with status code 500"~~ → 已修復（更新欄位名稱）
- 後端會自動重載，或執行 `docker compose restart backend`

---

### 3. 市場篩選器 (Market Screener)
**訪問路徑:** http://localhost:3000/market-screener

**這就是「篩選器頁面」！**

**主要功能:**
- 📋 顯示前 50 個熱門合約
- 🔍 搜索功能（輸入幣種名稱過濾）
- 💹 實時價格和24小時漲跌
- 📊 交易量排行
- 💰 資金費率概覽
- 🔄 自動刷新（每 10 秒）

**數據展示:**
| 欄位 | 說明 |
|------|------|
| Symbol | 交易對名稱 |
| Last Price | 最新成交價 |
| 24h Change | 24小時漲跌幅（綠色=漲，紅色=跌）|
| 24h Volume | 24小時成交量（百萬美元）|
| Funding Rate | 當前資金費率 |

**使用方式:**
1. 訪問 http://localhost:3000/market-screener
2. 等待數據加載
3. 使用搜索框過濾特定幣種
4. 查看實時市場概覽

---

## ⚠️ **開發中功能（Coming Soon）**

以下頁面**目前只顯示標題和 "Coming Soon" 訊息**，屬於 Phase 2 開發內容：

### AI 訓練中心 (AI Training)
**訪問路徑:** http://localhost:3000/ai-training

**計劃功能:**
- 訓練 LSTM、XGBoost、隨機森林等模型
- 模型超參數調優
- 訓練歷史記錄
- 模型性能評估

**開發狀態:** 📅 Phase 2 規劃中

---

### AI 預測面板 (AI Predictions)
**訪問路徑:** http://localhost:3000/ai-predictions

**計劃功能:**
- 查看價格預測
- 置信度評分
- 預測準確率統計
- 多模型預測對比

**開發狀態:** 📅 Phase 2 規劃中

---

### 型態檢測 (Pattern Detection)
**訪問路徑:** http://localhost:3000/pattern-detection

**計劃功能:**
- 經典圖表型態識別（頭肩頂、雙底等）
- 支撐/阻力位標記
- K線型態識別
- 突破信號提醒

**開發狀態:** 📅 Phase 2 規劃中

---

## 🐛 問題排查

### 問題 1：合約雷達顯示 "Request failed with status code 500"

**原因:** 資料庫欄位名稱不一致（已修復）

**解決方案:**
```batch
# 方法 1: 等待自動重載（約 10 秒）
# 方法 2: 手動重啟後端
docker compose restart backend

# 方法 3: 完全重啟
full-restart.bat
```

**測試是否修復:**
```batch
test-api.bat
```

---

### 問題 2：找不到「篩選器」頁面

**答案:** 篩選器 = Market Screener 頁面

**訪問方式:**
1. 首頁點擊 "Market Screener" 卡片
2. 導航欄點擊 "Market Screener"
3. 直接訪問：http://localhost:3000/market-screener

---

### 問題 3：AI 功能顯示 "Coming Soon"

**這是正常的！**

**原因:**
- 當前版本是 Phase 1（核心基礎設施）
- AI/ML 功能屬於 Phase 2（未來開發）
- 頁面可以訪問，但只顯示 "Coming Soon" 提示

**確認狀態:**
- ✅ AI 訓練 → Coming Soon
- ✅ AI 預測 → Coming Soon  
- ✅ 型態檢測 → Coming Soon

這樣設計是為了：
1. 讓用戶了解未來功能
2. 保留導航結構
3. 方便後續開發

---

## 📋 快速測試清單

### 測試 1：檢查後端 API
```batch
test-api.bat
```

**預期結果:**
- 健康檢查返回 `{"status":"healthy",...}`
- BTC_USDT 行情返回價格數據
- 所有合約列表返回數據陣列

---

### 測試 2：檢查前端頁面

**可用頁面（應該顯示數據）:**
- ✅ http://localhost:3000
- ✅ http://localhost:3000/crypto-radar
- ✅ http://localhost:3000/market-screener

**開發中頁面（應該顯示 "Coming Soon"）:**
- ⚠️ http://localhost:3000/ai-training
- ⚠️ http://localhost:3000/ai-predictions
- ⚠️ http://localhost:3000/pattern-detection

---

### 測試 3：檢查服務狀態
```batch
check-status.bat
```

---

## 🎯 當前可用功能總結

✅ **完全可用（3個頁面）:**
1. 首頁 - 平台導航
2. 合約雷達 - 單一交易對詳細數據
3. 市場篩選器 - 所有合約市場概覽

⚠️ **開發中（3個頁面）:**
1. AI 訓練 - 顯示 Coming Soon
2. AI 預測 - 顯示 Coming Soon
3. 型態檢測 - 顯示 Coming Soon

---

## 📞 需要幫助？

### 重啟服務
```batch
full-restart.bat
```

### 查看日誌
```batch
view-backend-logs.bat
```

### 診斷問題
```batch
quick-check.bat
```

### 測試 API
```batch
test-api.bat
```

---

**總結：**
- ✅ 3 個頁面完全可用，可以查看實時市場數據
- ⚠️ 3 個 AI 功能頁面預留導航，顯示 "Coming Soon"
- 📊 核心功能正常運作，可以開始使用平台

**享受交易數據監控！** 🚀
