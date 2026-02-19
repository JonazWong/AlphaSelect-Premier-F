@echo off
chcp 65001 >nul
title AlphaSelect Premier F - 完全重啟
color 0D

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║        AlphaSelect Premier F - 完全重啟工具               ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM 檢測 Docker Compose 命令
set "COMPOSE_CMD=docker compose"
docker compose version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    set "COMPOSE_CMD=docker-compose"
)

echo 此操作將：
echo   1. 停止所有容器
echo   2. 重新啟動所有服務
echo   3. 應用最新配置
echo.
echo 這不會刪除數據，只是重新啟動服務。
echo.
pause

echo.
echo [1/3] 停止所有容器...
%COMPOSE_CMD% down
echo.

echo [2/3] 啟動所有服務（使用新配置）...
%COMPOSE_CMD% up -d
echo.

echo [3/3] 等待服務就緒（30 秒）...
timeout /t 30 /nobreak >nul
echo.

echo ═══════════════════════════════════════════════════════════
echo  檢查服務狀態:
echo ═══════════════════════════════════════════════════════════
%COMPOSE_CMD% ps
echo.

echo ═══════════════════════════════════════════════════════════
echo  檢查後端日誌:
echo ═══════════════════════════════════════════════════════════
%COMPOSE_CMD% logs --tail=20 backend
echo.

echo ═══════════════════════════════════════════════════════════
echo  測試服務連接:
echo ═══════════════════════════════════════════════════════════
echo.
echo 測試前端...
curl -s -o nul -w "前端 (3000): HTTP %%{http_code}\n" http://localhost:3000
echo.
echo 測試後端健康檢查...
curl -s http://localhost:8000/api/v1/health
echo.
echo.
echo ═══════════════════════════════════════════════════════════
echo  重啟完成！
echo ═══════════════════════════════════════════════════════════
echo.
echo 請訪問:
echo   - 前端網站: http://localhost:3000
echo   - API 文檔: http://localhost:8000/docs
echo   - 健康檢查: http://localhost:8000/api/v1/health
echo.
echo 如果後端仍然無法訪問，請查看上方的日誌輸出。
echo.
pause
