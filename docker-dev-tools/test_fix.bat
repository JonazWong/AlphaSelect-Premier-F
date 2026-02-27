@echo off
chcp 65001 >nul
echo ========================================
echo   修復後重新測試
echo ========================================
echo.

echo [1] 重啟 Backend 容器以應用修復...
docker-compose restart backend
echo.
echo 等待 Backend 啟動 (10秒)...
timeout /t 10 /nobreak >nul
echo.

echo [2] 測試 Backend 健康狀態...
curl -s http://localhost:8000/health
echo.
echo.

echo [3] 測試 Ticker API...
curl -s http://localhost:8000/api/v1/contract/ticker/BTC_USDT
echo.
echo.

echo [4] 等待 2 秒讓資料寫入...
timeout /t 2 /nobreak >nul
echo.

echo [5] 檢查資料庫中的資料...
docker exec alphaselect-premier-f-postgres-1 psql -U admin -d alphaselect -c "SELECT COUNT(*) as total FROM contract_markets WHERE symbol='BTC_USDT';"
echo.

echo [6] 查看最新 3 筆資料...
docker exec alphaselect-premier-f-postgres-1 psql -U admin -d alphaselect -c "SELECT symbol, last_price, volume_24h, created_at FROM contract_markets WHERE symbol='BTC_USDT' ORDER BY created_at DESC LIMIT 3;"
echo.

pause
