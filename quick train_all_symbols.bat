@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
echo ========================================
echo   批量训练多合约 AI 模型
echo ========================================
echo.
echo 此脚本会为以下 5 个合约对训练 AI 模型：
echo   • BTC_USDT  • ETH_USDT  • SOL_USDT
echo   • BNB_USDT  • DOGE_USDT
echo.
echo 每个合约训练 5 个模型类型：
echo   1. LSTM (深度学习，30-60分钟)
echo   2. XGBoost (快速，5-15分钟)
echo   3. Random Forest (稳定，5-10分钟)
echo   4. ARIMA (统计，2-5分钟)
echo   5. Linear Regression (基线，<1分钟)
echo.
echo 建议先运行 quick_collect_100.bat 收集足够的数据
echo.
echo 按任意键开始训练...
pause >nul

REM 定义合约对和模型类型
set symbols=BTC_USDT ETH_USDT SOL_USDT BNB_USDT DOGE_USDT
set models=xgboost random_forest linear_regression arima lstm

echo.
echo ========================================
echo 第一步：检查数据量
echo ========================================
echo.
docker compose exec -T postgres psql -U postgres -d premier -c "SELECT symbol, COUNT(*) as count FROM contract_markets WHERE symbol IN ('BTC_USDT','ETH_USDT','SOL_USDT','BNB_USDT','DOGE_USDT') GROUP BY symbol ORDER BY symbol;"

echo.
echo ========================================
echo 第二步：开始批量训练
echo ========================================
echo.

set /a total=0
set /a success=0
set /a failed=0

for %%s in (%symbols%) do (
    echo.
    echo ──────────────────────────────────────
    echo 正在训练合约: %%s
    echo ──────────────────────────────────────
    
    for %%m in (%models%) do (
        set /a total+=1
        echo.
        echo [!total!/25] 训练 %%s - %%m 模型...
        
        REM 调用训练 API
        curl -s -X POST http://localhost:8000/api/v1/ai/training/train ^
        -H "Content-Type: application/json" ^
        -d "{\"symbol\":\"%%s\",\"model_type\":\"%%m\",\"min_data_points\":50}" | findstr "success task_id error"
        
        if !errorlevel! EQU 0 (
            set /a success+=1
            echo ✅ 提交成功
        ) else (
            set /a failed+=1
            echo ❌ 提交失败
        )
        
        REM 短暂延迟
        timeout /t 2 /nobreak >nul
    )
)

echo.
echo ========================================
echo 训练任务提交完成！
echo ========================================
echo.
echo 统计信息：
echo   • 总任务数: !total!
echo   • 提交成功: !success!
echo   • 提交失败: !failed!
echo.
echo 注意：
echo   • 训练任务在后台异步执行
echo   • LSTM 模型需要 30-60 分钟
echo   • 其他模型 2-15 分钟不等
echo   • 可访问 http://localhost:3000/ai-training 查看训练进度
echo.
echo ========================================
echo.
echo 查看已完成的模型...
timeout /t 3 /nobreak >nul
curl -s http://localhost:8000/api/v1/ai/training/models | python -m json.tool 2>nul || echo 请安装 Python 以格式化 JSON 输出

echo.
echo ========================================
pause
