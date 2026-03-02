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

:: 檢查 6379
netstat -ano | findstr ":6379" >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ 端口 6379 已被占用
    netstat -ano | findstr ":6379"
) else (
    echo ✅ 端口 6379 可用
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
echo 當前 docker-compose.yml 配置:
echo   PostgreSQL: 5432:5432
echo   Redis:      6379:6379
echo.
echo 如果端口被占用，請關閉佔用該端口的程式，或修改 docker-compose.yml 的映射端口。
echo.
pause