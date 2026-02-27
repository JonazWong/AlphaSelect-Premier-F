@echo off
chcp 65001 >nul
echo ========================================
echo   立即驗證修復
echo ========================================
echo.

echo [1] 檢查 Frontend 日誌（應該看到成功編譯）...
timeout /t 3 /nobreak >nul
docker logs alphaselect-premier-f-frontend-1 --tail 20 | findstr /C:"Compiled" /C:"Error" /C:"error"
echo.

echo [2] 如果看到 "Compiled successfully"，請：
echo    - 刷新瀏覽器（Ctrl + Shift + R）
echo    - 應該可以正常載入頁面
echo.

echo [3] 如果還有錯誤，重啟 Frontend...
set /p restart="需要重啟嗎？(Y/N): "
if /i "%restart%"=="Y" (
    docker-compose restart frontend
    echo 等待 20 秒...
    timeout /t 20 /nobreak >nul
    docker logs alphaselect-premier-f-frontend-1 --tail 30
)

echo.
echo ========================================
echo ✅ 修復完成！
echo 請開啟: http://localhost:3000/ai-training
echo ========================================
pause
