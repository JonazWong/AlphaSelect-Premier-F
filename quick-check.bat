@echo off
chcp 65001 >nul
title 快速診斷
color 0B

REM 檢測 Docker Compose 命令
set "COMPOSE_CMD=docker compose"
docker compose version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    set "COMPOSE_CMD=docker-compose"
)

echo.
echo ═══════════════════════════════════════════════════════════
echo  當前狀態
echo ═══════════════════════════════════════════════════════════
%COMPOSE_CMD% ps
echo.

echo ═══════════════════════════════════════════════════════════
echo  後端最新日誌（最近 30 行）
echo ═══════════════════════════════════════════════════════════
%COMPOSE_CMD% logs --tail=30 backend
echo.

echo ═══════════════════════════════════════════════════════════
echo  連接測試
echo ═══════════════════════════════════════════════════════════
echo.
echo 測試後端健康檢查...
curl -v http://localhost:8000/api/v1/health 2>&1
echo.
echo ═══════════════════════════════════════════════════════════
echo.
pause
