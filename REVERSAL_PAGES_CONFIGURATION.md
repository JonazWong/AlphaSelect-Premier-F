# 反轉監控頁面配置說明

## 當前配置總結

### 導航欄中的頁面（2個）

1. **Extreme Reversal** (`/extreme-reversal`)
   - 中文：反轉監察
   - 英文：Reversal Monitor
   - API：`/api/v1/extreme-signals`
   - 功能：顯示極端反轉信號（由後台任務定期掃描）
   - 數據來源：`extreme_signals` 資料表
   - 特色：WebSocket 實時推送、緊急度分類、AI 預測整合

2. **Reversal Monitor** (`/reversal-monitor`)
   - 中文：反轉掃描
   - 英文：Reversal Scan
   - API：`/api/v1/reversal/scan`
   - 功能：即時掃描所有交易對的反轉信號
   - 數據來源：即時計算（基於最新 contract_markets 數據）
   - 特色：交易對篩選、即時掃描、RSI/MACD/布林帶分析

### 額外路徑（不在導航欄）

3. **Extreme Reversal Monitor** (`/extreme-reversal-monitor`)
   - 功能：重定向到 `/extreme-reversal`
   - 不需要加入導航欄（避免重複）

---

## 頁面功能對比

| 功能項目 | Extreme Reversal | Reversal Monitor |
|---------|------------------|------------------|
| 數據來源 | 資料庫（極端信號表） | 即時計算 |
| 更新方式 | WebSocket 推送 | 手動刷新 |
| 掃描頻率 | 後台每分鐘掃描 | 按需掃描 |
| 緊急度分級 | ✅ Critical/High/Medium | ❌ 無 |
| AI 預測整合 | ✅ LSTM/XGBoost/ARIMA | ❌ 無 |
| 資金費率/持倉量 | ✅ 顯示 | ❌ 無 |
| 交易對篩選 | ✅ 過濾功能 | ✅ 過濾功能 |
| 時間框架 | ✅ 5m/15m/30m/1h/4h | ❌ 無 |
| 適用場景 | 監控極端市場異常 | 快速掃描當前反轉機會 |

---

## PR#72 實現的功能清單

✅ **已完成並已在導航欄顯示**：
- [x] Extreme Reversal 頁面 (`/extreme-reversal`)
- [x] 後端 API 端點 (`/api/v1/extreme-signals`)
- [x] Celery 掃描任務 (`scan_extreme_reversals`)
- [x] ExtremeSignal 資料庫模型
- [x] WebSocket 實時推送功能
- [x] 多語言配置（中英文）
- [x] 導航欄整合

❌ **無遺漏項目**

---

## 導航欄配置檔案

### Frontend Navigation (Navigation.tsx)
```typescript
const navItems = [
  { href: '/', labelKey: 'nav.home', icon: Home },
  { href: '/crypto-radar', labelKey: 'nav.cryptoRadar', icon: Activity },
  { href: '/ai-training', labelKey: 'nav.aiTraining', icon: Brain },
  { href: '/ai-predictions', labelKey: 'nav.aiPredictions', icon: TrendingUp },
  { href: '/pattern-detection', labelKey: 'nav.patternDetection', icon: LineChart },
  { href: '/market-screener', labelKey: 'nav.marketScreener', icon: Filter },
  { href: '/extreme-reversal', labelKey: 'nav.extremeReversal', icon: AlertTriangle },  // ← PR#72 新增
  { href: '/reversal-monitor', labelKey: 'nav.reversalMonitor', icon: BarChart2 },
]
```

### 多語言配置 (i18n/locales)

**中文 (zh.json)**:
```json
{
  "nav": {
    "extremeReversal": "反轉監察",
    "reversalMonitor": "反轉掃描"
  }
}
```

**英文 (en.json)**:
```json
{
  "nav": {
    "extremeReversal": "Reversal Monitor",
    "reversalMonitor": "Reversal Scan"
  }
}
```

---

## 後端 API 路由配置

### Backend Main (app/main.py)
```python
fastapi_app.include_router(extreme_signals.router, prefix="/api/v1/extreme-signals", tags=["Extreme Signals"])
fastapi_app.include_router(reversal_monitor.router, prefix="/api/v1/reversal", tags=["Reversal Monitor"])
```

### Celery 定期任務 (tasks/celery_app.py)
```python
beat_schedule={
    'scan-extreme-reversals-every-minute': {
        'task': 'scan_extreme_reversals',
        'schedule': 60.0,  # 每 60 秒
    },
}
```

---

## 驗證步驟

### 1. 檢查導航欄顯示
訪問 http://localhost:3000，導航欄應顯示：
- ⚠️ 反轉監察 (Extreme Reversal / Reversal Monitor)
- 📊 反轉掃描 (Reversal Monitor / Reversal Scan)

### 2. 檢查頁面功能
- **Extreme Reversal**: http://localhost:3000/extreme-reversal
  - 應顯示極端反轉信號列表
  - 如果為空，等待後台任務掃描（每分鐘執行）或市場出現極端波動
  
- **Reversal Monitor**: http://localhost:3000/reversal-monitor
  - 應顯示反轉掃描界面
  - 可選擇交易對並點擊刷新按鈕掃描

### 3. 檢查後台任務
```bash
# 查看 Celery Beat 排程日誌
docker compose logs celery-beat --tail 50 | findstr "scan-extreme-reversals"

# 查看 Worker 執行記錄
docker compose logs celery-worker --tail 50 | findstr "scan_extreme_reversals"
```

### 4. 檢查資料庫數據
```bash
docker compose exec postgres psql -U postgres -d defaultdb -c "SELECT COUNT(*) FROM extreme_signals;"
```

---

## 常見問題 (FAQ)

### Q1: 為什麼 Extreme Reversal 頁面沒有數據？
**A**: 數據由後台任務 `scan_extreme_reversals` 每分鐘掃描生成。如果當前市場沒有符合條件的極端反轉信號，資料表會是空的。

可以：
1. 等待市場出現極端波動
2. 調整掃描閾值（修改 `backend/app/services/extreme_signal_service.py` 中的參數）

### Q2: 兩個反轉頁面有什麼區別？
**A**: 
- **Extreme Reversal**：顯示已偵測並存入資料庫的極端信號（歷史記錄 + 實時推送）
- **Reversal Monitor**：即時掃描當前市場狀況（不存入資料庫，按需計算）

### Q3: `/extreme-reversal-monitor` 是什麼？
**A**: 這是一個重定向頁面，訪問時會自動跳轉到 `/extreme-reversal`。不需要在導航欄中顯示。

### Q4: 為什麼英文版兩個頁面名稱相似？
**A**: 
- `extremeReversal` → "Reversal Monitor"
- `reversalMonitor` → "Reversal Scan"

如果覺得混淆，可以修改 `frontend/src/i18n/locales/en.json`：
```json
{
  "nav": {
    "extremeReversal": "Extreme Signals",    // 更明確
    "reversalMonitor": "Quick Reversal Scan"  // 更明確
  }
}
```

---

## 總結

✅ **所有反轉監控功能已完整實現並顯示在導航欄**
✅ **PR#72 的 Extreme Reversal 功能已正確配置**
✅ **無遺漏的頁面或設置**

兩個頁面各有特色，適用不同場景：
- 需要持續監控極端信號 → 使用 **Extreme Reversal**
- 需要快速掃描當前機會 → 使用 **Reversal Monitor**
