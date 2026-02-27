@echo off
chcp 65001 >nul
echo ========================================
echo   測試單次 Ticker API 調用
echo ========================================
echo.

echo [1] 調用 Ticker API...
curl -s http://localhost:8000/api/v1/contract/ticker/BTC_USDT
echo.
echo.

echo [2] 等待 2 秒讓資料寫入資料庫...
timeout /t 2 /nobreak >nul
echo.

echo [3] 檢查資料庫...
docker exec alphaselect-premier-f-postgres-1 psql -U postgres -d alpha_select -c "SELECT symbol, last_price, timestamp FROM contract_markets WHERE symbol = 'BTC_USDT' ORDER BY timestamp DESC LIMIT 5;"
echo.

echo [4] 再次調用 API 確認...
curl -s http://localhost:8000/api/v1/contract/ticker/BTC_USDT
echo.
echo.

echo [5] 最後檢查資料庫...
docker exec alphaselect-premier-f-postgres-1 psql -U postgres -d alpha_select -c "SELECT COUNT(*) as total_count FROM contract_markets WHERE symbol = 'BTC_USDT';"
echo.

pause
