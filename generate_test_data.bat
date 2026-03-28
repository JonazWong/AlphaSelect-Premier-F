@echo off
chcp 65001 > nul
echo ========================================
echo     生成測試數據（修復頁面顯示問題）
echo ========================================
echo.

echo [1/3] 觸發 AI 預測（生成 predictions 數據）...
echo.
curl -X POST "http://localhost:8000/api/v1/ai/predictions" ^
  -H "Content-Type: application/json" ^
  -d "{\"symbols\": [\"BTCUSDT\", \"ETHUSDT\", \"SOLUSDT\"], \"use_ensemble\": false}"
echo.
echo.

echo [2/3] 檢查當前數據狀態...
echo.
docker compose exec postgres psql -U postgres -d defaultdb -c "SELECT 'extreme_signals' as table_name, COUNT(*) as count FROM extreme_signals UNION ALL SELECT 'predictions', COUNT(*) FROM predictions UNION ALL SELECT 'ai_models', COUNT(*) FROM ai_models UNION ALL SELECT 'contract_markets', COUNT(*) FROM contract_markets;"
echo.

echo [3/3] 檢查掃描任務日誌...
echo.
docker compose logs celery-worker --tail 10 | findstr /C:"scan_extreme_reversals" /C:"predictions"
echo.

echo ========================================
echo     完成！請刷新瀏覽器頁面
echo ========================================
pause
