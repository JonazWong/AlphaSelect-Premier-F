# MEXC API 部署文檔

## 📋 目錄

1. [概述](#概述)
2. [MEXC API 集成狀態](#mexc-api-集成狀態)
3. [配置步驟](#配置步驟)
4. [API 端點](#api-端點)
5. [測試](#測試)
6. [故障排除](#故障排除)

---

## 概述

AlphaSelect Premier F 已完整集成 MEXC 合約交易 API，包括：

- ✅ **公開 API**: 行情數據、K線、資金費率、持倉量等（無需 API Key）
- ✅ **私有 API**: 交易功能（需要配置 API Key）
- ✅ **速率限制**: 100 請求/10秒
- ✅ **熔斷器**: 連續失敗5次後自動熔斷，60秒後恢復
- ✅ **重試機制**: 失敗後指數退避重試
- ✅ **錯誤處理**: 完整的異常處理和日誌記錄

---

## MEXC API 集成狀態

### ✅ 已實現功能

#### 1. **MEXC Contract API 客戶端**
- **文件**: `backend/app/core/mexc/contract.py`
- **類**: `MEXCContractAPI`
- **特性**:
  - 單例模式（`mexc_contract_api`）
  - HTTP 客戶端（基於 httpx）
  - 請求簽名（HMAC SHA256）
  - 速率限制和熔斷保護

#### 2. **API 端點**
- **文件**: `backend/app/api/v1/endpoints/contract_market.py`
- **路由前綴**: `/api/v1/contract`
- **已註冊**: ✅ 在 `main.py` 中已註冊

#### 3. **數據模型**
- **ContractMarket**: 合約市場數據
- **FundingRateHistory**: 資金費率歷史
- **OpenInterestHistory**: 持倉量歷史

#### 4. **前端集成**
- **Crypto Radar 頁面**: 使用 `/api/v1/contract/market-stats` 和 `/api/v1/contract/signals`
- **AI Training 頁面**: 集成實時數據用於模型訓練

---

## 配置步驟

### 方法 1: 使用配置向導（推薦）

```batch
config_mexc.bat
```

這將引導您：
1. 創建/更新 `.env` 文件
2. 輸入 MEXC API 憑證
3. 測試 API 連接
4. 重啟服務

### 方法 2: 手動配置

#### 步驟 1: 創建 .env 文件

```batch
copy .env.example .env
```

#### 步驟 2: 編輯 .env 文件

```env
# MEXC API 配置
MEXC_API_KEY=your-api-key-here
MEXC_SECRET_KEY=your-secret-key-here
MEXC_CONTRACT_BASE_URL=https://contract.mexc.com
MEXC_SPOT_BASE_URL=https://api.mexc.com
```

#### 步驟 3: 獲取 API 密鑰

1. 訪問 [MEXC OpenAPI 管理](https://www.mexc.com/user/openapi)
2. 登入您的 MEXC 帳號
3. 點擊「創建 API Key」
4. 設置 API 權限：
   - ✅ **讀取** - 查看行情數據
   - ⚠️ **交易** - 僅在需要自動交易時啟用
5. 保存 API Key 和 Secret Key

#### 步驟 4: 配置安全設置（可選但推薦）

在 MEXC API 管理頁面：
- 綁定 IP 白名單（提高安全性）
- 設置API權限範圍
- 啟用雙因素認證

---

## API 端點

### 公開 API（無需認證）

#### 1. 獲取所有合約行情
```http
GET /api/v1/contract/tickers
```

**示例**:
```bash
curl http://localhost:8000/api/v1/contract/tickers
```

**響應**:
```json
{
  "success": true,
  "data": [
    {
      "symbol": "BTC_USDT",
      "lastPrice": "95000.5",
      "volume24": "123456789",
      "riseFallRate": "2.5%"
    }
  ],
  "count": 100,
  "timestamp": "2026-02-20T..."
}
```

#### 2. 獲取單個合約行情
```http
GET /api/v1/contract/ticker/{symbol}
```

**參數**:
- `symbol`: 交易對（如 `BTC_USDT`）

**示例**:
```bash
curl http://localhost:8000/api/v1/contract/ticker/BTC_USDT
```

#### 3. 獲取 K 線數據
```http
GET /api/v1/contract/klines/{symbol}
```

**參數**:
- `symbol`: 交易對
- `interval`: 時間週期（Min1, Min5, Min15, Min30, Min60, Hour4, Hour8, Day1, Week1, Month1）
- `limit`: 數量（默認100，最大2000）

**示例**:
```bash
curl "http://localhost:8000/api/v1/contract/klines/BTC_USDT?interval=Min60&limit=100"
```

#### 4. 獲取資金費率
```http
GET /api/v1/contract/funding-rate/{symbol}
```

**示例**:
```bash
curl http://localhost:8000/api/v1/contract/funding-rate/BTC_USDT
```

#### 5. 獲取資金費率歷史
```http
GET /api/v1/contract/funding-rate/history/{symbol}
```

**參數**:
- `page_num`: 頁碼（默認1）
- `page_size`: 每頁數量（默認20）

#### 6. 獲取持倉量
```http
GET /api/v1/contract/open-interest/{symbol}
```

#### 7. 獲取盤口深度
```http
GET /api/v1/contract/depth/{symbol}
```

**參數**:
- `limit`: 深度檔位（5, 10, 20, 50, 100）

#### 8. 獲取指數價格
```http
GET /api/v1/contract/index-price/{symbol}
```

#### 9. 獲取交易信號
```http
GET /api/v1/contract/signals
```

**參數**:
- `min_funding_rate`: 最小資金費率（可選）
- `min_oi_change`: 最小持倉量變化（可選）
- `min_volume`: 最小交易量（可選）

**示例**:
```bash
curl "http://localhost:8000/api/v1/contract/signals?min_funding_rate=0.01&min_volume=1000000"
```

#### 10. 獲取市場統計
```http
GET /api/v1/contract/market-stats
```

---

## 測試

### 1. 本地測試（Python）

```batch
test_mexc.bat
```

或直接運行：
```bash
python test_mexc_api.py
```

這將測試：
- ✅ 配置加載
- ✅ API 客戶端初始化
- ✅ 公開 API 連接
- ✅ 數據獲取功能
- ✅ API 端點註冊

### 2. 服務測試（HTTP）

啟動服務後：

```bash
# 測試健康檢查
curl http://localhost:8000/health

# 測試獲取行情
curl http://localhost:8000/api/v1/contract/tickers

# 測試特定合約
curl http://localhost:8000/api/v1/contract/ticker/BTC_USDT
```

### 3. API 文檔測試

訪問：
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

在這裡可以：
- 查看所有 API 端點
- 在線測試 API
- 查看請求/響應格式

---

## 故障排除

### 問題 1: API Key 未配置

**症狀**: 只能使用公開 API

**解決方案**:
```batch
# 運行配置向導
config_mexc.bat

# 或手動編輯 .env
notepad .env
```

### 問題 2: API 請求失敗

**可能原因**:
1. 網絡連接問題
2. API Key 無效
3. 速率限制超出
4. MEXC API 維護

**診斷**:
```batch
# 查看後端日誌
docker-compose logs backend | findstr MEXC

# 測試 API 連接
python test_mexc_api.py
```

### 問題 3: 速率限制

**症狀**: 日誌顯示 "Rate limit exceeded"

**解決方案**:
- 速率限制器會自動處理
- 減少請求頻率
- 等待限制重置（10秒）

### 問題 4: 熔斷器觸發

**症狀**: 日誌顯示 "Circuit breaker open"

**解決方案**:
- 等待60秒自動恢復
- 檢查 MEXC API 狀態
- 確認網絡連接

### 問題 5: 簽名錯誤

**症狀**: API 返回 "Invalid signature"

**解決方案**:
1. 檢查 API Key 和 Secret Key 是否正確
2. 確認沒有多餘空格
3. 時間同步（確保系統時間正確）

---

## 安全建議

### 1. API Key 安全

- ❌ **不要**將 API Key 提交到 Git
- ✅ `.env` 文件已在 `.gitignore` 中
- ✅ 使用環境變數而非硬編碼
- ✅ 定期輪換 API Key

### 2. 權限設置

- ✅ 僅啟用需要的權限
- ❌ 不要啟用提現權限（除非必要）
- ✅ 綁定 IP 白名單

### 3. 生產環境

- ✅ 使用獨立的 API Key（不要與開發環境共用）
- ✅ 啟用所有安全選項
- ✅ 監控 API 使用情況

---

## 監控和日誌

### 查看 MEXC API 日誌

```bash
# 實時查看
docker-compose logs -f backend | findstr MEXC

# 查看最近日誌
docker-compose logs --tail=100 backend | findstr MEXC
```

### 重要日誌標記

- `INFO`: 正常操作
- `WARNING`: 速率限制、重試
- `ERROR`: API 錯誤、連接失敗
- `CRITICAL`: 系統級錯誤

---

## 下一步

1. ✅ **基本配置**: 運行 `config_mexc.bat`
2. ✅ **測試連接**: 運行 `test_mexc.bat`
3. ✅ **啟動服務**: 運行 `一鍵啟動腳本 start.bat`
4. ✅ **查看文檔**: 訪問 http://localhost:8000/docs
5. 📊 **開始使用**: 訪問 http://localhost:3000

---

## 參考資料

- [MEXC API 官方文檔](https://mexcdevelop.github.io/apidocs/)
- [FastAPI 文檔](https://fastapi.tiangolo.com/)
- [項目 README](README.md)
- [後端故障排除](BACKEND_TROUBLESHOOTING.md)

---

最後更新: 2026-02-20
