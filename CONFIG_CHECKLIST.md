# ✅ 配置檢查清單

使用這份清單確保您已經完成所有必要的配置步驟。

---

## 📋 安裝軟體檢查

### Docker Desktop

- [ ] ✅ 已下載 Docker Desktop
- [ ] ✅ 已安裝 Docker Desktop  
- [ ] ✅ 已重啟電腦
- [ ] ✅ Docker Desktop 正在運行（可以看到小鯨魚圖標）
- [ ] ✅ 在命令提示字元輸入 `docker --version` 有顯示版本號

---

## 📝 配置文件檢查

### 後端配置（Backend）

**位置**：`backend\.env`

- [ ] ✅ 已從 `backend\.env.example` 複製
- [ ] ✅ 已重命名為 `backend\.env`
- [ ] ✅ 已修改以下設置：

#### 必須修改（重要！）

```env
SECRET_KEY=你的超級複雜密碼ABC123XYZ!@#
```
- [ ] ✅ `SECRET_KEY` 已改成複雜的隨機字串（至少 32 個字符）

#### 建議修改

```env
DB_PASSWORD=你的資料庫密碼
```
- [ ] ✅ `DB_PASSWORD` 已改成您自己的密碼

#### 可選修改（如果您有 MEXC API）

```env
MEXC_API_KEY=您的MEXC_API金鑰
MEXC_SECRET_KEY=您的MEXC密鑰
```
- [ ] ✅ `MEXC_API_KEY` 已填入（或保持預設值）
- [ ] ✅ `MEXC_SECRET_KEY` 已填入（或保持預設值）

### 前端配置（Frontend）

**位置**：`frontend\.env.local`

- [ ] ✅ 已從 `frontend\.env.example` 複製
- [ ] ✅ 已重命名為 `frontend\.env.local`（注意是 `.env.local` 不是 `.env`）
- [ ] ✅ 內容保持預設值（本地開發不需要改）

---

## 🚀 啟動檢查

### 命令執行

- [ ] ✅ 已打開命令提示字元（cmd）
- [ ] ✅ 已用 `cd` 命令進入項目文件夾
- [ ] ✅ 已執行 `docker compose up -d`
- [ ] ✅ 看到所有服務都是 `Created` 或 `Started` 狀態

### 服務檢查

執行 `docker compose ps` 後：

- [ ] ✅ `postgres` 服務狀態為 `Up (healthy)`
- [ ] ✅ `redis` 服務狀態為 `Up (healthy)`
- [ ] ✅ `backend` 服務狀態為 `Up`
- [ ] ✅ `celery` 服務狀態為 `Up`
- [ ] ✅ `frontend` 服務狀態為 `Up`

---

## 🌐 網站訪問檢查

### 前端網站

- [ ] ✅ 可以打開 http://localhost:3000
- [ ] ✅ 看到賽博朋克風格的介面
- [ ] ✅ 導航欄可以正常使用
- [ ] ✅ 可以切換不同頁面

### 後端 API

- [ ] ✅ 可以打開 http://localhost:8000/docs
- [ ] ✅ 看到 Swagger API 文檔介面
- [ ] ✅ 可以看到 API 端點列表

### 健康檢查

- [ ] ✅ 訪問 http://localhost:8000/api/v1/health 看到 `{"status":"healthy"}`

---

## 🧪 功能測試檢查

### 合約交易雷達

- [ ] ✅ 可以訪問 http://localhost:3000/crypto-radar
- [ ] ✅ 可以看到加密貨幣列表
- [ ] ✅ 可以選擇不同的交易對
- [ ] ✅ 數據會每 30 秒自動刷新

### API 測試

在 http://localhost:8000/docs 中：

- [ ] ✅ 找到 `/api/v1/contract/ticker` 端點
- [ ] ✅ 點擊 "Try it out"
- [ ] ✅ 輸入 symbol（例如：`BTC_USDT`）
- [ ] ✅ 點擊 "Execute"
- [ ] ✅ 看到返回的 JSON 數據

---

## 📊 快速檢查命令

複製以下命令到命令提示字元，快速檢查所有狀態：

```bash
# 檢查 Docker 版本
docker --version

# 檢查服務狀態
docker compose ps

# 檢查所有日誌
docker compose logs --tail=50

# 測試後端健康狀態
curl http://localhost:8000/api/v1/health
```

---

## ❌ 常見問題排查

### 如果有任何 ❌ 沒打勾

#### Docker 相關

**問題**：Docker Desktop 沒有運行
```bash
# 解決方法
1. 打開 Docker Desktop 應用程式
2. 等待小鯨魚圖標變成綠色
3. 再執行 docker compose up -d
```

#### 配置文件相關

**問題**：看不到 `.env.example` 文件
```bash
# 解決方法
1. 打開文件資源管理器
2. 點擊「檢視」選項卡
3. 勾選「隱藏的項目」
```

**問題**：不知道怎麼產生 SECRET_KEY
```bash
# 方法1：使用線上工具
訪問：https://randomkeygen.com/
複製 "Fort Knox Passwords" 中的任意一個

# 方法2：隨便打一些複雜的字串
例如：MyS3cr3tK3y!2024@MEXC#Trading$Platform%
```

#### 服務啟動相關

**問題**：端口被占用
```bash
# 查看哪個程序占用了端口（PowerShell）
netstat -ano | findstr :3000
netstat -ano | findstr :8000

# 結束占用的程序
1. 打開任務管理器（Ctrl + Shift + Esc）
2. 找到對應的 PID 程式
3. 結束任務
```

**問題**：服務無法啟動
```bash
# 查看詳細錯誤
docker compose logs backend
docker compose logs frontend

# 重新建置並啟動
docker compose down
docker compose up -d --build
```

---

## 🎯 最終確認

### 全部完成後

如果上面所有的 ✅ 都打勾了，恭喜您！平台已經設置成功！

### 接下來可以做什麼？

1. **探索功能**
   - 訪問所有頁面
   - 測試不同的交易對
   - 查看實時數據更新

2. **閱讀文檔**
   - `QUICKSTART.md` - 新手快速開始
   - `README.md` - 平台概述
   - `MEXC_API_GUIDE.md` - API 設置教學

3. **開始使用**
   - 監控加密貨幣價格
   - 查看資金費率
   - 分析市場趨勢

---

## 📞 需要幫助？

如果還有問題：

1. **檢查日誌**
   ```bash
   docker compose logs -f
   ```

2. **重新啟動所有服務**
   ```bash
   docker compose restart
   ```

3. **完全重置**（會刪除所有數據！）
   ```bash
   docker compose down -v
   docker compose up -d
   ```

4. **查看詳細文檔**
   - `DEPLOYMENT.md` - 完整部署指南
   - `ARCHITECTURE.md` - 系統架構說明

---

**檢查完成時間**：____________

**完成狀態**：✅ 全部完成 / ⚠️ 部分完成 / ❌ 需要協助

**備註**：
```
在這裡記錄您遇到的問題或特殊設置...


```
