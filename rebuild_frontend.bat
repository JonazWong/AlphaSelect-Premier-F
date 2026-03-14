@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
echo ========================================
echo   重建 Frontend（修復錯誤）
echo ========================================
echo.
echo 用途: 重新構建並啟動 Frontend 容器
echo 使用: 雙擊執行，或在命令列輸入 rebuild_frontend.bat
echo ========================================
echo.

echo [1/5] 停止 Frontend 容器...
docker compose stop frontend
echo.

echo [2/5] 重建 Frontend 映像...
docker compose build frontend --no-cache
if %errorlevel% neq 0 (
    echo.
    echo ❌ Frontend 構建失敗！
    echo 💡 排查建議:
    echo    1. 查看上方錯誤訊息，確認 Node.js / npm 安裝問題
    echo    2. 執行: docker compose logs frontend --tail 50
    echo    3. 確認 frontend/package.json 中的依賴是否正確
    echo    4. 嘗試刪除 frontend/.next 和 frontend/node_modules 後重試
    pause
    exit /b 1
)
echo ✅ Frontend 構建成功
echo.

echo [3/5] 啟動 Frontend...
docker compose up -d frontend
if %errorlevel% neq 0 (
    echo ❌ 啟動 Frontend 容器失敗
    echo    執行: docker compose logs frontend  查看詳細錯誤
    pause
    exit /b 1
)
echo.

echo [4/5] 等待 Frontend 啟動...
set /a attempts=0
:wait_frontend
set /a attempts+=1
timeout /t 5 /nobreak >nul
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend 已就緒
    goto frontend_ready
)
if !attempts! lss 8 (
    echo    等待中... (!attempts!/8，Next.js 首次構建可能需要較長時間)
    goto wait_frontend
)
echo ⚠️  Frontend 尚未響應（可能仍在構建中，請稍後再試）

:frontend_ready
echo.
echo [5/5] 健康檢查...
docker compose ps --filter name=frontend
echo.
echo 最新 Frontend 日誌:
docker compose logs frontend --tail 20
echo.

echo ========================================
echo ✅ Frontend 重建完成
echo    訪問: http://localhost:3000
echo    若頁面異常請按 Ctrl+Shift+R 強制刷新瀏覽器快取
echo ========================================
pause
