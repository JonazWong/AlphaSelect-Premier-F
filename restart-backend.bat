@echo off
chcp 65001 >nul
title AlphaSelect Premier F - 重啟服務
color 0E

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║          AlphaSelect Premier F - 重啟服務工具             ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM 檢測 Docker Compose 命令
set "COMPOSE_CMD=docker compose"
docker compose version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    set "COMPOSE_CMD=docker-compose"
)

echo 正在重啟後端服務...
echo.
%COMPOSE_CMD% restart backend

echo.
echo 等待 5 秒讓服務啟動...
timeout /t 5 /nobreak >nul

echo.
echo ═══════════════════════════════════════════════════════════
echo  檢查後端日誌:
echo ═══════════════════════════════════════════════════════════
%COMPOSE_CMD% logs --tail=20 backend

echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo 測試後端連接...
curl -s http://localhost:8000/api/v1/health
echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo 重啟完成！
echo.
echo 訪問以下網址測試:
echo   - 前端: http://localhost:3000
echo   - API 文檔: http://localhost:8000/docs
echo   - 健康檢查: http://localhost:8000/api/v1/health
echo.
pause
