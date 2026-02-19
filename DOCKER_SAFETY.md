# ⚠️ 重要說明：Docker Compose 不會影響其他專案

## 🔒 安全保證

**`docker compose down` 只會停止和刪除在當前專案文件夾內 `docker-compose.yml` 定義的容器。**

### 為什麼是安全的？

1. **專案隔離**
   - 每個專案有自己的 `docker-compose.yml`
   - Docker Compose 只管理該文件中定義的服務
   - 不會影響其他專案的容器

2. **容器名稱前綴**
   - 本專案的容器名稱都以專案文件夾名稱開頭
   - 例如：`alphaselect-premier-f_backend_1`
   - 可以和其他專案的容器共存

3. **網絡隔離**
   - 每個專案有自己的 Docker 網絡
   - 不會干擾其他專案的網絡

---

## 📊 實際測試

### 查看當前所有運行的容器

打開命令提示字元，輸入：

```bash
docker ps
```

您會看到類似這樣的輸出：

```
CONTAINER ID   IMAGE                    NAMES
abc123def456   node:18-alpine           my-other-project_web_1
def789ghi012   postgres:15              my-other-project_db_1
ghi012jkl345   timescale/timescaledb    alphaselect-premier-f_postgres_1
jkl345mno678   redis:7-alpine           alphaselect-premier-f_redis_1
```

### 只清理本專案的容器

在本專案文件夾執行：

```bash
docker compose down
```

**結果**：
- ✅ 只刪除 `alphaselect-premier-f_*` 開頭的容器
- ✅ `my-other-project_*` 的容器**完全不受影響**
- ✅ 其他專案繼續正常運行

---

## 🛡️ 額外保護措施

我們在腳本中添加了額外的安全檢查：

### 1. 端口檢查工具 (`check-ports.bat`)

雙擊運行，會顯示：
- 哪些端口被占用
- 是哪個程式占用的
- 是不是本專案的容器

### 2. 智能提示

腳本會提示您：
```
⚠ 發現端口被占用！

💡 重要說明:
   - 如果是此專案的舊容器: 可以安全清理
   - 如果是其他專案占用: 請選擇手動處理

您想要如何處理？
  [1] 只清理這個專案的容器 (安全，推薦)
  [2] 手動處理後再啟動
  [3] 查看占用端口的程式
  [4] 取消啟動
```

---

## 🔍 如何確認是否是本專案的容器

### 方法 1：查看容器名稱

```bash
docker ps --filter "name=alphaselect"
```

只會顯示本專案的容器。

### 方法 2：查看 Docker Compose 管理的容器

在本專案文件夾執行：

```bash
docker compose ps
```

只會顯示本專案的服務。

### 方法 3：使用端口檢查工具

雙擊 `check-ports.bat`，會清楚顯示每個端口被誰占用。

---

## 📋 常見場景處理

### 場景 1：端口被本專案的舊容器占用

**現象**：
- 端口 3000, 8000, 5432, 6379 被占用
- `docker ps` 看到 `alphaselect-premier-f_*` 容器

**處理方法**：
```bash
# 方法 1：使用腳本（推薦）
雙擊 stop.bat 或 start.bat (會自動清理)

# 方法 2：手動命令
docker compose down
```

**影響**：✅ 無，只清理本專案

---

### 場景 2：端口被其他 Docker 專案占用

**現象**：
- 端口被占用
- `docker ps` 看到其他專案的容器（例如：`my-blog_db_1`）

**處理方法**：
```bash
# 不要執行 docker compose down！
# 應該修改本專案的端口配置

編輯 docker-compose.yml:
  frontend:
    ports:
      - "3001:3000"  # 改用 3001 端口
  backend:
    ports:
      - "8001:8000"  # 改用 8001 端口
```

**影響**：✅ 無，兩個專案可以同時運行

---

### 場景 3：端口被非 Docker 程式占用

**現象**：
- 端口被占用
- `docker ps` 沒有相關容器
- `check-ports.bat` 顯示是其他程式（如 VS Code, XAMPP 等）

**處理方法**：
1. 使用腳本選項 [3] 查看是哪個程式
2. 在任務管理器中結束該程式
3. 或修改本專案的端口配置

**影響**：✅ 根據您的選擇決定

---

## 🎯 最佳實踐

### 1. 啟動前檢查

```bash
# 步驟 1：查看端口占用
雙擊 check-ports.bat

# 步驟 2：確認是否是本專案的容器
docker ps --filter "name=alphaselect"

# 步驟 3：安全啟動
雙擊 start.bat
```

### 2. 停止服務

```bash
# 只停止本專案（保留數據）
雙擊 stop.bat → 選擇 [1]

# 完全清理本專案（刪除數據）
雙擊 stop.bat → 選擇 [2]
```

### 3. 多專案共存

如果您有多個專案需要同時運行：

```bash
# 專案 A（本專案）- 使用默認端口
ports:
  - "3000:3000"
  - "8000:8000"

# 專案 B（其他專案）- 使用不同端口
ports:
  - "3001:3000"
  - "8001:8000"
```

---

## ✅ 總結

| 操作 | 影響範圍 | 安全性 |
|------|---------|--------|
| `docker compose down` | 僅本專案 | ✅ 完全安全 |
| `start.bat` | 僅本專案 | ✅ 完全安全 |
| `stop.bat` | 僅本專案 | ✅ 完全安全 |
| `check-ports.bat` | 僅查看，不操作 | ✅ 完全安全 |

**結論**：您可以放心使用所有腳本，它們**絕對不會影響您的其他專案**！

---

## 🆘 如果還是不放心

### 測試方法

1. **在啟動前拍照**
   ```bash
   docker ps
   ```
   截圖保存當前所有容器的狀態

2. **執行本專案腳本**
   ```bash
   雙擊 start.bat
   ```

3. **再次檢查**
   ```bash
   docker ps
   ```
   對比截圖，您會發現其他專案的容器**完全沒有變化**！

---

## 📞 需要幫助？

如果您還有疑慮或發現任何問題：

1. **先運行檢查工具**
   ```bash
   雙擊 check-ports.bat
   ```

2. **查看當前所有容器**
   ```bash
   docker ps -a
   ```

3. **查看本專案的容器**
   ```bash
   docker compose ps
   ```

**記住**：Docker Compose 的設計就是為了專案隔離，所以絕對安全！ 🔒
