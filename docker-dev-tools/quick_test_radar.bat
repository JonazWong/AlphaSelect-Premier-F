@echo off
chcp 65001 >nul
echo ========================================
echo   快速诊断 Radar 加载问题
echo ========================================
echo.

echo [测试 1] 后端健康检查...
curl -s http://localhost:8000/health
echo.
echo.

echo [测试 2] Signals API (Long)...
curl -s "http://localhost:8000/api/v1/contract/signals?direction=long&limit=2"
echo.
echo.

echo [测试 3] Market Stats API...
curl -s http://localhost:8000/api/v1/contract/market-stats
echo.
echo.

echo ========================================
echo 如果上面显示数据，说明后端正常
echo 如果显示错误，查看详细日志：
echo   docker compose logs backend --tail=30
echo ========================================
pause
