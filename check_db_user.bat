@echo off
chcp 65001 >nul
echo ========================================
echo   檢查資料庫用戶
echo ========================================
echo.

echo [1] 列出所有資料庫用戶...
docker exec alphaselect-premier-f-postgres-1 psql -U alpha_user -d postgres -c "\du"
echo.

echo [2] 檢查資料庫列表...
docker exec alphaselect-premier-f-postgres-1 psql -U alpha_user -d postgres -c "\l"
echo.

echo [3] 連接到 alpha_select 資料庫...
docker exec alphaselect-premier-f-postgres-1 psql -U alpha_user -d alpha_select -c "SELECT current_user, current_database();"
echo.

echo [4] 檢查表...
docker exec alphaselect-premier-f-postgres-1 psql -U alpha_user -d alpha_select -c "\dt"
echo.

pause
