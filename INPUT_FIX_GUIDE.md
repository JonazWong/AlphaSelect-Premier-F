# 輸入框文字顏色修復指南

## 問題描述
市場篩選器頁面的搜索框輸入文字顏色與背景顏色相同，導致看不見輸入內容。

## 已實施的修復

### 1. 移除可能衝突的 Tailwind 類別
從 `className` 中移除了 `bg-gray-800` 和 `text-white`

### 2. 使用內聯樣式強制設定
```tsx
style={{ 
  backgroundColor: '#1F2937',  // 深灰色背景
  color: '#FFFFFF',            // 白色文字
  caretColor: '#FFFFFF'        // 白色游標
}}
```

### 3. 全局樣式規則
在 `globals.css` 中添加：
```css
input[type="text"] {
  color: white !important;
}
```

## 如何測試修復

### 方法 1：重啟前端（推薦）
```batch
restart-frontend.bat
```

### 方法 2：手動步驟
1. 運行：
   ```batch
   docker compose restart frontend
   ```

2. 等待 10 秒

3. 訪問：http://localhost:3000/market-screener

4. 按 **Ctrl + Shift + R** 強制重新整理

5. 在搜索框輸入文字（例如：BTC）

6. **應該看到白色文字**

### 方法 3：開發者工具檢查
1. 在搜索框上**右鍵 → 檢查元素**

2. 在 Styles 面板中查看：
   - `color` 應該是 `rgb(255, 255, 255)` 或 `#FFFFFF`
   - `background-color` 應該是 `rgb(31, 41, 55)` 或 `#1F2937`

3. 如果不是，手動在開發者工具中添加：
   ```css
   color: white !important;
   background-color: #1F2937 !important;
   ```

## 預期結果

### 輸入框外觀
- **背景顏色**：深灰色 (#1F2937)
- **文字顏色**：白色 (#FFFFFF)
- **Placeholder**：灰色 (正常顯示 "Search symbols...")
- **搜索圖標**：灰色（在輸入框左側）
- **游標**：白色（閃爍的垂直線）

### 互動效果
1. 輸入 "BTC" → 看到白色的 "BTC"
2. 過濾結果顯示包含 BTC 的交易對
3. 輸入 "xyz" → 看到白色的 "xyz"
4. 顯示 "No symbols found"

## 如果仍然看不到文字

### 檢查清單
- [ ] 已重啟前端容器
- [ ] 已按 Ctrl + Shift + R 清除緩存
- [ ] 已等待 10 秒讓 Next.js 重新編譯
- [ ] 已關閉所有瀏覽器視窗並重新開啟

### 進階排查

#### 1. 檢查容器日誌
```batch
docker compose logs frontend
```
查看是否有編譯錯誤

#### 2. 檢查瀏覽器控制台
按 F12 → Console 標籤
查看是否有 JavaScript 錯誤

#### 3. 強制重建前端
```batch
docker compose down
docker compose build --no-cache frontend
docker compose up -d
```

#### 4. 嘗試無痕模式
1. 開啟無痕/隱私視窗
2. 訪問 http://localhost:3000/market-screener
3. 測試輸入框

## 臨時解決方案（如果以上都不行）

### 使用瀏覽器擴充功能
1. 安裝 "Stylus" 或 "User CSS" 擴充功能
2. 添加自訂樣式：
```css
input[type="text"] {
  color: white !important;
  background-color: #1F2937 !important;
  caret-color: white !important;
}
```

## 技術細節

### 為什麼會發生這個問題？
1. **Tailwind CSS 樣式優先級**：某些 Tailwind 類別可能被其他樣式覆蓋
2. **瀏覽器緩存**：舊的 CSS 文件被緩存
3. **自動完成樣式**：瀏覽器的自動完成可能影響樣式

### 為什麼使用內聯樣式？
內聯樣式（`style` 屬性）具有最高優先級，可以確保樣式一定被應用。

### 為什麼添加 `!important`？
某些瀏覽器或框架可能有非常高優先級的樣式，`!important` 確保我們的樣式優先。

## 驗證成功

當您能在搜索框中看到以下內容時，表示修復成功：
1. ✅ 輸入的文字是白色
2. ✅ 背景是深灰色
3. ✅ Placeholder 文字是淺灰色
4. ✅ 游標是白色且可見
5. ✅ 搜索功能正常運作

## 需要幫助？

如果問題仍然存在，請截圖並提供：
1. 搜索框的截圖
2. 開發者工具中的 Styles 面板截圖
3. 瀏覽器控制台的錯誤訊息

---

**最後更新：** 2026-02-19  
**修復版本：** Phase 1.1
