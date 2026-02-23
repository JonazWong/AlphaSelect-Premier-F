# Backend 故障排除指南

## 🔧 已修復的問題

### 1. **語法錯誤** (已修復 ✅)
- **文件**: `backend/app/main.py`
- **問題**: 引號錯誤 `",'^)` 和 `"/'^)`
- **修復**: 已更正為正確的引號

### 2. **配置文件損壞** (已修復 ✅)
- **文件**: `backend/app/core/config.py`
- **問題**: 包含 "ECHO is off." 垃圾文字
- **修復**: 已清理並恢復正確格式

### 3. **API 路由未註冊** (已修復 ✅)
- **文件**: `backend/app/main.py`
- **問題**: FastAPI 應用沒有註冊 API 路由
- **修復**: 已添加所有 API 端點註冊

### 4. **WebSocket 集成** (已修復 ✅)
- **文件**: `backend/app/main.py`
- **問題**: Socket.IO 未正確集成
- **修復**: 已添加 Socket.IO ASGI 包裝器

### 5. **數據庫初始化** (已修復 ✅)
- **文件**: `backend/app/main.py`
- **問題**: 啟動時未初始化數據庫表
- **修復**: 已添加啟動事件處理器

---

## 🚀 重新啟動步驟

### 方法 1: 完全重啟（推薦）
```batch
# 1. 停止所有服務
一鍵停止腳本 stop.bat

# 2. 重新啟動
一鍵啟動腳本 start.bat
```

### 方法 2: 僅重啟 Backend
```batch
restart_backend.bat
```

### 方法 3: 重新構建 Backend（如果方法2失敗）
```batch
rebuild_backend.bat
```

---

## 📋 診斷工具

### 1. 查看 Backend 日誌
```batch
view_backend_logs.bat
```

### 2. 完整診斷
```batch
diagnose_backend.bat
```

### 3. 手動命令
```bash
# 查看實時日誌
docker-compose logs -f backend

# 檢查容器狀態
docker-compose ps

# 進入容器調試
docker-compose exec backend bash

# 測試 Python 導入
docker-compose exec backend python -c "from app.main import app; print('OK')"
```

---

## ⚠️ 常見問題

### 問題 1: Backend API 未響應

**症狀**: `http://localhost:8000/health` 無法訪問

**可能原因**:
1. 數據庫未啟動完成
2. Python 代碼錯誤
3. 端口被佔用

**解決步驟**:
```batch
# 1. 查看日誌
docker-compose logs backend

# 2. 檢查數據庫
docker-compose exec postgres pg_isready -U admin

# 3. 檢查端口
netstat -ano | findstr :8000

# 4. 重新構建
rebuild_backend.bat
```

### 問題 2: ModuleNotFoundError

**症狀**: 日誌顯示 "ModuleNotFoundError: No module named 'xxx'"

**解決方案**:
```batch
# 重新構建鏡像（清除緩存）
docker-compose build backend --no-cache
docker-compose up -d backend
```

### 問題 3: 數據庫連接錯誤

**症狀**: 日誌顯示 "could not connect to server"

**解決方案**:
```batch
# 1. 確保 PostgreSQL 啟動
docker-compose up -d postgres

# 2. 等待30秒讓數據庫完全啟動
timeout /t 30

# 3. 重啟 Backend
docker-compose restart backend
```

### 問題 4: 容器不斷重啟

**症狀**: `docker-compose ps` 顯示 Backend 狀態為 "Restarting"

**解決方案**:
```batch
# 1. 停止容器
docker-compose stop backend

# 2. 查看詳細日誌
docker-compose logs backend

# 3. 根據錯誤信息修復代碼

# 4. 重新構建並啟動
rebuild_backend.bat
```

---

## ✅ 驗證 Backend 是否正常

### 1. 健康檢查
```bash
curl http://localhost:8000/health
```
應該返回：
```json
{
  "status": "healthy",
  "timestamp": "2026-02-20T..."
}
```

### 2. API 文檔
訪問：http://localhost:8000/docs
- 應該看到 Swagger UI 界面
- 顯示所有 API 端點

### 3. 測試 API
```bash
# 測試獲取合約列表
curl http://localhost:8000/api/v1/contract/tickers
```

---

## 📞 獲取幫助

如果問題仍未解決：

1. **收集診斷信息**:
   ```batch
   diagnose_backend.bat > diagnosis.txt
   ```

2. **查看完整日誌**:
   ```batch
   docker-compose logs backend > backend_logs.txt
   ```

3. **檢查 Python 環境**:
   ```batch
   docker-compose exec backend python test_backend.py
   ```

---

## 🔄 下次啟動注意事項

1. **等待時間**: 首次啟動需要等待約 30-40 秒
2. **順序**: 數據庫 → Redis → Backend → Frontend
3. **健康檢查**: 使用腳本自動檢查，不要過早測試
4. **日誌監控**: 啟動時保持日誌窗口開啟觀察錯誤

---

最後更新: 2026-02-20
