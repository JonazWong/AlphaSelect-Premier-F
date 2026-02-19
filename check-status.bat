@echo off
chcp 65001 >nul
title AlphaSelect Premier F - 狀態檢查
color 0B

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║          AlphaSelect Premier F - 狀態診斷工具             ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM 檢測 Docker Compose 命令
set "COMPOSE_CMD=docker compose"
docker compose version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    set "COMPOSE_CMD=docker-compose"
)

echo [1/5] 檢查容器運行狀態...
echo.
echo ═══════════════════════════════════════════════════════════
%COMPOSE_CMD% ps
echo ═══════════════════════════════════════════════════════════
echo.

echo [2/5] 檢查後端日誌（最近 50 行）...
echo.
echo ═══════════════════════════════════════════════════════════
echo 【後端 Backend】
echo ═══════════════════════════════════════════════════════════
%COMPOSE_CMD% logs --tail=50 backend
echo.

echo [3/5] 檢查前端日誌（最近 30 行）...
echo.
echo ═══════════════════════════════════════════════════════════
echo 【前端 Frontend】
echo ═══════════════════════════════════════════════════════════
%COMPOSE_CMD% logs --tail=30 frontend
echo.

echo [4/5] 檢查數據庫日誌（最近 30 行）...
echo.
echo ═══════════════════════════════════════════════════════════
echo 【數據庫 PostgreSQL】
echo ═══════════════════════════════════════════════════════════
%COMPOSE_CMD% logs --tail=30 postgres
echo.

echo [5/5] 測試端口連接...
echo.
echo ═══════════════════════════════════════════════════════════
echo 測試前端（3000）...
curl -s -o nul -w "HTTP 狀態碼: %%{http_code}\n" http://localhost:3000 2>nul || echo 無法連接
echo.
echo 測試後端（8000）...
curl -s -o nul -w "HTTP 狀態碼: %%{http_code}\n" http://localhost:8000 2>nul || echo 無法連接
echo.
echo 測試健康檢查...
curl -s -w "HTTP 狀態碼: %%{http_code}\n" http://localhost:8000/api/v1/health 2>nul || echo 無法連接
echo ═══════════════════════════════════════════════════════════
echo.

echo.
echo ═══════════════════════════════════════════════════════════
echo  診斷完成！
echo ═══════════════════════════════════════════════════════════
echo.
echo 💡 常見問題排查:
echo.
echo   問題 1: 容器未運行
echo   ├─ 現象: docker compose ps 顯示 Exited 或沒有容器
echo   └─ 解決: 查看上方日誌中的錯誤訊息
echo.
echo   問題 2: 後端啟動失敗
echo   ├─ 現象: ERR_EMPTY_RESPONSE
echo   ├─ 可能原因: 配置文件錯誤、依賴問題、數據庫連接失敗
echo   └─ 解決: 檢查後端日誌中的 ERROR 訊息
echo.
echo   問題 3: 數據庫未就緒
echo   ├─ 現象: 後端日誌顯示連接數據庫失敗
echo   └─ 解決: 等待 30 秒後重試，或執行 docker compose restart backend
echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo 按任意鍵退出...
pause >nul
