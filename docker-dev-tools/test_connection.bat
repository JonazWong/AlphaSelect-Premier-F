@echo off
chcp 65001 >nul
echo ====================================
echo   測試數據庫和 Redis 連接
echo ====================================
echo.

:: 讀取 .env 配置
if exist .env (
    for /f "tokens=1,2 delims==" %%a in (.env) do (
        if "%%a"=="POSTGRES_PORT" set POSTGRES_PORT=%%b
        if "%%a"=="REDIS_PORT" set REDIS_PORT=%%b
    )
)

:: 設置默認值
if not defined POSTGRES_PORT set POSTGRES_PORT=5433
if not defined REDIS_PORT set REDIS_PORT=6380

echo 配置:
echo   PostgreSQL 端口: %POSTGRES_PORT%
echo   Redis 端口: %REDIS_PORT%
echo.

:: 測試 PostgreSQL
echo [1/2] 測試 PostgreSQL 連接...
docker compose exec -T postgres pg_isready -U alphaselect_user >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL 運行正常
) else (
    echo ❌ PostgreSQL 連接失敗
)

:: 測試 Redis
echo.
echo [2/2] 測試 Redis 連接...
docker compose exec -T redis redis-cli ping >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Redis 運行正常
) else (
    echo ❌ Redis 連接失敗
)

echo.
echo ====================================
echo   Windows 本機連接資訊
echo ====================================
echo.
echo PostgreSQL:
echo   Host: localhost
echo   Port: %POSTGRES_PORT%
echo   Database: alphaselect
echo   User: alphaselect_user
echo   Password: (see .env file)
echo.
echo Redis:
echo   Host: localhost
echo   Port: %REDIS_PORT%
echo.
echo 使用 DBeaver 或 pgAdmin 連接 PostgreSQL
echo 使用 RedisInsight 連接 Redis
echo.
pause