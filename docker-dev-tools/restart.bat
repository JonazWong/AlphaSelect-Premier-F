@echo off
chcp 65001 >nul
echo ====================================
echo   重啟 AlphaSelect Premier F
echo ====================================
echo.

echo [1/2] 停止服務...
docker-compose down

echo.
echo [2/2] 啟動服務...
docker-compose up -d

echo.
echo ✅ 服務已重啟
echo.
echo 查看狀態: docker-compose ps
pause