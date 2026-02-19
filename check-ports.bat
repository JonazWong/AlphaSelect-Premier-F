@echo off
chcp 65001 >nul
title 端口檢查工具
color 0E

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║            AlphaSelect Premier F - 端口檢查工具            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 檢查哪些程式正在使用本專案需要的端口...
echo.

echo ═══════════════════════════════════════════════════════════
echo  端口 3000 (前端)
echo ═══════════════════════════════════════════════════════════
netstat -ano | findstr ":3000 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo 狀態: ⚠ 被占用
    echo.
    netstat -ano | findstr ":3000 " | findstr "LISTENING"
    echo.
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 " ^| findstr "LISTENING"') do (
        echo PID: %%a
        tasklist /FI "PID eq %%a" /FO TABLE /NH
    )
) else (
    echo 狀態: ✓ 可用
)
echo.

echo ═══════════════════════════════════════════════════════════
echo  端口 8000 (後端)
echo ═══════════════════════════════════════════════════════════
netstat -ano | findstr ":8000 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo 狀態: ⚠ 被占用
    echo.
    netstat -ano | findstr ":8000 " | findstr "LISTENING"
    echo.
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 " ^| findstr "LISTENING"') do (
        echo PID: %%a
        tasklist /FI "PID eq %%a" /FO TABLE /NH
    )
) else (
    echo 狀態: ✓ 可用
)
echo.

echo ═══════════════════════════════════════════════════════════
echo  端口 5433 (PostgreSQL - 本專案使用)
echo ═══════════════════════════════════════════════════════════
netstat -ano | findstr ":5433 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo 狀態: ⚠ 被占用
    echo.
    netstat -ano | findstr ":5433 " | findstr "LISTENING"
    echo.
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5433 " ^| findstr "LISTENING"') do (
        echo PID: %%a
        tasklist /FI "PID eq %%a" /FO TABLE /NH
    )
) else (
    echo 狀態: ✓ 可用
)
echo.

echo ═══════════════════════════════════════════════════════════
echo  端口 6380 (Redis - 本專案使用)
echo ═══════════════════════════════════════════════════════════
netstat -ano | findstr ":6380 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo 狀態: ⚠ 被占用
    echo.
    netstat -ano | findstr ":6380 " | findstr "LISTENING"
    echo.
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":6380 " ^| findstr "LISTENING"') do (
        echo PID: %%a
        tasklist /FI "PID eq %%a" /FO TABLE /NH
    )
) else (
    echo 狀態: ✓ 可用
)
echo.

echo ═══════════════════════════════════════════════════════════
echo  參考：其他專案的端口
echo ═══════════════════════════════════════════════════════════
echo.
echo 檢查 5432 (PostgreSQL 標準端口):
netstat -ano | findstr ":5432 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   ⚠ 端口 5432 被其他專案占用 (這是正常的)
) else (
    echo   ✓ 端口 5432 可用
)

echo.
echo 檢查 6379 (Redis 標準端口):
netstat -ano | findstr ":6379 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   ⚠ 端口 6379 被其他專案占用 (這是正常的)
) else (
    echo   ✓ 端口 6379 可用
)
echo.

echo ═══════════════════════════════════════════════════════════
echo  Docker 容器狀態
echo ═══════════════════════════════════════════════════════════
echo.
echo 當前運行的 Docker 容器:
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>nul
echo.

echo ═══════════════════════════════════════════════════════════
echo  本專案的容器
echo ═══════════════════════════════════════════════════════════
docker ps --filter "name=alphaselect" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo 本專案沒有運行中的容器
)
echo.

echo ═══════════════════════════════════════════════════════════
echo  建議操作
echo ═══════════════════════════════════════════════════════════
echo.
echo 💡 本專案已配置為使用以下端口:
echo    - 前端: 3000
echo    - 後端: 8000
echo    - PostgreSQL: 5433 (避免與其他專案的 5432 衝突)
echo    - Redis: 6380 (避免與其他專案的 6379 衝突)
echo.
echo 如果端口被占用:
echo   1. 如果是本專案的容器 → 執行 stop.bat 停止
echo   2. 如果是其他 Docker 專案 → 正常，可以同時運行
echo   3. 如果是其他程式 → 在任務管理器中結束該程式
echo.
echo 詳細說明請看: PORT_CHANGES.md
echo.
echo ═══════════════════════════════════════════════════════════
echo.
pause
