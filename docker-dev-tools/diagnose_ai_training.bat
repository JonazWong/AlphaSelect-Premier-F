@echo off
chcp 65001 >nul
echo ========================================
echo   完整診斷 AI Training
echo ========================================
echo.

echo [1] 檢查資料庫中的訓練數據...
docker compose exec -T postgres psql -U alphaselect_user -d alphaselect -c "SELECT symbol, COUNT(*) as count FROM contract_markets GROUP BY symbol ORDER BY count DESC;"
echo.

echo [2] 檢查是否有已訓練的模型...
docker compose exec -T postgres psql -U alphaselect_user -d alphaselect -c "SELECT model_type, symbol, status FROM ai_models ORDER BY created_at DESC LIMIT 5;"
echo.

echo [3] 測試模型列表 API...
curl -s http://localhost:8000/api/v1/ai/training/models/BTC_USDT
echo.
echo.

echo [4] 測試訓練 API（預期會失敗 - 檢查錯誤訊息）...
curl -X POST http://localhost:8000/api/v1/ai/training/train -H "Content-Type: application/json" -d "{\"symbol\":\"BTC_USDT\",\"model_type\":\"lstm\",\"min_data_points\":100}" 2>&1
echo.
echo.

echo [5] 檢查 Frontend 環境變數...
docker exec alphaselect-premier-f-frontend-1 printenv | findstr NEXT_PUBLIC
echo.

echo [6] 檢查 Backend 是否需要 MEXC API Key...
curl -s http://localhost:8000/api/v1/contract/ticker/BTC_USDT | findstr "success"
echo.
echo.

pause
