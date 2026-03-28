@echo off
chcp 65001 > nul
echo ========================================
echo    訓練所有 6 種 AI 模型（BTC_USDT）
echo ========================================
echo.
echo 此腳本將依次訓練：
echo   1. XGBoost        ✓ (梯度提升)
echo   2. Random Forest  ✓ (隨機森林)
echo   3. ARIMA          ✓ (時間序列)
echo   4. Linear Regression ✓ (線性回歸)
echo   5. LSTM           ⚠️  (需要 100+ 數據點)
echo   6. Ensemble       ✓ (集成模型)
echo.
pause
echo.

set API_URL=http://localhost:8000/api/v1/ai/training/train
set SYMBOL=BTC_USDT

echo [1/6] 訓練 XGBoost 模型...
curl -X POST "%API_URL%" ^
  -H "Content-Type: application/json" ^
  -d "{\"symbol\": \"%SYMBOL%\", \"model_type\": \"xgboost\", \"min_data_points\": 100, \"config\": {\"n_estimators\": 100}}"
echo.
timeout /t 5 /nobreak >nul
echo.

echo [2/6] 訓練 Random Forest 模型...
curl -X POST "%API_URL%" ^
  -H "Content-Type: application/json" ^
  -d "{\"symbol\": \"%SYMBOL%\", \"model_type\": \"random_forest\", \"min_data_points\": 100, \"config\": {\"n_estimators\": 100}}"
echo.
timeout /t 5 /nobreak >nul
echo.

echo [3/6] 訓練 ARIMA 模型...
curl -X POST "%API_URL%" ^
  -H "Content-Type: application/json" ^
  -d "{\"symbol\": \"%SYMBOL%\", \"model_type\": \"arima\", \"min_data_points\": 100}"
echo.
timeout /t 5 /nobreak >nul
echo.

echo [4/6] 訓練 Linear Regression 模型...
curl -X POST "%API_URL%" ^
  -H "Content-Type: application/json" ^
  -d "{\"symbol\": \"%SYMBOL%\", \"model_type\": \"linear_regression\", \"min_data_points\": 100}"
echo.
timeout /t 5 /nobreak >nul
echo.

echo [5/6] 訓練 LSTM 模型（需要較長時間）...
curl -X POST "%API_URL%" ^
  -H "Content-Type: application/json" ^
  -d "{\"symbol\": \"%SYMBOL%\", \"model_type\": \"lstm\", \"min_data_points\": 100, \"config\": {\"sequence_length\": 60, \"epochs\": 50, \"batch_size\": 32, \"units\": [128, 64], \"dropout\": 0.2}}"
echo.
timeout /t 10 /nobreak >nul
echo.

echo [6/6] 訓練 Ensemble 集成模型...
curl -X POST "%API_URL%" ^
  -H "Content-Type: application/json" ^
  -d "{\"symbol\": \"%SYMBOL%\", \"model_type\": \"ensemble\", \"min_data_points\": 100, \"config\": {\"xgboost\": {\"n_estimators\": 100}, \"random_forest\": {\"n_estimators\": 100}, \"arima\": {}, \"linear_regression\": {}}}"
echo.
echo.

echo ========================================
echo 所有訓練任務已提交！
echo.
echo 請訪問以下頁面查看訓練進度：
echo   http://localhost:3000/ai-training-monitor
echo.
echo 或檢查資料庫中的模型記錄：
echo   docker compose exec postgres psql -U postgres -d defaultdb -c "SELECT model_type, status, created_at FROM ai_models ORDER BY created_at DESC LIMIT 10;"
echo ========================================
pause
