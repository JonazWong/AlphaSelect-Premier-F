@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
echo ====================================
echo   重新構建並重啟 Backend
echo ====================================
echo.
echo 用途: 重新構建 Backend Docker 映像（用於修復依賴或代碼問題後）
echo 使用: 雙擊執行，或在命令列輸入 rebuild_backend.bat
echo.
echo 提示:
echo   若構建失敗，腳本會詢問是否立即顯示 Backend 近期執行日誌
echo ====================================
echo.
echo ⚠️  此操作將重新構建 Backend Docker 映像，請確認已儲存相關設定
echo.
pause

echo [1/5] 停止 Backend...
docker compose stop backend
echo.

echo [2/5] 重新構建 Backend 映像（--no-cache）...
docker compose build backend --no-cache
if %errorlevel% neq 0 (
    echo.
    echo ❌ Backend 構建失敗！
    echo 💡 排查建議:
    echo    1. 查看上方的錯誤訊息（pip install / requirements 問題最常見）
    echo    2. 確認 backend/requirements.txt 內容是否正確
    echo    3. 確認 backend/Dockerfile 語法無誤
    echo    4. 執行: docker compose logs backend --tail 80  查看 Backend 容器近期執行日誌
    echo.
    set /p show_logs="是否立即顯示 Backend 近期執行日誌？(y/n): "
    if /i "!show_logs!"=="y" docker compose logs backend --tail 80
    pause
    exit /b 1
)
echo ✅ Backend 映像構建成功
echo.

echo [3/5] 啟動 Backend...
docker compose up -d backend
if %errorlevel% neq 0 (
    echo ❌ 啟動 Backend 容器失敗
    echo    執行: docker compose logs backend  查看詳細錯誤
    pause
    exit /b 1
)
echo.

echo [4/5] 等待 Backend 啟動...
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
if !attempts! lss 12 (
    echo    嘗試 !attempts!/12 - 等待啟動...（每次等待 5 秒）
    timeout /t 5 /nobreak >nul
    goto check
)
echo ❌ Backend 啟動超時（已等待約 60 秒）
echo 💡 查看錯誤日誌:
echo    docker compose logs backend --tail 50

:end
echo.
echo [5/5] 顯示最新 Backend 日誌...
docker compose logs backend --tail 20
echo.
echo ====================================
echo 如需查看完整日誌，執行:
echo    docker compose logs backend -f
echo ====================================
echo.
pause
