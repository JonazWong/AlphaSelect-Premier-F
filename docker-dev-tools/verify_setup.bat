@echo off
chcp 65001 >nul
echo ========================================
echo   验证设置和测试系统
echo ========================================
echo.

echo [1/4] 检查后端是否运行...
curl -s http://localhost:8000/health | findstr "healthy"
if %ERRORLEVEL% EQU 0 (
    echo ✅ 后端运行正常
) else (
    echo ❌ 后端未运行，请执行: docker compose restart backend
)
echo.

echo [2/4] 测试 Crypto Radar API - Signals...
curl -s "http://localhost:8000/api/v1/contract/signals?direction=long&limit=2" > temp_signals.json
findstr /C:"symbol" temp_signals.json >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Signals API 正常
    type temp_signals.json
) else (
    echo ❌ Signals API 失败
    type temp_signals.json
)
del temp_signals.json >nul 2>&1
echo.
echo.

echo [3/4] 测试 Market Stats API...
curl -s "http://localhost:8000/api/v1/contract/market-stats" > temp_stats.json
findstr /C:"strength" temp_stats.json >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Market Stats API 正常
    type temp_stats.json
) else (
    echo ❌ Market Stats API 失败
    type temp_stats.json
)
del temp_stats.json >nul 2>&1
echo.
echo.

echo [4/4] 测试 Open Interest API (需要API Key)...
curl -s "http://localhost:8000/api/v1/contract/open-interest/BTC_USDT"
echo.
echo.

echo ========================================
echo 测试完成！
echo.
echo 下一步：
echo   1. 如果所有测试通过，访问: http://localhost:3000/crypto-radar
echo   2. 如果有失败，运行: view_backend_logs.bat
echo ========================================
pause
