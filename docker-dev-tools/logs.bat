@echo off
chcp 65001 >nul
echo ====================================
echo   選擇要查看的服務日誌
echo ====================================
echo.
echo 1. Backend
echo 2. Frontend
echo 3. PostgreSQL
echo 4. Redis
echo 5. Celery Worker
echo 6. 所有服務
echo.
set /p choice="請選擇 (1-6): "

if "%choice%"=="1" docker compose logs -f backend
if "%choice%"=="2" docker compose logs -f frontend
if "%choice%"=="3" docker compose logs -f postgres
if "%choice%"=="4" docker compose logs -f redis
if "%choice%"=="5" docker compose logs -f celery-worker
if "%choice%"=="6" docker compose logs -f

pause