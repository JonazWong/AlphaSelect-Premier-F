@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >NUL

:: ========================================
:: Custom Symbol Data Collection Script
:: ========================================

echo.
echo ===============================================
echo   AlphaSelect Premier - Custom Data Collection
echo ===============================================
echo.
echo This script collects market data for your chosen symbols
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
echo Step 1: Enter symbols to collect (1-5 symbols)
echo ===============================================
echo.
echo Examples:
echo    - Single: BTCUSDT
echo    - Multiple: ETHUSDT SOLUSDT BNBUSDT
echo.
echo Popular symbols:
echo    BTC ETH SOL BNB ADA XRP DOGE AVAX MATIC DOT
echo    LINK UNI ATOM FTM NEAR ALGO AAVE CRV LDO ARB
echo.
echo.

set "user_symbols="
set /p user_symbols="Enter symbols (space separated): "

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

:: Convert to normalized format (SYMBOL_USDT)
set symbols=
set /a symbol_count=0
for %%s in (%user_symbols%) do (
    set /a symbol_count+=1
    if !symbol_count! gtr 5 (
        echo [WARN] Maximum 5 symbols allowed, ignoring extras
        goto :done_parsing
    )
    
    set "symbol=%%s"
    :: Remove USDT suffix if exists
    set "symbol=!symbol:USDT=!"
    set "symbol=!symbol:_USDT=!"
    :: Add _USDT
    set "normalized=!symbol!_USDT"
    set "symbols=!symbols! !normalized!"
)
:done_parsing

echo.
echo [OK] Will collect data for !symbol_count! symbols:
for %%s in (%symbols%) do echo    - %%s
echo.

:: ========================================
:: Step 2: Confirm collection parameters
:: ========================================
echo ===============================================
echo Step 2: Collection parameters
echo ===============================================
echo.
echo Collection rounds: 30
echo Symbols per round: !symbol_count!
echo Total API calls: !symbol_count! x 30 = %%TOTAL%%
echo Estimated time: 2-5 minutes
echo.
set /a total_calls=symbol_count*30
echo Total API calls: !total_calls!
echo.

set /p confirm="Press Y to start collection, any other key to exit: "
if /i not "!confirm!"=="Y" (
    echo Cancelled
    pause
    exit /b 0
)

:: ========================================
:: Step 3: Start data collection
:: ========================================
echo.
echo ===============================================
echo Step 3: Collecting data...
echo ===============================================
echo.

set /a total=0
set /a collected=0
set /a errors=0

for /L %%i in (1,1,30) do (
    echo [Round %%i/30]
    for %%s in (%symbols%) do (
        set /a total+=1
        call :collect_one "%%s"
        timeout /t 1 /nobreak >NUL
    )
)

:: ========================================
:: Summary
:: ========================================
echo.
echo ===============================================
echo   Data Collection Completed
echo ===============================================
echo.
echo Collection Summary:
echo    Total requests: !total!
echo    Successful:     !collected!
echo    Failed:         !errors!
echo.

if !errors! gtr 0 (
    echo [WARN] !errors! requests failed
    echo        You can re-run this script or check: docker compose logs backend
    echo.
)

:: Query database counts
echo [*] Checking database records...
echo.
set "sql_symbols="
for %%s in (%symbols%) do (
    if not defined sql_symbols (
        set "sql_symbols='%%s'"
    ) else (
        set "sql_symbols=!sql_symbols!,'%%s'"
    )
)

docker compose exec -T postgres psql -U postgres -d defaultdb -c "SELECT symbol, COUNT(*) as count FROM contract_markets WHERE symbol IN (!sql_symbols!) GROUP BY symbol ORDER BY symbol;" 2>NUL
if errorlevel 1 (
    echo [WARN] Cannot query database, ensure postgres container is running
)

echo.
echo ===============================================
echo Next Steps
echo ===============================================
echo.
echo 1. Train AI models:
echo    Run: train_custom_symbols.bat
echo.
echo 2. View data:
echo    Visit: http://localhost:3000/crypto-radar
echo.
echo 3. Check backend logs:
echo    Run: docker compose logs backend
echo.

pause
exit /b 0


:: ========================================
:: Subroutine: Collect single symbol
:: ========================================
:collect_one
set "symbol=%~1"
set "url=http://localhost:8000/api/v1/contract/ticker/%symbol%"

for /f %%c in ('curl.exe -s -o NUL -w "%%{http_code}" "%url%" 2^>NUL') do set "http_code=%%c"

if "%http_code%"=="200" (
    set /a collected+=1
    echo    [OK] %symbol%
) else (
    set /a errors+=1
    echo    [ERROR] %symbol% - HTTP %http_code%
)

exit /b 0
