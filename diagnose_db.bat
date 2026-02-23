@echo off
chcp 65001 >nul
echo ========================================
echo   診斷資料庫和 API
echo ========================================
echo.

echo [1] 檢查 Docker 容器狀態...
docker ps --filter name=alphaselect
echo.

echo [2] 檢查資料庫連接...
docker exec alphaselect-premier-f-postgres-1 psql -U admin -d alphaselect -c "\dt"
echo.

echo [3] 檢查 contract_markets 表結構...
docker exec alphaselect-premier-f-postgres-1 psql -U admin -d alphaselect -c "\d contract_markets"
echo.

echo [4] 檢查資料庫中所有資料...
docker exec alphaselect-premier-f-postgres-1 psql -U admin -d alphaselect -c "SELECT COUNT(*) FROM contract_markets;"
echo.

echo [5] 檢查最近的資料...
docker exec alphaselect-premier-f-postgres-1 psql -U admin -d alphaselect -c "SELECT * FROM contract_markets ORDER BY created_at DESC LIMIT 3;"
echo.

echo [6] 測試 Backend 健康狀態...
curl -s http://localhost:8000/health
echo.
echo.

echo [7] 測試 Ticker API（帶詳細輸出）...
curl -v http://localhost:8000/api/v1/contract/ticker/BTC_USDT 2>&1
echo.

pause
