@echo off
chcp 65001 >nul
echo ====================================
echo   AlphaSelect Premier F - 啟動服務
echo ====================================
echo.

:: 檢查 Docker Desktop
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Desktop 未運行
    echo 正在啟動 Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo ⏳ 等待 Docker Desktop 啟動（30秒）...
    timeout /t 30 /nobreak >nul
)

:: 停止舊容器
echo [1/3] 停止舊容器...
docker compose down >nul 2>&1

:: 啟動服務
echo.
echo [2/3] 啟動服務...
docker compose up -d

:: 等待數據庫和Redis啟動
echo.
echo [3/3] 等待數據庫啟動...
timeout /t 15 /nobreak >nul

:: 檢查服務狀態
echo.
echo ====================================
echo   服務狀態
echo ====================================
docker compose ps

:: 等待 Backend 啟動（最多嘗試10次，每次等待3秒）
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
if %attempts% lss 10 (
    echo    嘗試 %attempts%/10 - 等待 Backend 啟動...
    timeout /t 3 /nobreak >nul
    goto backend_check
)
echo ❌ Backend API 未響應，請運行 diagnose_backend.bat 檢查問題
:backend_ok

:: 測試 Frontend
echo.
echo 🧪 測試 Frontend...
timeout /t 5 /nobreak >nul
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend 運行正常: http://localhost:3000
) else (
    echo ⚠️  Frontend 未響應（可能還在構建中）
    echo    請稍後訪問 http://localhost:3000
)

echo.
echo ====================================
echo   ✅ 服務啟動完成！
echo ====================================
echo.
echo 📊 訪問應用:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:8000
echo    API Docs: http://localhost:8000/docs
echo.
echo 📝 查看日誌:
echo    docker compose logs -f backend
echo    docker compose logs -f frontend
echo.
echo 🔧 診斷工具:
echo    diagnose_backend.bat - 診斷後端問題
echo    view_backend_logs.bat - 查看後端日誌
echo.
echo 🛑 停止服務:
echo    stop.bat
echo.
pause