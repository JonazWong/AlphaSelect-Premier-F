@echo off
chcp 65001 >nul
echo ========================================
echo   檢查資料庫用戶
echo ========================================
echo.

echo [1] 列出所有資料庫用戶...
docker compose exec -T postgres psql -U alphaselect_user -d postgres -c "\du"
echo.

echo [2] 檢查資料庫列表...
docker compose exec -T postgres psql -U alphaselect_user -d postgres -c "\l"
echo.

echo [3] 連接到 alphaselect 資料庫...
docker compose exec -T postgres psql -U alphaselect_user -d alphaselect -c "SELECT current_user, current_database();"
echo.

echo [4] 檢查表...
docker compose exec -T postgres psql -U alphaselect_user -d alphaselect -c "\dt"
echo.

pause
