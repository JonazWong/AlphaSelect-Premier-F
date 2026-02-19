@echo off
chcp 65001 >nul
title AlphaSelect Premier F - 一鍵停止
color 0C

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║     AlphaSelect Premier F - MEXC AI Trading Platform      ║
echo ║                   一鍵停止工具                            ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo.

echo.
echo 您想要如何停止服務？
echo.
echo   [1] 僅停止本專案服務（保留數據）
echo   [2] 停止本專案並刪除所有數據（完全清理）
echo   [3] 先查看本專案的容器
echo   [4] 取消
echo.
echo 💡 說明: 所有操作只影響 AlphaSelect Premier F 專案
echo          不會影響您的其他 Docker 專案！
echo.

set /p choice="請選擇 (1-4): "

if "%choice%"=="1" goto stop_only
if "%choice%"=="2" goto stop_and_clean
if "%choice%"=="3" goto show_containers
if "%choice%"=="4" goto cancel
goto invalid

:show_containers
echo.
echo ═══本專案的所有服務...
echo ═══════════════════════════════════════════════════════════
echo.
echo (只停止 AlphaSelect Premier F，不影響其他專案)
echo.

docker compose down

if %ERRORLEVEL% EQU 0 (
    color 0A
    echo.
    echo ✓ 本專案的所有服務已停止
    echo.
    echo 數據已保留，下次啟動時會恢復。
    echo 其他 Docker 專案不受影響！
) else (
    echo.
    echo 操作已取消
    goto end
)

:stop_only
echo.
echo ═══════════════════════════════════════════════════════════
echo  停止所有服務...
echo ═══════════════════════════════════════════════════════════
echo.

docker compose down

if %ERRORLEVEL% EQU 0 (
    color 0A
    echo.
    echo ✓ 所有服務已停止
    echo.
    echo 數據已保留，下次啟動時會恢復。
    echo.
    echo 要重新啟動，請執行: start.bat
    echo 或運行命令: docker compose up -d
) else (
    echo.
    echo ✗ 停止服務時發生錯誤
    echo.
    echo 請檢查 Docker Desktop 是否正在運行
)
goto end
本專案的所有數據！
echo.
echo 將會刪除:
echo   - 本專案的所有數據庫數據
echo   - 本專案的所有 Redis 緩存
echo   - 本專案的所有容器和卷
echo.
echo 💡 說明: 只影響 AlphaSelect Premier F 專案
echo          其他專案的數據完全不受影響！
echo.
set /p confirm="確定要繼續嗎？(yes/no): "

if not "%confirm%"=="yes" (
    echo.
    echo 操作已取消
    goto end
)

echo.
echo ═══════════════════════════════════════════════════════════
echo  停止服務並清理本專案的數據...
echo ═══════════════════════════════════════════════════════════
echo.

docker compose down -v

if %ERRORLEVEL% EQU 0 (
    color 0A
    echo.
    echo ✓ 本專案的所有服務已停止，數據已清理
    echo.
    echo 下次啟動時會重新初始化所有數據。
    echo 其他 Docker 專案不受影響！
    echo ✓ 所有服務已停止，數據已清理
    echo.
    echo 下次啟動時會重新初始化所有數據。
    echo.
    echo 要重新啟動，請執行: start.bat
) else (
    echo.
    echo ✗ 清理時發生錯誤
    echo.
    echo 請檢查 Docker Desktop 是否正在運行
)
goto end

:cancel
echo.
echo 操作已取消
goto end

:invalid
echo.
echo ✗ 無效的選擇
goto end

:end
echo.
echo ═══════════════════════════════════════════════════════════
echo.
pause
