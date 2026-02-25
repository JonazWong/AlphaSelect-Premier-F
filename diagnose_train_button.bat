@echo off
chcp 65001 >nul
echo ========================================
echo   診斷訓練按鈕問題
echo ========================================
echo.

echo [1] 檢查資料庫中的訓練數據量...
docker exec alphaselect-premier-f-postgres-1 psql -U admin -d alphaselect -c "SELECT symbol, COUNT(*) as data_count FROM contract_markets GROUP BY symbol;"
echo.

echo [2] 測試訓練 API（模擬前端調用）...
echo.
curl -X POST http://localhost:8000/api/v1/ai/training/train ^
  -H "Content-Type: application/json" ^
  -d "{\"symbol\":\"BTC_USDT\",\"model_type\":\"lstm\",\"min_data_points\":100,\"config\":{}}"
echo.
echo.

echo [3] 檢查 Backend 日誌（最後 20 行）...
docker logs alphaselect-premier-f-backend-1 --tail 20
echo.

echo [4] 檢查 Celery Worker 狀態...
docker ps --filter name=celery
echo.

echo [5] 檢查 Celery Worker 日誌...
docker logs alphaselect-premier-f-celery-worker-1 --tail 15
echo.

echo ========================================
echo 分析結果：
echo ========================================
echo.
echo 如果看到 "Insufficient data" → 需要收集數據
echo 如果看到 "500 Internal Server Error" → Backend 有錯誤
echo 如果看到 "session_id" → 訓練已啟動
echo.

pause
