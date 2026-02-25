@echo off
chcp 65001 >nul
echo ====================================
echo   重啟 Backend 服務
echo ====================================
echo.

echo [1/3] 停止 Backend 容器...
docker-compose stop backend
echo.

echo [2/3] 重新啟動 Backend...
docker-compose up -d backend
echo.

echo [3/3] 等待 Backend 啟動...
timeout /t 5 /nobreak >nul

:: 嘗試連接
set /a attempts=0
:check
set /a attempts+=1
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend 重啟成功！
    echo    訪問: http://localhost:8000
    echo    文檔: http://localhost:8000/docs
    goto end
)
if %attempts% lss 10 (
    echo    嘗試 %attempts%/10 - 等待啟動...
    timeout /t 3 /nobreak >nul
    goto check
)
echo ❌ Backend 重啟失敗
echo.
echo 💡 查看錯誤:
echo    docker-compose logs backend
:end
echo.
pause
