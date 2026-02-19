@echo off
chcp 65001 >nul
title 後端日誌查看器
color 0E

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║              後端詳細日誌查看器                           ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM 檢測 Docker Compose 命令
set "COMPOSE_CMD=docker compose"
docker compose version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    set "COMPOSE_CMD=docker-compose"
)

echo 選擇查看方式:
echo.
echo   [1] 查看最近 100 行日誌
echo   [2] 實時跟蹤日誌（按 Ctrl+C 退出）
echo   [3] 查看所有日誌
echo   [4] 只顯示錯誤日誌
echo.
set /p choice="請選擇 (1-4): "

echo.
echo ═══════════════════════════════════════════════════════════

if "%choice%"=="1" (
    echo 【最近 100 行日誌】
    echo ═══════════════════════════════════════════════════════════
    %COMPOSE_CMD% logs --tail=100 backend
) else if "%choice%"=="2" (
    echo 【實時日誌 - 按 Ctrl+C 退出】
    echo ═══════════════════════════════════════════════════════════
    %COMPOSE_CMD% logs -f backend
) else if "%choice%"=="3" (
    echo 【所有日誌】
    echo ═══════════════════════════════════════════════════════════
    %COMPOSE_CMD% logs backend
) else if "%choice%"=="4" (
    echo 【錯誤日誌】
    echo ═══════════════════════════════════════════════════════════
    %COMPOSE_CMD% logs backend 2>&1 | findstr /I "error exception traceback fatal"
) else (
    echo 無效選擇
)

echo.
echo ═══════════════════════════════════════════════════════════
echo.
pause
