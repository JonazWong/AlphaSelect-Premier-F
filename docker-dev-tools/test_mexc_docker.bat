@echo off
chcp 65001 >nul
echo ====================================
echo   在 Docker 容器中測試 MEXC API
echo ====================================
echo.

:: 檢查 Backend 容器是否運行
docker-compose ps backend | findstr "Up" >nul
if %errorlevel% neq 0 (
    echo ❌ Backend 容器未運行
    echo.
    echo 請先啟動服務：
    echo    一鍵啟動腳本 start.bat
    echo.
    pause
    exit /b 1
)

echo ✅ Backend 容器正在運行
echo.

echo 📋 在容器中執行測試...
echo ─────────────────────────────────────
echo.

echo [1/3] 測試配置導入...
docker-compose exec -T backend python -c "from app.core.config import settings; print('✅ 配置OK:', settings.MEXC_CONTRACT_BASE_URL)"

echo.
echo [2/3] 測試 MEXC API 客戶端...
docker-compose exec -T backend python -c "from app.core.mexc.contract import mexc_contract_api; print('✅ MEXC API 客戶端OK')"

echo.
echo [3/3] 測試 FastAPI 應用...
docker-compose exec -T backend python -c "from app.main import app; print('✅ FastAPI 應用OK')"

echo.
echo ─────────────────────────────────────
echo.

if %errorlevel% equ 0 (
    echo ✅ 容器測試通過！
    echo.
    echo 💡 說明:
    echo    Docker 容器中的環境是正常的
    echo.
    echo 📡 測試 API 端點:
    echo    curl http://localhost:8000/api/v1/contract/tickers
    echo.
    echo 📖 查看 API 文檔:
    echo    http://localhost:8000/docs
) else (
    echo ❌ 容器測試失敗
    echo.
    echo 💡 診斷步驟:
    echo    1. 查看日誌: view_backend_logs.bat
    echo    2. 重建鏡像: rebuild_backend.bat
    echo    3. 完整診斷: diagnose_backend.bat
)

echo.
pause
