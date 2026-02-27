@echo off
chcp 65001 >nul
echo ========================================
echo   修復 WebSocket 後重啟 Frontend
echo ========================================
echo.

echo [1] 重啟 Frontend 容器...
docker compose restart frontend
echo.
echo 等待 Frontend 啟動 (15秒)...
timeout /t 15 /nobreak >nul
echo.

echo [2] 檢查 Frontend 容器狀態...
docker ps --filter name=frontend
echo.

echo [3] 檢查 Frontend 日誌（最後 20 行）...
docker compose logs frontend --tail 20
echo.

echo ========================================
echo ✅ Frontend 已重啟
echo 請刷新瀏覽器: http://localhost:3000/ai-training
echo ========================================
pause
