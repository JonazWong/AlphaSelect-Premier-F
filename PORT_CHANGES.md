# 🔧 端口配置變更說明

## 📊 檢測到的問題

您的系統上已經有其他 Docker 專案（**Looper HQ**）正在運行，占用了以下端口：

| 端口 | 服務 | 被誰占用 |
|------|------|----------|
| 5432 | PostgreSQL | looper-hq-db |
| 6379 | Redis | looper-hq-redis |

## ✅ 解決方案

為了讓**兩個專案同時運行**，我已經將 AlphaSelect Premier F 的端口修改為：

### 變更前後對比

| 服務 | 原端口 | 新端口 | 說明 |
|------|--------|--------|------|
| **PostgreSQL** | 5432 | **5433** | ✅ 修改 |
| **Redis** | 6379 | **6380** | ✅ 修改 |
| **前端 (Next.js)** | 3000 | 3000 | ⭐ 不變 |
| **後端 (FastAPI)** | 8000 | 8000 | ⭐ 不變 |

## 🎯 現在的訪問方式

### 對用戶（您）的影響

✅ **完全沒有影響！** 您還是訪問：
- 前端：http://localhost:3000
- 後端：http://localhost:8000
- API 文檔：http://localhost:8000/docs

### 對外部數據庫工具的影響

如果您使用外部工具（如 DBeaver、pgAdmin、TablePlus）連接數據庫：

**舊配置**：
```
主機: localhost
端口: 5432  ❌ 不再使用
```

**新配置**：
```
主機: localhost
端口: 5433  ✅ 請使用這個
用戶: admin
密碼: 您在 .env 中設置的 DB_PASSWORD
數據庫: alphaselect
```

**Redis 連接**（如果需要）：
```
主機: localhost
端口: 6380  ✅ 請使用這個（原來是 6379）
```

## 🔍 技術細節

### 容器內部通訊

容器之間的通訊**完全不受影響**，仍然使用標準端口：

```yaml
# Backend 連接 PostgreSQL
DATABASE_URL: postgresql://admin:password@postgres:5432/alphaselect
# ↑ 容器內部使用標準端口 5432

# Backend 連接 Redis
REDIS_URL: redis://redis:6379
# ↑ 容器內部使用標準端口 6379
```

### 端口映射說明

```yaml
ports:
  - "5433:5432"  # 主機端口:容器端口
  - "6380:6379"  # 主機端口:容器端口
```

- **左邊**（5433, 6380）= 您的電腦上的端口
- **右邊**（5432, 6379）= 容器內的端口
- 容器內部仍然使用標準端口

## 🚀 現在可以啟動了！

### 方法 1：使用一鍵腳本（推薦）

```
雙擊 → start.bat
```

### 方法 2：使用命令

```bash
docker compose up -d
```

## ✅ 驗證兩個專案同時運行

啟動後，執行命令查看所有容器：

```bash
docker ps
```

您應該看到：

```
NAMES                              STATUS
looper-hq-keycloak                 Up (您的其他專案)
looper-hq-db                       Up (您的其他專案)
looper-hq-redis                    Up (您的其他專案)
alphaselect-premier-f-postgres-1   Up (本專案 - 新啟動)
alphaselect-premier-f-redis-1      Up (本專案 - 新啟動)
alphaselect-premier-f-backend-1    Up (本專案 - 新啟動)
alphaselect-premier-f-frontend-1   Up (本專案 - 新啟動)
```

**兩個專案和平共存！** 🎉

## 📝 端口總覽

### Looper HQ 專案（不受影響）

| 服務 | 端口 |
|------|------|
| Keycloak | 8080 |
| PostgreSQL | 5432 |
| Redis | 6379 |

### AlphaSelect Premier F 專案（本專案）

| 服務 | 端口 |
|------|------|
| 前端 | 3000 |
| 後端 | 8000 |
| PostgreSQL | 5433 ⭐ |
| Redis | 6380 ⭐ |

**沒有任何端口衝突！** ✅

## 🔄 如果需要改回原端口

如果您的 Looper HQ 專案不再需要了，想改回標準端口：

1. 停止 Looper HQ 專案
2. 編輯本專案的 `docker-compose.yml`
3. 將端口改回：
   ```yaml
   ports:
     - "5432:5432"  # PostgreSQL
     - "6379:6379"  # Redis
   ```
4. 重啟本專案

## 💡 最佳實踐

### 為什麼要使用不同端口？

1. **多專案開發**：可以同時運行多個專案
2. **避免衝突**：不同專案不會互相干擾
3. **靈活性**：可以自由切換專案
4. **安全性**：專案之間完全隔離

### 推薦的端口分配策略

```
專案 A (Looper HQ):
  PostgreSQL: 5432
  Redis: 6379
  
專案 B (AlphaSelect):
  PostgreSQL: 5433
  Redis: 6380
  
專案 C (未來的專案):
  PostgreSQL: 5434
  Redis: 6381
```

## 🆘 常見問題

### Q1: 為什麼不讓 Looper HQ 改端口？

A: 因為：
1. Looper HQ 可能已經有很多配置依賴 5432
2. 新專案更容易修改
3. 保持其他專案穩定運行

### Q2: 會影響性能嗎？

A: 完全不會！端口只是一個訪問地址，不影響性能。

### Q3: 如何確認修改成功？

A: 執行 `docker compose up -d` 後不會報端口衝突錯誤。

### Q4: 外部工具連不上數據庫？

A: 確保使用新端口 5433 而不是 5432。

## 📞 需要幫助？

如果遇到任何問題：

1. **查看端口占用**
   ```bash
   雙擊 check-ports.bat
   ```

2. **查看容器狀態**
   ```bash
   docker compose ps
   ```

3. **查看日誌**
   ```bash
   docker compose logs
   ```

---

**已完成配置修改，現在可以安心啟動了！** 🚀
