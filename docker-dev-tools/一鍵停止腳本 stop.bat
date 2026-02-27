@echo off
chcp 65001 >nul
echo ====================================
echo   停止 AlphaSelect Premier F
echo ====================================
echo.

docker-compose down

echo.
echo ✅ 所有服務已停止
pause