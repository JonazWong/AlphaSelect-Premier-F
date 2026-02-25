@echo off
chcp 65001 >nul
echo ========================================
echo   快速修复 Crypto Radar 505 错误
echo ========================================
echo.

echo [步骤 1/3] 重启后端容器...
docker-compose restart backend
echo 等待后端启动...
timeout /t 8 /nobreak >nul
echo.

echo [步骤 2/3] 重启前端容器...
docker-compose restart frontend
echo 等待前端启动...
timeout /t 5 /nobreak >nul
echo.

echo [步骤 3/3] 验证服务...
echo.
echo 后端健康检查：
curl -s http://localhost:8000/health
echo.
echo.

echo 测试 signals API：
curl -s "http://localhost:8000/api/v1/contract/signals?direction=long&limit=1" | findstr "success"
echo.
echo.

echo ========================================
echo 修复完成！
echo.
echo 请访问: http://localhost:3000/crypto-radar
echo.
echo 如果仍有问题，请：
echo   1. 按 F12 打开浏览器开发者工具
echo   2. 查看 Console 标签的错误信息
echo   3. 查看 Network 标签查看实际的 HTTP 状态码
echo ========================================
pause
