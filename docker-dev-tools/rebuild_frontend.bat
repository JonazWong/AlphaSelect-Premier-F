@echo off
chcp 65001 >nul
echo ========================================
echo   重建 Frontend（修復錯誤）
echo ========================================
echo.

echo [1] 停止 Frontend 容器...
docker-compose stop frontend
echo.

echo [2] 重建 Frontend...
docker-compose build frontend
echo.

echo [3] 啟動 Frontend...
docker-compose up -d frontend
echo.

echo 等待 Frontend 啟動 (20秒)...
timeout /t 20 /nobreak >nul
echo.

echo [4] 檢查 Frontend 狀態...
docker ps --filter name=frontend
echo.

echo [5] 檢查 Frontend 日誌...
docker logs alphaselect-premier-f-frontend-1 --tail 30
echo.

echo ========================================
echo ✅ Frontend 已重建
echo 請刷新瀏覽器並測試卡片點擊
echo ========================================
pause
