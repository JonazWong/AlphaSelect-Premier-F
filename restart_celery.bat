@echo off
chcp 65001 >nul
echo ========================================
echo   重啟 Celery 服務（應用新任務配置）
echo ========================================
echo.

echo [1/3] 停止 Celery Worker 和 Beat...
docker compose stop celery-worker celery-beat

echo.
echo [2/3] 移除舊容器...
docker compose rm -f celery-worker celery-beat

echo.
echo [3/3] 重新啟動 Celery 服務...
docker compose up -d celery-worker celery-beat

echo.
echo ✅ Celery 服務已重啟
echo.
echo 檢查日誌（查看新任務是否註冊）：
echo   docker compose logs celery-beat --tail 30
echo.
pause
