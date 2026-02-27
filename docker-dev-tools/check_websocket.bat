@echo off
chcp 65001 >nul
echo ========================================
echo   檢查 WebSocket 配置
echo ========================================
echo.

echo [1] 測試 Socket.IO 端點...
curl -v http://localhost:8000/socket.io/?EIO=4^&transport=polling 2>&1 | findstr "HTTP"
echo.

echo [2] 檢查 Backend 日誌（最後 30 行）...
docker compose logs backend --tail 30
echo.

echo [3] 檢查 Frontend 容器狀態...
docker ps --filter name=frontend
echo.

pause
