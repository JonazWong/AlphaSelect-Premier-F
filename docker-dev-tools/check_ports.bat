@echo off
chcp 65001 >nul
echo ====================================
echo   端口檢查工具
echo ====================================
echo.

:: 檢查端口是否被占用
echo 檢查常用端口...
echo.

:: 檢查 5432
netstat -ano | findstr ":5432" >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ 端口 5432 已被占用
    netstat -ano | findstr ":5432"
) else (
    echo ✅ 端口 5432 可用
)

:: 檢查 5433
netstat -ano | findstr ":5433" >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ 端口 5433 已被占用
    netstat -ano | findstr ":5433"
) else (
    echo ✅ 端口 5433 可用
)

:: 檢查 6379
netstat -ano | findstr ":6379" >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ 端口 6379 已被占用
    netstat -ano | findstr ":6379"
) else (
    echo ✅ 端口 6379 可用
)

:: 檢查 6380
netstat -ano | findstr ":6380" >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ 端口 6380 已被占用
    netstat -ano | findstr ":6380"
) else (
    echo ✅ 端口 6380 可用
)

:: 檢查 8000
netstat -ano | findstr ":8000" >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ 端口 8000 已被占用
    netstat -ano | findstr ":8000"
) else (
    echo ✅ 端口 8000 可用
)

:: 檢查 3000
netstat -ano | findstr ":3000" >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ 端口 3000 已被占用
    netstat -ano | findstr ":3000"
) else (
    echo ✅ 端口 3000 可用
)

echo.
echo ====================================
echo   推薦配置
echo ====================================
echo.
echo 如果 5432 和 6379 被占用，建議使用:
echo   PostgreSQL: 5433 (外部) → 5432 (容器內)
echo   Redis:      6380 (外部) → 6379 (容器內)
echo.
echo 在 docker-compose.yml 配置:
echo   postgres:
echo     ports: "5433:5432"
echo   redis:
echo     ports: "6380:6379"
echo.
pause