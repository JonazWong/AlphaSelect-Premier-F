@echo off
chcp 65001 >nul
echo ========================================
echo   語法錯誤已修復！
echo ========================================
echo.

echo 清除瀏覽器快取並重新載入：
echo.
echo 1. 按 Ctrl + Shift + Delete
echo 2. 選擇「快取的圖片和檔案」
echo 3. 點擊「清除資料」
echo.
echo 或者直接：
echo 1. 按 Ctrl + Shift + R（強制重新整理）
echo 2. 或關閉所有 localhost:3000 標籤
echo 3. 重新打開 http://localhost:3000
echo.
echo ========================================
echo 如果還是無法載入，請重啟 Frontend：
echo ========================================
echo.

set /p restart="是否重啟 Frontend 容器？(Y/N): "
if /i "%restart%"=="Y" (
    echo.
    echo [1] 重啟 Frontend...
    docker-compose restart frontend
    echo.
    echo [2] 等待 15 秒...
    timeout /t 15 /nobreak >nul
    echo.
    echo [3] 檢查狀態...
    docker logs alphaselect-premier-f-frontend-1 --tail 20
    echo.
    echo ✅ 完成！請刷新瀏覽器
) else (
    echo.
    echo 請手動刷新瀏覽器（Ctrl + Shift + R）
)

echo.
pause
