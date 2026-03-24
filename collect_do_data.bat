@echo off
chcp 65001 >NUL
echo ========================================
echo   DO 雲端數據收集腳本
echo ========================================
echo.
echo 目的: 為 DigitalOcean 雲端後端收集市場數據
echo.

set "symbols=BTC_USDT ETH_USDT SOL_USDT BNB_USDT DOGE_USDT"
set /a total=0
set /a success=0

echo [CHECK] 檢查 DO 後端狀態...
curl -fsS https://alphaselect-premier-p5fuz.ondigitalocean.app/health >NUL 2>&1
if errorlevel 1 (
    echo [ERROR] DO 後端無法訪問
    pause
    exit /b 1
)
echo [OK] DO 後端運行正常
echo.

echo 開始收集 30 筆數據（每個交易對）...
echo.

FOR /L %%i IN (1,1,30) DO (
    for %%s in (%symbols%) do (
        set /a total+=1
        
        curl -s -o NUL -w "%%{http_code}" https://alphaselect-premier-p5fuz.ondigitalocean.app/api/v1/contract/ticker/%%s >NUL 2>&1
        if not errorlevel 1 (
            set /a success+=1
            echo [!total!/150] [OK] %%s - 已收集
        ) else (
            echo [!total!/150] [FAIL] %%s - 失敗
        )
        
        timeout /t 1 /nobreak >NUL
    )
)

echo.
echo ========================================
echo 收集完成！成功: !success!/!total!
echo ========================================
pause
