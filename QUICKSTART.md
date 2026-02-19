# 🚀 新手快速設置指南

**適合對象：完全不懂代碼的新手**

這份指南會一步步帶您設置好整個 MEXC AI 交易平台，不需要任何編程知識！

---

## 📋 第一步：安裝必要軟體（只需要安裝一個）

### 安裝 Docker Desktop

1. **下載 Docker Desktop**
   - Windows：https://www.docker.com/products/docker-desktop/
   - 點擊「Download for Windows」
   - 下載完成後，執行安裝程式

2. **安裝 Docker**
   - 雙擊下載的 `Docker Desktop Installer.exe`
   - 一直點「Next」和「
」
   - 安裝完成後**重啟電腦**

3. **啟動 Docker**
   - 重啟後，打開 Docker Desktop
   - 等待右下角出現「Docker Desktop is running」
   - 看到小鯨魚圖標就代表成功了！

---

## 📝 第二步：配置 MEXC API 金鑰（可選）

如果您想連接真實的 MEXC 交易數據，需要 API 金鑰。**如果只是測試，可以跳過這一步。**

### 2.1 獲取 MEXC API 金鑰

1. **登入 MEXC**
   - 前往：https://www.mexc.com/
   - 登入您的帳戶

2. **創建 API 金鑰**
   - 點擊右上角「用戶中心」
   - 選擇「API 管理」
   - 點擊「創建 API」
   - **重要：只勾選「讀取」權限，不要勾選交易權限！**
   - 複製並保存：
     - API Key（API 金鑰）
     - Secret Key（密鑰）

### 2.2 設置配置文件

#### 後端配置（Backend）

1. **找到文件**
   - 打開項目文件夾：`AlphaSelect-Premier-F`
   - 進入 `backend` 文件夾
   - 找到 `backend\.env.example` 文件

2. **複製並重命名**
   - **右鍵點擊** `.env.example` 文件
   - 選擇「複製」
   - 在同一個文件夾內「貼上」
   - **重命名**為 `.env`（去掉 `.example`）
   - ⚠️ 注意：如果看不到 `.env.example`，請在文件管理器中顯示隱藏文件

3. **編輯配置**
   - 用**記事本**或任何文字編輯器打開 `.env` 文件
   - 找到這幾行並修改：

   ```env
   # MEXC API（如果有 API 金鑰就填入，沒有就不改）
   MEXC_API_KEY=your-api-key-here          ← 改成您的 API Key
   MEXC_SECRET_KEY=your-secret-key-here    ← 改成您的 Secret Key
   
   # 安全密鑰（必須修改！）
   SECRET_KEY=your-secret-key-change-this-in-production  ← 改成任意複雜的字串
   
   # 資料庫密碼（建議修改）
   DB_PASSWORD=dev_password_123            ← 改成您自己的密碼
   ```

4. **保存文件**
   - 按 `Ctrl + S` 保存
   - 關閉編輯器

#### 前端配置（Frontend）

1. **找到文件**
   - 進入 `frontend` 文件夾
   - 找到 `frontend\.env.example` 文件

2. **複製並重命名**
   - 複製 `.env.example`
   - 重命名為 `.env.local`
   - ⚠️ 注意：前端要用 `.env.local`，不是 `.env`

3. **檢查內容**（通常不需要修改）
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_WS_URL=ws://localhost:8000
   ```
   - 這些是本地開發的設置，不需要改動

---

## 🎯 第三步：啟動平台（最簡單的方式）

### ⚠️ 重要說明：不會影響其他專案

**擔心啟動腳本會影響您其他的 Docker 專案嗎？**

✅ **絕對不會！** Docker Compose 的 `down` 命令只會停止和刪除**本專案**的容器。

**詳細說明請看** → [DOCKER_SAFETY.md](DOCKER_SAFETY.md)

**簡單來說**：
- ✅ 只清理 `alphaselect-premier-f_*` 開頭的容器
- ✅ 其他專案的容器完全不受影響
- ✅ 您的其他專案會繼續正常運行

**如果還是不放心**：
1. 先雙擊 `check-ports.bat` 查看端口占用情況
2. 使用 `docker ps` 查看當前所有容器
3. 對比執行後的容器列表，您會發現其他專案完全沒變化！

### 3.1 打開命令提示字元

1. **按下鍵盤**：`Windows 鍵 + R`
2. **輸入**：`cmd`
3. **按下**：`Enter`
4. **會打開一個黑色視窗**（這就是命令提示字元）

### 3.2 進入項目文件夾

在黑色視窗中輸入以下命令（一次一行，輸入完按 Enter）：

```bash
# 1. 進入項目文件夾（請改成您的實際路徑）
cd E:\AlphaSelect-Suite\AlphaSelect-Premier-F

# 2. 確認位置（會顯示當前文件夾內容）
dir
```

您應該會看到這些文件夾：`backend`、`frontend`、`ai_models` 等

### 3.3 啟動所有服務

輸入這個神奇的命令：

```bash
docker compose up -d
```

### 會發生什麼？

系統會自動：
- ✅ 下載所需的軟體（第一次會比較慢，需要 5-10 分鐘）
- ✅ 設置資料庫（PostgreSQL + TimescaleDB）
- ✅ 設置快取系統（Redis）
- ✅ 啟動後端 API（FastAPI）
- ✅ 啟動任務隊列（Celery）
- ✅ 啟動前端網站（Next.js）

您會看到類似這樣的輸出：
```
✔ Network alphaselect-premier-f_default    Created
✔ Volume "postgres_data"                   Created
✔ Volume "redis_data"                      Created
✔ Container postgres                       Started
✔ Container redis                          Started
✔ Container backend                        Started
✔ Container celery                         Started
✔ Container frontend                       Started
```

---

## 🌐 第四步：打開平台

等待 2-3 分鐘讓所有服務啟動完成，然後：

### 打開您的瀏覽器（Chrome、Edge、Firefox 都可以）

1. **前端網站**（主要使用這個）
   - 網址：http://localhost:3000
   - 這是您操作的主畫面

2. **後端 API 文檔**（進階用戶查看）
   - 網址：http://localhost:8000/docs
   - 可以看到所有 API 接口

### 您會看到什麼？

- 🎨 賽博朋克風格的介面
- 📊 加密貨幣合約交易雷達
- 🤖 AI 訓練中心
- 📈 AI 預測面板
- 🔍 市場篩選器

---

## ✅ 第五步：確認一切正常

### 5.1 檢查服務狀態

在命令提示字元中輸入：

```bash
docker compose ps
```

您應該看到所有服務都是 `Up` 狀態：

```
NAME        STATUS
postgres    Up (healthy)
redis       Up (healthy)
backend     Up
celery      Up
frontend    Up
```

### 5.2 查看日誌（如果有問題）

如果某個服務沒有啟動，可以查看日誌：

```bash
# 查看所有日誌
docker compose logs

# 查看特定服務的日誌
docker compose logs backend
docker compose logs frontend
```

---

## 🛠️ 常用命令（複製貼上就能用）

### 停止平台

```bash
docker compose down
```

### 重啟平台

```bash
docker compose restart
```

### 更新代碼後重新建置

```bash
docker compose up -d --build
```

### 查看運行中的容器

```bash
docker compose ps
```

### 完全清除並重新開始

```bash
# ⚠️ 警告：這會刪除所有資料！
docker compose down -v
docker compose up -d
```

---

## 🐛 常見問題解決

### 問題1：端口被占用

**錯誤訊息**：`Error starting userland proxy: listen tcp 0.0.0.0:3000: bind: address already in use`

**解決方法**：
```bash
# 方法1：停止占用端口的程序（推薦）
# 打開任務管理器 → 找到占用端口的程序 → 結束任務

# 方法2：修改端口
# 編輯 docker-compose.yml
# 找到 ports: - "3000:3000"
# 改成 ports: - "3001:3000"
# 然後訪問 http://localhost:3001
```

### 問題2：Docker 沒有啟動

**錯誤訊息**：`Cannot connect to the Docker daemon`

**解決方法**：
- 打開 Docker Desktop
- 等待小鯨魚圖標變綠
- 再執行命令

### 問題3：下載太慢

**解決方法**：
- 第一次下載會比較慢（5-15 分鐘）
- 請耐心等待
- 可以去泡杯咖啡 ☕

### 問題4：找不到 `.env` 文件

**解決方法**：
1. 打開「文件資源管理器」
2. 點擊上方「檢視」
3. 勾選「隱藏的項目」
4. 現在應該可以看到 `.env.example` 了

---

## 📚 下一步

平台啟動成功後，您可以：

1. **探索介面**
   - 點擊「合約交易雷達」查看實時數據
   - 嘗試切換不同的加密貨幣

2. **閱讀文檔**
   - `README.md` - 平台概述
   - `MEXC_API_GUIDE.md` - MEXC API 設置詳細教學
   - `ARCHITECTURE.md` - 系統架構（進階）
   - `AI_TRAINING_GUIDE.md` - AI 模型訓練指南

3. **測試功能**
   - 訪問 http://localhost:3000/crypto-radar
   - 查看實時的加密貨幣數據

4. **開始學習**
   - 如果您想學習編程，可以從 Python 或 TypeScript 開始
   - 推薦資源：
     - Python: https://www.python.org/about/gettingstarted/
     - TypeScript: https://www.typescriptlang.org/docs/

---

## 🆘 需要幫助？

如果遇到任何問題：

1. **查看日誌**
   ```bash
   docker compose logs -f
   ```

2. **檢查配置**
   - 確認 `.env` 文件存在
   - 確認 API 金鑰正確（如果有填寫）

3. **重新啟動**
   ```bash
   docker compose down
   docker compose up -d
   ```

4. **查看文檔**
   - `DEPLOYMENT.md` - 部署指南
   - `SECURITY.md` - 安全說明

---

## 🎉 恭喜！

如果您成功啟動了平台，恭喜您已經完成了設置！

現在您有一個功能完整的 AI 加密貨幣交易分析平台了！

---

**最後提醒**：
- ⚠️ 這是開發版本，不要用於真實交易
- 🔒 不要在網上分享您的 API 金鑰
- 💾 定期備份重要數據
- 📖 遇到問題先查看文檔

**祝您使用愉快！** 🚀
