@echo off
chcp 65001 >nul
echo ========================================
echo   查看后端错误日志
echo ========================================
echo.
docker-compose logs backend --tail=100
echo.
echo ========================================
pause
