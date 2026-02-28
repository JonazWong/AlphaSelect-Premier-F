@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
echo ========================================
echo   快速收集 100+ 条训练数据
echo ========================================
echo.
echo 此脚本会快速收集 120 条数据（约 2-3 分钟）
echo 足够训练一个 AI 模型！
echo.
pause

set /a total=0

FOR /L %%i IN (1,1,120) DO (
    REM 顯示 HTTP 狀態碼，若非 200 則打印錯誤
    for /f %%s in ('curl -s -o nul -w "%%{http_code}" http://localhost:8000/api/v1/contract/ticker/BTC_USDT') do (
        if %%s NEQ 200 (
            echo [%%i/120] ❌ HTTP %%s - 寫入失敗！請執行 diagnose_data_collection.bat 查看原因
        ) else (
            echo [%%i/120] ✅ HTTP %%s - 已收集
        )
    )

    REM 短暂延迟避免触发速率限制
    timeout /t 1 /nobreak >nul
)

echo.
echo ========================================
echo ✅ 数据收集完成！
echo.
echo 检查数据库中的数据量...
docker compose exec -T postgres psql -U alphaselect_user -d alphaselect -c "SELECT symbol, COUNT(*) as count FROM contract_markets WHERE symbol='BTC_USDT' GROUP BY symbol;"
echo.
echo ========================================
echo 现在可以开始训练 AI 模型了！
echo 访问: http://localhost:3000/ai-training
echo ========================================
pause
