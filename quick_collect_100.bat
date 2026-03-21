@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >NUL

echo ========================================
echo   快速收集多合約訓練數據
echo ========================================
echo.
echo 用途: 為 5 個熱門合約收集市場數據，用於 AI 模型訓練
echo 使用: 雙擊執行，或在命令列輸入 quick_collect_100.bat
echo.
echo 此腳本將收集以下 5 個合約對的數據：
echo   • BTC_USDT  • ETH_USDT  • SOL_USDT
echo   • BNB_USDT  • DOGE_USDT
echo.
echo 每個合約收集 30 筆數據（共 150 筆，約 3-5 分鐘）
echo.
echo (可選) 開啟除錯：set DEBUG=1 後再執行本腳本
echo.
pause

REM 確認 Backend 可用
echo [CHECK] 檢查 Backend 服務...
curl.exe -fsS "http://localhost:8000/health" >NUL 2>&1
if errorlevel 1 (
    echo [FAIL] Backend 未運行，請先執行 start.bat 啟動服務
    pause
    exit /b 1
)
echo [OK] Backend 服務正常
echo.

REM 定義合約對
set "symbols=BTC_USDT ETH_USDT SOL_USDT BNB_USDT DOGE_USDT"

set /a total=0
set /a collected=0
set /a retried=0
set /a errors=0

echo ========================================
echo 開始收集數據（每次間隔 1 秒）...
echo ========================================
echo.

for /L %%i in (1,1,30) do (
    for %%s in (%symbols%) do (
        set /a total+=1
        call :collect_one "%%s"
        timeout /t 1 /nobreak >NUL
    )
)

echo.
echo ========================================
echo [DONE] 數據收集完成！
echo ========================================
echo.
echo 收集統計摘要：
echo    • 總請求數：  !total!
echo    • 成功收集：  !collected!
echo    • 失敗請求：  !errors!
echo    • 觸發重試：  !retried!
echo.

echo [CHECK] 查詢資料庫中的數據量...
docker compose exec -T postgres psql -U postgres -d alphaselect -c "SELECT symbol, COUNT(*) as count FROM contract_markets WHERE symbol IN ('BTC_USDT','ETH_USDT','SOL_USDT','BNB_USDT','DOGE_USDT') GROUP BY symbol ORDER BY symbol;" 2>NUL
if errorlevel 1 (
    echo [WARN] 無法查詢資料庫，請確認 postgres 容器正在運行
)

echo.
if !errors! gtr 0 (
    echo [WARN] 注意：有 !errors! 個請求失敗
    echo        建議重新執行本腳本，或檢查 docker compose logs backend
)
echo.
echo ========================================
echo 下一步：訓練 AI 模型
echo   執行: "quick train_all_symbols.bat"
echo   或訪問: http://localhost:3000/ai-training
echo ========================================
pause
exit /b 0


REM ------------------------------------------------------------
REM 子程序：收集單一 symbol（含重試）
REM call :collect_one "BTC_USDT"
REM ------------------------------------------------------------
:collect_one
set "symbol=%~1"
set "http_code="
set /a retry_count=0

:try_request
set "http_code="

REM 只取 http_code（curl 其他輸出丟掉）
for /f %%c in ('curl.exe -s -o NUL -w "%%{http_code}" "http://localhost:8000/api/v1/contract/ticker/%symbol%" 2^>NUL') do (
    set "http_code=%%c"
)

if not defined http_code set "http_code=000"

if defined DEBUG (
    echo [DEBUG] symbol=%symbol% http_code=%http_code% retry_count=%retry_count%
)

if "%http_code%"=="200" (
    set /a collected+=1
    echo [!total!/150] [OK] %symbol% - 已收集 (HTTP 200)
    exit /b 0
)

if "%http_code%"=="429" (
    if !retry_count! lss 2 (
        set /a retry_count+=1
        set /a retried+=1
        echo [!total!/150] [WAIT] %symbol% - 速率限制 (HTTP 429)，等待後重試...
        timeout /t 3 /nobreak >NUL
        goto try_request
    ) else (
        set /a errors+=1
        echo [!total!/150] [FAIL] %symbol% - 重試後仍失敗 (HTTP 429)
        exit /b 1
    )
)

if "%http_code%"=="000" (
    if !retry_count! lss 1 (
        set /a retry_count+=1
        set /a retried+=1
        echo [!total!/150] [WARN] %symbol% - 連線失敗，重試中...
        timeout /t 2 /nobreak >NUL
        goto try_request
    ) else (
        set /a errors+=1
        echo [!total!/150] [FAIL] %symbol% - 連線失敗，已跳過
        exit /b 1
    )
)

set /a errors+=1
echo [!total!/150] [FAIL] %symbol% - HTTP %http_code% - 寫入失敗
exit /b 1