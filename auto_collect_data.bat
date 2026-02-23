@echo off
chcp 65001 >nul
echo ========================================
echo   自动数据收集器（用于 AI 训练）
echo ========================================
echo.
echo 此脚本会每分钟收集一次数据
echo 建议运行 2-3 小时以收集足够的训练数据
echo.
echo 按 Ctrl+C 停止收集
echo.
pause

set /a counter=1

:loop
echo.
echo ========================================
echo 第 %counter% 轮数据收集 - %date% %time%
echo ========================================

echo [1/5] BTC_USDT...
curl -s http://localhost:8000/api/v1/contract/ticker/BTC_USDT | findstr "success"

echo [2/5] ETH_USDT...
curl -s http://localhost:8000/api/v1/contract/ticker/ETH_USDT | findstr "success"

echo [3/5] SOL_USDT...
curl -s http://localhost:8000/api/v1/contract/ticker/SOL_USDT | findstr "success"

echo [4/5] BNB_USDT...
curl -s http://localhost:8000/api/v1/contract/ticker/BNB_USDT | findstr "success"

echo [5/5] DOGE_USDT...
curl -s http://localhost:8000/api/v1/contract/ticker/DOGE_USDT | findstr "success"

echo.
echo ✅ 第 %counter% 轮完成！等待 60 秒...
echo.

timeout /t 60 /nobreak >nul

set /a counter+=1
goto loop
