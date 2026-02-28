@echo off
chcp 65001 >nul
echo ====================================
echo   重新構建並重啟 Backend
echo ====================================
echo.
echo ⚠️  這將重新構建 Backend Docker 鏡像
echo    （用於修復依賴或代碼問題後）
echo.
pause

echo [1/4] 停止 Backend...
docker compose stop backend
echo.

echo [2/4] 重新構建 Backend 鏡像...
docker compose build backend --no-cache
echo.

echo [3/4] 啟動 Backend...
docker compose up -d backend
echo.

echo [4/4] 等待 Backend 啟動...
timeout /t 5 /nobreak >nul

:: 嘗試連接
set /a attempts=0
:check
set /a attempts+=1
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend 重新構建並啟動成功！
    echo    訪問: http://localhost:8000
    echo    文檔: http://localhost:8000/docs
    goto end
)
if %attempts% lss 10 (
    echo    嘗試 %attempts%/10 - 等待啟動...
    timeout /t 3 /nobreak >nul
    goto check
)
echo ❌ Backend 啟動失敗
echo.
echo 💡 查看錯誤:
echo    docker compose logs backend
:end
echo.
pause
