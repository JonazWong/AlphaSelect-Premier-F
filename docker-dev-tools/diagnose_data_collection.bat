@echo off
chcp 65001 >nul
echo ========================================
echo   數據收集診斷工具
echo ========================================
echo.

echo [1/4] 檢查後端是否在線...
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://localhost:8000/health
echo.

echo [2/4] 查詢 BTC_USDT 目前 DB 數據量...
curl -s http://localhost:8000/api/v1/ai/training/data-status?symbol=BTC_USDT
echo.
echo.

echo [3/4] 診斷：測試一次完整的 MEXC API 呼叫 + DB 寫入...
echo （此端點會顯示原始 MEXC 回應 + DB 記錄數 + 實際入庫結果）
curl -s http://localhost:8000/api/v1/contract/diagnose?symbol=BTC_USDT
echo.
echo.

echo [4/4] 手動觸發一次 ticker 收集，並顯示回應...
curl -s http://localhost:8000/api/v1/contract/ticker/BTC_USDT
echo.
echo.

echo ========================================
echo 診斷完成！
echo 請將上方輸出結果截圖，即可找到問題原因：
echo  - mexc_error 有值 = MEXC API 連線問題
echo  - mexc_raw 是 null/空 = MEXC 回傳空資料
echo  - parsed_lastPrice 是 null = 欄位名稱不符
echo  - DB write error = 資料庫寫入異常
echo  - db_count 有增加 = 修復成功
echo ========================================
pause
