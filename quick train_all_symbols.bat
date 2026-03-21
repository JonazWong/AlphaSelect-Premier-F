@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >NUL

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
pause >NUL

:: 確認 Backend 可用
curl.exe -s "http://localhost:8000/health" >NUL 2>&1
if errorlevel 1 (
    echo ❌ Backend 未運行，請先執行 start.bat 啟動服務
    pause
    exit /b 1
)

REM 定義合約對和模型類型
set "symbols=BTC_USDT ETH_USDT SOL_USDT BNB_USDT DOGE_USDT"
set "models=xgboost random_forest linear_regression arima lstm"

echo.
echo ========================================
echo 第一步：檢查數據量
echo ========================================
echo.
docker compose exec -T postgres psql -U postgres -d alphaselect -c "SELECT symbol, COUNT(*) as count FROM contract_markets WHERE symbol IN ('BTC_USDT','ETH_USDT','SOL_USDT','BNB_USDT','DOGE_USDT') GROUP BY symbol ORDER BY symbol;" 2>NUL
if errorlevel 1 (
    echo ⚠️  無法查詢資料庫，請確認 postgres 容器正在運行
)

echo.
echo ========================================
echo 第二步：開始批量訓練
echo ========================================
echo.

set /a total=0
set /a success=0
set /a failed=
