@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >NUL

:: ========================================
:: Custom Symbol Training Script
:: ========================================

echo.
echo ===============================================
echo   AlphaSelect Premier - Custom Symbol AI Training
echo ===============================================
echo.
echo This script can train AI models for any MEXC contract symbols
echo.

:: Check backend service
echo [*] Checking backend service...
curl.exe -s "http://localhost:8000/health" >NUL 2>&1
if errorlevel 1 (
    echo [ERROR] Backend is not running, please run start.bat first
    pause
    exit /b 1
)
echo [OK] Backend service is running
echo.

:: ========================================
:: Step 1: Enter symbols
:: ========================================
echo ===============================================
echo Step 1: Enter symbols to train (space separated)
echo ===============================================
echo.
echo Examples:
echo    - Single: BTCUSDT
echo    - Multiple: ETHUSDT SOLUSDT BNBUSDT
echo.
echo Supported format:
echo    - BTCUSDT or BTC_USDT (auto convert)
echo    - Any MEXC contract symbol
echo.
echo Popular symbols:
echo    BTC ETH SOL BNB ADA XRP DOGE AVAX MATIC DOT
echo    LINK UNI ATOM FTM NEAR ALGO AAVE CRV LDO ARB
echo.
echo.

set "user_symbols="
set /p user_symbols="Enter symbols (e.g. ETHUSDT BNBUSDT): "

if not defined user_symbols (
    echo.
    echo [ERROR] No symbols entered
    echo.
    pause
    exit /b 1
)

echo.
echo You entered: %user_symbols%
echo.

:: Convert to array
set symbols=
for %%s in (%user_symbols%) do (
    set "symbol=%%s"
    :: Remove USDT suffix
    set "symbol=!symbol:USDT=!"
    :: Add _USDT
    set "symbols=!symbols! !symbol!_USDT"
)

echo.
echo [OK] Will train these symbols: %symbols%
echo.

:: ========================================
:: Step 2: Choose training mode
:: ========================================
echo ===============================================
echo Step 2: Choose training mode
echo ===============================================
echo.
echo 1. Fast Training (Recommended) - XGBoost + Random Forest
echo    Time: 10-20 min per symbol
echo    Accuracy: High
echo.
echo 2. Full Training - All Models (LSTM + XGBoost + RF + ARIMA + LR)
echo    Time: 40-70 min per symbol
echo    Accuracy: Highest
echo.
echo 3. XGBoost Only (Fastest)
echo    Time: 5-10 min per symbol
echo    Accuracy: High
echo.
echo.

set "train_mode="
set /p train_mode="Select mode (1/2/3, default 1): "

if not defined train_mode set train_mode=1

if "%train_mode%"=="1" (
    set "models=xgboost random_forest"
    set "mode_name=Fast Training"
) else if "%train_mode%"=="2" (
    set "models=xgboost random_forest linear_regression arima lstm"
    set "mode_name=Full Training"
) else if "%train_mode%"=="3" (
    set "models=xgboost"
    set "mode_name=XGBoost Fast"
) else (
    echo [ERROR] Invalid selection
    pause
    exit /b 1
)

echo.
echo [OK] Selected: %mode_name%
echo [OK] Models: %models%
echo.

:: ========================================
:: Step 3: Check data availability
:: ========================================
echo ===============================================
echo Step 3: Check data availability
echo ===============================================
echo.

set all_ready=1
for %%s in (%symbols%) do (
    echo Checking %%s...
    
    :: Use API to check data status
    curl.exe -s "http://localhost:8000/api/v1/ai/training/data-status?symbol=%%s&min_required=100" > temp_status.json 2>NUL
    
    if exist temp_status.json (
        :: Simply display result
        type temp_status.json
        echo.
    ) else (
        echo [WARN] Cannot check %%s data status
        set all_ready=0
    )
)

if exist temp_status.json del temp_status.json

echo.
echo [INFO] If data insufficient, run these commands first:
echo    curl http://localhost:8000/api/v1/contract/collect
echo    or run: quick_collect_100.bat
echo.
echo.

set "continue="
set /p continue="Press Y to continue, other key to exit: "

if /i not "%continue%"=="Y" (
    echo Cancelled
    pause
    exit /b 0
)

:: ========================================
:: Step 4: Start training
:: ========================================
echo.
echo ===============================================
echo Step 4: Start training
echo ===============================================
echo.

set /a total=0
set /a success=0
set /a failed=0

for %%s in (%symbols%) do (
    for %%m in (%models%) do (
        set /a total+=1
        echo.
        echo [!total!] Training %%s - %%m...
        
        :: Use PowerShell to call API
        powershell -Command "$body = @{symbol='%%s'; model_type='%%m'; min_data_points=100} | ConvertTo-Json; try { $response = Invoke-RestMethod -Method Post -Uri 'http://localhost:8000/api/v1/ai/training/train' -Body $body -ContentType 'application/json'; Write-Host '[OK] Submitted:' $response.message -ForegroundColor Green; exit 0 } catch { Write-Host '[ERROR] Failed:' $_.Exception.Message -ForegroundColor Red; exit 1 }"
        
        if !errorlevel! equ 0 (
            set /a success+=1
        ) else (
            set /a failed+=1
        )
        
        timeout /t 2 >NUL
    )
)

:: ========================================
:: Summary
:: ========================================
echo.
echo ===============================================
echo Training Summary
echo ===============================================
echo.
echo Total tasks: %total%
echo Successful: %success%
echo Failed: %failed%
echo.
echo [INFO] Check training progress:
echo    - Backend logs: docker logs alphaselect-premier-f-celery-worker-1
echo    - API query: http://localhost:8000/docs (see /ai/training/models)
echo.
echo [INFO] After training completes, AI Predictions page will
echo        automatically show predictions for these symbols
echo.

pause
