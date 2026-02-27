@echo off
chcp 65001 >nul
echo ====================================
echo   简单测试 - 检查 MEXC API 部署
echo ====================================
echo.

echo [1/4] 检查 Docker 服务...
docker-compose ps backend >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Backend 容器未运行
    echo.
    echo 请先启动服务：
    echo    一鍵啟動腳本 start.bat
    echo.
    pause
    exit /b 1
)
echo ✅ Backend 容器正在运行
echo.

echo [2/4] 测试 Backend 健康检查...
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend API 可访问
    curl -s http://localhost:8000/health
) else (
    echo ❌ Backend API 无响应
    echo.
    echo 请运行诊断：
    echo    diagnose_backend.bat
    pause
    exit /b 1
)
echo.

echo [3/4] 测试 MEXC API 端点...
curl -s http://localhost:8000/api/v1/contract/tickers >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ MEXC API 端点可访问
    echo.
    echo 获取行情数据示例（前200字符）：
    curl -s http://localhost:8000/api/v1/contract/tickers | findstr /C:"success" /C:"data"
) else (
    echo ❌ MEXC API 端点无响应
)
echo.

echo [4/4] 检查 API 文档...
curl -s http://localhost:8000/docs >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ API 文档可访问
    echo    访问: http://localhost:8000/docs
) else (
    echo ⚠️  API 文档无响应
)
echo.

echo ====================================
echo   测试完成
echo ====================================
echo.
echo 📊 可用的服务:
echo    • Backend API: http://localhost:8000
echo    • API 文档: http://localhost:8000/docs
echo    • Frontend: http://localhost:3000
echo.
echo 🧪 详细测试:
echo    • 查看日志: view_backend_logs.bat
echo    • 完整诊断: diagnose_backend.bat
echo.
pause
