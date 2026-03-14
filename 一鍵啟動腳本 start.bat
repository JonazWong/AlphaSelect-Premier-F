@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
echo ====================================
echo   AlphaSelect Premier F - 啟動服務
echo ====================================
echo.
echo 用途: 啟動所有本地 Docker 服務
echo 使用: 雙擊執行，或在命令列輸入 start.bat
echo ====================================
echo.

:: 檢查 Docker Desktop
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Docker Desktop 未運行，嘗試啟動中...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo ⏳ 等待 Docker Desktop 啟動，請稍候...
    set /a wait_count=0
    :wait_docker
    timeout /t 5 /nobreak >nul
    set /a wait_count+=1
    docker info >nul 2>&1
    if %errorlevel% equ 0 goto docker_ready
    if !wait_count! lss 12 (
        echo    等待中... (!wait_count!/12，最多等待 60 秒^)
        goto wait_docker
    )
    echo ❌ Docker Desktop 啟動超時，請手動啟動後再執行此腳本
    pause
    exit /b 1
)
:docker_ready
echo ✅ Docker Desktop 已就緒

:: 停止舊容器
echo.
echo [1/3] 停止舊容器...
docker compose down >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  停止舊容器時出現警告（可忽略，繼續啟動）
)

:: 啟動服務
echo.
echo [2/3] 啟動所有服務...
docker compose up -d
if %errorlevel% neq 0 (
    echo.
    echo ❌ 啟動服務失敗！
    echo 💡 建議排查步驟:
    echo    1. 執行 docker compose config  檢查配置語法
    echo    2. 執行 docker compose logs    查看錯誤日誌
    echo    3. 執行 setup.bat              重新初始化環境
    pause
    exit /b 1
)

:: 等待數據庫和Redis啟動
echo.
echo [3/3] 等待服務初始化...
set /a wait_sec=0
:wait_init
timeout /t 3 /nobreak >nul
set /a wait_sec+=3
echo    已等待 %wait_sec% 秒（資料庫和 Redis 通常需要 15 秒）
if %wait_sec% lss 15 goto wait_init

:: 檢查服務狀態
echo.
echo ====================================
echo   服務狀態
echo ====================================
docker compose ps

:: 等待 Backend 啟動（最多嘗試12次，每次等待5秒）
echo.
echo 🧪 測試 Backend API...
set /a attempts=0
:backend_check
set /a attempts+=1
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend API 運行正常: http://localhost:8000
    goto backend_ok
)
if !attempts! lss 12 (
    echo    嘗試 !attempts!/12 - 等待 Backend 啟動... (已等待約 !attempts! * 5 秒)
    timeout /t 5 /nobreak >nul
    goto backend_check
)
echo ❌ Backend API 未響應（已等待約 60 秒）
echo 💡 請執行以下命令排查問題:
echo    docker compose logs backend --tail 50
echo    diagnose_backend.bat
:backend_ok

:: 測試 Frontend
echo.
echo 🧪 測試 Frontend...
set /a fe_attempts=0
:frontend_check
set /a fe_attempts+=1
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend 運行正常: http://localhost:3000
    goto frontend_ok
)
if !fe_attempts! lss 6 (
    echo    等待 Frontend 構建中... (!fe_attempts!/6)
    timeout /t 5 /nobreak >nul
    goto frontend_check
)
echo ⚠️  Frontend 尚未響應（可能還在構建中，請稍後訪問）
echo    執行: docker compose logs frontend --tail 30  查看構建進度
:frontend_ok

echo.
echo ====================================
echo   ✅ 服務啟動完成！
echo ====================================
echo.
echo 📊 訪問應用:
echo    Frontend:   http://localhost:3000
echo    Backend API: http://localhost:8000
echo    API Docs:   http://localhost:8000/docs
echo.
echo 📝 查看日誌:
echo    docker compose logs -f backend
echo    docker compose logs -f frontend
echo.
echo 🔧 診斷工具:
echo    diagnose_backend.bat   - 診斷後端問題
echo    rebuild_backend.bat    - 重建後端
echo    rebuild_frontend.bat   - 重建前端
echo.
echo 🛑 停止服務:
echo    stop.bat
echo.
pause