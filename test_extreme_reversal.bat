@echo off
REM 測試 Extreme Reversal 功能完整性

echo ===============================================
echo     極端反轉功能測試腳本
echo ===============================================
echo.

echo [1/6] 檢查 Docker 容器狀態...
docker ps --filter "name=alphaselect" --format "{{.Names}}: {{.Status}}"
echo.

echo [2/6] 檢查資料表是否存在...
docker exec alphaselect-premier-f-postgres-1 psql -U postgres -d premier -c "\d extreme_signals" | findstr "Table"
echo.

echo [3/6] 測試 API 端點...
curl -s "http://localhost:8000/api/v1/extreme-signals?limit=5" 
echo.
echo.

echo [4/6] 檢查 Celery Beat 調度器狀態...
docker logs alphaselect-premier-f-celery-beat-1 --tail 5
echo.

echo [5/6] 檢查最近的掃描任務執行...
docker logs alphaselect-premier-f-celery-worker-1 --tail 100 | findstr "scan_extreme_reversals"
echo.

echo [6/6] 測試前端頁面訪問...
curl -s -I "http://localhost:3000/extreme-reversal" | findstr "HTTP"
echo.

echo ===============================================
echo     測試完成！
echo ===============================================
echo.
echo 如需手動觸發掃描任務:
echo docker exec alphaselect-premier-f-celery-worker-1 python -c "from app.tasks.extreme_signal_tasks import scan_extreme_reversals; scan_extreme_reversals()"
echo.
pause
