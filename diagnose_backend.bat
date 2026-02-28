@echo off
chcp 65001 >nul
echo ====================================
echo   診斷 Backend 問題
echo ====================================
echo.

echo [1/5] 檢查 Docker 容器狀態...
docker compose ps backend
echo.

echo [2/5] 檢查端口佔用...
netstat -ano | findstr :8000
echo.

echo [3/5] 檢查 Backend 日誌 (最後50行)...
echo ─────────────────────────────────────
docker compose logs --tail=50 backend
echo ─────────────────────────────────────
echo.

echo [4/5] 檢查 PostgreSQL 連接...
docker compose exec -T postgres pg_isready -U alphaselect_user
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL 運行正常
) else (
    echo ❌ PostgreSQL 無法連接
)
echo.

echo [5/5] 檢查 Redis 連接...
docker compose exec -T redis redis-cli ping
if %errorlevel% equ 0 (
    echo ✅ Redis 運行正常
) else (
    echo ❌ Redis 無法連接
)
echo.

echo ====================================
echo   診斷完成
echo ====================================
echo.
echo 💡 常見問題:
echo    1. 如果看到 "ModuleNotFoundError" - 需要重新構建鏡像
echo       解決: docker compose build backend --no-cache
echo.
echo    2. 如果看到數據庫連接錯誤 - 等待數據庫啟動完成
echo       解決: 等待30秒後重試
echo.
echo    3. 如果看到語法錯誤 - Python 代碼有問題
echo       解決: 檢查錯誤訊息中提到的文件
echo.
echo    4. 如果容器不斷重啟 - 應用啟動失敗
echo       解決: 查看完整日誌 docker compose logs backend
echo.
pause
