@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
echo ========================================
echo   批量訓練多合約 AI 模型
echo ========================================
echo.
echo 用途: 為 5 個熱門合約批量提交 AI 模型訓練任務
echo 使用: 雙擊執行，或在命令列輸入 "quick train_all_symbols.bat"
echo.
echo 此腳本將為以下 5 個合約對訓練 AI 模型：
echo   • BTC_USDT  • ETH_USDT  • SOL_USDT
echo   • BNB_USDT  • DOGE_USDT
echo.
echo 每個合約訓練 5 個模型類型：
echo   1. LSTM             (深度學習，30-60 分鐘)
echo   2. XGBoost          (快速，5-15 分鐘)
echo   3. Random Forest    (穩定，5-10 分鐘)
echo   4. ARIMA            (統計，2-5 分鐘)
echo   5. Linear Regression (基線，^<1 分鐘)
echo.
echo 建議先執行 quick_collect_100.bat 收集足夠的數據
echo.
echo 按任意鍵開始訓練...
pause >nul

:: 確認 Backend 可用
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Backend 未運行，請先執行 start.bat 啟動服務
    pause
    exit /b 1
)

REM 定義合約對和模型類型
set symbols=BTC_USDT ETH_USDT SOL_USDT BNB_USDT DOGE_USDT
set models=xgboost random_forest linear_regression arima lstm

echo.
echo ========================================
echo 第一步：檢查數據量
echo ========================================
echo.
docker compose exec -T postgres psql -U postgres -d premier -c "SELECT symbol, COUNT(*) as count FROM contract_markets WHERE symbol IN ('BTC_USDT','ETH_USDT','SOL_USDT','BNB_USDT','DOGE_USDT') GROUP BY symbol ORDER BY symbol;" 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  無法查詢資料庫，請確認 postgres 容器正在運行
)

echo.
echo ========================================
echo 第二步：開始批量訓練
echo ========================================
echo.

set /a total=0
set /a success=0
set /a failed=0

for %%s in (%symbols%) do (
    echo.
    echo ══════════════════════════════════════
    echo 正在訓練合約: %%s
    echo ══════════════════════════════════════

    for %%m in (%models%) do (
        set /a total+=1
        echo.
        echo [!total!/25] 提交訓練任務: %%s - %%m ...

        REM 呼叫訓練 API 並擷取回應
        set "api_response="
        for /f "delims=" %%r in ('curl -s -X POST http://localhost:8000/api/v1/ai/training/train -H "Content-Type: application/json" -d "{\"symbol\":\"%%s\",\"model_type\":\"%%m\",\"min_data_points\":50}" 2^>nul') do (
            set "api_response=%%r"
        )

        REM 判斷回應是否包含 task_id（成功提交的標誌）
        echo !api_response! | findstr /i "task_id" >nul 2>&1
        if !errorlevel! EQU 0 (
            set /a success+=1
            echo ✅ 提交成功
        ) else (
            echo !api_response! | findstr /i "error\|detail\|already" >nul 2>&1
            if !errorlevel! EQU 0 (
                set /a failed+=1
                echo ❌ 提交失敗: !api_response!
            ) else (
                set /a failed+=1
                echo ❌ 提交失敗（未知回應）: !api_response!
            )
        )

        REM 短暫延遲，避免觸發速率限制
        timeout /t 2 /nobreak >nul
    )
)

echo.
echo ========================================
echo 訓練任務提交完成！
echo ========================================
echo.
echo 統計資訊：
echo   • 總任務數:   !total!
echo   • 提交成功:   !success!
echo   • 提交失敗:   !failed!
echo.
echo 注意：
echo   • 訓練任務在後台非同步執行
echo   • LSTM 模型需要 30-60 分鐘
echo   • 其他模型 2-15 分鐘不等
echo   • 可訪問 http://localhost:3000/ai-training 查看訓練進度
echo.
echo ========================================
echo.
echo 查看已完成的模型列表...
timeout /t 3 /nobreak >nul

set "models_response="
for /f "delims=" %%r in ('curl -s http://localhost:8000/api/v1/ai/training/models 2^>nul') do (
    set "models_response=!models_response!%%r"
)

if "!models_response!"=="" (
    echo ⚠️  無法取得模型列表，請確認 Backend 正在運行
) else (
    echo !models_response! | python -m json.tool 2>nul
    if !errorlevel! neq 0 (
        echo !models_response!
        echo （提示：安裝 Python 可取得格式化 JSON 輸出）
    )
)

echo.
echo ========================================
pause
