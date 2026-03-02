@echo off
chcp 65001 >nul
echo ====================================
echo   MEXC API 配置向導
echo ====================================
echo.

:: 檢查 .env 文件是否存在
if exist ".env" (
    echo ✅ 找到 .env 文件
    echo.
    echo 當前配置:
    echo ─────────────────────────────────────
    findstr /B "MEXC_" .env 2>nul
    if errorlevel 1 (
        echo ⚠️  未找到 MEXC 配置
    )
    echo ─────────────────────────────────────
    echo.
    echo 是否要重新配置 MEXC API？
    choice /C YN /M "輸入 Y 繼續，N 取消"
    if errorlevel 2 goto end
    echo.
) else (
    echo ⚠️  未找到 .env 文件
    echo 正在從 .env.example 創建...
    copy .env.example .env >nul 2>&1
    if errorlevel 1 (
        echo ❌ 創建失敗，請確保 .env.example 存在
        pause
        exit /b 1
    )
    echo ✅ 已創建 .env 文件
    echo.
)

echo ====================================
echo   MEXC API 密鑰配置
echo ====================================
echo.
echo 📖 獲取 MEXC API 密鑰:
echo    1. 訪問: https://www.mexc.com/user/openapi
echo    2. 登入您的 MEXC 帳號
echo    3. 創建新的 API Key
echo    4. 保存 API Key 和 Secret Key
echo.
echo 💡 注意:
echo    - 如果只需要行情數據，可以跳過此配置
echo    - 交易功能需要配置 API Key
echo.
pause
echo.

:: 輸入 API Key
echo ─────────────────────────────────────
echo 請輸入您的 MEXC API Key:
echo （直接按 Enter 跳過，使用公開 API）
echo ─────────────────────────────────────
set /p MEXC_API_KEY=API Key: 

if "%MEXC_API_KEY%"=="" (
    echo ⚠️  跳過 API Key 配置，將使用公開 API
    goto update_env
)

:: 輸入 Secret Key
echo.
echo ─────────────────────────────────────
echo 請輸入您的 MEXC Secret Key:
echo ─────────────────────────────────────
set /p MEXC_SECRET_KEY=Secret Key: 

if "%MEXC_SECRET_KEY%"=="" (
    echo ⚠️  Secret Key 為空，配置可能不完整
)

:update_env
echo.
echo 📝 更新 .env 文件...

:: 創建臨時文件
set "temp_file=.env.tmp"
if exist "%temp_file%" del "%temp_file%"

:: 讀取並更新 .env
setlocal enabledelayedexpansion
for /f "usebackq tokens=* delims=" %%a in (".env") do (
    set "line=%%a"
    
    :: 更新 MEXC_API_KEY
    echo !line! | findstr /B "MEXC_API_KEY=" >nul
    if !errorlevel! equ 0 (
        if not "%MEXC_API_KEY%"=="" (
            echo MEXC_API_KEY=%MEXC_API_KEY%>>"%temp_file%"
        ) else (
            echo !line!>>"%temp_file%"
        )
    ) else (
        :: 更新 MEXC_SECRET_KEY
        echo !line! | findstr /B "MEXC_SECRET_KEY=" >nul
        if !errorlevel! equ 0 (
            if not "%MEXC_SECRET_KEY%"=="" (
                echo MEXC_SECRET_KEY=%MEXC_SECRET_KEY%>>"%temp_file%"
            ) else (
                echo !line!>>"%temp_file%"
            )
        ) else (
            echo !line!>>"%temp_file%"
        )
    )
)
endlocal

:: 替換原文件
move /y "%temp_file%" ".env" >nul

echo ✅ .env 文件已更新
echo.

:: 顯示配置總結
echo ====================================
echo   配置總結
echo ====================================
echo.

if not "%MEXC_API_KEY%"=="" (
    set "key_preview=%MEXC_API_KEY:~0,8%..."
    set "secret_preview=***%MEXC_SECRET_KEY:~-4%"
    
    echo ✅ MEXC API 已配置
    echo    - API Key: !key_preview!
    echo    - Secret Key: !secret_preview!
    echo.
    echo 📡 可用功能:
    echo    ✅ 公開 API（行情數據、K線、資金費率等）
    echo    ✅ 私有 API（交易功能 - 如已啟用交易權限）
) else (
    echo ⚠️  MEXC API Key 未配置
    echo.
    echo 📡 可用功能:
    echo    ✅ 公開 API（行情數據、K線、資金費率等）
    echo    ❌ 私有 API（需要配置 API Key）
)

echo.
echo 🔧 其他配置選項（可選）:
echo    - BACKEND_PORT=8000 （後端端口）
echo    - FRONTEND_PORT=3000 （前端端口）
echo    - POSTGRES_PORT=5432 （數據庫端口）
echo    - REDIS_PORT=6379 （Redis 端口）
echo.
echo 💡 如需修改這些配置，請直接編輯 .env 文件
echo.

:test_config
echo ====================================
echo   測試配置
echo ====================================
echo.
echo 是否要測試 MEXC API 連接？
choice /C YN /M "輸入 Y 測試，N 跳過"
if errorlevel 2 goto restart_prompt

echo.
echo 📋 執行測試...
python test_mexc_api.py
echo.

:restart_prompt
echo ====================================
echo   重啟服務
echo ====================================
echo.
echo 配置已更新，需要重啟服務才能生效
echo.
echo 是否要重新啟動服務？
choice /C YN /M "輸入 Y 重啟，N 稍後手動重啟"
if errorlevel 2 goto manual_restart

echo.
echo 🔄 正在重啟服務...
call "一鍵停止腳本 stop.bat"
timeout /t 3 /nobreak >nul
call "一鍵啟動腳本 start.bat"
goto end

:manual_restart
echo.
echo 💡 稍後請手動重啟服務:
echo    1. 運行: 一鍵停止腳本 stop.bat
echo    2. 運行: 一鍵啟動腳本 start.bat
echo.

:end
echo ====================================
echo   配置完成
echo ====================================
echo.
echo 📚 相關文檔:
echo    - MEXC API 文檔: https://mexcdevelop.github.io/apidocs/
echo    - API 測試: test_mexc.bat
echo    - 查看配置: type .env
echo.
pause
