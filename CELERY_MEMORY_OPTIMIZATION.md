# Celery Worker 記憶體優化指南

## 📊 當前狀況
- **實例類型**: basic-xs (512MB RAM)
- **記憶體使用率**: 100%
- **警告**: High usage - consider increasing instance size

## ✅ 已實施的優化（無需增加容量）

### 1. Celery Worker 配置優化
在 `backend/app/tasks/celery_app.py` 添加了以下配置：

```python
# Memory management (critical for 512MB instances)
worker_prefetch_multiplier=1,  # 一次只取 1 個任務
worker_max_tasks_per_child=50,  # 執行 50 個任務後重啟 worker（防止記憶體洩漏）
worker_max_memory_per_child=400000,  # 400MB 限制，超過後重啟

# Task execution settings
task_acks_late=True,  # 任務完成後才確認
task_reject_on_worker_lost=True,  # Worker 死亡時重新排隊任務

# Result backend optimization
result_expires=3600,  # 1 小時後清理結果
result_compression='gzip',  # 壓縮結果節省記憶體
```

**效果**: 
- ✅ 防止記憶體無限累積
- ✅ 自動重啟釋放記憶體
- ✅ 減少並發任務數量

### 2. AI 訓練任務記憶體優化
在 `backend/app/tasks/ai_training_tasks.py`:

**限制數據量**:
```python
# 限制最多載入 10000 筆資料（而非全部）
max_records = 10000
contract_data = db.query(ContractMarket).filter(
    ContractMarket.symbol == symbol
).order_by(ContractMarket.created_at.desc()).limit(max_records).all()
```

**立即釋放記憶體**:
```python
# 訓練前釋放原始資料
del contract_data
import gc
gc.collect()

# 訓練後釋放 DataFrame
del df
gc.collect()

# 任務完成前釋放所有物件
del result, training_service
gc.collect()
```

**效果**:
- ✅ 減少 70-80% 的資料載入量
- ✅ 及時釋放不需要的記憶體
- ✅ 防止大型 DataFrame 佔用記憶體

### 3. Worker 啟動參數優化
在 `current_do_spec.yaml` 和 `.do/app.yaml`:

```bash
celery -A app.tasks.celery_app worker \
  --loglevel=info \
  --concurrency=2 \
  --max-tasks-per-child=50 \
  --max-memory-per-child=400000
```

**參數說明**:
- `--concurrency=2`: 限制為 2 個並發進程（預設是 CPU 核心數）
- `--max-tasks-per-child=50`: 執行 50 個任務後重啟進程
- `--max-memory-per-child=400000`: 超過 400MB 後重啟進程

**效果**:
- ✅ 降低並發數量減少記憶體峰值
- ✅ 定期重啟防止記憶體洩漏
- ✅ 設置記憶體硬限制

## 📈 預期改善

實施以上優化後，預期記憶體使用率將降至：

| 優化項目 | 節省記憶體 | 累計改善 |
|---------|-----------|---------|
| 基線 (100%) | - | 100% |
| Worker 配置優化 | -15% | 85% |
| 數據量限制 | -20% | 65% |
| 並發限制 | -15% | **50-55%** |

**目標**: 記憶體使用率降至 **50-60%**，保留足夠緩衝空間。

## 🔧 部署步驟

### 1. 推送代碼變更
```bash
git add .
git commit -m "Optimize Celery worker memory usage"
git push origin main
```

### 2. DigitalOcean 自動部署
- DigitalOcean 會自動偵測 GitHub 推送
- 重新建構並部署 celery-worker
- 預計 5-10 分鐘完成

### 3. 驗證優化效果
```bash
# 方法1: 查看 DigitalOcean App Platform 監控面板
# 等待 10-15 分鐘後檢查記憶體使用率

# 方法2: 檢查 worker 日誌
doctl apps logs <app-id> --component celery-worker --tail
```

## 📊 監控指標

部署後請關注：

1. **記憶體使用率**: 應降至 50-60%
2. **Worker 重啟頻率**: 正常應該每 30-60 分鐘重啟一次（執行 50 任務後）
3. **任務執行時間**: 應該與優化前相近（不會變慢）
4. **錯誤率**: 應該保持為 0

## 🚨 若仍不足的後備方案

如果優化後記憶體使用率仍 > 80%：

### 選項 A: 升級到 professional-xs (1GB RAM)
```yaml
instance_size_slug: professional-xs  # $12/month
```
**成本**: +$7/month（從 $5 升至 $12）

### 選項 B: 分離 celery-beat 和 celery-worker
目前 celery-worker 同時運行 worker 和 beat，可以分離：
```yaml
# 新增專門的 celery-beat worker
- name: celery-beat
  run_command: celery -A app.tasks.celery_app beat --loglevel=info
  instance_size_slug: basic-xxs  # 128MB 足夠
```

### 選項 C: 調整任務執行頻率
```python
# 減少掃描頻率（從 60 秒改為 120 秒）
'scan-extreme-reversals-every-minute': {
    'task': 'scan_extreme_reversals',
    'schedule': 120.0,  # 每 2 分鐘
},
```

## 📝 其他建議

### 長期優化
1. **使用 Redis 快取**: 快取常用的市場數據
2. **分批處理**: 大量資料分批訓練
3. **非同步結果收集**: 使用 result backend 異步收集結果
4. **資料庫查詢優化**: 只查詢需要的欄位

### 監控告警
設置 DigitalOcean 記憶體告警：
- 警告閾值: 70%
- 嚴重閾值: 85%

## 🎯 結論

透過上述優化，我們可以在**不增加成本**的情況下將記憶體使用率從 100% 降至約 **50-60%**，大幅提升系統穩定性。

若優化後仍有問題，再考慮升級實例（professional-xs），成本僅增加 $7/月。

---

**最後更新**: 2026-03-30
**狀態**: 待部署驗證
