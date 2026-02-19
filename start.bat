@echo off
chcp 65001 >nul
title AlphaSelect Premier F - 一鍵啟動
color 0A

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║     AlphaSelect Premier F - MEXC AI Trading Platform      ║
echo ║                   一鍵啟動工具                            ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo.

REM 檢查 Docker 是否安裝
echo [1/6] 檢查 Docker 環境...
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo ✗ 錯誤: Docker 未安裝或未啟動！
    echo.
    echo 請先完成以下步驟:
    echo   1. 安裝 Docker Desktop
    echo   2. 啟動 Docker Desktop
    echo   3. 確認小鯨魚圖標顯示為綠色
    echo.
    echo 下載地址: https://www.docker.com/products/docker-desktop/
    echo.
    pause
    exit /b 1
)
echo ✓ Docker 環境正常

REM 檢測使用哪個版本的 Docker Compose
set "COMPOSE_CMD=docker compose"
docker compose version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    set "COMPOSE_CMD=docker-compose"
    docker-compose --version >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        color 0C
        echo.
        echo ✗ 錯誤: Docker Compose 未安裝！
        echo.
        echo 請確保 Docker Desktop 包含 Docker Compose
        echo.
        pause
        exit /b 1
    )
)
echo ✓ 使用命令: %COMPOSE_CMD%
echo.

REM 檢查配置文件
echo [2/6] 檢查配置文件...

if not exist "backend\.env" (
    echo.
    echo ⚠ 警告: 後端配置文件不存在！
    echo.
    echo 正在自動創建配置文件...
    copy "backend\.env.example" "backend\.env" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo ✓ 已創建 backend\.env
        echo.
        echo ⚠ 重要: 請編輯 backend\.env 並修改以下內容:
        echo    - SECRET_KEY（必須修改！）
        echo    - DB_PASSWORD（建議修改）
        echo    - MEXC_API_KEY（可選）
        echo    - MEXC_SECRET_KEY（可選）
        echo.
        echo 按任意鍵打開配置文件進行編輯...
        pause >nul
        notepad "backend\.env"
        echo.
        echo 修改完成後，請保存並關閉記事本，然後按任意鍵繼續...
        pause >nul
    ) else (
        echo ✗ 無法創建配置文件
        pause
        exit /b 1
    )
) else (
    echo ✓ 後端配置文件存在
)

if not exist "frontend\.env.local" (
    echo.
    echo 正在創建前端配置文件...
    copy "frontend\.env.example" "frontend\.env.local" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo ✓ 已創建 frontend\.env.local
    )
) else (
    echo ✓ 前端配置文件存在
)
echo.

REM 檢查端口占用
echo [3/6] 檢查端口占用情況...
echo.

setlocal enabledelayedexpansion
set "PORT_OCCUPIED=0"

netstat -ano | findstr ":3000 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ⚠ 端口 3000 ^(前端^) 已被占用
    set "PORT_OCCUPIED=1"
)

netstat -ano | findstr ":8000 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ⚠ 端口 8000 ^(後端^) 已被占用
    set "PORT_OCCUPIED=1"
)

netstat -ano | findstr ":5433 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ⚠ 端口 5433 ^(PostgreSQL - 本專案^) 已被占用
    set "PORT_OCCUPIED=1"
)

netstat -ano | findstr ":6380 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ⚠ 端口 6380 ^(Redis - 本專案^) 已被占用
    set "PORT_OCCUPIED=1"
)

if "!PORT_OCCUPIED!"=="1" (
    echo.
    echo ⚠ 發現端口被占用！
    echo.
    echo 💡 重要說明:
    echo    - 如果是此專案的舊容器: 可以安全清理
    echo    - 如果是其他專案占用: 請選擇手動處理
    echo.
    echo 您想要如何處理？
    echo   [1] 只清理這個專案的容器 ^(安全，推薦^)
    echo   [2] 手動處理後再啟動
    echo   [3] 查看占用端口的程式
    echo   [4] 取消啟動
    echo.
    set /p port_choice="請選擇 (1-4): "
    
    if "!port_choice!"=="1" (
        echo.
        echo 正在停止 AlphaSelect Premier F 專案的容器...
        echo ^(只會停止本專案，不影響其他 Docker 容器^)
        %COMPOSE_CMD% down 2>&1
        echo.
        echo ✓ 本專案的容器已清理
        timeout /t 3 /nobreak >nul
    ) else if "!port_choice!"=="2" (
        echo.
        echo 請手動停止占用端口的程式，然後重新運行此腳本。
        echo.
        pause
        exit /b 0
    ) else if "!port_choice!"=="3" (
        echo.
        echo 占用端口的程式列表:
        echo.
        echo --- 端口 3000 ---
        netstat -ano | findstr ":3000 " | findstr "LISTENING"
        echo.
        echo --- 端口 8000 ---
        netstat -ano | findstr ":8000 " | findstr "LISTENING"
        echo.
        echo --- 端口 5433 ---
        netstat -ano | findstr ":5433 " | findstr "LISTENING"
        echo.
        echo --- 端口 6380 ---
        netstat -ano | findstr ":6380 " | findstr "LISTENING"
        echo.
        echo 您可以在任務管理器中根據 PID 結束這些程式
        echo 或運行 check-ports.bat 查看詳細信息
        echo.
        pause
        exit /b 0
    ) else (
        echo.
        echo 已取消啟動
        pause
        exit /b 0
    )
) else (
    echo ✓ 所有端口都可用
)
echo.
endlocal

REM 停止現有容器（如果有）
echo [4/6] 清理本專案的舊容器...
echo ^(只清理 AlphaSelect Premier F，不影響其他專案^)
%COMPOSE_CMD% down >nul 2>&1
echo ✓ 清理完成
echo.

REM 啟動所有服務
echo [5/6] 正在啟動所有服務...
echo.
echo 這可能需要幾分鐘時間，首次啟動會下載所需的映像檔...
echo 請耐心等待...
echo.

%COMPOSE_CMD% up -d

if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo ✗ 啟動失敗！
    echo.
    echo 請檢查以下事項:
    echo   1. Docker Desktop 是否正在運行
    echo   2. 查看詳細錯誤: %COMPOSE_CMD% logs
    echo.
    echo 嘗試查看錯誤訊息...
    echo.
    %COMPOSE_CMD% logs --tail=20
    echo.
    pause
    exit /b 1
)

echo.
echo ✓ 所有服務已啟動
echo.

REM 等待服務就緒
echo [6/6] 等待服務就緒...
echo.
echo 正在等待數據庫初始化（約30秒）...

timeout /t 30 /nobreak >nul

echo.
echo ✓ 服務應該已經就緒
echo.

REM 顯示狀態
echo.
echo ═══════════════════════════════════════════════════════════
echo  當前服務狀態:
echo ═══════════════════════════════════════════════════════════
echo.
%COMPOSE_CMD% ps
echo.

REM 測試連接
echo ═══════════════════════════════════════════════════════════
echo  測試服務連接:
echo ═══════════════════════════════════════════════════════════
echo.

echo 測試後端 API...
timeout /t 5 /nobreak >nul
curl -s http://localhost:8000/api/v1/health >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✓ 後端 API 正常運行
) else (
    echo ⚠ 後端 API 尚未就緒，可能需要更多時間
)

echo 測試前端網站...
curl -s http://localhost:3000 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✓ 前端網站正常運行
) else (
    echo ⚠ 前端網站尚未就緒，可能需要更多時間
)

echo.
echo ═══════════════════════════════════════════════════════════
echo  🎉 啟動完成！
echo ═══════════════════════════════════════════════════════════
echo.
echo 您現在可以訪問:
echo.
echo   📱 前端網站:
echo      http://localhost:3000
echo.
echo   🔧 API 文檔:
echo      http://localhost:8000/docs
echo.
echo   💚 健康檢查:
echo      http://localhost:8000/api/v1/health
echo.
echo 💡 端口配置:
echo    PostgreSQL: 5433 ^(避免與其他專案的 5432 衝突^)
echo    Redis: 6380 ^(避免與其他專案的 6379 衝突^)
echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo 🔍 常用命令:
echo.
echo   查看日誌:     %COMPOSE_CMD% logs -f
echo   停止服務:     stop.bat 或 %COMPOSE_CMD% down
echo   重啟服務:     %COMPOSE_CMD% restart
echo   查看狀態:     %COMPOSE_CMD% ps
echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo 按任意鍵打開前端網站...
pause >nul

REM 在默認瀏覽器中打開前端
start http://localhost:3000

echo.
echo 前端網站已在瀏覽器中打開！
echo.
echo 祝您使用愉快！ 🚀
echo.
pause
