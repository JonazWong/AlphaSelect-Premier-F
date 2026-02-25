@echo off
chcp 65001 >nul
echo ========================================
echo   详细测试问题 API
echo ========================================
echo.

echo [测试 1] GET /api/v1/contract/signals?direction=long^&limit=10
echo.
curl -v "http://localhost:8000/api/v1/contract/signals?direction=long&limit=10" 2>&1
echo.
echo.
echo ========================================
echo.

echo [测试 2] GET /api/v1/contract/market-stats
echo.
curl -v http://localhost:8000/api/v1/contract/market-stats 2>&1
echo.
echo.
echo ========================================
echo 测试完成！
echo.
echo 如果看到 500 错误，请查看 backend 日志：
echo   docker-compose logs backend --tail=50
echo ========================================
pause
