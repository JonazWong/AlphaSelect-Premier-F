@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
echo ========================================
echo   快速收集多合约训练数据
echo ========================================
echo.
echo 此脚本会收集 5 个热门合约对的数据：
echo   • BTC_USDT  • ETH_USDT  • SOL_USDT
echo   • BNB_USDT  • DOGE_USDT
echo.
echo 每个合约收集 30 条数据（共 150 条，约 3-4 分钟）
echo 足够每个币种训练一个 AI 模型！
echo.
pause

REM 定义合约对数组
set symbols=BTC_USDT ETH_USDT SOL_USDT BNB_USDT DOGE_USDT
set /a total=0

FOR /L %%i IN (1,1,30) DO (
    for %%s in (%symbols%) do (
        set /a total+=1
        REM 顯示 HTTP 狀態碼，若非 200 則打印錯誤
        for /f %%c in ('curl -s -o nul -w "%%{http_code}" http://localhost:8000/api/v1/contract/ticker/%%s') do (
            if %%c NEQ 200 (
                echo [!total!/150] ❌ %%s HTTP %%c - 寫入失敗！
            ) else (
                echo [!total!/150] ✅ %%s - 已收集
            )
        )
        REM 短暂延迟避免触发速率限制
        timeout /t 1 /nobreak >nul
    )
)

echo.
echo ========================================
echo ✅ 数据收集完成！
echo.
echo 检查数据库中的数据量...
docker compose exec -T postgres psql -U postgres -d premier -c "SELECT symbol, COUNT(*) as count FROM contract_markets WHERE symbol IN ('BTC_USDT','ETH_USDT','SOL_USDT','BNB_USDT','DOGE_USDT') GROUP BY symbol ORDER BY symbol;"
echo.
echo ========================================
echo 现在可以开始训练 AI 模型了！
echo 访问: http://localhost:3000/ai-training
echo ========================================
pause
