@echo off
chcp 65001 >nul
title 重啟前端容器
color 0A

echo.
echo ══════════════════════════════════════════════════════════
echo  重啟前端容器以應用樣式更新
echo ══════════════════════════════════════════════════════════
echo.

REM 檢測 Docker Compose 命令
set "COMPOSE_CMD=docker compose"
docker compose version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    set "COMPOSE_CMD=docker-compose"
)

echo 正在重啟前端容器...
%COMPOSE_CMD% restart frontend

echo.
echo ✓ 前端容器已重啟
echo.
echo 等待 10 秒讓服務啟動...
timeout /t 10 /nobreak >nul

echo.
echo ══════════════════════════════════════════════════════════
echo  完成！
echo ══════════════════════════════════════════════════════════
echo.
echo 請執行以下步驟:
echo.
echo 1. 訪問 http://localhost:3000/market-screener
echo 2. 按 Ctrl + Shift + R 強制重新整理
echo 3. 在搜索框中輸入文字（例如: BTC）
echo 4. 現在應該看到白色的文字了！
echo.
echo 按任意鍵開啟頁面...
pause >nul

start http://localhost:3000/market-screener

echo.
echo 頁面已開啟！請記得按 Ctrl + Shift + R 清除緩存
echo.
pause
