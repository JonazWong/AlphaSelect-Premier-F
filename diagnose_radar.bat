@echo off
chcp 65001 >nul
echo ========================================
echo   诊断 Crypto Radar API 问题
echo ========================================
echo.

echo [1] 测试后端健康检查...
curl -s http://localhost:8000/health
echo.
echo.

echo [2] 测试 /api/v1/contract/signals?direction=long^&limit=10...
curl -s "http://localhost:8000/api/v1/contract/signals?direction=long&limit=10"
echo.
echo.

echo [3] 测试 /api/v1/contract/market-stats...
curl -s http://localhost:8000/api/v1/contract/market-stats
echo.
echo.

echo ========================================
echo 如果上面的都有数据返回，说明后端 API 正常
echo 问题可能在于：
echo   1. 前端容器需要重启
echo   2. CORS 配置问题
echo   3. 浏览器缓存
echo ========================================
echo.
echo 建议：
echo   1. 运行: docker-compose restart frontend
echo   2. 清除浏览器缓存后刷新页面
echo   3. 按 F12 打开开发者工具查看 Network 标签
echo ========================================
pause
