@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
echo ========================================
echo   測試版：收集 10 筆數據
echo ========================================
echo.

:: 確認 Backend 可用
echo [CHECK] 檢查 Backend 服務...
curl -fsS http://localhost:8000/health >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Backend 未運行
    exit /b 1
)
echo [OK] Backend 服務正常
echo.

REM 定義合約對陣列（2個合約）
set symbols=BTC_USDT ETH_USDT
set /a total=0
set /a collected=0
set /a retried=0
set /a errors=0

echo 開始收集數據（2 合約 × 5 次 = 10 筆）...
echo.

FOR /L %%i IN (1,1,5) DO (
    for %%s in (%symbols%) do (
        set /a total+=1
        call :collect_data %%s
        timeout /t 1 /nobreak >nul
    )
)

echo.
echo ========================================
echo [DONE] 測試完成！
echo ========================================
echo.
echo 📊 統計：
echo    • 總請求：  !total!
echo    • 成功：    !collected!
echo    • 失敗：    !errors!
echo    • 重試：    !retried!
echo.
exit /b 0

REM ====================================
REM 子程序：收集單個合約數據
REM ====================================
:collect_data
setlocal
set "symbol=%~1"
set /a retry_count=0

:retry_collect
REM 呼叫 API 並取得 HTTP 狀態碼
set "http_code="
for /f "delims=" %%c in ('curl -s -o nul -w "%%{http_code}" "http://localhost:8000/api/v1/contract/ticker/%symbol%" 2^>nul') do set "http_code=%%c"
if not defined http_code set "http_code=000"

if "%http_code%"=="200" (
    set /a collected+=1
    echo [!total!/10] [OK] %symbol% - HTTP 200
    endlocal & set /a collected=%collected%
    exit /b 0
)

if "%http_code%"=="429" (
    if %retry_count% lss 2 (
        set /a retry_count+=1
        set /a retried+=1
        echo [!total!/10] [WAIT] %symbol% - HTTP 429, retrying...
        timeout /t 3 /nobreak >nul
        goto retry_collect
    )
)

REM 其他錯誤
set /a errors+=1
echo [!total!/10] [ERROR] %symbol% - HTTP %http_code%
endlocal & set /a errors=%errors%
exit /b 1
