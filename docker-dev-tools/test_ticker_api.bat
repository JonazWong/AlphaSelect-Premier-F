@echo off
chcp 65001 >nul
echo ========================================
echo   测试 Ticker API
echo ========================================
echo.

echo [1] 测试 BTC_USDT...
curl -s http://localhost:8000/api/v1/contract/ticker/BTC_USDT
echo.
echo.

echo [2] 测试 ETH_USDT...
curl -s http://localhost:8000/api/v1/contract/ticker/ETH_USDT
echo.
echo.

echo [3] 测试不存在的币种 INVALID_USDT...
curl -s http://localhost:8000/api/v1/contract/ticker/INVALID_USDT
echo.
echo.

echo ========================================
echo 测试完成！
echo.
echo 说明：
echo - 如果成功，会返回 "success": true 和价格数据
echo - 如果失败，会显示错误信息
echo ========================================
pause
