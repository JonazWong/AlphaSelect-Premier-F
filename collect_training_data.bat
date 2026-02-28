@echo off
chcp 65001 >nul
echo ========================================
echo   收集市场数据（用于 AI 训练）
echo ========================================
echo.
echo 正在收集 BTC_USDT 市场数据...
echo 这会调用 MEXC API 并保存到数据库
echo.

REM 调用 ticker API 会自动保存数据到数据库
curl -s http://localhost:8000/api/v1/contract/ticker/BTC_USDT
echo.
echo.

echo 正在收集 ETH_USDT 市场数据...
curl -s http://localhost:8000/api/v1/contract/ticker/ETH_USDT
echo.
echo.

echo 正在收集 SOL_USDT 市场数据...
curl -s http://localhost:8000/api/v1/contract/ticker/SOL_USDT
echo.
echo.

echo ========================================
echo 数据收集完成！
echo.
echo 检查已保存的数据量...
timeout /t 2 /nobreak >nul
docker compose exec -T postgres psql -U alphaselect_user -d alphaselect -c "SELECT symbol, COUNT(*) as count FROM contract_markets GROUP BY symbol ORDER BY count DESC LIMIT 10;"
echo.
echo ========================================
echo.
echo 建议：
echo   1. 运行此脚本多次以收集更多数据
echo   2. 或者让 Crypto Radar 页面保持打开，自动刷新
echo   3. 达到 100+ 条数据后即可开始训练 AI 模型
echo ========================================
pause
