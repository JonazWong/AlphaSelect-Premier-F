@echo off
chcp 65001 >nul
echo ========================================
echo   测试 AI Training API
echo ========================================
echo.

echo [1/4] 检查后端健康...
curl -s http://localhost:8000/health
echo.
echo.

echo [2/4] 获取 BTC_USDT 的已训练模型...
curl -s http://localhost:8000/api/v1/ai/training/models/BTC_USDT
echo.
echo.

echo [3/4] 测试训练 API (预期可能失败 - 数据不足)...
curl -s -X POST http://localhost:8000/api/v1/ai/training/train ^
  -H "Content-Type: application/json" ^
  -d "{\"symbol\":\"BTC_USDT\",\"model_type\":\"lstm\",\"min_data_points\":100,\"config\":{}}"
echo.
echo.

echo [4/4] 测试 WebSocket 端点...
curl -s http://localhost:8000/socket.io/?EIO=4^&transport=polling
echo.
echo.

echo ========================================
echo 测试完成！
echo.
echo 说明：
echo - 如果步骤 3 返回 400 错误 "Insufficient data"，这是正常的
echo   需要先收集足够的市场数据才能训练模型
echo - 如果步骤 4 返回类似 "0{...}" 的数据，WebSocket 正常
echo ========================================
pause
